`AVAsset` is a heavyweight handle to a media resource (audio / video) backed by an iOS `AVURLAsset`. It lets you read media properties, metadata, and tracks, and extract still images at arbitrary times — without spinning up an `AVPlayer`.

You can also pass an `AVAsset` to `AVPlayer.setSource(asset)` to share the underlying media (and any already-loaded metadata) between inspection and playback.

---

## Getting Started

```ts
const asset = new AVAsset("https://example.com/movie.mp4")

const duration = await asset.loadDuration()
console.log("Duration:", duration.seconds, "seconds")

const playable = await asset.loadIsPlayable()
if (playable) {
  const player = new AVPlayer()
  player.setSource(asset)
  player.play()
}
```

---

## Validation

The constructor is intentionally lazy and matches the iOS `AVURLAsset` semantics:

* It does **not** verify file existence.
* It does **not** verify URL reachability.
* For remote URLs, only obviously malformed strings (where the underlying `URL(string:)` returns `nil`) throw immediately.
* All other failures (404, network errors, missing local files, unrecognized formats) surface as **Promise rejections** on the first `loadXxx()` call.

```ts
// Constructor succeeds — no validation:
const asset = new AVAsset("/does/not/exist.mp3")

// First load attempt rejects with a descriptive error:
try {
  await asset.loadDuration()
} catch (e) {
  console.error("Failed to load:", e.message)
}
```

---

## API Reference

### Constructor

#### `new AVAsset(filePathOrURL: string, options?: { headers?: Record<string, string> })`

Creates an asset from either a local file path or a remote `http(s)://` URL.

For remote URLs, you may pass HTTP headers (useful for authenticated content):

```ts
const asset = new AVAsset("https://example.com/private.mp4", {
  headers: { Authorization: "Bearer abc123" }
})
```

---

### Properties

#### `source: string`

The original file path or URL string used to construct this asset. Read-only.

---

### Async Loaders

All `loadXxx()` methods return a `Promise`. Failures (including missing files / unreachable URLs / unsupported formats) reject with an `Error`.

#### `loadDuration(): Promise<MediaTime>`

The total duration of the asset.

#### `loadIsPlayable(): Promise<boolean>`

Whether the asset can be played back.

#### `loadIsExportable(): Promise<boolean>`

Whether the asset can be exported (e.g. via `AVAssetExportSession`).

#### `loadIsReadable(): Promise<boolean>`

Whether the asset's media data can be read.

#### `loadHasProtectedContent(): Promise<boolean>`

Whether the asset has DRM-protected content.

#### `loadPreferredTransform(): Promise<{ a, b, c, d, tx, ty }>`

The 6 components of the preferred affine transform (rotation / scale / translation) used when rendering the video portion.

#### `loadMetadata(): Promise<AVMetadataItem[] | null>`

Loads all metadata items from the asset.

#### `loadCommonMetadata(): Promise<AVMetadataItem[] | null>`

Loads the common metadata items (each carries a `commonKey`).

---

### Tracks

#### `loadTracks(mediaType?: AVMediaType): Promise<AVAssetTrack[]>`

Loads tracks from the asset, optionally filtered by media type.

```ts
const videoTracks = await asset.loadTracks("video")
if (videoTracks.length > 0) {
  const size = await videoTracks[0].loadNaturalSize()
  console.log("Video size:", size.width, "x", size.height)
}
```

`AVMediaType` is one of:

```
'video' | 'audio' | 'subtitle' | 'text' | 'closedCaption' | 'metadata' | 'muxed' | 'timecode'
```

#### `AVAssetTrack`

