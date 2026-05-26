`MapSearch` 调用 MapKit 系统级地图关键字搜索。两个入口:

- `MapSearch.locate(options)` — 一次性搜索,返回 `MapItem[]`。
- `MapSearch.createCompleter(options?)` — 有状态的自动补全,用于输入框场景,通过
  listener 回调下发建议。

两者都是**纯查询 API,不需要任何系统权限**。返回的坐标是 `MapCoordinate`,可直接
灌入视图层的 `<Marker>` / `<Map>`。

正/反向地理编码(地址 ↔ 坐标)仍走现有 `Location` namespace
(`Location.geocodeAddress` / `Location.reverseGeocode`)。

---

## `locate` — 一次性搜索

```ts
const items = await MapSearch.locate({
  query: "咖啡",
  region: {
    center: { latitude: 31.2304, longitude: 121.4737 },
    span: { latitudeDelta: 0.02, longitudeDelta: 0.02 },
  },
})

for (const item of items) {
  console.log(item.name, item.coordinate, item.formattedAddress)
}
```

### 选项

| 选项 | 类型 | 说明 |
|---|---|---|
| `query` | `string` | 必填且非空。 |
| `region` | `MapRegion?` | 限制搜索范围。省略时 MapKit 使用设备粗位置周边。 |
| `resultTypes` | `("pointOfInterest" \| "address" \| "physicalFeature")[]?` | 默认 `["pointOfInterest", "address"]`;`physicalFeature` 仅 iOS 18+,旧系统静默忽略。 |
| `pointOfInterestFilter` | `MapPointsOfInterestSpec?` | 复用 `<Map mapStyle={{ pointsOfInterest }}>` 的 union;可传 `"excludingAll"`、`{ includes: [...] }` 或 `{ excludes: [...] }`。 |

### 返回 — `MapItem`

`MapItem` 是顶层 opaque class(`MapDirections` 也返回它)。按字段名读取即可,
**不要**对实例做 JSON 序列化。

| 字段 | 类型 | 说明 |
|---|---|---|
| `coordinate` | `MapCoordinate` | 总有值。 |
| `name` | `string \| null` | "Apple Park Visitor Center" |
| `formattedAddress` | `string \| null` | "10600 N Tantau Ave, Cupertino, CA, United States" |
| `placemark` | `LocationPlacemark` | 总有值。 |
| `phoneNumber` | `string \| null` |  |
| `url` | `string \| null` |  |
| `pointOfInterestCategory` | `string \| null` | `"restaurant"` / `"cafe"` 等。 |
| `timeZone` | `string \| null` | IANA 时区,如 `"America/Los_Angeles"`。 |
| `isCurrentLocation` | `boolean` | 仅当 MapKit 给回"当前位置 MapItem"时为 `true`;搜索 / 路线结果总为 `false`。 |

### `openInMaps(options?)` — 跳转到 Apple Maps

```ts
const items = await MapSearch.locate({ query: "咖啡" })
if (items.length > 0) {
  await items[0].openInMaps({ directionsMode: "walking" })
}
```

返回值 `true` 表示系统已经接受了 launch 请求,当前应用切到后台,Apple Maps 接管。

| 选项 | 类型 | 说明 |
|---|---|---|
| `directionsMode` | `"driving" \| "walking" \| "transit" \| "default"` | 在打开的地图上叠加导航;`"default"` 表示由 Apple Maps 按用户设置选模式。 |
| `showsTraffic` | `boolean` | 显示实时路况叠层。 |
| `mapType` | `"standard" \| "satellite" \| "hybrid"` | 应用地图样式。 |

> `JSON.stringify(item)` / `Object.keys(item)` 不会返回字段字典 ——
> `MapItem` 是带 getter 的 class,不是普通对象。需要序列化时自行 spread 字段。

### 几何便利方法

```ts
item.distance(other)  // 米,Haversine;other 是坐标或另一个 MapItem
item.bearing(other)   // 度数 [0, 360),0 = 正北
```

底层转发 `MapUtils.distance` / `MapUtils.bearing`。

### `MapItem.forCurrentLocation()`

Apple 的"当前位置"占位 MapItem。同步,**不弹定位权限,也不读真实坐标** —— Apple Maps
拿到这个占位符后自己解析为用户位置。

