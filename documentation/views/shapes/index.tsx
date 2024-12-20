import { Capsule, Circle, Ellipse, Rectangle, RoundedRectangle, ScrollView, UnevenRoundedRectangle, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function ShapesExample() {

  return <ScrollView
    navigationTitle={"Shapes"}
  >
    <VStack>
      <UIExample
        title={"Rectangle"}
        code={`<Rectangle
  fill={"orange"}
  stroke={"red"}
  strokeLineWidth={3}
  frame={{
    width: 100,
    height: 100,
  }}
/>`}
      >
        <Rectangle
          fill={"orange"}
          stroke={"red"}
          strokeLineWidth={3}
          frame={{
            width: 100,
            height: 100,
          }}
        />
      </UIExample>

      <UIExample
        title={"RoundedRectangle"}
        code={`<RoundedRectangle
  fill={"blue"}
  cornerRadius={16}
  frame={{
    width: 100,
    height: 100,
  }}
/>`}
      >
        <RoundedRectangle
          fill={"blue"}
          cornerRadius={16}
          frame={{
            width: 100,
            height: 100,
          }}
        />
      </UIExample>

      <UIExample
        title={"Circle"}
        code={`<Circle
  stroke={"purple"}
  strokeLineWidth={4}
  frame={{
    width: 100,
    height: 100,
  }}
/>`}
      >
        <Circle
          stroke={"purple"}
          strokeLineWidth={4}
          frame={{
            width: 100,
            height: 100,
          }}
        />
      </UIExample>

      <UIExample
        title={"Capsule"}
        code={`<Capsule
  fill={"systemIndigo"}
  frame={{
    width: 100,
    height: 100,
  }}
/>`}
      >
        <Capsule
          fill={"systemIndigo"}
          frame={{
            width: 100,
            height: 40,
          }}
        />
      </UIExample>

      <UIExample
        title={"Ellipse"}
        code={`<Ellipse
  fill={"green"}
  frame={{
    width: 100,
    height: 100,
  }}
/>`}
      >
        <Ellipse
          fill={"green"}
          frame={{
            width: 40,
            height: 100,
          }}
        />
      </UIExample>

      <UIExample
        title={"UnevenRoundedRectangle"}
        code={`<UnevenRoundedRectangle
  fill={"brown"}
  topLeadingRadius={8}
  topTrailingRadius={0}
  bottomLeadingRadius={0}
  bottomTrailingRadius={8}
  frame={{
    width: 100,
    height: 100,
  }}
/>`}
      >
        <UnevenRoundedRectangle
          fill={"brown"}
          topLeadingRadius={16}
          topTrailingRadius={0}
          bottomLeadingRadius={0}
          bottomTrailingRadius={16}
          frame={{
            width: 100,
            height: 50,
          }}
        />
      </UIExample>
    </VStack>
  </ScrollView>
}