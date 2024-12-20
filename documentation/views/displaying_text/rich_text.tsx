import { RichText, } from "scripting"
import { UIExample } from "../../ui_example"

export function RichTextExample() {

  return <UIExample
    title={"RichText"}
    code={`<RichText
  foregroundColor={"label"}
  font={16}
>
  {"I agree the "}
  {{
    text: "Terms",
    foregroundColor: "systemBlue",
    underlineColor: "systemBlue",
    bold: true,
    onTapGesture: () => {
      Dialog.alert({
        message: "OK!"
      })
    }
  }}.
</RichText>`}
  >
    <RichText
      foregroundColor={"label"}
      font={16}
    >
      {"I agree the "}
      {{
        text: "Terms",
        foregroundColor: "systemBlue",
        underlineColor: "systemBlue",
        bold: true,
        onTapGesture: () => {
          Dialog.alert({
            message: "OK!"
          })
        }
      }}.
    </RichText>
  </UIExample>
}