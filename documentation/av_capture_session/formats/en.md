Each `AVCaptureDevice` advertises an array of `AVCaptureDeviceFormat`s — one entry per capture mode the hardware supports (1080p30, 4K60, 720p binned, spatial video, etc.). Picking the right format is how you control resolution, frame rate, HDR, multi-cam compatibility, stabilization, and a handful of front-camera effects (Center Stage, Studio Light, Portrait).

The session preset (`session.sessionPreset = "photo"`) is a coarse alias that asks the system to pick a reasonable format. Switching the active format yourself locks the device into exact dimensions and frame rates.

## The wrapper, briefly

```ts
class AVCaptureDeviceFormat {
  readonly mediaType: string                 // "vide" / "soun" / ...
  readonly width: number                     // pixel width (0 for non-video)
  readonly height: number
  readonly fieldOfView: number               // degrees, horizontal

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
    minFrameDuration: number, maxFrameDuration: number   // seconds
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

You never construct one — obtain instances from `device.formats` or `device.activeFormat`.

## Identity is stable

Each device wrapper hands out the same `AVCaptureDeviceFormat` instance for the same underlying format every time. So:

```ts
const a = device.formats[0]
const b = device.formats[0]
console.log(a === b)                                       // true
console.log(device.formats.includes(device.activeFormat))  // true
```

That lets you do `formats.indexOf(device.activeFormat)`, compare with `===`, or stash a chosen format and reuse it later. The same underlying format obtained from two different `AVCaptureDevice` instances is two different JS wrappers, though — only meaningful if you build two device objects on purpose.

## Choosing a format

Standard pattern: filter `device.formats`, pick by your own rules, hand the winner to `setActiveFormat`.

```ts
const camera = AVCaptureDevice.default("video")!

// All 1080p formats that can do 60 fps and HDR
const candidates = camera.formats.filter(f =>
  f.width === 1920 && f.height === 1080 &&
  f.isVideoHDRSupported &&
  f.videoSupportedFrameRateRanges.some(r => r.maxFrameRate >= 60)
)

// Prefer non-binned (full sensor), then take whatever's left as a tie-breaker.
const winner =
  candidates.find(f => !f.isVideoBinned) ??
  candidates[0]

if (winner) {
  camera.setActiveFormat(winner)
}
```

A few common filters worth knowing:

| Goal | Filter expression |
| --- | --- |
| 4K UHD | `f.width === 3840 && f.height === 2160` |
| 60 fps capable | `f.videoSupportedFrameRateRanges.some(r => r.maxFrameRate >= 60)` |
| HDR ready | `f.isVideoHDRSupported` |
| Spatial video (iPhone 15 Pro+) | `f.isSpatialVideoCaptureSupported` |
| Multi-cam compatible | `f.isMultiCamSupported` |
| Supports cinematic stabilization | `f.isVideoStabilizationModeSupported("cinematic")` |
| Apple Log color | `f.supportedColorSpaces.includes("appleLog")` |
| Center Stage capable (front cam) | `f.isCenterStageSupported` |

## `setActiveFormat` rules

* The format **must** come from this same device's `formats` array. Passing a format obtained from another device throws — the check happens before any configuration lock, so a stray format won't take the camera down with it.
* `setActiveFormat` performs the change inside its own configuration lock. For a batch of related changes (format + color space + frame rate clamp), wrap the whole block in `device.lockForConfiguration()` / `device.unlockForConfiguration()` yourself so the camera only re-negotiates once.
* Changing format while a session is running is fine; connections are re-negotiated automatically. Sample-buffer outputs may briefly drop frames during the switch.

```ts
// Batched change — single lock, no flicker between settings
camera.lockForConfiguration()
try {
  camera.setActiveFormat(winner)
  camera.setActiveColorSpace("P3_D65")
  camera.setActiveVideoMinFrameDuration(1 / 60)
} finally {
  camera.unlockForConfiguration()
}
```

## Active color space

The active format dictates *which* color spaces are possible; `device.activeColorSpace` and `device.setActiveColorSpace(value)` choose among them.

```ts
const camera = AVCaptureDevice.default("video")!
const supported = camera.activeFormat.supportedColorSpaces
console.log("current:", camera.activeColorSpace)
console.log("options:", supported)

if (supported.includes("appleLog")) {
  camera.setActiveColorSpace("appleLog")   // grading workflow
} else if (supported.includes("P3_D65")) {
  camera.setActiveColorSpace("P3_D65")     // wide-gamut still display
}
```

`setActiveColorSpace` throws if the value isn't in `activeFormat.supportedColorSpaces`. Switching format may change which color spaces are valid; re-check after `setActiveFormat`.

## Locking frame rate (`setActiveVideoMin/MaxFrameDuration`)

The active format publishes a range of supported frame rates — e.g. 1–60 fps. Use the two clamp setters to pin where in that range the camera actually runs:

* `device.setActiveVideoMinFrameDuration(seconds)` — **shorter** duration ⇒ **higher** maximum fps. Pass `1 / 60` to cap at 60 fps.
* `device.setActiveVideoMaxFrameDuration(seconds)` — **longer** duration ⇒ **lower** minimum fps. Pass `1 / 24` to floor at 24 fps.

```ts
// Lock to exactly 60 fps on a format that supports it
camera.setActiveVideoMinFrameDuration(1 / 60)
camera.setActiveVideoMaxFrameDuration(1 / 60)

console.log("now running between",
  1 / camera.activeVideoMaxFrameDuration, "and",
  1 / camera.activeVideoMinFrameDuration, "fps")
```

Both setters validate the seconds value against `activeFormat.videoSupportedFrameRateRanges` and throw if it falls outside every range. The getters return `0` when the device hasn't been clamped (the format's natural range is in effect).

## Field gotchas

* `width` / `height` / `fieldOfView` are **`0`** on non-video formats (audio, metadata) — they have no video dimensions. Filter to `mediaType === "vide"` if you only care about cameras.
* `videoSupportedFrameRateRanges` can have **multiple entries** — a single format may support, e.g., 1–30 fps and 60 fps in two separate ranges. Don't assume the array has one element.
* `videoMaxZoomFactor` is the hardware ceiling. `videoZoomFactorUpscaleThreshold` is the point above which the system starts digital upscaling instead of staying within the sensor's optical range.
* `isHighestPhotoQualitySupported` / `isHighPhotoQualitySupported` describe **photo** quality tiers — they affect `photoOutput.maxPhotoQualityPrioritization`, not video.
* `isCenterStageSupported` etc. report per-format support. The global toggle that turns these effects on system-wide is separate; on formats where the per-format flag is `false`, the system-wide toggle has no effect for this device.
