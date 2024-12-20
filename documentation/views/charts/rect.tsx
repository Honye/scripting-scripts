import { Chart, Divider, RectChart, Toggle, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"
import { toysData } from "./bar"

export function RectChartExample() {
  const [labelOnYAxis, setLabelOnYAxis] = useState(false)

  return <UIExample
    title={"RectChart"}
    code={`<Chart>
  <RectChart
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
      <Chart>
        <RectChart
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