`MapLookAround` resolves a LookAround (street-level) scene reference for a
coordinate. Pair with the `<LookAroundPreview>` view to render the scene
interactively.

```tsx
import { LookAroundPreview, useEffect, useState } from "scripting"

function Example() {
  const [scene, setScene] = useState<MapLookAroundScene | null>(null)
  useEffect(() => {
    MapLookAround.request({ latitude: 37.3349, longitude: -122.0090 })
      .then(setScene)
  }, [])
  return <LookAroundPreview scene={scene} frame={{ height: 240 }} />
}
```

---

## `request` — fetch a scene

```ts
const scene = await MapLookAround.request({
  latitude: 31.2397,
  longitude: 121.4994,
})
if (scene == null) {
  // No street view available at this location.
}
```

`scene` is an opaque handle backed by `MKLookAroundScene`. Two readable fields
in JS:

| Member | Type | Description |
|---|---|---|
| `coordinate` | `MapCoordinate` | Anchor coordinate the scene was requested at. |

## `<LookAroundPreview scene>` — render the scene

| Prop | Type | Default | Description |
|---|---|---|---|
| `scene` | `MapLookAroundScene \| null` | — | Scene to render. `null` shows a placeholder. |
| `showsRoadLabels` | `boolean?` | `true` | Overlay street / road names. |
| `allowsNavigation` | `boolean?` | `true` | Allow tapping to expand into the full-screen viewer. |
| `badgePosition` | `"topLeading" \| "topTrailing" \| "bottomTrailing"?` | `"topLeading"` | Position of Apple's "Look Around" badge inside the preview. |

The component also accepts all standard layout / framing modifiers
(`frame={...}`, `padding`, `clipShape`, etc.).

## Notes

- LookAround coverage skews to major US / EU / JP / KR cities; many locations
  resolve to `null`. Always handle the null branch in your UI.
- The view uses Apple's interactive preview internally — you can't add custom
  overlays or annotations on top.
- A scene reference stays valid while the JS context lives; you don't need to
  dispose it.
