import {
  Button,
  List,
  Navigation,
  NavigationStack,
  Script,
  Section,
  Text,
  Toggle,
  useEffect,
  useState,
  VStack,
} from "scripting"

const accuracyCycle: LocationAccuracy[] = [
  "best",
  "tenMeters",
  "hundredMeters",
  "kilometer",
  "threeKilometers",
  "bestForNavigation",
  "reduced",
]

const activityCycle: Location.ActivityType[] = [
  "other",
  "automotiveNavigation",
  "fitness",
  "otherNavigation",
  "airborne",
]

function nextOf<T>(items: T[], current: T): T {
  const idx = items.indexOf(current)
  return items[(idx + 1) % items.length]
}

function fmt(n: number, digits = 4): string {
  return Number.isFinite(n) ? n.toFixed(digits) : String(n)
}

// Show a hint when "Always" was requested but iOS only granted "When In Use".
function maybeWarnAlwaysUpgrade(
  requested: boolean,
  result: { mode: "always" | "whenInUse" }
) {
  if (requested && result.mode !== "always") {
    Dialog.alert({
      title: "Always not granted",
      message:
        'iOS did not prompt for "Always" upgrade. Open Settings → Privacy & ' +
        'Security → Location Services → Scripting → Always to enable it manually.'
    })
  }
}

