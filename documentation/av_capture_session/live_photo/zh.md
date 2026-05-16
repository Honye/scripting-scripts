Live Photo 是一张照片 + 拍照前后短短一段 `.mov`。`AVCapturePhotoOutput` 让你**按次**决定要不要拍——在 `capturePhoto` 时传 `livePhotoMovieFile`,resolve 出来同时包含静态图和 movie 文件路径。

## 前置条件

* `isLivePhotoCaptureSupported === true`(所有有相机的 iPhone 都满足)。
* 一次性把开关打开: `photoOutput.isLivePhotoCaptureEnabled = true`。不支持的设备 setter 会静默 clamp 回 `false`,简单方法是写完再读一次确认。
* 调 `capturePhoto({ livePhotoMovieFile, ... })` 时 `isLivePhotoCaptureEnabled` 必须是 `true`,否则 promise **立即 reject** 而不是退化成普通拍照。
* **不要**同时开 `isAutoDeferredPhotoDeliveryEnabled`。deferred 开启后系统可能不产 `.mov`,resolve 出来的 `livePhotoMovieFileURL` 会缺失。

## 接线

```ts
const camera = AVCaptureDevice.default("video")!
const session = new AVCaptureSession()
const photoOutput = new AVCapturePhotoOutput()

session.configure(() => {
  session.sessionPreset = "photo"
  session.addInput(new AVCaptureDeviceInput(camera))
  session.addOutput(photoOutput)
})

// 一次性配置,跨多次 capturePhoto 都生效。
photoOutput.isLivePhotoCaptureEnabled = true

await session.startRunning()

const ts = Date.now()
const photoFile = `${FileManager.documentsDirectory}/live_${ts}.heic`
const movieFile = `${FileManager.documentsDirectory}/live_${ts}.mov`

const result = await photoOutput.capturePhoto({
  codec: "hevc",
  photoFile,                 // ← 后面要存进系统照片库的话, 必传
  livePhotoMovieFile: movieFile,
  livePhotoVideoCodec: "hevc",
})

console.log("photo:", result.image.width, "×", result.image.height)
console.log("still file:", result.photoFileURL)
console.log("movie:", result.livePhotoMovieFileURL)
```

Resolve 出的对象除了标准的 `image / metadata / isRawPhoto / isDeferredProxy`,多 `photoFileURL: string`(传了 `photoFile` 时)和 `livePhotoMovieFileURL: string`(传了 `livePhotoMovieFile` 时)。没要 Live Photo,`.mov` 字段不出现。

### 为什么 Live Photo 必须用 `photoFile`

`capturePhoto` 总会给你 `result.image: UIImage` —— 但 `UIImage` 是已经解码的位图,**没有**原始 metadata。把 Live Photo 存进系统照片库时,`Photos.saveLivePhoto(...)` 内部走 PhotoKit,PhotoKit 会校验 still 和 `.mov` 共享一个 Live Photo asset identifier(写在 still 的 Apple Maker Note key 17、`.mov` 的 `com.apple.quicktime.content.identifier`)。用 `image.toJPEGData()` 重编码出的 JPEG **没有**这个 identifier,PhotoKit 会拒绝配对并报 **`PHPhotosErrorDomain 3302`**。

`photoFile` 选项让 bridge 把 `photo.fileDataRepresentation()` 原始 bytes 直接写到磁盘,Maker Note 完整保留。把 `result.photoFileURL` 喂给 `Photos.saveLivePhoto({ imagePath, videoPath })`,配对就通了。

## resolve 实际在等什么

Live Photo 触发两路并行 AVFoundation 回调:一路给静态图、一路给 `.mov`。bridge 等**两路都到齐**才 resolve——保证拿到完整一对,或者拿到错误。AVFoundation 不保证两者的回调顺序,所以**别用文件时间戳推断顺序**。

系统会在最后跑一个"capture finish"统一收尾。如果中途某一路出问题(比如 `.mov` 被丢),bridge 会用已到达的部分兜底 resolve,不会把 promise 吊死。

## 路径规则

* 必须传**绝对路径**,以 `.mov` 结尾。`${FileManager.documentsDirectory}/...` 是最常用的可写位置。
* AVFoundation 拒绝向已存在的路径写。bridge 在拍照前**自动删除**目标路径的旧文件,免得你手动 cleanup。
* `.mov` 不大(1.5 秒大约 2–4 MB)。连拍场景请自己清理旧文件。

## 编码选择

`livePhotoVideoCodec` 可选:

* `"hevc"` — iPhone 7 起的设备首选,文件更小。
* `"h264"` — 兼容性更好(老系统、部分剪辑工具)。

如果传了设备不在 `availableLivePhotoVideoCodecTypes` 列表里的 codec,bridge 让 AVFoundation 自己挑默认,不会让 capture 整个失败。需要确认实际写入了什么,用 `AVAsset` 打开读 track 信息即可。

## 注意

* Live Photo + `flashMode = "on"` 可以用,但拍下来的 `.mov` 会带闪光闪烁,设计时考虑。
* 你拿到的 `.mov` 跟 Photos.app 拍下来的一样,会有快门前后短短一段预滚 / 后滚。
* `capturePhoto` 只把文件写到磁盘,**不会**自动入系统照片库。要把图 + clip 作为关联 Live Photo 存进 Photos(像 Camera.app 那样),用 [`Photos.saveLivePhoto`](#):

  ```ts
  await Photos.saveLivePhoto({
    imagePath: result.photoFileURL!,           // 用 photoFile 选项写盘的原始 HEIC
    videoPath: result.livePhotoMovieFileURL!,  // livePhotoMovieFile 选项写盘的 .mov
    shouldMoveFile: true,                      // 两个文件 move 进 Photos,而不是 copy
  })
  ```

  这会把两份资源配对成一个 PHAsset,Photos.app 长按会有 "Live" 动画。首次调用时系统自动弹照片库权限授权。**千万不要**把 `result.photoFileURL` 换成 `result.image.toJPEGData()` 写盘的结果 —— 重编码出的 JPEG 没有 Live Photo asset identifier, PhotoKit 会拒绝配对。
