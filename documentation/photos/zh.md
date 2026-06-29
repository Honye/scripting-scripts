`Photos` 模块为 Scripting 提供了对系统相册与相机能力的统一访问接口，用于：

* 使用系统相机拍照或录制视频
* 从系统照片库中选择图片、视频或 Live Photo
* 获取最近拍摄的照片
* 将图片或视频保存到系统 Photos 应用
* 按媒体类型、相册、日期或收藏查询照片库,并读取丰富的元数据
* 从指定资源加载图片、原始数据、视频或 Live Photo
* 浏览、创建、删除相册;收藏或删除资源

所有 API 均基于 iOS 原生框架（Photos、PHPicker、UIImagePicker 等）封装，并遵循以下设计原则：

* 系统级权限管理
* Promise 异步接口
* 系统 UI 托管，不可自定义
* 媒体数据访问安全、受控

---

## CaptureInfo

```ts
type CaptureInfo = {
  cropRect: {
    x: number
    y: number
    width: number
    height: number
  } | null
  originalImage: UIImage | null
  editedImage: UIImage | null
  imagePath: string | null
  mediaMetadata: Record<string, any> | null
  mediaPath: string | null
  mediaType: string | null
}
```

`CaptureInfo` 描述了一次拍摄操作（照片或视频）的完整返回信息。

### 字段说明

* `cropRect`
  用户在编辑阶段应用的裁剪区域
  若未裁剪则为 `null`

* `originalImage`
  拍摄得到的原始图片（未编辑）

* `editedImage`
  用户编辑后的图片
  仅在 `allowsEditing` 启用且实际编辑后存在

* `imagePath`
  图片在磁盘中的文件路径

* `mediaMetadata`
  媒体的元数据，如 EXIF、方向信息等

* `mediaPath`
  视频文件在磁盘中的路径

* `mediaType`
  媒体的 UTType 字符串标识

---

## availableMediaTypes()

```ts
function availableMediaTypes(): string[] | null
```

返回当前设备相机支持的媒体类型（UTType 字符串数组）。

常用于：

* 判断设备是否支持视频拍摄
* 根据设备能力动态配置拍摄参数

当信息不可获取时返回 `null`。

---

## capture(options)

```ts
function capture(options: {
  mode: "photo" | "video"
  mediaTypes: UTType[]
  allowsEditing?: boolean
  cameraDevice?: "rear" | "front"
  cameraFlashMode?: "auto" | "on" | "off"
  videoMaximumDuration?: DurationInSeconds
  videoQuality?: 
    | "low"
    | "medium"
    | "high"
    | "640x480"
    | "iFrame960x540"
    | "iFrame1280x720"
}): Promise<CaptureInfo | null>
```

展示系统相机界面以进行拍照或视频录制。

### 参数说明

* `mode`
  拍摄模式

  * `"photo"`：拍照
  * `"video"`：录制视频

* `mediaTypes`
  允许拍摄的媒体类型（UTType 数组）

* `allowsEditing`
  是否允许用户在完成拍摄后编辑媒体

* `cameraDevice`
  使用的摄像头
  默认为 `"rear"`

* `cameraFlashMode`
  闪光灯模式
  默认为 `"auto"`

* `videoMaximumDuration`
  视频最长录制时长（秒）

* `videoQuality`
  视频分辨率与编码质量设置

### 行为说明

* 拍摄界面完全由系统管理
* Promise 在用户完成或取消操作后返回
* 权限请求由系统自动处理

---

## pick(options)

```ts
function pick(options?: {
  mode?: "default" | "compact"
  filter?: PHPickerFilter
  limit?: number
}): Promise<PHPickerResult[]>
```

展示系统照片选择器，用于从相册中选择媒体资源。

### 参数说明

* `mode`
  选择器布局模式

  * `default`：网格布局
  * `compact`：线性紧凑布局

* `filter`
  用于限制可选择资源类型的 `PHPickerFilter`

* `limit`
  最大选择数量
  默认为 `1`

### 返回值

返回 `PHPickerResult` 数组。
每个结果必须显式调用对应方法解析为具体资源。

---

## PHPickerFilter

`PHPickerFilter` 用于描述 **Photos.pick** 可选择的资源类型。
它是一个不可实例化的类，仅通过静态方法构建。

### 基础过滤器

* `PHPickerFilter.images()`
  仅允许选择普通图片

* `PHPickerFilter.videos()`
  仅允许选择视频

* `PHPickerFilter.livePhotos()`
  仅允许选择 Live Photo

* `PHPickerFilter.bursts()`
  连拍照片

* `PHPickerFilter.panoramas()`
  全景照片

* `PHPickerFilter.screenshots()`
  屏幕截图

* `PHPickerFilter.screenRecordings()`
  屏幕录制视频

* `PHPickerFilter.depthEffectPhotos()`
  含景深效果的照片（人像）

* `PHPickerFilter.cinematicVideos()`
  电影效果视频

* `PHPickerFilter.slomoVideos()`
  慢动作视频

