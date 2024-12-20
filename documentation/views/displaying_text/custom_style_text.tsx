import { Text } from "scripting"
import { UIExample } from "../../ui_example"

export function CustomStyleTextExample() {
  return <UIExample
    title={"Custom Style Text"}
    code={`<Text
  font={18}
  italic
  foregroundStyle={'red'}
>Hello Scripting!</Text>`}
  >
    <Text
      font={18}
      italic
      foregroundStyle={'red'}
    >Hello Scripting!</Text>
  </UIExample>
}