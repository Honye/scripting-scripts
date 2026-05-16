`AVAsset` 是对媒体资源（音频 / 视频）的重量级句柄，底层由 iOS `AVURLAsset` 支撑。你可以用它在不启动 `AVPlayer` 的前提下读取媒体属性、元数据、轨道信息，以及在任意时间点提取静帧。

也可以把一个 `AVAsset` 直接传给 `AVPlayer.setSource(asset)`，这样元数据、轨道等已加载的信息可以在检查与播放之间共享。

---

## 入门指南

```ts
const asset = new AVAsset("https://example.com/movie.mp4")

const duration = await asset.loadDuration()
console.log("时长：", duration.seconds, "秒")

const playable = await asset.loadIsPlayable()
if (playable) {
  const player = new AVPlayer()
  player.setSource(asset)
  player.play()
}
```

---

## 校验语义

构造器是有意"懒校验"的，与 iOS 原生 `AVURLAsset` 行为保持一致：

* **不**校验文件是否存在
* **不**校验 URL 是否可达
* 对远程 URL，**只有**在字符串本身非法（导致底层 `URL(string:)` 返回 nil）时才会立即抛错
* 其他所有失败（404、网络错误、本地文件不存在、不识别的格式）都会在第一次调用 `loadXxx()` 时通过 **Promise reject** 抛出

```ts
// 构造永远成功——不做校验：
const asset = new AVAsset("/does/not/exist.mp3")

// 第一次 load 时才会拒绝：
try {
  await asset.loadDuration()
} catch (e) {
  console.error("加载失败：", e.message)
}
```

---

## API 参考

### 构造函数

#### `new AVAsset(filePathOrURL: string, options?: { headers?: Record<string, string> })`

从本地文件路径或远程 `http(s)://` URL 创建一个 asset。

远程 URL 可以附带 HTTP headers（用于受保护内容）：

```ts
const asset = new AVAsset("https://example.com/private.mp4", {
  headers: { Authorization: "Bearer abc123" }
})
```

---

### 属性

#### `source: string`

构造此 asset 时使用的原始路径或 URL 字符串，只读。

---

### 异步加载方法

所有 `loadXxx()` 方法都返回 `Promise`；失败（文件不存在 / URL 无法访问 / 格式不识别等）通过 `Error` 拒绝。

#### `loadDuration(): Promise<MediaTime>`

asset 的总时长。

#### `loadIsPlayable(): Promise<boolean>`

asset 是否可播放。

#### `loadIsExportable(): Promise<boolean>`

asset 是否可导出（例如通过 `AVAssetExportSession`）。

#### `loadIsReadable(): Promise<boolean>`

asset 的媒体数据是否可读。

#### `loadHasProtectedContent(): Promise<boolean>`

asset 是否包含 DRM 保护内容。

#### `loadPreferredTransform(): Promise<{ a, b, c, d, tx, ty }>`

视频部分渲染时使用的首选仿射变换（旋转 / 缩放 / 平移）的 6 个分量。

#### `loadMetadata(): Promise<AVMetadataItem[] | null>`

加载 asset 的全部元数据项。

#### `loadCommonMetadata(): Promise<AVMetadataItem[] | null>`

加载通用元数据项（每项带有 `commonKey`）。

---

### 轨道

#### `loadTracks(mediaType?: AVMediaType): Promise<AVAssetTrack[]>`

加载 asset 的轨道，可按媒体类型筛选。

```ts
const videoTracks = await asset.loadTracks("video")
if (videoTracks.length > 0) {
  const size = await videoTracks[0].loadNaturalSize()
  console.log("视频尺寸：", size.width, "x", size.height)
}
```

`AVMediaType` 取值：

```
'video' | 'audio' | 'subtitle' | 'text' | 'closedCaption' | 'metadata' | 'muxed' | 'timecode'
```

#### `AVAssetTrack`

