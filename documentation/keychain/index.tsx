import { ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function KeychainExample() {

  return <ScrollView
    navigationTitle={"KeyChain"}
  >
    <VStack>
      <APIExample
        title={"Keychain.set"}
        subtitle={"Encrypts and saves the key with the given value. If the key was already in the storage, its associated value is changed."}
        code={`Keychain.set("the_password", "password_value", {
  synchronizable: true, // synchronizes through iCloud
})
console.log("Set value to Keychain")`}
        run={async log => {
          Keychain.set("the_password", "password_value", {
            synchronizable: true, // synchronizes through iCloud
          })
          log("Set value to Keychain")
        }}
      />

      <APIExample
        title={"Keychain.get"}
        subtitle={"Decrypts and returns the value for the given `key` or `null` if `key` is not in the storage."}
        code={`const result = Keychain.get("the_password", {
  synchronizable: true,
})
console.log("Result: " + result)`}
        run={async log => {
          const result = Keychain.get("the_password", {
            synchronizable: true,
          })
          log("Result: " + result)
        }}
      />

      <APIExample
        title={"Keychain.contains"}
        subtitle={"Returns true if the storage contains the given `key`."}
        code={`const result = Keychain.contains("the_password", {
  synchronizable: true,
})
console.log("Contains: " + result)`}
        run={async (log) => {
          const result = Keychain.contains("the_password", {
            synchronizable: true,
          })
          log("Contains: " + result)
        }}
      />

      <APIExample
        title={"Keychain.remove"}
        subtitle={"Deletes associated value for the given key. If the given key does not exist, nothing will happen."}
        code={`Keychain.remove("the_password", {
  synchronizable: true
})
console.log("Removed")`}
        run={async log => {
          Keychain.remove("the_password", {
            synchronizable: true
          })
          log("Removed")
        }}
      />
    </VStack>
  </ScrollView>
}