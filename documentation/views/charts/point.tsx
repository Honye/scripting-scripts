import { Chart, PointChart } from "scripting"
import { UIExample } from "../../ui_example"

const data = [
  { x: 0, y: 2 },
  { x: 1, y: 3 },
  { x: 2, y: 4 },
  { x: 3, y: 3 },
  { x: 4, y: 6 },
]

export function PointChartExample() {

  return <UIExample
    title={"PointChart"}
    code={`
const data = [
  { x: 0, y: 2 },
  { x: 1, y: 3 },
  { x: 2, y: 4 },
  { x: 3, y: 3 },
  { x: 4, y: 6 },
]
  
<Chart
      frame={{
        height: 300
      }}>
      <PointChart
        marks={data}
      />
    </Chart>`}
  >
    <Chart
      frame={{
        height: 300
      }}>
      <PointChart
        marks={data}
      />
    </Chart>
  </UIExample>
}