import { Chart, HeatMapChart } from "scripting"
import { UIExample } from "../../ui_example"

const data = [
  { positive: "+", negative: "+", num: 125 },
  { positive: "+", negative: "-", num: 10 },
  { positive: "-", negative: "-", num: 80 },
  { positive: "-", negative: "+", num: 1 },
]

export function HeatMapChartExample() {

  return <UIExample
    title={"HeatMapChart"}
    code={`const data = [
  { positive: "+", negative: "+", num: 125 },
  { positive: "+", negative: "-", num: 10 },
  { positive: "-", negative: "-", num: 80 },
  { positive: "-", negative: "+", num: 1 },
]
  
<Chart
  aspectRatio={{
    value: 1,
    contentMode: 'fit'
  }}
>
  <HeatMapChart
    marks={
      data.map(item => ({
        x: item.positive,
        y: item.negative,
        value: item.num,
      }))
    }
  />
</Chart>`}
  >
    <Chart
      aspectRatio={{
        value: 1,
        contentMode: 'fit'
      }}
    >
      <HeatMapChart
        marks={
          data.map(item => ({
            x: item.positive,
            y: item.negative,
            value: item.num,
          }))
        }
      />
    </Chart>
  </UIExample>
}