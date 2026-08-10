# onHover

当指针(iPadOS 触控板或鼠标)进入或离开视图范围时执行动作。触摸不会触发。

## `onHover?: (isHovering: boolean) => void`

指针移到视图上时回调收到 `true`,离开时收到 `false`。

## 示例

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
