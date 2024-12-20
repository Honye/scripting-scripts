import { Button, Circle, Color, List, Navigation, NavigationLink, NavigationStack, Rectangle, Spacer, Text, useState, VStack, ZStack } from "scripting"
import { CodePreview, UIExample } from "../../ui_example"
import { UIExampleSection } from "../../ui_example_section"

export function ZStackExample() {
  const colors: Color[] = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
  ]

  return <UIExample
    title={"ZStack"}
    code={`function ZStackView() {
  const colors: Color[] = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
  ]
    
  <ZStack>
    {colors.map((color, index) =>
      <Rectangle
        fill={color}
        frame={{
          width: 100,
          height: 100,
        }}
        offset={{
          x: index * 10,
          y: index * 10
        }}
      />
    )}
  </ZStack>
}
  
function BackgroundView() {
  return <Text
    background={{
      content: <Rectangle
        fill={"systemBlue"}
        frame={{
          width: 100,
          height: 50,
        }}
      />,
      alignment: "center",
    }}
  >Hello Scripting!</Text>
}
  
function OverlayView() {
  return <Circle
    fill={"yellow"}
    frame={{
      width: 100,
      height: 100,
    }}
    overlay={{
      content: <Rectangle
        fill={"blue"}
        frame={{
          width: 50,
          height: 50,
        }}
      />,
      alignment: "center"
    }}
  />
}`}
  >
    <VStack>
      <UIExampleSection
        title={"ZStack"}
      >
        <ZStack>
          {colors.map((color, index) =>
            <Rectangle
              fill={color}
              frame={{
                width: 100,
                height: 100,
              }}
              offset={{
                x: index * 10,
                y: index * 10
              }}
            />
          )}
        </ZStack>
      </UIExampleSection>

      <UIExampleSection
        title={"background"}
      >
        <Text
          background={{
            content: <Rectangle
              fill={"systemBlue"}
              frame={{
                width: 100,
                height: 50,
              }}
            />,
            alignment: "center",
          }}
        >Hello Scripting!</Text>
      </UIExampleSection>

      <UIExampleSection
        title={"overlay"}
      >
        <Circle
          fill={"yellow"}
          frame={{
            width: 100,
            height: 100,
          }}
          overlay={{
            content: <Rectangle
              fill={"blue"}
              frame={{
                width: 50,
                height: 50,
              }}
            />,
            alignment: "center"
          }}
        />
      </UIExampleSection>

      <UIExampleSection
        title={"containerBackground (iOS 18.0+)"}
      >
        <Button
          title={"Present"}
          action={() => {
            Navigation.present({
              element: <ContainerBackgroundExample />,
              modalPresentationStyle: "pageSheet"
            })
          }}
        />
      </UIExampleSection>
    </VStack>
  </UIExample>
}

function ContainerBackgroundExample() {
  const dismiss = Navigation.useDismiss()
  const [codeVisible, setCodeVisible] = useState(false)

  return <NavigationStack>
    <List
      navigationTitle={"containerBackground"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        topBarLeading: <Button
          title={"Done"}
          action={dismiss}
        />,
        topBarTrailing: <Button
          title={"Code"}
          action={() => {
            setCodeVisible(true)
          }}
          controlSize={"small"}
          buttonStyle={"borderedProminent"}
          popover={{
            isPresented: codeVisible,
            onChanged: setCodeVisible,
            content: <CodePreview
              code={`<NavigationStack>
  <List>
    <NavigationLink
      title={"Red Page"}
      destination={
        <VStack
          navigationContainerBackground={"red"}
          frame={{
            maxWidth: 'infinity',
            maxHeight: 'infinity'
          }}
        >
          <Text>A red page</Text>
        </VStack>
      }
    />
    <NavigationLink
      title={"Blue Page"}
      destination={
        <VStack
          navigationContainerBackground={"blue"}
          frame={{
            maxWidth: 'infinity',
            maxHeight: 'infinity'
          }}
        >
          <Text>A blue page</Text>
        </VStack>
      }
    />
  </List>
</NavigationStack>`}
              dismiss={() => {
                setCodeVisible(false)
              }}
            />
          }}
        />
      }}
    >
      <NavigationLink
        title={"Red Page"}
        destination={
          <VStack
            navigationContainerBackground={"red"}
            frame={{
              maxWidth: 'infinity',
              maxHeight: 'infinity'
            }}
          >
            <Text>A red page</Text>
          </VStack>
        }
      />
      <NavigationLink
        title={"Blue Page"}
        destination={
          <VStack
            navigationContainerBackground={"blue"}
            frame={{
              maxWidth: 'infinity',
              maxHeight: 'infinity'
            }}
          >
            <Text>A blue page</Text>
          </VStack>
        }
      />
    </List>
  </NavigationStack>
}
