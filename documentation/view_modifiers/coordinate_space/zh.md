# coordinateSpace

为该视图的坐标空间命名。此后其他代码(例如手势位置)即可相对这个命名空间、而非 `local`/`global` 来上报尺寸与位置。

## `coordinateSpace?: string`

传入任意非空名称。在手势的 `coordinateSpace` 选项里引用同名字符串,拖拽等位置就会相对该视图所在空间来计算。

## 示例

```tsx
<VStack
  coordinateSpace="board"
  onDragGesture={{
    coordinateSpace: "board",
    onChanged: (v) => console.log(v.location),
  }}
>
  {/* 拖拽位置相对该 VStack 上报。 */}
</VStack>
```
