import {
  Button, HStack, Map, MapCircle, MapCompass, MapPitchToggle, MapPolygon, MapPolyline,
  MapScaleView, MapUserLocationButton, Marker, Navigation, NavigationStack, Picker, Script,
  ScrollView, Text, useMemo, useObservable, useState, VStack,
} from "scripting"
import type { MapStyleSpec, MapPointsOfInterestSpec } from "scripting"

function Example() {
  // Camera bound to most of the demos below. Demo 4 swaps it through every
  // MapCameraPosition variant; the other demos read its current value.
  const position = useObservable<MapCameraPosition>(
    MapCameraPosition.region({
      center: { latitude: 31.2354, longitude: 121.4905 },
      span: { latitudeDelta: 0.04, longitudeDelta: 0.04 },
    })
  )

  // ───── Demo 2 state: mapStyle picker ─────
  const [styleKind, setStyleKind] = useState<"standard" | "imagery" | "hybrid">("standard")
  const [showsTraffic, setShowsTraffic] = useState(false)

  const mapStyle: MapStyleSpec = useMemo(() => {
    if (styleKind === "imagery") {
      return { style: "imagery", elevation: "realistic" }
    }
    if (styleKind === "hybrid") {
      return { style: "hybrid", elevation: "realistic", showsTraffic }
    }
    return { style: "standard", showsTraffic }
  }, [styleKind, showsTraffic])

  // ───── Demo 4 state: camera-spec variants ─────
  type CameraKind = "region" | "rect" | "camera" | "automatic" | "userLocation"
  const [cameraKind, setCameraKind] = useState<CameraKind>("region")

  const applyCamera = (kind: CameraKind) => {
    setCameraKind(kind)
    switch (kind) {
      case "region":
        position.setValue(MapCameraPosition.region({
          center: { latitude: 31.2354, longitude: 121.4905 },
          span: { latitudeDelta: 0.04, longitudeDelta: 0.04 },
        }))
        return
      case "rect":
        // 5 km × 5 km square around the Bund
        position.setValue(MapCameraPosition.rect({
          center: { latitude: 31.2407, longitude: 121.4905 },
          size: { width: 5000, height: 5000 },
        }))
        return
      case "camera":
        position.setValue(MapCameraPosition.camera({
          centerCoordinate: { latitude: 31.2397, longitude: 121.4994 },
          distance: 1500,
          heading: 30,
          pitch: 45,
        }))
        return
      case "automatic":
        position.setValue(MapCameraPosition.automatic())
        return
      case "userLocation":
        // Requires user location permission; falls back to .automatic without it.
        position.setValue(MapCameraPosition.userLocation())
        return
    }
  }

  // ───── Demo 5 state: POI filter ─────
  type POIMode = "all" | "excludingAll" | "includes" | "excludes"
  const [poiMode, setPoiMode] = useState<POIMode>("all")

  const poiSpec: MapPointsOfInterestSpec = useMemo(() => {
    if (poiMode === "all") return "all"
    if (poiMode === "excludingAll") return "excludingAll"
    if (poiMode === "includes") return { includes: ["restaurant", "cafe", "park"] }
    return { excludes: ["gasStation", "atm", "parking"] }
  }, [poiMode])

  // ───── Demo 6: geodesic polyline state ─────
  // Toggle between straight and geodesic to visualise the curvature on long routes.
  const [geodesic, setGeodesic] = useState(true)

  // ───── Demo 8: pitch toggle ─────
  const pitchedPosition = useObservable<MapCameraPosition>(
    MapCameraPosition.camera({
      centerCoordinate: { latitude: 31.2397, longitude: 121.4994 },
      distance: 1200,
      heading: 30,
      pitch: 60,
    })
  )

  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle="Map View"
      toolbar={{
        cancellationAction: <Button
          title="Close"
          action={dismiss}
        />
      }}
    >
      <VStack
        navigationTitle={"Map"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={20}
        padding
      >
        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          {`\`Map\` is a SwiftUI MapKit view. Pass an \`Observable<MapCameraPosition>\` to
          \`cameraPosition\` for two-way binding — gestures write the new camera back on
          gesture end. Use the children for \`Marker\`, \`MapPolyline\`, \`MapPolygon\`,
          \`MapCircle\`; use \`controls={...}\` to mount built-in MapKit controls.`}
        </Text>

        {/* 1. Basic map with Marker + Polyline + Circle */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>1. Basic map</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Three markers (plain label, SF Symbol, monogram), a polyline tracing a path
            between them, and a circle showing a 300m radius. Drag/zoom — the region writes
            back to `cameraPosition`.
          </Text>
          <Map
            cameraPosition={position}
            mapStyle={mapStyle}
            controls={<>
              <MapUserLocationButton />
              <MapCompass />
              <MapScaleView />
            </>}
            frame={{ height: 320 }}
            clipShape={{
              type: 'rect',
              cornerRadius: 12
            }}
          >
            <Marker
              title="Bund"
              coordinate={{ latitude: 31.2407, longitude: 121.4905 }}
              tint="systemRed"
            />
            <Marker
              title="People's Square"
              coordinate={{ latitude: 31.2304, longitude: 121.4737 }}
              systemImage="building.2"
              tint="systemBlue"
            />
            <Marker
              title="Lujiazui"
              coordinate={{ latitude: 31.2397, longitude: 121.4994 }}
              monogram="L"
              tint="systemPurple"
            />
            <MapPolyline
              coordinates={[
                { latitude: 31.2304, longitude: 121.4737 },
                { latitude: 31.2407, longitude: 121.4905 },
                { latitude: 31.2397, longitude: 121.4994 },
              ]}
              strokeColor="systemOrange"
              strokeStyle={{ lineWidth: 4, lineCap: "round", lineJoin: "round" }}
            />
            <MapCircle
              center={{ latitude: 31.2354, longitude: 121.4905 }}
              radius={300}
              fillColor="rgba(0, 122, 255, 0.15)"
              strokeColor="systemBlue"
              strokeStyle={{ lineWidth: 2 }}
            />
          </Map>
        </VStack>

        {/* 2. mapStyle + showsTraffic + elevation */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>2. Map style</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Switch the map above between Standard / Imagery / Hybrid. Imagery and Hybrid
            request realistic elevation; only Standard and Hybrid honor `showsTraffic`.
          </Text>
          <HStack spacing={8}>
            <Button title="Standard" action={() => setStyleKind("standard")} />
            <Button title="Imagery" action={() => setStyleKind("imagery")} />
            <Button title="Hybrid" action={() => setStyleKind("hybrid")} />
          </HStack>
          <HStack spacing={8}>
            <Button
              title={showsTraffic ? "Traffic: ON" : "Traffic: OFF"}
              action={() => setShowsTraffic(v => !v)}
            />
          </HStack>
        </VStack>

        {/* 3. Polygon demo */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>3. Polygon</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            A filled polygon outlining a rough quad around People's Square. Uses
            `initialCameraPosition` (one-way init, no write-back).
          </Text>
          <Map
            initialCameraPosition={MapCameraPosition.region({
              center: { latitude: 31.2304, longitude: 121.4737 },
              span: { latitudeDelta: 0.02, longitudeDelta: 0.02 },
            })}
            frame={{ height: 240 }}
            clipShape={{
              type: 'rect',
              cornerRadius: 12
            }}
          >
            <MapPolygon
              coordinates={[
                { latitude: 31.234, longitude: 121.470 },
                { latitude: 31.234, longitude: 121.478 },
                { latitude: 31.227, longitude: 121.478 },
                { latitude: 31.227, longitude: 121.470 },
              ]}
              fillColor="rgba(52, 199, 89, 0.25)"
              strokeColor="systemGreen"
              strokeStyle={{ lineWidth: 2 }}
            />
          </Map>
        </VStack>

        {/* 4. All 5 MapCameraPosition variants */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>4. Camera spec variants</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Cycle a dedicated `cameraPosition` observable through every
            `MapCameraPosition` form. The map directly below responds.
            `userLocation` needs location permission; without it MapKit falls
            back to `automatic`.
          </Text>
          <Picker
            title="Camera"
            value={cameraKind}
            onChanged={(v: any) => applyCamera(v as CameraKind)}
            pickerStyle={"segmented"}
          >
            <Text tag={"region"}>region</Text>
            <Text tag={"rect"}>rect</Text>
            <Text tag={"camera"}>camera</Text>
            <Text tag={"automatic"}>auto</Text>
            <Text tag={"userLocation"}>user</Text>
          </Picker>
          <Map
            cameraPosition={position}
            frame={{ height: 260 }}
            clipShape={{
              type: 'rect',
              cornerRadius: 12
            }}
          >
            <Marker
              title="People's Square"
              coordinate={{ latitude: 31.2304, longitude: 121.4737 }}
              tint="systemRed"
            />
            <Marker
              title="Lujiazui"
              coordinate={{ latitude: 31.2397, longitude: 121.4994 }}
              tint="systemBlue"
            />
          </Map>
          <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
            Note: dragging the map afterwards writes a `{"{ region }"}` form
            back, regardless of which variant you started with. The map in
            Demo 1 shares the same observable, so it will respond too.
          </Text>
        </VStack>

        {/* 5. POI filter */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>5. Points of interest filter</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Filter which POIs MapKit renders. `includes` shows only the listed categories;
            `excludes` shows everything except them; `excludingAll` hides all POIs.
          </Text>
          <Picker
            title="POI"
            value={poiMode}
            onChanged={(v: any) => setPoiMode(v as POIMode)}
            pickerStyle={"segmented"}
          >
            <Text tag={"all"}>all</Text>
            <Text tag={"excludingAll"}>none</Text>
            <Text tag={"includes"}>food + park</Text>
            <Text tag={"excludes"}>no gas/atm</Text>
          </Picker>
          <Map
            initialCameraPosition={MapCameraPosition.region({
              center: { latitude: 31.2304, longitude: 121.4737 },
              span: { latitudeDelta: 0.015, longitudeDelta: 0.015 },
            })}
            mapStyle={{ style: "standard", pointsOfInterest: poiSpec }}
            frame={{ height: 260 }}
            clipShape={{
              type: 'rect',
              cornerRadius: 12
            }}
          />
        </VStack>

        {/* 6. Geodesic polyline (long-haul route) */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>6. Geodesic polyline</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Beijing ⇄ San Francisco great-circle vs straight line. Geodesic follows the
            shortest path on a sphere — visibly curved on long routes; the straight form
            cuts diagonally across the projection.
          </Text>
          <HStack spacing={8}>
            <Button
              title={geodesic ? "Mode: geodesic" : "Mode: straight"}
              action={() => setGeodesic(v => !v)}
            />
          </HStack>
          <Map
            initialCameraPosition={MapCameraPosition.region({
              center: { latitude: 50, longitude: -160 },
              span: { latitudeDelta: 90, longitudeDelta: 200 },
            })}
            mapStyle={{ style: "standard" }}
            frame={{ height: 260 }}
            clipShape={{
              type: 'rect',
              cornerRadius: 12
            }}
          >
            <Marker title="Beijing"
              coordinate={{ latitude: 39.9042, longitude: 116.4074 }}
              tint="systemRed"
            />
            <Marker title="San Francisco"
              coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
              tint="systemBlue"
            />
            <MapPolyline
              coordinates={[
                { latitude: 39.9042, longitude: 116.4074 },
                { latitude: 37.7749, longitude: -122.4194 },
              ]}
              strokeColor="systemOrange"
              strokeStyle={{ lineWidth: 3, lineCap: "round" }}
              contourStyle={geodesic ? "geodesic" : "straight"}
            />
          </Map>
        </VStack>

        {/* 7. Dashed strokes + lineCap / lineJoin */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>7. Stroke styles</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Three polylines side-by-side showing `dash` + `lineCap` + `lineJoin` combinations,
            plus a dashed `MapCircle` outline. Dash lengths and gaps are in points.
          </Text>
          <Map
            initialCameraPosition={MapCameraPosition.region({
              center: { latitude: 31.2354, longitude: 121.4905 },
              span: { latitudeDelta: 0.012, longitudeDelta: 0.018 },
            })}
            frame={{ height: 280 }}
            clipShape={{
              type: 'rect',
              cornerRadius: 12
            }}
          >
            <MapPolyline
              coordinates={[
                { latitude: 31.238, longitude: 121.484 },
                { latitude: 31.238, longitude: 121.497 },
              ]}
              strokeColor="systemRed"
              strokeStyle={{ lineWidth: 5, lineCap: "butt" }}
            />
            <MapPolyline
              coordinates={[
                { latitude: 31.235, longitude: 121.484 },
                { latitude: 31.235, longitude: 121.497 },
              ]}
              strokeColor="systemBlue"
              strokeStyle={{ lineWidth: 5, lineCap: "round", dash: [12, 6] }}
            />
            <MapPolyline
              coordinates={[
                { latitude: 31.232, longitude: 121.484 },
                { latitude: 31.232, longitude: 121.490 },
                { latitude: 31.234, longitude: 121.497 },
              ]}
              strokeColor="systemGreen"
              strokeStyle={{ lineWidth: 5, lineJoin: "round", dash: [4, 4] }}
            />
            <MapCircle
              center={{ latitude: 31.2354, longitude: 121.4905 }}
              radius={250}
              fillColor="rgba(175, 82, 222, 0.10)"
              strokeColor="systemPurple"
              strokeStyle={{ lineWidth: 2, dash: [8, 4] }}
            />
          </Map>
        </VStack>

        {/* 8. MapPitchToggle + pitched 3D camera */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>8. Pitched camera + MapPitchToggle</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Hybrid + realistic elevation + a `camera`-form initial position with pitch=60°.
            The pitch-toggle control in the corner flips between flat and pitched view.
          </Text>
          <Map
            cameraPosition={pitchedPosition}
            mapStyle={{ style: "hybrid", elevation: "realistic" }}
            controls={<>
              <MapPitchToggle />
              <MapCompass />
            </>}
            frame={{ height: 320 }}
            clipShape={{
              type: 'rect',
              cornerRadius: 12
            }}
          >
            <Marker title="Lujiazui"
              coordinate={{ latitude: 31.2397, longitude: 121.4994 }}
              systemImage="building.2.crop.circle"
              tint="systemTeal"
            />
          </Map>
        </VStack>

        <CameraBoundsDemo />
      </VStack>
    </ScrollView>
  </NavigationStack>
}

function CameraBoundsDemo() {
  // 中心约束:相机中心被锁在外滩 ~5km 矩形内,推不出去。
  const center = { latitude: 31.2397, longitude: 121.4906 }
  const region = { center, span: { latitudeDelta: 0.05, longitudeDelta: 0.05 } }
  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(region))

  const [mode, setMode] = useState<"region" | "distance" | "off">("region")

  // 用 useMemo 避免每次 render 重建 bounds(SwiftUI 端按对象身份判等)。
  const bounds = useMemo(() => {
    if (mode === "off") return undefined
    if (mode === "region") {
      return MapCameraBounds.centerCoordinateBounds(region, {
        minimumDistance: 500,
        maximumDistance: 8000,
      })
    }
    // distance-only:中心可以拖到任意地方,只限 zoom 范围
    return MapCameraBounds.distance({ minimumDistance: 1000, maximumDistance: 20000 })
  }, [mode])

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>9. `cameraBounds` — clamp pan / zoom</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      {`\`MapCameraBounds.centerCoordinateBounds\` 把中心锁在 region 内 + 限 zoom。
      \`MapCameraBounds.distance\` 只限 zoom,中心可以自由拖。
      off 时取消约束,作为对照。试着拖远 / 拖近 / 拖到很远的地方看效果。`}
    </Text>
    <Picker title="bounds" value={mode} onChanged={(v: any) => setMode(v as typeof mode)} pickerStyle="segmented">
      <Text tag="region">region + zoom</Text>
      <Text tag="distance">zoom only</Text>
      <Text tag="off">off</Text>
    </Picker>
    <Map
      cameraPosition={position}
      cameraBounds={bounds}
      frame={{ height: 280 }}
      clipShape={{ type: "rect", cornerRadius: 12 }}
    >
      <Marker title="Bund" coordinate={center} tint="systemRed" />
    </Map>
    <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
      Bounds 只影响用户手势 — JS 端 `cameraPosition.setValue(...)` 仍可把相机程序化
      移到约束外。MapKit 通常在下一次手势时把相机动画拉回合法范围。
    </Text>
  </VStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
