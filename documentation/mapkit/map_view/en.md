`Map` is a SwiftUI MapKit–backed view (iOS 17+). It renders a map with optional
camera binding, styling, annotations (`Marker`, `MapPolyline`, `MapPolygon`,
`MapCircle`), and built-in MapKit controls.

The shape of the API mirrors SwiftUI MapKit directly — no Web-style imperative
calls (`addMarker(...)`). You declare what should appear on the map; the bridge
turns the tree into `MapContent`.

---

## Basic usage

```tsx
import { Map, Marker, useObservable } from "scripting"

function Demo() {
  const position = useObservable<MapCameraPosition>(
    MapCameraPosition.region({
      center: { latitude: 31.23, longitude: 121.47 },
      span: { latitudeDelta: 0.05, longitudeDelta: 0.05 },
    })
  )

  return <Map cameraPosition={position}>
    <Marker
      title="Bund"
      coordinate={{ latitude: 31.24, longitude: 121.49 }}
      tint="systemRed"
    />
  </Map>
}
```

Use any standard view modifier (`frame`, `padding`, `aspectRatio`, ...) to size the
map. There are no `width` / `height` props.

---

## Camera position

Two mutually exclusive ways to set the camera:

| Prop                    | Type                                | Behavior                                                                                       |
|-------------------------|-------------------------------------|------------------------------------------------------------------------------------------------|
| `cameraPosition`        | `Observable<MapCameraPosition>`     | Two-way binding. User gestures write the resulting `MapCameraPosition` back into the observable. |
| `initialCameraPosition` | `MapCameraPosition`                 | One-time initial value, no write-back.                                                          |

> The props are named `cameraPosition` / `initialCameraPosition` rather than
> `position` / `initialPosition` to avoid clashing with the SwiftUI
> `.position(x:y:)` view modifier.

`MapCameraPosition` is an opaque value (`MapCameraPosition` class). Construct it
via factories on the `MapCameraPosition` namespace — never pass a plain dict:

```ts
MapCameraPosition.region({ center, span })
MapCameraPosition.rect({ center, size: { width, height } })   // size in meters
MapCameraPosition.camera({ centerCoordinate, distance, heading?, pitch? })
// or: MapCameraPosition.camera(MapCamera.make({...}))
MapCameraPosition.item({ coordinate, name? }, { allowsAutomaticPitch?: boolean })
MapCameraPosition.userLocation({ fallback?: MapCameraPosition })
MapCameraPosition.automatic()
```

Read what's currently framed via the readonly accessors:

```ts
const pos: MapCameraPosition = camera.value
pos.region              // MapRegion | null
pos.rect                // { center, size } | null
pos.camera              // MapCamera | null
pos.item                // { coordinate, name? } | null
pos.fallbackPosition    // MapCameraPosition | null
pos.allowsAutomaticPitch
pos.positionedByUser    // true if the most recent change came from a user gesture
```

User gestures write the new `MapCameraPosition` back directly — whatever form
the camera ends up in (typically a region after pan/zoom) is what the observable
will hold.

---

## Map style

```tsx
<Map mapStyle={{ style: "standard", showsTraffic: true }}>...</Map>

<Map mapStyle={{ style: "hybrid", elevation: "realistic" }}>...</Map>

<Map mapStyle={{
  style: "standard",
  pointsOfInterest: { includes: ["restaurant", "park"] },
}}>...</Map>
```

`pointsOfInterest` accepts `"all"`, `"excludingAll"`, or `{ includes: [...] }` /
`{ excludes: [...] }` with category strings like `"airport"`, `"cafe"`,
`"restaurant"`, etc.

---

## Map content

The following are valid children of `<Map>`:

### `Marker`

```tsx
<Marker
  title="Bund"
  coordinate={{ latitude: 31.24, longitude: 121.49 }}
  tint="systemRed"
/>

<Marker
  coordinate={{ latitude: 31.23, longitude: 121.47 }}
  systemImage="building.2"
  tint="systemBlue"
/>

<Marker
  title="A"
  coordinate={{ latitude: 31.23, longitude: 121.47 }}
  monogram="A"
/>
```

