`chartLegend` modifier 用于控制图表的图例(legend),支持两种形态:

- 传入 **`Visibility`** 字符串 —— `"automatic"`(默认)、`"visible"` 或 `"hidden"` —— 保留或移除自动生成的图例。
- 传入 **对象** 自定义图例的位置:`{ position, alignment?, spacing?, content? }`。

```tsx
// Visibility 形态
<Chart chartLegend={"hidden"}>...</Chart>

// 对象形态 —— 把图例移到底部
<Chart chartLegend={{ position: "bottom", spacing: 8 }}>...</Chart>
```

只有当图表包含多个系列(series)时才会出现图例。给 marks 设置 `foregroundStyleBy`(或 `symbolBy` / `lineStyleBy`)即可把数据按系列分组。

## 示例场景

本示例渲染一个含三种颜色系列的分组柱状图,因此会显示图例。通过一个分段选择器在几种 `chartLegend` 取值之间切换:

- `"automatic"` / `"visible"` —— 保留自动生成的图例。
- `"hidden"` —— 移除图例。
- `"bottom (custom)"` —— 用对象形态把图例移到图表下方。

## 属性

### `chartLegend?: Visibility | { position, alignment?, spacing?, content? }`

- `Visibility`:`"automatic"` | `"visible"` | `"hidden"`。
- 对象形态:
  - `position: AnnotationPosition` —— 图例相对 plot 的位置(如 `"bottom"`、`"top"`、`"trailing"`)。
  - `alignment?: Alignment` —— 图例在其位置内的对齐方式。
  - `spacing?: number` —— plot 与图例之间的间距。
  - `content?: VirtualNode` —— 自定义图例视图,替换自动生成的图例。

## 使用场景

- 当图例与坐标轴标签重复时将其隐藏。
- 把图例移到更契合布局的位置。
- 提供完全自定义的图例视图。