| Member | Type | Description |
|--------|------|-------------|
| `trackID` | `number` | Persistent identifier within the asset |
| `mediaType` | `AVMediaType` | Track media type |
| `loadNaturalSize()` | `Promise<Size>` | Natural pixel dimensions |
| `loadNaturalTimeScale()` | `Promise<number>` | Natural timescale |
| `loadNominalFrameRate()` | `Promise<number>` | Frames per second |
| `loadEstimatedDataRate()` | `Promise<number>` | Bits per second |
| `loadTimeRange()` | `Promise<{ start, duration }>` | Time range within the asset |
| `loadLanguageCode()` | `Promise<string \| null>` | ISO 639-2/T language code |

---

### Image Generation

#### `generateImage(time, options?): Promise<{ image, actualTime }>`

Generates a still image at a single requested time.

```ts
const time = MediaTime.make({ seconds: 5, preferredTimescale: 600 })
const result = await asset.generateImage(time, {
  maximumSize: { width: 640, height: 360 }
})
console.log("Got frame at", result.actualTime.seconds)
```

#### `generateImages(times, options?): Promise<...>`

Generates still images for an array of times. Each result is reported independently — successful entries carry `image` and `actualTime`; failed entries carry `error`.

```ts
const times = [0, 5, 10, 15].map(s =>
  MediaTime.make({ seconds: s, preferredTimescale: 600 })
)

const results = await asset.generateImages(times)
for (const r of results) {
  if ("image" in r) {
    console.log("Frame at", r.actualTime.seconds)
  } else {
    console.warn("Failed at", r.requestedTime.seconds, "—", r.error)
  }
}
```

#### `AVAssetImageGenerateOptions`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maximumSize` | `Size` | natural | Output size cap; aspect ratio is preserved |
| `toleranceBefore` | `MediaTime` | `MediaTime.zero()` | Max time before requested time the generator may pick |
| `toleranceAfter` | `MediaTime` | `MediaTime.zero()` | Max time after requested time the generator may pick |
| `appliesPreferredTrackTransform` | `boolean` | `true` | Whether to honour the preferred track transform |

---

### Lifecycle

#### `dispose(): void`

Releases the underlying `AVURLAsset`. Subsequent `loadXxx()` calls will reject. The script runtime auto-disposes any `AVAsset` you do not explicitly dispose when the script ends.

---

## Sharing With AVPlayer

`AVPlayer.setSource(asset)` reuses the underlying media so any property already loaded on the asset is shared:

```ts
const asset = new AVAsset(url)
const metadata = await asset.loadCommonMetadata()  // pre-load before playback

const player = new AVPlayer()
player.setSource(asset)
player.play()
```

---

## Best Practices

1. **Use the right level of API** — for inspection only, prefer `AVAsset` over `AVPlayer` to avoid the playback machinery.
2. **Share assets between inspection and playback** — construct an `AVAsset` once, pass it to `AVPlayer.setSource(asset)`.
3. **Always handle Promise rejections** — failures surface there, not in the constructor.
4. **Prefer batch image generation** — `generateImages(times)` is more efficient than calling `generateImage(time)` in a loop.
5. **Tolerances trade exactness for speed** — for thumbnails, a small `toleranceBefore`/`After` (e.g. half a second) is usually faster than exact-frame seeking.

---

## Full Example

```ts
const asset = new AVAsset("/path/to/movie.mp4")

try {
  const [duration, videoTracks] = await Promise.all([
    asset.loadDuration(),
    asset.loadTracks("video"),
  ])

  console.log("Duration:", duration.seconds, "s")

  if (videoTracks.length > 0) {
    const size = await videoTracks[0].loadNaturalSize()
    console.log("Resolution:", size.width, "x", size.height)
  }

  // Take a thumbnail at the midpoint
  const mid = MediaTime.make({
    seconds: duration.seconds / 2,
    preferredTimescale: 600
  })
  const { image } = await asset.generateImage(mid, {
    maximumSize: { width: 320, height: 180 }
  })

  console.log("Thumbnail size:", image.width, "x", image.height)
} catch (e) {
  console.error("Asset error:", e.message)
} finally {
  asset.dispose()
}
```
