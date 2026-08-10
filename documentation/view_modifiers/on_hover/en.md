# onHover

Adds an action to perform when a pointer (an iPadOS trackpad or mouse) enters or exits this view's
bounds. Not triggered by touch.

## `onHover?: (isHovering: boolean) => void`

The callback receives `true` when the pointer moves over the view, and `false` when it leaves.

## Example

```tsx
function HoverBox() {
  const [hovering, setHovering] = useState(false)
  return (
    <RoundedRectangle
      fill={hovering ? "blue" : "gray"}
      frame={{ width: 120, height: 80 }}
      onHover={setHovering}
    />
  )
}
```
