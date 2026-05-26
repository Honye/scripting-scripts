`MapSearch` runs MapKit's on-device keyword search. Two entry points:

- `MapSearch.locate(options)` — one-shot search, returns `MapItem[]`.
- `MapSearch.createCompleter(options?)` — stateful autocomplete, designed for
  text-input fields. Delivers suggestions via listener callbacks.

Both are pure query APIs and require **no system permissions**. Coordinates are
returned as `MapCoordinate`, so results plug straight into `<Marker>` /
`<Map>` from the views layer.

Forward / reverse geocoding (address ↔ coordinates) lives on the existing
`Location` namespace (`Location.geocodeAddress`, `Location.reverseGeocode`).

---

## `locate` — one-shot search

```ts
const items = await MapSearch.locate({
  query: "coffee",
  region: {
    center: { latitude: 31.2304, longitude: 121.4737 },
    span: { latitudeDelta: 0.02, longitudeDelta: 0.02 },
  },
})

for (const item of items) {
  console.log(item.name, item.coordinate, item.formattedAddress)
}
```

### Options

| Option | Type | Description |
|---|---|---|
| `query` | `string` | Required. Non-empty search term. |
| `region` | `MapRegion?` | Restrict the search to a region. Omit to use a wide area around the device's last known coarse location. |
| `resultTypes` | `("pointOfInterest" \| "address" \| "physicalFeature")[]?` | Default: `["pointOfInterest", "address"]`. `physicalFeature` is iOS 18+ — silently ignored on older systems. |
| `pointOfInterestFilter` | `MapPointsOfInterestSpec?` | Same shape as `<Map mapStyle={{ pointsOfInterest }}>`. Use `"excludingAll"`, `{ includes: [...] }`, or `{ excludes: [...] }`. |

### Result — `MapItem`

`MapItem` is a top-level opaque class (also returned by `MapDirections`). Read
fields by name; do not try to serialize the instance directly.

| Field | Type | Description |
|---|---|---|
| `coordinate` | `MapCoordinate` | Always present. |
| `name` | `string \| null` | "Apple Park Visitor Center" |
| `formattedAddress` | `string \| null` | "10600 N Tantau Ave, Cupertino, CA, United States" |
| `placemark` | `LocationPlacemark` | Always present. |
| `phoneNumber` | `string \| null` |  |
| `url` | `string \| null` |  |
| `pointOfInterestCategory` | `string \| null` | `"restaurant"` / `"cafe"` / ... |
| `timeZone` | `string \| null` | `"America/Los_Angeles"` |
| `isCurrentLocation` | `boolean` | `true` only when MapKit handed back the device's current-location item; search / directions results are always `false`. |

### `openInMaps(options?)` — hand off to Apple Maps

```ts
const items = await MapSearch.locate({ query: "coffee" })
if (items.length > 0) {
  await items[0].openInMaps({ directionsMode: "walking" })
}
```

Resolves with `true` when the system accepted the launch request. The current
app moves to the background while Apple Maps takes over.

| Option | Type | Description |
|---|---|---|
| `directionsMode` | `"driving" \| "walking" \| "transit" \| "default"` | Show directions on the opened map. `"default"` lets Apple Maps pick the mode based on user settings. |
| `showsTraffic` | `boolean` | Show live traffic overlay. |
| `mapType` | `"standard" \| "satellite" \| "hybrid"` | Map type to apply. |

> `JSON.stringify(item)` and `Object.keys(item)` will not return the field
> dictionary — `MapItem` is a class with getters, not a plain object. Spread the
> fields yourself if you need a serializable snapshot.

### Geometry helpers

```ts
item.distance(other)  // meters, Haversine; `other` is a coordinate or another MapItem
item.bearing(other)   // degrees [0, 360), 0 = north
```

Both delegate to `MapUtils.distance` / `MapUtils.bearing`.

### `MapItem.forCurrentLocation()`

Apple's placeholder MapItem for "the device's current location". Synchronous,
no permission prompt, no coordinate fetched locally — Apple Maps interprets the
sentinel when handed to `openInMaps()`.