| 成员 | 类型 | 说明 |
|------|------|------|
| `trackID` | `number` | 轨道在 asset 内的持久标识 |
| `mediaType` | `AVMediaType` | 轨道媒体类型 |
| `loadNaturalSize()` | `Promise<Size>` | 自然像素尺寸 |
| `loadNaturalTimeScale()` | `Promise<number>` | 自然时间刻度 |
| `loadNominalFrameRate()` | `Promise<number>` | 帧率 (fps) |
| `loadEstimatedDataRate()` | `Promise<number>` | 数据率 (bps) |
| `loadTimeRange()` | `Promise<{ start, duration }>` | 在 asset 内的时间区间 |
| `loadLanguageCode()` | `Promise<string \| null>` | ISO 639-2/T 语言代码 |

---

### 静帧生成

#### `generateImage(time, options?): Promise<{ image, actualTime }>`

在单个请求时间点生成一张静帧。

```ts
const time = MediaTime.make({ seconds: 5, preferredTimescale: 600 })
const result = await asset.generateImage(time, {
  maximumSize: { width: 640, height: 360 }
})
console.log("拿到帧，实际时间：", result.actualTime.seconds)
```

#### `generateImages(times, options?): Promise<...>`

为一组时间点批量生成静帧。每个时间点的结果独立报告：成功条目带 `image` 和 `actualTime`；失败条目带 `error`。

```ts
const times = [0, 5, 10, 15].map(s =>
  MediaTime.make({ seconds: s, preferredTimescale: 600 })
)

const results = await asset.generateImages(times)
for (const r of results) {
  if ("image" in r) {
    console.log("成功，时间：", r.actualTime.seconds)
  } else {
    console.warn("失败：", r.requestedTime.seconds, "—", r.error)
  }
}
```

#### `AVAssetImageGenerateOptions`

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `maximumSize` | `Size` | 原始尺寸 | 输出尺寸上限，保持原宽高比 |
| `toleranceBefore` | `MediaTime` | `MediaTime.zero()` | 允许早于请求时间多少秒选帧 |
| `toleranceAfter` | `MediaTime` | `MediaTime.zero()` | 允许晚于请求时间多少秒选帧 |
| `appliesPreferredTrackTransform` | `boolean` | `true` | 是否应用首选变换（旋转 / 镜像） |

---

### 生命周期

#### `dispose(): void`

释放底层 `AVURLAsset`。释放后再次调用 `loadXxx()` 会被拒绝。脚本运行结束时未显式释放的 asset 会被自动清理。

---

## 与 AVPlayer 共享

`AVPlayer.setSource(asset)` 直接复用 asset 底层媒体，已加载的属性可以共享：

```ts
const asset = new AVAsset(url)
const metadata = await asset.loadCommonMetadata()  // 播放前预加载

const player = new AVPlayer()
player.setSource(asset)
player.play()
```

---

## 最佳实践

1. **选对抽象层级** — 仅做检查时优先用 `AVAsset` 而不是 `AVPlayer`，避免引入播放机制
2. **检查与播放共享 asset** — 构造一次 `AVAsset`，再传给 `AVPlayer.setSource(asset)`
3. **永远捕获 Promise 拒绝** — 错误从这里抛出，构造器不会
4. **优先批量提帧** — `generateImages(times)` 比循环调用 `generateImage(time)` 更高效
5. **tolerance 用于换取速度** — 缩略图等场景下，给 `toleranceBefore` / `After` 设个 0.5 秒左右通常比精确帧匹配快很多

---

## 完整示例

```ts
const asset = new AVAsset("/path/to/movie.mp4")

try {
  const [duration, videoTracks] = await Promise.all([
    asset.loadDuration(),
    asset.loadTracks("video"),
  ])

  console.log("时长：", duration.seconds, "秒")

  if (videoTracks.length > 0) {
    const size = await videoTracks[0].loadNaturalSize()
    console.log("分辨率：", size.width, "x", size.height)
  }

  // 取中点的缩略图
  const mid = MediaTime.make({
    seconds: duration.seconds / 2,
    preferredTimescale: 600
  })
  const { image } = await asset.generateImage(mid, {
    maximumSize: { width: 320, height: 180 }
  })

  console.log("缩略图尺寸：", image.width, "x", image.height)
} catch (e) {
  console.error("asset 错误：", e.message)
} finally {
  asset.dispose()
}
```
