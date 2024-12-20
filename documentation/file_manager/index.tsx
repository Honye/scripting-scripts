import { Button, Markdown, Navigation, Path, ProgressView, Script, ScrollView, useEffect, useState, VStack } from "scripting"
import { FileManagerExample } from "./example"


export function FileManagerDocumentation() {
  const [content, setContent] = useState<string>()

  useEffect(() => {
    (async () => {
      try {
        const content = await FileManager.readAsString(
          Path.join(
            Script.directory,
            "file_manager/README.md"
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
    navigationTitle={"FileManager"}
    toolbar={{
      topBarTrailing: <Button
        title={"Example"}
        action={() => {
          Navigation.present({
            element: <FileManagerExample />,
            modalPresentationStyle: "pageSheet"
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

