Three lower-level companions to `AVAsset`, mirroring the iOS `AVAssetExportSession` / `AVAssetReader` / `AVAssetWriter` APIs:

* **`AVAssetExportSession`** — high-level transcoding / re-encoding with a preset name.
* **`AVAssetReader` + outputs** — pull decoded video frames as `UIImage` or PCM audio as `Float32Array`.
* **`AVAssetWriter` + `AVAssetWriterInput`** — push frames / samples produced in JS into a new mp4 / m4a file.

> **Local files only.** Both `AVAssetReader` and `AVAssetExportSession` are unreliable when fed an HTTP-streamed asset. Download remote sources to a local path first (`fetch()` + `FileManager.writeAsBytes()`), then construct the asset from that path.

---

## AVAssetExportSession

High-level transcode / re-encode using a preset.

```ts
const asset = new AVAsset("/path/to/input.mov")
const session = new AVAssetExportSession(asset, "HEVCHighestQuality")
session.outputFileType = "mp4"
session.onProgress = p => console.log(`${(p * 100).toFixed(0)}%`)
await session.exportTo("/path/to/output.mp4")
```

### Constructor

#### `new AVAssetExportSession(asset: AVAsset, presetName: AVAssetExportPreset)`

Throws if `asset` is not a non-disposed `AVAsset`. The preset's compatibility with the asset is validated lazily inside `exportTo()`.

```ts
type AVAssetExportPreset =
  | '640x480' | '960x540' | '1280x720' | '1920x1080' | '3840x2160'
  | 'AppleM4A'
  | 'LowQuality' | 'MediumQuality' | 'HighestQuality'
  | 'HEVC1920x1080' | 'HEVC3840x2160' | 'HEVCHighestQuality'
  | 'AppleProRes422LPCM' | 'AppleProRes4444LPCM'
```

### Properties

| Property | Type | Description |
| --- | --- | --- |
| `outputFileType?` | `'mp4' \| 'mov' \| 'm4a' \| 'm4v'` | Optional. Pre-validated against the preset's `supportedFileTypes` to avoid an ObjC exception that would crash the process. |
| `timeRange?` | `{ start: MediaTime; duration: MediaTime }` | Optional clip range. |
| `shouldOptimizeForNetworkUse` | `boolean` | Defaults to `true`. |
| `status` | `'unknown' \| 'exporting' \| 'completed' \| 'failed' \| 'cancelled'` | Read-only. |
| `onProgress?` | `(p: number) => void` | Polled at ~5 Hz while exporting; final call is always `1.0`. |

### Methods

#### `exportTo(outputPath: string): Promise<void>`

Resolves on success, rejects with the underlying `session.error.localizedDescription` on failure (including the cancellation case). Calling while another export is running rejects immediately.

If `outputFileType` is incompatible with the preset, the promise rejects with a list of supported types — it does **not** throw an uncatchable ObjC `NSInvalidArgumentException`.

#### `cancel(): void`

Cancels the in-flight export. The pending `exportTo` promise rejects with `"Export cancelled."`.

#### `dispose(): void`

Releases the underlying session.

---

## AVAssetReader

Pull decoded samples from an asset, frame-by-frame or chunk-by-chunk.

```ts
const asset = new AVAsset("/path/to/input.mp4")
const tracks = await asset.loadTracks("video")

const reader = new AVAssetReader(asset)
const out = new AVAssetReaderVideoOutput(tracks[0])
reader.add(out)
reader.startReading()

for (;;) {
  const frame = await out.copyNextFrame()
  if (frame == null) break  // true end-of-stream
  console.log(frame.presentationTime.seconds, frame.image.size)
}
```

### `AVAssetReader`

