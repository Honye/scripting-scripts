The `MediaLibrary` module provides read-only access to the user's local media library, allowing scripts to query songs, albums, artists, and playlists, and retrieve artwork.

Important notes:

* The user must grant permission to access the media library.
* Only items available in the device media library are returned (including locally synced content, iTunes synced content, and downloaded Apple Music tracks).
* All returned data structures are read-only and cannot modify the system library.

---

## Data Models

### Item

Represents a single song.

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

Field descriptions:

* `title`: Song title
* `persistentID`: Unique local media library identifier (used for playback and artwork retrieval)
* `artist`: Performing artist
* `albumTitle`: Album name
* `albumArtist`: Album artist
* `genre`: Genre
* `composer`: Composer
* `albumTrackNumber`: Track number within the album
* `albumTrackCount`: Total track count of the album
* `discNumber`: Disc number
* `discCount`: Total disc count
* `playbackDuration`: Duration in seconds
* `playbackStoreID`: Apple Music Store ID (if available)
* `isCloudItem`: Indicates whether the item is cloud-based
* `hasProtectedAsset`: Indicates DRM-protected content

---

### Playlist

Represents a playlist.

```ts
type Playlist = {
  persistentID: string
  name: string
  trackCount: number
}
```

Field descriptions:

* `persistentID`: Unique playlist identifier
* `name`: Playlist name
* `trackCount`: Number of tracks

---

### Album

Represents an album.

```ts
type Album = {
  title: string
  artist?: string
  persistentID?: string
  trackCount?: number
}
```

Field descriptions:

* `title`: Album title
* `artist`: Album artist
* `persistentID`: Album identifier (may be unavailable in some cases)
* `trackCount`: Number of tracks

---

## Query Options

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

Description:

* `limit`: Maximum number of results
* `sortBy`: Field used for sorting
* `ascending`: Sort order (default is descending if not specified)

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

Used to filter song queries.

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

Notes:

* Supports exact match filtering.
* Multiple fields may be combined.

---

## API Methods

### getSongs

Query songs.

```ts
function getSongs(
  filter?: SongFilter,
  options?: SongQueryOptions
): Promise<Item[]>
```

Example:

```ts
const songs = await MediaLibrary.getSongs(
  { artist: "Taylor Swift" },
  { sortBy: "title", ascending: true, limit: 20 }
)

console.log(songs)
```

---

### getSongByPersistentID

Retrieve a single song by `persistentID`.

```ts
function getSongByPersistentID(
  persistentID: string
): Promise<Item | null>
```

Example:

```ts
const song = await MediaLibrary.getSongByPersistentID("123456789")

if (song) {
  console.log(song.title)
}
```

---

### getAlbums

Retrieve albums.

```ts
function getAlbums(
  options?: AlbumQueryOptions
): Promise<Album[]>
```

Example:

```ts
const albums = await MediaLibrary.getAlbums({
  sortBy: "title",
  ascending: true
})
```

---

### getAlbumSongs

Retrieve songs within a specific album.

```ts
function getAlbumSongs(
  albumTitle: string,
  options?: SongQueryOptions
): Promise<Item[]>
```

Example:

```ts
const tracks = await MediaLibrary.getAlbumSongs("1989", {
  sortBy: "albumTrackNumber",
  ascending: true
})
```

Notes:

* Matching is based on album title.
* If multiple albums share the same name, results may include tracks from all matching albums.

---

### getArtists

Retrieve artist names.

```ts
function getArtists(
  options?: ArtistQueryOptions
): Promise<string[]>
```

Example:

```ts
const artists = await MediaLibrary.getArtists({ limit: 50 })
```

---

### getArtistSongs

Retrieve songs by a specific artist.

```ts
function getArtistSongs(
  artist: string,
  options?: SongQueryOptions
): Promise<Item[]>
```

Example:

```ts
const songs = await MediaLibrary.getArtistSongs("Adele", {
  sortBy: "playbackDuration",
  ascending: false
})
```

---

### getPlaylists

Retrieve playlists.

```ts
function getPlaylists(
  options?: PlaylistQueryOptions
): Promise<Playlist[]>
```

Example:

```ts
const playlists = await MediaLibrary.getPlaylists({
  sortBy: "trackCount",
  ascending: false
})
```

---

### getPlaylistSongs

Retrieve songs within a playlist.

```ts
function getPlaylistSongs(
  playlistPersistentID: string,
  options?: SongQueryOptions
): Promise<Item[]>
```

Example:

```ts
const songs = await MediaLibrary.getPlaylistSongs("9988776655", {
  sortBy: "title"
})
```

---

### getArtwork

Retrieve artwork for a song.

```ts
function getArtwork(
  persistentID: string,
  size?: {
    width: number
    height: number
  }
): Promise<UIImage | null>
```

Description:

* Returns a `UIImage`.
* `size` specifies the desired render dimensions.
* Returns `null` if artwork is unavailable.

Example:

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

## Best Practices

* Use `limit` to control result size for large queries.
* For playback workflows, store `persistentID` instead of entire item objects.
* Load artwork on demand rather than preloading in bulk.
* To play songs, combine this module with `SystemMusicPlayer.setQueueByPersistentIDs`.