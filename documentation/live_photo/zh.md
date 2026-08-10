把手上已有的普通视频——录屏、相册里导出的片段、下载来的短片——变成系统照片库里真正的实况照片。

```ts
const pair = await LivePhoto.createFromVideo({ videoPath })

await Photos.saveLivePhoto({
  imagePath: pair.imagePath,
  videoPath: pair.videoPath,
})
```

整个流程就这些。下面的内容只在你想控制结果时才需要。

## 为什么随便一张图配一段视频不行

实况照片不是「一张 JPEG 挨着一个 MP4」。照片库只有在下面三件事对上时才认这一对文件：

1. 静态图的 Apple Maker Note 里带着实况照片的 **asset identifier**；
2. 视频的 content identifier 与之**完全相同**；
3. 视频里有一条 **still-image-time** 元数据轨,标记哪一刻是封面帧。

用 `AVAsset` 抽一帧、再用 `UIImage.toJPEGData()` 重新编码,然后把两个文件交给 `Photos.saveLivePhoto`——结果是报 **`PHPhotosErrorDomain 3302`**,因为解码后的位图没有 identifier,普通 `.mp4` 也没有那条元数据轨。

`LivePhoto.createFromVideo` 会替你把这三件事全部写好,你不需要碰任何元数据。

## 选择封面帧

静态图就是这张实况照片在相册里「静止时」显示的那一帧。默认取源视频的中点,想换一刻就传 `stillTime`(单位秒,相对源视频起点):

```ts
const pair = await LivePhoto.createFromVideo({
  videoPath,
  stillTime: 4.5,
})
```

保留下来的视频片段会以这一刻为中心。超出视频范围的值会被钳定而不是报错,所以传一个大致的估计值也是安全的。

## 时长

实况照片通常都很短。`maxDuration` 默认 10 秒——更长的源视频会围绕 `stillTime` 裁出一个窗口:

```ts
// 以封面帧为中心的 3 秒片段,接近相机直接拍出来的实况照片
const pair = await LivePhoto.createFromVideo({
  videoPath,
  stillTime: 4.5,
  maxDuration: 3,
})

console.log(pair.duration)   // ≈ 3
console.log(pair.stillTime)  // ≈ 1.5 —— 此时是相对**输出**视频的时间
```

注意传入的 `stillTime` 相对源视频,返回的 `stillTime` 相对裁剪后的输出视频。

除了源视频本身的长度之外没有其它上限。想要更长、或者整段都要:

```ts
const pair = await LivePhoto.createFromVideo({
  videoPath,
  maxDuration: Infinity,   // 保留整段视频
})
```

转换阶段的时长成本几乎可以忽略——视频轨是直接复制而不是重新编码,60 秒的片段主要就是文件 I/O。但有两点要留意:再长的实况照片在照片库里也只是一个条目,却要占掉整段视频的空间;而超长实况照片的播放行为由 iOS 决定。真正会因为时长变慢的只有少见的重编码回落路径——在意的话看返回值里的 `reencoded`。

## 输出文件

不指定路径时两个文件都写在临时目录,返回值里的路径永远是实际写入的位置:

```ts
const base = FileManager.documentsDirectory
const pair = await LivePhoto.createFromVideo({
  videoPath,
  imageOutputPath: `${base}/cover.heic`,
  videoOutputPath: `${base}/clip.mov`,   // 必须以 .mov 结尾
  imageFormat: "heic",
  quality: 0.85,
})
```

配对视频**必须**是 `.mov`:照片库不接受 `.mp4` 作为配对视频,所以非 `.mov` 的输出路径会被提前拒绝。静态图可以是 `"jpeg"`(默认)或 `"heic"`。

不想把原声带进实况照片,传 `includeAudio: false`。

## 返回值

```ts
{
  imagePath: string        // 这两个路径直接喂给 Photos.saveLivePhoto
  videoPath: string
  assetIdentifier: string  // 静态图与视频共享的 identifier
  duration: number         // 配对视频时长(秒)
  stillTime: number        // 封面时刻,相对输出视频
  width: number            // 静态图像素尺寸
  height: number
  reencoded: boolean
}
```

`reencoded` 对绝大多数视频都是 `false`:原视频轨会被原样复制过去,又快又无损。只有当源编码放不进 QuickTime 容器、不得不重新编码时才会变成 `true`——更慢,且有轻微质量损失。

## 方向

旋转已经处理好了。竖拍视频在配对视频里保持原方向,静态图也会以旋转后的方向写出,封面和播放画面不会对不上。

## 错误

以下情况 Promise 会带着可读的错误信息被拒绝:

* 源文件不存在,或不是媒体文件;
* 源文件没有视频轨(例如纯音频文件);
* 视频输出路径不是 `.mov`,或所在目录不存在;
* 视频没有可播放的时长。

不会留下半成品——视频写失败时,静态图也会被一并清理。

## 存入照片库

`Photos.saveLivePhoto` 会把两个文件复制进照片库。只有在你确定不再需要这两个文件时才传 `shouldMoveFile: true`,因为它是移走而不是复制:

```ts
await Photos.saveLivePhoto({
  imagePath: pair.imagePath,
  videoPath: pair.videoPath,
  shouldMoveFile: true,   // 调用后这两个文件就不在原处了
})
```

## 查看 identifier

如果你想确认(或排查配对问题),identifier 可以通过 `ImageIO` 读出来:

```ts
const meta = await ImageIO.readMetadata(pair.imagePath)
console.log(meta.makerApple?.["17"])   // === pair.assetIdentifier
```

你也可以自己指定 identifier(例如想用同一身份重建一对资源),但它**必须是 UUID 字符串**。静态图里存放它的字段是定长的,更短的值会被填充,结果就与视频对不上;非 UUID 的值会被直接拒绝,而不是悄悄产出一对照片库不认的文件。

```ts
const pair = await LivePhoto.createFromVideo({
  videoPath,
  assetIdentifier: "9F1C3A54-1234-4C6E-9A0B-3E2D1F0A5B7C",
})
```

## 相关内容

* **Live Photo 拍摄**——如果素材来自相机,`AVCapturePhotoOutput` 可以直接拍出实况照片,见 AVCaptureSession 下的 *Live Photo* 一页,这种情况不需要 `createFromVideo`。
* **LivePhotoView**——在界面里展示结果。
* **ImageIO**——读写图片元数据,包括 `makerApple`。
