import { ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function ClipboardExample() {

  return <ScrollView
    navigationTitle={"Storage"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <VStack>
      <APIExample
        title={"Clipboard.copyText"}
        subtitle={"Copy text to clipboard."}
        code={`Clipboard.copyText("Hello Scripting!")
console.log("Copied")`}
        run={async (log) => {
          Clipboard.copyText("Hello Scripting!")
          log("Copied")
        }}
      />

      <APIExample
        title={"Clipboard.getText"}
        subtitle={"Get text form clipboard."}
        code={`const result = await Clipboard.getText()
Dialog.alert({
  title: "Result from Clipboard:",
  message: result != null ? result : "null"
})`}
        run={async () => {
          const result = await Clipboard.getText()
          Dialog.alert({
            title: "Result from Clipboard:",
            message: result != null ? result : "null"
          })
        }}
      />
    </VStack>
  </ScrollView>
}