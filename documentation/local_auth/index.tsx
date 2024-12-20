import { ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function LocalAuthExample() {
  return <ScrollView
    navigationTitle={"LocalAuth"}
  >
    <VStack>
      <APIExample
        title={"LocalAuth.isAvailable"}
        subtitle={"Check whether authentication can proceed for any policies."}
        code={`console.log("Available: " + LocalAuth.isAvaliable)`}
        run={async (log) => {
          log("Available: " + LocalAuth.isAvailable)
        }}
      />

      <APIExample
        title={"LocalAuth.isBiometricsAvailable"}
        subtitle={"Check whether authentication can proceed for any biometry policies."}
        code={`console.log("Biometrics available: " +  + LocalAuth.isBiometricsAvailable)`}
        run={(async log => {
          log("Biometrics available: " + LocalAuth.isBiometricsAvailable)
        })}
      />

      <APIExample
        title={"LocalAuth.biometryType"}
        subtitle={"The type of biometric authentication supported by the device."}
        code={`console.log("Type: " + LocalAuth.biometryType)`}
        run={async log => {
          log("Type: " + LocalAuth.biometryType)
        }}
      />

      <APIExample
        title={"LocalAuth.authenticate"}
        subtitle={"Authenticates the user with biometrics available on the device. Returns true if the user successfully authenticated, false otherwise."}
        code={`const success = await LocalAuth.authenticate(
  "Authenticate to access this function.",
  true, // authenticate a user with biometry
)
console.log("Success: " + success)`}
        run={async log => {
          const success = await LocalAuth.authenticate(
            "Authenticate to access this function.",
            true, // authenticate a user with biometry
          )
          log("Success: " + success)
        }}
      />
    </VStack>
  </ScrollView>
}