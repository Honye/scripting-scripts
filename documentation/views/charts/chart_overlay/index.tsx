import { BarChart, Chart, ChartGesture, ChartOverlay, ChartPlotStyle, Color, DragGesture, GeometryReader, LineChart, Navigation, NavigationStack, PointChart, Rectangle, RoundedRectangle, RuleLineForLabelChart, Script, ScrollView, Spacer, Text, useState, VStack, ZStack } from "scripting"

const data = [
  { year: '2020', sales: 1200 },
  { year: '2021', sales: 1400 },
  { year: '2022', sales: 2000 },
  { year: '2023', sales: 2500 },
  { year: '2024', sales: 3600 },
]

function Example() {
  // Section 1 — single-value selection (existing API; shown alongside overlay-driven tooltip).
  const [hover, setHover] = useState<string | null>(null)
  const hoverPoint = hover != null ? data.find(d => d.year === hover) : null

  // Section 2 — range selection on a NUMERIC X axis (categorical String axes do
  // NOT respond to range-selection gestures in SwiftUI Charts; SDK limitation).
  const [range, setRange] = useState<{ from: number; to: number } | null>(null)
  const [rawDetails, setRawDetails] = useState<string>("(awaiting range gesture)")
  const inRangeIdx = (i: number) =>
    range != null && i >= range.from && i <= range.to

  // Section 3 — single-finger drag-range via <ChartGesture>. We feed pixel coords to
  // proxy.selectXRange so it works on a continuous axis even WITHOUT the SDK's default
  // two-finger gesture. Only number / date axes are supported; categorical String axes
  // can't reverse-map pixels back to a category, so they don't work even via this path.
  const [gestureRange, setGestureRange] = useState<{ from: number; to: number } | null>(null)
  const inGestureRange = (i: number) =>
    gestureRange != null && i >= gestureRange.from && i <= gestureRange.to

  return <NavigationStack>
    <ScrollView>
      <VStack
        navigationTitle={"Chart Overlay & Range Selection"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={32}
        padding
      >

        {/* 1. ChartOverlay: hit-test → custom tooltip */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>1. ChartOverlay tooltip (hit-test via ChartProxy)</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}
            styledText={{
              content: [
                {
                  content: "Tap or drag on the chart. The overlay reads the X coordinate via",
                  font: "caption",
                  foregroundColor: "secondaryLabel",
                },
                {
                  content: " proxy.value({atX, as: 'string'})",
                  font: "caption",
                  foregroundColor: "label",
                  monospaced: true,
                },
                {
                  content: "and draws a custom annotation.",
                  font: "caption",
                  foregroundColor: "secondaryLabel",
                },
              ]
            }}
          />
          <Chart
            frame={{ height: 240 }}
            chartXSelection={{
              value: hover,
              onChanged: (v: any) => {
                setHover(v ?? null)
              },
              valueType: "string",
            }}
          >
            <LineChart
              marks={data.map(d => ({
                label: d.year,
                value: d.sales,
                interpolationMethod: "catmullRom",
                symbol: "circle",
                // VoiceOver 三件套：以 mark 为单位 override SDK 默认拼接的 label/value。
                // 开启 VoiceOver 后，左右滑动每个圆点会朗读这里的字符串而不是默认的 "Year 2024 Sales 3600"。
                accessibilityLabel: `Year ${d.year}`,
                accessibilityValue: `${d.sales} dollars`,
              }))}
            />
            {hoverPoint != null
              ? <RuleLineForLabelChart
                marks={[{
                  label: hoverPoint.year,
                  foregroundStyle: { color: "gray", opacity: 0.4 },
                }]}
              />
              : null}
            <ChartOverlay alignment={"topLeading"}>
              {(proxy) => (
                hoverPoint == null
                  ? <Spacer />
                  : <ZStack
                    padding={6}
                    background={
                      <RoundedRectangle cornerRadius={4} fill={"regularMaterial"} />
                    }
                  >
                    <Text font={"caption2"}>
                      {hoverPoint.year}: ${hoverPoint.sales}
                    </Text>
                  </ZStack>
              )}
            </ChartOverlay>
          </Chart>
        </VStack>

        {/* 2. Range selection: NUMERIC X axis (PointChart). String axes do not respond. */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>2. Range selection (chartXSelection range form)</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            On iOS, the default range-selection gesture is a TWO-FINGER tap on the chart
            (in Simulator: hold ⌥ Option then click). On macOS it's a drag.
            Selected: {range == null ? "(none)" : `${range.from} → ${range.to}`}
          </Text>
          <Text font={"caption2"} foregroundStyle={"orange"} monospaced>
            raw onChanged details: {rawDetails}
          </Text>
          <Chart
            frame={{ height: 240 }}
            chartXSelection={{
              valueType: "number",
              from: range?.from,
              to: range?.to,
              onChanged: (v: any) => {
                setRawDetails(JSON.stringify(v))
                setRange(v)
              },
            }}
          >
            <PointChart
              marks={data.map((d, i) => ({
                x: i,
                y: d.sales,
                foregroundStyle: inRangeIdx(i) ? "orange" : "gray",
                symbolSize: inRangeIdx(i) ? 120 : 60,
              }))}
            />
          </Chart>
        </VStack>

        {/* 3. Single-finger drag-range via <ChartGesture> (number axis). */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>3. Single-finger drag-range (chartGesture)</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Drag with a single finger anywhere on the chart — covered points turn orange.
            chartGesture takes over the chart's gesture handling, so this works without the
            two-finger default. Pair with chartXSelection(range:) to get bound data values.
            {"\n"}Selected: {gestureRange == null ? "(none)" : `${gestureRange.from} → ${gestureRange.to}`}
          </Text>
          <Chart
            frame={{ height: 240 }}
            chartXSelection={{
              valueType: "number",
              from: gestureRange?.from,
              to: gestureRange?.to,
              onChanged: setGestureRange,
            }}
          >
            <PointChart
              marks={data.map((d, i) => ({
                x: i,
                y: d.sales,
                foregroundStyle: inGestureRange(i) ? "orange" : "blue",
                symbolSize: inGestureRange(i) ? 120 : 60,
              }))}
            />
            <ChartGesture>
              {(proxy) =>
                DragGesture({ minDistance: 0 })
                  .onChanged(v => proxy.selectXRange({
                    from: v.startLocation.x,
                    to: v.location.x,
                  }))
              }
            </ChartGesture>
          </Chart>
        </VStack>

        {/* 4. ChartAxisLabelFormat — Y 轴用 currency / number 精度形态 */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>4. ChartAxisLabelFormat (axis label precision)</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Two charts share the same data; the only difference is the Y-axis valueLabel.format.
            Top chart uses the short token "currency" (default fraction digits, device locale).
            Bottom chart uses ChartAxisLabelFormat.currency with explicit fractionDigits + currencyCode.
          </Text>

          <Text font={"caption2"} foregroundStyle={"label"}>
            Top: format: 'currency'
          </Text>
          <Chart
            frame={{ height: 180 }}
            chartYAxis={{
              valueLabel: {
                format: 'currency',
              },
            }}
          >
            <BarChart
              marks={data.map(d => ({
                label: d.year,
                value: d.sales,
                foregroundStyle: "blue",
              }))}
            />
          </Chart>

          <Text font={"caption2"} foregroundStyle={"label"}>
            Bottom: format: ChartAxisLabelFormat.currency({"{"} currencyCode: "CNY", fractionDigits: 2 {"}"})
          </Text>
          <Chart
            frame={{ height: 180 }}
            chartYAxis={{
              valueLabel: {
                format: ChartAxisLabelFormat.currency({
                  currencyCode: "CNY",
                  fractionDigits: 2,
                }),
              },
            }}
          >
            <BarChart
              marks={data.map(d => ({
                label: d.year,
                value: d.sales,
                foregroundStyle: "orange",
              }))}
            />
          </Chart>

          <Text font={"caption2"} foregroundStyle={"label"}>
            Plain number with one fraction digit:
          </Text>
          <Chart
            frame={{ height: 180 }}
            chartYAxis={{
              valueLabel: {
                format: ChartAxisLabelFormat.number({
                  fractionDigits: 1,
                  minFractionDigits: 1,
                }),
              },
            }}
          >
            <BarChart
              marks={data.map(d => ({
                label: d.year,
                value: d.sales,
                foregroundStyle: "green",
              }))}
            />
          </Chart>
        </VStack>

        {/* 5. ChartPlotStyle — plot 区域自定义视觉 */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>5. ChartPlotStyle (custom plot-area styling)</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            ChartPlotStyle is a reader-style child whose closure receives a builder proxy.
            Each chained call accumulates an op (background / border / frame / shadow / ...);
            on the Swift side the bridge replays the ops on the real ChartPlotContent view.
          </Text>

          <Text font={"caption2"} foregroundStyle={"label"}>
            5a. background + border (gray fill, 1pt gray outline):
          </Text>
          <Chart frame={{ height: 180 }}>
            <BarChart
              marks={data.map(d => ({
                label: d.year,
                value: d.sales,
                foregroundStyle: "blue",
              }))}
            />
            <ChartPlotStyle>
              {(plot) =>
                plot
                  .background({ color: "gray", opacity: 0.12 })
                  .border({ color: "gray", width: 1 })
              }
            </ChartPlotStyle>
          </Chart>

          <Text font={"caption2"} foregroundStyle={"label"}>
            5b. material background + corner radius (regularMaterial, 12pt rounded corners):
          </Text>
          <Chart frame={{ height: 180 }}>
            <BarChart
              marks={data.map(d => ({
                label: d.year,
                value: d.sales,
                foregroundStyle: "orange",
              }))}
            />
            <ChartPlotStyle>
              {(plot) =>
                plot
                  .background({ material: "regularMaterial" })
                  .cornerRadius(12)
              }
            </ChartPlotStyle>
          </Chart>

          <Text font={"caption2"} foregroundStyle={"label"}>
            5c. shadow + frame (drop shadow + fixed plot height):
          </Text>
          <Chart frame={{ height: 200 }}>
            <BarChart
              marks={data.map(d => ({
                label: d.year,
                value: d.sales,
                foregroundStyle: "green",
              }))}
            />
            <ChartPlotStyle>
              {(plot) =>
                plot
                  .background({ color: "white" })
                  .shadow({ color: "gray", radius: 6, x: 0, y: 2 })
                  .frame({ height: 140 })
              }
            </ChartPlotStyle>
          </Chart>
        </VStack>

      </VStack>
    </ScrollView>
  </NavigationStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
