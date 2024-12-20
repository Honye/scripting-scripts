import { Chart, DonutChart } from "scripting"
import { UIExample } from "../../ui_example"

let data = [
  { name: "Cachapa", sales: 9631 },
  { name: "Crêpe", sales: 6959 },
  { name: "Injera", sales: 4891 },
  { name: "Jian Bing", sales: 2506 },
  { name: "American", sales: 1777 },
  { name: "Dosa", sales: 625 },
]

export function DonutChartExample() {
  return <UIExample
    title={"DonutChart"}
    code={`let data = [
  { name: "Cachapa", sales: 9631 },
  { name: "Crêpe", sales: 6959 },
  { name: "Injera", sales: 4891 },
  { name: "Jian Bing", sales: 2506 },
  { name: "American", sales: 1777 },
  { name: "Dosa", sales: 625 },
]
  
<Chart
  frame={{
    height: 300
  }}
>
  <DonutChart
    marks={
      data.map(item => ({
        category: item.name,
        value: item.sales,
        innerRadius: {
          type: 'ratio',
          value: 0.618
        },
        outerRadius: {
          type: 'inset',
          value: 10,
        },
        angularInset: 1,
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
      <DonutChart
        marks={
          data.map(item => ({
            category: item.name,
            value: item.sales,
            innerRadius: {
              type: 'ratio',
              value: 0.618
            },
            outerRadius: {
              type: 'inset',
              value: 10,
            },
            angularInset: 1,
          }))
        }
      />
    </Chart>
  </UIExample>
}