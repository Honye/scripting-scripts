import { Button } from "scripting"
import { UIExample } from "../../ui_example"

export function DefaultButton() {
  return <UIExample
    title={"Default Button"}
    code={`<Button
  title={"Default Button"}
  action={() => {
    console.log("Button tapped.")
  }}
/>`}
  >
    <Button
      title={"Default Button"}
      action={() => {
        console.log("Button tapped.")
      }}
    />
  </UIExample>
}