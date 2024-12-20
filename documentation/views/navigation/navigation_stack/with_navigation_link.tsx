import { Button, Color, List, NavigationLink, NavigationStack, Text, useState, VStack } from "scripting"
import { CodePreview } from "../../../ui_example"

export function WithNavigationLinkExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const colors: Color[] = [
    "red", "green", "blue", "orange", "purple"
  ]

  return <NavigationStack>
    <List
      navigationTitle={"NavigationStack with links"}
      toolbar={{
        topBarTrailing: <Button
          title={"Code"}
          action={() => setCodeVisible(true)}
          buttonStyle={"borderedProminent"}
          controlSize={"small"}
          popover={{
            isPresented: codeVisible,
            onChanged: setCodeVisible,
            content: <CodePreview
              code={code}
              dismiss={() => setCodeVisible(false)}
            />
          }}
        />
      }}
    >
      {colors.map(color =>
        <NavigationLink
          destination={
            <NavigationDetailView
              color={color}
            />
          }
        >
          <Text>Navigation to {color} view</Text>
        </NavigationLink>
      )}
    </List>
  </NavigationStack>
}

export function NavigationDetailView({
  color
}: {
  color: Color
}) {

  return <VStack
    navigationContainerBackground={color}
    frame={{
      maxWidth: "infinity",
      maxHeight: "infinity"
    }}
  >
    <Text>{color}</Text>
  </VStack>
}

const code = `function WithNavigationLinkExample() {
  const colors: Color[] = [
    "red", "green", "blue", "orange", "purple"
  ]

  return <NavigationStack>
    <List
      navigationTitle={"NavigationStack with links"}
    >
      {colors.map(color =>
        <NavigationLink
          destination={
            <NavigationDetailView
              color={color}
            />
          }
        >
          <Text>Navigation to {color} view</Text>
        </NavigationLink>
      )}
    </List>
  </NavigationStack>
}`