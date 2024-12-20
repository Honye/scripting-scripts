import { BarGanttChart, Chart } from "scripting"
import { UIExample } from "../../ui_example"

const data = [
  { job: "Job 1", start: 0, end: 15 },
  { job: "Job 2", start: 5, end: 25 },
  { job: "Job 1", start: 20, end: 35 },
  { job: "Job 1", start: 40, end: 55 },
  { job: "Job 2", start: 30, end: 60 },
  { job: "Job 2", start: 30, end: 60 },
]

export function BarGanttChartExample() {

  return <UIExample
    title={"BarGanttChart"}
    code={`const data = [
  { job: "Job 1", start: 0, end: 15 },
  { job: "Job 2", start: 5, end: 25 },
  { job: "Job 1", start: 20, end: 35 },
  { job: "Job 1", start: 40, end: 55 },
  { job: "Job 2", start: 30, end: 60 },
  { job: "Job 2", start: 30, end: 60 },
]
  
<Chart>
  <BarGanttChart
    labelOnYAxis
    marks={data.map(item => ({
      label: item.job,
      start: item.start,
      end: item.end
    }))}
  />
</Chart>`}
  >
    <Chart>
      <BarGanttChart
        labelOnYAxis
        marks={data.map(item => ({
          label: item.job,
          start: item.start,
          end: item.end
        }))}
      />
    </Chart>
  </UIExample>
}