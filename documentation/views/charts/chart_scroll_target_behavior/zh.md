`chartScrollTargetBehavior` 控制图表在用户松手后滚动 *停留* 在哪里。配合 `chartScrollableAxes` 打开滚动，但不加这个 modifier 时，松手后视窗左缘可能停在任意像素位置；加了之后，每次滚动减速都会停在数据上有意义的边界（按日 / 按周 / 按整数 index 等）。

对应 SwiftUI Charts 的 `chartScrollTargetBehavior(.valueAligned(...))`。bridge 只桥接 `valueAligned` 一种形态 —— SwiftUI Charts 也没有单独的 paging 形态，所谓的 "paging" 实际上就是 `valueAligned(... majorAlignment: .page)`。

---

## API

```ts
chartScrollTargetBehavior?: ChartScrollTargetBehavior

type ChartScrollTargetBehavior = {
  unit?: number             // 数值轴：snap 步进
  matching?: DateComponents // 日期轴：snap 步进
  majorAlignment?: 'page' | 'unit' | { unit: number } | { matching: DateComponents }
}
```

* **`unit` / `matching` 互斥。** 数值 x 轴用 `unit`，日期 x 轴用 `matching`，不能两者同时给。
* **`matching` 接收 `DateComponents` 实例**（bridge 暴露的全局类 `new DateComponents({...})`，与 Notification trigger 等其他 API 共用）。`{ day: 1 }` 表示"按日 snap"，`{ day: 7 }` "按周 snap"，`{ month: 1 }` "按月 snap"，依此类推。
* **`majorAlignment` 是次要的"分页"对齐**。SwiftUI Charts 用它定义更大颗粒度的对齐边界（例如按日 snap、但按月分页 —— 长滑总是停在月边界上）。
  * `'page'` —— 按视窗页对齐。
  * `'unit'` —— 不另设主对齐，沿用主步进。（这是 SDK 默认；传 `'unit'` 等价于不传 `majorAlignment`。）
  * `{ unit: N }` —— 主对齐边界每 N 个数值 unit（仅在主步进是 `unit` 时合法）。
  * `{ matching: DateComponents }` —— 主对齐落在指定日历边界上（仅在主步进是 `matching` 时合法）。

> bridge 会静默丢弃跨形态的 `majorAlignment`（例如主步进是 `matching: ...`，但 `majorAlignment: { unit: 7 }`），因为 SwiftUI Charts 的 `MajorValueAlignment<Value>` 是静态泛型类型，跨类型组合在 Swift 端无法成立。

---

## 必备搭配

`chartScrollTargetBehavior` 单独使用无效，必须配合：

* **`chartScrollableAxes`** —— 打开滚动。否则图表把整个 domain 一次性渲染完，没有可对齐的"减速点"。
* **`chartXVisibleDomain`**（或纵向 `chartYVisibleDomain`）—— 固定视窗在 data 维度上的大小，决定 `majorAlignment: 'page'` 的"页"是多大。

```tsx
<Chart
  chartScrollableAxes={"horizontal"}
  chartXVisibleDomain={86400 * 14}     // 视窗 14 天
  chartScrollTargetBehavior={{
    matching: new DateComponents({ day: 1 }),
    majorAlignment: { matching: new DateComponents({ month: 1 }) },
  }}
>
  ...
</Chart>
```

---

## 常见配方

```tsx
// 日期轴，按日 snap，按月分页
chartScrollTargetBehavior={{
  matching: new DateComponents({ day: 1 }),
  majorAlignment: { matching: new DateComponents({ month: 1 }) },
}}

// 日期轴，按周 snap，按视窗分页
chartScrollTargetBehavior={{
  matching: new DateComponents({ day: 7 }),
  majorAlignment: 'page',
}}

// 数值轴，按整数 snap，按视窗分页
chartScrollTargetBehavior={{
  unit: 1,
  majorAlignment: 'page',
}}

// 日期轴，仅按日 snap，不另设主对齐（走 SDK 默认）
chartScrollTargetBehavior={{
  matching: new DateComponents({ day: 1 }),
}}
```

---

## 注意事项

* **不支持 categorical (String) 轴。** SwiftUI Charts 的 `ValueAligned` 要求 `Plottable + Numeric`（数值轴）或 `Date`（日期轴）。在 String x 轴上挂这个 modifier 会被 SDK 静默忽略。`BarChart` / `LineChart` 想拿到非 String 轴只能让 `label` 是 `Date`；要纯数值 x 用 `PointChart`（mark 是 `{ x: number, y: number }`）。
* **`unit` 是 *数据维度* 单位，不是像素。** Double 轴上 `unit: 1` 意为"按 chart 数据 domain 的 1 unit snap"；日期轴必须用 `matching`，不能用 `unit`。
* **`majorAlignment` 不传时默认 `'unit'`**，要分页效果请显式传 `'page'`。
* **必须设置 `chartXVisibleDomain`**，否则 SDK 自己挑一个 visible domain，"页"的边界会出现在意料之外的位置。
* **日期轴 chart 的 mark 上请加 `unit: 'day'` 之类**。这是 *mark 本身* 的属性（`ChartMarkProps.unit`），跟 `chartScrollTargetBehavior` 是两码事。不加的话 Charts 会 log `Falling back to a fixed dimension size for a mark. Consider adding unit to the data...`，bar/line 会用 SDK 兜底的固定像素宽度渲染，跟实际 date 步长对不上。`unit` 应跟数据最小颗粒度匹配（日级数据用 `'day'`，小时数据用 `'hour'`，等等）。
