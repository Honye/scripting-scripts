import { Label } from "scripting"
import { UIExample } from "../../ui_example"

export function LabelExample() {
  return <UIExample
    title={"Label"}
    code={`<Label
 title={"Hello world"}
 systemImage={"globe"}
/>`}
  >
    <Label
      title={"Hello world"}
      systemImage={"globe"}
    />
  </UIExample>
}