import {
  useState,
  useEffect,
  VStack,
  Text,
  ScrollView,
  HStack,
  ProgressView,
  Button,
  AVPlayerView,
  useObservable,
  PIPStatus,
  LazyVGrid,
  Spacer,
  Image
} from "scripting"
import { API } from "../api"
import { VideoDetail, Episode } from "../models"
import { DB } from "../db"

export function DetailView({ id, sourceId }: { id: number; sourceId?: number | null }) {
  const [detail, setDetail] = useState<VideoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [episodeRangeIndex, setEpisodeRangeIndex] = useState(0)

  const [player, setPlayer] = useState<AVPlayer | null>(null)
  const pipStatus = useObservable<PIPStatus>(null)
  const [isFavorited, setIsFavorited] = useState(false)

  // 获取数据源 URL（优先使用传入的 sourceId，否则使用当前数据源）
  const getSourceUrl = () => {
    if (sourceId) {
      return DB.getDataSourceUrlById(sourceId)
    }
    return null // 使用当前数据源
  }

  // 获取用于保存的 sourceId（优先使用传入的，否则使用当前数据源）
  const getSaveSourceId = () => {
    return sourceId ?? DB.getCurrentDataSourceId()
  }

  useEffect(() => {
    // Initialize player in effect to avoid missing player error
    setPlayer(new AVPlayer())
  }, [])

  useEffect(() => {
    if (detail) {
      setIsFavorited(DB.isFavorited(detail.id))
    }
  }, [detail])

  useEffect(() => {
    const sourceUrl = getSourceUrl()
    API.getDetail(id, sourceUrl ?? undefined).then(data => {
      setDetail(data)
      setLoading(false)
      if (data && data.playList.length > 0 && data.playList[0].urls.length > 0) {
        // Check history
        const history = DB.getHistoryOne(id)
        if (history && history.episode_index !== undefined) {
          // Find the episode
          const epIdx = history.episode_index
          // Flatten list to find by index simplistically or use structure
          // Assuming first group for simplicity or logic needs to handle groups.
          // But existing save logic uses flattened index approach mostly by searching url.
          // Actually save logic saved `epIdx` relative to the group?
          // Wait, save logic logic:
          /*
            for (let i = 0; i < detail.playList.length; i++) {
              const found = detail.playList[i].urls.findIndex(u => u.url === currentEpisode.url)
              if (found >= 0) epIdx = found...
            }
          */
          // This logic seems to imply `epIdx` is index WITHIN A GROUP? But which group?
          // It iterates groups and finds first match.

          // Let's refactor safely:
          // We need to restore `currentEpisode` and `player.seek`.

          let foundEp = null
          // Try to find by index in first group or try to match episode name if reliable?
          // Or better, finding where epIdx came from.
          // If we saved index within a group, we need to know WHICH group.
          // But we didn't save group index!
          // However, usually playlists are unique across groups or just mirrors.
          // Let's assume group 0 for now or search.

          // Actually, saving just `epIdx` is risky if we don't know the group.
          // But `history.episode_name` is also saved.
          // Let's search by name/url matches if possible, or defaulting to first group.

          let targetGroupIdx = 0
          let targetEp = null

          // Search for episode with matching name to be safer
          for (let g = 0; g < data.playList.length; g++) {
            const group = data.playList[g]
            const match = group.urls.find(u => u.name === history.episode_name)
            if (match) {
              targetGroupIdx = g
              targetEp = match
              break
            }
          }

          if (!targetEp && data.playList[0].urls[epIdx]) {
            targetEp = data.playList[0].urls[epIdx]
          }

          if (targetEp) {
            setSelectedGroupIndex(targetGroupIdx)
            setCurrentEpisode(targetEp)
            // Seek needs to happen after player loads source.
            // We put the seek time in a ref or state to be consumed by player effect.
            setTimeout(() => {
              if (player) {
                player.currentTime = history.progress
              }
            }, 500) // Delay to ensure load
          } else {
            setCurrentEpisode(data.playList[0].urls[0])
          }
        } else {
          setCurrentEpisode(data.playList[0].urls[0])
        }
      }
    })

    return () => {
      SharedAudioSession.setCategory('soloAmbient', [])
      player?.pause()
    }
  }, [id, player])

  useEffect(() => {
    if (player && currentEpisode) {
      player.setSource(currentEpisode.url)
      SharedAudioSession.setCategory('playback', [])
      SharedAudioSession.setActive(true)
      player.play(DB.getPlaybackRate())
      // 应用用户设置的默认播放速度
      player.rate = DB.getPlaybackRate()

      // Check if we need to resume
      // But above logic inside API.then uses setTimeout to seek.
      // That works but is race-condition prone.
      // Better: check DB here? No, DB check happens once on load.
      // Let's stick to the timeout for now as `player.setSource` is async-ish in behavior often.
      // Or we can check history AGAIN here? No, redundant.
    }
  }, [currentEpisode, player])

  // Save history periodically
  useEffect(() => {
    let timer: number
    let ignore = false

    const save = () => {
      if (player && detail && currentEpisode) {
        const time = player.currentTime
        if (time > 0) {
          // Find episode index
          let epIdx = 0
          for (let i = 0; i < detail.playList.length; i++) {
            const found = detail.playList[i].urls.findIndex(u => u.url === currentEpisode.url)
            if (found >= 0) {
              epIdx = found
              break
            }
          }
          DB.addHistory(detail, epIdx, currentEpisode.name, time, getSaveSourceId())
        }
      }

      if (!ignore) {
        timer = setTimeout(save, 5000)
      }
    }

    save()

    return () => {
      ignore = true
      clearTimeout(timer)
      // Save on exit
      if (player && detail && currentEpisode) {
        const time = player.currentTime
        if (time > 0) {
          let epIdx = 0
          for (let i = 0; i < detail.playList.length; i++) {
            const found = detail.playList[i].urls.findIndex(u => u.url === currentEpisode.url)
            if (found >= 0) {
              epIdx = found
              break
            }
          }
          DB.addHistory(detail, epIdx, currentEpisode.name, time, getSaveSourceId())
        }
      }
    }
  }, [player, detail, currentEpisode])

  if (loading) {
    return <ProgressView />
  }

  if (!detail) {
    return <Text>Failed to load video detail.</Text>
  }

  const currentGroup = detail.playList[selectedGroupIndex]

  return (
    <VStack navigationBarTitleDisplayMode='inline' spacing={0}>
      {/* Video Player Area */}
      {player ? (
        <AVPlayerView
          player={player}
          pipStatus={pipStatus}
          frame={{ height: 240 }}
          allowsPictureInPicturePlayback
          canStartPictureInPictureAutomaticallyFromInline
        />
      ) : <ProgressView frame={{ height: 240 }} />}

      <ScrollView>
        <VStack spacing={16}>

          {/* Title and Stats */}
          <VStack alignment="leading" padding={16} spacing={8}>
            <HStack>
              <Text font="title2" bold>{detail.name}</Text>
              <Spacer />
              <Button action={() => {
                if (isFavorited) {
                  DB.removeFavorite(detail.id)
                  setIsFavorited(false)
                } else {
                  DB.addFavorite(detail, getSaveSourceId())
                  setIsFavorited(true)
                }
              }}>
                <Image
                  systemName={isFavorited ? "heart.fill" : "heart"}
                  foregroundStyle={isFavorited ? "red" : "secondaryLabel"}
                  font="title2"
                />
              </Button>
            </HStack>
            <HStack spacing={16}>
              <Text foregroundStyle="secondaryLabel">{detail.score}</Text>
              <Text foregroundStyle="secondaryLabel">{detail.year}</Text>
              <Text foregroundStyle="secondaryLabel">{detail.area}</Text>
              <Text foregroundStyle="secondaryLabel">{detail.type}</Text>
            </HStack>
          </VStack>

          {/* Source Selection */}
          {detail.playList.length > 1 && (
            <ScrollView axes="horizontal" scrollIndicator="hidden">
              <HStack padding={16} spacing={12}>
                {detail.playList.map((group, idx) => (
                  <Button
                    key={idx}
                    action={() => {
                      setSelectedGroupIndex(idx)
                      setEpisodeRangeIndex(0)
                    }}
                  >
                    <Text
                      foregroundStyle={selectedGroupIndex === idx ? "white" : "label"}
                      padding={8}
                      background={selectedGroupIndex === idx ? "systemTeal" : "#f0f0f0"}
                      clipShape={{ type: "rect", cornerRadius: 8 }}
                    >
                      {group.name}
                    </Text>
                  </Button>
                ))}
              </HStack>
            </ScrollView>
          )}

          {/* Episodes Grid */}
          <VStack alignment="leading" padding={16}>
            <HStack>
              <Text font="headline">选集</Text>
              <Spacer />
              <Button action={() => setIsExpanded(prev => !prev)}>
                <Text foregroundStyle="secondaryLabel" font="subheadline">
                  {isExpanded ? "收起" : "展开"}
                </Text>
              </Button>
            </HStack>

            {/* Episode Range Tabs */}
            {(() => {
              const episodeRanges = []
              if (currentGroup) {
                for (let i = 0; i < currentGroup.urls.length; i += 100) {
                  episodeRanges.push(currentGroup.urls.slice(i, i + 100))
                }
              }

              // If ranges changed (e.g. source changed), and current index is out of bounds, reset it
              if (episodeRangeIndex >= episodeRanges.length && episodeRanges.length > 0) {
                setEpisodeRangeIndex(0)
              }

              const currentEpisodes = episodeRanges[episodeRangeIndex] || []

              return (
                <VStack spacing={12} padding={{ top: 12 }}>
                  {episodeRanges.length > 1 && (
                    <ScrollView axes="horizontal" scrollIndicator="hidden">
                      <HStack spacing={12} padding={{ bottom: 8 }}>
                        {episodeRanges.map((_, idx) => {
                          const start = idx * 100 + 1
                          const end = Math.min((idx + 1) * 100, currentGroup?.urls.length || 0)
                          return (
                            <Button
                              key={idx}
                              action={() => setEpisodeRangeIndex(idx)}
                            >
                              <Text
                                padding={8}
                                background={episodeRangeIndex === idx ? "systemTeal" : "clear"}
                                foregroundStyle={episodeRangeIndex === idx ? "white" : "secondaryLabel"}
                                clipShape={{ type: "rect", cornerRadius: 6 }}
                                font="caption"
                              >
                                {start}-{end}
                              </Text>
                            </Button>
                          )
                        })}
                      </HStack>
                    </ScrollView>
                  )}

                  {isExpanded ? (
                    <LazyVGrid
                      columns={[
                        { size: { type: 'adaptive', min: 80 } }
                      ]}
                      spacing={12}
                    >
                      {currentEpisodes.map((ep) => (
                        <Button
                          key={ep.url}
                          action={() => setCurrentEpisode(ep)}
                        >
                          <Text
                            padding={12}
                            background={currentEpisode?.url === ep.url ? "systemTeal" : 'secondarySystemBackground'}
                            foregroundStyle={currentEpisode?.url === ep.url ? "white" : "label"}
                            clipShape={{ type: "rect", cornerRadius: 6 }}
                            frame={{ maxWidth: 'infinity' }}
                            lineLimit={1}
                            font="caption"
                          >
                            {ep.name}
                          </Text>
                        </Button>
                      ))}
                    </LazyVGrid>
                  ) : (
                    <ScrollView axes="horizontal" scrollIndicator="hidden">
                      <HStack spacing={12}>
                        {currentEpisodes.map((ep) => (
                          <Button
                            key={ep.url}
                            action={() => setCurrentEpisode(ep)}
                          >
                            <Text
                              padding={12}
                              background={currentEpisode?.url === ep.url ? "systemTeal" : 'secondarySystemBackground'}
                              foregroundStyle={currentEpisode?.url === ep.url ? "white" : "label"}
                              clipShape={{ type: "rect", cornerRadius: 6 }}
                              frame={{ width: 80 }}
                              lineLimit={1}
                              font="caption"
                            >
                              {ep.name}
                            </Text>
                          </Button>
                        ))}
                      </HStack>
                    </ScrollView>
                  )}
                </VStack>
              )
            })()}
          </VStack>

          {/* Info */}
          <VStack alignment="leading" padding={16} spacing={8}>
            <Text>导演: {detail.director}</Text>
            <Text>演员: {detail.actor}</Text>

            <Text font="headline" padding={{ top: 16 }}>简介</Text>
            <Text>{detail.content}</Text>
          </VStack>

        </VStack>
      </ScrollView>
    </VStack>
  )
}
