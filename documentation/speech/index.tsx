import { Button, Markdown, Navigation, Path, ProgressView, Script, ScrollView, useEffect, useState, VStack } from "scripting"
import { SpeechExample } from "./example"

export function SpeechDocumentation() {
  const [content, setContent] = useState<string>()

  useEffect(() => {
    (async () => {
      try {
        const content = await FileManager.readAsString(
          Path.join(
            Script.directory,
            "speech/README.md"
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
    navigationTitle={"Speech"}
    toolbar={{
      topBarTrailing: <Button
        title={"Example"}
        action={async () => {
          Navigation.present({
            element: <SpeechExample />,
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
