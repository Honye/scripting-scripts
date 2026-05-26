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

## 注意事项

- 1024×768 retina 截图原图 PNG 可达几 MB;只做预览用的话先 `preparingThumbnail` 再持久化。
- Apple 大部分设备 `scale` 上限为 3x,更高的值会被静默 clamp。
- 走 Apple 地图瓦片服务;失败时 Promise 以错误描述 reject。
