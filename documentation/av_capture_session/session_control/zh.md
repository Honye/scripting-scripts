以下是三个小但重要的控制点：

* 点击对焦 / 点击测光（focus / exposure point of interest）
* 会话中断通知（来电、被别的 App 抢相机、系统降温）
* 录像的视频稳定化

都属于 device / connection 层的设置，不影响 input / output 怎么挂。

---

## 点击对焦 / 点击测光

`AVCaptureDevice` 暴露了一个 focus point 和一个 exposure point，都是 **传感器坐标系** 0..1 归一化（**不是** preview 视图坐标系），`(0, 0)` 在传感器**横向放置时的左上角**。常见做法是把 preview 上的点击位置算成归一化的传感器坐标后，同时写焦点和曝光点：

```ts
const camera = AVCaptureDevice.default("video")!

// 用户点击 preview 时,把点击位置换算成归一化传感器坐标
// (preview 层在 native 侧能直接帮你换算;在 JS 侧通常布局完算一次缓存)
function tap(at: { x: number; y: number }) {
  if (camera.isFocusPointOfInterestSupported) {
    camera.setFocusPointOfInterest(at)
    camera.setFocusMode("autoFocus")          // 在该点跑一次 AF
  }
  if (camera.isExposurePointOfInterestSupported) {
    camera.setExposurePointOfInterest(at)
    camera.setExposureMode("continuousAutoExposure")
  }
}
```

注意点：

* 不支持 POI 的设备上 `setFocusPointOfInterest` / `setExposurePointOfInterest` 是 silent no-op;想给用户反馈的话用 `is*Supported` 提前判断。
* 这两个 setter 内部已经拿了配置锁,不需要你自己包 `lockForConfiguration()`。
* 只设 point **不会**触发对焦,还要配合 focus / exposure mode 切换(`autoFocus` 单次、`continuousAutoFocus` 跟踪)。

---

## 会话中断

iOS 会在某些情况下把相机硬件从你手里抢走:来电、另一个 App 在多任务前台用相机、FaceTime 占用前置、设备热降频。session 不会停,但被挂起——预览会卡住,直到 iOS 把硬件还回来。

订阅这两个事件:

```ts
session.addInterruptionListener((event, reason) => {
  if (event === "began") {
    // 显示 "相机暂时不可用" 蒙层
    console.log("被中断:", reason)
  } else {
    // 蒙层去掉, session 会自己恢复
    console.log("中断结束")
  }
})
```

`reason` 是以下之一:

| reason | 触发时机 |
|---|---|
| `videoDeviceNotAvailableInBackground` | App 进了后台 |
| `audioDeviceInUseByAnotherClient` | 麦克风被别的 App 占用(比如来电) |
| `videoDeviceInUseByAnotherClient` | 摄像头被别的 App 占用(比如 FaceTime) |
| `videoDeviceNotAvailableWithMultipleForegroundApps` | iPad 分屏抢走了摄像头 |
| `videoDeviceNotAvailableDueToSystemPressure` | 设备过热或资源紧张 |
| `sensitiveContentMitigationActivated` | 敏感内容屏蔽生效 |
| `unknown` | 新版 iOS 加的、当前 build 不认识的原因 |

`event === "ended"` 时 reason 一律是空字符串——结束没有"原因"。

中断结束后**不需要**重新 `startRunning()`,session 会自动恢复。

---

## 视频稳定化

系统可以在录像上应用光学/传感器稳定化。你在 movie output 的视频连接上设置一个**期望**模式,系统结合 active format 和设备能力**决定**实际激活哪个。要知道实际开了什么,读回 active 模式即可。

```ts
const movieOutput = new AVCaptureMovieFileOutput()
session.addOutput(movieOutput)

// 录像前设好
movieOutput.setVideoStabilizationMode("auto")

// startRunning() 之后, 这里反映系统实际激活的模式:
console.log("active stabilization:", movieOutput.videoStabilizationMode)
```

| 模式 | 说明 |
|---|---|
| `off` | 不开。 |
| `standard` | 保守模式,通用默认值。 |
| `cinematic` | 裁切更多、画面更稳,处理代价更高。 |
| `cinematicExtended` | 裁切更多、专为手持步行场景。 |
| `auto` | 系统根据运动和光照自选。 |

要点:

* 稳定化作用在 **connection** 上,不是 session。换 device input 或重建连接都要重新设置。
* 还没 `addOutput` 到 session 时,movieOutput 没有 video connection,`setVideoStabilizationMode("...")` 返回 `false`。所以**先 addOutput,再设模式**。
* 只有 mode 字符串拼错才会抛错。
* `videoStabilizationMode` 读出的是 **active** 而非 requested。当前 format 不支持时系统会静默降级或关掉。

## 暂停 / 恢复与录制进度

录像可以暂停后恢复,不会另起新文件。两个调用在状态不对时、以及 iOS 18 以下(此时 `isRecordingPaused` 恒为 `false`)都是安全 no-op。

```ts
await movieOutput.startRecording(filePath)

movieOutput.pauseRecording()
console.log(movieOutput.isRecordingPaused)   // true
movieOutput.resumeRecording()

// 录制中的实时进度:
console.log("秒:", movieOutput.recordedDuration)
console.log("字节:", movieOutput.recordedFileSize)

const path = await movieOutput.stopRecording()  // startRecording 返回的 promise 在此 resolve
```

`recordedDuration`(秒)和 `recordedFileSize`(字节)反映当前这次录制,未录制时返回 `0`。`availableVideoCodecTypes` 列出可录制的 codec(native rawValue,如 `"hvc1"` / `"avc1"`)。
