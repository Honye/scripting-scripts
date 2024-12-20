import { AreaChart, Chart, LineChart, RoundedRectangle, RuleLineForLabelChart, Text, useMemo, useState, ZStack } from "scripting"
import { UIExample } from "../../ui_example"

const data = [
  { sales: 1200, year: '2020', growth: 0.14, },
  { sales: 1400, year: '2021', growth: 0.16, },
  { sales: 2000, year: '2022', growth: 0.42, },
  { sales: 2500, year: '2023', growth: 0.25, },
  { sales: 3600, year: '2024', growth: 0.44, },
]

const maxScales = data.reduce((max, current) =>
  current.sales > max ? current.sales : max, 0)

export function MultipleChartsExample() {
  const [chartSelection, setChartSelection] = useState<string | null>()
  const selectedItem = useMemo(() => {
    if (chartSelection == null) {
      return null
    }
    return data.find(item => item.year === chartSelection)
  }, [chartSelection])

  return <UIExample
    title={"Multiple Charts"}
    code={`const data = [
  { sales: 1200, year: "2020", growth: 0.14, },
  { sales: 1400, year: "2021", growth: 0.16, },
  { sales: 2000, year: "2022", growth: 0.42, },
  { sales: 2500, year: "2023", growth: 0.25, },
  { sales: 3600, year: "2024", growth: 0.44, },
]

const maxScales = data.reduce((max, current) =>
current.sales > max ? current.sales : max, 0)

function MultipleChartsExample() {
  const [chartSelection, setChartSelection] = useState<string | null>()
  const selectedItem = useMemo(() => {
    if (chartSelection == null) {
      return null
    }
    return data.find(item => item.year === chartSelection)
  }, [chartSelection])
  
  return <Chart
    frame={{
      height: 300,
    }}
    chartXSelection={{
      value: chartSelection,
      onChanged: setChartSelection,
      valueType: "string"
    }}
  >
    <LineChart
      marks={data.map(item => ({
        label: item.year,
        value: item.sales,
        interpolationMethod: "catmullRom",
        symbol: "circle",
      }))}
    />
    <AreaChart
      marks={data.map(item => ({
        label: item.year,
        value: item.sales,
        interpolationMethod: "catmullRom",
        foregroundStyle: ["rgba(255,100,0,1)", "rgba(255,100,0,0.2)"]
      }))}
    />
    {selectedItem != null
      ? <RuleLineForLabelChart
        marks={[{
          label: selectedItem.year,
          foregroundStyle: { color: "gray", opacity: 0.5 },
          annotation: {
            position: "top",
            overflowResolution: {
              x: "fit",
              y: "disabled"
            },
            content: <ZStack
              padding
              background={
                <RoundedRectangle
                  cornerRadius={4}
                  fill={"regularMaterial"}
                />
              }
            >
              <Text
                foregroundStyle={"white"}
              >Sales: {selectedItem.sales}</Text>
            </ZStack>
          }
        }]}
      />
      : null}
  </Chart>
}`}
  >
    <Chart
      frame={{
        height: 300,
      }}
      chartXSelection={{
        value: chartSelection,
        onChanged: setChartSelection,
        valueType: "string"
      }}
    >
      <LineChart
        marks={data.map(item => ({
          label: item.year,
          value: item.sales,
          interpolationMethod: "catmullRom",
          symbol: "circle",
        }))}
      />
      <AreaChart
        marks={data.map(item => ({
          label: item.year,
          value: item.sales,
          interpolationMethod: "catmullRom",
          foregroundStyle: ["rgba(255,100,0,1)", "rgba(255,100,0,0.2)"]
        }))}
      />
      {selectedItem != null
        ? <RuleLineForLabelChart
          marks={[{
            label: selectedItem.year,
            foregroundStyle: { color: "gray", opacity: 0.5 },
            annotation: {
              position: "top",
              overflowResolution: {
                x: "fit",
                y: "disabled"
              },
              content: <ZStack
                padding
                background={
                  <RoundedRectangle
                    cornerRadius={4}
                    fill={"regularMaterial"}
                  />
                }
              >
                <Text
                  foregroundStyle={"white"}
                >Sales: {selectedItem.sales}</Text>
              </ZStack>
            }
          }]}
        />
        : null}
    </Chart>
  </UIExample>
}