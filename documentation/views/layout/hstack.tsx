import { HStack, Text } from "scripting"
import { UIExample } from "../../ui_example"

export function HStackExample() {
  const list = [0, 1, 2, 3, 4]
  
  return <UIExample
    title={"HStack"}
    code={`<HStack
  alignment={"top"}
  spacing={10}
>
  {list.map((_, index) =>
    <Text>Item{index + 1}</Text>
  )}
</HStack>`}
  >
    <HStack
      alignment={"top"}
      spacing={10}
    >
      {list.map((_, index) =>
        <Text>Item{index + 1}</Text>
      )}
    </HStack>
  </UIExample>
}