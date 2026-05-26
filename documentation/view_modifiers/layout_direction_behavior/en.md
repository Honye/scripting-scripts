Controls how a view responds to left-to-right and right-to-left layout directions.

## Type

```ts
layoutDirectionBehavior?: "fixed" | "mirrors" | {
  mirrors: "leftToRight" | "rightToLeft"
}
```

## Values

| Value | Description |
| --- | --- |
| `"fixed"` | Keeps the view fixed instead of mirroring for layout direction changes. |
| `"mirrors"` | Mirrors the view using the current layout direction. |
| `{ mirrors: "leftToRight" }` | Mirrors as if the layout direction is left-to-right. |
| `{ mirrors: "rightToLeft" }` | Mirrors as if the layout direction is right-to-left. |

## Example

```tsx
<Image
  systemName="arrow.forward"
  layoutDirectionBehavior="mirrors"
/>
```

## Availability

`layoutDirectionBehavior` requires iOS 18.0 or later.
