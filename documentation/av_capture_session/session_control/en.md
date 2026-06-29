The three main things you need to worry about when using `AVCaptureSession` are:

* tap-to-focus and tap-to-meter (focus / exposure point of interest on the device)
* session interruption notifications (a phone call, another app grabbing the camera, system pressure)
* video stabilization on the movie output

These are all device / connection level — they don't change how you wire up inputs and outputs.

---

## Tap-to-focus / tap-to-meter

`AVCaptureDevice` exposes a focus point and an exposure point. Both are normalized to `0..1` of the **sensor frame** (not your preview view), with `(0, 0)` at the **top-left of the landscape-oriented sensor**. Most apps map a tap on the preview view into normalized sensor coordinates and then write both the focus point and the exposure point at once:

```ts
const camera = AVCaptureDevice.default("video")!

// Whenever the user taps the preview view, translate the tap into
// normalized sensor coords (your preview layer can do this for you in native;
// in JS you typically pre-compute once per layout).
function tap(at: { x: number; y: number }) {
  if (camera.isFocusPointOfInterestSupported) {
    camera.setFocusPointOfInterest(at)
    camera.setFocusMode("autoFocus")          // single-shot AF at that point
  }
  if (camera.isExposurePointOfInterestSupported) {
    camera.setExposurePointOfInterest(at)
    camera.setExposureMode("continuousAutoExposure")
  }
}
```

A few gotchas:

* `setFocusPointOfInterest` and `setExposurePointOfInterest` are silent no-ops on devices that don't support them — guard with the `is*Supported` flag if you want to surface that to the user.
* These setters acquire the device configuration lock internally; you don't need to wrap them in `lockForConfiguration()`.
* Setting only the point doesn't trigger a refocus — you also need a focus mode (`autoFocus` for one-shot, `continuousAutoFocus` for tracking) and / or an exposure mode change.

---

## Session interruptions

iOS will sometimes pull the camera out from under you: an incoming call, another app moving to the foreground with multi-app support, FaceTime taking the front camera, system thermal pressure. The session keeps running in the background but is paused — your preview will look frozen until iOS hands the hardware back.

Subscribe to know when this happens:

```ts
session.addInterruptionListener((event, reason) => {
  if (event === "began") {
    // Show a "camera unavailable" overlay.
    console.log("interrupted because:", reason)
  } else {
    // Hide the overlay; the session will resume on its own.
    console.log("interruption ended")
  }
})
```

`reason` is one of:

| Reason | When it fires |
|---|---|
| `videoDeviceNotAvailableInBackground` | Your app went to the background |
| `audioDeviceInUseByAnotherClient` | Another app holds the microphone (e.g. a phone call) |
| `videoDeviceInUseByAnotherClient` | Another app holds the camera (e.g. FaceTime) |
| `videoDeviceNotAvailableWithMultipleForegroundApps` | iPad split-view took the camera away |
| `videoDeviceNotAvailableDueToSystemPressure` | Device is too hot or low on resources |
| `sensitiveContentMitigationActivated` | System content blur is engaged |
| `unknown` | New reason added in a future iOS that this build doesn't recognize |

`event === "ended"` always passes an empty string — there is no "reason" for the resume.

You don't need to call `startRunning()` again after `"ended"`. The session resumes automatically.

---

## Video stabilization

The system can apply optical / sensor stabilization on the recorded video. You set a *preferred* mode on the movie output's video connection — the system decides whether to actually activate it based on the active format and device capability. Always read back the active mode if you want to know what's really happening.

```ts
const movieOutput = new AVCaptureMovieFileOutput()
session.addOutput(movieOutput)

// Pick one before you start recording.
movieOutput.setVideoStabilizationMode("auto")

// After startRunning(), this reflects what the system actually picked:
console.log("active stabilization:", movieOutput.videoStabilizationMode)
```

| Mode | Notes |
|---|---|
| `off` | No stabilization. |
| `standard` | Conservative; good general-purpose default. |
| `cinematic` | Heavier crop, smoother result; more processing cost. |
| `cinematicExtended` | Even heavier crop, designed for handheld walking shots. |
| `auto` | Let iOS pick based on movement and lighting. |

Notes:

* Stabilization is applied per **connection**, not per session. If you swap the device-input or rebuild the connection, you need to set the mode again.
* `setVideoStabilizationMode("...")` returns `false` if the movie output isn't attached to a session yet (no video connection exists). Set the mode after `session.addOutput(movieOutput)`.
* Throwing happens only on an unknown mode string — a misspell will surface immediately.
* `videoStabilizationMode` is **active**, not requested. The system may downgrade or disable it silently if the active format doesn't support it.

## Pause / resume and recording progress

A movie recording can be paused and resumed without producing a new file. Both calls are safe no-ops if you call them out of state, and on iOS below 18 (where `isRecordingPaused` is always `false`).

```ts
await movieOutput.startRecording(filePath)

movieOutput.pauseRecording()
console.log(movieOutput.isRecordingPaused)   // true
movieOutput.resumeRecording()

// Live progress while recording:
console.log("seconds:", movieOutput.recordedDuration)
console.log("bytes:", movieOutput.recordedFileSize)

const path = await movieOutput.stopRecording()  // the promise from startRecording resolves here
```

`recordedDuration` (seconds) and `recordedFileSize` (bytes) reflect the current recording and return `0` when not recording. Query `availableVideoCodecTypes` for the codecs the output can record (native raw values such as `"hvc1"` / `"avc1"`).
