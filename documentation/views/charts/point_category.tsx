import { Chart, Picker, PointCategoryChart, Text, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

const favoriteFruitsData = [
  { fruit: 'Apple', age: 10, count: 42 },
  { fruit: 'Apple', age: 20, count: 37 },
  { fruit: 'Apple', age: 30, count: 11 },

  { fruit: 'Bananer', age: 10, count: 23 },
  { fruit: 'Bananer', age: 20, count: 58 },
  { fruit: 'Bananer', age: 30, count: 79 },

  { fruit: 'Orange', age: 10, count: 36 },
  { fruit: 'Orange', age: 20, count: 24 },
  { fruit: 'Orange', age: 30, count: 62 },
]

export function PointCategoryChartExample() {
  const [representsDataUsing, setRepresentsDataUsing] = useState<string>('foregroundStyle')
  const options: string[] = [
    'foregroundStyle',
    'symbol',
    'symbolSize'
  ]

  return <UIExample
    title={"PointCategoryChart"}
    code={`
const favoriteFruitsData = [
  { fruit: 'Apple', age: 10, count: 42 },
  { fruit: 'Apple', age: 20, count: 37 },
  { fruit: 'Apple', age: 30, count: 11 },

  { fruit: 'Bananer', age: 10, count: 23 },
  { fruit: 'Bananer', age: 20, count: 58 },
  { fruit: 'Bananer', age: 30, count: 79 },

  { fruit: 'Orange', age: 10, count: 36 },
  { fruit: 'Orange', age: 20, count: 24 },
  { fruit: 'Orange', age: 30, count: 62 },
]
  
<Chart
  frame={{
    height: 300
  }}
>
  <PointCategoryChart
    representsDataUsing={'foregroundStyle'}
    marks={favoriteFruitsData.map(item => ({
      category: item.fruit,
      x: item.age,
      y: item.count,
    }))}
  />
</Chart>`}
  >
    <VStack>
      <Picker
        title={"representsDataUsing"}
        value={representsDataUsing}
        onChanged={setRepresentsDataUsing}
        pickerStyle={"menu"}
      >
        {options.map(option =>
          <Text tag={option}>{option}</Text>
        )}
      </Picker>
      <Chart
        frame={{
          height: 300
        }}
      >
        <PointCategoryChart
          representsDataUsing={representsDataUsing as any}
          marks={favoriteFruitsData.map(item => ({
            category: item.fruit,
            x: item.age,
            y: item.count,
          }))}
        />
      </Chart>
    </VStack>
  </UIExample>
}