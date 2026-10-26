import { AbortController, Button, HStack, LazyVGrid, Menu, Picker, ScrollView, Spacer, Text, TextField, VStack, useEffect, useState } from 'scripting'
import type { Drama, DramaDetail, Episode, WatchStatus } from '../types'
import { providerFor } from '../hongguo'
import { Loading, Notice, perform, Poster } from '../components'
import { errorMessage } from '../parse'
import { setFollow, statusNames, timeLabel, updateMetadata, useLibrary } from '../store'
import { theme } from '../theme'
import { PlayerView } from './Player'

export function DetailView({ initial }: { initial: Drama }) {
  const state = useLibrary()
  const [detail, setDetail] = useState<DramaDetail | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const [selected, setSelected] = useState<Episode | null>(null)
  const [range, setRange] = useState(0)
  const [jump, setJump] = useState('')
  const [expanded, setExpanded] = useState(false)
  const drama = detail?.drama || initial
  const follow = state.follows.find(item => item.drama.id === drama.id)
  const history = state.history.find(item => item.drama.id === drama.id)
  const resume = detail?.episodes.find(item => item.id === history?.episodeId) || detail?.episodes[0]

  useEffect(() => {
    const request = new AbortController()
    setLoading(true)
    setError('')
    providerFor(initial).detail(initial, request.signal).then(value => {
      if (request.signal.aborted) return
      setDetail(value)
      const saved = state.history.find(item => item.drama.id === initial.id)
      const episode = value.episodes.find(item => item.id === saved?.episodeId)
      setRange(episode ? Math.floor((episode.number - 1) / 50) : 0)
      updateMetadata(value.drama)
    }).catch(error => {
      if (!request.signal.aborted) setError(errorMessage(error))
    }).finally(() => { if (!request.signal.aborted) setLoading(false) })
    return () => request.abort()
  }, [initial.id, revision])

  function play(episode: Episode) {
    setRange(Math.floor((episode.number - 1) / 50))
    setSelected(episode)
  }

  const ranges = detail ? Array.from({ length: Math.ceil(detail.episodes.length / 50) }, (_, index) => ({
    value: index, title: `${index * 50 + 1}–${Math.min(detail.episodes.length, (index + 1) * 50)} 集`
  })) : []

  return (
    <ScrollView navigationTitle={drama.title} navigationBarTitleDisplayMode="inline" background={theme.background}>
      <VStack alignment="leading" spacing={18} padding={16}>
        <HStack alignment="top" spacing={16}>
          <Poster drama={drama} width={90} />
          <VStack alignment="leading" spacing={10}>
            <Text font="title2" fontWeight="bold" foregroundStyle={theme.text}>{drama.title}</Text>
            <Text font="subheadline" foregroundStyle={theme.secondary}>{drama.category} · {drama.remark || '红果短剧'}</Text>
            {drama.tags.length ? <Text font="caption" foregroundStyle={theme.secondary} lineLimit={2}>{drama.tags.join(' / ')}</Text> : null}
            <Menu title={follow ? statusNames[follow.status] : '加入追剧'} systemImage={follow ? 'heart.fill' : 'heart'}>
              {Object.entries(statusNames).map(([value, title]) => <Button key={value} title={title} action={() => perform(() => setFollow(drama, value as WatchStatus))} />)}
              {follow ? <Button title="取消追剧" role="destructive" action={() => perform(() => setFollow(drama, null))} /> : null}
            </Menu>
          </VStack>
          <Spacer minLength={0} />
        </HStack>
        {selected && detail ? <PlayerView key={`${drama.id}:${selected.id}`} detail={detail} episode={selected} onNext={play} onClose={() => setSelected(null)} /> : null}
        {!selected ? <HStack spacing={12}>
          <Button title={history && resume?.id === history.episodeId ? `继续第 ${resume.number} 集` : '立即播放'} systemImage="play.fill"
            buttonStyle="borderedProminent" disabled={!resume} action={() => { if (resume) play(resume) }} />
        </HStack> : null}
        {history && resume?.id === history.episodeId ? <Text font="caption" foregroundStyle={theme.secondary}>上次看到第 {history.episodeNumber} 集 · {timeLabel(history.position)}</Text> : null}
        {loading ? <Loading title="正在获取完整分集…" /> : null}
        {error ? <Notice message={error} retry={() => setRevision(value => value + 1)} /> : null}
        {detail ? <VStack alignment="leading" spacing={14} padding={16} background={theme.card} clipShape={{ type: 'rect', cornerRadius: 18 }}>
          <HStack><Text font="headline">选集</Text><Spacer /><Text font="caption" foregroundStyle={theme.secondary}>共 {detail.episodes.length} 集</Text></HStack>
          {ranges.length > 1 ? <Picker title="集数范围" value={range} onChanged={setRange}>
            {ranges.map(item => <Text key={item.value} tag={item.value}>{item.title}</Text>)}
          </Picker> : null}
          <HStack>
            <TextField title="输入集数" value={jump} onChanged={setJump} keyboardType="numberPad" />
            <Button title="跳转播放" action={() => perform(() => {
              const number = Number(jump.trim())
              const episode = detail.episodes.find(item => item.number === number)
              if (!episode) throw new Error(`请输入 1–${detail.episodes.length} 之间的集数`)
              play(episode)
            })} />
          </HStack>
          <LazyVGrid columns={[{ size: { type: 'adaptive', min: 62 }, spacing: 8 }]} spacing={8}>
            {detail.episodes.slice(range * 50, (range + 1) * 50).map(episode => (
              <Button key={episode.id} action={() => play(episode)} buttonStyle="plain">
                <Text font="subheadline" fontWeight={selected?.id === episode.id ? 'bold' : 'regular'}
                  foregroundStyle={selected?.id === episode.id ? 'white' : theme.text}
                  padding={12} frame={{ maxWidth: 'infinity' }} background={selected?.id === episode.id ? theme.accent : theme.soft}
                  clipShape={{ type: 'rect', cornerRadius: 10 }}>{episode.number}</Text>
              </Button>
            ))}
          </LazyVGrid>
        </VStack> : null}
        <VStack alignment="leading" spacing={10} padding={16} background={theme.card} clipShape={{ type: 'rect', cornerRadius: 18 }}>
          <HStack><Text font="headline">剧情简介</Text><Spacer /><Button title={expanded ? '收起' : '展开'} action={() => setExpanded(value => !value)} /></HStack>
          <Text font="subheadline" foregroundStyle={theme.secondary} lineLimit={expanded ? undefined : 4}>{drama.description || '暂无简介'}</Text>
        </VStack>
        <Text font="caption2" foregroundStyle={theme.secondary}>播放进度自动保存。线路失败时会自动切换备用地址并尝试重新取流。</Text>
      </VStack>
    </ScrollView>
  )
}
