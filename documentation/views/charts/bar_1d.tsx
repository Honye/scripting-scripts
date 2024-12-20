import { Bar1DChart, Chart } from "scripting"
import { UIExample } from "../../ui_example"

const data = [
  { type: "Gadgets", profit: 3800 },
  { type: "Gizmos", profit: 4400 },
  { type: "Widgets", profit: 6500 },
]

export function Bar1DChartExample() {

  return <UIExample
    title={"Bar1DChart"}
    code={`const data = [
  { type: "Gadgets", profit: 3800 },
  { type: "Gizmos", profit: 4400 },
  { type: "Widgets", profit: 6500 },
]
  
<Chart
  padding={0}
>
  <Bar1DChart
    marks={data.map(item => ({
      category: item.type,
      value: item.profit,
    }))}
  />
</Chart>`}
  >
    <Chart
      padding={0}
    >
      <Bar1DChart
        marks={data.map(item => ({
          category: item.type,
          value: item.profit,
        }))}
      />
    </Chart>
  </UIExample>
}