```ts
await MapItem.forCurrentLocation().openInMaps({ directionsMode: "walking" })
```

返回的实例 `isCurrentLocation === true`。

---

## 选中 marker 与内置 POI —— `<Map selection>`

把一个 `Observable<MapSelectionValue | null>` 绑到 `<Map selection>`。observable
写入的值是一个 tagged-union:

| `value.type` | 来源                                     | 形态                                                                          |
| ------------ | ---------------------------------------- | ----------------------------------------------------------------------------- |
| `"marker"`   | 你自己渲染的 `<Marker tag>`              | `{ type: "marker", tag: string }`                                             |
| `"feature"`  | Apple 渲染的内置 POI / 地标             | `{ type: "feature", coordinate, title, kind, pointOfInterestCategory }`       |
| `null`       | 点击地图空白处,或初始值                  | —                                                                             |

```tsx
const selection = useObservable<MapSelectionValue | null>(null)
const items: MapItem[] = ...

return <Map cameraPosition={cam} selection={selection}>
  {items.map((item, i) => (
    <Marker item={item} tag={`hit-${i}`} />
  ))}
</Map>
```

通过 `value.type` 分支处理:

```ts
const sel = selection.value
if (sel == null) {
  // 空白点击
} else if (sel.type === "marker") {
  const item = items.find((_, i) => `hit-${i}` === sel.tag)
  // ... 拿到对应的 MapItem
} else {
  // sel.type === "feature" —— Apple 内置 POI
  // sel.coordinate / sel.title / sel.pointOfInterestCategory
}
```

`kind` 取值为 `"pointOfInterest"` / `"physicalFeature"` / `"territory"` /
`"unknown"`。`pointOfInterestCategory` 跟 `MapPointOfInterestCategory` 同套词表
(例如 `"restaurant"` / `"cafe"`),无类别时为 `null`。

没有 `tag` 的 marker 不会参与选中。

### iOS 17 限制

iOS 17 上只会触发 `type: "feature"` —— 点击带 `tag` 的 `<Marker>` **不会**触发
selection。统一的 marker / feature 选中必须依赖 iOS 18+ 的 `MapSelection<Value>`。
脚本若要兼容 iOS 17,POI 选中走 feature 分支,marker 选中视为 iOS 18+ 才有的能力。

---

## Item 选中 + Apple 原生 detail 卡 —— `<Map itemSelection>`

iOS 18+ 提供更上层的玩法:`<Map itemSelection>` 绑 `Observable<MapItem | null>`,
配合 `<Marker item={mapItem}>` + `<Map itemDetailSelectionAccessory>` /
`<Map featureSelectionAccessory>`,让 Apple 自动弹原生 detail 卡。

```tsx
const selected = useObservable<MapItem | null>(null)
const items: MapItem[] = ...

return <Map
  cameraPosition={cam}
  itemSelection={selected}
  itemDetailSelectionAccessory="automatic"
  featureSelectionAccessory="automatic"
>
  {items.map(item => (
    <Marker item={item} tint={selected.value === item ? "systemRed" : "systemBlue"} />
  ))}
</Map>
```

- 点 `<Marker item>` 会把同一个 `MapItem` 实例写进 observable。JS 端用 `===` 比对
  找选中项(SwiftUI Map 走对象身份)。
- Apple 自动弹卡:
  - `itemDetailSelectionAccessory` —— 点 item marker 时弹(地址 / 电话 / 路线按钮等)。
  - `featureSelectionAccessory` —— 点 Apple 内置 POI label 时弹。
- 风格三选一:`"automatic"`(MapKit 自己挑 callout / sheet)、`"callout"`、`"sheet"`;
  传 `null` 或不传则不弹。

> **嵌套呈现注意**:`"automatic"` 与 `"sheet"` 走 modal sheet 呈现
> (`MKPresentableSelectionAccessoryViewController`)。在 `Navigation.present(...)`
> 这类已经是 modal 上下文里再嵌套 sheet,iOS 18 当前会抛
> `Attempt to present ... which is already presenting`,严重时会把外层 modal
> 一起 dismiss 掉。所以 Map 处于已 present 的页面(sheet / Navigation.present)
> 里时,**用 `"callout"`**(inline 气泡,不走 modal 呈现链)更稳。

