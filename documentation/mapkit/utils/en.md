`MapUtils` is a small set of synchronous geometry helpers for the MapKit
coordinate / region types from the views layer. Pure functions, safe to call
during render or in tight loops.

---

## `distance(a, b)`

Great-circle distance between two `MapCoordinate`s in **meters**, computed via
the Haversine formula using mean Earth radius (`6_371_008.8 m`).

```ts
const d = MapUtils.distance(
  { latitude: 39.9042, longitude: 116.4074 },  // Beijing
  { latitude: 31.2304, longitude: 121.4737 },  // Shanghai
)
// d ≈ 1_067_000  (meters)
```

Accuracy is good enough for typical "near me / how far away" use cases. For
applications that need geodetic-grade precision (geological surveying etc.),
use a dedicated geodesy library.

---

## `bearing(a, b)`

Initial bearing (forward azimuth) from `a` to `b`, in degrees normalized to
`[0, 360)`:

| Value | Direction |
|---|---|
| `0` | North |
| `90` | East |
| `180` | South |
| `270` | West |

```ts
MapUtils.bearing(
  { latitude: 0, longitude: 0 },
  { latitude: 0, longitude: 1 },
)  // 90
```

The bearing returned is the **initial** bearing — on long great-circle routes
the actual direction at the destination is different. For map-marker rotation
the initial bearing is what you want.

---

## `regionContains(region, coordinate)`

Whether `coordinate` lies inside the rectangular `MapRegion`:

```ts
const region = {
  center: { latitude: 31.23, longitude: 121.47 },
  span: { latitudeDelta: 0.1, longitudeDelta: 0.1 },
}
MapUtils.regionContains(region, { latitude: 31.24, longitude: 121.48 })  // true
MapUtils.regionContains(region, { latitude: 32.00, longitude: 121.47 })  // false
```

**Caveat**: does not handle regions that straddle the ±180° antimeridian (the
"Pacific date line"). If you need cross-meridian membership, split the test
into two regions manually.

---

## `regionFromCoordinates(coordinates, paddingFactor?)`

Smallest `MapRegion` enclosing all coordinates. Useful for fitting the camera
around a set of `Marker`s or a polyline.

```ts
const region = MapUtils.regionFromCoordinates([
  { latitude: 31.23, longitude: 121.47 },
  { latitude: 31.24, longitude: 121.50 },
  { latitude: 31.22, longitude: 121.49 },
])

if (region) {
  position.setValue({ region })  // fits the camera around all three points
}
```

| Parameter | Default | Description |
|---|---|---|
| `paddingFactor` | `0.1` | Fractional expansion of the bounding span. `0` for a tight fit. |

Edge cases:
- Empty array → returns `null`.
- Single coordinate → returns a region with a minimal 0.01° span centered on
  that point.
- Coordinates collinear in latitude or longitude → span is clamped to a
  minimum of `0.005°` to avoid `0` span (which MapKit would reject).
- Antimeridian-crossing input (e.g. one point at `+170°`, one at `-170°`)
  produces a region spanning the long way around. Not Phase-3a–supported.

---

## `formatDistance(meters, options?)`

Localized human-readable distance via Apple's `MKDistanceFormatter`. Negative
inputs clamp to `0`.

```ts
MapUtils.formatDistance(1230)                            // "1.2 km" (locale-dependent)
MapUtils.formatDistance(1230, { units: "imperial" })     // "0.8 mi"
MapUtils.formatDistance(1230, { unitStyle: "full" })     // "1.2 kilometers"
```

| Option | Type | Description |
|---|---|---|
| `units` | `"metric" \| "imperial" \| "default"` | Force a unit system. Default follows the device locale. |
| `unitStyle` | `"default" \| "abbreviated" \| "full"` | Length of the unit suffix (`"km"` vs `"kilometers"`). |

Output is locale-aware — do not assert on exact strings in tests.

---

## `formatDuration(seconds, options?)`

Localized duration via `DateComponentsFormatter`. Negative inputs return an
empty string.

```ts
MapUtils.formatDuration(3725)                              // "1h 2m"
MapUtils.formatDuration(3725, { unitsStyle: "full" })       // "1 hour, 2 minutes"
MapUtils.formatDuration(3725, { unitsStyle: "positional" }) // "1:02:05"
MapUtils.formatDuration(86_400 + 3600, { maximumUnitCount: 1 }) // "1d"
```

| Option | Type | Default | Description |
|---|---|---|---|
| `unitsStyle` | `"positional" \| "abbreviated" \| "short" \| "full" \| "brief" \| "spellOut"` | `"abbreviated"` | Visual style of the unit suffix. |
| `allowedUnits` | `("day" \| "hour" \| "minute" \| "second")[]` | `["day", "hour", "minute"]` | Which units the formatter is allowed to emit. |
| `maximumUnitCount` | `number` | unlimited | Cap how many unit segments appear (`1` collapses `3661s` to just `"1 hr"`). |

---

## When to use

- After `MapSearch.locate` / `Location.geocodeAddress`:
  `regionFromCoordinates` lets you auto-fit the camera around all hits.
- "Within Xm of me": call `distance(myLocation, item.coordinate) < X`.
- Sorting search results by proximity: stable-sort the array by `distance`.
- Compass arrow on a marker pointing to a target: `bearing` gives the rotation
  in degrees.
- Rendering route metadata (`route.distance` / `route.expectedTravelTime` from
  `MapDirections`): `formatDistance` / `formatDuration` give locale-aware labels.
