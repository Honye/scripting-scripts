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

## Notes

- A 1024×768 retina PNG can be a few megabytes; reach for `preparingThumbnail`
  before persisting if the snapshot is only used as a preview.
- Apple caps `scale` around 3x on most devices; values above are silently
  clamped.
- Network-backed (Apple's map tile service) — failures resolve through the
  Promise rejection with the underlying error message.
