import { useState, VStack, Toggle, Text } from "scripting"
import { UIExample } from "../../ui_example"

export function ToggleExample() {
  const [on, setOn] = useState(false)

  return <UIExample
    title={"Toggle"}
    code={`function ToggleView() {
  const [on, setOn] = useState(false)

  return <Toggle
    title={"Toggle Switch"}
    value={on}
    onChanged={setOn}
  />
}`}
  >
    <VStack>
      <Toggle
        title={"Toggle Switch"}
        value={on}
        onChanged={setOn}
      />
      <Text>Current: {on ? 'on' : 'off'}</Text>
    </VStack>
  </UIExample>
}