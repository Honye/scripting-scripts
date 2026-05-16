The Location API provides access to the device’s geographic location, geocoding services, system map location picking, and heading (compass) information. It is available as a global API in Scripting and can be used directly without importing any modules.

The API respects system permissions, user-selected accuracy levels, and platform limitations, and is suitable for scripts, interactive views, and supported widget scenarios.

## LocationAccuracy

Defines the desired accuracy level for location data.

**Type Definition**

```ts
type LocationAccuracy =
  | "best"
  | "tenMeters"
  | "hundredMeters"
  | "kilometer"
  | "threeKilometers"
  | "bestForNavigation"
  | "reduced"
```

**Description**

* `best`
  Requests the highest accuracy available on the device.

* `tenMeters`
  Requests approximately 10-meter accuracy.

* `hundredMeters`
  Requests approximately 100-meter accuracy.

* `kilometer`
  Requests approximately 1-kilometer accuracy.

* `threeKilometers`
  Requests coarse accuracy within approximately 3 kilometers.

* `bestForNavigation`
  Optimized for navigation use cases, with higher update frequency and power consumption.

* `reduced`
  Requests reduced-accuracy location data, typically used when the user has granted approximate location access.

## LocationInfo

Represents a geographic coordinate with an associated timestamp.

**Type Definition**

```ts
type LocationInfo = {
  latitude: number
  longitude: number
  timestamp: number
}
```

**Properties**

* `latitude`
  Latitude in degrees.

* `longitude`
  Longitude in degrees.

* `timestamp`
  Time when the location was recorded, in milliseconds since the Unix epoch.

## LocationPlacemark

Provides a human-readable description of a geographic location, usually returned by geocoding operations.

**Type Definition**

```ts
type LocationPlacemark = {
  location?: LocationInfo
  region?: string
  timeZone?: string
  name?: string
  thoroughfare?: string
  subThoroughfare?: string
  locality?: string
  subLocality?: string
  administrativeArea?: string
  subAdministrativeArea?: string
  postalCode?: string
  isoCountryCode?: string
  country?: string
  inlandWater?: string
  ocean?: string
  areasOfInterest?: string[]
}
```

**Description**

A placemark may include address components, administrative regions, country information, and points of interest. Field availability depends on the location and system map data.

## Heading

Represents compass and orientation information derived from the device’s sensors.

**Type Definition**

```ts
type Heading = {
  headingAccuracy: number
  trueHeading: number
  magneticHeading: number
  timestamp: Date
  x: number
  y: number
  z: number
}
```

**Properties**

* `headingAccuracy`
  Maximum deviation, in degrees, between the reported heading and the true geomagnetic heading.

* `trueHeading`
  Heading relative to true north, in degrees.

* `magneticHeading`
  Heading relative to magnetic north, in degrees.

* `timestamp`
  Time at which the heading was measured.

* `x`, `y`, `z`
  Raw geomagnetic field values for the three axes, measured in microteslas.

## Authorization and Configuration

### isAuthorizedForWidgetUpdates

```ts
const isAuthorizedForWidgetUpdates: boolean
```

Indicates whether the current widget is eligible to receive location updates.

### accuracy

```ts
const accuracy: LocationAccuracy
```

The currently configured desired location accuracy.

### setAccuracy

```ts
function setAccuracy(accuracy: LocationAccuracy): Promise<void>
```

Sets the desired accuracy level for subsequent location requests. Higher accuracy may increase power consumption and require additional permissions.

**Example**

```ts
await Location.setAccuracy("hundredMeters")
```

## Requesting Location

### requestCurrent

```ts
function requestCurrent(
  options?: { forceRequest?: boolean }
): Promise<LocationInfo | null>
```

Requests the device’s current location.

By default, a cached location is returned immediately if available. If no cached location exists, a new location request is performed.

When `forceRequest` is set to `true`, any cached location is ignored and a fresh request is always made.

**Example**

```ts
const location = await Location.requestCurrent()

if (location) {
  console.log(location.latitude, location.longitude)
}
```

Forcing a fresh location request:

```ts
const location = await Location.requestCurrent({
  forceRequest: true
})
```

### pickFromMap

```ts
function pickFromMap(): Promise<LocationInfo | null>
```

Presents the system map interface and allows the user to manually select a location.

**Example**

```ts
const picked = await Location.pickFromMap()

if (picked) {
  console.log("Picked location:", picked.latitude, picked.longitude)
}
```

## Geocoding

### reverseGeocode

```ts
function reverseGeocode(options: {
  latitude: number
  longitude: number
  locale?: string
}): Promise<LocationPlacemark[] | null>
```

Converts a geographic coordinate into human-readable address information.

**Example**

```ts
const placemarks = await Location.reverseGeocode({
  latitude: 39.9042,
  longitude: 116.4074,
  locale: "en-US"
})

console.log(placemarks?.[0]?.locality)
```

### geocodeAddress

```ts
function geocodeAddress(options: {
  address: string
  locale?: string
}): Promise<LocationPlacemark[] | null>
```

