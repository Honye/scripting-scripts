import { ScrollView, } from "scripting"
import { SecureTextExample } from "./secure_field"
import { TextFieldExample } from "./text_field"

export function TextInputExample() {
  return <ScrollView
    navigationTitle={"Text input"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <TextFieldExample />
    <SecureTextExample />
  </ScrollView>
}
