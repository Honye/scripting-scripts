import { Button, Image } from "scripting"
import { UIExample } from "../../ui_example"

export function CustomContentButton() {
  return <UIExample
    title={"Custom Content Button"}
    code={`<Button action={() => {
  console.log("Custom button tapped.")
}}>
  <Image
    systemName={"xmark.circle.fill"}
  />
</Button>  
    `}
  >
    <Button action={() => {
      console.log("Custom button tapped.")
    }}>
      <Image
        systemName={"xmark.circle.fill"}
      />
    </Button>
  </UIExample>
}