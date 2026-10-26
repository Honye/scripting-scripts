import { AbortController, AppEvents, AVPlayerView, Button, HStack, Text, VStack, useEffect, useObservable, useState } from 'scripting'
import type { PIPStatus, ScenePhase } from 'scripting'
import type { DramaDetail, Episode, MediaSource, MediaVariant } from '../types'
import { providerFor } from '../hongguo'
import { Loading, Notice } from '../components'
import { errorMessage } from '../parse'
import { PlaybackRecovery } from '../playback_routes'
import { prepareMedia } from '../prepare_media'
import type { PreparedMedia } from '../prepare_media'
import { library, saveProgress } from '../store'
import { theme } from '../theme'

export function PlayerView({ detail, episode, onNext, onClose }: {
  detail: DramaDetail
  episode: Episode
  onNext: (episode: Episode) => void
  onClose: () => void
}) {
  const [player, setPlayer] = useState<AVPlayer | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('正在准备播放…')
  const [route, setRoute] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const pipStatus = useObservable<PIPStatus>(null)

  useEffect(() => {
    const request = new AbortController()
    const recovery = new PlaybackRecovery()
    const provider = providerFor(detail.drama)
    const saved = library().history.find(item => item.drama.id === detail.drama.id && item.episodeId === episode.id)
    let resume = saved && (!saved.duration || saved.position < saved.duration - 2) ? saved.position : 0
    let active: AVPlayer | null = null
    let prepared: PreparedMedia | null = null
    let variants: MediaVariant[] = []
    let routeIndex = 0
    let generation = 0
    let ready = false
    let opening = false
    let stopped = false
    let foreground = true
    let lastPosition = 0
    let lastProgress = Date.now()
    let saveErrorReported = false
    let deadline: ReturnType<typeof setTimeout> | undefined
    let errorTimer: ReturnType<typeof setTimeout> | undefined
    setPlayer(null)
    setLoading(true)
    setMessage('正在准备播放…')
    setError('')
    setRoute('')

    function save(ended = false) {
      if (!ready || !active || request.signal.aborted) return
      try {
        saveProgress(detail.drama, episode, ended && active.duration > 0 ? active.duration : active.currentTime, active.duration)
      } catch (error) {
        if (!saveErrorReported) { saveErrorReported = true; void Dialog.alert(errorMessage(error)) }
      }
    }

    function stopNative() {
      clearTimeout(deadline)
      ready = false
      if (!active) return
      active.onReadyToPlay = undefined
      active.onEnded = undefined
      active.onError = undefined
      active.pause()
      active.dispose()
      active = null
    }

    async function releaseMedia() {
      const previous = prepared
      prepared = null
      if (previous) await previous.release().catch(() => {})
    }

    function terminal(message: string) {
      if (request.signal.aborted) return
      save()
      stopped = true
      stopNative()
      void releaseMedia()
      setPlayer(null)
      setLoading(false)
      setError(message)
    }

    function scheduleRecovery(message: string) {
      if (request.signal.aborted || stopped || errorTimer) return
      const position = active?.currentTime || 0
      const ticket = generation
      errorTimer = setTimeout(() => {
        errorTimer = undefined
        if (request.signal.aborted || stopped || ticket !== generation) return
        if (ready && active && active.timeControlStatus === TimeControlStatus.playing && active.currentTime > position + 0.3) return
        void recover(message)
      }, 900)
    }

    async function install(media: MediaVariant) {
      opening = true
      const ticket = ++generation
      stopNative()
      setPlayer(null)
      await releaseMedia()
      if (request.signal.aborted) { opening = false; return }
      setLoading(true)
      setError('')
      setRoute(`线路 ${routeIndex + 1}/${variants.length}${media.quality ? ` · ${media.quality}P` : ''}`)
      try {
        const result = await prepareMedia(media, request.signal, value => {
          if (!request.signal.aborted && ticket === generation) setMessage(value)
        })
        if (request.signal.aborted || ticket !== generation) { await result.release(); return }
        prepared = result
        const native = new AVPlayer()
        active = native
        setPlayer(native)
        native.onReadyToPlay = () => {
          if (request.signal.aborted || ticket !== generation || ready || stopped) return
          clearTimeout(deadline)
          if (resume > 0 && (!native.duration || resume < native.duration - 0.1)) native.currentTime = resume
          ready = true
          lastPosition = native.currentTime
          lastProgress = Date.now()
          setLoading(false)
          if (!native.play(library().preferences.rate)) scheduleRecovery('播放器未能开始播放')
        }
        native.onError = value => scheduleRecovery(`播放失败：${value}`)
        native.onEnded = () => {
          if (request.signal.aborted || ticket !== generation || stopped) return
          save(true)
          const next = detail.episodes.find(item => item.number === episode.number + 1)
          if (next && library().preferences.autoNext) onNext(next)
        }
        SharedAudioSession.setCategory('playback', [])
        SharedAudioSession.setActive(true)
        deadline = setTimeout(() => scheduleRecovery('视频加载超时'), 20000)
        if (!native.setSource(result.url, { headers: result.headers })) scheduleRecovery('播放器无法打开该线路')
      } catch (error) {
        if (!request.signal.aborted) scheduleRecovery(errorMessage(error))
      } finally {
        opening = false
      }
    }

    function selectPlan(plan: MediaSource) {
      variants = [plan, ...(plan.alternatives || [])]
      routeIndex = 0
    }

    async function recover(failure: string) {
      if (request.signal.aborted || stopped || opening) return
      save()
      if (active && active.currentTime > 0) resume = active.currentTime
      const action = recovery.next(routeIndex + 1 < variants.length)
      if (action === 'stop') {
        terminal(`自动恢复未成功，请检查网络后重试，也可换一集。${failure}`)
        return
      }
      setLoading(true)
      if (action === 'alternative') {
        setMessage('正在切换备用线路…')
        routeIndex++
        await install(variants[routeIndex])
      } else {
        setMessage('正在重新获取播放地址…')
        opening = true
        stopNative()
        setPlayer(null)
        try {
          const plan = await provider.resolve(detail.drama, episode, request.signal)
          if (request.signal.aborted) return
          selectPlan(plan)
          await install(variants[0])
        } catch (error) {
          terminal(errorMessage(error))
        } finally { opening = false }
      }
    }

    const sceneChanged = (phase: ScenePhase) => {
      foreground = phase === 'active'
      lastProgress = Date.now()
      if (!foreground) save()
    }
    AppEvents.scenePhase.addListener(sceneChanged)
    const saveTimer = setInterval(() => save(), 5000)
    const healthTimer = setInterval(() => {
      if (!ready || !active || stopped || opening) return
      const position = active.currentTime
      const now = Date.now()
      if (!foreground || active.timeControlStatus === TimeControlStatus.paused || position !== lastPosition) {
        lastPosition = position
        lastProgress = now
      } else if (now - lastProgress >= 20000) scheduleRecovery('视频缓冲停滞')
    }, 1000)
    void (async () => {
      try {
        const plan = await provider.resolve(detail.drama, episode, request.signal)
        if (request.signal.aborted) return
        selectPlan(plan)
        await install(variants[0])
      } catch (error) { terminal(errorMessage(error)) }
    })()

    return () => {
      save()
      request.abort()
      stopped = true
      generation++
      clearInterval(saveTimer)
      clearInterval(healthTimer)
      clearTimeout(errorTimer)
      AppEvents.scenePhase.removeListener(sceneChanged)
      stopNative()
      void releaseMedia()
      SharedAudioSession.setActive(false)
    }
  }, [detail.drama.id, episode.id, attempt])

  return (
    <VStack spacing={12} padding={16} background={theme.card} clipShape={{ type: 'rect', cornerRadius: 20 }}>
      <HStack>
        <Text font="headline">{episode.title}</Text>
        <Button title="关闭播放器" systemImage="xmark.circle" labelStyle="iconOnly" action={onClose} frame={{ maxWidth: 'infinity', alignment: 'trailing' }} />
      </HStack>
      {player ? <AVPlayerView player={player} pipStatus={pipStatus} allowsPictureInPicturePlayback
        canStartPictureInPictureAutomaticallyFromInline frame={{ height: 230 }}
        background="black" clipShape={{ type: 'rect', cornerRadius: 12 }} /> : null}
      {route ? <Text font="caption" foregroundStyle={theme.secondary}>{route}</Text> : null}
      {loading ? <Loading title={message} /> : null}
      {error ? <Notice message={error} retry={() => setAttempt(value => value + 1)} /> : null}
      <HStack spacing={14}>
        <Button title="上一集" action={() => {
          const previous = detail.episodes.find(item => item.number === episode.number - 1)
          if (previous) onNext(previous)
        }} disabled={episode.number <= 1} />
        <Button title="重新取流" action={() => setAttempt(value => value + 1)} disabled={loading} />
        <Button title="下一集" action={() => {
          const next = detail.episodes.find(item => item.number === episode.number + 1)
          if (next) onNext(next)
        }} disabled={episode.number >= detail.episodes.length} />
      </HStack>
    </VStack>
  )
}
