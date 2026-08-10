# hoverEffect

当指针(iPadOS 触控板或鼠标)移到视图上时应用悬停效果。对纯触摸交互无效。

## `hoverEffect?: HoverEffect`

`HoverEffect` 取值:
- `automatic` —— 由系统选择合适的效果。
- `highlight` —— 指针变形为视图形状并高亮。
- `lift` —— 指针移过时视图放大并带阴影抬起。

## 示例

```tsx
<Button title="Play" action={play} hoverEffect="lift" />
```
