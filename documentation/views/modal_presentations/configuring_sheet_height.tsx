import { Button, Text, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function ConfiguringSheetHeightExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <UIExample
    title={"Configuring sheet height"}
    code={`<Button
  title={"Present"}
  action={() => setIsPresented(true)}
  sheet={{
    isPresented: isPresented,
    onChanged: setIsPresented,
    content: <VStack
      presentationDragIndicator={"visible"}
      presentationDetents={[
        200, // fixed height
        "medium",
        "large"
      ]}
    >
      <Text
        font={"title"}
        padding={50}
      >
        Drag the indicator to resize the sheet height.
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
          presentationDetents={[
            200, // fixed height
            "medium",
            "large"
          ]}
        >
          <Text
            font={"title"}
            padding={50}
          >
            Drag the indicator to resize the sheet height.
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