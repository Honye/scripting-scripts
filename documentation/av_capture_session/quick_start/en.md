`AVCaptureSession` is the low-level building block for camera and microphone capture in Scripting. It is the same API that `VideoRecorder` is built on top of — but exposed as discrete, composable objects so that you can assemble your own pipeline: choose a device, attach inputs and outputs, run the session, and respond to the iPhone 16 hardware Camera Control.

If you just want to "press a button and record an mp4", reach for [`VideoRecorder`](#) — it manages the state machine, audio session, orientation and pause/resume timeline for you. Use `AVCaptureSession` when you need:

* QR / barcode scanning while previewing video
* Custom photo capture (HEVC, flash mode, Live Photo)
* A custom recording flow that does not match `VideoRecorder`'s state machine
* iPhone 16 Camera Control bindings (zoom slider, exposure slider, custom controls)
* Multiple outputs simultaneously (e.g. photo + movie)

PRO is required to call `startRunning()`, `capturePhoto()` and `startRecording()`. Construction, configuration and `canAdd*` checks are free.

---

## Pipeline at a glance

```ts
const session = new AVCaptureSession()
const camera = AVCaptureDevice.default("video")!
const input = new AVCaptureDeviceInput(camera)

session.configure(() => {
  session.sessionPreset = "photo"
  if (session.canAddInput(input)) session.addInput(input)
})

await session.startRunning()
// ... use session ...
await session.stopRunning()
session.dispose()
```

---

## Permissions

You don't request camera or microphone permission yourself. `session.startRunning()` inspects the inputs you have attached, prompts the user the first time, and rejects the promise if they deny. Other Scripting APIs (Photos, Contacts, Location) work the same way — the API call is the permission gate.

```ts
try {
  await session.startRunning()
} catch (e) {
  // Camera (or microphone, if you added an audio input) was denied,
  // restricted, or unavailable.
}
```

---

## Picking a device

`AVCaptureDevice.default(mediaType)` is the simplest path. For a specific lens or position use `AVCaptureDevice.defaultDevice(...)` or `AVCaptureDevice.discoverySession(...)`:

```ts
// Best back camera with hardware fallback
const back = AVCaptureDevice.defaultDevice(
  "builtInWideAngleCamera", "video", "back"
)

// Enumerate every supported lens type
const session = AVCaptureDevice.discoverySession({
  deviceTypes: [
    "builtInWideAngleCamera",
    "builtInUltraWideCamera",
    "builtInTelephotoCamera",
  ],
  mediaType: "video",
  position: "back",
})
console.log(session.devices.map(d => d.localizedName))
```

---

## Adding inputs and outputs

Wrap the device in an `AVCaptureDeviceInput` (the constructor throws if the device is busy or denied), then attach outputs. Use `session.configure(...)` to batch your changes — it wraps `beginConfiguration()` / `commitConfiguration()` for you.

```ts
const input = new AVCaptureDeviceInput(AVCaptureDevice.default("video")!)

const photoOutput = new AVCapturePhotoOutput()
photoOutput.maxPhotoQualityPrioritization = "quality"

session.configure(() => {
  if (session.canAddInput(input)) session.addInput(input)
  if (session.canAddOutput(photoOutput)) session.addOutput(photoOutput)
})
```

> Calling `addInput` / `addOutput` outside of `configure(...)` works too, but each mutation hits the queue separately. Group them when you can.

---

## Photo capture

```ts
await session.startRunning()
const result = await photoOutput.capturePhoto({ codec: "hevc", flashMode: "auto" })
console.log("Captured", result.image.size, result.metadata)
```

The resolved object has `image: UIImage`, `metadata: Record<string, any>`, and `isRawPhoto: boolean`.

---

## Movie recording

```ts
const movieOutput = new AVCaptureMovieFileOutput()
movieOutput.maxRecordedDuration = 60     // seconds; 0 = unlimited
session.addOutput(movieOutput)

await session.startRunning()
const path = `${FileManager.documentsDirectory}/clip.mov`
const finalPath = await movieOutput.startRecording(path)   // resolves when stopRecording() finalizes
// ... show UI / await user tap ...
await movieOutput.stopRecording()
console.log("saved", finalPath)
```

`startRecording` resolves when the file is fully finalized; do not delete the file before the promise resolves.

---

## QR / barcode scanning

`AVCaptureMetadataOutput` runs the system code detector on the live frames.

```ts
const metaOutput = new AVCaptureMetadataOutput()
session.configure(() => {
  if (session.canAddInput(input)) session.addInput(input)
  if (session.canAddOutput(metaOutput)) session.addOutput(metaOutput)
})

// Order matters — types must be set after the output is added.
metaOutput.metadataObjectTypes = ["qr", "ean13", "code128"]
metaOutput.setMetadataObjectsListener(objects => {
  for (const o of objects) {
    if (o.stringValue) console.log("scanned", o.type, o.stringValue)
  }
})

await session.startRunning()
```

Set `rectOfInterest = { x, y, width, height }` (normalized 0..1) to limit detection to a region of the frame.

Each detected object carries a raw `bounds` (normalized 0..1) and, for codes, raw `corners`. It also carries a `transformed` field whose `bounds` / `corners` are corrected for the connection's orientation and mirroring — use those when drawing an overlay on top of the preview:

```ts
metaOutput.setMetadataObjectsListener(objects => {
  for (const o of objects) {
    const box = o.transformed?.bounds ?? o.bounds   // {x,y,width,height}, 0..1
    // map box into your view's pixel rect and draw a highlight
  }
})
```

To convert a rectangle between an output's own coordinate space and the metadata output's normalized space, use `output.metadataOutputRectConverted({ x, y, width, height })` and its inverse `output.outputRectConverted(...)`. Both are available on every output and return `{ x, y, width, height }`.

---

## Showing a preview

Use `<CaptureVideoPreviewView session={session} videoDevice={camera}/>` in any UI you build with Scripting's view layer. See the `Preview View` page for the full prop list.

---

## Cleanup

When you are done with the session — typically in `onAppear`/`onDisappear` of your component, or before navigating away — stop and dispose:

```ts
await session.stopRunning()
session.dispose()
```

`dispose()` is idempotent. If you forget it, the wrapper is also released when the running script ends.

---

## Putting it all together

```ts
const camera = AVCaptureDevice.default("video")!
const session = new AVCaptureSession()
const input = new AVCaptureDeviceInput(camera)
const photoOutput = new AVCapturePhotoOutput()

session.configure(() => {
  session.sessionPreset = "photo"
  if (session.canAddInput(input)) session.addInput(input)
  if (session.canAddOutput(photoOutput)) session.addOutput(photoOutput)
})

session.addRuntimeErrorListener(msg => console.error("session error:", msg))

await session.startRunning()
const photo = await photoOutput.capturePhoto({ codec: "hevc" })
await session.stopRunning()
session.dispose()
```
