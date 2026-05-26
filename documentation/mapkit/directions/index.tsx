import {
  Button, HStack, Map, MapPolyline, Marker, Navigation, NavigationStack, Picker,
  Script, ScrollView, Text, useEffect, useObservable, useState, VStack,
} from "scripting"

// Shanghai landmarks used across the demos.
const PEOPLES_SQUARE = { latitude: 31.2304, longitude: 121.4737 }
const BUND = { latitude: 31.2407, longitude: 121.4905 }
const LUJIAZUI = { latitude: 31.2397, longitude: 121.4994 }

const initialRegion = {
  center: { latitude: 31.2354, longitude: 121.4905 },
  span: { latitudeDelta: 0.04, longitudeDelta: 0.04 },
}

// Phase 3e: distance / duration formatting delegates to MapUtils, which wraps
// MKDistanceFormatter / DateComponentsFormatter so the output respects the
// device locale.
const fmtDistance = (meters: number) => MapUtils.formatDistance(meters)
const fmtDuration = (seconds: number) => MapUtils.formatDuration(seconds)

// ───────────────────────────────────────────────────────────────────────
// Demo 1: calculate a single route and render the polyline
// ───────────────────────────────────────────────────────────────────────
function SingleRouteDemo() {
  // Phase 3g: 拿到完整 response 而不是单挑 route — 这样 source / destination 的
  // MapItem 可以直接喂给 <Marker item={...}>,触发 Apple 的 auto POI glyph。
  const [resp, setResp] = useState<MapDirections.DirectionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(initialRegion))

  const route = resp?.routes[0] ?? null

  const calc = async () => {
    setLoading(true); setErr(null)
    try {
      const r = await MapDirections.calculate({
        source: { coordinate: PEOPLES_SQUARE, name: "People's Square" },
        destination: { coordinate: LUJIAZUI, name: "Lujiazui" },
        transportType: "automobile",
      })
      setResp(r)
      const fit = MapUtils.regionFromCoordinates(r.routes[0].coordinates, 0.2)
      if (fit) position.setValue(MapCameraPosition.region(fit))
    } catch (e) {
      setErr(String(e))
    } finally {
      setLoading(false)
    }
  }

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>1. Calculate + render</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      {`Drive from People's Square to Lujiazui. The returned \`route.coordinates\` polyline
      feeds straight into \`<MapPolyline coordinates={...}>\`; the response's
      \`source\` / \`destination\` MapItems are dropped into \`<Marker item={...}>\`
      so MapKit picks the POI glyph automatically.`}
    </Text>
    <HStack spacing={8}>
      <Button title={loading ? "Calculating..." : "Calculate"} action={calc} />
      {route != null
        ? <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          {fmtDistance(route.distance)} · {fmtDuration(route.expectedTravelTime)} · {route.steps.length} steps
        </Text>
        : null}
    </HStack>
    {err != null
      ? <Text font={"caption"} foregroundStyle={"systemRed"}>{err}</Text>
      : null}
    <Map
      cameraPosition={position}
      frame={{ height: 280 }}
      clipShape={{ type: "rect", cornerRadius: 12 }}
    >
      {resp != null
        ? <>
          {/* MapItem 形态:title / coordinate / glyph 都由 MapKit 自己挑。 */}
          <Marker item={resp.source} tint="systemGreen" />
          <Marker item={resp.destination} tint="systemRed" />
        </>
        : <>
          {/* 路线还没算出来时回落到坐标形态。 */}
          <Marker title="Start" coordinate={PEOPLES_SQUARE} tint="systemGreen" />
          <Marker title="End" coordinate={LUJIAZUI} tint="systemRed" />
        </>}
      {route != null
        ? <MapPolyline
          coordinates={route.coordinates}
          strokeColor="systemBlue"
          strokeStyle={{ lineWidth: 4, lineCap: "round", lineJoin: "round" }}
        />
        : null}
    </Map>
  </VStack>
}

