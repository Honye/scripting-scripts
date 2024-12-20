import { ScrollView } from "scripting"
import { DefaultButton } from "./default_button"
import { ButtonWithTextAndIcon } from "./button_with_text_and_icon"
import { CustomContentButton } from "./custom_content_button"

export function ButtonExample() {
  return <ScrollView
    navigationTitle={"Button"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <DefaultButton />
    <ButtonWithTextAndIcon />
    <CustomContentButton />
  </ScrollView>
}



