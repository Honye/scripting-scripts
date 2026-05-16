三个 `AVAsset` 的低层伴随 API,对应 iOS 的 `AVAssetExportSession` / `AVAssetReader` / `AVAssetWriter`:

* **`AVAssetExportSession`** —— 高层转码 / 重压缩,按 preset 名启动。
* **`AVAssetReader` + 输出类** —— 拉取已解码视频帧（`UIImage`）或 PCM 音频（`Float32Array`）。
* **`AVAssetWriter` + `AVAssetWriterInput`** —— 把 JS 端生成的帧 / 采样推入新的 mp4 / m4a 文件。

> **仅支持本地文件。** `AVAssetReader` 与 `AVAssetExportSession` 在 HTTP 流式 asset 上不可靠。请先用 `fetch()` + `FileManager.writeAsBytes()` 把远程文件下载到本地,再从本地路径构造 asset。

---

## AVAssetExportSession

按 preset 做高层转码 / 重压缩。

```ts
const asset = new AVAsset("/path/to/input.mov")
const session = new AVAssetExportSession(asset, "HEVCHighestQuality")
session.outputFileType = "mp4"
session.onProgress = p => console.log(`${(p * 100).toFixed(0)}%`)
await session.exportTo("/path/to/output.mp4")
```

### Constructor

#### `new AVAssetExportSession(asset: AVAsset, presetName: AVAssetExportPreset)`

`asset` 必须是未 dispose 的 `AVAsset`,否则抛错。preset 与 asset 的兼容性会延迟到 `exportTo()` 内部校验。

```ts
type AVAssetExportPreset =
  | '640x480' | '960x540' | '1280x720' | '1920x1080' | '3840x2160'
  | 'AppleM4A'
  | 'LowQuality' | 'MediumQuality' | 'HighestQuality'
  | 'HEVC1920x1080' | 'HEVC3840x2160' | 'HEVCHighestQuality'
  | 'AppleProRes422LPCM' | 'AppleProRes4444LPCM'
```

### 属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `outputFileType?` | `'mp4' \| 'mov' \| 'm4a' \| 'm4v'` | 可选。会预先与 preset 的 `supportedFileTypes` 比对,避免触发会让进程崩溃的 ObjC 异常。 |
| `timeRange?` | `{ start: MediaTime; duration: MediaTime }` | 可选裁剪范围。 |
| `shouldOptimizeForNetworkUse` | `boolean` | 默认 `true`。 |
| `status` | `'unknown' \| 'exporting' \| 'completed' \| 'failed' \| 'cancelled'` | 只读。 |
| `onProgress?` | `(p: number) => void` | 导出过程中约 5 Hz 轮询;最后一次保证为 `1.0`。 |

### 方法

#### `exportTo(outputPath: string): Promise<void>`

成功 resolve;失败时以 `session.error.localizedDescription` reject（取消亦走此路径）。已有 export 在执行时再调直接 reject。

如果 `outputFileType` 与 preset 不兼容,Promise 会以"支持类型列表"的可读消息 reject —— **不会**抛出无法捕获的 ObjC `NSInvalidArgumentException`。

#### `cancel(): void`

取消进行中的 export。pending 的 `exportTo` Promise 会以 `"Export cancelled."` reject。

#### `dispose(): void`

释放底层 session。

---

## AVAssetReader

逐帧 / 逐块拉取 asset 的已解码采样。

```ts
const asset = new AVAsset("/path/to/input.mp4")
const tracks = await asset.loadTracks("video")

const reader = new AVAssetReader(asset)
const out = new AVAssetReaderVideoOutput(tracks[0])
reader.add(out)
reader.startReading()

for (;;) {
  const frame = await out.copyNextFrame()
  if (frame == null) break  // 真正的 end-of-stream
  console.log(frame.presentationTime.seconds, frame.image.size)
}
```

### `AVAssetReader`

