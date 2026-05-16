`SystemMusicPlayer` 模块用于控制系统级音乐播放器，底层基于 iOS 的 `MPMusicPlayerController.systemMusicPlayer` 实现。该播放器与系统“音乐”App共用播放队列和播放状态，因此对其操作会影响系统级播放行为。

该模块适用于：

* 控制系统音乐播放
* 设置播放队列
* 控制播放进度、速率、重复与随机模式
* 监听播放状态变化
* 获取当前播放项信息

使用前请注意：

* 用户必须授权访问媒体资料库。
* 若播放 Apple Music 内容，可能需要有效的订阅。
* 操作系统播放器会影响当前系统播放状态。

---

## 数据模型

### PlaybackState

表示当前播放状态。

```ts
type PlaybackState =
  | "stopped"
  | "playing"
  | "paused"
  | "interrupted"
  | "seekingForward"
  | "seekingBackward"
```

状态说明：

* `stopped`：停止
* `playing`：正在播放
* `paused`：暂停
* `interrupted`：被系统中断（如来电）
* `seekingForward`：快进
* `seekingBackward`：快退

---

### RepeatMode

播放循环模式。

```ts
type RepeatMode =
  | "none"
  | "one"
  | "all"
  | "default"
```

说明：

* `none`：不循环
* `one`：单曲循环
* `all`：列表循环
* `default`：系统默认设置

---

### ShuffleMode

随机播放模式。

```ts
type ShuffleMode =
  | "off"
  | "songs"
  | "albums"
  | "default"
```

说明：

* `off`：关闭随机
* `songs`：随机歌曲
* `albums`：随机专辑
* `default`：系统默认

---

### NowPlayingItem

表示当前正在播放的歌曲信息。

```ts
type NowPlayingItem = {
  persistentID: string
  title: string
  playbackDuration: number
  playbackStoreID?: string
  artist?: string
  albumTitle?: string
  albumArtist?: string
  genre?: string
  composer?: string
}
```

字段说明：

* `persistentID`：本地媒体唯一标识
* `title`：歌曲名称
* `playbackDuration`：总时长（秒）
* `playbackStoreID`：Apple Music Store ID（如存在）
* 其他字段与 `MediaLibrary.Item` 类似

---

## 设置播放队列

### setQueueByStoreIDs

根据 Apple Music Store ID 设置播放队列。

```ts
function setQueueByStoreIDs(
  options: {
    storeIDs: string[]
    startItemID?: string
    startTime?: number
  }
): Promise<void>
```

参数说明：

* `storeIDs`：Apple Music Store ID 列表
* `startItemID`：指定起始播放项
* `startTime`：起始播放时间（秒）

示例：

```ts
await SystemMusicPlayer.setQueueByStoreIDs({
  storeIDs: ["123456789", "987654321"],
  startItemID: "123456789",
  startTime: 30
})

await SystemMusicPlayer.play()
```

---

### setQueueByPersistentIDs

根据本地媒体库的 `persistentID` 设置播放队列。

```ts
function setQueueByPersistentIDs(
  options: {
    persistentIDs: string[]
    startItemID?: string
    startTime?: number
  }
): Promise<void>
```

示例：

```ts
await SystemMusicPlayer.setQueueByPersistentIDs({
  persistentIDs: ["111", "222", "333"],
  startItemID: "222"
})

await SystemMusicPlayer.play()
```

说明：

* 推荐与 `MediaLibrary.getSongs()` 结合使用。

---

## 播放控制

### prepare

预加载当前播放队列。

```ts
function prepare(): Promise<void>
```

通常在播放前调用。

---

### play

开始播放。

```ts
function play(): Promise<void>
```

---

### pause

暂停播放。

```ts
function pause(): Promise<void>
```

---

### stop

停止播放。

```ts
function stop(): Promise<void>
```

---

### skipToNextItem

跳至下一首。

```ts
function skipToNextItem(): Promise<void>
```

---

### skipToPreviousItem

跳至上一首。

```ts
function skipToPreviousItem(): Promise<void>
```

---

### seek

跳转至指定时间。

```ts
function seek(to: number): Promise<void>
```

参数：

* `to`：秒

示例：

```ts
await SystemMusicPlayer.seek(60)
```

---

### setCurrentPlaybackTime

设置当前播放时间。

```ts
function setCurrentPlaybackTime(seconds: number): Promise<void>
```

---

### setCurrentPlaybackRate

设置播放速率。

```ts
function setCurrentPlaybackRate(rate: number): Promise<void>
```

示例：

```ts
await SystemMusicPlayer.setCurrentPlaybackRate(1.5)
```

---

### setRepeatMode

设置循环模式。

```ts
function setRepeatMode(mode: RepeatMode): Promise<void>
```

---

### setShuffleMode

设置随机模式。

```ts
function setShuffleMode(mode: ShuffleMode): Promise<void>
```

---

## 获取播放状态

### indexOfNowPlayingItem

获取当前播放项在队列中的索引。

```ts
function indexOfNowPlayingItem(): number
```

---

### getNowPlayingItem

获取当前播放项信息。

```ts
function getNowPlayingItem(): NowPlayingItem | null
```

示例：

```ts
const item = SystemMusicPlayer.getNowPlayingItem()

if (item) {
  console.log(item.title)
}
```

---

### getPlaybackState

获取当前播放状态。

```ts
function getPlaybackState(): PlaybackState
```

---

### getCurrentPlaybackTime

获取当前播放时间（秒）。

```ts
function getCurrentPlaybackTime(): number
```

---

### getCurrentPlaybackRate

获取当前播放速率。

```ts
function getCurrentPlaybackRate(): number
```

---

### getRepeatMode

获取当前循环模式。

```ts
function getRepeatMode(): RepeatMode
```

---

### getShuffleMode

获取当前随机模式。

```ts
function getShuffleMode(): ShuffleMode
```

---

## 事件监听

### EventType

```ts
type EventType =
  | "playbackStateDidChange"
  | "nowPlayingItemDidChange"
  | "volumeDidChange"
```

---

### addEventListener

添加事件监听。

```ts
function addEventListener<T extends EventType>(
  type: T,
  listener: (payload: any) => void
): void
```

示例：

```ts
SystemMusicPlayer.addEventListener(
  "playbackStateDidChange",
  state => {
    console.log("Playback state:", state)
  }
)

SystemMusicPlayer.addEventListener(
  "nowPlayingItemDidChange",
  item => {
    if (item) {
      console.log("Now playing:", item.title)
    }
  }
)
```

---

### removeEventListener

移除事件监听。

```ts
function removeEventListener<T extends EventType>(
  type: T,
  listener: (payload: any) => void
): void
```

---

## 使用建议

* 设置队列后建议调用 `prepare()` 再 `play()`。
* 监听 `nowPlayingItemDidChange` 以更新 UI。
* 使用 `persistentID` 作为稳定标识，不依赖数组索引。
* 系统音乐播放器是全局播放器，操作会影响系统播放状态。
* 不建议频繁调用 `setQueue...`，会重置当前队列。
