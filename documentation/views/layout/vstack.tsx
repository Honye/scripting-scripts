import { Text, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function VStackExample() {
  const list = [0, 1, 2, 3, 4]

  return <UIExample
    title={"VStack"}
    code={`<VStack
  alignment={"leading"}
  spacing={10}
>
  {list.map((_, index) =>
    <Text>Item{index + 1}</Text>
  )}
</VStack>`}
  >
    <VStack
      alignment={"leading"}
      spacing={10}
    >
      {list.map((_, index) =>
        <Text>Item{index + 1}</Text>
      )}
    </VStack>
  </UIExample>
}