* `PHPickerFilter.timelapseVideos()`
  延时摄影视频

---

### 组合过滤器

* `PHPickerFilter.all(filters)`
  同时满足所有过滤条件
  相当于逻辑 AND

* `PHPickerFilter.any(filters)`
  满足任意一个过滤条件
  相当于逻辑 OR

* `PHPickerFilter.not(filter)`
  排除指定过滤条件
  相当于逻辑 NOT

### 示例说明

```ts
// 仅允许选择 Live Photo 或普通图片
const filter = PHPickerFilter.any([
  PHPickerFilter.livePhotos(),
  PHPickerFilter.images()
])

await Photos.pick({ filter })
```

---

## PHPickerResult

表示照片选择器返回的单个选择结果。

### itemProvider: ItemProvider

获取结果的 `ItemProvider`对象，是一个Swift 的 `NSItemProvider` 对象的包装。

### livePhoto()

```ts
livePhoto(): Promise<LivePhoto | null>
```

尝试将结果解析为 Live Photo。
若资源不支持 Live Photo，则返回 `null`。

---

### uiImage()

```ts
uiImage(): Promise<UIImage | null>
```

尝试将结果解析为 `UIImage`。
若资源不是图片，则返回 `null`。

---

### imagePath()

```ts
imagePath(): Promise<string | null>
```

尝试将结果解析为图片。如果可以加载成功，该文件会被复制到 app group 的沙盒中，返回图片路径。
你应该在使用完成后删除该文件。

#### 示例

```ts
const filePath = await result.imagePath()
```

---

### videoPath()

```ts
videoPath(): Promise<string | null>
```

尝试将结果解析为视频。如果可以加载成功，该文件会被复制到 app group 的沙盒中，返回视频路径。
你应该在使用完成后删除该文件。

---

## getLatestPhotos(count)

```ts
function getLatestPhotos(count: number): Promise<UIImage[] | null>
```

获取相册中最新的若干张照片。

### 行为说明

* 仅返回图片
* 顺序为从最新到最旧
* 无权限时返回 `null`

---

## pickPhotos(count)

```ts
function pickPhotos(count: number): Promise<UIImage[]>
```

旧版便捷 API，用于快速选择固定数量的照片。

直接返回 `UIImage` 数组，不包含路径或元数据。

---

## takePhoto()

```ts
function takePhoto(): Promise<UIImage | null>
```

快速拍照接口。

* 不支持高级配置
* 用户取消时返回 `null`

---

## savePhoto(path, options)

```ts
function savePhoto(
  path: string,
  options?: { fileName?: string }
): Promise<boolean>
```

将磁盘中的图片文件保存到系统 Photos 应用。

---

## savePhoto(image, options)

```ts
function savePhoto(
  image: Data,
  options?: { fileName?: string }
): Promise<boolean>
```

将图片二进制数据直接写入系统相册，避免创建临时文件。

---

## saveVideo(path, options)

```ts
function saveVideo(
  path: string,
  options?: { fileName?: string }
): Promise<boolean>
```

将视频文件保存到系统 Photos 应用。

---

## saveVideo(video, options)

```ts
function saveVideo(
  video: Data,
  options?: { fileName?: string }
): Promise<boolean>
```

将视频二进制数据直接写入系统相册。

---

## 照片资源层 (Photo Asset Layer)

除了「选择 / 拍摄 / 保存」这类事务式接口,模块还把底层照片库暴露为可寻址的资源对象,让脚本能够枚举照片库、读取元数据、按受控尺寸加载媒体、管理相册。

### authorizationStatus(accessLevel?)

```ts
function authorizationStatus(
  accessLevel?: "addOnly" | "readWrite"
): "notDetermined" | "restricted" | "denied" | "authorized" | "limited"
```

返回当前授权状态,不会触发弹框。首次读写照片库时会自动请求授权。默认查询 `"readWrite"`。

### fetchAssets(options?)

```ts
function fetchAssets(options?: PHFetchOptions): Promise<PHAsset[]>
function fetchAssets(localIdentifiers: string[]): Promise<PHAsset[]>
```

按 `PHFetchOptions` 查询资源,或按 `localIdentifier` 批量取回指定资源。

```ts
type PHFetchOptions = {
  mediaType?: "image" | "video" | "audio"
  mediaSubtypes?: PHAssetMediaSubtype[]
  favoritesOnly?: boolean
  includeHidden?: boolean
  includeAllBurstAssets?: boolean
  sortBy?: "creationDate" | "modificationDate"
  ascending?: boolean
  limit?: number
  createdAfter?: number   // 毫秒时间戳
  createdBefore?: number
}
```

`PHAssetMediaSubtype` 取值:`"photoPanorama"`、`"photoHDR"`、`"photoScreenshot"`、`"photoLive"`、`"photoDepthEffect"`、`"videoStreamed"`、`"videoHighFrameRate"`、`"videoTimelapse"`。

```ts
const recent = await Photos.fetchAssets({
  mediaType: "image",
  favoritesOnly: true,
  limit: 20,
})
```

