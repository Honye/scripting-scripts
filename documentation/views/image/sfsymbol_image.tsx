import { Image } from "scripting"
import { UIExample } from "../../ui_example"

export function SFSymbolImageExample() {
  return <UIExample
    title={"SFSymbol Image"}
    code={`<Image
  systemName={"phone"}
  resizable
  scaleToFit
  frame={{
    width: 28,
    height: 28
  }}
  foregroundStyle={"systemGreen"}
/>`}
  >
    <Image
      systemName={"phone"}
      resizable
      scaleToFit
      frame={{
        width: 28,
        height: 28
      }}
      foregroundStyle={"systemGreen"}
    />
  </UIExample>
}