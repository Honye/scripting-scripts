This example demonstrates how to customize chart axes using `chartXAxis` and `chartYAxis`. Beyond the legacy `Visibility` toggle, both modifiers now accept an `AxisMarksConfig` object that maps to SwiftUI Charts' `AxisMarks` + `AxisGridLine` + `AxisTick` + `AxisValueLabel`.

---

## Quick reference

```ts
chartXAxis?: Visibility | AxisMarksConfig
chartYAxis?: Visibility | AxisMarksConfig

type AxisMarksConfig = {
  position?: AxisMarkPosition       // 'automatic' | 'leading' | 'trailing' | 'top' | 'bottom'
  preset?: AxisMarkPreset           // 'automatic' | 'aligned' | 'extended' | 'inset'
  values?: AxisMarkValues
  stroke?: StrokeStyle
  gridLine?: AxisGridLineConfig     // boolean | { centered?, stroke? }
  tick?: AxisTickConfig             // boolean | { centered?, length?, stroke? }
  valueLabel?: AxisValueLabelConfig // boolean | string | { format?, content?, ... }
}
```

`AxisMarkValues` accepts:

* `'automatic'`
* `{ type: 'automatic', desiredCount?, roundLowerBound?, roundUpperBound? }`
* `{ type: 'stride', by: number }` — for `Double` axis data
* `{ type: 'strideDate', by: CalendarComponent, count? }` — for `Date` axis data
* `{ type: 'values', values: number[] | string[] | Date[] }` — explicit ticks (the array element type **must** match the chart's plotted axis type)

---

## Example sections

### 1. Default axes (backward-compatible)

If you do not set `chartXAxis` / `chartYAxis`, the system picks defaults — exactly as before.

### 2. Stride + dashed grid + currency labels

```tsx
<Chart
  chartYAxis={{
    values: { type: "stride", by: 1000 },
    gridLine: { stroke: { lineWidth: 0.5, dash: [4, 2] } },
    tick: { length: 6 },
    valueLabel: { format: "currency" },
  }}
>
  <LineChart marks={...} />
</Chart>
```

* `values: { type: 'stride', by: 1000 }` puts a tick every 1000 units along the Y axis.
* `gridLine.stroke.dash` produces a dashed grid line.
* `valueLabel.format: 'currency'` formats each tick label using the device locale's currency style.

### 3. Explicit values + percent labels

```tsx
chartYAxis={{
  values: { type: "values", values: [0, 0.1, 0.2, 0.3, 0.4, 0.5] },
  valueLabel: { format: "percent" },
}}
```

* Pins ticks at exactly the values you list.
* `format: 'percent'` shows `10%`, `20%`, etc.

### 4. Custom view label

```tsx
chartXAxis={{
  position: "bottom",
  gridLine: false,
  valueLabel: {
    multiLabelAlignment: "center",
    content: <Text font={"caption2"} fontWeight={"bold"} foregroundStyle={"orange"}>YR</Text>,
  },
}}
```

* Replaces every X-axis tick label with a custom view.
* `gridLine: false` hides grid lines entirely.
* **Performance note:** the view content is rebuilt for every tick — keep the view tree small.

### 5. Legacy Visibility tokens

```tsx
chartXAxis={"hidden"}
chartYAxis={"hidden"}
```

The original `'automatic' | 'visible' | 'hidden'` form is fully preserved.

---

## Format tokens

`valueLabel.format` accepts these tokens:

| token       | numeric data    | date data                     |
| ----------- | --------------- | ----------------------------- |
| `number`    | `1,234.56`      | (falls through to dateTime)   |
| `percent`   | `42%`           | (n/a)                         |
| `currency`  | `$1,200`        | (n/a)                         |
| `date`      | (n/a)           | `01/15/2024`                  |
| `time`      | (n/a)           | `4:30 PM`                     |
| `dateTime`  | (n/a, default)  | `01/15/2024, 4:30 PM`         |

---

## Pitfalls

* **`values` array element type must match the chart's axis data type.** Passing `[Date]` when the chart's X-axis data is `string` renders an empty axis (silent fallback, not a crash).
* **`multiLineTextAlignment` is deprecated** — use `multiLabelAlignment` (mirrors the SwiftUI Charts SDK name and accepts the full 9-direction `Alignment`). The deprecated alias still works for backward compatibility but only accepts `'leading' | 'center' | 'trailing'`.
* **Custom `valueLabel.content` re-renders every tick.** Keep the view light and avoid heavy computation inside.

---

## Conclusion

`AxisMarksConfig` lifts a previously hidden ceiling: anything you could express through SwiftUI's `AxisMarks { ... }` content closure is now available as a declarative chart prop, while the original `Visibility` form continues to work unchanged.
