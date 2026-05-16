本示例同时演示四个图表交互/自定义能力：

* **`ChartOverlay`** —— `<Chart>` 的 reader-style 子组件，通过 `ChartProxy` 反查"屏幕坐标↔数据值"，做自定义 hit-test、tooltip、覆盖图层。对应 SwiftUI Charts 的 `chartOverlay(alignment:content:) { proxy in ... }`。
* **区间选择** —— 给 `chartXSelection` / `chartYSelection` 传 `from / to`（而不是 `value`），bridge 自动选择 SwiftUI 的 `chartXSelection(range:)` / `chartYSelection(range:)` 重载。
* **`ChartGesture`** —— `<Chart>` 的另一种 reader-style 子组件，闭包返回任意 `Gesture` 描述子，并把一个可写入选区的 `ChartProxy` 注入闭包；用于绕过默认手势限制（例如在字符串轴上做单指拖动 range）。对应 `chartGesture(_:) { proxy in ... }`。
* **`ChartPlotStyle`** —— `<Chart>` 的另一种 reader-style 子组件，闭包接收一个 builder proxy，链式追加 plot 区域 modifier（background / border / frame / shadow / cornerRadius / clipShape / opacity）。对应 `chartPlotStyle { plot in plot.background(...).border(...) }`。

---

## ChartOverlay 用法

```tsx
import { Chart, ChartOverlay, ChartProxy } from "scripting"

<Chart>
  <BarChart marks={...} />
  <ChartOverlay alignment={"topLeading"}>
    {(proxy: ChartProxy) => (
      // 在 chart 之上渲染任意视图。
      // proxy.value / proxy.position / proxy.plotAreaSize 都可在闭包内同步使用。
    )}
  </ChartOverlay>
</Chart>
```

`ChartProxy` 全部方法同步；当 type token 与图表实际坐标轴数据类型不匹配时返回 `null`：

```ts
interface ChartProxy {
  // 反查 / 正查 / 区域信息
  value(args: { atX?: number; atY?: number; as: 'string' | 'number' | 'date' })
    : string | number | Date | null
  position(args: { x?: string | number | Date; y?: string | number | Date })
    : { x: number; y: number } | null
  readonly plotAreaSize: { width: number; height: number }
  readonly plotAreaFrame: { x: number; y: number; width: number; height: number }

  // 写入选区（用于 chartGesture）
  selectXRange(args: { from: number; to: number }): void
  selectYRange(args: { from: number; to: number }): void
  selectXValue(args: { at: number }): void
  selectYValue(args: { at: number }): void
  selectAngleValue(args: { atRadians: number }): void
}
```

---

## 区间选择用法

```tsx
const [range, setRange] = useState<{ from: string; to: string } | null>(null)

<Chart
  chartXSelection={{
    valueType: "string",
    from: range?.from,
    to: range?.to,
    onChanged: setRange,
  }}
>
  ...
</Chart>
```

* bridge **按 `from / to` 是否存在**自动分流到 SwiftUI 的 `chartXSelection(range:)` 重载。原有单值形态（`value` + `onChanged`）100% 保留。
* `valueType: 'string' | 'number' | 'date'` —— 必须与图表坐标轴实际数据类型一致。
* `onChanged` 在选区改变时触发，清空选区时回调 `null`。

> **轴类型限制**：区间选择**只在连续轴（number / date）上生效**。SDK 在 categorical String 轴上既不响应默认 range 手势，也无法把像素坐标反查回字符串类目，所以即使配合下面的 `<ChartGesture>` + `proxy.selectXRange` 也无效。如果要在 String 轴上做选择，请用单值形态 `ChartSelection`。

### 激活手势（按平台不同）

`chartXSelection(range:)` 默认手势随平台变化，**这是 SwiftUI Charts SDK 行为，不是 bridge 限制**：

* **iOS**：图表上的**双指 tap**。iOS 模拟器请按住 **⌥ Option** + 点击 来模拟双指。
* **macOS**：拖动手势。

单指长按 + 拖动**不会**默认触发 range 选择。如要单指手势 / 自定义触发条件，用下面的 `<ChartGesture>` 接管手势。

