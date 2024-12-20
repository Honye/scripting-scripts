import { Chart, RuleChart } from "scripting"
import { UIExample } from "../../ui_example"

const data = [
  { startMonth: 1, numMonths: 9, source: "Trees" },
  { startMonth: 12, numMonths: 1, source: "Trees" },
  { startMonth: 3, numMonths: 8, source: "Grass" },
  { startMonth: 4, numMonths: 8, source: "Weeds" },
]

export function RuleChartExample() {

  return <UIExample
    title={"RuleChart"}
    code={`
const data = [
  { startMonth: 1, numMonths: 9, source: "Trees" },
  { startMonth: 12, numMonths: 1, source: "Trees" },
  { startMonth: 3, numMonths: 8, source: "Grass" },
  { startMonth: 4, numMonths: 8, source: "Weeds" },
]
  
<Chart
  frame={{
    height: 300
  }}
>
  <RuleChart
    labelOnYAxis
    marks={
      data.map(item => ({
        start: item.startMonth,
        end: item.startMonth + item.numMonths,
        label: item.source,
      }))
    }
  />
</Chart>`}
  >
    <Chart
      frame={{
        height: 300
      }}
    >
      <RuleChart
        labelOnYAxis
        marks={
          data.map(item => ({
            start: item.startMonth,
            end: item.startMonth + item.numMonths,
            label: item.source,
          }))
        }
      />
    </Chart>
  </UIExample>
}