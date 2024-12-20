import { Button, DisclosureGroup, List, Text, Toggle, useState } from "scripting"
import { CodePreview } from "../../ui_example"

export function DisclosureGroupExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const [topExpanded, setTopExpanded] = useState(true)
  const [oneIsOn, setOneIsOn] = useState(false)
  const [twoIsOn, setTwoIsOn] = useState(true)

  return <List
    navigationTitle={"DislcosureGroup"}
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
    <Button
      title={"Toggle expanded"}
      action={() => setTopExpanded(!topExpanded)}
    />
    <DisclosureGroup
      title={"Items"}
      isExpanded={topExpanded}
      onChanged={setTopExpanded}
    >
      <Toggle
        title={"Toggle 1"}
        value={oneIsOn}
        onChanged={setOneIsOn}
      />
      <Toggle
        title={"Toggle 2"}
        value={twoIsOn}
        onChanged={setTwoIsOn}
      />

      <DisclosureGroup
        title={"Sub-items"}
      >
        <Text>Sub-item 1</Text>
      </DisclosureGroup>
    </DisclosureGroup>
  </List>
}

const code = `<DisclosureGroup
  title={"Items"}
  isExpanded={topExpanded}
  onChanged={setTopExpanded}
>
  <Toggle
    title={"Toggle 1"}
    value={oneIsOn}
    onChanged={setOneIsOn}
  />
  <Toggle
    title={"Toggle 2"}
    value={twoIsOn}
    onChanged={setTwoIsOn}
  />

  <DisclosureGroup
    title={"Sub-items"}
  >
    <Text>Sub-item 1</Text>
  </DisclosureGroup>
</DisclosureGroup>`