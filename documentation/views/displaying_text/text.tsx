import { Text } from "scripting"
import { UIExample } from "../../ui_example"

export function CommonTextExample() {
  return <UIExample
    title="Text"
    code={`<Text>Hello Scripting!</Text>`}>
    <Text>Hello Scripting!</Text>
  </UIExample>
}