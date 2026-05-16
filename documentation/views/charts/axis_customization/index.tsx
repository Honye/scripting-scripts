import { BarChart, Chart, LineChart, Navigation, NavigationStack, Script, ScrollView, Section, Text, VStack } from "scripting"

const sales = [
  { year: '2020', value: 1200 },
  { year: '2021', value: 1400 },
  { year: '2022', value: 2000 },
  { year: '2023', value: 2500 },
  { year: '2024', value: 3600 },
]

const growth = [
  { year: '2020', rate: 0.14 },
  { year: '2021', rate: 0.16 },
  { year: '2022', rate: 0.42 },
  { year: '2023', rate: 0.25 },
  { year: '2024', rate: 0.44 },
]

function Example() {
  return <NavigationStack>
    <ScrollView
      navigationTitle={"Axis Customization"}
      navigationBarTitleDisplayMode={"inline"}
    >
      <VStack
        alignment={"leading"}
        spacing={24}
        padding
      >

        {/* 1. Default axes — backward-compatible Visibility-only path. */}
        <Section
          header={
            <Text font={"headline"}>1. Default axes</Text>
          }
        >
          <Chart frame={{ height: 200 }}>
            <BarChart marks={sales.map(d => ({ label: d.year, value: d.value }))} />
          </Chart>
        </Section>

        {/* 2. Custom Y axis — stride, grid line stroke, tick length, currency format. */}
        <Section
          header={
            <Text font={"headline"}>2. Stride + dashed grid + currency labels</Text>
          }
        >
          <Chart
            frame={{ height: 220 }}
            chartYAxis={{
              values: { type: "stride", by: 1000 },
              gridLine: {
                stroke: { lineWidth: 0.5, dash: [4, 2] },
              },
              tick: { length: 6 },
              valueLabel: {
                format: "currency",
              },
            }}
          >
            <LineChart
              marks={sales.map(d => ({
                label: d.year,
                value: d.value,
                interpolationMethod: "catmullRom",
                symbol: "circle",
              }))}
            />
          </Chart>
        </Section>

        {/* 3. Explicit values + percent format — axis ticks pinned to specific values. */}
        <Section
          header={
            <Text font={"headline"}>3. Explicit values + percent labels</Text>
          }
        >
          <Chart
            frame={{ height: 220 }}
            chartYAxis={{
              values: { type: "values", values: [0, 0.1, 0.2, 0.3, 0.4, 0.5] },
              valueLabel: { format: "percent" },
            }}
          >
            <LineChart
              marks={growth.map(d => ({
                label: d.year,
                value: d.rate,
                interpolationMethod: "catmullRom",
                symbol: "circle",
              }))}
            />
          </Chart>
        </Section>

        {/* 4. Custom view label + bottom-positioned axis. Note: each tick re-renders the view. */}
        <Section
          header={
            <Text font={"headline"}>4. Custom view label (X axis)</Text>
          }
        >
          <Chart
            frame={{ height: 220 }}
            chartXAxis={{
              position: "bottom",
              gridLine: false,
              valueLabel: {
                multiLabelAlignment: "center",
                content: <Text
                  font={"caption2"}
                  fontWeight={"bold"}
                  foregroundStyle={"orange"}
                >YR</Text>,
              },
            }}
          >
            <BarChart marks={sales.map(d => ({ label: d.year, value: d.value }))} />
          </Chart>
        </Section>

        {/* 5. Hidden axes via the legacy Visibility token — still works. */}
        <Section
          header={
            <Text font={"headline"}>5. Hidden axes (legacy Visibility)</Text>
          }
        >
          <Chart
            frame={{ height: 200 }}
            chartXAxis={"hidden"}
            chartYAxis={"hidden"}
          >
            <LineChart
              marks={sales.map(d => ({
                label: d.year,
                value: d.value,
                interpolationMethod: "catmullRom",
              }))}
            />
          </Chart>
        </Section>

      </VStack>
    </ScrollView>
  </NavigationStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
