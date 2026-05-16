import { AreaPlot, Chart, LinePlot, Navigation, NavigationStack, Script, ScrollView, Text, useState, VStack } from "scripting"

function Example() {
  // Drive amplitude with state to show that SwiftUI Charts re-samples the fn on every render.
  const [amplitude, setAmplitude] = useState(1)

  return <NavigationStack>
    <ScrollView>
      <VStack
        navigationTitle={"LinePlot & AreaPlot"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={28}
        padding
      >

        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          LinePlot / AreaPlot are Chart marks introduced in iOS 18+. You pass a JS function
          (not an array of samples); SwiftUI Charts samples it across the viewport at layout
          time and connects the points into a curve.
          {"\n\n"}
          The fn closure must stay pure (no setState, no external side effects). SwiftUI
          Charts re-samples it hundreds of times per layout pass, and each sample is one
          JSCore call — keep the body cheap.
        </Text>

        {/* 1. Single variable y = fn(x) */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>1. y = sin(x) — single variable</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            domain [0, 4π]. Toggle the link below to change the amplitude and watch the
            whole curve re-render (every render re-samples the function).
          </Text>
          <Chart frame={{ height: 220 }}>
            <LinePlot
              x={"X"}
              y={"Y"}
              domain={[0, Math.PI * 4]}
              fn={(x) => amplitude * Math.sin(x)}
              foregroundStyle={"blue"}
            />
          </Chart>
          <Text font={"caption2"}>amplitude: {amplitude.toFixed(2)}</Text>
          {/* Minimal amplitude toggle */}
          <Text
            foregroundStyle={"link"}
            onTapGesture={() => setAmplitude(amplitude === 1 ? 1.6 : 1)}
          >
            tap to toggle amplitude (1 ↔ 1.6)
          </Text>
        </VStack>

        {/* 2. Parametric curve (x, y) = fn(t) */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>2. Parametric — circle (cos t, sin t)</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            t ∈ [0, 2π]. fn returns a {`{ x, y }`} tuple, which the bridge converts to
            SwiftUI's (x: Double, y: Double) tuple. Traces a full circle.
          </Text>
          <Chart
            frame={{ height: 240, width: 240 }}
            chartXScale={{ from: -1.2, to: 1.2 }}
            chartYScale={{ from: -1.2, to: 1.2 }}
          >
            <LinePlot
              x={"X"}
              y={"Y"}
              t={"t"}
              domain={[0, Math.PI * 2]}
              fn={(t) => ({ x: Math.cos(t), y: Math.sin(t) })}
              foregroundStyle={"orange"}
            />
          </Chart>
        </VStack>

        {/* 3. AreaPlot — vertical band */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>3. AreaPlot — sin envelope ±0.5</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            fn returns {`{ yStart, yEnd }`}, and AreaPlot fills the vertical interval from
            yStart to yEnd at every x — typical use cases are confidence bands and envelopes.
          </Text>
          <Chart frame={{ height: 220 }}>
            <AreaPlot
              x={"X"}
              yStart={"lo"}
              yEnd={"hi"}
              domain={[0, Math.PI * 4]}
              fn={(x) => ({
                yStart: Math.sin(x) - 0.5,
                yEnd: Math.sin(x) + 0.5,
              })}
              foregroundStyle={{ color: "green", opacity: 0.35 }}
            />
            <LinePlot
              x={"X"}
              y={"Y"}
              domain={[0, Math.PI * 4]}
              fn={(x) => Math.sin(x)}
              foregroundStyle={"green"}
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