Converts a textual address into geographic placemark results.

**Example**

```ts
const results = await Location.geocodeAddress({
  address: "Times Square",
  locale: "en-US"
})

const location = results?.[0]?.location
```

## Heading and Compass

### requestHeading

```ts
function requestHeading(): Promise<Heading | null>
```

Returns the most recently reported heading. If heading updates have never been started, the result is `null`.

**Example**

```ts
const heading = await Location.requestHeading()

if (heading) {
  console.log(heading.trueHeading)
}
```

### startUpdatingHeading

```ts
function startUpdatingHeading(options?: {
  requestAlwaysAuthorization?: boolean
}): Promise<{ mode: "always" | "whenInUse" }>
```

Starts continuous heading updates.

When `options.requestAlwaysAuthorization` is `true`, the system requests "Always" authorization
instead of the default "When In Use".

The promise resolves with `{ mode }` reflecting the authorization actually granted by the
system. If you requested `"always"` but `mode` resolves as `"whenInUse"`, iOS did not (or
could not) prompt the user — typically because the user has already declined the upgrade
once. iOS allows only a single programmatic Always upgrade attempt; afterwards the user must
go to **Settings → Privacy & Security → Location Services → Scripting → Always** manually.

### stopUpdatingHeading

```ts
function stopUpdatingHeading(): void
```

Stops heading updates and releases related system resources.

### addHeadingListener

```ts
function addHeadingListener(
  listener: (heading: Heading) => void
): void
```

Registers a listener that is called whenever the heading changes.

**Example**

```ts
await Location.startUpdatingHeading()

Location.addHeadingListener(heading => {
  console.log("Heading:", heading.trueHeading)
})
```

### removeHeadingListener

```ts
function removeHeadingListener(
  listener?: (heading: Heading) => void
): void
```

Removes a previously registered heading listener. If no listener is provided, all heading listeners are removed.

### startUpdatingLocation

```ts
function startUpdatingLocation(options?: {
  requestAlwaysAuthorization?: boolean
}): Promise<{ mode: "always" | "whenInUse" }>
```

Starts continuous location updates. Subsequent updates are delivered to listeners registered via
`addLocationListener`.

When `options.requestAlwaysAuthorization` is `true`, the system requests "Always" authorization,
which is required if you intend to keep receiving updates while the app is backgrounded.

The promise resolves with `{ mode }` reflecting the authorization actually granted. If you
requested `"always"` but `mode` resolves as `"whenInUse"`, iOS suppressed the upgrade prompt
(only one programmatic Always upgrade attempt is permitted per app install). Direct the user
to **Settings → Privacy & Security → Location Services → Scripting → Always** to grant it
manually.

### stopUpdatingLocation

```ts
function stopUpdatingLocation(): void
```

Stops continuous location updates and releases related system resources.
This does not affect one-shot calls such as `requestCurrent`.

### addLocationListener

```ts
function addLocationListener(
  listener: (location: LocationInfo) => void
): void
```

Registers a listener that is called whenever a new location is reported.

**Example**

```ts
await Location.startUpdatingLocation()

Location.addLocationListener(location => {
  console.log("Lat/Lng:", location.latitude, location.longitude)
})
```

### removeLocationListener

```ts
function removeLocationListener(
  listener?: (location: LocationInfo) => void
): void
```

Removes a previously registered location listener. If no listener is provided, all location
listeners are removed and continuous updates stop.

### allowsBackgroundLocationUpdates / setAllowsBackgroundLocationUpdates

```ts
const allowsBackgroundLocationUpdates: boolean
function setAllowsBackgroundLocationUpdates(value: boolean): void
```

Whether the app receives location updates while in the background.

### pausesLocationUpdatesAutomatically / setPausesLocationUpdatesAutomatically

```ts
const pausesLocationUpdatesAutomatically: boolean
function setPausesLocationUpdatesAutomatically(value: boolean): void
```

Whether the system automatically pauses location updates when location data is unlikely to change.

### showsBackgroundLocationIndicator / setShowsBackgroundLocationIndicator

```ts
const showsBackgroundLocationIndicator: boolean
function setShowsBackgroundLocationIndicator(value: boolean): void
```

Whether the status bar background indicator is shown when the app uses location services
in the background under `authorizedAlways`.

### distanceFilter / setDistanceFilter

```ts
const distanceFilter: number
function setDistanceFilter(meters: number): void
```

The minimum horizontal distance (in meters) the device must move before a new update is
generated. Use `-1` to receive every movement.

### headingFilter / setHeadingFilter

```ts
const headingFilter: number
function setHeadingFilter(degrees: number): void
```

The minimum angular change (in degrees) required before a heading update is generated.
Use `-1` to receive every change.

### activityType / setActivityType

```ts
const activityType: ActivityType
function setActivityType(value: ActivityType): void
```

A hint that helps iOS optimize battery usage and accuracy:
`"other"`, `"automotiveNavigation"`, `"fitness"`, `"otherNavigation"` or `"airborne"`.
