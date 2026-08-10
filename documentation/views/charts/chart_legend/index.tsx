import { BarChart, BarChartProps, Chart, List, Navigation, NavigationStack, Picker, Script, Section, Text, useMemo, useState, Visibility, VStack, } from "scripting"

const data = [
  { color: "Green", type: "Cube", count: 2 },
  { color: "Green", type: "Sphere", count: 0 },
  { color: "Green", type: "Pyramid", count: 1 },
  { color: "Purple", type: "Cube", count: 1 },
  { color: "Purple", type: "Sphere", count: 1 },
  { color: "Purple", type: "Pyramid", count: 1 },
  { color: "Pink", type: "Cube", count: 1 },
  { color: "Pink", type: "Sphere", count: 2 },
  { color: "Pink", type: "Pyramid", count: 0 },
]

// 几种 chartLegend 形态:Visibility 字符串 + 自定义位置对象。
const legendModes = {
  automatic: "automatic" as Visibility,
  visible: "visible" as Visibility,
  hidden: "hidden" as Visibility,
  "bottom (custom)": { position: "bottom", spacing: 8 } as const,
}

type LegendModeKey = keyof typeof legendModes

function Example() {
  const [mode, setMode] = useState<LegendModeKey>("automatic")

  const marks = useMemo(() => {
    return data.map(item => ({
      label: item.type,
      value: item.count,
      positionBy: {
        value: item.color,
        axis: "horizontal",
      },
      foregroundStyleBy: item.color,
      cornerRadius: 8,
    }) as BarChartProps["marks"][0])
  }, [])

  return <NavigationStack>
    <List
      navigationTitle={"chartLegend"}
      navigationBarTitleDisplayMode={"inline"}
    >
      <Section
        footer={
          <Text>
            "visible" / "automatic" keep the auto-generated legend; "hidden" removes it.
            The last option uses the object form to move the legend to the bottom.
          </Text>
        }
      >
        <Picker
          title={"Legend"}
          value={mode}
          onChanged={value => setMode(value as LegendModeKey)}
          pickerStyle={"segmented"}
        >
          {Object.keys(legendModes).map(key =>
            <Text key={key} tag={key}>{key}</Text>
          )}
        </Picker>
      </Section>

      <VStack frame={{ height: 360 }}>
        <Chart chartLegend={legendModes[mode]}>
          <BarChart marks={marks} />
        </Chart>
      </VStack>
    </List>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()
