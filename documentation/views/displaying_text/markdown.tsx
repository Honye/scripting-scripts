import { Markdown } from "scripting"
import { UIExample } from "../../ui_example"

export function MarkdownExample() {
  return <UIExample
    title={"Markdown"}
    code={`<Markdown
  content={\`
# Scripting App
Run your **ideas** quickly *with* scripts.
  \`}
  theme={"github"}
/>`}
  >
    <Markdown
      content={`
# Scripting App
Run your *ideas* quickly **with** scripts.
      `}
    />
  </UIExample>
}