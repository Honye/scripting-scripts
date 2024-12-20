import { Text } from "scripting"
import { UIExample } from "../../ui_example"

export function AttributedStringTextExample() {
  return <UIExample
    title="Attributed String Text"
    code={`const attributedString = \`This is regular text.
* This is **bold** text, this is *italic* text, and this is ***bold, italic*** text.
~~A strikethrough example~~
\`Monospaced works too\`
Visit Apple: [click here](https://apple.com)\`

<Text
  attributedString={attributedString}
/>`}>
    <Text
      attributedString={`This is regular text.
* This is **bold** text, this is *italic* text, and this is ***bold, italic*** text.
~~A strikethrough example~~
\`Monospaced works too\`
Visit Apple: [click here](https://apple.com)`}
    />
  </UIExample>
}