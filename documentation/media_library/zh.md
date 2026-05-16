`MediaLibrary` 模块用于访问用户设备中的本地媒体资料库数据, 允许脚本查询歌曲、专辑、歌手与播放列表，并获取对应的封面图。

使用前请注意：

* 用户必须授权访问媒体资料库。
* 查询结果仅包含用户设备资料库中的内容（包括本地同步歌曲、iTunes 同步内容、已下载的 Apple Music 歌曲等）。
* 返回的数据为只读结构，不能直接修改系统资料库。

---

## 数据模型

### Item

表示单首歌曲（Song）。

```ts
type Item = {
  title: string
  persistentID: string
  artist?: string
  albumTitle?: string
  albumArtist?: string
  genre?: string
  composer?: string
  albumTrackNumber?: number
  albumTrackCount?: number
  discNumber?: number
  discCount?: number
  playbackDuration?: number
  playbackStoreID?: string
  isCloudItem?: boolean
  hasProtectedAsset?: boolean
}
```

字段说明：

* `title`：歌曲名称
* `persistentID`：本地资料库唯一标识（用于播放与获取封面）
* `artist`：演唱者
* `albumTitle`：所属专辑名称
* `albumArtist`：专辑艺术家
* `genre`：流派
* `composer`：作曲者
* `albumTrackNumber`：专辑内曲目序号
* `albumTrackCount`：专辑总曲目数
* `discNumber`：CD 序号
* `discCount`：CD 总数
* `playbackDuration`：时长（秒）
* `playbackStoreID`：Apple Music Store ID（如存在）
* `isCloudItem`：是否为云端项目
* `hasProtectedAsset`：是否为受 DRM 保护内容

---

### Playlist

表示播放列表。

```ts
type Playlist = {
  persistentID: string
  name: string
  trackCount: number
}
```

字段说明：

* `persistentID`：播放列表唯一标识
* `name`：播放列表名称
* `trackCount`：歌曲数量

---

### Album

表示专辑。

```ts
type Album = {
  title: string
  artist?: string
  persistentID?: string
  trackCount?: number
}
```

字段说明：

* `title`：专辑名称
* `artist`：专辑艺术家
* `persistentID`：专辑标识（部分情况下可能为空）
* `trackCount`：曲目数量

---

## 查询选项

### SongQueryOptions

```ts
type SongQueryOptions = {
  limit?: number
  sortBy?:
    | "title"
    | "artist"
    | "albumTitle"
    | "playbackDuration"
    | "albumTrackNumber"
  ascending?: boolean
}
```

说明：

* `limit`：限制返回条数
* `sortBy`：排序字段
* `ascending`：是否升序（默认 false）

---

### AlbumQueryOptions

```ts
type AlbumQueryOptions = {
  limit?: number
  sortBy?: "title" | "artist" | "trackCount"
  ascending?: boolean
}
```

---

### PlaylistQueryOptions

```ts
type PlaylistQueryOptions = {
  limit?: number
  sortBy?: "name" | "trackCount"
  ascending?: boolean
}
```

---

### ArtistQueryOptions

```ts
type ArtistQueryOptions = {
  limit?: number
  ascending?: boolean
}
```

---

### SongFilter

用于过滤歌曲。

```ts
type SongFilter = {
  title?: string
  artist?: string
  albumTitle?: string
  genre?: string
  composer?: string
  persistentID?: string
}
```

说明：

* 支持精确匹配过滤
* 可组合多个字段

---

## API 方法

### getSongs

查询歌曲列表。

```ts
function getSongs(
  filter?: SongFilter,
  options?: SongQueryOptions
): Promise<Item[]>
```

示例：

```ts
const songs = await MediaLibrary.getSongs(
  { artist: "Taylor Swift" },
  { sortBy: "title", ascending: true, limit: 20 }
)

console.log(songs)
```

---

### getSongByPersistentID

根据 `persistentID` 获取单首歌曲。

```ts
function getSongByPersistentID(
  persistentID: string
): Promise<Item | null>
```

示例：

```ts
const song = await MediaLibrary.getSongByPersistentID("123456789")

if (song) {
  console.log(song.title)
}
```

---

### getAlbums

获取专辑列表。

```ts
function getAlbums(
  options?: AlbumQueryOptions
): Promise<Album[]>
```

示例：

```ts
const albums = await MediaLibrary.getAlbums({
  sortBy: "title",
  ascending: true
})
```

---

### getAlbumSongs

获取某个专辑下的歌曲。

```ts
function getAlbumSongs(
  albumTitle: string,
  options?: SongQueryOptions
): Promise<Item[]>
```

示例：

```ts
const tracks = await MediaLibrary.getAlbumSongs("1989", {
  sortBy: "albumTrackNumber",
  ascending: true
})
```

说明：

* 通过专辑名称匹配
* 若存在同名专辑，可能返回多个专辑的合并结果

---

### getArtists

获取艺术家列表。

```ts
function getArtists(
  options?: ArtistQueryOptions
): Promise<string[]>
```

示例：

```ts
const artists = await MediaLibrary.getArtists({ limit: 50 })
```

---

### getArtistSongs

获取某个艺术家的所有歌曲。

```ts
function getArtistSongs(
  artist: string,
  options?: SongQueryOptions
): Promise<Item[]>
```

示例：

```ts
const songs = await MediaLibrary.getArtistSongs("Adele", {
  sortBy: "playbackDuration",
  ascending: false
})
```

---

### getPlaylists

获取播放列表。

```ts
function getPlaylists(
  options?: PlaylistQueryOptions
): Promise<Playlist[]>
```

示例：

```ts
const playlists = await MediaLibrary.getPlaylists({
  sortBy: "trackCount",
  ascending: false
})
```

---

### getPlaylistSongs

获取播放列表中的歌曲。

```ts
function getPlaylistSongs(
  playlistPersistentID: string,
  options?: SongQueryOptions
): Promise<Item[]>
```

示例：

```ts
const songs = await MediaLibrary.getPlaylistSongs("9988776655", {
  sortBy: "title"
})
```

---

### getArtwork

获取歌曲封面图。

```ts
function getArtwork(
  persistentID: string,
  size?: {
    width: number
    height: number
  }
): Promise<UIImage | null>
```

说明：

* 返回 `UIImage`
* `size` 为期望渲染尺寸
* 若无封面则返回 `null`

示例：

```ts
const image = await MediaLibrary.getArtwork("123456789", {
  width: 300,
  height: 300
})

if (image) {
  console.log("Artwork loaded")
}
```

---

## 使用建议

* 大量查询时应使用 `limit` 控制返回数量。
* 对于播放场景，建议仅保存 `persistentID`，避免缓存完整对象。
* 获取封面图建议按需加载，不要批量预加载。
* 若需要播放歌曲，请配合 `SystemMusicPlayer.setQueueByPersistentIDs` 使用。
