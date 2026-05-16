`AudioCapture` 基于 `AVAudioEngine` 接管麦克风输入，向脚本实时输出三类信号：
原始 PCM 采样、RMS / Peak 电平、以及基于 YIN 算法的音高（基频）估计。
适合用来实现调音器、实时波形、电平触发逻辑、自定义 DSP；同时支持把
采集到的音频写入 WAV 文件。

> `AudioRecorder` vs `AudioCapture`：
> - **`AudioRecorder`** 把录音编码后写文件（m4a / aac / flac / mp3 / opus），
>   只暴露 `onLevelUpdate` 电平回调。**最终落盘的录音用它**。
> - **`AudioCapture`** 暴露原始 PCM 波形、音高、电平回调，**做实时分析用它**。
>   也可以通过 `saveTo` 写一份未压缩的 wav 文件，因此在「无损录音」这一点
>   上是 `AudioRecorder` 的超集。
> - **不要同时使用两者**——它们会争抢同一个 input bus，可能导致音质退化或断流。

## 功能

- 实时 **PCM buffer** 回调（`Float32Array` 或 `Int16Array`）。
- 实时 **音高检测**（YIN 算法），并附带音名与音分偏移。
- 实时 **RMS / Peak 电平** 回调，触发频率可配置。
- 可选 **WAV 文件** 落盘（32-bit float，沿用硬件采样率）。

## 用法

### 设置 SharedAudioSession

`AudioCapture` 与 App 共用同一个音频会话，先激活：

```ts
await SharedAudioSession.setCategory(
  "playAndRecord",
  ["defaultToSpeaker"]
)
await SharedAudioSession.setActive(true)
```

### 创建 AudioCapture 实例

`create` 会请求麦克风权限并 resolve 出实例；权限被拒绝时 reject。

```ts
const capture = await AudioCapture.create({
  // 实际值由硬件决定，下面这些是 hint
  sampleRate: 44100,
  channels: 1,
  bufferSize: 1024,
  format: "float32",
  // 可选：同时把采集到的音频写到 wav 文件
  // saveTo: Path.join(FileManager.documentsDirectory, "capture.wav"),
})
```

### 监听 PCM buffer

```ts
capture.onBuffer = (frame) => {
  // frame.samples 是 Float32Array（或 Int16Array），长度 = frames * channels
  // 多声道时按 [L, R, L, R, ...] interleaved 存放
  console.log(
    `pcm frames=${frame.frames} ch=${frame.channels} ` +
    `sr=${frame.sampleRate} avg=${frame.level.averagePower.toFixed(1)} dB`
  )
}

// 默认 0 表示跟随硬件 tap 频率（1024 frames / 44.1 kHz 下约 43 Hz）
// 设置正数则节流；例如 30 表示每秒最多 30 个 buffer
capture.bufferEmitRate = 0
```

### 音高检测（调音器）

```ts
capture.pitchConfig = {
  minFrequency: 80,    // 低于 80 Hz 的低频干扰直接忽略
  maxFrequency: 1200,  // 高于 1200 Hz 也忽略
  threshold: 0.15,     // YIN 阈值；越小越严格，但容易漏检
  emitRate: 30,        // 30 Hz：约每 33ms 给一次结果
}

capture.onPitch = (frame) => {
  if (frame.frequency === 0) {
    // unvoiced：静音、噪声或复音，无法稳定锁频
    return
  }
  console.log(
    `${frame.note} ${frame.cents.toFixed(0)}¢  ` +
    `${frame.frequency.toFixed(2)} Hz (conf ${frame.confidence.toFixed(2)})`
  )
}
```

### 轻量电平表

只想画 VU 表时优先用 `onLevel`——它不会每帧创建 typed array。

```ts
capture.levelEmitRate = 30
capture.onLevel = (level) => {
  const norm = Math.max(0, (level.averagePower + 60) / 60)
  // norm 大致落在 [0, 1]，可以直接喂给 UI 进度条
}
```

