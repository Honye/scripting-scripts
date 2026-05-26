`MapUtils` 是一小组同步的 MapKit 坐标 / region 几何工具。纯函数,可安全在
render 中或紧密循环里调用。

---

## `distance(a, b)`

两个 `MapCoordinate` 之间的大圆距离,单位**米**。采用 Haversine 公式与平均地球
半径(`6_371_008.8 m`)。

```ts
const d = MapUtils.distance(
  { latitude: 39.9042, longitude: 116.4074 },  // 北京
  { latitude: 31.2304, longitude: 121.4737 },  // 上海
)
// d ≈ 1_067_000(米)
```

对于"附近 / 多远"这种典型场景精度足够。若需要测绘级精度(地质勘测等),请使用
专门的大地测量库。

---

## `bearing(a, b)`

从 `a` 到 `b` 的**初始**方位角,单位**度**,归一化到 `[0, 360)`:

| 值 | 方向 |
|---|---|
| `0` | 北 |
| `90` | 东 |
| `180` | 南 |
| `270` | 西 |

```ts
MapUtils.bearing(
  { latitude: 0, longitude: 0 },
  { latitude: 0, longitude: 1 },
)  // 90
```

返回的是**起点处**的方位角 — 跨洲长航线在终点处的实际方向会不同。给地图 marker
做箭头旋转用的就是这个初始方位角。

---

## `regionContains(region, coordinate)`

判断 `coordinate` 是否落在矩形 `MapRegion` 内:

```ts
const region = {
  center: { latitude: 31.23, longitude: 121.47 },
  span: { latitudeDelta: 0.1, longitudeDelta: 0.1 },
}
MapUtils.regionContains(region, { latitude: 31.24, longitude: 121.48 })  // true
MapUtils.regionContains(region, { latitude: 32.00, longitude: 121.47 })  // false
```

**注意**:不处理跨 ±180° 经度("国际日期变更线")的 region。如果需要跨经线判定,
请自己拆成两个 region 分别测试。

---

## `regionFromCoordinates(coordinates, paddingFactor?)`

返回包含所有坐标的最小 `MapRegion`。常用于把相机框到一组 `Marker` 或 polyline
周围。

```ts
const region = MapUtils.regionFromCoordinates([
  { latitude: 31.23, longitude: 121.47 },
  { latitude: 31.24, longitude: 121.50 },
  { latitude: 31.22, longitude: 121.49 },
])

if (region) {
  position.setValue({ region })  // 相机框住三个点
}
```

| 参数 | 默认 | 说明 |
|---|---|---|
| `paddingFactor` | `0.1` | span 向外扩展的比例。`0` 表示紧贴 bounding box。 |

边界:
- 空数组 → `null`。
- 单点 → 以该点为中心、0.01° 最小 span 的 region。
- 经度或纬度共线 → span 被 clamp 到最小 `0.005°`,避免 MapKit 拒绝 0 span。
- 跨经线输入(比如一个点在 `+170°`、一个在 `-170°`)会沿"长边"绕地球一圈;
  Phase 3a 暂不支持跨经线 region。

---

## `formatDistance(meters, options?)`

通过 Apple `MKDistanceFormatter` 输出本地化的距离文案。负值 clamp 到 `0`。

```ts
MapUtils.formatDistance(1230)                            // "1.2 公里"(随系统 locale)
MapUtils.formatDistance(1230, { units: "imperial" })     // "0.8 英里"
MapUtils.formatDistance(1230, { unitStyle: "full" })     // "1.2 千米"
```

| 选项 | 类型 | 说明 |
|---|---|---|
| `units` | `"metric" \| "imperial" \| "default"` | 强制单位制。默认跟随系统 locale。 |
| `unitStyle` | `"default" \| "abbreviated" \| "full"` | 单位后缀长短(`"km"` 还是 `"kilometers"`)。 |

输出跟系统 locale 有关 —— 测试不要 hardcode 具体文案。

---

## `formatDuration(seconds, options?)`

通过 `DateComponentsFormatter` 输出本地化时长。负值返回空串。

```ts
MapUtils.formatDuration(3725)                              // "1小时2分钟"
MapUtils.formatDuration(3725, { unitsStyle: "full" })       // "1 小时,2 分钟"
MapUtils.formatDuration(3725, { unitsStyle: "positional" }) // "1:02:05"
MapUtils.formatDuration(86_400 + 3600, { maximumUnitCount: 1 }) // "1天"
```

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `unitsStyle` | `"positional" \| "abbreviated" \| "short" \| "full" \| "brief" \| "spellOut"` | `"abbreviated"` | 单位文字风格。 |
| `allowedUnits` | `("day" \| "hour" \| "minute" \| "second")[]` | `["day", "hour", "minute"]` | 允许出现哪些单位。 |
| `maximumUnitCount` | `number` | 不限 | 限制单位段数(`1` 让 `3661s` 只显示 `"1 小时"`)。 |

---

## 使用场景

- 接 `MapSearch.locate` / `Location.geocodeAddress`:用 `regionFromCoordinates`
  自动框住所有结果。
- "X 米以内":`distance(myLocation, item.coordinate) < X`。
- 按距离排序搜索结果:用 `distance` 做稳定排序。
- Marker 上的指南针箭头指向目标:`bearing` 给出旋转角度。
- 渲染路线元数据(`MapDirections` 返回的 `route.distance` /
  `route.expectedTravelTime`):`formatDistance` / `formatDuration` 直接出
  locale-aware 文案。
