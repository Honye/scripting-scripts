# alignmentGuide

为视图的某个对齐设置显式对齐 guide,用于微调它在 stack 中与兄弟视图的对齐方式。

## `alignmentGuide?: { alignment, value, offset? }`

- **`alignment`** —— 要设置哪个 guide:`HorizontalAlignment`(`"leading"`、`"center"`、`"trailing"`)或 `VerticalAlignment`(`"top"`、`"center"`、`"bottom"`、`"firstTextBaseline"`、`"lastTextBaseline"`)。
- **`value`** —— 二选一:
  - **数字** —— 常量 guide;或
  - **关键字** —— 相对视图自身尺寸解析:
    - `"width"` / `"height"` —— 视图实测尺寸
    - `"leading"` / `"trailing"` / `"top"` / `"bottom"` / `"center"` —— 视图的边/中心 guide
    - `"firstTextBaseline"` / `"lastTextBaseline"` —— 视图的文本基线
- **`offset?`** —— 在解析值基础上叠加的数字偏移。

> **注意:** 仅支持上述声明式形态。SwiftUI 那个在布局期运行的任意 `computeValue` 闭包无法桥接到脚本,故不提供。

## 示例

```tsx
// 把该视图的 leading guide 向内挪 20pt。
<Text alignmentGuide={{ alignment: "leading", value: 20 }}>Indented</Text>

// 把 leading 对齐到自身 trailing 边(左移一个自身宽度)。
<Text alignmentGuide={{ alignment: "leading", value: "trailing" }}>Shifted</Text>

// 用视图中心作为 top guide,再加一点偏移。
<Image
  systemName="star"
  alignmentGuide={{ alignment: "top", value: "center", offset: 4 }}
/>
```
