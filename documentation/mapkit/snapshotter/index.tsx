import {
  Button, Color, HStack, Image, MapCoordinate, MapRegion, Navigation, NavigationStack,
  Picker, Script, ScrollView, Text, useState, VStack, ZStack,
} from "scripting"

type POI = { name: string; coord: MapCoordinate; tint: Color }

type PresetDef = {
  region: MapRegion
  pois: POI[]
}

// Each preset ships with a couple of named POIs nearby — typical
// "widget preview" pattern: render a static map with multiple labeled pins.
const PRESETS: Record<string, PresetDef> = {
  bund: {
    region: {
      center: { latitude: 31.2407, longitude: 121.4905 },
      span: { latitudeDelta: 0.025, longitudeDelta: 0.025 },
    },
    pois: [
      { name: "Bund", coord: { latitude: 31.2407, longitude: 121.4905 }, tint: "systemRed" },
      { name: "Lujiazui", coord: { latitude: 31.2397, longitude: 121.4994 }, tint: "systemBlue" },
      { name: "Yu Garden", coord: { latitude: 31.2275, longitude: 121.4920 }, tint: "systemPurple" },
    ],
  },
  apple_park: {
    region: {
      center: { latitude: 37.3349, longitude: -122.0090 },
      span: { latitudeDelta: 0.015, longitudeDelta: 0.015 },
    },
    pois: [
      { name: "Apple Park", coord: { latitude: 37.3349, longitude: -122.0090 }, tint: "systemRed" },
      { name: "Visitor Center", coord: { latitude: 37.3327, longitude: -122.0053 }, tint: "systemTeal" },
    ],
  },
  golden_gate: {
    region: {
      center: { latitude: 37.8199, longitude: -122.4783 },
      span: { latitudeDelta: 0.025, longitudeDelta: 0.025 },
    },
    pois: [
      { name: "Bridge North", coord: { latitude: 37.8324, longitude: -122.4795 }, tint: "systemOrange" },
      { name: "Bridge South", coord: { latitude: 37.8070, longitude: -122.4750 }, tint: "systemOrange" },
      { name: "Fort Point", coord: { latitude: 37.8104, longitude: -122.4769 }, tint: "systemBrown" },
    ],
  },
}

type Preset = keyof typeof PRESETS

const SNAP_W = 320
const SNAP_H = 220

function Example() {
  const [preset, setPreset] = useState<Preset>("bund")
  const [style, setStyle] = useState<"standard" | "imagery" | "hybrid">("standard")
  const [appearance, setAppearance] = useState<"light" | "dark">("light")
  const [snap, setSnap] = useState<MapSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const def = PRESETS[preset]

  const take = async () => {
    setLoading(true); setErr(null)
    try {
      const result = await MapSnapshotter.take({
        region: def.region,
        size: { width: SNAP_W, height: SNAP_H },
        mapStyle: { style },
        appearance,
      })
      setSnap(result)
    } catch (e) {
      setErr(String(e))
    } finally {
      setLoading(false)
    }
  }

  // For each POI of the active preset, project the geo coordinate onto the
  // snapshot's point space. Clip to snapshot bounds so off-screen pins drop
  // out instead of bleeding past the image edge.
  const overlays = snap != null
    ? def.pois.map(p => {
        const pt = snap.point(p.coord)
        const inBounds =
          pt.x >= 0 && pt.y >= 0 && pt.x <= snap.size.width && pt.y <= snap.size.height
        return { ...p, pt, inBounds }
      })
    : []

  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle="Map Snapshotter"
      toolbar={{
        cancellationAction: <Button
          title="Close"
          action={dismiss}
        />
      }}
    >
      <VStack
        navigationTitle={"MapSnapshotter"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={16}
        padding
      >
        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          {`MapSnapshotter.take(...) renders a static map offscreen and returns
          a MapSnapshot { image, point }. The image
          below is the snapshot's image fed into <Image image={snap.image}>.`}
        </Text>

        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>Preset region</Text>
          <Picker
            title="Region"
            value={preset}
            onChanged={(v: any) => setPreset(v as Preset)}
            pickerStyle={"segmented"}
          >
            <Text tag={"bund"}>Bund</Text>
            <Text tag={"apple_park"}>Apple Park</Text>
            <Text tag={"golden_gate"}>Golden Gate</Text>
          </Picker>
        </VStack>

        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>Map style</Text>
          <Picker
            title="Style"
            value={style}
            onChanged={(v: any) => setStyle(v as any)}
            pickerStyle={"segmented"}
          >
            <Text tag={"standard"}>standard</Text>
            <Text tag={"imagery"}>imagery</Text>
            <Text tag={"hybrid"}>hybrid</Text>
          </Picker>
        </VStack>

        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>Appearance</Text>
          <Picker
            title="Appearance"
            value={appearance}
            onChanged={(v: any) => setAppearance(v as any)}
            pickerStyle={"segmented"}
          >
            <Text tag={"light"}>light</Text>
            <Text tag={"dark"}>dark</Text>
          </Picker>
        </VStack>

        <HStack spacing={8}>
          <Button title={loading ? "Rendering..." : "Take snapshot"} action={take} />
          {snap != null
            ? <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
              {snap.size.width} × {snap.size.height} pt
            </Text>
            : null}
        </HStack>

        {err != null
          ? <Text font={"caption"} foregroundStyle={"systemRed"}>{err}</Text>
          : null}

        {snap != null
          ? <ZStack frame={{ width: SNAP_W, height: SNAP_H }}>
            <Image
              image={snap.image}
              resizable
              scaleToFit
              frame={{ width: SNAP_W, height: SNAP_H }}
              clipShape={{ type: "rect", cornerRadius: 12 }}
            />
            {/* 多个 POI 覆盖:每个 pin + 文字标签都按 snap.point(...) 投影到画布上。 */}
            {overlays.filter(o => o.inBounds).map(o =>
              <VStack key={o.name} spacing={1} position={{ x: o.pt.x, y: o.pt.y - 14 }}>
                <Image
                  systemName="mappin.circle.fill"
                  font={"title3"}
                  foregroundStyle={o.tint}
                />
                <Text
                  font={"caption2"}
                  foregroundStyle={"white"}
                  padding={{ horizontal: 4, vertical: 1 }}
                  background={"rgba(0, 0, 0, 0.55)"}
                  clipShape={{ type: "rect", cornerRadius: 4 }}
                >
                  {o.name}
                </Text>
              </VStack>
            )}
          </ZStack>
          : <Text font={"caption"} foregroundStyle={"tertiaryLabel"}>
            Snapshot will appear here after rendering.
          </Text>}

        {snap != null
          ? <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
            {`${overlays.filter(o => o.inBounds).length} / ${overlays.length} POIs in bounds — out-of-bounds coordinates are clipped instead of bleeding past the image edge.`}
          </Text>
          : null}
      </VStack>
    </ScrollView>
  </NavigationStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
