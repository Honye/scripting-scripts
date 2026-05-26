`LinePlot` / `AreaPlot` (iOS 18+) plot a smooth curve / area from a **JS function**, not from a data array. SwiftUI Charts samples the function on each chart layout (≈ viewport-width samples) and renders a continuous curve.

The bridge wires the JS callback through `emitWidgetEventSync` (the same channel used for synchronous gesture / drop callbacks), so each sample is one JSCore round-trip.

> **iOS 17 fallback**: the bridge logs an `API deprecated` warning and renders nothing for this mark. Other marks in the same chart still work.

---

## API — three forms

### 1. Single-variable `y = fn(x)`

```tsx
<LinePlot
  x="X"
  y="Y"
  domain={[0, Math.PI * 4]}        // optional
  fn={(x) => Math.sin(x)}
/>
```

* `domain` is optional. Omit to let the chart's visible x domain drive sampling.
* `fn(x: number) => number`. Return `NaN` / non-finite → SwiftUI Charts skips that sample.

### 2. Parametric `(x, y) = fn(t)`

```tsx
<LinePlot
  x="X" y="Y" t="t"
  domain={[0, Math.PI * 2]}        // required for parametric form
  fn={(t) => ({ x: Math.cos(t), y: Math.sin(t) })}
/>
```

* Bridge dispatches on the presence of `t`.
* `domain` is **required** here (the parametric form has no implicit visible-domain fallback).
* `fn` must return `{ x, y }`. Missing fields → that sample is dropped (NaN).

### 3. AreaPlot `(yStart, yEnd) = fn(x)`

```tsx
<AreaPlot
  x="X" yStart="lo" yEnd="hi"
  domain={[0, Math.PI * 4]}        // optional
  fn={(x) => ({ yStart: Math.sin(x) - 0.5, yEnd: Math.sin(x) + 0.5 })}
/>
```

* Fills the vertical band between `yStart` and `yEnd`. Common use: confidence band / envelope.

All three forms accept the standard `ChartMarkProps` (`foregroundStyle` / `opacity` / `lineStyle` / `interpolationMethod` / `accessibilityLabel` / ...) like any other mark — they're applied through the same `applyModifiers` path.

---

## Performance and correctness

* **Pure functions only.** SwiftUI Charts re-runs the closure on every chart layout. Calling `setState` or any other React state mutation inside `fn` triggers an infinite layout loop (same trap as `<ChartGesture>` / `<ChartOverlay>` / `<ChartPlotStyle>` closure bodies).
* **Each sample is a JSCore call (~5µs).** A 400-pixel-wide chart re-samples ≈ 400 times per layout, ≈ 2 ms. Fine for static / occasionally-updating charts; visible jank on continuous scroll / pinch / per-frame state updates.
* **Stabilize React re-renders.** Each React render that touches the LinePlot's parent rebuilds the `fn` reference, gives it a new bridge callback id, and forces SwiftUI to fully re-layout. `useCallback` keeps the JS reference stable, but does **not** prevent SwiftUI from re-laying out; the bridge still mints a new SwiftUI `LinePlot` value each render. To minimize re-renders, lift state out of the chart tree or memoize the surrounding component.
* **Callback-id accumulation.** Currently every render registers a fresh callback id; old ids stay in the per-component map until the parent component unmounts. For long-lived charts with frequent updates the map grows by O(renders × plots). Acceptable for typical usage but watch out in scrubbing-heavy UIs.
* **Errors / non-finite.** Throwing inside `fn`, returning `undefined`, or returning `NaN` / `Infinity` → bridge substitutes `Double.nan` and SwiftUI Charts skips that sample. Don't rely on this for control flow; design `fn` to be total over its domain.
* **`@Sendable` thread.** SwiftUI Charts marks the closure `@Sendable`; in practice it's invoked on the main thread (where JSContext lives). The bridge `assert`s this. If a future SDK version starts dispatching off-main, the assert will catch it.

---

## See also

* `ChartGesture` — for closures driven by user gestures (pure-body rule applies the same way).
* `ChartPlotStyle` — another reader-style mark child whose closure is repeatedly evaluated.
