import {
  Button, HStack, Map, Marker, Navigation, NavigationStack,
  Script, ScrollView, Text, TextField, useEffect, useMemo, useObservable, useRef,
  useState, VStack,
} from "scripting"

// Demo center: People's Square, Shanghai
const initialRegion = {
  center: { latitude: 31.2304, longitude: 121.4737 },
  span: { latitudeDelta: 0.05, longitudeDelta: 0.05 },
}

function LocateDemo() {
  const [query, setQuery] = useState("coffee")
  const [items, setItems] = useState<MapItem[]>([])
  const [isLoading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(initialRegion))
  // Phase 3h: <Map itemSelection> binds the tapped MapItem directly.
  // Apple's `itemDetailSelectionAccessory` shows the auto-generated detail card.
  // Apple POI taps are handled by `featureSelectionAccessory` (also auto card)
  // and don't fire this observable. iOS 17 silently no-ops on both.
  const selectedItem = useObservable<MapItem | null>(null)

  const search = async () => {
    setLoading(true)
    setErr(null)
    selectedItem.setValue(null)
    try {
      const result = await MapSearch.locate({
        query,
        region: initialRegion,
        resultTypes: ["pointOfInterest"],
      })
      setItems(result)
      // Auto-fit the map around the results.
      const fit = MapUtils.regionFromCoordinates(result.map(i => i.coordinate))
      if (fit) position.setValue(MapCameraPosition.region(fit))
    } catch (e) {
      setErr(String(e))
    } finally {
      setLoading(false)
    }
  }

  // Hand the first result off to Apple Maps with walking directions overlaid.
  const openFirstInMaps = async () => {
    const first = items[0]
    if (!first) return
    await first.openInMaps({ directionsMode: "walking", showsTraffic: true })
  }

  // forCurrentLocation() returns Apple's placeholder MapItem that
  // resolves to the device's location inside Apple Maps — no permission needed.
  const openCurrentInMaps = () => MapItem.forCurrentLocation().openInMaps()

  // Distance from the search center to the selected marker, via MapItem.distance.
  const selected = selectedItem.value
  const selectedDistance = selected != null
    ? MapUtils.formatDistance(selected.distance(initialRegion.center))
    : null

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>1. `MapSearch.locate` + selection</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      {`One-shot search for points of interest near People's Square. Each hit
      drops into a \`<Marker item={item}>\`. Tapping (iOS 18+) writes the
      tapped MapItem into \`itemSelection\` and Apple shows its built-in
      detail card via \`itemDetailSelectionAccessory\`. Tapping an Apple-rendered
      POI label shows the same auto card via \`featureSelectionAccessory\`.`}
    </Text>
    <TextField
      title="query"
      value={query}
      onChanged={setQuery}
      prompt="Search keyword"
    />
    <HStack spacing={8}>
      <Button title={isLoading ? "Searching..." : "Search"} action={search} />
      <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
        {items.length} hits
      </Text>
    </HStack>
    {items.length > 0
      ? <Button
        title={`Open "${items[0].name ?? "first hit"}" in Maps`}
        buttonStyle="bordered"
        action={openFirstInMaps}
      />
      : null}
    <Button
      title="Open current location in Maps"
      buttonStyle="bordered"
      action={openCurrentInMaps}
    />
    {selected != null
      ? <VStack alignment={"leading"} spacing={2}>
        <Text font={"caption"} foregroundStyle={"systemBlue"}>
          Selected: {selected.name ?? "(unnamed)"}
        </Text>
        {selected.formattedAddress != null
          ? <Text font={"caption2"} foregroundStyle={"secondaryLabel"}>
            {selected.formattedAddress}
          </Text>
          : null}
        {selectedDistance != null
          ? <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
            {selectedDistance} from search center
          </Text>
          : null}
      </VStack>
      : null}
    {err != null
      ? <Text font={"caption"} foregroundStyle={"systemRed"}>{err}</Text>
      : null}
    <Map
      cameraPosition={position}
      itemSelection={selectedItem}
      // `"callout"` is an inline anchored bubble — does not trigger a sheet
      // presentation. Safe inside `Navigation.present`-style nested modals.
      // `"automatic"` / `"sheet"` may conflict with the parent modal chain
      // (iOS 18 currently aborts with "already presenting" — see Phase 3h docs).
      itemDetailSelectionAccessory="callout"
      featureSelectionAccessory="callout"
      frame={{ height: 280 }}
      clipShape={{ type: 'rect', cornerRadius: 12 }}
    >
      {items.map(item => (
        // Item-based marker — MapKit picks the POI glyph and uses item.name
        // as the marker title. The same MapItem reference is what itemSelection
        // observes when the user taps the marker.
        <Marker
          item={item}
          tint={selected === item ? "systemRed" : "systemBlue"}
        />
      ))}
    </Map>
  </VStack>
}

