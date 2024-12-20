import { ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function QRCodeExample() {
  return <ScrollView
    navigationTitle={"QRCode"}
  >
    <VStack>
      <APIExample
        title={"QRCode.scan"}
        subtitle={"Open the QRCode scan page and scan."}
        code={`const result = await QRCode.scan()
if (result) {
  console.log("Result: " + result)
} else {
  console.log("Cancelled")
}`}
        run={async log => {
          const result = await QRCode.scan()
          if (result) {
            log("Result: " + result)
          } else {
            log("Cancelled")
          }
        }}
      />

      <APIExample
        title={"QRCode.parse"}
        subtitle={"Parse QRCode file to a string."}
        code={`const result = await QRCode.parse(filePath)`}
      />
    </VStack>
  </ScrollView>
}