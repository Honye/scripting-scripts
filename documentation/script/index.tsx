import { Script, ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function ScriptExample() {

  return <ScrollView
    navigationTitle={"Script"}
  >
    <VStack>
      <APIExample
        title={"Script.name"}
        subtitle={"Name of the current script."}
        code={`console.log(Script.name)`}
        run={log => {
          log(Script.name)
        }}
      />

      <APIExample
        title={"Script.directory"}
        subtitle={"The directory of the current script."}
        code={`console.log(Script.directory)`}
        run={log => {
          log(Script.directory)
        }}
      />

      <APIExample
        title={"Script.widgetParameter"}
        subtitle={"If a widget has set the Parameter field, and the current script is opened and run after clicking the widget, you can access the configuration from this property."}
        code={`console.log(Script.widgetParameter)`}
      />

      <APIExample
        title={"Script.queryParameters"}
        subtitle={"If the current script is opened and run by the run URL scheme( like \"scripting://run/{script_name}?a=1&b=2\")."}
        code={`console.log(Script.queryParameters)`}
      />

      <APIExample
        title={"Script.createOpenURLScheme"}
        subtitle={"Creates a URL scheme for opening a specified script."}
        code={`Script.createOpenURLScheme("scriptname")`}
        run={log => {
          log(Script.createOpenURLScheme("scriptname"))
        }}
      />

      <APIExample
        title={"Script.createRunURLScheme"}
        subtitle={"Creates a URL scheme for running a specified script."}
        code={`console.log(Script.createRunURLScheme("scriptname"))`}
      />

      <APIExample
        title={"Script.run"}
        subtitle={`Run a script of Scripting.
If the script does not exist, null is returned directly.
Caution: Make sure to call Script.exit() in the script to avoid memory leaks.`}
        code={`// Script A: index.tsx
Script.exit(
  Script.queryParameters["name"] + '123'
)

// Script B: index.tsx
async function run() {
  const result = await Script.run({
    name: 'Script A',
    queryParameters: {
      name: 'AAAA',
    }
  })

  console.log(result) // output: AAAA123
}
run()`}
      />

      <APIExample
        title={"Script.exit"}
        subtitle={`Exit current script.
When a script is called by another script, it can return a value that can be serialized by JSON.stringify as a result.
When a script is run by a shortcut action or share sheet, it can return an IntentValue as a processing result.`}
        code={`async function run() {
  await doSomething()

  Script.exit()
}
  
run()`}
      />
    </VStack>
  </ScrollView>
}