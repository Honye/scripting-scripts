import { Chart, PointChart, RectAreaChart } from "scripting"
import { UIExample } from "../../ui_example"

const data = [
  { x: 5, y: 5 },
  { x: 2.5, y: 2.5 },
  { x: 3, y: 3 },
]

export function RectAreaChartExample() {
  return <UIExample
    title={"RectAreaChart"}
    code={`const data = [
  { x: 5, y: 5 },
  { x: 2.5, y: 2.5 },
  { x: 3, y: 3 },
]
  
<Chart
  frame={{
    height: 300
  }}
>
  <RectAreaChart
    marks={
      data.map(item => ({
        xStart: item.x - 0.25,
        xEnd: item.x + 0.25,
        yStart: item.y - 0.25,
        yEnd: item.y + 0.25,
        opacity: 0.2,
      }))
    }
  />

  <PointChart
    marks={data}
  />
</Chart>`}
  >
    <Chart
      frame={{
        height: 300
      }}
    >
      <RectAreaChart
        marks={
          data.map(item => ({
            xStart: item.x - 0.25,
            xEnd: item.x + 0.25,
            yStart: item.y - 0.25,
            yEnd: item.y + 0.25,
            opacity: 0.2,
          }))
        }
      />

      <PointChart
        marks={data}
      />
    </Chart>
  </UIExample>
}