`systemImage` and `monogram` are mutually exclusive. `tint` accepts the same
color strings as the rest of the bridge (system colors, `"#RRGGBB"`,
`"rgba(...)"`, etc.).

### `MapPolyline`

```tsx
<MapPolyline
  coordinates={[
    { latitude: 31.23, longitude: 121.47 },
    { latitude: 31.24, longitude: 121.48 },
    { latitude: 31.245, longitude: 121.495 },
  ]}
  strokeColor="systemBlue"
  strokeStyle={{ lineWidth: 4 }}
/>
```

`contourStyle` is `"straight"` (default) or `"geodesic"`. The difference is
invisible at short distances and only meaningful for cross-continent routes.

### `MapPolygon`

```tsx
<MapPolygon
  coordinates={[ ... ]}
  fillColor="systemBlue"
  strokeColor="white"
  strokeStyle={{ lineWidth: 2 }}
/>
```

### `MapCircle`

```tsx
<MapCircle
  center={{ latitude: 31.23, longitude: 121.47 }}
  radius={500}
  fillColor="systemBlue"
  strokeColor="white"
/>
```

`radius` is in meters.

---

## Built-in controls

Use the `controls` prop and pass either a single control element or a Fragment
containing several:

```tsx
<Map
  controls={<>
    <MapUserLocationButton />
    <MapCompass />
    <MapScaleView />
  </>}
>
  ...
</Map>
```

Valid controls:
- `MapUserLocationButton` — recenter on user location (asks for permission)
- `MapCompass` — compass rose that resets rotation
- `MapPitchToggle` — toggle 2D / pitched view
- `MapScaleView` — adaptive scale bar

---

## `strokeStyle`

Used by `MapPolyline`, `MapPolygon`, and `MapCircle`:

```ts
type MapStrokeStyle = {
  lineWidth?: number                                // points
  lineCap?: "butt" | "round" | "square"
  lineJoin?: "miter" | "round" | "bevel"
  dash?: number[]                                   // dash/gap lengths in points
}
```

---

## `cameraBounds` — constrain pan / zoom

Pass a `MapCameraBounds` instance to clamp how far the user can pan and
zoom an interactive map. Two factories:

```ts
// Lock the center inside a region, and optionally cap zoom range
// (camera-to-center distance in meters).
const bounds = MapCameraBounds.centerCoordinateBounds(
  {
    center: { latitude: 31.2304, longitude: 121.4737 },
    span:   { latitudeDelta: 0.1, longitudeDelta: 0.1 },
  },
  { minimumDistance: 200, maximumDistance: 8000 }
)

// Restrict zoom only — the center is free to pan anywhere.
const zoomOnly = MapCameraBounds.distance({
  minimumDistance: 500,
  maximumDistance: 50_000,
})

return <Map cameraPosition={cam} cameraBounds={bounds}>...</Map>
```

`minimumDistance` / `maximumDistance` are measured in meters from the camera
to its `centerCoordinate`. Both fields are optional in either factory; pass
the ones you want. `MapCameraBounds.distance(...)` requires at least one of
them (passing an empty options dict returns `null` and the prop has no
effect).

The constraint applies to user gestures only — programmatic `cameraPosition`
writes from JS can still place the camera outside the bounds. MapKit will
typically animate back into bounds on the next user interaction.

---

## Performance tips

- Marker count: a few dozen markers is fine. For hundreds, prefer cluster-like
  preprocessing in your script and only emit markers visible in the current
  region.
- Update cadence: each render replays the full content tree. If your script
  derives many markers from large arrays on every state change, memoize them
  with `useMemo`.
- `cameraPosition` is two-way: a `setValue` from JS triggers a re-render; the gesture
  reconciler skips equivalent writes to avoid loops.

