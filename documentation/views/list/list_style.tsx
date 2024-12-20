import { Button, List, ListStyle, Menu, Picker, Section, Text, useMemo, useState } from "scripting"
import { CodePreview } from "../../ui_example"

export function ListStyleExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const [listStyle, setListStyle] = useState<ListStyle>("automatic")
  const listStyleOptions = useMemo<ListStyle[]>(() => [
    "automatic",
    "bordered",
    "carousel",
    "elliptical",
    "grouped",
    "inset",
    "insetGroup",
    "plain",
    "sidebar",
  ], [])

  return <List
    navigationTitle={"List Style"}
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
    listStyle={listStyle}
  // listSectionSpacing={5} // apply for all sections
  >
    <Picker
      title={"ListStyle"}
      value={listStyle}
      onChanged={setListStyle as any}
      pickerStyle={"menu"}
    >
      {listStyleOptions.map(listStyle =>
        <Text tag={listStyle}>{listStyle}</Text>
      )}
    </Picker>

    <Section>
      <Text
        badge={10} // Use a badge to convey optional, supplementary information about a view
      >Recents</Text>
      <Text>Favorites</Text>
    </Section>

    <Section
      header={<Text>Colors</Text>}
      listItemTint={"systemBlue"}
    >
      <Text>Red</Text>
      <Text>Blue</Text>
    </Section>

    <Section
      header={<Text>Shapes</Text>}
    >
      <Text>Rectangle</Text>
      <Text>Circle</Text>
    </Section>

    <Section
      header={<Text>Borders</Text>}
      listSectionSpacing={10} // specify on an individual Section
    >
      <Text>Dashed</Text>
      <Text>Solid</Text>
    </Section>
  </List>
}

const code = `<List
  listStyle="grouped"
  // listSectionSpacing={5} // apply for all sections
>
  <Section>
    <Text
      badge={10} // Use a badge to convey optional, supplementary information about a view
    >Recents</Text>
    <Text>Favorites</Text>
  </Section>

  <Section
    header={<Text>Colors</Text>}
    listItemTint={"systemBlue"}
  >
    <Text>Red</Text>
    <Text>Blue</Text>
  </Section>

  <Section
    header={<Text>Shapes</Text>}
  >
    <Text>Rectangle</Text>
    <Text>Circle</Text>
  </Section>

  <Section
    header={<Text>Borders</Text>}
    listSectionSpacing={10} // specify on an individual Section
  >
    <Text>Dashed</Text>
    <Text>Solid</Text>
  </Section>
</List>`