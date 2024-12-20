import { ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"


type Person = {
  name: string
  age: number
  gender: string
}

export function StorageExample() {

  return <ScrollView
    navigationTitle={"Storage"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <VStack>
      <APIExample
        title={"Storage.set"}
        subtitle={"Saves a value to persistent storage in the background."}
        code={`type Person = {
  name: string
  age: number
  gender: string
}

const person: Person = {
  name: "John",
  age: 55,
  gender: "male"
}

Storage.set("person", person)`}
        run={async (log) => {
          Storage.set("person", {
            name: "John",
            age: 55,
            gender: "male"
          })
          log("Person is set.")
        }}
      />

      <APIExample
        title={"Storage.get"}
        subtitle={"Reads a value from persistent storage, if the value of the key is not exists, returns null"}
        code={`const person = Storage.get<Person>("person")
if (person != null) {
  console.log(person)
} else {
  console.log("No person found")
}`}
        run={async (log) => {
          const person = Storage.get<Person>("person")

          if (person != null) {
            log(JSON.stringify(person))
          } else {
            log("No person found", true)
          }
        }}
      />

      <APIExample
        title={"Storage.contains"}
        subtitle={"Returns true if the persistent storage contains the given key."}
        code={`const exists = Storage.contains("person")
console.log("The key \\"person\\" " + exists ? "exists" : "not found")`}
        run={async (log) => {
          const exists = Storage.contains("person")
          log("The key \"person\" " + (exists ? "exists" : "not found"))
        }}
      />

      <APIExample
        title={"Storage.remove"}
        subtitle={"Removes an entry from persistent storage."}
        code={`Storage.remove("person")
console.log("The key \"person\" removed")`}
        run={async (log) => {
          Storage.remove("person")
          log("The key \"person\" removed")
        }}
      />
    </VStack>
  </ScrollView>
}