`MapSnapshotter` renders a static map image offscreen via MapKit. Useful when
you need a map picture without a live `<Map>` view — widget previews,
share-sheet thumbnails, exported reports, or any place SwiftUI's `Map` isn't
available.

```tsx
const snap = await MapSnapshotter.take({
  region: {
    center: { latitude: 31.2407, longitude: 121.4905 },
    span: { latitudeDelta: 0.02, longitudeDelta: 0.02 },
  },
  size: { width: 320, height: 200 },
})

// snap.image is a UIImage — feed it straight into <Image>.
return <Image image={snap.image} />
```

---

## `take` — render a snapshot

### Options

| Option | Type | Description |
|---|---|---|
| `region` | `MapRegion?` | Region to capture. Mutually exclusive with `camera`. |
| `camera` | `MapCamera?` | Eye-style framing (`MapCamera.make(...)`). Wins over `region` if both are supplied. |
| `size` | `{ width: number; height: number }` | Required. Output dimensions in points; both > 0. |
| `scale` | `number?` | Pixel scale factor. Default = device main screen scale. |
| `mapStyle` | `MapStyleSpec?` | Same shape as `<Map mapStyle>`. Default `{ style: "standard" }`. |
| `appearance` | `"light" \| "dark"?` | Color tint of the rendered map. |
| `overlays` | `SnapshotOverlay[]?` | Routes, areas, and circles drawn onto the image. See [Overlays & annotations](#overlays--annotations). |
| `annotations` | `SnapshotAnnotation[]?` | Pin markers drawn on top of the image. |

### `MapSnapshot`

| Member | Type | Description |
|---|---|---|
| `size` | `{ width, height }` | Matches `options.size`. |
| `image` | `UIImage` | Rendered map. Plug into `<Image image={snap.image} />` or use any of the `UIImage` instance methods — `toPNGBase64String()`, `toPNGData()`, `preparingThumbnail(size)`, `withTintColor(...)`, etc. |
| `point(coordinate)` | `{ x, y }` | Convert a geographic coordinate into snapshot-space points (matches `size`). Coordinates outside the visible region still return a point — values may be negative or exceed `size`, so bounds-check if you only want to draw overlays inside the frame. |

### Overlay coordinates

`point` is the snapshotter's escape hatch for drawing pins or labels on top of
the image:

```tsx
const pin = snap.point({ latitude: 31.24, longitude: 121.49 })
const inBounds =
  pin.x >= 0 && pin.y >= 0 && pin.x <= snap.size.width && pin.y <= snap.size.height

return <ZStack>
  <Image image={snap.image} />
  {inBounds
    ? <Image
        systemName="mappin.circle.fill"
        position={{ x: pin.x, y: pin.y }}
        foregroundStyle="systemRed"
      />
    : null}
</ZStack>
```

### Working with the `UIImage`

`snap.image` exposes the same `UIImage` instance returned by other APIs, so
all the existing helpers work — for example, downscale before sharing:

```ts
const thumb = snap.image.preparingThumbnail({ width: 160, height: 100 })
const pngBase64 = await thumb?.toPNGBase64String()
```

---

## Overlays & annotations

Pass `overlays` and `annotations` to bake geographic content directly into the
image — no manual coordinate math or extra `<Image>` layering. This is the easy
way to turn a route into a picture.

When you omit both `region` and `camera`, the snapshot **auto-fits** every
overlay and annotation, so a route becomes a one-liner:

```tsx
const { routes } = await MapDirections.calculate({
  source: { latitude: 31.2304, longitude: 121.4737 },
  destination: { latitude: 31.2197, longitude: 121.4453 },
})

const snap = await MapSnapshotter.take({
  size: { width: 320, height: 200 },
  // No region/camera: the map frames the route automatically.
  overlays: [
    { type: "polyline", coordinates: routes[0].coordinates, strokeColor: "systemBlue", lineWidth: 5 },
  ],
  annotations: [
    { coordinate: routes[0].coordinates[0], tintColor: "systemGreen", glyph: "figure.walk" },
    { coordinate: routes[0].coordinates.at(-1)!, tintColor: "systemRed", title: "Destination" },
  ],
})

return <Image image={snap.image} />
```

### Overlays

Each overlay is one of three shapes. Colors accept any `Color` string
(`"#RRGGBB"`, `"rgb(...)"`, `"systemBlue"`, …).

| Shape | Fields | Notes |
|---|---|---|
| `"polyline"` | `coordinates`, `strokeColor?`, `lineWidth?` | Needs ≥ 2 points. Default stroke = system blue, width `4`. |
| `"polygon"` | `coordinates`, `strokeColor?`, `fillColor?`, `lineWidth?` | Needs ≥ 3 vertices; closed automatically. `fillColor` defaults to a translucent stroke. |
| `"circle"` | `center`, `radius` (meters), `strokeColor?`, `fillColor?`, `lineWidth?` | Radius is geographic (meters), so it scales with the map. |

```tsx
const snap = await MapSnapshotter.take({
  size: { width: 300, height: 300 },
  overlays: [
    { type: "circle", center: { latitude: 31.23, longitude: 121.47 }, radius: 500, fillColor: "rgba(255,0,0,0.15)", strokeColor: "systemRed" },
    { type: "polygon", coordinates: area, strokeColor: "systemIndigo" },
  ],
})
```

### Annotations

A marker is a pin whose tip points at `coordinate`. Add an optional `glyph`
(an SF Symbol name, or up to two characters of text) and a `title` caption.

```tsx
annotations: [
  { coordinate: { latitude: 31.23, longitude: 121.47 }, tintColor: "systemBlue", glyph: "star.fill", title: "Start" },
]
```

Overlays and annotations are drawn after the base map, in array order, with
annotations always on top. Anything projecting outside the frame is simply
clipped.

---

## Notes

- A 1024×768 retina PNG can be a few megabytes; reach for `preparingThumbnail`
  before persisting if the snapshot is only used as a preview.
- Apple caps `scale` around 3x on most devices; values above are silently
  clamped.
- Network-backed (Apple's map tile service) — failures resolve through the
  Promise rejection with the underlying error message.
