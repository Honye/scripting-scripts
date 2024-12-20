import { useState, Color, NavigationStack, List, Text, HStack, Spacer, Image, Button, Navigation } from "scripting"
import { NavigationDetailView } from "./with_navigation_link"
import { CodePreview } from "../../../ui_example"

export function WithNavigationDestinationExample() {
  return <Button
    title={"Present example"}
    action={() => {
      Navigation.present({
        element: <NavigationDestinationExample />
      })
    }}
  />
}

function NavigationDestinationExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const colors: Color[] = [
    "red", "green", "blue", "orange", "purple"
  ]
  const [selectedColor, setSelectedColor] = useState<Color | null>()

  return <NavigationStack>
    <List
      navigationDestination={{
        isPresented: selectedColor != null,
        onChanged: value => {
          if (!value) {
            setSelectedColor(null)
          }
        },
        content: selectedColor != null
          ? <NavigationDetailView
            color={selectedColor}
          />
          : <Text>Select a color</Text>
      }}
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
        <HStack
          contentShape={"rect"}
          onTapGesture={() => {
            setSelectedColor(color)
          }}
        >
          <Text>Navigation to {color} view</Text>
          <Spacer />
          <Image
            systemName={"chevron.right"}
            foregroundStyle={"secondaryLabel"}
          />
        </HStack>
      )}
    </List>
  </NavigationStack>
}

const code = `function NavigationDestinationExample() {
  const colors: Color[] = [
    "red", "green", "blue", "orange", "purple"
  ]
  const [selectedColor, setSelectedColor] = useState<Color | null>()

  return <NavigationStack>
    <List
      navigationDestination={{
        isPresented: selectedColor != null,
        onChanged: value => {
          if (!value) {
            setSelectedColor(null)
          }
        },
        content: selectedColor != null
          ? <NavigationDetailView
            color={selectedColor}
          />
          : <Text>Select a color</Text>
      }}
    >
      {colors.map(color =>
        <HStack
          contentShape={"rect"}
          onTapGesture={() => {
            setSelectedColor(color)
          }}
        >
          <Text>Navigation to {color} view</Text>
          <Spacer />
          <Image
            systemName={"chevron.right"}
          />
        </HStack>
      )}
    </List>
  </NavigationStack>
}`