`itemSelection` 跟 `selection` 互斥 —— 都传时 `itemSelection` 优先,字符串-tag marker
不会触发 selection。

### iOS 17 限制

`itemSelection` / `itemDetailSelectionAccessory` / `featureSelectionAccessory` 都是
iOS 18+ API。iOS 17 上这些 prop 静默忽略 —— 地图正常渲染,marker 显示,但点击
不会写 observable,也不弹 Apple 卡片。

### 取消语义

`locate` 不提供 cancel handle。输入框 typeahead 场景请用 `createCompleter` —
连续 `locate` 调用没有去重,快速输入会看到旧结果晚到覆盖新结果。

---

## `createCompleter` — 自动补全

```ts
const completer = MapSearch.createCompleter({
  region: { ... },
  resultTypes: ["address", "pointOfInterest", "query"],
})

completer.addListener(suggestions => {
  setOptions(suggestions)
})

completer.setQuery("apple")
// ...用户点击某条建议后:
const items = await completer.resolve(selected)
```

### 选项

| 选项 | 类型 | 说明 |
|---|---|---|
| `region` | `MapRegion?` | 偏向某个区域。可后续 `completer.setRegion(...)` 改。 |
| `resultTypes` | `("pointOfInterest" \| "address" \| "query")[]?` | 默认 `["pointOfInterest", "address"]`;`"query"` 仅在 completer 上有效(查询补全建议);`"physicalFeature"` 在 completer 上无效。 |

### 方法

| 方法 | 说明 |
|---|---|
| `setQuery(query)` | 更新搜索片段,触发新一轮建议。 |
| `setRegion(region)` | 更新偏向区域。 |
| `addListener(fn)` | 订阅建议批次。每次更新整批替换,**不需要**自己 diff。 |
| `removeListener(fn?)` | 移除单个 listener;不传参数时移除全部。 |
| `resolve(completion)` | 把用户点击的建议解析为完整 `MapItem[]`。 |
| `dispose()` | 释放底层 completer。幂等,可重复调。 |

### 生命周期

一个 completer 对应一个输入框 — 跨字段复用会因为底层 `queryFragment` 共享导致
结果交叉污染。字段卸载时调 `dispose()`。

### 建议时效

`MapSearchCompletion` 的 `id` 仅在下一批建议产出前有效。对过期建议调用
`resolve` 会以 `"unknown completion id"` 拒绝。在 React-style UI 中,把整批
建议跟用户选中项一起存到 state 里,保证选中的 `id` 跟它所属的批次配对。

---

## 与 `<Map>` 联动

把整个 `MapItem` 直接传给 `<Marker>`,MapKit 自动用 item 的 name 当 title、
coordinate 当坐标、根据 POI 类别选默认 glyph:

```tsx
{items.map(item => (
  <Marker item={item} tint="systemBlue" />
))}
```

如果再传了 `title` / `systemImage` / `monogram`,marker 会退回默认 pin 或者你
指定的 glyph,并使用你的覆盖值 —— auto-glyph 只在这些都没传时生效。`item` 与
`coordinate` 在类型层面互斥,同时传会编译报错。

```tsx
// item + 自定义 glyph —— systemImage 优先,title 仍默认 item.name
<Marker item={mapItem} systemImage="cup.and.saucer.fill" tint="systemRed" />

// coordinate 形式 —— 全部字段自己给
<Marker title="外滩" coordinate={{ latitude: 31.24, longitude: 121.49 }} />
```

让地图自动框住整组结果,配合 `MapUtils.regionFromCoordinates`:

```ts
const region = MapUtils.regionFromCoordinates(items.map(i => i.coordinate))
if (region) position.setValue({ region })
```

---

## 错误

`locate` reject 条件:
- `query` 缺失或为空
- 底层 `MKLocalSearch` 失败(网络异常 / 无结果等)

`completer.resolve` reject 条件:
- completion id 已过期(下一批建议产出后)
- 底层 lookup 失败

completer 的 listener 不会同步拿到错误;底层失败时 listener 会收到空数组。