### 启动 / 停止 / 释放

```ts
const ok = capture.start()
if (!ok) {
  console.error("AudioCapture 启动失败")
}

// 之后...
capture.stop()
capture.dispose()
```

`stop()` 关闭引擎并关闭 wav 文件（若有）。`dispose()` 还会清空 JS 回调；
不再使用时调用 `dispose()` 以及时释放资源。

### 错误处理

```ts
capture.onError = (message) => {
  console.error("AudioCapture 出错：", message)
}
```

## API 参考

### `AudioCapture.create(config?)`

请求麦克风权限并构造实例。
- **config.sampleRate** (number, 可选): 期望采样率（hint）。实际值由硬件决定，
  在 `start()` 之后通过 `sampleRate` 读取。默认 `44100`。
- **config.channels** (`1 | 2`, 可选): 期望声道数（hint）。默认 `1`。
- **config.bufferSize** (number, 可选): 每个 tap 的帧数，范围 `[256, 8192]`。
  默认 `1024`。
- **config.format** (`"float32" | "int16"`, 可选): `onBuffer.samples` 的样本格式。
  默认 `"float32"`。
- **config.saveTo** (string, 可选): 若设置，则把采集到的音频以 32-bit float
  WAV 格式写入该路径。

返回值：`Promise<AudioCapture>`。

### `AudioCapture.isRunning`
引擎是否在运行。

### `AudioCapture.sampleRate`
`start()` 之后由硬件决定的实际采样率。

### `AudioCapture.channels`
`start()` 之后由硬件决定的实际声道数。

### `AudioCapture.start()`
启动引擎。失败返回 `false`（无可用输入设备 / 会话冲突等，`onError` 也会触发）。

### `AudioCapture.stop()`
停止引擎并关闭 wav 文件（若有）。

### `AudioCapture.dispose()`
释放引擎、所有回调与 wav 文件。

### `AudioCapture.onBuffer`
PCM buffer 回调。每次调用都收到一份独立拷贝，可以放心保留。

### `AudioCapture.bufferEmitRate`
`onBuffer` 的触发频率，单位 Hz。`0` 表示跟随硬件 tap 频率。

### `AudioCapture.onPitch`
YIN 音高估计回调。`frequency === 0` 表示当前帧无法稳定识别基频。

### `AudioCapture.pitchConfig`
音高检测参数：`minFrequency`、`maxFrequency`、`threshold`、`emitRate`。

### `AudioCapture.onLevel`
仅 RMS / Peak 电平的回调（无 PCM payload），比 `onBuffer` 便宜。

### `AudioCapture.levelEmitRate`
`onLevel` 的触发频率，默认 `30` Hz。

### `AudioCapture.onError`
引擎启动失败或运行时错误回调。

## 示例：简单调音器

```ts
import { Path } from 'scripting'

async function run() {
  await SharedAudioSession.setActive(true)
  await SharedAudioSession.setCategory("playAndRecord", ["defaultToSpeaker"])

  const capture = await AudioCapture.create({
    sampleRate: 44100,
    channels: 1,
    format: "float32",
  })

  capture.pitchConfig = {
    minFrequency: 70,
    maxFrequency: 1200,
    threshold: 0.15,
    emitRate: 30,
  }

  capture.onPitch = (frame) => {
    if (frame.frequency > 0 && frame.confidence > 0.7) {
      console.log(
        `${frame.note}  ${frame.cents.toFixed(0)} cents  ` +
        `${frame.frequency.toFixed(2)} Hz`
      )
    }
  }

  capture.onError = (msg) => console.error(msg)

  if (!capture.start()) {
    console.error("启动失败")
    return
  }

  // 跑 30 秒后释放
  setTimeout(() => {
    capture.stop()
    capture.dispose()
  }, 30_000)
}

run()
```
