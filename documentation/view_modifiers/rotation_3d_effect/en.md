# rotation3DEffect

Rotates a view’s rendered output in three dimensions around a given axis of rotation.

## `rotation3DEffect?: { degrees, axis, anchor?, anchorZ?, perspective? }`

- `degrees` — the rotation angle, in degrees.
- `axis` — the axis of rotation as a vector with optional `x`, `y`, `z` components (each defaults to `0`). For example `{ x: 0, y: 1, z: 0 }` rotates around the vertical axis.
- `anchor` — the point about which the rotation is anchored. A `KeywordPoint` (e.g. `"center"`, `"top"`) or `{ x, y }`. Defaults to `center`.
- `anchorZ` — the z position of the anchor point. Defaults to `0`.
- `perspective` — the relative vanishing point for the rotation. Defaults to `1`.

A plain number is **not** accepted, because a 3D rotation is meaningless without an axis.

## Example

```tsx
<Image
  systemName="cube.fill"
  rotation3DEffect={{
    degrees: 45,
    axis: { x: 0, y: 1, z: 0 },
    perspective: 0.5,
  }}
/>
```
