import { useState, useEffect, Path, Script, ScrollView, VStack, Markdown, ProgressView } from "scripting"

export function DataAndUIImageDocumentation() {
  const [content, setContent] = useState<string>()

  useEffect(() => {
    (async () => {
      try {
        const content = await FileManager.readAsString(
          Path.join(
            Script.directory,
            "data_and_uiimage/README.md"
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
    navigationTitle={"Data and UIImage"}
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