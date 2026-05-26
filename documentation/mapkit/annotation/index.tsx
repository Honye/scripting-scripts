import {
  Annotation, Button, Circle, HStack, Map, Marker, Navigation, NavigationStack,
  Picker, RoundedRectangle, Script, ScrollView, Spacer, Text, useEffect, useObservable, useState,
  VStack, ZStack,
} from "scripting"
import type { KeywordPoint, MapAnnotationLabelVisibility, MapSelectionValue } from "scripting"

// Demo center: People's Square, Shanghai
const initialRegion = {
  center: { latitude: 31.2304, longitude: 121.4737 },
  span: { latitudeDelta: 0.05, longitudeDelta: 0.05 },
}

// Three landmarks around the demo center.
const points = [
  { id: "bund", name: "Bund", coord: { latitude: 31.2397, longitude: 121.4906 } },
  { id: "lujia", name: "Lujiazui", coord: { latitude: 31.2397, longitude: 121.5000 } },
  { id: "xtd", name: "Xintiandi", coord: { latitude: 31.2218, longitude: 121.4760 } },
] as const

type PointId = (typeof points)[number]["id"]

function CustomPinDemo() {
  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(initialRegion))
  const selection = useObservable<MapSelectionValue | null>(null)

  const tappedId =
    selection.value != null && selection.value.type === "marker"
      ? (selection.value.tag as PointId)
      : null
  const tapped = points.find(p => p.id === tappedId)

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>{`1. Custom-content \`<Annotation>\``}</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      {`Each pin is a custom SwiftUI subtree (rounded chip with letter). Tapping
      a chip writes its \`tag\` into \`<Map selection>\`; we use that to grow the
      selected chip and tint it red.`}
    </Text>
    {tapped != null
      ? <Text font={"caption"} foregroundStyle={"systemBlue"}>
        Selected: {tapped.name}
      </Text>
      : <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
        Tap a chip to select it.
      </Text>}
    <Map
      cameraPosition={position}
      selection={selection}
      frame={{ height: 280 }}
      clipShape={{ type: "rect", cornerRadius: 12 }}
    >
      {points.map(p => {
        const isSelected = p.id === tappedId
        return <Annotation
          coordinate={p.coord}
          title={p.name}
          anchor="bottom"
          tag={p.id}
        >
          <ZStack>
            <RoundedRectangle
              cornerRadius={10}
              fill={isSelected ? "systemRed" : "systemBlue"}
              frame={{ width: isSelected ? 32 : 24, height: isSelected ? 32 : 24 }}
            />
            <Text
              font={isSelected ? "headline" : "caption"}
              foregroundStyle={"white"}
            >
              {p.name.charAt(0)}
            </Text>
          </ZStack>
        </Annotation>
      })}
    </Map>
  </VStack>
}

function AnchorPickerDemo() {
  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(initialRegion))
  const [anchor, setAnchor] = useState<KeywordPoint>("center")

  const anchorOptions: KeywordPoint[] = [
    "center", "top", "bottom", "leading", "trailing",
    "topLeading", "topTrailing", "bottomLeading", "bottomTrailing",
  ]

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>2. `anchor` placement</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      The same content view, anchored at different `KeywordPoint`s relative to
      the same coordinate. `"bottom"` is the classic pin-style anchor (pin
      tip sits on the spot); `"center"` puts the visual center on the spot.
    </Text>
    <Picker title="anchor" value={anchor} onChanged={(v: any) => setAnchor(v as KeywordPoint)}>
      {anchorOptions.map(opt => (
        <Text tag={opt}>{opt}</Text>
      ))}
    </Picker>
    <Map
      cameraPosition={position}
      frame={{ height: 240 }}
      clipShape={{ type: "rect", cornerRadius: 12 }}
    >
      <Annotation
        coordinate={initialRegion.center}
        title=""
        anchor={anchor}
      >
        <ZStack>
          <Circle fill="systemOrange" frame={{ width: 28, height: 28 }} />
          <Text font="caption2" foregroundStyle={"white"}>●</Text>
        </ZStack>
      </Annotation>
      {/* Reference pin marks the exact coordinate the annotation is anchored to. */}
      <Marker title="" coordinate={initialRegion.center} tint="systemRed" />
    </Map>
    <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
      The red Marker pin marks the actual coordinate. Compare its position to
      the orange annotation as you cycle through anchors.
    </Text>
  </VStack>
}

