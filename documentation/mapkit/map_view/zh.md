`Map` 是基于 SwiftUI MapKit 的视图(iOS 17+)。可渲染带相机绑定、样式、标注
(`Marker` / `MapPolyline` / `MapPolygon` / `MapCircle`)与内置 MapKit 控件的
地图。

API 形状直接对应 SwiftUI MapKit,没有 Web 风格的命令式调用(`addMarker(...)`)。
你声明地图上应该有哪些内容,桥层将整棵树转换为 `MapContent`。

---

## 基础用法

```tsx
import { Map, Marker, useObservable } from "scripting"

function Demo() {
  const position = useObservable<MapCameraPosition>(
    MapCameraPosition.region({
      center: { latitude: 31.23, longitude: 121.47 },
      span: { latitudeDelta: 0.05, longitudeDelta: 0.05 },
    })
  )

  return <Map cameraPosition={position}>
    <Marker
      title="Bund"
      coordinate={{ latitude: 31.24, longitude: 121.49 }}
      tint="systemRed"
    />
  </Map>
}
```

使用任意视图修饰符(`frame` / `padding` / `aspectRatio` 等)控制地图尺寸,没有
`width` / `height` props。

---

## 相机位置

两种互斥方式设置相机:

| Prop                    | 类型                                | 行为                                                                |
|-------------------------|-------------------------------------|---------------------------------------------------------------------|
| `cameraPosition`        | `Observable<MapCameraPosition>`     | 双向绑定。用户手势会把最新 `MapCameraPosition` 写回 observable。      |
| `initialCameraPosition` | `MapCameraPosition`                 | 仅一次初始值,不回写。                                               |

> 这两个 prop 取名为 `cameraPosition` / `initialCameraPosition`(而不是 `position` /
> `initialPosition`),是为了避免跟 SwiftUI 全局 `.position(x:y:)` view modifier 在类型
> 层面冲突。

`MapCameraPosition` 是不透明值(`MapCameraPosition` class)。必须通过命名空间下的
factory 构造,不能直接传 dict:

```ts
MapCameraPosition.region({ center, span })
MapCameraPosition.rect({ center, size: { width, height } })   // size 为米
MapCameraPosition.camera({ centerCoordinate, distance, heading?, pitch? })
// 或:MapCameraPosition.camera(MapCamera.make({...}))
MapCameraPosition.item({ coordinate, name? }, { allowsAutomaticPitch?: boolean })
MapCameraPosition.userLocation({ fallback?: MapCameraPosition })
MapCameraPosition.automatic()
```

通过只读属性查看当前框定的内容:

```ts
const pos: MapCameraPosition = camera.value
pos.region              // MapRegion | null
pos.rect                // { center, size } | null
pos.camera              // MapCamera | null
pos.item                // { coordinate, name? } | null
pos.fallbackPosition    // MapCameraPosition | null
pos.allowsAutomaticPitch
pos.positionedByUser    // 最近一次变化是否由用户手势触发
```

用户手势会直接把新的 `MapCameraPosition` 写回 observable —— 不论最终形态是什么
(平移 / 缩放后通常是 region 形态),都是预期行为。

---

## 地图样式

```tsx
<Map mapStyle={{ style: "standard", showsTraffic: true }}>...</Map>

<Map mapStyle={{ style: "hybrid", elevation: "realistic" }}>...</Map>

<Map mapStyle={{
  style: "standard",
  pointsOfInterest: { includes: ["restaurant", "park"] },
}}>...</Map>
```

`pointsOfInterest` 接受 `"all"` / `"excludingAll"`,或 `{ includes: [...] }` /
`{ excludes: [...] }`,类别字符串如 `"airport"` / `"cafe"` / `"restaurant"` 等。

---

## 地图内容

`<Map>` 的合法子组件:

### `Marker`

