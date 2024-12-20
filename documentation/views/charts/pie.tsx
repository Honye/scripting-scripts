import { Chart, PieChart } from "scripting"
import { UIExample } from "../../ui_example"

let data = [
  { name: "Cachapa", sales: 9631 },
  { name: "Crêpe", sales: 6959 },
  { name: "Injera", sales: 4891 },
  { name: "Jian Bing", sales: 2506 },
  { name: "American", sales: 1777 },
  { name: "Dosa", sales: 625 },
]

export function PieChartExample() {

  return <UIExample
    title={"PieChart"}
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
  <PieChart
    marks={
      data.map(item => ({
        category: item.name,
        value: item.sales,
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
      <PieChart
        marks={
          data.map(item => ({
            category: item.name,
            value: item.sales,
          }))
        }
      />
    </Chart>
  </UIExample>
}