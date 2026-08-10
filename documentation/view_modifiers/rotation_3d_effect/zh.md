# rotation3DEffect

围绕指定旋转轴,在三维空间中旋转视图的渲染输出。

## `rotation3DEffect?: { degrees, axis, anchor?, anchorZ?, perspective? }`

- `degrees` —— 旋转角度(度)。
- `axis` —— 旋转轴向量,`x`、`y`、`z` 分量可选(各默认 `0`)。例如 `{ x: 0, y: 1, z: 0 }` 表示绕竖直轴旋转。
- `anchor` —— 旋转锚点。可为 `KeywordPoint`(如 `"center"`、`"top"`)或 `{ x, y }`。默认 `center`。
- `anchorZ` —— 锚点的 z 位置。默认 `0`。
- `perspective` —— 旋转的相对消失点。默认 `1`。

不接受单个 number,因为缺少旋转轴的三维旋转没有意义。

## 示例

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
