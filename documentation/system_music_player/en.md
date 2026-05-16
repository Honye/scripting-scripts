The `SystemMusicPlayer` module provides control over the system-level music player. It is built on top of `MPMusicPlayerController.systemMusicPlayer`, which shares the playback queue and playback state with the system Music app.

This module allows scripts to:

* Control system music playback
* Set and manage the playback queue
* Control playback time, rate, repeat, and shuffle modes
* Observe playback state changes
* Access information about the currently playing item

Important notes:

* The user must grant media library access.
* Playing Apple Music content may require an active subscription.
* All operations affect the global system music player.

---

## Data Models

### PlaybackState

Represents the current playback state.

```ts
type PlaybackState =
  | "stopped"
  | "playing"
  | "paused"
  | "interrupted"
  | "seekingForward"
  | "seekingBackward"
```

Descriptions:

* `stopped`: Playback is stopped
* `playing`: Currently playing
* `paused`: Paused
* `interrupted`: Interrupted by system events (e.g. phone call)
* `seekingForward`: Fast-forwarding
* `seekingBackward`: Rewinding

---

### RepeatMode

Defines the repeat mode.

```ts
type RepeatMode =
  | "none"
  | "one"
  | "all"
  | "default"
```

Descriptions:

* `none`: No repeat
* `one`: Repeat current item
* `all`: Repeat entire queue
* `default`: Use system default

---

### ShuffleMode

Defines the shuffle mode.

```ts
type ShuffleMode =
  | "off"
  | "songs"
  | "albums"
  | "default"
```

Descriptions:

* `off`: Shuffle disabled
* `songs`: Shuffle songs
* `albums`: Shuffle albums
* `default`: Use system default

---

### NowPlayingItem

Represents the currently playing item.

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

Field descriptions:

* `persistentID`: Unique local media identifier
* `title`: Song title
* `playbackDuration`: Duration in seconds
* `playbackStoreID`: Apple Music Store ID (if available)
* Other fields are similar to `MediaLibrary.Item`

---

## Setting the Playback Queue

### setQueueByStoreIDs

Sets the playback queue using Apple Music Store IDs.

```ts
function setQueueByStoreIDs(options: {
  storeIDs: string[]
  startItemID?: string
  startTime?: number
}): Promise<void>
```

Parameters:

* `storeIDs`: Array of Apple Music Store IDs
* `startItemID`: Optional ID of the item to start playback from
* `startTime`: Optional starting playback time in seconds

Example:

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

Sets the playback queue using local media `persistentID` values.

```ts
function setQueueByPersistentIDs(options: {
  persistentIDs: string[]
  startItemID?: string
  startTime?: number
}): Promise<void>
```

Example:

```ts
await SystemMusicPlayer.setQueueByPersistentIDs({
  persistentIDs: ["111", "222", "333"],
  startItemID: "222"
})

await SystemMusicPlayer.play()
```

Recommended usage:

* Combine with `MediaLibrary.getSongs()` to build a queue from local content.

---

## Playback Controls

### prepare

Prepares the current playback queue.

```ts
function prepare(): Promise<void>
```

Typically called before `play()`.

---

### play

Starts playback.

```ts
function play(): Promise<void>
```

---

### pause

Pauses playback.

```ts
function pause(): Promise<void>
```

---

### stop

Stops playback.

```ts
function stop(): Promise<void>
```

---

### skipToNextItem

Skips to the next item in the queue.

```ts
function skipToNextItem(): Promise<void>
```

---

### skipToPreviousItem

Skips to the previous item.

```ts
function skipToPreviousItem(): Promise<void>
```

---

### seek

Seeks to a specific time in the current item.

```ts
function seek(to: number): Promise<void>
```

Parameter:

* `to`: Time in seconds

Example:

```ts
await SystemMusicPlayer.seek(60)
```

---

### setCurrentPlaybackTime

Sets the current playback time.

```ts
function setCurrentPlaybackTime(seconds: number): Promise<void>
```

---

### setCurrentPlaybackRate

Sets the playback rate.

```ts
function setCurrentPlaybackRate(rate: number): Promise<void>
```

Example:

```ts
await SystemMusicPlayer.setCurrentPlaybackRate(1.5)
```

---

### setRepeatMode

Sets the repeat mode.

```ts
function setRepeatMode(mode: RepeatMode): Promise<void>
```

---

### setShuffleMode

Sets the shuffle mode.

```ts
function setShuffleMode(mode: ShuffleMode): Promise<void>
```

---

## Playback State Accessors

### indexOfNowPlayingItem

Returns the index of the current item in the queue.

```ts
function indexOfNowPlayingItem(): number
```

---

### getNowPlayingItem

Returns the currently playing item.

```ts
function getNowPlayingItem(): NowPlayingItem | null
```

Example:

```ts
const item = SystemMusicPlayer.getNowPlayingItem()

if (item) {
  console.log(item.title)
}
```

---

### getPlaybackState

Returns the current playback state.

```ts
function getPlaybackState(): PlaybackState
```

---

### getCurrentPlaybackTime

Returns the current playback time in seconds.

```ts
function getCurrentPlaybackTime(): number
```

---

### getCurrentPlaybackRate

Returns the current playback rate.

```ts
function getCurrentPlaybackRate(): number
```

---

### getRepeatMode

Returns the current repeat mode.

```ts
function getRepeatMode(): RepeatMode
```

---

### getShuffleMode

Returns the current shuffle mode.

```ts
function getShuffleMode(): ShuffleMode
```

---

## Event Handling

### EventType

```ts
type EventType =
  | "playbackStateDidChange"
  | "nowPlayingItemDidChange"
  | "volumeDidChange"
```

---

### addEventListener

Adds an event listener.

```ts
function addEventListener<T extends EventType>(
  type: T,
  listener: (payload: any) => void
): void
```

Example:

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

Removes an event listener.

```ts
function removeEventListener<T extends EventType>(
  type: T,
  listener: (payload: any) => void
): void
```

---

## Best Practices

* After setting a queue, call `prepare()` before `play()`.
* Listen to `nowPlayingItemDidChange` to update UI reactively.
* Use `persistentID` as a stable identifier rather than relying on queue index.
* Avoid frequently resetting the queue with `setQueue...`, as it replaces the entire playback queue.
* Remember that this is a global system music player; changes affect system-wide playback.