```ts
await MapItem.forCurrentLocation().openInMaps({ directionsMode: "walking" })
```

Returned items satisfy `isCurrentLocation === true`.

---

## Selecting markers and built-in POIs — `<Map selection>`

Bind an observable of `MapSelectionValue | null` to `<Map selection>`. The
written value is a tagged union:

| `value.type` | Source                                           | Shape                                                                                                |
| ------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `"marker"`   | A `<Marker tag>` you rendered                    | `{ type: "marker", tag: string }`                                                                    |
| `"feature"`  | An Apple-rendered built-in POI / landmark        | `{ type: "feature", coordinate, title, kind, pointOfInterestCategory }`                              |
| `null`       | Empty map background was tapped, or initial      | —                                                                                                    |

```tsx
const selection = useObservable<MapSelectionValue | null>(null)
const items: MapItem[] = ...

return <Map cameraPosition={cam} selection={selection}>
  {items.map((item, i) => (
    <Marker item={item} tag={`hit-${i}`} />
  ))}
</Map>
```

Branch on `value.type` to handle each case:

```ts
const sel = selection.value
if (sel == null) {
  // Background tap
} else if (sel.type === "marker") {
  const item = items.find((_, i) => `hit-${i}` === sel.tag)
  // ... use your MapItem
} else {
  // sel.type === "feature" — an Apple POI
  // sel.coordinate, sel.title, sel.pointOfInterestCategory
}
```

`kind` is one of `"pointOfInterest"` / `"physicalFeature"` / `"territory"` /
`"unknown"`. `pointOfInterestCategory` uses the same vocabulary as
`MapPointOfInterestCategory` (e.g. `"restaurant"`, `"cafe"`) and is `null` when
the feature has no category.

Markers without a `tag` are not selectable.

### iOS 17 limitation

On iOS 17, only `type: "feature"` is reported — tapping a tagged `<Marker>`
does **not** fire selection. The unified marker/feature selection requires
iOS 18+ (`MapSelection<Value>`). If your script targets iOS 17 devices, design
around feature taps for POI selection and treat marker selection as iOS 18+ only.

---

## Item selection + Apple's auto detail cards — `<Map itemSelection>`

iOS 18+ adds a higher-level path: bind `<Map itemSelection>` to an
`Observable<MapItem | null>` and pair `<Marker item={mapItem}>` markers with
Apple's built-in detail card via `<Map itemDetailSelectionAccessory>` /
`<Map featureSelectionAccessory>`.

```tsx
const selected = useObservable<MapItem | null>(null)
const items: MapItem[] = ...

return <Map
  cameraPosition={cam}
  itemSelection={selected}
  itemDetailSelectionAccessory="automatic"
  featureSelectionAccessory="automatic"
>
  {items.map(item => (
    <Marker item={item} tint={selected.value === item ? "systemRed" : "systemBlue"} />
  ))}
</Map>
```

- Tapping `<Marker item>` writes that exact `MapItem` instance into the
  observable. Compare with `===` to find the picked item (the JS side keeps
  reference identity through MapKit selection).
- Apple's auto card pops up automatically:
  - `itemDetailSelectionAccessory` — card for tapped item markers (e.g.,
    address, phone, "Directions" button).
  - `featureSelectionAccessory` — card for tapped Apple-rendered POI labels.
- Style values: `"automatic"` (MapKit picks callout vs sheet), `"callout"`,
  `"sheet"`. Pass `null` (or omit the prop) to disable.

> **Nested presentation caveat**: `"automatic"` and `"sheet"` use a modal
> sheet presentation (`MKPresentableSelectionAccessoryViewController`).
> Inside `Navigation.present(...)`-style modal contexts the presentation
> chain conflicts with the parent modal — iOS 18 currently aborts the
> second tap with `Attempt to present ... which is already presenting`,
> and in some cases dismisses the parent modal entirely. Prefer
> `"callout"` (inline anchored bubble, no modal presentation) when the
> map lives inside a presented sheet or `Navigation.present` page.

