import { Button, Navigation, Text } from "scripting"
import { UIExample } from "../../ui_example"

export function SimpleViewExample() {

  return <UIExample
    title={"Present a simple view"}
    code={`import { Navigation, Text, Script} from "scripting"

function SimpleView() {
  return <Text>Hello Scripting!</Text>
}

async function run() {
  await Navigation.present({
    element: <SimpleView />
  })

  // Avoiding memory leak!
  Script.exit()
}

run()
`}
  >
    <Button
      title={"Present"}
      buttonStyle={"borderedProminent"}
      action={() => {
        Navigation.present({
          element: <SimpleView />
        })
      }}
    />
  </UIExample>
}

function SimpleView() {
  return <Text>Hello Scripting!</Text>
}