function TitleVisibilityDemo() {
  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(initialRegion))
  const [titles, setTitles] = useState<MapAnnotationLabelVisibility>("automatic")

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>{`3. \`<Map annotationTitles>\``}</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      {`Toggle the global title visibility. \`annotationTitles\` applies to
      \`Marker(item:)\`, \`<Annotation title>\`, and Apple POI labels in the
      same map.`}
    </Text>
    <Picker title="annotationTitles" value={titles} onChanged={(v: any) => setTitles(v as MapAnnotationLabelVisibility)}>
      <Text tag="automatic">automatic</Text>
      <Text tag="visible">visible</Text>
      <Text tag="hidden">hidden</Text>
    </Picker>
    <Map
      cameraPosition={position}
      annotationTitles={titles}
      frame={{ height: 240 }}
      clipShape={{ type: "rect", cornerRadius: 12 }}
    >
      {points.map(p => (
        <Annotation coordinate={p.coord} title={p.name} anchor="bottom">
          <Circle fill="systemGreen" frame={{ width: 20, height: 20 }} />
        </Annotation>
      ))}
    </Map>
  </VStack>
}

function SelectionPopoverDemo() {
  const position = useObservable<MapCameraPosition>(MapCameraPosition.region(initialRegion))
  // selection 走 <Map selection>(Phase 3f),annotation tap 写入 { type:"marker", tag }
  const selection = useObservable<MapSelectionValue | null>(null)
  // popover 用 Observable<boolean> 形式,直接跟 selection 状态同步
  const popoverShown = useObservable(false)

  // selection → popover 双向同步:
  //  - 点中 annotation → 显示 popover
  //  - 点空白 / 关闭 popover → 清空 selection
  useEffect(() => {
    const isMarker =
      selection.value?.type === "marker" && selection.value.tag === "popover-pin"
    popoverShown.setValue(isMarker)
  }, [selection.value])

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>{`4. Selection-driven popover`}</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      {`SwiftUI 原生模式:annotation content view 上直接挂 \`popover\` modifier。
      tap 写入 selection observable,我们再把它同步到 popover 的 isPresented。`}
    </Text>
    <Map
      cameraPosition={position}
      selection={selection}
      frame={{ height: 280 }}
      clipShape={{ type: "rect", cornerRadius: 12 }}
    >
      <Annotation
        coordinate={initialRegion.center}
        title="People's Square"
        anchor="bottom"
        tag="popover-pin"
      >
        <ZStack
          popover={{
            isPresented: popoverShown,
            arrowEdge: "bottom",
            presentationCompactAdaptation: "popover",
            content: <VStack alignment={"leading"} spacing={8} padding>
              <Text font={"headline"}>People's Square</Text>
              <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
                The popover anchors automatically to the annotation it sits on.
                Tap the map background to dismiss — selection clears and the
                popover hides via the observable.
              </Text>
              <HStack>
                <Spacer />
                <Button title="Close" action={() => selection.setValue(null)} />
              </HStack>
            </VStack>,
          }}
        >
          <Circle fill="systemPurple" frame={{ width: 28, height: 28 }} />
          <Text font="caption2" foregroundStyle={"white"}>i</Text>
        </ZStack>
      </Annotation>
    </Map>
    <Text font={"caption2"} foregroundStyle={"tertiaryLabel"}>
      {`Apple's \`itemDetailSelectionAccessory\` is only for \`Marker(item:)\`. For
      \`<Annotation>\` you roll the card yourself with the same view modifier
      you'd use on any other view.`}
    </Text>
  </VStack>
}

function Example() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle="Map Annotation"
      toolbar={{
        cancellationAction: <Button
          title="Close"
          action={dismiss}
        />
      }}
    >
      <VStack
        navigationTitle={"Annotation"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={24}
        padding
      >
        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          {`Custom-content map annotations. Use whenever a pin's visual needs to
          be something other than a stock MapKit marker glyph. Coexists with
          \`<Marker>\` in the same \`<Map>\` and shares the \`<Map selection>\` /
            \`tag\` selection mechanism.`}
        </Text>

        <CustomPinDemo />
        <AnchorPickerDemo />
        <TitleVisibilityDemo />
        <SelectionPopoverDemo />
      </VStack>
    </ScrollView>
  </NavigationStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
