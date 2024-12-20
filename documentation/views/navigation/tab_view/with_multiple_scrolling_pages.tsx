import { Color, TabView, Text, VStack } from "scripting"
import { UIExample } from "../../../ui_example"

export function TabViewWithMultipleScrollingPagesExample() {
  return <UIExample
    title={"TabView with multiple scrolling pages"}
    code={code}
  >
    <TabViewExample />
  </UIExample>
}

function TabViewExample() {
  const colors: Color[] = [
    "red",
    "green",
    "blue",
    "purple"
  ]

  return <TabView
    tabViewStyle={"page"}
    frame={{
      height: 200
    }}
  >
    {colors.map(color =>
      <ColorView
        color={color}
      />
    )}
  </TabView>
}

function ColorView({
  color,
}: {
  color: Color
}) {
  return <VStack
    frame={{
      maxWidth: "infinity",
      maxHeight: "infinity"
    }}
    background={color}
  >
    <Text>{color}</Text>
  </VStack>
}

const code = `function TabViewExample() {
  const colors: Color[] = [
    "red",
    "green",
    "blue",
    "purple"
  ]

  return <TabView
    tabViewStyle={"page"}
    frame={{
      height: 200
    }}
  >
    {colors.map(color =>
      <ColorView
        color={color}
      />
    )}
  </TabView>
}`