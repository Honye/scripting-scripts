import { Button, Markdown, Navigation, Path, ProgressView, Script, ScrollView, useEffect, useState, VStack } from "scripting"
import { SpeechRecognitionExample } from "./example"

export function SpeechRecognitionDocumentation() {
  const [content, setContent] = useState<string>()

  useEffect(() => {
    (async () => {
      try {
        const content = await FileManager.readAsString(
          Path.join(
            Script.directory,
            "speech_recognition/README.md"
          )
        )
        setContent(content)
      } catch (e) {
        Dialog.alert({
          message: "Failed to load document content."
        })
      }
    })()
  }, [])

  return <ScrollView
    navigationTitle={"SpeechRecognition"}
    toolbar={{
      topBarTrailing: <Button
        title={"Example"}
        action={async () => {
          Navigation.present({
            element: <SpeechRecognitionExample />,
            modalPresentationStyle: 'pageSheet',
          })
        }}
      />
    }}
  >
    <VStack
      padding
    >
      {
        content != null
          ? <Markdown
            content={content}
          />
          : <ProgressView
            progressViewStyle={"circular"}
          />
      }
    </VStack>
  </ScrollView>
}
