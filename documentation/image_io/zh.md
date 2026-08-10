低层图片容器 I/O：读取 EXIF / GPS / TIFF / IPTC 元数据，并把图片编码成 `UIImage.toPNGData` / `toJPEGData` 产不出的格式（以及带嵌入元数据）。

> **为什么不直接用 `UIImage`？** `UIImage` 是**解码后的 bitmap**——拿到它的时候原文件的元数据（EXIF、GPS......）已经丢了，而且 `toPNGData` / `toJPEGData` 写不了 HEIC / TIFF / GIF。`ImageIO` 工作在编码容器层，所以既能读出原有元数据，也能把元数据写回。

```ts
// 读元数据
const meta = await ImageIO.readMetadata("/path/to/photo.jpg")
console.log(meta.pixelWidth, meta.pixelHeight)
console.log(meta.gps?.Latitude, meta.gps?.Longitude)

// 把 UIImage 重新编码成带 GPS 的 HEIC
await ImageIO.writeImage({
  image,                       // 一个 UIImage
  to: "/path/to/out.heic",
  format: "heic",
  quality: 0.9,
  metadata: {
    gps: { Latitude: 37.33, LatitudeRef: "N", Longitude: 122.0, LongitudeRef: "W" },
  },
})
```

---

## `ImageIO.readMetadata(source)`

```ts
function readMetadata(source: string | Data): Promise<ImageMetadata>
```

从文件路径或 `Data` 读取容器级元数据。源无法解码为图片时 reject。

```ts
type ImageMetadata = {
  pixelWidth?: number
  pixelHeight?: number
  dpiWidth?: number
  dpiHeight?: number
  depth?: number
  colorModel?: string
  orientation?: number        // EXIF orientation 1–8
  hasAlpha?: boolean
  profileName?: string
  exif?: Record<string, any>  // CGImageProperties Exif 键，如 DateTimeOriginal
  gps?: Record<string, any>   // GPS 键，如 Latitude / Longitude / LatitudeRef
  tiff?: Record<string, any>
  iptc?: Record<string, any>
  makerApple?: Record<string, any>  // Apple Maker Note，键是数字字符串
}
```

`exif` / `gps` / `tiff` / `iptc` 这几个字典原样沿用 Apple 的 CGImageProperties 键名（`gps.Latitude`、`exif.DateTimeOriginal` ......）。

`makerApple` 是 Apple Maker Note，键为数字字符串。最常用到的是 `'17'`——实况照片的 asset identifier，静态图靠它与配对的 `.mov` 关联：

```ts
const meta = await ImageIO.readMetadata("/path/to/live.heic")
console.log(meta.makerApple?.["17"])   // 例如 "9F1C...-...."
```

它也可以写入，但通常不需要你手动写——要生成合规的实况照片资源对，请用 `LivePhoto.createFromVideo`，不要自己拼 identifier。只有带 EXIF Maker Note 的容器（jpeg / heic）能承载它。

---

## `ImageIO.writeImage(options)`

```ts
function writeImage(options: ImageWriteOptions): Promise<void>
```

把图片编码写到 `to`。`image` 与 `source` **二选一**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `image?` | `UIImage` | 从解码 bitmap 重新编码。原文件元数据**不会**保留，只写入你传的 `metadata`。 |
| `source?` | `string \| Data` | 从原始编码图拷贝，**保留其元数据**，再叠加你传的 `metadata`。 |
| `to` | `string` | 输出文件路径，已存在会被覆盖。 |
| `format?` | `'jpeg' \| 'png' \| 'heic' \| 'tiff' \| 'gif'` | `image` 时必填；`source` 时可省（默认沿用源格式）。 |
| `quality?` | `number` | 有损压缩 0..1（仅 jpeg / heic 有效）。 |
| `metadata?` | `ImageMetadata` | 用 `source` 时叠加在源元数据之上。 |

### 给照片打 GPS 标但保留原 EXIF

用 `source` 变体——经过 `UIImage` 重新编码会丢掉原 EXIF：

```ts
await ImageIO.writeImage({
  source: "/path/to/original.jpg",   // 保留原 EXIF / TIFF
  to: "/path/to/tagged.jpg",
  metadata: { gps: { Latitude: 10.0, LatitudeRef: "N" } },  // 叠加 GPS
})
```

---

## 注意事项

* **`image` 会丢原元数据。** `UIImage` 是解码后的 bitmap。要保留文件原有 EXIF/GPS，请用 `source` 变体而不是 `image`。
* **`quality` 只对 jpeg / heic 生效**，png / tiff / gif 忽略。
* **HEIC 编码** 需要设备/模拟器支持 HEVC 图片编码器；老模拟器上 HEIC 可能失败——若 `writeImage` reject 可降级到 jpeg。
* **键名是原始 CGImageProperties 键。** 写 `exif` / `gps` / `tiff` / `iptc` 时用 Apple 的键名（如 `Latitude`、`LatitudeRef`、`DateTimeOriginal`）。`makerApple` 的键是数字字符串（`'17'` 等）。
* **`makerApple` 需要支持 Maker Note 的容器。** 只有 jpeg / heic 能保住它，写进 png / tiff / gif 会被静默丢弃。
