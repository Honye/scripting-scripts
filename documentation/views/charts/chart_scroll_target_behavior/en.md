`chartScrollTargetBehavior` controls where a chart's scroll *parks* when the user lifts a finger after a swipe. Without it, scrolling a chart with `chartScrollableAxes` feels free-form — release the gesture mid-scroll and the leading edge can sit on any pixel. With it, scroll deceleration always lands on a meaningful data boundary (a day, a week, an integer index, ...).

Mirrors SwiftUI Charts' `chartScrollTargetBehavior(.valueAligned(...))`. Only the `valueAligned` form is bridged — there's no `paging` shortcut on Chart in SwiftUI either; what people usually mean by "paging" is `valueAligned(... majorAlignment: .page)`.

---

## API

```ts
chartScrollTargetBehavior?: ChartScrollTargetBehavior

type ChartScrollTargetBehavior = {
  unit?: number           // numeric axis: snap step
  matching?: DateComponents // date axis: snap step
  majorAlignment?: 'page' | 'unit' | { unit: number } | { matching: DateComponents }
}
```

* **`unit` / `matching` are mutually exclusive.** Pick `unit` for a numeric x axis, `matching` for a date x axis. Mixing both is not supported.
* **`matching` expects a `DateComponents` instance** (the global `new DateComponents({...})` exposed by the bridge — same class used for notifications/triggers). Pass `{ day: 1 }` for "snap by day", `{ day: 7 }` for "snap by week", `{ month: 1 }` for "snap by month", etc.
* **`majorAlignment` is the secondary "page" snap.** SwiftUI Charts uses it to decide where larger paging boundaries sit (e.g. snap by day, but page by month — releasing a longer swipe always parks at month edges).
  * `'page'` — major boundaries at viewport-page edges.
  * `'unit'` — no separate major alignment; reuses the primary step. (This is the SDK default; passing `'unit'` is the same as omitting `majorAlignment`.)
  * `{ unit: N }` — major boundaries every N numeric units (only valid when the primary step is `unit`).
  * `{ matching: DateComponents }` — major boundaries on those calendar boundaries (only valid when the primary step is `matching`).

> The bridge silently drops a cross-form `majorAlignment` (e.g. `{ unit: 7 }` paired with a `matching: ...` primary), since SwiftUI Charts' `MajorValueAlignment<Value>` is statically typed.

---

## Required pairings

`chartScrollTargetBehavior` does nothing on its own. Pair it with:

* **`chartScrollableAxes`** — turns scrolling on. Without it the chart just renders the full domain at once; there's nothing to snap.
* **`chartXVisibleDomain`** (or `chartYVisibleDomain` for vertical) — fixes the visible window's size in data units. Determines what counts as a "page" for `majorAlignment: 'page'`.

```tsx
<Chart
  chartScrollableAxes={"horizontal"}
  chartXVisibleDomain={86400 * 14}     // 14 days visible
  chartScrollTargetBehavior={{
    matching: new DateComponents({ day: 1 }),
    majorAlignment: { matching: new DateComponents({ month: 1 }) },
  }}
>
  ...
</Chart>
```

---

## Recipes

```tsx
// Date axis, snap daily, page by month
chartScrollTargetBehavior={{
  matching: new DateComponents({ day: 1 }),
  majorAlignment: { matching: new DateComponents({ month: 1 }) },
}}

// Date axis, snap weekly, page by viewport
chartScrollTargetBehavior={{
  matching: new DateComponents({ day: 7 }),
  majorAlignment: 'page',
}}

// Numeric axis, snap to integer index, page by viewport
chartScrollTargetBehavior={{
  unit: 1,
  majorAlignment: 'page',
}}

// Date axis, just snap by day, no major alignment override (SDK default)
chartScrollTargetBehavior={{
  matching: new DateComponents({ day: 1 }),
}}
```

---

## Pitfalls

* **Categorical (String) axes are not supported.** SwiftUI Charts' `ValueAligned` requires `Plottable + Numeric` (numeric axes) or `Date` (date axes). On a String x axis the modifier silently does nothing. To get a numeric x axis with `BarChart` / `LineChart` you need a `Date` label; for pure numeric x, use `PointChart` (whose marks are `{ x: number, y: number }`).
* **`unit` is in *data units*, not pixels.** For a Double axis, `unit: 1` means "snap every 1 unit on the chart's data domain". For a date axis, you must use `matching` instead.
* **`majorAlignment` defaults to `'unit'` when omitted.** Pass `'page'` explicitly if you want page-level snapping.
* **`chartXVisibleDomain` must be set for paging to feel right.** Without an explicit visible domain, the SDK picks one and your "page" boundaries will land in unexpected places.
* **Set `unit: 'day'` (etc.) on each mark for date-axis charts.** That's a property on the *mark itself* (`ChartMarkProps.unit`), unrelated to `chartScrollTargetBehavior`. Without it Charts logs `Falling back to a fixed dimension size for a mark. Consider adding unit to the data...` and bars/lines render at a fixed pixel width that may not match the date stride. Match the `unit` on marks to the smallest sensible granularity of your data (typically `'day'` for daily data, `'hour'` for hourly, etc.).
