import { Button, Text, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function SheetExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <UIExample
    title={"Showing a sheet"}
    code={`<Button
  title={"Present"}
  action={() => setIsPresented(true)}
  sheet={{
    isPresented: isPresented,
    onChanged: setIsPresented,
    content: <VStack>
      <Text
        font={"title"}
        padding={50}
      >
        Sheet content
      </Text>
      <Button
        title={"Dismiss"}
        action={() => setIsPresented(false)}
      />
    </VStack>
  }}
/>`}
  >
    <Button
      title={"Present"}
      action={() => setIsPresented(true)}
      sheet={{
        isPresented: isPresented,
        onChanged: setIsPresented,
        content: <VStack
          presentationDragIndicator={"visible"}
        >
          <Text
            font={"title"}
            padding={50}
          >
            Sheet content
          </Text>
          <Button
            title={"Dismiss"}
            action={() => setIsPresented(false)}
          />
        </VStack>
      }}
    />
  </UIExample>
}
