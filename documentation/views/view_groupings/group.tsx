import { Group, ScrollView, Text, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function GroupSmaple() {

  return <ScrollView
    navigationTitle={"Group"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <UIExample
      title={"Apply the headline font to all Text views"}
      code={`<Group
  font={"headline"}
>
  <Text>Scripting</Text>
  <Text>TypeScript</Text>
  <Text>TSX</Text>
</Group>`}
    >
      <Group
        font={"headline"}
      >
        <Text>Scripting</Text>
        <Text>TypeScript</Text>
        <Text>TSX</Text>
      </Group>
    </UIExample>

    <UIExample
      title={"Group some views as a view"}
      code={`<VStack>
  <Group
     foregroundStyle={"red"}
  >
    <Text>1</Text>
    <Text>2</Text>
    <Text>3</Text>
    <Text>4</Text>
    <Text>5</Text>
    <Text>6</Text>
    <Text>7</Text>
  </Group>
  <Text>8</Text>
</VStack>`}
    >
      <VStack>
        <Group
          foregroundStyle={"red"}
        >
          <Text>1</Text>
          <Text>2</Text>
          <Text>3</Text>
          <Text>4</Text>
          <Text>5</Text>
          <Text>6</Text>
          <Text>7</Text>
        </Group>
        <Text>8</Text>
      </VStack>
    </UIExample>
  </ScrollView>
}
