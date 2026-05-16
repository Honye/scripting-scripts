本示例演示如何通过 `chartXAxis` / `chartYAxis` 自定义图表坐标轴。除原有的 `Visibility` 开关之外，两者现在都可接收 `AxisMarksConfig` 对象，对应 SwiftUI Charts 的 `AxisMarks` + `AxisGridLine` + `AxisTick` + `AxisValueLabel`。

---

## 类型速查

```ts
chartXAxis?: Visibility | AxisMarksConfig
chartYAxis?: Visibility | AxisMarksConfig

type AxisMarksConfig = {
  position?: AxisMarkPosition       // 'automatic' | 'leading' | 'trailing' | 'top' | 'bottom'
  preset?: AxisMarkPreset           // 'automatic' | 'aligned' | 'extended' | 'inset'
  values?: AxisMarkValues
  stroke?: StrokeStyle
  gridLine?: AxisGridLineConfig     // boolean | { centered?, stroke? }
  tick?: AxisTickConfig             // boolean | { centered?, length?, stroke? }
  valueLabel?: AxisValueLabelConfig // boolean | string | { format?, content?, ... }
}
```

`AxisMarkValues` 支持以下形态：

* `'automatic'`
* `{ type: 'automatic', desiredCount?, roundLowerBound?, roundUpperBound? }`
* `{ type: 'stride', by: number }` —— 数值轴（`Double`）
* `{ type: 'strideDate', by: CalendarComponent, count? }` —— 日期轴（`Date`）
* `{ type: 'values', values: number[] | string[] | Date[] }` —— 显式枚举（数组元素类型**必须**与图表实际坐标轴数据类型一致）

---

## 示例分节

### 1. 默认坐标轴（向后兼容）

不传 `chartXAxis` / `chartYAxis` 时，系统按默认行为渲染 —— 与之前完全一致。

### 2. 步长 + 虚线网格 + 货币格式

```tsx
<Chart
  chartYAxis={{
    values: { type: "stride", by: 1000 },
    gridLine: { stroke: { lineWidth: 0.5, dash: [4, 2] } },
    tick: { length: 6 },
    valueLabel: { format: "currency" },
  }}
>
  <LineChart marks={...} />
</Chart>
```

* `values: { type: 'stride', by: 1000 }` 让 Y 轴每 1000 单位放一个刻度。
* `gridLine.stroke.dash` 渲染虚线网格。
* `valueLabel.format: 'currency'` 按设备区域设置的货币格式格式化每个刻度标签。

### 3. 显式 values + 百分比格式

```tsx
chartYAxis={{
  values: { type: "values", values: [0, 0.1, 0.2, 0.3, 0.4, 0.5] },
  valueLabel: { format: "percent" },
}}
```

* 把刻度精确钉到列出的数值。
* `format: 'percent'` 显示 `10%`、`20%` 等。

### 4. 自定义 view 标签

```tsx
chartXAxis={{
  position: "bottom",
  gridLine: false,
  valueLabel: {
    multiLabelAlignment: "center",
    content: <Text font={"caption2"} fontWeight={"bold"} foregroundStyle={"orange"}>YR</Text>,
  },
}}
```

* 用自定义 view 替换每一个 X 轴刻度的默认 label。
* `gridLine: false` 完全隐藏网格线。
* **性能提示**：自定义 view 会**为每个刻度重新构建**，请保持视图轻量、不在内部做重计算。

### 5. 旧 Visibility token 仍然可用

```tsx
chartXAxis={"hidden"}
chartYAxis={"hidden"}
```

原有的 `'automatic' | 'visible' | 'hidden'` 形式 100% 保留兼容。

---

## format token

`valueLabel.format` 支持以下 token：

| token       | 数值数据         | 日期数据                  |
| ----------- | --------------- | ------------------------ |
| `number`    | `1,234.56`      | （回落到 dateTime）       |
| `percent`   | `42%`           | （不适用）                |
| `currency`  | `$1,200`        | （不适用）                |
| `date`      | （不适用）       | `2024/01/15`             |
| `time`      | （不适用）       | `下午 4:30`              |
| `dateTime`  | （不适用，默认） | `2024/01/15, 下午 4:30`  |

---

## 注意事项

* **`values` 数组元素类型必须与图表实际坐标轴数据类型一致**。例如图表 X 轴是 `string`，却传 `[Date]`，会渲染空轴（静默回落，不会崩溃）。
* **`multiLineTextAlignment` 已 deprecated**，请改用 `multiLabelAlignment`（与 SwiftUI Charts SDK 同名，支持完整 9 方位 `Alignment`）。旧字段仍作为别名生效，但只接受 `'leading' | 'center' | 'trailing'`。
* **自定义 `valueLabel.content` 每个刻度都会重新渲染**，请保持视图简单，避免内部重复计算。

---

## 总结

`AxisMarksConfig` 把过去无法在脚本端表达的 axis 自定义能力（`AxisMarks { ... }` 闭包内的所有写法）以声明式 chart prop 的形式开放出来，同时旧的 `Visibility` 形式继续保持兼容。
