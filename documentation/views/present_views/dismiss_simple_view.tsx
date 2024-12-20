import { Button, Navigation, NavigationStack, Text } from "scripting"
import { UIExample } from "../../ui_example"

export function DismissableSimpleViewExample() {

  return <UIExample
    title={"Present a dismissable simple view"}
    code={`import { Navigation, Text, Script} from "scripting"

function DismissSimpleView() {
  const dismiss = Navigation.useDismiss()

  return <Text
    foregroundStyle={'link'}
    onTapGesture={() => {
      dismiss()
    }}
  >Tap and dismiss</Text>
}

async function run() {
  await Navigation.present({
    element: <DismissSimpleView />
  })

  // Avoiding memory leak!
  Script.exit()
}
`}
  >
    <Button
      title={"Present"}
      buttonStyle={"borderedProminent"}
      action={() => {
        Navigation.present({
          element: <DismissSimpleView />
        })
      }}
    />
  </UIExample>
}

function DismissSimpleView() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <Text
      foregroundStyle={'link'}
      onTapGesture={() => {
        dismiss()
      }}
    >Tap and dismiss</Text>
  </NavigationStack>
}