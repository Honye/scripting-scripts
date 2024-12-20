import { Chart, Divider, LineChart, Toggle, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"
import { toysData } from "./bar"

export function LineChartExample() {
  const [labelOnYAxis, setLabelOnYAxis] = useState(false)

  return <UIExample
    title={"LineChart"}
    code={`<Chart>
  <LineChart
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
        <LineChart
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