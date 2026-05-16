This example demonstrates four chart interaction / customization features:

* **`ChartOverlay`** — a reader-style child of `<Chart>` that gives custom content access to a `ChartProxy` for hit-testing, value↔coordinate conversion, and reading the plot area frame. Mirrors SwiftUI Charts' `chartOverlay(alignment:content:) { proxy in ... }`.
* **Range selection** — pass `from` / `to` (instead of `value`) to `chartXSelection` / `chartYSelection` and the bridge wires up SwiftUI's `chartXSelection(range:)` / `chartYSelection(range:)` overload.
* **`ChartGesture`** — another reader-style child of `<Chart>`. The closure returns any `Gesture` descriptor and receives a writable `ChartProxy` so you can drive selection with custom gestures (e.g. single-finger drag-range on a categorical String axis). Mirrors `chartGesture(_:) { proxy in ... }`.
* **`ChartPlotStyle`** — a reader-style child whose closure builds a chain of plot-area modifiers (background / border / frame / shadow / corner radius / clip shape / opacity). Mirrors `chartPlotStyle { plot in plot.background(...).border(...) }`.

---

## ChartOverlay quick reference

```tsx
import { Chart, ChartOverlay, ChartProxy } from "scripting"

<Chart>
  <BarChart marks={...} />
  <ChartOverlay alignment={"topLeading"}>
    {(proxy: ChartProxy) => (
      // Render any view on top of the chart.
      // proxy.value / proxy.position / proxy.plotAreaSize are available here.
    )}
  </ChartOverlay>
</Chart>
```

`ChartProxy` is synchronous and returns `null` when the type token does not match the chart's actual axis data type:

```ts
interface ChartProxy {
  // Read: lookup / position / plot area
  value(args: { atX?: number; atY?: number; as: 'string' | 'number' | 'date' })
    : string | number | Date | null
  position(args: { x?: string | number | Date; y?: string | number | Date })
    : { x: number; y: number } | null
  readonly plotAreaSize: { width: number; height: number }
  readonly plotAreaFrame: { x: number; y: number; width: number; height: number }

  // Write: drive selection (use inside <ChartGesture>)
  selectXRange(args: { from: number; to: number }): void
  selectYRange(args: { from: number; to: number }): void
  selectXValue(args: { at: number }): void
  selectYValue(args: { at: number }): void
  selectAngleValue(args: { atRadians: number }): void
}
```

---

## Range selection quick reference

```tsx
const [range, setRange] = useState<{ from: string; to: string } | null>(null)

<Chart
  chartXSelection={{
    valueType: "string",
    from: range?.from,
    to: range?.to,
    onChanged: setRange,
  }}
>
  ...
</Chart>
```

* The bridge dispatches on the **presence of `from` / `to`** to pick the SwiftUI `chartXSelection(range:)` overload. Single-value selection (`value` + `onChanged`) keeps working unchanged.
* `valueType: 'string' | 'number' | 'date'` — must match the chart's plotted axis data type.
* `onChanged` fires whenever the selection changes and again with `null` when the selection is cleared.

> **Axis-type constraint**: range selection only works on **continuous axes** (number / date). On categorical String axes SwiftUI Charts neither responds to the default range gesture nor reverse-maps screen-pixel coordinates back to a category, so even `<ChartGesture>` + `proxy.selectXRange(...)` cannot drive a String-axis range. For String axes use the single-value form (`ChartSelection`) instead.

### Activation gesture (platform-specific)

`chartXSelection(range:)` default gesture differs by platform — **this is a SwiftUI Charts SDK behaviour, not a bridge limitation**:

* **iOS**: a **two-finger tap** on the chart. In iOS Simulator, hold **⌥ Option** while clicking the chart to simulate a two-finger touch.
* **macOS**: a **drag gesture**.

Single-finger long-press-and-drag does NOT trigger range selection by default. If you need a single-finger interaction or any custom activation, use `<ChartGesture>` to take over the chart's gesture handling.

