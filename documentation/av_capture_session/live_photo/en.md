A Live Photo is a photo *plus* a short `.mov` companion clip captured around the shutter. `AVCapturePhotoOutput` lets you opt in per capture — pass `livePhotoMovieFile` to `capturePhoto` and `capturePhoto` resolves with both the still image and the path of the saved movie.

## Prerequisites

* The photo output must have `isLivePhotoCaptureSupported === true` (true on all camera-capable iPhones).
* You must enable it once on the output: `photoOutput.isLivePhotoCaptureEnabled = true`. The bridge silently clamps this to `false` on outputs that don't support Live Photo, so a follow-up read is the simplest feature gate.
* If `isLivePhotoCaptureEnabled` is `false` at the moment `capturePhoto` is called with `livePhotoMovieFile`, the promise **rejects immediately** rather than performing a non-Live capture.
* Do not enable `isAutoDeferredPhotoDeliveryEnabled` at the same time. With deferred on, the system may finalize without producing the `.mov`, and `livePhotoMovieFileURL` will be absent from the resolved value.

## Wiring it up

```ts
const camera = AVCaptureDevice.default("video")!
const session = new AVCaptureSession()
const photoOutput = new AVCapturePhotoOutput()

session.configure(() => {
  session.sessionPreset = "photo"
  session.addInput(new AVCaptureDeviceInput(camera))
  session.addOutput(photoOutput)
})

// One-time setup. The flag survives across capturePhoto calls.
photoOutput.isLivePhotoCaptureEnabled = true

await session.startRunning()

const ts = Date.now()
const photoFile = `${FileManager.documentsDirectory}/live_${ts}.heic`
const movieFile = `${FileManager.documentsDirectory}/live_${ts}.mov`

const result = await photoOutput.capturePhoto({
  codec: "hevc",
  photoFile,                 // ← required if you'll later call Photos.saveLivePhoto
  livePhotoMovieFile: movieFile,
  livePhotoVideoCodec: "hevc",
})

console.log("photo:", result.image.width, "×", result.image.height)
console.log("still file:", result.photoFileURL)
console.log("movie:", result.livePhotoMovieFileURL)
```

The resolved object has the usual `image / metadata / isRawPhoto / isDeferredProxy` plus an extra `photoFileURL: string` (if you passed `photoFile`) and `livePhotoMovieFileURL: string` (if you passed `livePhotoMovieFile`). If you didn't request a Live Photo, the `.mov` field is absent.

### Why `photoFile` matters for Live Photo

`capturePhoto` always gives you `result.image: UIImage` — but `UIImage` is a decoded bitmap with no original metadata. When you save a Live Photo to the system Photo Library via `Photos.saveLivePhoto(...)`, PhotoKit verifies that the still and the `.mov` share a Live Photo asset identifier (embedded in the Apple Maker Note under key 17 on the still; in `com.apple.quicktime.content.identifier` on the movie). Re-encoding the `UIImage` via `image.toJPEGData()` strips that identifier and PhotoKit rejects the pair with **`PHPhotosErrorDomain 3302`**.

The `photoFile` option avoids this by asking the bridge to write `photo.fileDataRepresentation()` straight to disk — that's the raw bytes the camera produced, with the Maker Note intact. Feed `result.photoFileURL` into `Photos.saveLivePhoto({ imagePath, videoPath })` and pairing works.

## What "resolve" actually waits for

A Live Photo capture fires two parallel AVFoundation callbacks: one for the still image and one for the `.mov` file. The bridge waits for **both** before resolving — you always get a fully usable pair, or an error. AVFoundation does not guarantee an order between the two, so don't rely on file timestamps to infer it.

The system also runs a "capture finish" sweep at the end. If something goes wrong half-way (e.g. the device drops the `.mov`), the bridge falls back to whatever has been delivered so far rather than hanging the promise.

## File path rules

* Pass an **absolute path** ending in `.mov`. `${FileManager.documentsDirectory}/...` is the easiest source of a writable path.
* AVFoundation refuses to write to an existing path. The bridge deletes the file at the requested path **before** the capture starts to spare you that error.
* The `.mov` is small (~2–4 MB for a 1.5 s clip). Clean up old files yourself if you're capturing repeatedly.

## Codec selection

`livePhotoVideoCodec` is optional. Acceptable values:

* `"hevc"` — preferred on iPhone 7 and later (supported devices). Smaller files.
* `"h264"` — wider compatibility (older systems, some editing tools).

If you pass a codec that the device doesn't list in `availableLivePhotoVideoCodecTypes`, the bridge silently lets AVFoundation pick its default rather than failing the capture. Read the resolved file with an `AVAsset` if you need to know what was actually written.

## Things to know

* Live Photo + `flashMode = "on"` works, but the captured movie includes the flash flicker; design for that.
* The `.mov` you get is exactly what Photos.app would save — it includes a slight pre-roll and post-roll around the shutter.
* `capturePhoto` only writes files to disk — it doesn't put anything in the system Photo Library. To save the photo and clip as a single linked Live Photo (the way Camera.app does it), pass both paths to [`Photos.saveLivePhoto`](#):

  ```ts
  await Photos.saveLivePhoto({
    imagePath: result.photoFileURL!,           // raw HEIC from `photoFile` option
    videoPath: result.livePhotoMovieFileURL!,  // .mov from `livePhotoMovieFile` option
    shouldMoveFile: true,                      // move both into Photos rather than copy
  })
  ```

  This pairs them into one PHAsset; Photos.app shows the long-press "Live" animation on it. The first call triggers the system Photo Library permission prompt. **Do not** substitute `result.image.toJPEGData()` for `result.photoFileURL` — the re-encoded JPEG loses the Live Photo asset identifier and PhotoKit rejects the pairing.
