Scripting 提供两套有意重叠的相机 API,按你要解决的问题选合适的那个。

## 一句话决策

| 你想要... | 用 |
| --- | --- |
| 按一下录制 → 保存 mp4 | `VideoRecorder` |
| 单个文件里暂停/恢复 | `VideoRecorder` |
| 内置音频会话/方向/编码器/文件管理 | `VideoRecorder` |
| 实时扫 QR / 条形码 | `AVCaptureSession` + `AVCaptureMetadataOutput` |
| 自定义拍照(HEVC、闪光灯、Live Photo) | `AVCaptureSession` + `AVCapturePhotoOutput` |
| 绑定 iPhone 16 Camera Control 滑块/选择器 | `AVCaptureSession` + `AVCaptureControl` |
| 同一 session 多输出(拍照+录像+metadata) | `AVCaptureSession` |
| 拿原始 `CMSampleBuffer` / `CVPixelBuffer`(规划中) | `AVCaptureSession` |

## 关键差异

`VideoRecorder` 是有状态的单例。它内部维护一个 capture session、一个 writer、一个音频会话和严格的状态机(`idle → preparing → ready → recording → ...`)。绝大多数 App 要的就是这个。代价:不能并行跑两段、不能加额外输出、不能中途改流水线。

`AVCaptureSession` 就是纯 AVFoundation。每个实例独立。你可以同时存在多个,但 iOS 同一时刻只允许一个真正访问相机。

`VideoRecorder` 在录的同时再 `startRunning()` 一个 `AVCaptureSession`(反之亦然),后启动的那个会抛 runtime error。在 UI 里就把这两个用法做成互斥——通常在进入页面前决定走哪一套即可。

## 已有 VideoRecorder 是否要迁移

大多数情况不用。下列情况建议迁移:

* 你正绕过 `VideoRecorder.session` 直接拼 AVFoundation 在用。
* 你想要 `recording` 和 `paused` 跨多个文件来回切(超出现有状态机)。
* 你需要 `AVCaptureMetadataOutput`(边录边扫码)。

迁移按特性逐个改:用 `AVCaptureDevice` 选设备 → `AVCaptureDeviceInput` 包成输入 → `AVCaptureMovieFileOutput` 录像,把 state-listener 换成 promise 链。完整模板见 `快速开始`。

## 两者并存

`VideoRecorder.idle` 时可以临时跑 `AVCaptureSession`。注意:

1. 同一脚本前面用过 `VideoRecorder` 的话,先 `await VideoRecorder.reset()`。
2. 离开页面前 `await session.stopRunning(); session.dispose()`,把硬件释放回去。
