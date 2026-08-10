The `chartLegend` modifier controls the legend of a chart. It accepts two forms:

- A **`Visibility`** string — `"automatic"` (default), `"visible"`, or `"hidden"` — to keep or remove the auto-generated legend.
- An **object** to customize the legend's placement: `{ position, alignment?, spacing?, content? }`.

```tsx
// Visibility form
<Chart chartLegend={"hidden"}>...</Chart>

// Object form — move the legend to the bottom
<Chart chartLegend={{ position: "bottom", spacing: 8 }}>...</Chart>
```

A legend only appears when a chart has more than one series. Use `foregroundStyleBy` (or `symbolBy` / `lineStyleBy`) on your marks to group data into series.

## Example Scenario

This example renders a grouped bar chart with three color series, so a legend is shown. A segmented picker switches `chartLegend` between the visibility values and a custom bottom-anchored legend:

- `"automatic"` / `"visible"` — keep the auto-generated legend.
- `"hidden"` — remove the legend.
- `"bottom (custom)"` — use the object form to move the legend below the plot.

## Props

### `chartLegend?: Visibility | { position, alignment?, spacing?, content? }`

- `Visibility`: `"automatic"` | `"visible"` | `"hidden"`.
- Object form:
  - `position: AnnotationPosition` — where the legend sits relative to the plot (e.g. `"bottom"`, `"top"`, `"trailing"`).
  - `alignment?: Alignment` — alignment of the legend within its position.
  - `spacing?: number` — spacing between the plot and the legend.
  - `content?: VirtualNode` — a custom legend view that replaces the auto-generated one.

## Use Cases

- Hiding a legend that is redundant with axis labels.
- Moving the legend to a position that fits your layout.
- Providing a fully custom legend view.
