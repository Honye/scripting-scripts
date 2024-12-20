import { BarChart, Chart, Divider, Toggle, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export type ToyShape = {
  type: string
  count: number
}

export const toysData: ToyShape[] = [
  {
    type: "Cube",
    count: 5,
  },
  {
    type: "Sphere",
    count: 4,
  },
  {
    type: "Pyramid",
    count: 4
  }
]

export function BarChartExample() {
  const [labelOnYAxis, setLabelOnYAxis] = useState(false)

  return <UIExample
    title={"BarChart"}
    code={`type ToyShape = {
  type: string
  count: number
}

const data: ToyShape[] = [
  {
    type: "Cube",
    count: 5,
  },
  {
    type: "Sphere",
    count: 4,
  },
  {
    type: "Pyramid",
    count: 4
  }
]

<Chart>
  <BarChart
    labelOnYAxis={labelOnYAxis}
    marks={data.map(toy => ({
      label: toy.type,
      value: toy.count,
    }))}
  />
</Chart>
`}
  >
    <VStack>
      <Toggle
        title={"labelOnYAxis"}
        value={labelOnYAxis}
        onChanged={setLabelOnYAxis}
      />
      <Divider />
      <Chart
        chartXVisibleDomain={10}
        frame={{
          height: 400
        }}
      >
        <BarChart
          labelOnYAxis={labelOnYAxis}
          marks={toysData.map(toy => ({
            label: toy.type,
            value: toy.count,
          }))}
        />
      </Chart>
    </VStack>
  </UIExample>
}