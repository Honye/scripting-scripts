import { BarStackChart, Chart, Divider, Toggle, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

type ToyShape = {
  color: string
  type: string
  count: number
}

export const toyWithColorData: ToyShape[] = [
  { color: "Green", type: "Cube", count: 2 },
  { color: "Green", type: "Sphere", count: 0 },
  { color: "Green", type: "Pyramid", count: 1 },
  { color: "Purple", type: "Cube", count: 1 },
  { color: "Purple", type: "Sphere", count: 1 },
  { color: "Purple", type: "Pyramid", count: 1 },
  { color: "Pink", type: "Cube", count: 1 },
  { color: "Pink", type: "Sphere", count: 2 },
  { color: "Pink", type: "Pyramid", count: 0 },
  { color: "Yellow", type: "Cube", count: 1 },
  { color: "Yellow", type: "Sphere", count: 1 },
  { color: "Yellow", type: "Pyramid", count: 2 },
]

export function BarStackChartExample() {
  const [labelOnYAxis, setLabelOnYAxis] = useState(false)

  return <UIExample
    title={"BarStackChart"}
    code={`const stackedBarData: ToyShape[] = [
  { color: "Green", type: "Cube", count: 2 },
  { color: "Green", type: "Sphere", count: 0 },
  { color: "Green", type: "Pyramid", count: 1 },
  { color: "Purple", type: "Cube", count: 1 },
  { color: "Purple", type: "Sphere", count: 1 },
  { color: "Purple", type: "Pyramid", count: 1 },
  { color: "Pink", type: "Cube", count: 1 },
  { color: "Pink", type: "Sphere", count: 2 },
  { color: "Pink", type: "Pyramid", count: 0 },
  { color: "Yellow", type: "Cube", count: 1 },
  { color: "Yellow", type: "Sphere", count: 1 },
  { color: "Yellow", type: "Pyramid", count: 2 },
]
 
<Chart>
  <BarStackChart
    labelOnYAxis={labelOnYAxis}
    marks={stackedBarData.map(toy => ({
      label: toy.type,
      value: toy.count,
      category: toy.color,
    }))}
  />
</Chart>`}
  >
    <VStack>
      <Toggle
        title={"labelOnYAxis"}
        value={labelOnYAxis}
        onChanged={setLabelOnYAxis}
      />
      <Divider />
      <Chart
        frame={{
          height: 400
        }}
      >
        <BarStackChart
          labelOnYAxis={labelOnYAxis}
          marks={toyWithColorData.map(toy => ({
            label: toy.type,
            value: toy.count,
            category: toy.color,
          }))}
        />
      </Chart>
    </VStack>
  </UIExample>
}