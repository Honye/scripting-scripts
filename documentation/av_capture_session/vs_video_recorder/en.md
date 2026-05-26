Scripting ships two camera APIs that overlap intentionally. Pick the one that matches the shape of your problem.

## TL;DR

| You want to... | Use |
| --- | --- |
| Press record → save mp4 | `VideoRecorder` |
| Pause / resume during a single clip | `VideoRecorder` |
| Built-in audio session, orientation, encoder, file management | `VideoRecorder` |
| Scan QR / barcodes from live frames | `AVCaptureSession` + `AVCaptureMetadataOutput` |
| Custom photo capture (HEVC, flash, Live Photo) | `AVCaptureSession` + `AVCapturePhotoOutput` |
| Bind iPhone 16 Camera Control sliders / pickers | `AVCaptureSession` + `AVCaptureControl` |
| Multiple outputs in one session (photo + movie + metadata) | `AVCaptureSession` |
| Read raw `CMSampleBuffer` / `CVPixelBuffer` (future, not yet exposed) | `AVCaptureSession` |

## Concrete differences

`VideoRecorder` is a stateful singleton. It owns one capture session, one writer, one audio session, and a strict state machine (`idle → preparing → ready → recording → ...`). Most apps need exactly that. The trade-off: you cannot run two clips in parallel, attach extra outputs, or change the pipeline mid-flight.

`AVCaptureSession` is plain AVFoundation. Each instance is independent. You can construct multiple sessions, but only one will actually have access to the camera at any given moment — the OS arbitrates that.

If you start an `AVCaptureSession` while `VideoRecorder` is recording (or vice versa) you will get a runtime error from the second consumer. Build your UI to make these mutually exclusive — typically by deciding once at the top of the page which API to use.

## Migrating an existing VideoRecorder use case

Most VideoRecorder users do **not** need to migrate. Migrate if you find yourself:

* Calling `VideoRecorder.session` and reaching into AVFoundation by hand.
* Working around the state machine (e.g. wanting `recording` and `paused` to be flipped over multiple files).
* Needing `AVCaptureMetadataOutput` (QR scanning while recording).

Migration is a per-feature port: enumerate the device with `AVCaptureDevice`, wrap it with `AVCaptureDeviceInput`, attach `AVCaptureMovieFileOutput`, and replace state-listener calls with explicit promise chaining. See the `Quick Start` for the full pattern.

## Both at once

You **can** instantiate `AVCaptureSession` while `VideoRecorder` is `idle`. Just make sure to:

1. Call `await VideoRecorder.reset()` first if it was used earlier in the same script.
2. Call `await session.stopRunning(); session.dispose()` before letting the script return control to the user.
