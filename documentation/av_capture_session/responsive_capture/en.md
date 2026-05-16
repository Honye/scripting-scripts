A family of `AVCapturePhotoOutput` switches that change how the capture pipeline behaves between shots. None of them change the photo *quality* — they change *when* you can take the next shot, and *how soon* you get a usable image back from the current one.

---

## `isZeroShutterLagEnabled`

Builds a rolling buffer of recent frames so a tap captures the moment *just before* the tap, not after. Most useful for action shots — kids, pets, sports.

* Defaults to `true` on devices where it's supported (iPhone XS / XR and newer).
* Set to `false` if you want strictly the moment of the tap (rare).

```ts
if (photoOutput.isZeroShutterLagSupported) {
  photoOutput.isZeroShutterLagEnabled = true
}
```

---

## `isResponsiveCaptureEnabled` + `isFastCapturePrioritizationEnabled`

These are a **pair**. They let the pipeline finish the current photo's processing in the background while the user keeps tapping.

**Order matters.** Apple gates `isFastCapturePrioritizationSupported` on `isResponsiveCaptureEnabled = true` (and `maxPhotoQualityPrioritization = "quality"`). So turn responsive on first — *then* fast becomes supported.

```ts
photoOutput.maxPhotoQualityPrioritization = "quality"

if (photoOutput.isResponsiveCaptureSupported) {
  photoOutput.isResponsiveCaptureEnabled = true
}
// fastSupp only flips to true after the line above runs.
if (photoOutput.isFastCapturePrioritizationSupported) {
  photoOutput.isFastCapturePrioritizationEnabled = true
}
```

If you flip them out of order from JS, the bridge fixes it: setting `fast = true` first will turn `responsive` on if supported, and turning `responsive = false` first turns `fast` off. So this also works:

```ts
photoOutput.isFastCapturePrioritizationEnabled = true   // responsive gets auto-enabled
```

If `fastSupp` stays `false` even after `responsive` is on, the active format / preset doesn't allow it — fast is silently ignored. Common blockers: `maxPhotoQualityPrioritization` not `"quality"`, `isLivePhotoCaptureEnabled = true`, or a non-`photo` session preset.

---

## `isAutoDeferredPhotoDeliveryEnabled` (read this carefully)

Deferred Photo Delivery lets you tap the shutter again *immediately*, without waiting for the previous photo's full processing pipeline (Deep Fusion, Photonic Engine, Smart HDR) to finish. Apple does this by handing your app a "proxy" right away and finalizing the real photo asynchronously.

The catch — and the reason this section is much longer than the others — is that **the finalized photo never comes back through `capturePhoto()`**.

### What you actually get

When deferred kicks in, `capturePhoto()` resolves with:

```ts
{
  image: UIImage,         // ← this is the PROXY, not the final
  metadata: {...},
  isRawPhoto: false,
  isDeferredProxy: true,
}
```

The `image` is an *unfinished* version of the photo: a quick render the system can produce in milliseconds. Visually it has more noise, less detail, and a weaker dynamic range than the final. It's perfectly fine for "show the user what they just shot" thumbnails, but it is **not the photo you want to keep**.

The system finalizes the real photo on its own clock — usually within seconds, but it can take longer if the device is busy or you've gone to background — and writes the result **directly to the user's Photo Library**. There is **no callback** into your app.

### So how do I get the final photo?

Use PhotoKit. Query the user's Photo Library for the most recent image after the proxy resolves:

```ts
photoOutput.isAutoDeferredPhotoDeliveryEnabled = true

const result = await photoOutput.capturePhoto()
if (result.isDeferredProxy) {
  // result.image is the proxy. Show it as a thumbnail.
  showThumbnail(result.image)
  // The final image will appear in the Photo Library on its own.
  // If your script needs it, you'll have to use Photo.getLastestPhotos or Photo.pickPhotos
}
```

### When *not* to enable this

If your script wants the photo bytes immediately (for upload, processing, file save) and doesn't have or want Photo Library permission, **leave deferred off**. The default behavior — wait for the final, then resolve — is the right one for most scripts.

You'd opt in when:

* You're building a tap-many-photos-in-a-row UI and need quick feedback per shot
* You're already saving everything to the Photo Library anyway
* You'd rather show a less-perfect preview now than a spinner

---

## Detection cheat sheet

| Flag | Min device |
|---|---|
| `isZeroShutterLagEnabled` | iPhone XS / XR+ |
| `isResponsiveCaptureEnabled` | iPhone 12+ (varies by lens) |
| `isFastCapturePrioritizationEnabled` | iPhone 12+ |
| `isAutoDeferredPhotoDeliveryEnabled` | iPhone 11 Pro+ |
