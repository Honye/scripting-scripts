import { VStack, Text, HStack, Button } from "scripting"
import KeyboardView from "./components/KeyboardView"

function MyKeyboard() {
  const traits = CustomKeyboard.useTraits()

  const insert = async (text: string) => {
    await CustomKeyboard.insertText(text)
  }
  return (
    <VStack spacing={8}>
      <Text>Keyboard Type: {traits.keyboardType}</Text>
      <HStack spacing={12}>
        <Button title="Hello" action={() => insert("Hello")} />
        <Button title="OK" action={() => insert("OK")} />
        <Button title="← Delete" action={() => CustomKeyboard.deleteBackward()} />
      </HStack>
    </VStack>
  )
}

async function main() {
  await Promise.all([
    // Hide the default toolbar
    CustomKeyboard.setToolbarVisible(false),
    // 系统键盘高度: English 无工具栏 226
    // 系统键盘候选词（工具栏）高度：45
    CustomKeyboard.requestHeight(226),
  ])

  CustomKeyboard.present(
    <KeyboardView />
  )
}

main()
