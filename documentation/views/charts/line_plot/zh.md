`LinePlot` / `AreaPlot`（iOS 18+）用一个 **JS 函数** 直接画曲线 / 面积，不需要预先准备数据数组。SwiftUI Charts 在每次 chart layout 时按 viewport 宽度自动采样 fn 并连成连续曲线。

bridge 通过 `emitWidgetEventSync`（跟同步 gesture / drop callback 同一条通道）把 JS 回调串到 swift 端，每一次采样就是一次 JSCore round-trip。

> **iOS 17 fallback**：bridge 打印 `API deprecated` 警告并不挂任何 mark，同 chart 内其他 mark 不受影响。

---

## API —— 三种形态

### 1. 单变量 `y = fn(x)`

```tsx
<LinePlot
  x="X"
  y="Y"
  domain={[0, Math.PI * 4]}        // 可选
  fn={(x) => Math.sin(x)}
/>
```

* `domain` 可省略，省略时 SwiftUI Charts 用 chart 的 visible x domain 决定采样区间。
* `fn(x: number) => number`。返回 `NaN` 或非有限值 → SwiftUI Charts 跳过该 sample。

### 2. 参数化 `(x, y) = fn(t)`

```tsx
<LinePlot
  x="X" y="Y" t="t"
  domain={[0, Math.PI * 2]}        // 参数化形态必填
  fn={(t) => ({ x: Math.cos(t), y: Math.sin(t) })}
/>
```

* bridge 按 `t` 字段是否存在分发到参数化形态。
* `domain` **必填**（参数化没有"可见 domain"概念，没默认）。
* `fn` 必须返回 `{ x, y }`，缺字段 → 该 sample 当 NaN 跳过。

### 3. AreaPlot `(yStart, yEnd) = fn(x)`

```tsx
<AreaPlot
  x="X" yStart="lo" yEnd="hi"
  domain={[0, Math.PI * 4]}        // 可选
  fn={(x) => ({ yStart: Math.sin(x) - 0.5, yEnd: Math.sin(x) + 0.5 })}
/>
```

* 在每个 x 上填充 `yStart` 到 `yEnd` 的垂直区间。常用于 confidence band / envelope。

三种形态都接受标准 `ChartMarkProps`（`foregroundStyle` / `opacity` / `lineStyle` / `interpolationMethod` / `accessibilityLabel` / ...），跟其他 mark 一样走 `applyModifiers` 路径。

---

## 性能与正确性

* **闭包必须保持纯。** SwiftUI Charts 在每次 chart layout 都会重新执行 fn。在 fn 内 `setState` 或别的 React 状态变更会触发死循环（与 `<ChartGesture>` / `<ChartOverlay>` / `<ChartPlotStyle>` 闭包同样的坑）。
* **每个 sample 是一次 JSCore 调用（~5µs）。** 一个 400 像素宽的 chart 每次 layout 重采样 ≈ 400 次，约 2 ms。静态 / 偶尔更新的 chart 没问题；连续滚动 / pinch / 每帧 state 更新场景下可能感知到 jank。
* **稳定 React re-render。** chart 周围每次 React render 都会重建 `fn` 引用、注册一个新 callback id、SwiftUI 看到一个新的 `LinePlot` 值，触发完整 re-layout。`useCallback` 能稳定 JS 端引用，但 **阻止不了** SwiftUI 端重 layout —— bridge 每次都新建一个 LinePlot struct。要减少 re-render 请把 state 提到 chart 外，或 memo 外层组件。
* **Callback-id 累积。** 当前每次 render 都注册新 callback id，旧 id 留在 component 的 callback map 里直到 unmount。长寿命 chart + 高频更新场景下 map 会按 O(渲染次数 × plot 数) 增长。一般使用没问题；高频 scrubbing UI 注意。
* **抛错 / 非有限。** fn 抛错、返回 `undefined`、返回 `NaN` / `Infinity` → bridge 替换为 `Double.nan`，SwiftUI Charts 跳过该 sample。不要拿这个做流控，请设计 fn 在整个 domain 上是 total 的。
* **`@Sendable` 线程。** SwiftUI Charts 把 closure 标了 `@Sendable`；当前 SDK 行为是 main thread 调用（JSContext 所在线程），bridge 加了 `assert` 兜底。未来 SDK 如果放到 off-main，assert 会捕获。

---

## 相关

* `ChartGesture` —— 由用户手势驱动的闭包，同样要求纯 body。
* `ChartPlotStyle` —— 另一种 reader-style mark 子组件，闭包也是反复 evaluate。