### fetchAsset(localIdentifier)

```ts
function fetchAsset(localIdentifier: string): Promise<PHAsset | null>
```

按稳定的 `localIdentifier` 取回单个资源。保存该标识符即可在多次运行间引用同一资源。

---

## PHAsset

照片库中一张图片、视频或 Live Photo 的引用。

### 属性

* `localIdentifier: string` — 稳定持久的标识符。
* `mediaType: "image" | "video" | "audio" | "unknown"`
* `mediaSubtypes: PHAssetMediaSubtype[]`
* `pixelWidth: number`、`pixelHeight: number`
* `creationDate: number | null`、`modificationDate: number | null` — 毫秒时间戳。
* `duration: number` — 秒;图片为 `0`。
* `isFavorite: boolean`、`isHidden: boolean`
* `location: PHAssetLocation | null` — 纬度、经度、海拔、精度、速度、航向、时间戳。
* `burstIdentifier: string | null`、`representsBurst: boolean`
* `sourceType: "userLibrary" | "cloudShared" | "itunesSynced" | "unknown"`

### requestImage(options?)

```ts
requestImage(options?: {
  targetWidth?: number
  targetHeight?: number
  contentMode?: "aspectFit" | "aspectFill"
  deliveryMode?: "opportunistic" | "highQualityFormat" | "fastFormat"
  version?: "current" | "original" | "unadjusted"
  allowNetworkAccess?: boolean
}): Promise<UIImage | null>
```

按指定尺寸加载 `UIImage`。不传尺寸则加载原始分辨率。需要时会从 iCloud 下载,除非 `allowNetworkAccess` 为 `false`。

### requestImageData(options?)

```ts
requestImageData(options?: {
  version?: "current" | "original" | "unadjusted"
  allowNetworkAccess?: boolean
}): Promise<{ data: Data; uti: UTType; orientation: number } | null>
```

加载原始文件数据、其 UTType 与 EXIF 方向。

### requestVideoURL(options?)

```ts
requestVideoURL(options?: {
  version?: "current" | "original" | "unadjusted"
  allowNetworkAccess?: boolean
}): Promise<string | null>
```

将资源的视频导出到 App 沙盒临时文件并返回其路径。用完请自行删除。非视频资源返回 `null`。

### requestLivePhoto(options?)

```ts
requestLivePhoto(options?: {
  targetWidth?: number
  targetHeight?: number
  allowNetworkAccess?: boolean
}): Promise<LivePhoto | null>
```

加载 `LivePhoto` 表示;若资源不是 Live Photo 则返回 `null`。

### setFavorite(value) / delete()

```ts
setFavorite(value: boolean): Promise<boolean>
delete(): Promise<boolean>
```

收藏 / 取消收藏,或删除资源。删除会弹出系统确认框;用户取消时返回 `false`。

---

## 相册

### fetchAlbums(options?) / fetchAlbum(localIdentifier)

```ts
function fetchAlbums(options?: {
  type?: "album" | "smartAlbum"
  assetCollectionSubtype?: string
}): Promise<PHAssetCollection[]>

function fetchAlbum(localIdentifier: string): Promise<PHAssetCollection | null>
```

获取相册与智能相册。省略 `type` 则两者都取。

### createAlbum(title) / deleteAlbums(albums) / deleteAssets(assets)

```ts
function createAlbum(title: string): Promise<PHAssetCollection | null>
function deleteAlbums(albums: PHAssetCollection[]): Promise<boolean>
function deleteAssets(assets: PHAsset[]): Promise<boolean>
```

创建用户相册、删除相册,或批量删除资源。删除操作会弹出系统确认框。

## PHAssetCollection

* `localIdentifier: string`
* `title: string | null`
* `type: "album" | "smartAlbum" | "moment"`
* `subtype: string` — 如 `"smartAlbumUserLibrary"`、`"smartAlbumFavorites"`、`"albumRegular"`。
* `estimatedAssetCount: number` — 资源数量;快速估值不可用时(智能相册常见)退化为精确计数。
* `startDate: number | null`、`endDate: number | null`

```ts
fetchAssets(options?: PHFetchOptions): Promise<PHAsset[]>
addAssets(assets: PHAsset[]): Promise<boolean>
removeAssets(assets: PHAsset[]): Promise<boolean>
```

`addAssets` / `removeAssets` 仅对用户创建的相册有效。

```ts
const album = await Photos.createAlbum("My Script Album")
const favorites = await Photos.fetchAssets({ favoritesOnly: true, limit: 10 })
await album?.addAssets(favorites)
```

---

## 设计说明

* 所有 API 均为异步 Promise 接口
* 所有 UI 均由系统托管
* Picker 返回的结果为惰性对象，需显式解析
* 保存接口仅返回成功状态，不暴露系统资源标识
* `PHAsset` 以 `localIdentifier` 寻址,持久化该标识符即可稍后重新加载同一资源
* 变更操作(收藏、删除、相册改动)需要写权限,可能弹出系统确认框