function Example() {
  const dismiss = Navigation.useDismiss()

  // Streaming readouts
  const [latestLocation, setLatestLocation] = useState<LocationInfo | null>(null)
  const [latestHeading, setLatestHeading] = useState<Location.Heading | null>(null)
  const [streamingLocation, setStreamingLocation] = useState(false)
  const [streamingHeading, setStreamingHeading] = useState(false)

  // Settings (mirrored to component state for UI re-render)
  const [accuracy, setAccuracyState] = useState<LocationAccuracy>(Location.accuracy)
  const [activityType, setActivityTypeState] = useState<Location.ActivityType>(Location.activityType)
  const [allowsBg, setAllowsBg] = useState(Location.allowsBackgroundLocationUpdates)
  const [pausesAuto, setPausesAuto] = useState(Location.pausesLocationUpdatesAutomatically)
  const [showsIndicator, setShowsIndicator] = useState(Location.showsBackgroundLocationIndicator)
  const [distanceFilter, setDistanceFilterState] = useState(Location.distanceFilter)
  const [headingFilter, setHeadingFilterState] = useState(Location.headingFilter)

  // Cleanup streams on unmount.
  useEffect(() => {
    return () => {
      Location.removeLocationListener()
      Location.removeHeadingListener()
      Location.stopUpdatingLocation()
      Location.stopUpdatingHeading()
    }
  }, [])

  return <NavigationStack>
    <List
      navigationTitle={"Location"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        cancellationAction: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
    >
      {/* Read-only state */}
      <Section
        header={<Text>Status</Text>}
      >
        <VStack alignment={"leading"}>
          <Text font={"headline"}>isAuthorizedForWidgetUpdates</Text>
          <Text font={"caption"}>{String(Location.isAuthorizedForWidgetUpdates)}</Text>
        </VStack>
        <VStack alignment={"leading"}>
          <Text font={"headline"}>accuracy</Text>
          <Text font={"caption"}>{accuracy}</Text>
        </VStack>
        <VStack alignment={"leading"}>
          <Text font={"headline"}>activityType</Text>
          <Text font={"caption"}>{activityType}</Text>
        </VStack>
      </Section>

      {/* One-shot APIs */}
      <Section header={<Text>One-shot</Text>}>
        <Button
          title={"requestCurrent (cached if available)"}
          action={async () => {
            const loc = await Location.requestCurrent()
            Dialog.alert({
              message: loc
                ? `lat=${fmt(loc.latitude)}\nlng=${fmt(loc.longitude)}`
                : "No location returned."
            })
          }}
        />
        <Button
          title={"requestCurrent ({ forceRequest: true })"}
          action={async () => {
            const loc = await Location.requestCurrent({ forceRequest: true })
            Dialog.alert({
              message: loc
                ? `lat=${fmt(loc.latitude)}\nlng=${fmt(loc.longitude)}`
                : "No location returned."
            })
          }}
        />
        <Button
          title={"requestHeading"}
          action={async () => {
            const h = await Location.requestHeading()
            Dialog.alert({
              message: h
                ? `trueHeading=${fmt(h.trueHeading, 1)}\nmagnetic=${fmt(h.magneticHeading, 1)}`
                : "No heading available."
            })
          }}
        />
        <Button
          title={"pickFromMap"}
          action={async () => {
            const picked = await Location.pickFromMap()
            Dialog.alert({
              message: picked
                ? `lat=${fmt(picked.latitude)}\nlng=${fmt(picked.longitude)}`
                : "Cancelled."
            })
          }}
        />
        <Button
          title={"reverseGeocode (Apple Park)"}
          action={async () => {
            try {
              const placemarks = await Location.reverseGeocode({
                latitude: 37.334900,
                longitude: -122.009020,
              })
              const first = placemarks?.[0]
              Dialog.alert({
                message: first
                  ? `${first.name ?? ""}\n${first.locality ?? ""}, ${first.country ?? ""}`
                  : "No placemark found."
              })
            } catch (e) {
              Dialog.alert({ message: String(e) })
            }
          }}
        />
        <Button
          title={"geocodeAddress (\"1 Infinite Loop\")"}
          action={async () => {
            try {
              const placemarks = await Location.geocodeAddress({
                address: "1 Infinite Loop, Cupertino, CA",
              })
              const first = placemarks?.[0]
              Dialog.alert({
                message: first?.location
                  ? `lat=${fmt(first.location.latitude)}\nlng=${fmt(first.location.longitude)}`
                  : "No result."
              })
            } catch (e) {
              Dialog.alert({ message: String(e) })
            }
          }}
        />
      </Section>

      {/* Heading stream */}
      <Section
        header={<Text>Heading stream</Text>}
        footer={<Text>Toggle on to subscribe via addHeadingListener.</Text>}
      >
        <Toggle
          title={"startUpdatingHeading"}
          value={streamingHeading}
          onChanged={async (on) => {
            if (on) {
              try {
                const result = await Location.startUpdatingHeading({ requestAlwaysAuthorization: false })
                maybeWarnAlwaysUpgrade(false, result)
                Location.addHeadingListener(setLatestHeading)
                setStreamingHeading(true)
              } catch (e) {
                Dialog.alert({ message: String(e) })
              }
            } else {
              Location.removeHeadingListener(setLatestHeading)
              Location.stopUpdatingHeading()
              setStreamingHeading(false)
              setLatestHeading(null)
            }
          }}
        />
        <VStack alignment={"leading"}>
          <Text font={"headline"}>latest heading</Text>
          <Text font={"caption"}>
            {latestHeading
              ? `true=${fmt(latestHeading.trueHeading, 1)}° / mag=${fmt(latestHeading.magneticHeading, 1)}°`
              : "—"}
          </Text>
        </VStack>
      </Section>

      {/* Location stream */}
      <Section
        header={<Text>Location stream</Text>}
        footer={<Text>Toggle on to subscribe via addLocationListener.</Text>}
      >
        <Toggle
          title={"startUpdatingLocation (whenInUse)"}
          value={streamingLocation}
          onChanged={async (on) => {
            if (on) {
              try {
                const result = await Location.startUpdatingLocation({ requestAlwaysAuthorization: false })
                maybeWarnAlwaysUpgrade(false, result)
                Location.addLocationListener(setLatestLocation)
                setStreamingLocation(true)
              } catch (e) {
                Dialog.alert({ message: String(e) })
              }
            } else {
              Location.removeLocationListener(setLatestLocation)
              Location.stopUpdatingLocation()
              setStreamingLocation(false)
              setLatestLocation(null)
            }
          }}
        />
        <Button
          title={"Restart with requestAlwaysAuthorization"}
          action={async () => {
            Location.removeLocationListener(setLatestLocation)
            Location.stopUpdatingLocation()
            try {
              const result = await Location.startUpdatingLocation({ requestAlwaysAuthorization: true })
              maybeWarnAlwaysUpgrade(true, result)
              Location.addLocationListener(setLatestLocation)
              setStreamingLocation(true)
            } catch (e) {
              Dialog.alert({ message: String(e) })
            }
          }}
        />
        <VStack alignment={"leading"}>
          <Text font={"headline"}>latest location</Text>
          <Text font={"caption"}>
            {latestLocation
              ? `lat=${fmt(latestLocation.latitude)} / lng=${fmt(latestLocation.longitude)}`
              : "—"}
          </Text>
        </VStack>
      </Section>

      {/* Settings */}
      <Section
        header={<Text>Settings</Text>}
        footer={<Text>Tap a value to cycle through valid options.</Text>}
      >
        <Button
          title={`setAccuracy → ${accuracy}`}
          action={async () => {
            const next = nextOf(accuracyCycle, accuracy)
            await Location.setAccuracy(next)
            setAccuracyState(next)
          }}
        />
        <Button
          title={`setActivityType → ${activityType}`}
          action={() => {
            const next = nextOf(activityCycle, activityType)
            Location.setActivityType(next)
            setActivityTypeState(next)
          }}
        />
        <Toggle
          title={"allowsBackgroundLocationUpdates"}
          value={allowsBg}
          onChanged={(on) => {
            Location.setAllowsBackgroundLocationUpdates(on)
            setAllowsBg(on)
          }}
        />
        <Toggle
          title={"pausesLocationUpdatesAutomatically"}
          value={pausesAuto}
          onChanged={(on) => {
            Location.setPausesLocationUpdatesAutomatically(on)
            setPausesAuto(on)
          }}
        />
        <Toggle
          title={"showsBackgroundLocationIndicator"}
          value={showsIndicator}
          onChanged={(on) => {
            Location.setShowsBackgroundLocationIndicator(on)
            setShowsIndicator(on)
          }}
        />
        <Button
          title={`setDistanceFilter → ${distanceFilter}m`}
          action={() => {
            // -1 (none) → 0 → 10 → 100 → 500 → -1
            const presets = [-1, 0, 10, 100, 500]
            const idx = presets.indexOf(distanceFilter)
            const next = presets[(idx + 1) % presets.length]
            Location.setDistanceFilter(next)
            setDistanceFilterState(next)
          }}
        />
        <Button
          title={`setHeadingFilter → ${headingFilter}°`}
          action={() => {
            const presets = [-1, 1, 5, 15, 45]
            const idx = presets.indexOf(headingFilter)
            const next = presets[(idx + 1) % presets.length]
            Location.setHeadingFilter(next)
            setHeadingFilterState(next)
          }}
        />
      </Section>
    </List>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()
