`MapDirections` 基于 MapKit 规划两点之间的路线。两个入口:

- `MapDirections.calculate(options)` — 完整路线,带 turn-by-turn 步骤和可直接渲染的折线坐标。
- `MapDirections.calculateETA(options)` — 仅返回耗时 / 距离 / 到达窗口。不需要几何时更便宜更快。

两个 API 走 Apple 路线服务,**不需要任何 iOS 系统权限**;返回纯数据,没有需要 dispose 的不透明句柄。

可直接接入视图层:`route.coordinates` 的形态正好等于 `<MapPolyline coordinates={route.coordinates}>` 需要的入参。

---

## `calculate` — 规划路线

```ts
const resp = await MapDirections.calculate({
  source: { latitude: 31.2304, longitude: 121.4737 },        // 人民广场
  destination: { latitude: 31.2397, longitude: 121.4994 },   // 陆家嘴
  transportType: "walking",
})

const route = resp.routes[0]
console.log(route.distance, "m")             // 总距离(米)
console.log(route.expectedTravelTime, "s")   // 预计耗时(秒)
console.log(route.steps.length, "steps")     // 步骤数
```

### Options

| 选项 | 类型 | 说明 |
|---|---|---|
| `source` | `DirectionsEndpoint` | 必填。裸 `MapCoordinate` 或 `{ coordinate, name? }`。 |
| `destination` | `DirectionsEndpoint` | 必填,同 `source`。 |
| `transportType` | `"automobile" \| "walking" \| "transit" \| "any"` | 默认 `"automobile"`。 |
| `requestsAlternateRoutes` | `boolean` | 默认 `false`。当 MapKit 提供替代方案时最多返回 3 条(主要是驾车/有路网的场景)。 |
| `departureDate` | `Date` | 规划"此时间出发"。与 `arrivalDate` 同时给则以本字段为准。 |
| `arrivalDate` | `Date` | 规划"此时间到达"。 |
| `tollPreference` | `"any" \| "avoid"` | 默认 `"any"`。 |
| `highwayPreference` | `"any" \| "avoid"` | 默认 `"any"`。 |

### `DirectionsResponse`

| 字段 | 类型 | 说明 |
|---|---|---|
| `source` | `MapItem` | 与 `MapSearch.locate` 返回的项形态完全一致 — `coordinate` / `placemark` / `formattedAddress` 等。 |
| `destination` | `MapItem` | 同上。 |
| `routes` | `DirectionsRoute[]` | 至少 1 条。 |

### `DirectionsRoute`

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | `string` | 路线标识(通常是道路名)。 |
| `distance` | `number` | 总距离,单位米。 |
| `expectedTravelTime` | `number` | 预计耗时,单位秒。 |
| `transportType` | `TransportType` | 本路线对应的交通方式。 |
| `coordinates` | `MapCoordinate[]` | 可直接渲染的折线坐标。原样喂给 `<MapPolyline coordinates={...}>` 即可。 |
| `steps` | `DirectionsRouteStep[]` | turn-by-turn 步骤。 |
| `hasTolls` | `boolean` | 是否含收费路段。 |
| `hasHighways` | `boolean` | 是否含高速路段。 |
| `advisoryNotices` | `string[]` | Apple 提供的提示文本(可能为空)。 |

### 与 `<MapPolyline>` 配合

```tsx
<Map cameraPosition={position}>
  <Marker title="起点" coordinate={route.coordinates[0]} tint="systemGreen" />
  <Marker title="终点" coordinate={route.coordinates.at(-1)!} tint="systemRed" />
  <MapPolyline
    coordinates={route.coordinates}
    strokeColor="systemBlue"
    strokeStyle={{ lineWidth: 4, lineCap: "round" }}
  />
</Map>
```

---

## `calculateETA` — 仅时间 / 距离

```ts
const eta = await MapDirections.calculateETA({
  source: { latitude: 31.2304, longitude: 121.4737 },
  destination: { latitude: 31.2397, longitude: 121.4994 },
  transportType: "automobile",
})

console.log(eta.expectedTravelTime, "s")
console.log(eta.distance, "m")
console.log(eta.expectedArrivalDate.toLocaleString())
```

只需要 ETA 数字时优先用这个 — 它跳过下载完整路线几何,明显比 `calculate` 快。

---

## 注意事项 / 限制

- **公交** (`transportType: "transit"`) 只在 Apple 支持的部分地区可用,其它地区会以 `directionsNotFound` 失败。
  覆盖度高的请优先用 `"automobile"` 或 `"walking"`。
- **替代路线**通常只对"驾车 + 有备选路网"场景给出多条;步行一般只返回 1 条。
- **不暴露 cancel**:新的 `calculate` 不会取消上一次飞行中的请求,响应顺序按 Apple 服务器
  返回顺序决定。如果你在用户拖滑块时高频调用,自己做 latest-wins 守卫。
- **`departureDate` 与 `arrivalDate` 互斥**:同时传时 `departureDate` 胜出,`arrivalDate` 被忽略。
