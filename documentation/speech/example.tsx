import { Button, Navigation, NavigationStack, Path, ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function SpeechExample() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle={"Speech Example"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        topBarLeading: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
    >
      <VStack>
        <APIExample
          title={"Speak a text"}
          subtitle={""}
          code={`await SharedAudioSession.setActive(true)
await SharedAudioSession.setCategory('playback', ['mixWithOthers'])
Speech.addListener('finish', () => {
  console.log("Speak completed!")
})
await Speech.speak('Hi there, welcome to Scripting! I wish this app is helpful to you.', {
  voiceLanguage: 'en-US',
})`}
          run={async log => {
            if (await Speech.isSpeaking) {
              await Speech.stop('immediate')
              log("Stopped.")
              return
            }

            await SharedAudioSession.setActive(true)
            await SharedAudioSession.setCategory('playback', ['mixWithOthers'])

            const listener = () => {
              log("Speak completed!")
              Speech.removeListener('finish', listener)
            }

            Speech.addListener('finish', listener)

            await Speech.speak('Hi there, welcome to Scripting! I wish this app is helpful to you.', {
              voiceLanguage: 'en-US',
            })

            log("Started, tap the run button to stop.")
          }}
        />
        <APIExample
          title={"synthesize to File"}
          subtitle={""}
          code={`const filePath = Path.join(FileManager.documentsDirectory, 'greeting.caf')

Speech.addListener('finish', () => {
  if (FileManager.existsSync(filePath)) {
    console.log("Audio file is saved to " + filePath + ". Start to play it.")

    let player = new AVPlayer()
    player.setSource(filePath)
    player.onReadyToPlay = () => {
      player.play()
    }
    player.onEnded = () => {
      player.dispose()
    }
  } else {
    console.log("Failed to save audio file.")
  }
})

await Speech.synthesizeToFile(
  'Hi there, welcome to Scripting! I wish this app is helpful to you.',
  filePath, {
  voiceLanguage: 'en-US'
})`}
          run={async log => {
            const filePath = Path.join(FileManager.documentsDirectory, 'greeting.caf')
            const listener = () => {
              if (FileManager.existsSync(filePath)) {
                log("Audio file is saved to " + filePath + ". Start to play it.")

                let player = new AVPlayer()
                player.setSource(filePath)
                player.onReadyToPlay = () => {
                  player.play()
                }
                player.onEnded = () => {
                  player.dispose()
                }
              } else {
                log("Failed to save audio file.")
              }
              Speech.removeListener('finish', listener)
            }

            Speech.addListener('finish', listener)

            await Speech.synthesizeToFile(
              'Hi there, welcome to Scripting! I wish this app is helpful to you.',
              filePath, {
              voiceLanguage: 'en-US',
            })
          }}
        />
      </VStack>
    </ScrollView>
  </NavigationStack>
}