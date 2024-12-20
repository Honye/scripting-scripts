import { Button, Navigation, NavigationStack, ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function DocumentPickerExample() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle={"DocumentPicker"}
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
          title={"DocumentPicker.pickFiles"}
          subtitle={"Pick files from documents."}
          code={`const result = await DocumentPicker.pickFiles({
  shouldShowFileExtensions: true,
  allowsMultipleSelection: true,
})

if (result.length > 0) {
  console.log("Picked files:\\n" + JSON.stringify(result))
} else {
  console.log("You cancel the document picker.")
}`}
          run={async (log) => {
            const result = await DocumentPicker.pickFiles({
              shouldShowFileExtensions: true,
              allowsMultipleSelection: true,
            })

            if (result.length > 0) {
              log("Picked files:\n" + JSON.stringify(result))
            } else {
              log("Cancelled")
            }
          }}
        />

        <APIExample
          title={"DocumentPicker.pickDirectory"}
          subtitle={"Pick a directory."}
          code={`const result = await DocumentPicker.pickDirectory()

if (result != null) {
  console.log("Picked directory: \n" + result)
} else {
  console.log("Cancelled")
}`}
          run={async (log) => {
            const result = await DocumentPicker.pickDirectory()

            if (result != null) {
              log("Picked directory: \n" + result)
            } else {
              log("Cancelled")
            }
          }}
        />

        <APIExample
          title={"DocumentPicker.exportFiles"}
          subtitle={"Exports files."}
          code={`const textContent = "Hello Scripting!"
const result = await DocumentPicker.exportFiles({
  files: [
    {
      data: Data.fromString(textContent)!,
      name: 'greeting.txt',
    }
  ]
})

if (result.length > 0) {
  console.log('Exported files: ' + result)
} else {
  console.log("Cancelled")
}`}
          run={async (log) => {
            const textContent = "Hello Scripting!"
            const result = await DocumentPicker.exportFiles({
              files: [
                {
                  data: Data.fromString(textContent)!,
                  name: 'greeting.txt',
                }
              ]
            })

            if (result.length > 0) {
              log('Exported files: ' + result)
            } else {
              log("Cancelled")
            }
          }}
        />

        <APIExample
          title={"DocumentPicker.stopAcessingSecurityScopedResources"}
          subtitle={"When you no longer need access to the files or directories those pick by DocumentPicker and automatic make the resource available to your script, such as one returned by resolving a security-scoped bookmark, call this method to relinquish access."}
          code={`DocumentPicker.stopAcessingSecurityScopedResources()`}
          run={async () => {
            DocumentPicker.stopAcessingSecurityScopedResources()
          }}
        />
      </VStack>
    </ScrollView>
  </NavigationStack>
}