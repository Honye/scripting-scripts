import { AreaChart, Chart, Divider, Toggle, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

const data = [
  { label: "jan/22", value: 5 },
  { label: "feb/22", value: 4 },
  { label: "mar/22", value: 7 },
  { label: "apr/22", value: 15 },
  { label: "may/22", value: 14 },
  { label: "jun/22", value: 27 },
  { label: "jul/22", value: 27 },
]

export function AreaChartExample() {
  const [labelOnYAxis, setLabelOnYAxis] = useState(false)

  return <UIExample
    title={"AreaChart"}
    code={`const data = [
  { label: "jan/22", value: 5 },
  { label: "feb/22", value: 4 },
  { label: "mar/22", value: 7 },
  { label: "apr/22", value: 15 },
  { label: "may/22", value: 14 },
  { label: "jun/22", value: 27 },
  { label: "jul/22", value: 27 },
]

<Chart>
  <AreaChart
    labelOnYAxis={labelOnYAxis}
    marks={data}
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
        <AreaChart
          labelOnYAxis={labelOnYAxis}
          marks={data}
        />
      </Chart>
    </VStack>
  </UIExample>
}