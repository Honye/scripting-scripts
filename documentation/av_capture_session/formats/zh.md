每个 `AVCaptureDevice` 都会暴露一个 `AVCaptureDeviceFormat` 数组——硬件支持的每种采集模式都是一项 (1080p30 / 4K60 / 720p binned / spatial video 等)。挑对 format 就是在控制分辨率、帧率、HDR、multi-cam 兼容性、稳定化, 以及一小撮前置摄像头特效 (Center Stage / Studio Light / Portrait)。

`session.sessionPreset = "photo"` 是粗粒度的别名 ("让系统帮我挑一个合适的"), 自己 `setActiveFormat` 才能锁死具体分辨率和帧率。

## 类型一览

```ts
class AVCaptureDeviceFormat {
  readonly mediaType: string                 // "vide" / "soun" / ...
  readonly width: number                     // 像素宽 (非视频 format 为 0)
  readonly height: number
  readonly fieldOfView: number               // 度, 水平 FOV

  readonly videoMaxZoomFactor: number
  readonly videoZoomFactorUpscaleThreshold: number
  readonly isVideoBinned: boolean

  readonly isHighestPhotoQualitySupported: boolean
  readonly isHighPhotoQualitySupported: boolean

  readonly isVideoHDRSupported: boolean
  readonly isMultiCamSupported: boolean
  readonly supportedColorSpaces: ("sRGB" | "P3_D65" | "HLG_BT2020" | "appleLog" | "appleLog2")[]
  readonly autoFocusSystem: "none" | "contrastDetection" | "phaseDetection"

  readonly videoSupportedFrameRateRanges: {
    minFrameRate: number, maxFrameRate: number,
    minFrameDuration: number, maxFrameDuration: number   // 秒
  }[]

  isVideoStabilizationModeSupported(
    mode: "off"|"standard"|"cinematic"|"cinematicExtended"
        |"cinematicExtendedEnhanced"|"previewOptimized"|"lowLatency"|"auto"
  ): boolean

  readonly isSpatialVideoCaptureSupported: boolean
  readonly isCenterStageSupported: boolean
  readonly isPortraitEffectSupported: boolean
  readonly isStudioLightSupported: boolean
}
```

你不会自己构造 format —— 全部从 `device.formats` / `device.activeFormat` 拿。

## 身份稳定 (identity-stable)

同一个 device wrapper 对同一个底层 format 始终返回**同一个** `AVCaptureDeviceFormat` 实例。所以:

```ts
const a = device.formats[0]
const b = device.formats[0]
console.log(a === b)                                       // true
console.log(device.formats.includes(device.activeFormat))  // true
```

这让 `formats.indexOf(device.activeFormat)`、`===`、缓存某个 format 复用都可以放心用。**同一底层 format 从两个不同 `AVCaptureDevice` wrapper 取出来是两个 JS 实例**, 不过这只影响刻意构造两次 device 对象的代码。

## 挑 format 的套路

标准做法: 用 `device.formats.filter(...)` 收一组候选, 自己定 tie-break 规则, 把胜者喂给 `setActiveFormat`。

```ts
const camera = AVCaptureDevice.default("video")!

// 所有支持 60fps + HDR 的 1080p format
const candidates = camera.formats.filter(f =>
  f.width === 1920 && f.height === 1080 &&
  f.isVideoHDRSupported &&
  f.videoSupportedFrameRateRanges.some(r => r.maxFrameRate >= 60)
)

// 优先非 binned (满传感器), 否则任挑一个
const winner =
  candidates.find(f => !f.isVideoBinned) ??
  candidates[0]

if (winner) {
  camera.setActiveFormat(winner)
}
```

一些常用过滤表达:

| 目标 | 过滤表达式 |
| --- | --- |
| 4K UHD | `f.width === 3840 && f.height === 2160` |
| 支持 60fps | `f.videoSupportedFrameRateRanges.some(r => r.maxFrameRate >= 60)` |
| 支持 HDR | `f.isVideoHDRSupported` |
| Spatial video (iPhone 15 Pro+) | `f.isSpatialVideoCaptureSupported` |
| Multi-cam 兼容 | `f.isMultiCamSupported` |
| 支持 cinematic 稳定化 | `f.isVideoStabilizationModeSupported("cinematic")` |
| 支持 Apple Log 色彩 | `f.supportedColorSpaces.includes("appleLog")` |
| 前置 Center Stage 可用 | `f.isCenterStageSupported` |