| Member | Description |
| --- | --- |
| `new AVAssetReader(asset)` | Throws if `asset` is disposed or invalid. |
| `add(output): boolean` | Returns `false` if reader is past `'unknown'` or output is incompatible. |
| `startReading(): boolean` | Must be called after `add()` and before any `copyNextX()`. |
| `cancelReading()` | Aborts reading; pending `copyNextX()` promises reject with `"Reader cancelled."`. |
| `status` | `'unknown' \| 'reading' \| 'completed' \| 'failed' \| 'cancelled'` |
| `error` | `string \| null` — localized error message when `status === 'failed'`. |
| `dispose()` | Cancels and releases. |

### `AVAssetReaderVideoOutput`

```ts
class AVAssetReaderVideoOutput {
  constructor(track: AVAssetTrack, options?: { pixelFormat?: 'bgra' | 'rgba' })
  copyNextFrame(): Promise<{ image: UIImage; presentationTime: MediaTime } | null>
}
```

`copyNextFrame()` returns `null` only on a clean end-of-stream. If the reader transitions to `'failed'` or `'cancelled'`, the promise **rejects** so you don't silently see "0 frames decoded".

### `AVAssetReaderAudioOutput`

```ts
class AVAssetReaderAudioOutput {
  constructor(tracks: AVAssetTrack[], options?: { sampleRate?: number; channels?: number })
  copyNextSamples(): Promise<{
    samples: Float32Array       // length === frameCount * channels (interleaved)
    frameCount: number
    sampleRate: number
    channels: number
    presentationTime: MediaTime
  } | null>
}
```

Always interleaved 32-bit float PCM. Pass multiple tracks to mix; `options.sampleRate` and `options.channels` resample / re-channel.

---

## AVAssetWriter

Manually push UIImage frames or PCM chunks to produce a new mp4 / m4a.

```ts
const sampleRate = 44100
const writer = new AVAssetWriter("/tmp/out.m4a", "m4a")
const input = AVAssetWriterInput.audio({ sampleRate, channels: 1, codec: "pcm" })
writer.add(input)
writer.startWriting()
writer.startSession(MediaTime.zero())

const samples = new Float32Array(sampleRate)  // 1 second of silence
input.appendPCMSamples(samples, sampleRate, 1, MediaTime.make({ value: 0, timescale: sampleRate }))
input.markAsFinished()
await writer.finishWriting()
```

### `AVAssetWriter`

| Member | Description |
| --- | --- |
| `new AVAssetWriter(outputPath, fileType)` | Throws on unsupported `fileType` (`'mp4' \| 'mov' \| 'm4a' \| 'm4v'`). |
| `add(input): boolean` | Must be called before `startWriting`. |
| `startWriting(): boolean` | |
| `startSession(atSourceTime: MediaTime): void` | Usually `MediaTime.zero()`. |
| `finishWriting(): Promise<void>` | Resolves on `completed`, rejects on `failed` / `cancelled`. |
| `cancelWriting()` | |
| `status` | `'unknown' \| 'writing' \| 'completed' \| 'failed' \| 'cancelled'` |
| `error` | Localized error when `status === 'failed'`. |
| `dispose()` | |

### `AVAssetWriterInput` (static factories)

```ts
AVAssetWriterInput.video({
  width: number, height: number,
  codec?: 'h264' | 'hevc',          // default 'h264'
  bitRate?: number,                 // bits per second
  frameRate?: number,
})

AVAssetWriterInput.audio({
  sampleRate?: number,              // default 44100
  channels?: number,                // default 1
  codec?: 'aac' | 'pcm',            // default 'aac'
  bitRate?: number,                 // only meaningful for AAC
})
```

| Member | Description |
| --- | --- |
| `isReadyForMoreMediaData` | `true` when the encoder can accept more samples without blocking. |
| `markAsFinished()` | Call before `writer.finishWriting()`. |
| `appendVideoFrame(image, presentationTime): boolean` | Returns `false` when the input is full or finished — `await whenReady()` and retry. |
| `appendPCMSamples(samples, sampleRate, channels, presentationTime): boolean` | Interleaved Float32; `samples.length === frameCount * channels`. |
| `whenReady(): Promise<void>` | Resolves when `isReadyForMoreMediaData` becomes `true`. |
