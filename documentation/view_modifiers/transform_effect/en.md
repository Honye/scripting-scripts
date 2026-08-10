# transformEffect

Applies an affine transformation to a view’s rendered output, expressed as the components of a
`CGAffineTransform` matrix. Use it for effects the dedicated modifiers can’t express, such as **shear**.

## `transformEffect?: { a?, b?, c?, d?, tx?, ty? }`

The matrix is

```
| a  b  0 |
| c  d  0 |
| tx ty 1 |
```

Any omitted component defaults to the identity matrix (`a = 1`, `d = 1`, the rest `0`).

Common recipes:

- **Scale** — `{ a: sx, d: sy }`
- **Translate** — `{ tx, ty }`
- **Rotate θ radians** — `{ a: cos, b: sin, c: -sin, d: cos }`
- **Horizontal shear** — `{ c: shear }`

For plain scaling, rotation, or translation prefer `scaleEffect`, `rotationEffect`, and `offset`.

## Example

```tsx
// Horizontal shear.
<Text transformEffect={{ c: 0.3 }}>Sheared</Text>
```