`itemSelection` is mutually exclusive with `selection`: if both are set,
`itemSelection` wins and string-tag markers do not fire.

### iOS 17 limitation

`itemSelection`, `itemDetailSelectionAccessory`, and `featureSelectionAccessory`
are all iOS 18+. On iOS 17 the props are silently ignored — the map renders,
markers display, but tapping does not write to `itemSelection` and no
Apple-styled card appears.

### Cancellation note

`locate` does not expose a cancellation handle. For typeahead scenarios use
`createCompleter` instead — repeated `locate` calls do not deduplicate stale
responses and a fast typist can see results arrive out of order.

---

## `createCompleter` — autocomplete

```ts
const completer = MapSearch.createCompleter({
  region: { ... },
  resultTypes: ["address", "pointOfInterest", "query"],
})

completer.addListener(suggestions => {
  setOptions(suggestions)
})

completer.setQuery("apple")
// ...later, when the user taps a suggestion:
const items = await completer.resolve(selected)
```

### Options

| Option | Type | Description |
|---|---|---|
| `region` | `MapRegion?` | Bias suggestions toward a region. Can be changed later via `completer.setRegion(...)`. |
| `resultTypes` | `("pointOfInterest" \| "address" \| "query")[]?` | Default: `["pointOfInterest", "address"]`. Note `"query"` is only valid on the completer (offers query-completion suggestions); `"physicalFeature"` is not valid here. |

### Methods

| Method | Description |
|---|---|
| `setQuery(query)` | Update the search fragment. Triggers a new round of suggestions. |
| `setRegion(region)` | Update the bias region. |
| `addListener(fn)` | Subscribe to suggestion batches. Each call replaces the previous batch — no diff merging needed. |
| `removeListener(fn?)` | Remove one listener, or all listeners when called without arguments. |
| `resolve(completion)` | Look up the full `MapItem[]` for a tapped suggestion. |
| `dispose()` | Release the underlying completer. Idempotent — safe to call multiple times. |

### Lifecycle

One completer corresponds to one input field — sharing a completer between
unrelated fields will cross-contaminate results because the underlying
`queryFragment` is single-valued. Call `dispose()` when the field unmounts.

### Suggestion lifetime

A `MapSearchCompletion`'s `id` is only valid until the completer issues its
next batch of suggestions. Resolving a stale suggestion rejects with
`"unknown completion id"`. In React-style UIs, store the array of suggestions
in state alongside the user's selection so the chosen suggestion's `id` is
always paired with the batch it came from.

---

## Combining with `<Map>`

Hand the whole `MapItem` to `<Marker>` and MapKit fills in title, coordinate,
and a POI-category-driven glyph for you:

```tsx
{items.map(item => (
  <Marker item={item} tint="systemBlue" />
))}
```

If you also pass `title` / `systemImage` / `monogram`, the marker reverts to
the default pin (or your specified glyph) and uses your override — auto-glyph
selection only applies when none of those are given. The two forms are mutually
exclusive in the type system: passing both `item` and `coordinate` is a
compile-time error.

```tsx
// item + custom glyph — your systemImage wins, title still defaults to item.name
<Marker item={mapItem} systemImage="cup.and.saucer.fill" tint="systemRed" />

// coordinate form — you supply everything
<Marker title="Bund" coordinate={{ latitude: 31.24, longitude: 121.49 }} />
```

To fit the map around the result set, use `MapUtils.regionFromCoordinates`:

```ts
const region = MapUtils.regionFromCoordinates(items.map(i => i.coordinate))
if (region) position.setValue({ region })
```

---

## Errors

`locate` rejects when:
- `query` is missing or empty
- The underlying `MKLocalSearch` fails (network, no results, etc.)

`completer.resolve` rejects when:
- The completion id is stale (next batch invalidated it)
- The underlying `MKLocalSearch` lookup fails

The completer's listener never receives a synchronous error; on backend
failure the listener is called with an empty array.

