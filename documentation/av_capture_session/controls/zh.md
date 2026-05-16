iOS 18 引入了 **Camera Control**——iPhone 16 及以上机型上专门的硬件按键（其它设备上是屏幕侧拉控件），让用户不进入你的 UI 也能调拍摄参数。AVFoundation 把它建模为挂在运行中的 `AVCaptureSession` 上的一组 `AVCaptureControl`。Scripting 把它们都桥过来了。

## 能力探测

硬件 Camera Control 仅 iPhone 16 起才有。先做特性检测：

```ts
if (!session.supportsControls) {
  // 走纯屏幕 UI;不要调 addControl / setControlsDelegate。
  return
}
console.log(`最多可添加 ${session.maxControlsCount} 个控件`)
```

老机型上 `session.supportsControls` 是安全的——Scripting 用 `respondsToSelector` 包了一层，返回 `false` 而不是崩溃。

## 系统控件

最常用的两个由系统提供，传入要绑定的设备即可：

```ts
const camera = AVCaptureDevice.default("video")!
const zoom = new AVCaptureSystemZoomSlider(camera, value => {
  console.log("缩放 →", value)
})
const exposure = new AVCaptureSystemExposureBiasSlider(camera, value => {
  console.log("曝光偏置 →", value)
})

session.configure(() => {
  if (session.canAddControl(zoom)) session.addControl(zoom)
  if (session.canAddControl(exposure)) session.addControl(exposure)
})
```

系统会自动把缩放/曝光偏置写回设备。回调只是告知，让你同步刷新自己的 UI。

## 自定义滑块

支持连续、定步长、显式离散值：

```ts
// 连续,显示成 ƒ-stops
const aperture = new AVCaptureSlider("光圈", "camera.aperture", {
  range: [1.2, 16],
  defaultValue: 1.8,
  localizedValueFormat: "ƒ%.1f",
})

// 定步长
const evStep = new AVCaptureSlider("EV", "sun.max", {
  range: [-2, 2],
  step: 0.33,
  prominentValues: [-1, 0, 1],
})

// 显式离散值
const iso = new AVCaptureSlider("ISO", "circle.fill", {
  values: [50, 100, 200, 400, 800, 1600, 3200],
  defaultValue: 200,
  localizedValueFormat: "ISO %.0f",
})

aperture.setActionHandler(value => updateAperture(value))
```

`symbolName` 可以传任何 [SF Symbols](https://developer.apple.com/sf-symbols/) 名称,Scripting 不做校验。运行时找不到这个符号,控件就不显示图标。

## 自定义 Index Picker

标签不是数字或不等距时用这个：

```ts
const wb = new AVCaptureIndexPicker("白平衡", "camera.filters", {
  localizedIndexTitles: ["自动", "日光", "阴天", "白炽灯"],
  defaultIndex: 0,
})
wb.setActionHandler(index => applyWhiteBalance(index))
```

## 把控件挂上 session

`addControl(...)` 和 input/output 一样,推荐用 `configure(...)` 包起来一次性提交。超过 `maxControlsCount` 时 `canAddControl` 直接返回 `false`,`addControl` 会被吞掉。

```ts
session.configure(() => {
  if (session.canAddControl(zoom)) session.addControl(zoom)
  if (session.canAddControl(aperture)) session.addControl(aperture)
  if (session.canAddControl(wb)) session.addControl(wb)
})
```

## 监听显示/隐藏事件

`AVCaptureSessionControlsDelegate` 告诉你系统 Camera Control 何时弹出/收起,方便在它出现时把自定义 overlay 调暗:

```ts
session.setControlsDelegate({
  didBecomeActive: () => setSystemControlVisible(true),
  willEnterFullscreenAppearance: () => setOverlayDimmed(true),
  willExitFullscreenAppearance: () => setOverlayDimmed(false),
  didBecomeInactive: () => setSystemControlVisible(false),
})
```

传 `null` 取消监听。

## 让硬件按键触发拍照

硬件 Camera Control **不会**默认走你的 controls delegate——必须挂一个 `AVCaptureEventInteraction`。不挂的话,半按和全按都会被静默吞掉:

```ts
const interaction = new AVCaptureEventInteraction((phase, kind) => {
  if (phase === "ended" && kind === "primary") {
    photoOutput.capturePhoto({ codec: "hevc" })
  }
})
interaction.attach()

// 离开页面时:
interaction.detach()
```

`phase` 取值 `"began" | "ended" | "cancelled"`;`kind` 中 `"primary"` 是全按,`"secondary"` 是半按/对焦事件。

## 常见坑

* **delegate 不触发。** 没调 `setControlsDelegate(...)`,或者 session 还没 startRunning。
* **硬件按键没反应。** 没 `new AVCaptureEventInteraction(...).attach()`。
* **`supportsControls === false`。** 要么机型不支持,要么 session 还没配完——把检测放在 `addInput(...)` 之后。
* **自定义控件不显示。** 要么 SF Symbol 名错,要么超过 `maxControlsCount`——这两种情况 Scripting 都会静默吞掉 `addControl`。
