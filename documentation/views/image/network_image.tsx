import { Image, ProgressView } from "scripting"
import { UIExample } from "../../ui_example"

export function NetworkImageExample() {
  return <UIExample
    title={"Network Image"}
    code={`<Image
  imageUrl={'https://developer.apple.com/assets/elements/icons/swiftui/swiftui-96x96_2x.png'}
  resizable
  scaleToFit
/>`}
  >
    <Image
      imageUrl={'https://developer.apple.com/assets/elements/icons/swiftui/swiftui-96x96_2x.png'}
      resizable
      scaleToFit
      placeholder={<ProgressView
        progressViewStyle={'circular'}
      />}
    />
  </UIExample>
}