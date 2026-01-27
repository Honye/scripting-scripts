import {
  useState,
  useEffect,
  VStack,
  Text,
  ScrollView,
  HStack,
  ProgressView,
  Button,
  VideoPlayer,
  useMemo
} from "scripting"
import { API } from "../api"
import { VideoDetail, Episode } from "../models"

export function DetailView({ id }: { id: number }) {
  const [detail, setDetail] = useState<VideoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)

  const player = useMemo(() => new AVPlayer(), [])

  useEffect(() => {
    API.getDetail(id).then(data => {
      setDetail(data)
      setLoading(false)
      if (data && data.playList.length > 0 && data.playList[0].urls.length > 0) {
        setCurrentEpisode(data.playList[0].urls[0])
      }
    })

    return () => {
      player.pause()
    }
  }, [id])

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
    <ScrollView>
      <VStack spacing={16}>
        {/* Video Player Area */}
        {player ? (
        <VideoPlayer
          player={player}
          frame={{ height: 240 }}
        />
        ) : <ProgressView />}

        {/* Title and Stats */}
        <VStack alignment="leading" padding={16} spacing={8}>
           <Text font="title2" bold>{detail.name}</Text>
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
                   action={() => setSelectedGroupIndex(idx)}
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
          <Text font="headline" padding={{ bottom: 8 }}>Episodes</Text>
          <ScrollView axes="horizontal" scrollIndicator="hidden">
             <HStack spacing={12}>
                {currentGroup?.urls.map((ep) => (
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
                    >
                      {ep.name}
                    </Text>
                  </Button>
                ))}
            </HStack>
          </ScrollView>
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
  )
}
