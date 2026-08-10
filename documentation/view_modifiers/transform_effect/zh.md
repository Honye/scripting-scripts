# transformEffect

对视图的渲染输出应用仿射变换,以 `CGAffineTransform` 矩阵的各分量表示。用于表达专用 modifier 无法实现的效果,例如**错切(shear)**。

## `transformEffect?: { a?, b?, c?, d?, tx?, ty? }`

矩阵为

```
| a  b  0 |
| c  d  0 |
| tx ty 1 |
```

省略的分量取单位矩阵默认值(`a = 1`、`d = 1`,其余为 `0`)。

常用写法:

- **缩放** —— `{ a: sx, d: sy }`
- **平移** —— `{ tx, ty }`
- **旋转 θ 弧度** —— `{ a: cos, b: sin, c: -sin, d: cos }`
- **水平错切** —— `{ c: shear }`

单纯的缩放、旋转、平移请优先用 `scaleEffect`、`rotationEffect`、`offset`。

## 示例

```tsx
// 水平错切。
<Text transformEffect={{ c: 0.3 }}>Sheared</Text>
```