Sources: [Mastering charts in SwiftUI · Selection](https://swiftwithmajid.com/2023/07/18/mastering-charts-in-swiftui-selection/), [WWDC23 · Explore pie charts and interactivity in Swift Charts](https://developer.apple.com/videos/play/wwdc2023/10037/).

The two forms are mutually exclusive on a given axis. Use a single-value selection for tap interactions, and the range form for drag-to-zoom or drag-to-summarize gestures.

---

## Axis-label precision (ChartAxisLabelFormat)

In addition to the short string tokens (`'number' | 'percent' | 'currency' | 'date' | 'time' | 'dateTime'`), the `valueLabel.format` field of `chartXAxis` / `chartYAxis` accepts a native `ChartAxisLabelFormat` instance. Use it when you need fraction-digit precision, a fixed currency code, or a non-default date / time style — mirrors SwiftUI Foundation's `FormatStyle` family.

```tsx
<Chart chartYAxis={{
  valueLabel: {
    format: ChartAxisLabelFormat.currency({ currencyCode: "CNY", fractionDigits: 2 })
  }
}}>
  ...
</Chart>
```

Available factories:

| Factory | Plottable | Options |
|---|---|---|
| `ChartAxisLabelFormat.number({...})` | `Double` | `fractionDigits` (max) / `minFractionDigits` (min) |
| `ChartAxisLabelFormat.percent({...})` | `Double` | same as number (`0.42` → `42%`) |
| `ChartAxisLabelFormat.currency({...})` | `Double` | `fractionDigits` / `minFractionDigits` / `currencyCode` (defaults to device locale) |
| `ChartAxisLabelFormat.date({...})` | `Date` | `dateStyle`: `omitted` / `numeric` / `abbreviated` / `long` / `complete` |
| `ChartAxisLabelFormat.time({...})` | `Date` | `timeStyle`: `omitted` / `shortened` / `standard` / `complete` |
| `ChartAxisLabelFormat.dateTime({...})` | `Date` | both `dateStyle` and `timeStyle` |

> Short string tokens stay fully supported; pick whichever fits. Use the class when you need precision / currency / style; otherwise the concise `format: 'number'` form is plenty.

---

## ChartGesture quick reference

```tsx
import { Chart, ChartGesture, DragGesture } from "scripting"

<Chart
  chartXSelection={{ valueType: "number", from, to, onChanged: setRange }}
>
  ...marks...
  <ChartGesture>
    {(proxy) =>
      DragGesture({ minDistance: 0 })
        .onChanged(v => proxy.selectXRange({
          from: v.startLocation.x,
          to: v.location.x,
        }))
    }
  </ChartGesture>
</Chart>
```

* The closure returns a `Gesture` descriptor (`DragGesture()` / `TapGesture()` / `LongPressGesture()` / `MagnifyGesture()` / `RotateGesture()`), equivalent to SwiftUI's `chartGesture { proxy in ... }`.
* `proxy.selectXRange / selectYRange / selectXValue / selectYValue / selectAngleValue` accept **screen-space pixel coordinates** (not data values) — feed `DragGesture` event `startLocation.x` / `location.x` directly without reverse-mapping.
* After writing the selection, the matching `chartXSelection / chartYSelection / chartAngleSelection` binding fires `onChanged` with the bound data values.
* Only the first `<ChartGesture>` child of a chart is used (same rule as `<ChartOverlay>`).
* Use this to **replace** the default gesture (single-finger drag, custom activation, etc.).
* **Axis-type constraint**: same as the default range gesture — only number / date axes are supported. On categorical String axes the SDK can't reverse-map pixels back to a category, so `proxy.selectXRange` on a String axis won't fire `onChanged`.

---

## ChartPlotStyle quick reference

```tsx
import { Chart, ChartPlotStyle } from "scripting"

<Chart>
  <BarChart marks={...} />
  <ChartPlotStyle>
    {(plot) =>
      plot
        .background({ color: "gray", opacity: 0.1 })
        .border({ color: "gray", width: 1 })
        .frame({ height: 240 })
    }
  </ChartPlotStyle>
</Chart>
```

The closure receives an empty `ChartPlotProxy` and must return a (possibly transformed) `ChartPlotProxy`. Each chained call returns a new immutable proxy and accumulates an op; the bridge replays the ops on the real `ChartPlotContent` view inside `chartPlotStyle { plot in ... }`.

Available builder methods:

| Method | Args | Maps to |
|---|---|---|
| `.background(arg)` | `Color` string, `Material` token, or `{ color?, material?, opacity? }` | `.background(...)` |
| `.border(arg)` | `{ color?, width? }` | `.border(color, width:)` |
| `.frame(arg)` | `{ width?, height? }` | `.frame(width:height:)` |
| `.padding(arg?)` | `number` / `EdgeInsets` / `{ horizontal?, vertical? }` / no-arg | `.padding(...)` |
| `.cornerRadius(r)` | `number` | `.clipShape(RoundedRectangle(cornerRadius: r))` |
| `.opacity(v)` | `number` | `.opacity(v)` |
| `.shadow(arg)` | `{ color?, radius?, x?, y? }` | `.shadow(color:radius:x:y:)` |
| `.clipShape(arg)` | `'capsule'` / `'rect'` / `{ rounded: <radius> }` | `.clipShape(...)` |

`Material` tokens: `'ultraThin'` / `'thin'` / `'regular'` / `'thick'` / `'ultraThick'` / `'bar'` (suffix `Material` is also accepted, e.g. `'regularMaterial'`).

> Like `<ChartOverlay>` and `<ChartGesture>`, only the FIRST `<ChartPlotStyle>` child of a chart is honored. The closure body must remain pure — `setState` calls inside will trigger an infinite chart-rebuild loop. Use it as a pure builder.

---

## Mark Accessibility

Each mark accepts three optional VoiceOver fields directly on its `ChartMarkProps`:

```tsx
<BarChart
  marks={data.map(d => ({
    label: d.year,
    value: d.sales,
    accessibilityLabel: `Year ${d.year}`,
    accessibilityValue: `${d.sales} dollars`,
    // accessibilityHidden: true,  // exclude this mark entirely
  }))}
/>
```

| Field | Maps to | Effect |
|---|---|---|
| `accessibilityLabel?: string` | `.accessibilityLabel(_:)` on `ChartContent` | Overrides the SDK's default label (which is synthesized from the mark's plotted values). |
| `accessibilityValue?: string` | `.accessibilityValue(_:)` | Sets the spoken value separately from the label. |
| `accessibilityHidden?: boolean` | `.accessibilityHidden(_:)` | When `true`, the mark is excluded from the VoiceOver tree (won't be focusable or spoken). |

These work on every mark type (`BarMark`, `LineMark`, `PointMark`, `RuleMark`, `RectangleMark`, `AreaMark`, sectors, ...) and are applied through the same `ChartContent.applyModifiers` path as `foregroundStyle` / `opacity` / etc.

> Test on a real device or in Simulator with `Settings → Accessibility → VoiceOver`. Swipe on the chart, then swipe right between marks to hear the labels you set.

---

## Pitfalls

* **`ChartOverlay` proxy is `null` on the very first synchronous render.** `<ChartOverlay>` falls back to `EmptyView` until SwiftUI has built the chart and injected a real proxy. Build for that case in your render function.
* **`SelectedRange / selectedRangeAxis` are NOT exposed on `ChartProxy`.** SwiftUI Charts does not surface range-selection state through `ChartProxy` — observe it through the `chartXSelection(range:)` / `chartYSelection(range:)` binding instead. The TS interface deliberately omits these.
* **`chartOverlay` does not have a `spacing` parameter.** Only `alignment` is supported (matches the SwiftUI API).
* **Keep overlay content cheap.** SwiftUI rebuilds the overlay closure every time the chart re-renders. Avoid heavy work or async kick-off inside.
* **`<ChartGesture>` / `<ChartOverlay>` closure body MUST stay pure.** SwiftUI Charts re-runs the closure on every chart rebuild; calling `setState` inside the body triggers a React re-render → another chart rebuild → the closure runs again → **infinite loop**. Push state changes into the gesture's `onChanged / onEnded` callbacks (which are user-event triggered) instead.
* **The `<ChartGesture>` closure must return a `GestureInfo`** (the value returned by `DragGesture()` / `TapGesture()` / etc.). Returning `null` or any other type is silently ignored.
