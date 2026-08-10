# alignmentGuide

Sets an explicit alignment guide for one of a view's alignments, letting you fine-tune how it lines up with its siblings in a stack.

## `alignmentGuide?: { alignment, value, offset? }`

- **`alignment`** — which guide to set: a `HorizontalAlignment` (`"leading"`, `"center"`, `"trailing"`) or a `VerticalAlignment` (`"top"`, `"center"`, `"bottom"`, `"firstTextBaseline"`, `"lastTextBaseline"`).
- **`value`** — either:
  - a **number** — a constant guide, or
  - a **keyword** resolved against the view's own dimensions:
    - `"width"` / `"height"` — the view's measured size
    - `"leading"` / `"trailing"` / `"top"` / `"bottom"` / `"center"` — the view's edge/center guides
    - `"firstTextBaseline"` / `"lastTextBaseline"` — the view's text baselines
- **`offset?`** — a number added on top of the resolved value.

> **Note:** Only these declarative forms are supported. SwiftUI's arbitrary `computeValue` closure (which runs during layout) cannot be bridged to scripts, so it is not available.

## Example

```tsx
// Nudge this view's leading guide 20pt inward.
<Text alignmentGuide={{ alignment: "leading", value: 20 }}>Indented</Text>

// Align this view's leading edge to its own trailing edge (shift left by its width).
<Text alignmentGuide={{ alignment: "leading", value: "trailing" }}>Shifted</Text>

// Use the view's center as its top guide, plus a small offset.
<Image
  systemName="star"
  alignmentGuide={{ alignment: "top", value: "center", offset: 4 }}
/>
```
