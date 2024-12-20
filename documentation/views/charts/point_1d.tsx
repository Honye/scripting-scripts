import { Chart, Point1DChart, Toggle, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

const data = [
  { value: 0.3 },
  { value: 0.6 },
  { value: 0.9 },
  { value: 1.3 },
  { value: 1.7 },
  { value: 1.9 },
  { value: 2 },
  { value: 2.2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 5.2 },
  { value: 5.5 },
  { value: 6 },
]

export function Point1DChartExample() {
  const [horizontal, setHorizontal] = useState(false)

  return <UIExample
    title={"Point1DChart"}
    code={`
const data = [
  { value: 2 },
  { value: 2.2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 5.2 },
  { value: 5.5 },
  { value: 6 },
]
  
<Chart>
  <Point1DChart
    horizontal={horizontal}
    marks={data}
  />
</Chart>`}
  >
    <VStack>
      <Toggle
        title={"Horizontal"}
        value={horizontal}
        onChanged={setHorizontal}
      />
      <Chart>
        <Point1DChart
          horizontal={horizontal}
          marks={data}
        />
      </Chart>
    </VStack>
  </UIExample>
}