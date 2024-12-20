import { Chart, Divider, LineCategoryChart, Toggle, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"
import { toyWithColorData } from "./bar_stack"

const data = [
  { label: "Production", value: 4000, category: "Gizmos" },
  { label: "Production", value: 5000, category: "Gadgets" },
  { label: "Production", value: 6000, category: "Widgets" },
  { label: "Marketing", value: 2000, category: "Gizmos" },
  { label: "Marketing", value: 1000, category: "Gadgets" },
  { label: "Marketing", value: 5000.9, category: "Widgets" },
  { label: "Finance", value: 2000.5, category: "Gizmos" },
  { label: "Finance", value: 3000, category: "Gadgets" },
  { label: "Finance", value: 5000, category: "Widgets" },
]

export function LineCategoryChartExample() {
  const [labelOnYAxis, setLabelOnYAxis] = useState(false)

  return <UIExample
    title={"LineCategoryChart"}
    code={`const data = [
  { label: "Production", value: 4000, category: "Gizmos" },
  { label: "Production", value: 5000, category: "Gadgets" },
  { label: "Production", value: 6000, category: "Widgets" },
  { label: "Marketing", value: 2000, category: "Gizmos" },
  { label: "Marketing", value: 1000, category: "Gadgets" },
  { label: "Marketing", value: 5000.9, category: "Widgets" },
  { label: "Finance", value: 2000.5, category: "Gizmos" },
  { label: "Finance", value: 3000, category: "Gadgets" },
  { label: "Finance", value: 5000, category: "Widgets" },
]

<Chart>
  <LineCategoryChart
    labelOnYAxis={labelOnYAxis}
    marks={data}
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
          height: 300
        }}
      >
        <LineCategoryChart
          labelOnYAxis={labelOnYAxis}
          marks={data}
        />
      </Chart>
    </VStack>
  </UIExample>
}