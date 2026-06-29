`AVCaptureSession` 是 Scripting 中相机/麦克风采集的底层基础。它就是 `VideoRecorder` 内部使用的同一套 API，只是以离散、可组合的对象形式暴露出来：你自己挑设备、加输入输出、起停会话、响应 iPhone 16 的硬件 Camera Control。

如果你只想"按一下按钮录一段 mp4"，请用 [`VideoRecorder`](#)——它已经为你管好了状态机、音频会话、方向、暂停/恢复时间线。下列场景才适合直接使用 `AVCaptureSession`：

* 视频预览的同时扫 QR / 条形码
* 自定义拍照（HEVC、闪光灯模式、Live Photo）
* `VideoRecorder` 状态机不能覆盖的自定义录制流程
* iPhone 16 Camera Control 自定义控件（缩放滑块、曝光滑块、自定义 Slider/Picker）
* 同时挂多个输出（例如同时拍照 + 录像）

`startRunning()` / `capturePhoto()` / `startRecording()` 需要 PRO 权限。构造、配置、`canAdd*` 这类查询不收费。

---

## 流水线一览

```ts
const session = new AVCaptureSession()
const camera = AVCaptureDevice.default("video")!
const input = new AVCaptureDeviceInput(camera)

session.configure(() => {
  session.sessionPreset = "photo"
  if (session.canAddInput(input)) session.addInput(input)
})

await session.startRunning()
// ... 使用 session ...
await session.stopRunning()
session.dispose()
```

---

## 权限

不需要自己申请相机/麦克风权限。`session.startRunning()` 会扫描你挂的 inputs,首次启动时弹系统授权弹窗,被拒绝就直接 reject Promise。和其他 Scripting API(Photos / Contacts / Location)一致——调用入口就是权限门槛。

```ts
try {
  await session.startRunning()
} catch (e) {
  // 相机(若挂了 audio input 还包括麦克风)被拒绝、受限或不可用
}
```

---

## 选设备

最简单：`AVCaptureDevice.default(mediaType)`。指定镜头/位置用 `defaultDevice(...)` 或 `discoverySession(...)`：

```ts
// 后置广角，硬件不存在时返回 null
const back = AVCaptureDevice.defaultDevice(
  "builtInWideAngleCamera", "video", "back"
)

// 列出当前机型实际可用的镜头
const ds = AVCaptureDevice.discoverySession({
  deviceTypes: [
    "builtInWideAngleCamera",
    "builtInUltraWideCamera",
    "builtInTelephotoCamera",
  ],
  mediaType: "video",
  position: "back",
})
console.log(ds.devices.map(d => d.localizedName))
```

---

## 加输入和输出

把设备包成 `AVCaptureDeviceInput`（设备被占用或权限不足时构造器会抛错），然后加输出。`session.configure(...)` 会自动包一对 `beginConfiguration()` / `commitConfiguration()`，多次改动用它包起来更稳。

```ts
const input = new AVCaptureDeviceInput(AVCaptureDevice.default("video")!)

const photoOutput = new AVCapturePhotoOutput()
photoOutput.maxPhotoQualityPrioritization = "quality"

session.configure(() => {
  if (session.canAddInput(input)) session.addInput(input)
  if (session.canAddOutput(photoOutput)) session.addOutput(photoOutput)
})
```

> `addInput` / `addOutput` 也可以直接调，不一定非要在 `configure(...)` 里。但每次单独改动都会派一次队列任务，能合并就合并。

---

## 拍照

```ts
await session.startRunning()
const result = await photoOutput.capturePhoto({ codec: "hevc", flashMode: "auto" })
console.log("拍到了", result.image.size, result.metadata)
```

resolve 出来的对象包含 `image: UIImage`、`metadata: Record<string, any>`、`isRawPhoto: boolean`。

---

## 录像

```ts
const movieOutput = new AVCaptureMovieFileOutput()
movieOutput.maxRecordedDuration = 60   // 秒;0 表示不限
session.addOutput(movieOutput)

await session.startRunning()
const path = `${FileManager.documentsDirectory}/clip.mov`
const finalPath = await movieOutput.startRecording(path)  // stopRecording 收尾后才 resolve
// ... 等用户点击停止 ...
await movieOutput.stopRecording()
console.log("已保存", finalPath)
```

`startRecording` 会一直等到文件 finalize 完成才 resolve；resolve 之前不要去删那个文件。

---

## QR / 条形码扫描

`AVCaptureMetadataOutput` 会用系统的检测器跑实时帧。

```ts
const metaOutput = new AVCaptureMetadataOutput()
session.configure(() => {
  if (session.canAddInput(input)) session.addInput(input)
  if (session.canAddOutput(metaOutput)) session.addOutput(metaOutput)
})

// 顺序很重要——types 必须在 output 加入 session 之后再设。
metaOutput.metadataObjectTypes = ["qr", "ean13", "code128"]
metaOutput.setMetadataObjectsListener(objects => {
  for (const o of objects) {
    if (o.stringValue) console.log("扫到", o.type, o.stringValue)
  }
})

await session.startRunning()
```

设 `rectOfInterest = { x, y, width, height }`（归一化 0..1）可以限定扫描区域。

每个检测对象都带原始 `bounds`（归一化 0..1）；码类对象还带原始 `corners`。另有一个 `transformed` 字段，其 `bounds` / `corners` 已按连接的方向与镜像做过校正——在预览上画高亮框时用它：

```ts
metaOutput.setMetadataObjectsListener(objects => {
  for (const o of objects) {
    const box = o.transformed?.bounds ?? o.bounds   // {x,y,width,height}，0..1
    // 把 box 映射到你视图的像素矩形再绘制高亮
  }
})
```

要在某个 output 自身坐标空间与 metadata 输出的归一化空间之间转换矩形，用 `output.metadataOutputRectConverted({ x, y, width, height })` 及其逆向 `output.outputRectConverted(...)`。两者在所有 output 上都可用，返回 `{ x, y, width, height }`。

---

## 预览

在 Scripting 视图层里使用 `<CaptureVideoPreviewView session={session} videoDevice={camera}/>`。完整 prop 列表见 `预览视图`。

---

## 清理

用完之后——通常是在组件 `onDisappear` 或离开页面前——停掉并 dispose：

```ts
await session.stopRunning()
session.dispose()
```

`dispose()` 是幂等的。忘记调也不会泄漏，脚本结束时 wrapper 会被释放。

---

## 完整示例

```ts
const camera = AVCaptureDevice.default("video")!
const session = new AVCaptureSession()
const input = new AVCaptureDeviceInput(camera)
const photoOutput = new AVCapturePhotoOutput()

session.configure(() => {
  session.sessionPreset = "photo"
  if (session.canAddInput(input)) session.addInput(input)
  if (session.canAddOutput(photoOutput)) session.addOutput(photoOutput)
})

session.addRuntimeErrorListener(msg => console.error("session error:", msg))

await session.startRunning()
const photo = await photoOutput.capturePhoto({ codec: "hevc" })
await session.stopRunning()
session.dispose()
```
