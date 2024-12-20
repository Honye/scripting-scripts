import { NavigationSplitView, NavigationSplitViewColumn, Text, useState, VStack } from "scripting"

export function CollapsedSplitViewsExample() {
  const [preferredColumn, setPreferredColumn] = useState<NavigationSplitViewColumn>("detail")

  return <NavigationSplitView
    preferredCompactColumn={{
      value: preferredColumn,
      onChanged: (value) => {
        console.log("preferredCompactColumn changed to", value)
        setPreferredColumn(value)
      }
    }}
    sidebar={
      <VStack
        navigationContainerBackground={"yellow"}
        frame={{
          maxWidth: "infinity",
          maxHeight: "infinity",
        }}
      >
        <Text>Yellow</Text>
      </VStack>
    }
  >
    <VStack
      navigationContainerBackground={"blue"}
      frame={{
        maxWidth: "infinity",
        maxHeight: "infinity",
      }}
    >
      <Text>Blue</Text>
    </VStack>
  </NavigationSplitView>
}