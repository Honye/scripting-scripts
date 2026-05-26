import {
  Button, HStack, Map, Marker, Navigation, NavigationStack, Script,
  ScrollView, Text, useEffect, useMemo, useObservable, useState, VStack,
} from "scripting"
import type { MapCoordinate } from "scripting"

const beijing: MapCoordinate = { latitude: 39.9042, longitude: 116.4074 }
const shanghai: MapCoordinate = { latitude: 31.2304, longitude: 121.4737 }
const guangzhou: MapCoordinate = { latitude: 23.1291, longitude: 113.2644 }
const sanFrancisco: MapCoordinate = { latitude: 37.7749, longitude: -122.4194 }

function DistanceBearingDemo() {
  const [from, setFrom] = useState<MapCoordinate>(beijing)
  const [to, setTo] = useState<MapCoordinate>(shanghai)

  const d = useMemo(() => MapUtils.distance(from, to), [from, to])
  const b = useMemo(() => MapUtils.bearing(from, to), [from, to])

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>1. `distance` + `bearing`</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      Haversine distance (meters) and initial bearing (degrees, 0 = north,
      90 = east) between two coordinates.
    </Text>
    <HStack spacing={8}>
      <Button title="Beijing → Shanghai" buttonStyle="bordered"
        action={() => { setFrom(beijing); setTo(shanghai) }} />
      <Button title="Shanghai → Guangzhou" buttonStyle="bordered"
        action={() => { setFrom(shanghai); setTo(guangzhou) }} />
      <Button title="Beijing → SF" buttonStyle="bordered"
        action={() => { setFrom(beijing); setTo(sanFrancisco) }} />
    </HStack>
    <Text monospaced>
      {`from: ${from.latitude.toFixed(3)}, ${from.longitude.toFixed(3)}\n`}
      {`to:   ${to.latitude.toFixed(3)}, ${to.longitude.toFixed(3)}\n`}
      {`distance: ${(d / 1000).toFixed(1)} km\n`}
      {`bearing:  ${b.toFixed(1)}°`}
    </Text>
  </VStack>
}

function RegionContainsDemo() {
  // Region around People's Square, Shanghai
  const region = {
    center: { latitude: 31.2304, longitude: 121.4737 },
    span: { latitudeDelta: 0.05, longitudeDelta: 0.05 },
  }

  const testPoints: { label: string; coord: MapCoordinate; inside: boolean }[] = useMemo(() => {
    const probes = [
      { label: "Bund", coord: { latitude: 31.2407, longitude: 121.4905 } },
      { label: "Lujiazui", coord: { latitude: 31.2397, longitude: 121.4994 } },
      { label: "Pudong Intl Airport", coord: { latitude: 31.1443, longitude: 121.8083 } },
      { label: "Hangzhou", coord: { latitude: 30.2741, longitude: 120.1551 } },
    ]
    return probes.map(p => ({ ...p, inside: MapUtils.regionContains(region, p.coord) }))
  }, [])

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>2. `regionContains`</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      Region: ~5 km box around People's Square. Probe a few points to see which
      land inside.
    </Text>
    <VStack alignment={"leading"} spacing={4}>
      {testPoints.map(p => (
        <Text monospaced>
          {p.inside ? "✓ inside  " : "✗ outside "} {p.label}
        </Text>
      ))}
    </VStack>
  </VStack>
}

function RegionFromCoordinatesDemo() {
  const [paddingFactor, setPaddingFactor] = useState(0.1)

  const coords = useMemo<MapCoordinate[]>(() => [
    { latitude: 31.2407, longitude: 121.4905 },  // Bund
    { latitude: 31.2304, longitude: 121.4737 },  // People's Square
    { latitude: 31.2397, longitude: 121.4994 },  // Lujiazui
    { latitude: 31.2229, longitude: 121.4583 },  // Nanjing Rd
  ], [])

  const region = useMemo(
    () => MapUtils.regionFromCoordinates(coords, paddingFactor),
    [coords, paddingFactor]
  )

  // 用 cameraPosition (双向 observable) 而不是 initialCameraPosition,这样
  // paddingFactor 变化时新计算的 region 会通过 setValue 推到地图。
  // initialCameraPosition 顾名思义只在首次挂载生效,后续不响应 prop 变化。
  const camera = useObservable<MapCameraPosition>(
    region != null ? MapCameraPosition.region(region) : MapCameraPosition.automatic()
  )

  useEffect(() => {
    if (region != null) {
      camera.setValue(MapCameraPosition.region(region))
    }
  }, [region])

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>3. `regionFromCoordinates`</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      Smallest enclosing region for 4 Shanghai landmarks. Padding expands the
      bounding box outward.
    </Text>
    <HStack spacing={8}>
      <Button title="tight (0)" buttonStyle="bordered" action={() => setPaddingFactor(0)} />
      <Button title="10% pad" buttonStyle="bordered" action={() => setPaddingFactor(0.1)} />
      <Button title="50% pad" buttonStyle="bordered" action={() => setPaddingFactor(0.5)} />
    </HStack>
    <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
      paddingFactor: {paddingFactor}{"  ·  "}
      span: {region?.span.latitudeDelta.toFixed(4)}° × {region?.span.longitudeDelta.toFixed(4)}°
    </Text>
    <Map
      cameraPosition={camera}
      frame={{ height: 280 }}
      clipShape={{
        type: 'rect',
        cornerRadius: 12
      }}
    >
      {coords.map(c => (
        <Marker
          coordinate={c}
          tint="systemBlue"
        />
      ))}
    </Map>
  </VStack>
}

function Example() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle="Map Utils"
      toolbar={{
        cancellationAction: <Button
          title="Close"
          action={dismiss}
        />
      }}
    >
      <VStack
        navigationTitle={"MapUtils"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={24}
        padding
      >
        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          Synchronous geometry helpers for MapKit coordinate / region types. Pure
          functions, safe to call during render.
        </Text>

        <DistanceBearingDemo />
        <RegionContainsDemo />
        <RegionFromCoordinatesDemo />
      </VStack>
    </ScrollView>
  </NavigationStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
