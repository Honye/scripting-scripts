import { Markdown, Path, ProgressView, Script, ScrollView, useEffect, useState, VStack } from "scripting"

export function AudioRecorderDocumentation() {
  const [content, setContent] = useState<string>()

  useEffect(() => {
    (async () => {
      try {
        const content = await FileManager.readAsString(
          Path.join(
            Script.directory,
            "audio_recorder/README.md"
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
    navigationTitle={"AudioRecorder"}
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