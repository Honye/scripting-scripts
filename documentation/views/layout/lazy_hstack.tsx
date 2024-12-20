import { ForEach, LazyHStack, Rectangle, ScrollView, Text } from "scripting"
import { UIExample } from "../../ui_example"

export function LazyHStackExample() {

  return <UIExample
    title={"LazyHStack"}
    code={`<ScrollView axes={"horizontal"}>
  <LazyHStack
    alignment={"top"}
    spacing={10}
  >
    <ForEach
      count={100}
      itemBuilder={index =>
        <Text
          padding
          background={"systemIndigo"}
          key={index.toString()}
        >Column {index}</Text>
      }
    />
  </LazyHStack>
</ScrollView>`}
  >
    <ScrollView axes={"horizontal"}>
      <LazyHStack
        alignment={"top"}
        spacing={10}
      >
        <ForEach
          count={100}
          itemBuilder={index =>
            <Text
              padding
              background={"systemIndigo"}
              key={index.toString()}
            >Column {index}</Text>
          }
        />
      </LazyHStack>
    </ScrollView>
  </UIExample>
}