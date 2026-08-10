Turn an ordinary video you already have — a screen recording, a clip from the Photos app, something you downloaded — into a real Live Photo in the system photo library.

```ts
const pair = await LivePhoto.createFromVideo({ videoPath })

await Photos.saveLivePhoto({
  imagePath: pair.imagePath,
  videoPath: pair.videoPath,
})
```

That's the whole flow. Everything below is detail you only need when you want to control the result.

## Why you can't just pair any photo with any video

A Live Photo is not "a JPEG next to an MP4". The photo library only accepts the two files as a pair when three things line up:

1. The still image carries a Live Photo **asset identifier** in its Apple Maker Note.
2. The movie carries the **same** identifier as its content identifier.
3. The movie has a **still-image-time** metadata track marking which moment is the cover frame.

Grab a frame with `AVAsset`, re-encode it with `UIImage.toJPEGData()`, hand both files to `Photos.saveLivePhoto` — and it fails with **`PHPhotosErrorDomain 3302`**, because a decoded bitmap has no identifier and a plain `.mp4` has no metadata track.

`LivePhoto.createFromVideo` writes all three for you. You never touch the metadata yourself.

## Choosing the cover frame

The still image is the frame your video is "paused on" in the library. By default it's the middle of the source. Pass `stillTime` (in seconds from the start of the source video) to pick another moment:

```ts
const pair = await LivePhoto.createFromVideo({
  videoPath,
  stillTime: 4.5,
})
```

The kept portion of the video is centred on that moment. A value past the end of the video is clamped rather than rejected, so you can pass a rough guess safely.

## Length

Live Photos are usually short. `maxDuration` defaults to 10 seconds — a longer source is trimmed to a window around `stillTime`:

```ts
// A 3-second clip centred on the cover frame, like a camera-captured Live Photo
const pair = await LivePhoto.createFromVideo({
  videoPath,
  stillTime: 4.5,
  maxDuration: 3,
})

console.log(pair.duration)   // ≈ 3
console.log(pair.stillTime)  // ≈ 1.5 — now relative to the *output* movie
```

Note that `stillTime` on the way in is relative to the source video, while `stillTime` on the way out is relative to the trimmed output.

There is no upper limit beyond the source video itself. Ask for a longer clip, or for the whole thing:

```ts
const pair = await LivePhoto.createFromVideo({
  videoPath,
  maxDuration: Infinity,   // keep the entire video
})
```

Length costs you almost nothing while converting — the video track is copied rather than re-encoded, so a 60-second clip is mostly file I/O. Two things to keep in mind, though: a long Live Photo is still a single item in the photo library and takes up the space of the whole video, and how the library plays back a very long one is up to iOS. The only case where length really costs time is the rare re-encode fallback — check `reencoded` in the result if that matters to you.

## Output files

Both files land in the temporary directory unless you say otherwise, and the returned paths are always the ones actually written:

```ts
const base = FileManager.documentsDirectory
const pair = await LivePhoto.createFromVideo({
  videoPath,
  imageOutputPath: `${base}/cover.heic`,
  videoOutputPath: `${base}/clip.mov`,   // must end with .mov
  imageFormat: "heic",
  quality: 0.85,
})
```

The paired movie **must** be a `.mov`; the photo library does not accept `.mp4` as a paired video, so a non-`.mov` output path is rejected up front. The still image can be `"jpeg"` (default) or `"heic"`.

If you don't want the original sound carried into the Live Photo, pass `includeAudio: false`.

## What you get back

```ts
{
  imagePath: string        // feed these two straight into Photos.saveLivePhoto
  videoPath: string
  assetIdentifier: string  // the identifier shared by the still and the movie
  duration: number         // length of the paired movie, in seconds
  stillTime: number        // cover moment, relative to the output movie
  width: number            // pixel size of the still image
  height: number
  reencoded: boolean
}
```

`reencoded` is `false` for almost every video: the original video track is copied across untouched, which is fast and lossless. It flips to `true` when the source encoding can't live in a QuickTime container and the video had to be re-encoded — slower, and slightly lossy.

## Orientation

Rotation is handled for you. A portrait video keeps its orientation in the movie, and the still image is written already rotated to match, so the cover frame and the playback never disagree.

## Errors

The promise rejects, with a readable message, when:

* the source file doesn't exist, or isn't a media file;
* the source has no video track (an audio-only file, for example);
* the video output path doesn't end in `.mov`, or its folder doesn't exist;
* the video has no playable duration.

Nothing partial is left behind — if the movie can't be written, the still image is cleaned up too.

## Saving to the library

`Photos.saveLivePhoto` copies both files into the library. Pass `shouldMoveFile: true` only if you're done with them, since it moves the files away rather than copying:

```ts
await Photos.saveLivePhoto({
  imagePath: pair.imagePath,
  videoPath: pair.videoPath,
  shouldMoveFile: true,   // the two files are gone after this
})
```

## Inspecting the identifier

If you're curious (or debugging a pairing problem), the identifier is readable through `ImageIO`:

```ts
const meta = await ImageIO.readMetadata(pair.imagePath)
console.log(meta.makerApple?.["17"])   // === pair.assetIdentifier
```

You can also supply your own identifier — for instance to rebuild a pair with the same identity — but it **must be a UUID string**. The field that stores it inside the still image is fixed-length, so anything shorter is padded and would no longer match the movie; a non-UUID value is rejected rather than silently producing a pair the library won't accept.

```ts
const pair = await LivePhoto.createFromVideo({
  videoPath,
  assetIdentifier: "9F1C3A54-1234-4C6E-9A0B-3E2D1F0A5B7C",
})
```

## Related

* **Live Photo capture** — if the camera is the source, `AVCapturePhotoOutput` can record a Live Photo directly; see the *Live Photo* page under AVCaptureSession. You don't need `createFromVideo` in that case.
* **LivePhotoView** — display the result in your UI.
* **ImageIO** — read and write image metadata, including `makerApple`.
