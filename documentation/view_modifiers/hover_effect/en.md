# hoverEffect

Applies a hover effect to this view when a pointer (an iPadOS trackpad or mouse) moves over it. Has no
effect on touch-only interaction.

## `hoverEffect?: HoverEffect`

`HoverEffect` is one of:
- `automatic` — the system chooses an appropriate effect.
- `highlight` — the pointer morphs into the view's shape and highlights it.
- `lift` — the view scales up and lifts with a shadow as the pointer moves over it.

## Example

```tsx
<Button title="Play" action={play} hoverEffect="lift" />
```
