`<Annotation>` anchors any view tree at a map coordinate. Unlike `<Marker>`,
which is constrained to a pin glyph plus a tint, an annotation renders
arbitrary children — badges, photos, custom shapes, anything you can build
with the views layer. Use it whenever the pin needs to look like something
other than a stock MapKit marker.

```tsx
<Map cameraPosition={cam}>
  <Annotation
    coordinate={{ latitude: 31.24, longitude: 121.49 }}
    title="Bund"
    anchor="bottom"
  >
    <ZStack>
      <Circle fill="systemRed" frame={{ width: 24, height: 24 }} />
      <Text font="caption2" foregroundStyle="white">★</Text>
    </ZStack>
  </Annotation>
</Map>
```

iOS 17+. Selection (`tag`) requires iOS 18+ — the same constraint as
`<Marker tag>`.

---

## Props

| Prop | Type | Description |
|---|---|---|
| `coordinate` | `MapCoordinate` | Required. Where the annotation anchors on the map. |
| `title` | `string?` | Optional MapKit label shown next to the content view. Empty / omitted = no label. |
| `anchor` | `KeywordPoint \| Point?` | Which point of the content view sticks to the coordinate. Defaults to `"center"`. |
| `tag` | `string?` | Stable identifier for `<Map selection>`. Untagged annotations are not selectable. |

### `anchor` values

`KeywordPoint` covers the SwiftUI named `UnitPoint`s — handy presets:

```ts
"center" | "top" | "bottom" | "leading" | "trailing"
| "topLeading" | "topTrailing" | "bottomLeading" | "bottomTrailing" | "zero"
```

For fine-grained placement, pass a `Point` in `[0..1]` unit space:

```tsx
<Annotation coordinate={pt} anchor={{ x: 0.5, y: 0.85 }}>...</Annotation>
```

A pin that points down at the coordinate, for example, anchors at
`"bottom"` (so the pin's bottom edge sits on the spot).

---

## Selection

Annotation taps participate in `<Map selection>` exactly the same way
tagged markers do — the bound observable receives
`{ type: "marker", tag }` when the user taps a tagged annotation, and
`null` when they tap empty map background:

```tsx
const selection = useObservable<MapSelectionValue | null>(null)

return <Map cameraPosition={cam} selection={selection}>
  <Annotation coordinate={spot} tag="bund" anchor="bottom">
    <CustomPin highlighted={isSelected(selection.value, "bund")} />
  </Annotation>
</Map>
```

Annotation does not participate in `<Map itemSelection>` — it has no
`MapItem` to bind to. If your script uses `itemSelection`, annotations
render normally but tapping them does not fire the observable.

---

## Map-level title / subtitle visibility

`<Map>` accepts two props for hiding or forcing the MapKit-rendered text
labels that accompany annotations:

| Prop | Type | Description |
|---|---|---|
| `annotationTitles` | `"automatic" \| "visible" \| "hidden"` | Title labels for `Marker(item:)`, `<Annotation>`, and Apple POI labels. |
| `annotationSubtitles` | `"automatic" \| "visible" \| "hidden"` | Subtitle labels — mostly meaningful for `Marker(item:)` (whose `MapItem.placemark` carries a subtitle) and Apple POIs. |

```tsx
<Map cameraPosition={cam} annotationTitles="hidden">
  {/* No title labels rendered, including the <Annotation title> above. */}
  ...
</Map>
```

These are MapKit's `Visibility` enum — `"automatic"` follows MapKit's
default zoom-dependent behavior. `<Annotation>` does not carry a subtitle
field itself; `annotationSubtitles` therefore has no effect on annotation
output, only on items / Apple POIs in the same map.

---

## Custom popover / sheet on tap

The Annotation's content closure is a regular SwiftUI view subtree, so any
view-layer modifier — including `popover` and the sheet family — attaches
to it directly. There is no dedicated "Annotation card" prop because none
is needed: write the same modifier you would on a normal view.

```tsx
const selection = useObservable<MapSelectionValue | null>(null)
const popoverShown = useObservable(false)

// Sync the popover open state to the selection observable.
useEffect(() => {
  popoverShown.setValue(
    selection.value?.type === "marker" && selection.value.tag === "bund"
  )
}, [selection.value])

return <Map cameraPosition={cam} selection={selection}>
  <Annotation coordinate={spot} tag="bund" anchor="bottom">
    <CustomPin
      popover={{
        isPresented: popoverShown,
        content: <BundDetail onDismiss={() => selection.setValue(null)} />,
      }}
    />
  </Annotation>
</Map>
```

This is the same pattern SwiftUI itself uses for custom annotation cards —
the popover anchors to the annotation's content view automatically. Apple's
`itemDetailSelectionAccessory` / `featureSelectionAccessory` are only for
`Marker(item:)` and Apple-rendered POIs; `<Annotation>` rolls its own card
via this view-layer modifier path.

---

## When to choose `<Annotation>` vs `<Marker>`

- **`<Marker>`** — the visual is a stock MapKit pin: tint, optional SF
  Symbol glyph or monogram, optional auto POI glyph from `MapItem`. Use
  for "ordinary pins" and `MapItem`-based annotations.
- **`<Annotation>`** — the visual is your own SwiftUI subtree. Use when
  you need a chip, a photo callout, a stretched ribbon, or anything else
  that isn't a Marker glyph.

The two coexist freely inside the same `<Map>` and share the same
`<Map selection>` / `tag` mechanism.
