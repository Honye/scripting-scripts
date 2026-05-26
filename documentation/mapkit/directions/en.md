`MapDirections` plans routes between two endpoints using MapKit. Two entry points:

- `MapDirections.calculate(options)` — full route(s) with turn-by-turn steps and
  a ready-to-render polyline.
- `MapDirections.calculateETA(options)` — travel time / distance / arrival
  window only. Cheaper and faster than `calculate` when you don't need the
  geometry.

Both APIs are network-backed by Apple's directions servers and require **no
iOS system permissions**. The result is plain data — no opaque handles to
dispose.

Pair with the views layer: `route.coordinates` is shaped exactly for
`<MapPolyline coordinates={route.coordinates}>` from the `<Map>` view.

---

## `calculate` — plan a route

```ts
const resp = await MapDirections.calculate({
  source: { latitude: 31.2304, longitude: 121.4737 },        // People's Square
  destination: { latitude: 31.2397, longitude: 121.4994 },   // Lujiazui
  transportType: "walking",
})

const route = resp.routes[0]
console.log(route.distance, "m")             // total distance in meters
console.log(route.expectedTravelTime, "s")   // ETA in seconds
console.log(route.steps.length, "steps")     // turn-by-turn count
```

### Options

| Option | Type | Description |
|---|---|---|
| `source` | `DirectionsEndpoint` | Required. Bare `MapCoordinate` or `{ coordinate, name? }`. |
| `destination` | `DirectionsEndpoint` | Required. Same shape as `source`. |
| `transportType` | `"automobile" \| "walking" \| "transit" \| "any"` | Default `"automobile"`. |
| `requestsAlternateRoutes` | `boolean` | Default `false`. Up to 3 routes when supported (driving / highway only). |
| `departureDate` | `Date` | Plan a route departing at this time. Wins over `arrivalDate` if both are set. |
| `arrivalDate` | `Date` | Plan a route arriving by this time. |
| `tollPreference` | `"any" \| "avoid"` | Default `"any"`. |
| `highwayPreference` | `"any" \| "avoid"` | Default `"any"`. |

### `DirectionsResponse`

| Field | Type | Description |
|---|---|---|
| `source` | `MapItem` | Same shape as `MapSearch.locate` results — includes `coordinate`, `placemark`, `formattedAddress`, etc. |
| `destination` | `MapItem` | Same shape. |
| `routes` | `DirectionsRoute[]` | At least 1 entry. |

### `DirectionsRoute`

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Route label (e.g. road name). |
| `distance` | `number` | Total distance in meters. |
| `expectedTravelTime` | `number` | ETA in seconds. |
| `transportType` | `TransportType` | Mode used for this route. |
| `coordinates` | `MapCoordinate[]` | Ready-to-render polyline. Pass straight to `<MapPolyline coordinates={...}>`. |
| `steps` | `DirectionsRouteStep[]` | Turn-by-turn instructions. |
| `hasTolls` | `boolean` | Any tolled segments. |
| `hasHighways` | `boolean` | Any highway segments. |
| `advisoryNotices` | `string[]` | Optional advisory text from Apple. |

### Rendering with `<MapPolyline>`

```tsx
<Map cameraPosition={position}>
  <Marker title="Start" coordinate={route.coordinates[0]} tint="systemGreen" />
  <Marker title="End"   coordinate={route.coordinates.at(-1)!} tint="systemRed" />
  <MapPolyline
    coordinates={route.coordinates}
    strokeColor="systemBlue"
    strokeStyle={{ lineWidth: 4, lineCap: "round" }}
  />
</Map>
```

---

## `calculateETA` — time / distance only

```ts
const eta = await MapDirections.calculateETA({
  source: { latitude: 31.2304, longitude: 121.4737 },
  destination: { latitude: 31.2397, longitude: 121.4994 },
  transportType: "automobile",
})

console.log(eta.expectedTravelTime, "s")
console.log(eta.distance, "m")
console.log(eta.expectedArrivalDate.toLocaleString())
```

Use this when you only need the headline numbers — it skips downloading the
full route geometry, so it's noticeably faster than `calculate`.

---

## Notes & limitations

- **Transit** (`transportType: "transit"`) is supported in a limited set of
  regions. Outside those, the request rejects with `directionsNotFound`. For
  broad coverage prefer `"automobile"` or `"walking"`.
- **Alternates** typically only return multiple routes for driving on roads
  with realistic alternatives — walking usually returns a single route.
- **No cancel handle**: a new `calculate` call doesn't cancel an in-flight one.
  Responses arrive in whatever order Apple's servers return them, so if you
  fire requests rapidly (e.g. while the user is moving sliders) implement your
  own "latest-wins" guard.
- **`departureDate` and `arrivalDate` are mutually exclusive**: if both are
  provided, `departureDate` wins; `arrivalDate` is ignored.
