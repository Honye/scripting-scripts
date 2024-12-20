import { CommonTextExample } from "./text"
import { CustomStyleTextExample } from "./custom_style_text"
import { LabelExample } from "./label"
import { MarkdownExample } from "./markdown"
import { ScrollView } from "scripting"
import { RichTextExample } from "./rich_text"
import { AttributedStringTextExample } from "./attributed_string_text"

export function TextExample() {
  return <ScrollView
    navigationTitle={"Displaying Text"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <CommonTextExample />
    <AttributedStringTextExample />
    <CustomStyleTextExample />
    <LabelExample />
    <MarkdownExample />
    <RichTextExample />
  </ScrollView>
}


