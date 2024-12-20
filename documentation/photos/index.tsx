import { Button, Markdown, Navigation, Path, ProgressView, Script, ScrollView, useEffect, useState, VStack } from "scripting"
import { PhotosExample } from "./example"

export function PhotosDocumentation() {
  const [content, setContent] = useState<string>()

  useEffect(() => {
    (async () => {
      try {
        const content = await FileManager.readAsString(
          Path.join(
            Script.directory,
            "photos/README.md"
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
    navigationTitle={"Photos"}
    toolbar={{
      topBarTrailing: <Button
        title={"Example"}
        action={() => {
          Navigation.present({
            element: <PhotosExample />,
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

