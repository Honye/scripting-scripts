`AVCapturePhotoOutput` 上一组改变 capture pipeline 在两次拍照之间行为的开关。这一族开关**不影响照片画质**——它们改变的是"下一张能多快开始"和"当前这张多快能拿到一张可用的图"。

---

## `isZeroShutterLagEnabled`

维护一段最近帧的环形缓冲,按快门时取的是**按下那一刻之前**的帧而不是之后。最有用的场景是抓拍——孩子、宠物、运动。

* 在支持的设备(iPhone XS / XR 及以上)上默认是 `true`。
* 想严格抓"按下那一刻的帧"才设 `false`(很罕见)。

```ts
if (photoOutput.isZeroShutterLagSupported) {
  photoOutput.isZeroShutterLagEnabled = true
}
```

---

## `isResponsiveCaptureEnabled` + `isFastCapturePrioritizationEnabled`

这两个是**一对**。开了之后, pipeline 会在后台继续处理上一张照片,用户可以**马上**继续点快门。

**顺序有讲究**。Apple 把 `isFastCapturePrioritizationSupported` 设为依赖 `isResponsiveCaptureEnabled = true`(加上 `maxPhotoQualityPrioritization = "quality"`)。也就是说**先开 responsive,fast 才会变成 supported**。

```ts
photoOutput.maxPhotoQualityPrioritization = "quality"

if (photoOutput.isResponsiveCaptureSupported) {
  photoOutput.isResponsiveCaptureEnabled = true
}
// 上一行跑完后 fastSupp 才会变 true
if (photoOutput.isFastCapturePrioritizationSupported) {
  photoOutput.isFastCapturePrioritizationEnabled = true
}
```

如果在 JS 里写反了顺序,bridge 会兜底:`fast = true` 时会自动先开 responsive(如果支持);`responsive = false` 时会先关 fast。所以下面这样也行:

```ts
photoOutput.isFastCapturePrioritizationEnabled = true   // responsive 会被自动打开
```

如果 responsive 已经开了但 `fastSupp` 仍然是 `false`,那就是当前 active format / preset 不允许 fast,bridge 会静默忽略。常见原因:`maxPhotoQualityPrioritization` 不是 `"quality"`、`isLivePhotoCaptureEnabled = true`、或者 session preset 不是 `photo`。

---

## `isAutoDeferredPhotoDeliveryEnabled`(请仔细读)

延迟图像处理(Deferred Photo Delivery)让你**立即**可以再次按快门,不必等上一张照片完整跑完处理流水线(Deep Fusion / Photonic Engine / Smart HDR)。Apple 的做法是当场给你一张"proxy",真正的最终图在后台异步生成。

问题是——本节比其他节明显长的原因——**最终图永远不会通过 `capturePhoto()` 回到你的代码**。

### 你实际拿到的是什么

当 deferred 触发, `capturePhoto()` resolve 出的是:

```ts
{
  image: UIImage,         // ← 这是 PROXY,不是最终图
  metadata: {...},
  isRawPhoto: false,
  isDeferredProxy: true,
}
```

`image` 是**未完成处理**的中间帧:一张系统能在毫秒内出的快速渲染。视觉上比最终图噪点更多、细节更糊、动态范围更弱。展示"刚刚拍到了什么"的缩略图够用,**但绝不是你要保留的成品**。

最终图由系统自己在后台完成——通常几秒,设备繁忙或 App 进入后台时会更久——然后**直接写到用户的 Photo Library**。**不会**有任何 callback 回到你的 App。

### 那怎么拿最终图?

走 PhotoKit。proxy resolve 后,查用户 Photo Library 里最近一张图:

```ts
photoOutput.isAutoDeferredPhotoDeliveryEnabled = true

const result = await photoOutput.capturePhoto()
if (result.isDeferredProxy) {
  // result.image 是 proxy, 拿来当缩略图展示
  showThumbnail(result.image)
  // 真正的最终图会自己出现在 Photo Library。
  // 你的脚本需要通过Photo.getLastestPhotos 或 Photo.pickPhotos 等API获取
}
```

### 什么时候**不**该开

如果脚本想**立刻**拿到照片字节(上传 / 处理 / 存文件),而且不想或不能要 Photo Library 权限,**就不要开 deferred**。默认行为(等最终图再 resolve)是大多数脚本要的。

适合开 deferred 的场景:

* 在做"快速连拍"的 UI,每张需要立即视觉反馈
* 反正照片就是要存进 Photo Library
* 宁可现在给一张差点的预览,也不要 spinner

---

## 检测 cheat sheet

| Flag | Min 机型 |
|---|---|
| `isZeroShutterLagEnabled` | iPhone XS / XR+ |
| `isResponsiveCaptureEnabled` | iPhone 12+(因镜头而异) |
| `isFastCapturePrioritizationEnabled` | iPhone 12+ |
| `isAutoDeferredPhotoDeliveryEnabled` | iPhone 11 Pro+ |

