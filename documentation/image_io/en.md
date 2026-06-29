Low-level image container I/O: read EXIF / GPS / TIFF / IPTC metadata, and encode images to formats (and with embedded metadata) that `UIImage.toPNGData` / `toJPEGData` can't produce.

> **Why not just use `UIImage`?** A `UIImage` is a *decoded bitmap* — by the time you have one, the original file's metadata (EXIF, GPS, ...) is already gone, and `toPNGData` / `toJPEGData` cannot write HEIC / TIFF / GIF. `ImageIO` works at the encoded-container level, so it can both read existing metadata and write it back.

```ts
// Read metadata
const meta = await ImageIO.readMetadata("/path/to/photo.jpg")
console.log(meta.pixelWidth, meta.pixelHeight)
console.log(meta.gps?.Latitude, meta.gps?.Longitude)

// Re-encode a UIImage to HEIC with GPS
await ImageIO.writeImage({
  image,                       // a UIImage
  to: "/path/to/out.heic",
  format: "heic",
  quality: 0.9,
  metadata: {
    gps: { Latitude: 37.33, LatitudeRef: "N", Longitude: 122.0, LongitudeRef: "W" },
  },
})
```

---

## `ImageIO.readMetadata(source)`

```ts
function readMetadata(source: string | Data): Promise<ImageMetadata>
```

Reads container-level metadata from a file path or `Data`. Rejects if the source can't be decoded as an image.

```ts
type ImageMetadata = {
  pixelWidth?: number
  pixelHeight?: number
  dpiWidth?: number
  dpiHeight?: number
  depth?: number
  colorModel?: string
  orientation?: number        // EXIF orientation 1–8
  hasAlpha?: boolean
  profileName?: string
  exif?: Record<string, any>  // CGImageProperties Exif keys, e.g. DateTimeOriginal
  gps?: Record<string, any>   // GPS keys, e.g. Latitude / Longitude / LatitudeRef
  tiff?: Record<string, any>
  iptc?: Record<string, any>
}
```

The well-known dictionaries (`exif` / `gps` / `tiff` / `iptc`) use Apple's CGImageProperties key names verbatim (`gps.Latitude`, `exif.DateTimeOriginal`, ...).

---

## `ImageIO.writeImage(options)`

```ts
function writeImage(options: ImageWriteOptions): Promise<void>
```

Encodes and writes an image to `to`. Provide **exactly one** of `image` or `source`:

| Field | Type | Notes |
| --- | --- | --- |
| `image?` | `UIImage` | Re-encode from a decoded bitmap. The original file's metadata is **not** preserved — only the `metadata` you pass is written. |
| `source?` | `string \| Data` | Copy from an original encoded image, **preserving its metadata**, then overlay the `metadata` you pass. |
| `to` | `string` | Output file path. An existing file is overwritten. |
| `format?` | `'jpeg' \| 'png' \| 'heic' \| 'tiff' \| 'gif'` | Required with `image`; defaults to the source's format with `source`. |
| `quality?` | `number` | Lossy compression 0..1 (jpeg / heic only). |
| `metadata?` | `ImageMetadata` | Merged on top of the source's metadata when using `source`. |

### Tag a photo with GPS while keeping its EXIF

Use the `source` variant — re-encoding through a `UIImage` would drop the original EXIF:

```ts
await ImageIO.writeImage({
  source: "/path/to/original.jpg",   // keeps original EXIF / TIFF
  to: "/path/to/tagged.jpg",
  metadata: { gps: { Latitude: 10.0, LatitudeRef: "N" } },  // overlay GPS
})
```

---

## Caveats

* **`image` drops original metadata.** A `UIImage` is a decoded bitmap. To preserve a file's existing EXIF/GPS, use the `source` variant, not `image`.
* **`quality` only applies to jpeg / heic.** It's ignored for png / tiff / gif.
* **HEIC encoding** requires a device/simulator that supports the HEVC image encoder; on older simulators HEIC may fail — fall back to jpeg if `writeImage` rejects.
* **Key names are raw CGImageProperties keys.** When writing `exif` / `gps` / `tiff` / `iptc`, use Apple's key names (e.g. `Latitude`, `LatitudeRef`, `DateTimeOriginal`).
