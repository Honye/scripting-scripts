import { Button, ScrollView, useEffect, useMemo, useState, VideoPlayer, VStack } from "scripting"

export function VideoPlayerExample() {
  const [status, setStatus] = useState<TimeControlStatus>(TimeControlStatus.paused)

  const player = useMemo(() => {
    const player = new AVPlayer()
    player.setSource("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")
    player.onTimeControlStatusChanged = (status) => {
      setStatus(status)
    }
    SharedAudioSession.setActive(true)
    SharedAudioSession.setCategory(
      'playback',
      ['mixWithOthers']
    )
    return player
  }, [])

  useEffect(() => {
    return () => {
      player.dispose()
    }
  }, [])

  return <ScrollView
    navigationTitle={"VideoPlayer"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <VStack>
      <VideoPlayer
        player={player}
        frame={{
          height: 300
        }}
      />
      <Button
        title={status === TimeControlStatus.paused
          ? "Play"
          : "Pause"
        }
        action={() => {
          if (status === TimeControlStatus.paused) {
            player.play()
          } else {
            player.pause()
          }
        }}
      />
    </VStack>
  </ScrollView>
}