## `setActiveFormat` 的规则

* format **必须来自同一个 device 的 formats 数组**。把另一个 device 的 format 传过来会抛 —— 校验发生在加 configuration lock 之前, 不会把相机搞挂。
* `setActiveFormat` 内部自带 configuration lock。要一次批量改 (format + 色彩空间 + 帧率 clamp), **自己在外面包一层** `device.lockForConfiguration()` / `device.unlockForConfiguration()`, 整段共用同一把锁, 相机只重新协商一次。
* session 跑起来之后改 format 没问题, 内部会自动重协商 connections。sample buffer output 可能在切换瞬间丢几帧。

```ts
// 批量改 — 整段共用一把锁, 不会在 setting 之间闪烁
camera.lockForConfiguration()
try {
  camera.setActiveFormat(winner)
  camera.setActiveColorSpace("P3_D65")
  camera.setActiveVideoMinFrameDuration(1 / 60)
} finally {
  camera.unlockForConfiguration()
}
```

## 当前色彩空间

active format 决定哪些色彩空间**可用**; `device.activeColorSpace` 与 `device.setActiveColorSpace(value)` 在可用集合里选一个。

```ts
const camera = AVCaptureDevice.default("video")!
const supported = camera.activeFormat.supportedColorSpaces
console.log("current:", camera.activeColorSpace)
console.log("options:", supported)

if (supported.includes("appleLog")) {
  camera.setActiveColorSpace("appleLog")   // 后期调色工作流
} else if (supported.includes("P3_D65")) {
  camera.setActiveColorSpace("P3_D65")     // 广色域静态拍摄
}
```

`setActiveColorSpace` 在 value 不在 `activeFormat.supportedColorSpaces` 里时抛错。切换 format 之后可用色彩空间可能变, `setActiveFormat` 之后记得重读。

## 锁定帧率 (`setActiveVideoMin/MaxFrameDuration`)

active format 会公布一个支持的帧率区间——例如 1–60 fps。两个 clamp setter 用来在这个区间里钉一个真正运行的范围:

* `device.setActiveVideoMinFrameDuration(seconds)` —— duration **越短** ⇒ 最大 fps **越高**。传 `1 / 60` 把帧率上限锁到 60 fps。
* `device.setActiveVideoMaxFrameDuration(seconds)` —— duration **越长** ⇒ 最小 fps **越低**。传 `1 / 24` 把帧率下限锁到 24 fps。

```ts
// 在支持的 format 上锁死 60fps
camera.setActiveVideoMinFrameDuration(1 / 60)
camera.setActiveVideoMaxFrameDuration(1 / 60)

console.log("now running between",
  1 / camera.activeVideoMaxFrameDuration, "and",
  1 / camera.activeVideoMinFrameDuration, "fps")
```

两个 setter 都会用 `activeFormat.videoSupportedFrameRateRanges` 校验秒值, 落不进任何一段范围就抛错。getter 在设备未被 clamp 时返回 `0` (此时 format 自带的自然范围生效)。

## 字段坑

* `width` / `height` / `fieldOfView` 在非视频 format (audio / metadata) 上都是 **`0`** —— 它们没视频维度概念。只关心相机就先 filter `mediaType === "vide"`。
* `videoSupportedFrameRateRanges` 可能**多于一项** —— 单个 format 可能同时报 1–30 fps 和 60 fps 两个独立 range, 别假定数组只有一项。
* `videoMaxZoomFactor` 是硬件上限。`videoZoomFactorUpscaleThreshold` 是"超过这个倍数开始数字上采样"的临界点。
* `isHighestPhotoQualitySupported` / `isHighPhotoQualitySupported` 描述的是**拍照**质量档, 影响 `photoOutput.maxPhotoQualityPrioritization`, 不影响视频。
* `isCenterStageSupported` 等是 format 级支持。系统级开关是另一个维度, 在 per-format flag 为 `false` 的 format 上, 系统级开关对该设备无效。