```tsx
<Marker
  title="Bund"
  coordinate={{ latitude: 31.24, longitude: 121.49 }}
  tint="systemRed"
/>

<Marker
  coordinate={{ latitude: 31.23, longitude: 121.47 }}
  systemImage="building.2"
  tint="systemBlue"
/>

<Marker
  title="A"
  coordinate={{ latitude: 31.23, longitude: 121.47 }}
  monogram="A"
/>
```

`systemImage` 与 `monogram` 互斥。`tint` 接受桥层统一的颜色字符串(系统色、
`"#RRGGBB"`、`"rgba(...)"` 等)。

### `MapPolyline`

```tsx
<MapPolyline
  coordinates={[
    { latitude: 31.23, longitude: 121.47 },
    { latitude: 31.24, longitude: 121.48 },
    { latitude: 31.245, longitude: 121.495 },
  ]}
  strokeColor="systemBlue"
  strokeStyle={{ lineWidth: 4 }}
/>
```

`contourStyle` 为 `"straight"`(默认)或 `"geodesic"`。短距离差异不可见,只有跨
洲长航线才会明显弯曲。

### `MapPolygon`

```tsx
<MapPolygon
  coordinates={[ ... ]}
  fillColor="systemBlue"
  strokeColor="white"
  strokeStyle={{ lineWidth: 2 }}
/>
```

### `MapCircle`

```tsx
<MapCircle
  center={{ latitude: 31.23, longitude: 121.47 }}
  radius={500}
  fillColor="systemBlue"
  strokeColor="white"
/>
```

`radius` 单位为米。

---

## 内置控件

通过 `controls` prop 传入单个控件或用 Fragment 包裹多个:

```tsx
<Map
  controls={<>
    <MapUserLocationButton />
    <MapCompass />
    <MapScaleView />
  </>}
>
  ...
</Map>
```

合法控件:
- `MapUserLocationButton` — 重新定位到用户(需要权限)
- `MapCompass` — 罗盘,重置旋转
- `MapPitchToggle` — 2D / 倾斜视图切换
- `MapScaleView` — 自适应比例尺

---

## `strokeStyle`

供 `MapPolyline` / `MapPolygon` / `MapCircle` 共用:

```ts
type MapStrokeStyle = {
  lineWidth?: number                                // 点
  lineCap?: "butt" | "round" | "square"
  lineJoin?: "miter" | "round" | "bevel"
  dash?: number[]                                   // dash/gap 长度,单位点
}
```

---

## `cameraBounds` —— 限制相机活动范围

传 `MapCameraBounds` 实例,限制用户可以 pan / zoom 到哪。两个 factory:

```ts
// 把中心锁在 region 内,顺便限制 zoom 范围(相机到中心的距离,单位米)。
const bounds = MapCameraBounds.centerCoordinateBounds(
  {
    center: { latitude: 31.2304, longitude: 121.4737 },
    span:   { latitudeDelta: 0.1, longitudeDelta: 0.1 },
  },
  { minimumDistance: 200, maximumDistance: 8000 }
)

// 只限 zoom,中心位置自由 pan。
const zoomOnly = MapCameraBounds.distance({
  minimumDistance: 500,
  maximumDistance: 50_000,
})

return <Map cameraPosition={cam} cameraBounds={bounds}>...</Map>
```

`minimumDistance` / `maximumDistance` 都是**相机到中心**的米数,两个 factory
都可选 ——`MapCameraBounds.distance(...)` 至少要给一个,空 options 会返回 `null`
导致 prop 无效。

约束只对用户手势生效 —— JS 端通过 `cameraPosition` 程序化写入仍可以把相机
移出范围;MapKit 通常在下一次用户交互时把它动画拉回到合法范围。

---

## 性能 tips

- 标注数量:几十个标注没问题。上百时建议在脚本侧做聚类预处理,只发出当前 region
  可见的标注。
- 更新频率:每次渲染会重放整棵内容树。如果在每次 state 变化时都从大数组派生
  大量标注,用 `useMemo` 做记忆化。
- `cameraPosition` 是双向的:JS 端 `setValue` 会触发重新渲染;手势调和器会跳过等价
  回写来避免循环。