import { ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function ShareSheetExample() {

  return <ScrollView
    navigationTitle={"ShareSheet"}>
    <VStack>
      <APIExample
        title={"ShareSheet.present"}
        subtitle={"Present a ShareSheet UI."}
        code={`// const image = await Photos.getLatestPhotos(1)
// await ShareSheet.present([image])

if (await ShareSheet.present(["Hello Scripting!"])) {
  console.log("Share successfully.")
} else {
  console.log("Cancelled")
}`}
        run={async log => {
          // const image = await Photos.getLatestPhotos(1)
          // await ShareSheet.present([image])
          if (await ShareSheet.present(["Hello Scripting!"])) {
            log("Share successfully.")
          } else {
            log("Cancelled")
          }
        }}
      />
    </VStack>
  </ScrollView>
}