// ───────────────────────────────────────────────────────────────────────
// Demo 2: switch transportType and watch the route change shape / length
// ───────────────────────────────────────────────────────────────────────
function TransportTypeDemo() {
  type Mode = "automobile" | "walking"
  const [mode, setMode] = useState<Mode>("walking")
  const [resp, setResp] = useState<MapDirections.DirectionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(initialRegion))

  const route = resp?.routes[0] ?? null

  useEffect(() => {
    let cancelled = false
    setLoading(true); setErr(null)
    MapDirections.calculate({
      source: { coordinate: BUND, name: "Bund" },
      destination: { coordinate: LUJIAZUI, name: "Lujiazui" },
      transportType: mode,
    }).then(r => {
      if (cancelled) return
      setResp(r)
      const fit = MapUtils.regionFromCoordinates(r.routes[0].coordinates, 0.2)
      if (fit) position.setValue(MapCameraPosition.region(fit))
    }).catch(e => {
      if (cancelled) return
      setErr(String(e))
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [mode])

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>2. transportType switch</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      Same start/end (Bund → Lujiazui) but different transport mode. Driving prefers
      bridges + roads; walking takes a much more direct path.
    </Text>
    <Picker
      title="Mode"
      value={mode}
      onChanged={(v: any) => setMode(v as Mode)}
      pickerStyle={"segmented"}
    >
      <Text tag={"automobile"}>automobile</Text>
      <Text tag={"walking"}>walking</Text>
    </Picker>
    {loading ? <Text font={"caption2"}>Calculating...</Text> : null}
    {err != null ? <Text font={"caption"} foregroundStyle={"systemRed"}>{err}</Text> : null}
    {route != null
      ? <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
        {route.transportType} · {fmtDistance(route.distance)} · {fmtDuration(route.expectedTravelTime)}
      </Text>
      : null}
    <Map
      cameraPosition={position}
      frame={{ height: 260 }}
      clipShape={{ type: "rect", cornerRadius: 12 }}
    >
      {resp != null
        ? <>
          <Marker item={resp.source} tint="systemRed" />
          <Marker item={resp.destination} tint="systemPurple" />
        </>
        : <>
          <Marker title="Bund" coordinate={BUND} tint="systemRed" />
          <Marker title="Lujiazui" coordinate={LUJIAZUI} tint="systemPurple" />
        </>}
      {route != null
        ? <MapPolyline
          coordinates={route.coordinates}
          strokeColor={mode === "walking" ? "systemTeal" : "systemBlue"}
          strokeStyle={{ lineWidth: 4, lineCap: "round" }}
        />
        : null}
    </Map>
  </VStack>
}

// ───────────────────────────────────────────────────────────────────────
// Demo 3: alternates — render multiple routes side by side
// ───────────────────────────────────────────────────────────────────────
const ALTERNATE_COLORS = ["systemBlue", "systemOrange", "systemPurple"] as const

function AlternatesDemo() {
  const [resp, setResp] = useState<MapDirections.DirectionsResponse | null>(null)
  // 选中的 route 在地图上 stroke 加粗 + 不透明,未选中的回落到细 + 半透明,
  // 视觉上把"导航选了哪条"立刻表达清楚。
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(initialRegion))

  const routes = resp?.routes ?? []

  const calc = async () => {
    setLoading(true); setErr(null)
    try {
      const r = await MapDirections.calculate({
        source: { coordinate: PEOPLES_SQUARE, name: "People's Square" },
        destination: { coordinate: LUJIAZUI, name: "Lujiazui" },
        transportType: "automobile",
        requestsAlternateRoutes: true,
      })
      setResp(r)
      setSelectedIdx(0)
      const allCoords = r.routes.flatMap(rt => rt.coordinates)
      const fit = MapUtils.regionFromCoordinates(allCoords, 0.2)
      if (fit) position.setValue(MapCameraPosition.region(fit))
    } catch (e) {
      setErr(String(e))
    } finally {
      setLoading(false)
    }
  }

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>3. Alternates + selection</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      {`\`requestsAlternateRoutes: true\` may return up to 3 driving routes. Tap a row
      below to highlight that route — the selected polyline renders thicker and
      fully opaque, others fade to make the choice obvious.`}
    </Text>
    <HStack spacing={8}>
      <Button title={loading ? "Calculating..." : "Calculate (with alternates)"} action={calc} />
    </HStack>
    {err != null ? <Text font={"caption"} foregroundStyle={"systemRed"}>{err}</Text> : null}
    <VStack alignment={"leading"} spacing={4}>
      {routes.map((r, i) => {
        const isSelected = i === selectedIdx
        const color = ALTERNATE_COLORS[i % ALTERNATE_COLORS.length]
        return <Button
          key={i}
          action={() => setSelectedIdx(i)}
          buttonStyle={isSelected ? "borderedProminent" : "bordered"}
          tint={color}
        >
          <HStack spacing={8}>
            <Text font={"caption"} foregroundStyle={isSelected ? "white" : color}>
              {`${i + 1}. ${r.name || "(unnamed)"}`}
            </Text>
            <Text font={"caption2"} foregroundStyle={isSelected ? "white" : "secondaryLabel"}>
              {`${fmtDistance(r.distance)} · ${fmtDuration(r.expectedTravelTime)}`}
            </Text>
          </HStack>
        </Button>
      })}
    </VStack>
    <Map
      cameraPosition={position}
      frame={{ height: 280 }}
      clipShape={{ type: "rect", cornerRadius: 12 }}
    >
      {resp != null
        ? <>
          <Marker item={resp.source} tint="systemGreen" />
          <Marker item={resp.destination} tint="systemRed" />
        </>
        : <>
          <Marker title="Start" coordinate={PEOPLES_SQUARE} tint="systemGreen" />
          <Marker title="End" coordinate={LUJIAZUI} tint="systemRed" />
        </>}
      {/* 未选中的先画(细),选中的最后画压在上面(粗)。MapPolyline 目前不接收
          opacity / 视图层 modifier,这里用 stroke width(3 vs 6)制造主次对比。 */}
      {routes.map((r, i) => {
        if (i === selectedIdx) return null
        return <MapPolyline
          key={`alt-${i}`}
          coordinates={r.coordinates}
          strokeColor={ALTERNATE_COLORS[i % ALTERNATE_COLORS.length]}
          strokeStyle={{ lineWidth: 3, lineCap: "round" }}
        />
      })}
      {routes[selectedIdx] != null
        ? <MapPolyline
          key={`sel-${selectedIdx}`}
          coordinates={routes[selectedIdx].coordinates}
          strokeColor={ALTERNATE_COLORS[selectedIdx % ALTERNATE_COLORS.length]}
          strokeStyle={{ lineWidth: 6, lineCap: "round", lineJoin: "round" }}
        />
        : null}
    </Map>
  </VStack>
}

// ───────────────────────────────────────────────────────────────────────
// Demo 4: calculateETA — time / distance only, no geometry download
// ───────────────────────────────────────────────────────────────────────
function ETADemo() {
  type Mode = "automobile" | "walking"
  const [mode, setMode] = useState<Mode>("automobile")
  const [eta, setEta] = useState<MapDirections.ETAResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const calc = async () => {
    setLoading(true); setErr(null)
    try {
      const result = await MapDirections.calculateETA({
        source: { coordinate: PEOPLES_SQUARE, name: "People's Square" },
        destination: { coordinate: LUJIAZUI, name: "Lujiazui" },
        transportType: mode,
        departureDate: new Date(),
      })
      setEta(result)
    } catch (e) {
      setErr(String(e))
    } finally {
      setLoading(false)
    }
  }

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>4. `calculateETA`</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      Skip the polyline download; get back travel time / distance / arrival window only.
      Cheaper than `calculate` when the UI just needs a headline number.
    </Text>
    <Picker
      title="Mode"
      value={mode}
      onChanged={(v: any) => setMode(v as Mode)}
      pickerStyle={"segmented"}
    >
      <Text tag={"automobile"}>automobile</Text>
      <Text tag={"walking"}>walking</Text>
    </Picker>
    <HStack spacing={8}>
      <Button title={loading ? "Calculating..." : "Calculate ETA"} action={calc} />
    </HStack>
    {err != null ? <Text font={"caption"} foregroundStyle={"systemRed"}>{err}</Text> : null}
    {eta != null
      ? <VStack alignment={"leading"} spacing={2}>
        <Text font={"caption"}>{`Travel: ${fmtDuration(eta.expectedTravelTime)}`}</Text>
        <Text font={"caption"}>{`Distance: ${fmtDistance(eta.distance)}`}</Text>
        <Text font={"caption2"} foregroundStyle={"secondaryLabel"}>
          {`Depart: ${eta.expectedDepartureDate.toLocaleTimeString()}`}
        </Text>
        <Text font={"caption2"} foregroundStyle={"secondaryLabel"}>
          {`Arrive: ${eta.expectedArrivalDate.toLocaleTimeString()}`}
        </Text>
      </VStack>
      : null}
  </VStack>
}

function Example() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle="Map Directions"
      toolbar={{
        cancellationAction: <Button
          title="Close"
          action={dismiss}
        />
      }}
    >
      <VStack
        navigationTitle={"MapDirections"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={20}
        padding
      >
        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          {`\`MapDirections.calculate(...)\` returns route polylines that plug straight into
          \`<MapPolyline coordinates={...}>\`. \`MapDirections.calculateETA(...)\` returns
          time / distance only — handy when you don't need the geometry. No system
          permissions required.`}
        </Text>
        <SingleRouteDemo />
        <TransportTypeDemo />
        <AlternatesDemo />
        <ETADemo />
      </VStack>
    </ScrollView>
  </NavigationStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
