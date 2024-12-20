import { useState, useEffect, Path, Script, ScrollView, Button, Navigation, VStack, Markdown, ProgressView } from "scripting"
import { DocumentPickerExample } from "./example"

export function DocumentPickerDocumentation() {
  const [content, setContent] = useState<string>()

  useEffect(() => {
    (async () => {
      try {
        const content = await FileManager.readAsString(
          Path.join(
            Script.directory,
            "document_picker/README.md"
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
    navigationTitle={"DocumentPicker"}
    toolbar={{
      topBarTrailing: <Button
        title={"Example"}
        action={() => {
          Navigation.present({
            element: <DocumentPickerExample />,
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