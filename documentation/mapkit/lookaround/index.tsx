import {
  Button, HStack, LookAroundPreview, MapCoordinate, Navigation, NavigationStack, Picker,
  Script, ScrollView, Text, useEffect, useState, VStack,
} from "scripting"

const SPOTS: Record<string, { name: string; coordinate: MapCoordinate }> = {
  apple_park: { name: "Apple Park", coordinate: { latitude: 37.3349, longitude: -122.0090 } },
  bund: { name: "Bund, Shanghai", coordinate: { latitude: 31.2407, longitude: 121.4905 } },
  shibuya: { name: "Shibuya Crossing", coordinate: { latitude: 35.6595, longitude: 139.7005 } },
  sahara: { name: "Sahara (no coverage)", coordinate: { latitude: 23.0, longitude: 12.0 } },
}

type Spot = keyof typeof SPOTS

function Example() {
  const [spot, setSpot] = useState<Spot>("apple_park")
  const [scene, setScene] = useState<MapLookAroundScene | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Re-request whenever the picker selection changes.
  useEffect(() => {
    let cancelled = false
    setLoading(true); setErr(null); setScene(null)
    MapLookAround.request(SPOTS[spot].coordinate)
      .then(s => { if (!cancelled) setScene(s) })
      .catch(e => { if (!cancelled) setErr(String(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [spot])

  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle="Map LookAround"
      toolbar={{
        cancellationAction: <Button
          title="Close"
          action={dismiss}
        />
      }}
    >
      <VStack
        navigationTitle={"LookAround"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={16}
        padding
      >
        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          {`MapLookAround.request({ latitude, longitude }) resolves a
          MapLookAroundScene reference (or null when there's no street-level
          coverage). Feed the result into <LookAroundPreview scene> to render.`}
        </Text>

        <Picker
          title="Spot"
          value={spot}
          onChanged={(v: any) => setSpot(v as Spot)}
          pickerStyle={"segmented"}
        >
          {(Object.keys(SPOTS) as Spot[]).map(key =>
            <Text key={key} tag={key}>{SPOTS[key].name}</Text>
          )}
        </Picker>

        <HStack spacing={8}>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            {SPOTS[spot].name}
          </Text>
          {loading ? <Text font={"caption2"}>Loading...</Text> : null}
          {scene == null && !loading && err == null
            ? <Text font={"caption2"} foregroundStyle={"systemOrange"}>
              No street view at this location.
            </Text>
            : null}
        </HStack>
        {err != null
          ? <Text font={"caption"} foregroundStyle={"systemRed"}>{err}</Text>
          : null}

        <LookAroundPreview
          scene={scene}
          showsRoadLabels
          frame={{ height: 240 }}
          clipShape={{ type: "rect", cornerRadius: 12 }}
        />
      </VStack>
    </ScrollView>
  </NavigationStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