来源：[Mastering charts in SwiftUI · Selection](https://swiftwithmajid.com/2023/07/18/mastering-charts-in-swiftui-selection/)、[WWDC23 · Explore pie charts and interactivity in Swift Charts](https://developer.apple.com/videos/play/wwdc2023/10037/)。

同一条轴上单值与区间形态互斥。点选用单值，拖选区间用 range 形式。

---

## Axis label 精度（ChartAxisLabelFormat）

`chartXAxis / chartYAxis` 的 `valueLabel.format` 字段除了接受短字符串 token（`'number' | 'percent' | 'currency' | 'date' | 'time' | 'dateTime'`），还接受 native 类 `ChartAxisLabelFormat` 的实例，支持小数位、货币代码、日期/时间风格等参数（对应 SwiftUI Foundation 的 `FormatStyle`）。

```tsx
<Chart chartYAxis={{
  valueLabel: {
    format: ChartAxisLabelFormat.currency({ currencyCode: "CNY", fractionDigits: 2 })
  }
}}>
  ...
</Chart>
```

可用工厂：

| 工厂 | 适用 plottable | 选项 |
|---|---|---|
| `ChartAxisLabelFormat.number({...})` | `Double` | `fractionDigits`（max）/ `minFractionDigits`（min） |
| `ChartAxisLabelFormat.percent({...})` | `Double` | 同 number（`0.42` 渲染为 `42%`） |
| `ChartAxisLabelFormat.currency({...})` | `Double` | `fractionDigits` / `minFractionDigits` / `currencyCode`（默认 device locale） |
| `ChartAxisLabelFormat.date({...})` | `Date` | `dateStyle`: `omitted` / `numeric` / `abbreviated` / `long` / `complete` |
| `ChartAxisLabelFormat.time({...})` | `Date` | `timeStyle`: `omitted` / `shortened` / `standard` / `complete` |
| `ChartAxisLabelFormat.dateTime({...})` | `Date` | 同时接 `dateStyle` 与 `timeStyle` |

> 短字符串 token 100% 保留，二者随便选。需要精度／货币／style 时用工厂；其他场景仍可写 `format: 'number'` 这种简洁形式。

---

## ChartGesture 用法

```tsx
import { Chart, ChartGesture, DragGesture } from "scripting"

<Chart
  chartXSelection={{ valueType: "number", from, to, onChanged: setRange }}
>
  ...marks...
  <ChartGesture>
    {(proxy) =>
      DragGesture({ minDistance: 0 })
        .onChanged(v => proxy.selectXRange({
          from: v.startLocation.x,
          to: v.location.x,
        }))
    }
  </ChartGesture>
</Chart>
```

* 闭包返回一个 `Gesture` 描述子（`DragGesture()` / `TapGesture()` / `LongPressGesture()` / `MagnifyGesture()` / `RotateGesture()`），等价 SwiftUI 的 `chartGesture { proxy in ... }`。
* 闭包内的 `proxy.selectXRange / selectYRange / selectXValue / selectYValue / selectAngleValue` 接收的是**屏幕像素坐标**（不是数据值）—— 直接传 `DragGesture` 事件的 `startLocation.x` / `location.x` 即可，无需反算数据值。
* 写入选区后，对应的 `chartXSelection / chartYSelection / chartAngleSelection` binding 会回调，把数据值通过 `onChanged` 回到 JS 端。
* 一个 chart 只取第一个 `<ChartGesture>` 子组件（与 `<ChartOverlay>` 同规则）。
* 适合**取代** SDK 默认手势：单指拖动、自定义激活条件等都可以替代默认双指 tap。
* **轴类型限制**：和默认手势一样，仅 number / date 轴有效；categorical String 轴上 SDK 无法把像素反查回字符串类目，因此 `proxy.selectXRange` 在字符串轴上也不会回调。

---

## ChartPlotStyle 用法

```tsx
import { Chart, ChartPlotStyle } from "scripting"

<Chart>
  <BarChart marks={...} />
  <ChartPlotStyle>
    {(plot) =>
      plot
        .background({ color: "gray", opacity: 0.1 })
        .border({ color: "gray", width: 1 })
        .frame({ height: 240 })
    }
  </ChartPlotStyle>
</Chart>
```

闭包接收一个空的 `ChartPlotProxy`，必须返回一个（一般是链式调用后的）`ChartPlotProxy`。每次链式调用返回一个新的 immutable proxy 并累计一个 op；bridge 会在 SwiftUI Charts 的 `chartPlotStyle { plot in ... }` 闭包内把 ops 重放到真实 `ChartPlotContent` 视图上。

可用 builder 方法：

| 方法 | 参数 | 对应 SwiftUI |
|---|---|---|
| `.background(arg)` | 颜色字符串 / `Material` token / `{ color?, material?, opacity? }` | `.background(...)` |
| `.border(arg)` | `{ color?, width? }` | `.border(color, width:)` |
| `.frame(arg)` | `{ width?, height? }` | `.frame(width:height:)` |
| `.padding(arg?)` | `number` / `EdgeInsets` / `{ horizontal?, vertical? }` / 无参 | `.padding(...)` |
| `.cornerRadius(r)` | `number` | `.clipShape(RoundedRectangle(cornerRadius: r))` |
| `.opacity(v)` | `number` | `.opacity(v)` |
| `.shadow(arg)` | `{ color?, radius?, x?, y? }` | `.shadow(color:radius:x:y:)` |
| `.clipShape(arg)` | `'capsule'` / `'rect'` / `{ rounded: <radius> }` | `.clipShape(...)` |

`Material` token 取值：`'ultraThin'` / `'thin'` / `'regular'` / `'thick'` / `'ultraThick'` / `'bar'`（可加 `Material` 后缀，例如 `'regularMaterial'`）。

> 与 `<ChartOverlay>` / `<ChartGesture>` 一样，一个 chart 只取第一个 `<ChartPlotStyle>` 子组件。闭包 body 必须保持纯 —— 在内部 `setState` 会触发 chart 重 build → 闭包又跑 → **死循环**。

---

## Mark Accessibility（VoiceOver 三件套）

每个 mark 在自己的 `ChartMarkProps` 上接收三个可选的无障碍字段：

```tsx
<BarChart
  marks={data.map(d => ({
    label: d.year,
    value: d.sales,
    accessibilityLabel: `${d.year} 年`,
    accessibilityValue: `销售额 ${d.sales} 元`,
    // accessibilityHidden: true,  // 整个 mark 不参与 VoiceOver
  }))}
/>
```

| 字段 | 对应 SwiftUI | 作用 |
|---|---|---|
| `accessibilityLabel?: string` | `.accessibilityLabel(_:)` on `ChartContent` | 覆盖 SDK 默认从 mark 数据值拼接的 label。 |
| `accessibilityValue?: string` | `.accessibilityValue(_:)` | 把"读出值"与 label 分开。 |
| `accessibilityHidden?: boolean` | `.accessibilityHidden(_:)` | 为 `true` 时，该 mark 不出现在 VoiceOver 树里（不可聚焦、不被朗读）。 |

三个字段在所有 mark 类型（`BarMark` / `LineMark` / `PointMark` / `RuleMark` / `RectangleMark` / `AreaMark` / 扇区等）上都通用，走的是 `ChartContent.applyModifiers` 同一路径（与 `foregroundStyle` / `opacity` 等一致）。

> 验证方式：真机或模拟器开 `设置 → 辅助功能 → 旁白 (VoiceOver)`，在 chart 上轻扫，然后右滑切换 mark，应该听到你设置的字符串。

---

## 注意事项

* **`ChartOverlay` 首次同步渲染时 proxy 为 `null`。** `<ChartOverlay>` 在 SwiftUI 完成 chart 构建并注入真实 proxy 之前会回落到 `EmptyView`。请在闭包内对该情况做兜底。
* **`SelectedRange / selectedRangeAxis` 不在 `ChartProxy` 上暴露。** SwiftUI Charts 没有通过 `ChartProxy` 暴露区间选区状态 —— 请通过 `chartXSelection(range:)` / `chartYSelection(range:)` 的 binding 自行观察。TS 接口刻意未提供这两个方法。
* **`chartOverlay` 没有 `spacing` 参数**，仅支持 `alignment`（与 SwiftUI 原生 API 一致）。
* **overlay 内容尽量轻**。SwiftUI 在每次 chart 重建时都会重新调用 overlay 闭包，请避免在内部做重计算或启动异步任务。
* **`<ChartGesture>` / `<ChartOverlay>` 闭包 body 必须保持纯**——SwiftUI Charts 在每次 chart 重建时都会重新执行此闭包，body 内调 `setState` 会立即触发外层 React 重渲染 → chart 又重 build → 闭包又跑 → **死循环**。状态写入只能放在 `onChanged / onEnded` 这种用户手势事件 callback 里。
* **`ChartGesture` 闭包返回的必须是 `GestureInfo`**（`DragGesture()` / `TapGesture()` 等的返回值）。返回 `null` 或其他类型会被忽略。
