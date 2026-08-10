import { FlowLayout, List, Navigation, NavigationStack, Script, Section, Slider, Text, useState, VStack, } from "scripting"

const tags = [
  "Apple", "Orange", "Banana", "Pear", "Grape", "Mango",
  "Peach", "Cherry", "Lemon", "Kiwi", "Melon", "Plum",
]

function Example() {
  const [spacing, setSpacing] = useState(8)
  const [horizontalSpacing, setHorizontalSpacing] = useState(8)
  const [verticalSpacing, setVerticalSpacing] = useState(8)

  return <NavigationStack>
    <List
      navigationTitle={"FlowLayout"}
      navigationBarTitleDisplayMode={"inline"}
    >
      <Section
        header={<Text>Spacing</Text>}
        footer={
          <Text>
            spacing is the base for both axes. horizontalSpacing / verticalSpacing
            override it per axis.
          </Text>
        }
      >
        <VStack alignment={"leading"}>
          <Text>{`spacing: ${Math.round(spacing)}`}</Text>
          <Slider value={spacing} min={0} max={40} onChanged={setSpacing} />
        </VStack>
        <VStack alignment={"leading"}>
          <Text>{`horizontalSpacing: ${Math.round(horizontalSpacing)}`}</Text>
          <Slider value={horizontalSpacing} min={0} max={40} onChanged={setHorizontalSpacing} />
        </VStack>
        <VStack alignment={"leading"}>
          <Text>{`verticalSpacing: ${Math.round(verticalSpacing)}`}</Text>
          <Slider value={verticalSpacing} min={0} max={40} onChanged={setVerticalSpacing} />
        </VStack>
      </Section>

      <Section header={<Text>Preview</Text>}>
        <FlowLayout
          spacing={spacing}
          horizontalSpacing={horizontalSpacing}
          verticalSpacing={verticalSpacing}
        >
          {tags.map(tag =>
            <Text
              key={tag}
              padding={{ horizontal: 12, vertical: 6 }}
              background={"systemBlue"}
              foregroundStyle={"white"}
            >{tag}</Text>
          )}
        </FlowLayout>
      </Section>
    </List>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()
