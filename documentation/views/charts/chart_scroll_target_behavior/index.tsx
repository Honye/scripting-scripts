import { BarChart, Chart, LineChart, Navigation, NavigationStack, PointChart, Script, ScrollView, Text, VStack } from "scripting"

// 60 天的"日访问量"假数据，用于演示 date 轴按日 stop / 按月 major 对齐。
const dailyData: { date: Date; visits: number }[] = (() => {
  const arr: { date: Date; visits: number }[] = []
  const start = new Date(2026, 0, 1) // 2026-01-01
  for (let i = 0; i < 60; i++) {
    const d = new Date(start.getTime() + i * 86400_000)
    // 简单合成的波动 + 偶尔尖峰
    const base = 200 + Math.round(Math.sin(i / 4) * 60)
    const spike = i % 9 === 0 ? 120 : 0
    arr.push({ date: d, visits: base + spike })
  }
  return arr
})()

// 60 个连续 index 的"评分"假数据，演示 numeric 轴按 unit=1 stop / page 主对齐。
const numericData: { x: number; y: number }[] = Array.from({ length: 60 }, (_, i) => ({
  x: i,
  y: 50 + Math.round(Math.cos(i / 3) * 25 + (i % 7 === 0 ? 18 : 0)),
}))

function Example() {
  return <NavigationStack>
    <ScrollView>
      <VStack
        navigationTitle={"Chart Scroll Target Behavior"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={28}
        padding
      >

        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          chartScrollTargetBehavior tells SwiftUI Charts where to "park" the scroll deceleration.
          Without it, scrolling a chart with chartScrollableAxes feels free-form; with it, releasing
          a swipe lands on a meaningful data boundary (a day, a month, an integer index).
          {"\n\n"}
          Pair it with chartScrollableAxes (otherwise the chart isn't scrollable, and snapping has
          nothing to act on) and chartXVisibleDomain (controls how much of the data is visible at
          once — also determines what counts as a "page").
        </Text>

        {/* 1. 日期轴：按日 stop，按月 major 对齐 */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>1. Date axis — daily stops, monthly major</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            60 days of synthetic visit data. Swipe horizontally; release and the visible window
            should snap so the leading edge sits on a day boundary, with month edges acting as the
            larger "page" alignment.
          </Text>
          <Chart
            frame={{ height: 220 }}
            chartScrollableAxes={"horizontal"}
            chartXVisibleDomain={86400 * 14}
            chartScrollTargetBehavior={{
              matching: new DateComponents({ day: 1 }),
              majorAlignment: { matching: new DateComponents({ month: 1 }) },
            }}
            chartXAxis={{
              valueLabel: { format: "date" },
            }}
          >
            <LineChart
              marks={dailyData.map(d => ({
                label: d.date,
                value: d.visits,
                // unit: "day" 告诉 Charts 每个 mark 在 X 轴上占多大 —— 否则 SDK 会回落到固定像素宽度
                // 并 log "Falling back to a fixed dimension size for a mark"。
                unit: "day",
                interpolationMethod: "monotone",
                foregroundStyle: "blue",
              }))}
            />
          </Chart>
        </VStack>

        {/* 2. 日期轴：按周 stop（page 主对齐） */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>2. Date axis — weekly stops, page major</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Same data, but stops snap on weekly boundaries (every 7 days) and the major alignment is
            the visible page. Useful when you want exactly N visible weeks per "page".
          </Text>
          <Chart
            frame={{ height: 220 }}
            chartScrollableAxes={"horizontal"}
            chartXVisibleDomain={86400 * 21}
            chartScrollTargetBehavior={{
              matching: new DateComponents({ day: 7 }),
              majorAlignment: "page",
            }}
            chartXAxis={{
              valueLabel: { format: "date" },
            }}
          >
            <BarChart
              marks={dailyData.map(d => ({
                label: d.date,
                value: d.visits,
                unit: "day",
                foregroundStyle: "orange",
              }))}
            />
          </Chart>
        </VStack>

        {/* 3. 数值轴：按 1 unit stop，page 主对齐 —— 必须用 numeric x 的 mark（PointChart），
            BarChart 的 label 是 string/Date，会走 categorical 轴，chartScrollTargetBehavior 在
            categorical 轴上不生效（SDK 限制）。 */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>3. Numeric axis — unit stops, page major</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Numeric x axis (0..59). Each scroll deceleration snaps so the leading edge lands on an
            integer; major alignment is the visible page (10 units wide). Note: this requires a
            numeric-x mark (PointChart), since BarChart's `label` field becomes a categorical String
            axis on which chartScrollTargetBehavior is silently no-op.
          </Text>
          <Chart
            frame={{ height: 220 }}
            chartScrollableAxes={"horizontal"}
            chartXVisibleDomain={10}
            chartScrollTargetBehavior={{
              unit: 1,
              majorAlignment: "page",
            }}
          >
            <PointChart
              marks={numericData.map(d => ({
                x: d.x,
                y: d.y,
                foregroundStyle: "green",
                symbolSize: 80,
              }))}
            />
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
