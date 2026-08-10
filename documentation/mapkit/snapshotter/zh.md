`MapSnapshotter` 通过 MapKit 在后台离屏渲染一张静态地图图片。适合不能用 `<Map>`
SwiftUI 视图的场景:widget 预览、分享缩略图、导出报告等。

```tsx
const snap = await MapSnapshotter.take({
  region: {
    center: { latitude: 31.2407, longitude: 121.4905 },
    span: { latitudeDelta: 0.02, longitudeDelta: 0.02 },
  },
  size: { width: 320, height: 200 },
})

// snap.image 就是 UIImage,直接喂给 <Image>。
return <Image image={snap.image} />
```

---

## `take` — 渲染快照

### Options

| 选项 | 类型 | 说明 |
|---|---|---|
| `region` | `MapRegion?` | 要捕获的区域。与 `camera` 互斥。 |
| `camera` | `MapCamera?` | 眼位相机框定(`MapCamera.make(...)`)。同时传时 `camera` 胜出。 |
| `size` | `{ width: number; height: number }` | 必填。输出尺寸(点),两个维度都 > 0。 |
| `scale` | `number?` | 像素 scale 因子,默认为设备主屏 scale。 |
| `mapStyle` | `MapStyleSpec?` | 与 `<Map mapStyle>` 完全同形,默认 `{ style: "standard" }`。 |
| `appearance` | `"light" \| "dark"?` | 渲染色调。 |
| `overlays` | `SnapshotOverlay[]?` | 画到图上的路线、区域、圆。见[叠加层与标注](#叠加层与标注)。 |
| `annotations` | `SnapshotAnnotation[]?` | 画在图片最上层的标注 pin。 |

### `MapSnapshot`

| 成员 | 类型 | 说明 |
|---|---|---|
| `size` | `{ width, height }` | 等于 `options.size`。 |
| `image` | `UIImage` | 渲染好的地图。喂给 `<Image image={snap.image} />` 渲染,或者用任意 `UIImage` 方法 — `toPNGBase64String()` / `toPNGData()` / `preparingThumbnail(size)` / `withTintColor(...)` 等。 |
| `point(coordinate)` | `{ x, y }` | 把地理坐标换算成快照内的点(单位为 points,与 `size` 一致)。坐标在画面外也会返回(可能为负或超出 `size`),需要 overlay 仅在画面内时自行 bounds 检查。 |

### 叠加坐标

`point` 是给在图上画 pin / 标签用的:

```tsx
const pin = snap.point({ latitude: 31.24, longitude: 121.49 })
const inBounds =
  pin.x >= 0 && pin.y >= 0 && pin.x <= snap.size.width && pin.y <= snap.size.height

return <ZStack>
  <Image image={snap.image} />
  {inBounds
    ? <Image
        systemName="mappin.circle.fill"
        position={{ x: pin.x, y: pin.y }}
        foregroundStyle="systemRed"
      />
    : null}
</ZStack>
```

### 操作 `UIImage`

`snap.image` 是普通的 `UIImage` 实例,所有现有 helper 都能用 — 比如分享前先缩小:

```ts
const thumb = snap.image.preparingThumbnail({ width: 160, height: 100 })
const pngBase64 = await thumb?.toPNGBase64String()
```

---

## 叠加层与标注

传 `overlays` 和 `annotations`,就能把地理内容直接烘焙进图片 — 不用手算坐标、也不用叠额外的
`<Image>`。这是把路线变成图片的最简方式。

当你**同时省略** `region` 和 `camera` 时,快照会**自动取景**框住所有 overlay 和 annotation,
于是路线转图片变成一行:

```tsx
const { routes } = await MapDirections.calculate({
  source: { latitude: 31.2304, longitude: 121.4737 },
  destination: { latitude: 31.2197, longitude: 121.4453 },
})

const snap = await MapSnapshotter.take({
  size: { width: 320, height: 200 },
  // 不给 region/camera:地图自动框住整条路线。
  overlays: [
    { type: "polyline", coordinates: routes[0].coordinates, strokeColor: "systemBlue", lineWidth: 5 },
  ],
  annotations: [
    { coordinate: routes[0].coordinates[0], tintColor: "systemGreen", glyph: "figure.walk" },
    { coordinate: routes[0].coordinates.at(-1)!, tintColor: "systemRed", title: "Destination" },
  ],
})

return <Image image={snap.image} />
```

### 叠加层(overlays)

每个 overlay 是三种形状之一。颜色接受任意 `Color` 字符串(`"#RRGGBB"`、`"rgb(...)"`、
`"systemBlue"` 等)。

| 形状 | 字段 | 说明 |
|---|---|---|
| `"polyline"` | `coordinates`、`strokeColor?`、`lineWidth?` | 至少 2 个点。默认描边=系统蓝、宽度 `4`。 |
| `"polygon"` | `coordinates`、`strokeColor?`、`fillColor?`、`lineWidth?` | 至少 3 个顶点,自动闭合。`fillColor` 默认取描边色的半透明版。 |
| `"circle"` | `center`、`radius`(米)、`strokeColor?`、`fillColor?`、`lineWidth?` | 半径是地理米数,会随地图缩放。 |

```tsx
const snap = await MapSnapshotter.take({
  size: { width: 300, height: 300 },
  overlays: [
    { type: "circle", center: { latitude: 31.23, longitude: 121.47 }, radius: 500, fillColor: "rgba(255,0,0,0.15)", strokeColor: "systemRed" },
    { type: "polygon", coordinates: area, strokeColor: "systemIndigo" },
  ],
})
```

### 标注(annotations)

标注是一个尖端指向 `coordinate` 的 pin。可选加 `glyph`(SF Symbol 名,或最多两个字符的文字)
和 `title` 文字标签。

```tsx
annotations: [
  { coordinate: { latitude: 31.23, longitude: 121.47 }, tintColor: "systemBlue", glyph: "star.fill", title: "Start" },
]
```

overlay 和 annotation 都在底图之后按数组顺序绘制,annotation 永远在最上层。投影落在画面外的内容会被裁掉。

---

## 注意事项

- 1024×768 retina 截图原图 PNG 可达几 MB;只做预览用的话先 `preparingThumbnail` 再持久化。
- Apple 大部分设备 `scale` 上限为 3x,更高的值会被静默 clamp。
- 走 Apple 地图瓦片服务;失败时 Promise 以错误描述 reject。
