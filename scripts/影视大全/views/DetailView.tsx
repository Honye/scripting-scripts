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

export function DetailView({ id }: { id: number }) {
  const [detail, setDetail] = useState<VideoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [episodeRangeIndex, setEpisodeRangeIndex] = useState(0)

  const [player, setPlayer] = useState<AVPlayer | null>(null)
  const pipStatus = useObservable<PIPStatus>(null)
  const [isFavorited, setIsFavorited] = useState(false)

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
    API.getDetail(id).then(data => {
      setDetail(data)
      setLoading(false)
      if (data && data.playList.length > 0 && data.playList[0].urls.length > 0) {
        setCurrentEpisode(data.playList[0].urls[0])
      }
    })

    return () => {
      player?.pause()
    }
  }, [id, player])

  useEffect(() => {
    if (player && currentEpisode) {
      player.setSource(currentEpisode.url)
      player.play()
    }
  }, [currentEpisode, player])

  if (loading) {
    return <ProgressView />
  }

  if (!detail) {
    return <Text>Failed to load video detail.</Text>
  }

  const currentGroup = detail.playList[selectedGroupIndex]

  return (
    <VStack spacing={0}>
        {/* Video Player Area */}
        {player ? (
        <AVPlayerView
          player={player}
          pipStatus={pipStatus}
          frame={{ height: 240 }}
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
                 DB.addFavorite(detail)
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
                     background={selectedGroupIndex === idx ? "blue" : "#f0f0f0"}
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
            <Text font="headline">Episodes</Text>
            <Spacer />
            <Button action={() => setIsExpanded(prev => !prev)}>
              <Text foregroundStyle="secondaryLabel" font="subheadline">
                {isExpanded ? "Collapse" : "Expand"}
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
                                  background={episodeRangeIndex === idx ? "#f0f0f0" : "clear"}
                                  foregroundStyle={episodeRangeIndex === idx ? "label" : "secondaryLabel"}
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
                           background={currentEpisode?.url === ep.url ? "blue" : "#f0f0f0"}
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
                               background={currentEpisode?.url === ep.url ? "blue" : "#f0f0f0"}
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
          <Text>Director: {detail.director}</Text>
          <Text>Actor: {detail.actor}</Text>

          <Text font="headline" padding={{ top: 16 }}>Description</Text>
          <Text>{detail.content}</Text>
        </VStack>

      </VStack>
    </ScrollView>
    </VStack>
  )
}
