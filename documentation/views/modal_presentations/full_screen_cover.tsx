import { Button, Text, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function FullScreenCoverExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <UIExample
    title={"Showing a full screen cover"}
    code={`<Button
  title={"Present"}
  action={() => setIsPresented(true)}
  fullScreenCover={{
    isPresented: isPresented,
    onChanged: setIsPresented,
    content: <VStack
      onTapGesture={() => setIsPresented(false)}
      foregroundStyle={"white"}
      frame={{
        maxHeight: "infinity",
        maxWidth: "infinity",
      }}
      background={"blue"}
      ignoresSafeArea
    >
      <Text>A full-screen modal view.</Text>
      <Text>Tap to dismiss</Text>
    </VStack>
  }}
/>`}
  >
    <Button
      title={"Present"}
      action={() => setIsPresented(true)}
      fullScreenCover={{
        isPresented: isPresented,
        onChanged: setIsPresented,
        content: <VStack
          onTapGesture={() => setIsPresented(false)}
          foregroundStyle={"white"}
          frame={{
            maxHeight: "infinity",
            maxWidth: "infinity",
          }}
          background={"blue"}
          ignoresSafeArea
        >
          <Text>A full-screen modal view.</Text>
          <Text>Tap to dismiss</Text>
        </VStack>
      }}
    />
  </UIExample>
}