function CompleterDemo() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<MapSearch.MapSearchCompletion[]>([])
  const [resolved, setResolved] = useState<MapItem[]>([])
  const [resolveErr, setResolveErr] = useState<string | null>(null)

  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(initialRegion))

  // Hold the completer in a ref so it survives re-renders.
  const completerRef = useRef<ReturnType<typeof MapSearch.createCompleter> | null>(null)

  useEffect(() => {
    const c = MapSearch.createCompleter({
      region: initialRegion,
      resultTypes: ["pointOfInterest", "address"],
    })
    completerRef.current = c
    const listener = (suggs: MapSearch.MapSearchCompletion[]) => {
      setSuggestions(suggs)
    }
    c.addListener(listener)
    return () => {
      c.removeListener(listener)
      c.dispose()
      completerRef.current = null
    }
  }, [])

  const onQueryChange = (text: string) => {
    setQuery(text)
    completerRef.current?.setQuery(text)
  }

  const onPickSuggestion = async (s: MapSearch.MapSearchCompletion) => {
    setResolveErr(null)
    try {
      const items = await completerRef.current!.resolve(s)
      setResolved(items)
      const fit = MapUtils.regionFromCoordinates(items.map(i => i.coordinate))
      if (fit) position.setValue(MapCameraPosition.region(fit))
    } catch (e) {
      setResolveErr(String(e))
    }
  }

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>2. `MapSearch.createCompleter`</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      Stateful autocomplete. Type and watch suggestions update live. Tap one to
      resolve it to `MapItem[]` and drop the hits on the map.
    </Text>
    <TextField
      title="query"
      value={query}
      onChanged={onQueryChange}
      prompt="Start typing..."
    />
    <VStack alignment={"leading"} spacing={4}>
      {suggestions.slice(0, 6).map(s => (
        <Button
          title={s.title + (s.subtitle ? ` — ${s.subtitle}` : "")}
          buttonStyle="bordered"
          action={() => onPickSuggestion(s)}
        />
      ))}
    </VStack>
    {resolveErr != null
      ? <Text font={"caption"} foregroundStyle={"systemRed"}>{resolveErr}</Text>
      : null}
    <Map
      cameraPosition={position}
      frame={{ height: 240 }}
      clipShape={{ type: 'rect', cornerRadius: 12 }}
    >
      {resolved.map(item => (
        <Marker item={item} tint="systemRed" />
      ))}
    </Map>
    <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
      Note: a completion's `id` is invalidated by the next suggestion batch — pick
      from the current list, not a stale state snapshot.
    </Text>
  </VStack>
}

function POIFilterDemo() {
  const [items, setItems] = useState<MapItem[]>([])
  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(initialRegion))

  const run = async (filter: any, label: string) => {
    const result = await MapSearch.locate({
      query: "shop",
      region: initialRegion,
      pointOfInterestFilter: filter,
    })
    setItems(result)
    const fit = MapUtils.regionFromCoordinates(result.map(i => i.coordinate))
    if (fit) position.setValue(MapCameraPosition.region(fit))
    console.log(`${label}: ${result.length} hits`)
  }

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>3. `pointOfInterestFilter`</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      {`Restrict POI categories in search results. Same \`MapPointsOfInterestSpec\`
      union accepted by \`<Map mapStyle>\`.`}
    </Text>
    <HStack spacing={8}>
      <Button
        title="cafe + restaurant only"
        buttonStyle="bordered"
        action={() => run({ includes: ["cafe", "restaurant"] }, "includes")}
      />
      <Button
        title="exclude gasStation"
        buttonStyle="bordered"
        action={() => run({ excludes: ["gasStation"] }, "excludes")}
      />
    </HStack>
    <Map
      cameraPosition={position}
      frame={{ height: 240 }}
      clipShape={{ type: 'rect', cornerRadius: 12 }}
    >
      {items.map(item => (
        <Marker item={item} tint="systemGreen" />
      ))}
    </Map>
  </VStack>
}

function Example() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle="Map Search"
      toolbar={{
        cancellationAction: <Button
          title="Close"
          action={dismiss}
        />
      }}
    >
      <VStack
        navigationTitle={"MapSearch"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={24}
        padding
      >
        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          MapKit on-device search. No permissions required — coordinates can flow
          directly into `Marker` / `Map` from the views layer. For typeahead UIs,
          prefer `createCompleter` over polling `locate` on every keystroke.
        </Text>

        <LocateDemo />
        <CompleterDemo />
        <POIFilterDemo />
      </VStack>
    </ScrollView>
  </NavigationStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
