import { Button, ButtonStyle, Picker, ShareSheet, Text, useMemo, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function ButtonWithTextAndIcon() {
  const [value, setValue] = useState(0)
  const buttonStyles = useMemo<ButtonStyle[]>(() => [
    'automatic', 'bordered', 'borderedProminent', 'borderless', 'plain'
  ], [])
  const buttonStyle = buttonStyles[value]

  return <UIExample
    title={"Button with Text and Icon"}
    code={`<Button
  title={"Share"}
  systemImage={"square.and.arrow.up"}
  buttonStyle={"borderedProminent"}
  action={async () => {
    const success = await ShareSheet.present(["This is share content."])
    console.log("Share successfully", success)
  }}
/>  
    `}
  >
    <VStack>
      <Button
        title={"Share"}
        systemImage={"square.and.arrow.up"}
        buttonStyle={buttonStyle}
        action={async () => {
          const success = await ShareSheet.present(["This is share content."])
          console.log("Share successfully", success)
        }}
      />

      <Picker
        title={"ButtonStyle"}
        value={value}
        onChanged={setValue}
        pickerStyle={'wheel'}
      >
        {buttonStyles.map((style, index) =>
          <Text tag={index}>{style}</Text>
        )}
      </Picker>
    </VStack>

  </UIExample>
}