| 成员 | 说明 |
| --- | --- |
| `new AVAssetReader(asset)` | asset 已 dispose 或不可用时抛错。 |
| `add(output): boolean` | reader 已超出 `'unknown'` 状态或 output 不兼容时返回 `false`。 |
| `startReading(): boolean` | 必须在 `add()` 之后、`copyNextX()` 之前调用。 |
| `cancelReading()` | 取消读取;pending 的 `copyNextX()` Promise 会 reject `"Reader cancelled."`。 |
| `status` | `'unknown' \| 'reading' \| 'completed' \| 'failed' \| 'cancelled'` |
| `error` | `string \| null` —— `status === 'failed'` 时的本地化错误信息。 |
| `dispose()` | 取消并释放。 |

### `AVAssetReaderVideoOutput`

```ts
class AVAssetReaderVideoOutput {
  constructor(track: AVAssetTrack, options?: { pixelFormat?: 'bgra' | 'rgba' })
  copyNextFrame(): Promise<{ image: UIImage; presentationTime: MediaTime } | null>
}
```

`copyNextFrame()` 仅在干净的 end-of-stream 时返回 `null`。如果 reader 转入 `'failed'` 或 `'cancelled'`,Promise 会 **reject**,避免你拿到"0 帧解码"的静默错误。

### `AVAssetReaderAudioOutput`

```ts
class AVAssetReaderAudioOutput {
  constructor(tracks: AVAssetTrack[], options?: { sampleRate?: number; channels?: number })
  copyNextSamples(): Promise<{
    samples: Float32Array       // 长度 === frameCount * channels（交错存放）
    frameCount: number
    sampleRate: number
    channels: number
    presentationTime: MediaTime
  } | null>
}
```

固定输出 32-bit float interleaved PCM。传多 track 即混音;`options.sampleRate` 与 `options.channels` 用于重采样 / 重声道。

---

## AVAssetWriter

手工 push UIImage 帧或 PCM 块,生成新的 mp4 / m4a。

```ts
const sampleRate = 44100
const writer = new AVAssetWriter("/tmp/out.m4a", "m4a")
const input = AVAssetWriterInput.audio({ sampleRate, channels: 1, codec: "pcm" })
writer.add(input)
writer.startWriting()
writer.startSession(MediaTime.zero())

const samples = new Float32Array(sampleRate)  // 1 秒静音
input.appendPCMSamples(samples, sampleRate, 1, MediaTime.make({ value: 0, timescale: sampleRate }))
input.markAsFinished()
await writer.finishWriting()
```

### `AVAssetWriter`

| 成员 | 说明 |
| --- | --- |
| `new AVAssetWriter(outputPath, fileType)` | `fileType` 仅支持 `'mp4' \| 'mov' \| 'm4a' \| 'm4v'`。 |
| `add(input): boolean` | 必须在 `startWriting` 前调用。 |
| `startWriting(): boolean` | |
| `startSession(atSourceTime: MediaTime): void` | 通常用 `MediaTime.zero()`。 |
| `finishWriting(): Promise<void>` | `completed` 时 resolve;`failed` / `cancelled` 时 reject。 |
| `cancelWriting()` | |
| `status` | `'unknown' \| 'writing' \| 'completed' \| 'failed' \| 'cancelled'` |
| `error` | `status === 'failed'` 时的本地化错误。 |
| `dispose()` | |

### `AVAssetWriterInput`（静态工厂）

```ts
AVAssetWriterInput.video({
  width: number, height: number,
  codec?: 'h264' | 'hevc',          // 默认 'h264'
  bitRate?: number,                 // 比特/秒
  frameRate?: number,
})

AVAssetWriterInput.audio({
  sampleRate?: number,              // 默认 44100
  channels?: number,                // 默认 1
  codec?: 'aac' | 'pcm',            // 默认 'aac'
  bitRate?: number,                 // 只对 AAC 有效
})
```

| 成员 | 说明 |
| --- | --- |
| `isReadyForMoreMediaData` | encoder 可继续接收采样且不阻塞时为 `true`。 |
| `markAsFinished()` | 在 `writer.finishWriting()` 之前调用。 |
| `appendVideoFrame(image, presentationTime): boolean` | input 已满或已结束时返回 `false`,需 `await whenReady()` 后重试。 |
| `appendPCMSamples(samples, sampleRate, channels, presentationTime): boolean` | 交错 Float32;`samples.length === frameCount * channels`。 |
| `whenReady(): Promise<void>` | `isReadyForMoreMediaData` 变为 `true` 时 resolve。 |
