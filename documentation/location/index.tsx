import { ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function LocationExample() {
  return <ScrollView
    navigationTitle={"Location"}
  >
    <VStack>
      <APIExample
        title={"Location.setAccuracy"}
        subtitle={"Set the accuracy of the location data that your app wants to receive."}
        code={`Location.setAccuracy("best")
console.log("Set the desired accuracy to \\"best\\"")`}
        run={(log) => {
          Location.setAccuracy("best")
          log("Set the desired accuracy to \"best\"")
        }}
      />

      <APIExample
        title={"Location.requestCurrent"}
        subtitle={""}
        code={`const location = await Location.requestCurrent()
console.log("Location: " + JSON.stringify(location))`}
        run={async (log) => {
          const location = await Location.requestCurrent()
          log("Location: " + JSON.stringify(location, null, 2))
        }}
      />

      <APIExample
        title={"Location.pickFromMap"}
        subtitle={""}
        code={`const location = await Location.pickFromMap()
console.log("Location: " + JSON.stringify(location, null, 2))`}
        run={async (log) => {
          const location = await Location.pickFromMap()
          log("Location: " + JSON.stringify(location, null, 2))
        }}
      />

      <APIExample
        title={"Location.reverseGeocode"}
        subtitle={""}
        code={`const location = await Location.pickFromMap()
if (location == null) {
  console.log("Cancelled")
} else {
  const result = await Location.reverseGeocode({
    latitude: location.latitude,
    longitude: location.longitude,
    locale: 'zh-CN'
  })
  console.log("Reverse result: " + JSON.stringify(result, null, 2))
}`}
        run={async log => {
          const location = await Location.pickFromMap()
          if (location == null) {
            log("Cancelled")
          } else {
            const result = await Location.reverseGeocode({
              latitude: location.latitude,
              longitude: location.longitude,
              locale: 'zh-CN'
            })
            log("Reverse result: " + JSON.stringify(result, null, 2))
          }
        }}
      />
    </VStack>
  </ScrollView>
}