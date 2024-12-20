import { Button, List, Section, Text, useState } from "scripting"
import { CodePreview } from "../../ui_example"

export function SectionExample() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [codeVisible, setCodeVisible] = useState(false)

  return <List
    navigationTitle={"Section"}
    navigationBarTitleDisplayMode={"inline"}
    toolbar={{
      topBarTrailing: <Button
        title={"Code"}
        buttonStyle={'borderedProminent'}
        controlSize={'small'}
        action={() => setCodeVisible(true)}
        popover={{
          isPresented: codeVisible,
          onChanged: setCodeVisible,
          content: <CodePreview
            code={code}
            dismiss={() => setCodeVisible(false)}
          />
        }}
      />,
    }}
  >
    <Section>
      <Text>Row 1</Text>
      <Text>Row 2</Text>
      <Text>Row 3</Text>
      <Text>Row 4</Text>
    </Section>

    <Section
      header={<Text>Section with header</Text>}
    >
      <Text>Row 1</Text>
      <Text>Row 2</Text>
      <Text>Row 3</Text>
      <Text>Row 4</Text>
    </Section>

    <Section
      footer={<Text>Section with footer</Text>}
    >
      <Text>Row 1</Text>
      <Text>Row 2</Text>
      <Text>Row 3</Text>
      <Text>Row 4</Text>
    </Section>

    <Section
      header={
        <Text
          onTapGesture={() => setIsExpanded(!isExpanded)}
        >Collapsable Section</Text>
      }
      isExpanded={isExpanded}
      onChanged={setIsExpanded}
    >
      <Text>Row 1</Text>
      <Text>Row 2</Text>
      <Text>Row 3</Text>
      <Text>Row 4</Text>
    </Section>
  </List>
}

const code = `<Section>
  <Text>Row 1</Text>
  <Text>Row 2</Text>
  <Text>Row 3</Text>
  <Text>Row 4</Text>
</Section>

<Section
  header={<Text>Section with header</Text>}
>
  <Text>Row 1</Text>
  <Text>Row 2</Text>
  <Text>Row 3</Text>
  <Text>Row 4</Text>
</Section>

<Section
  footer={<Text>Section with footer</Text>}
>
  <Text>Row 1</Text>
  <Text>Row 2</Text>
  <Text>Row 3</Text>
  <Text>Row 4</Text>
</Section>

<Section
  title={"Expandable Section"}
  isExpanded={isExpanded}
  onChanged={setIsExpanded}
>
  <Text>Row 1</Text>
  <Text>Row 2</Text>
  <Text>Row 3</Text>
  <Text>Row 4</Text>
</Section>`