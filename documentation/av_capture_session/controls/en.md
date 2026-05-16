iOS 18 introduced the **Camera Control** — the dedicated hardware button on iPhone 16 (and on-screen control surface on other devices) that lets people adjust capture settings without diving into your UI. AVFoundation models this as a list of `AVCaptureControl` instances attached to the running `AVCaptureSession`. Scripting bridges all of them.

## Detecting support

The hardware Camera Control only ships on iPhone 16 and later. Always feature-detect:

```ts
if (!session.supportsControls) {
  // Fall back to plain on-screen UI; do not call addControl/setControlsDelegate.
  return
}
console.log(`max controls: ${session.maxControlsCount}`)
```

`session.supportsControls` is safe to call on older devices — Scripting wraps it with a `respondsToSelector` check so it just returns `false` rather than crashing.

## Built-in system controls

The two most common controls are provided by the system; pass the device they should bind to:

```ts
const camera = AVCaptureDevice.default("video")!
const zoom = new AVCaptureSystemZoomSlider(camera, value => {
  console.log("zoom →", value)
})
const exposure = new AVCaptureSystemExposureBiasSlider(camera, value => {
  console.log("exposure bias →", value)
})

session.configure(() => {
  if (session.canAddControl(zoom)) session.addControl(zoom)
  if (session.canAddControl(exposure)) session.addControl(exposure)
})
```

The system writes the zoom factor / exposure bias straight back to the device for you. The action callback is purely informational — use it to update your own UI.

## Custom slider

Continuous, stepped, or discrete-values:

```ts
// Continuous, formatted as ƒ-stops
const aperture = new AVCaptureSlider("Aperture", "camera.aperture", {
  range: [1.2, 16],
  defaultValue: 1.8,
  localizedValueFormat: "ƒ%.1f",
})

// Stepped (discrete) slider
const evStep = new AVCaptureSlider("EV", "sun.max", {
  range: [-2, 2],
  step: 0.33,
  prominentValues: [-1, 0, 1],
})

// Pre-defined values
const iso = new AVCaptureSlider("ISO", "circle.fill", {
  values: [50, 100, 200, 400, 800, 1600, 3200],
  defaultValue: 200,
  localizedValueFormat: "ISO %.0f",
})

aperture.setActionHandler(value => updateAperture(value))
```

Pass any [SF Symbols](https://developer.apple.com/sf-symbols/) name; Scripting does not validate it. If the symbol cannot be resolved at runtime the control simply renders without an icon.

## Custom index picker

Use this when titles are non-numeric or non-uniform:

```ts
const wb = new AVCaptureIndexPicker("White Balance", "camera.filters", {
  localizedIndexTitles: ["Auto", "Daylight", "Cloudy", "Tungsten"],
  defaultIndex: 0,
})
wb.setActionHandler(index => applyWhiteBalance(index))
```

## Adding controls to the session

`addControl(...)` follows the same rules as inputs/outputs: prefer `configure(...)` so the changes commit atomically. Adding more than `maxControlsCount` is a no-op (`canAddControl` returns `false`).

```ts
session.configure(() => {
  if (session.canAddControl(zoom)) session.addControl(zoom)
  if (session.canAddControl(aperture)) session.addControl(aperture)
  if (session.canAddControl(wb)) session.addControl(wb)
})
```

## Receiving lifecycle events

`AVCaptureSessionControlsDelegate` tells you when the system Camera Control UI shows / hides — useful for dimming your own overlay while the system control is on screen.

```ts
session.setControlsDelegate({
  didBecomeActive: () => setSystemControlVisible(true),
  willEnterFullscreenAppearance: () => setOverlayDimmed(true),
  willExitFullscreenAppearance: () => setOverlayDimmed(false),
  didBecomeInactive: () => setSystemControlVisible(false),
})
```

Pass `null` to remove the delegate.

## Hooking the hardware button to capture

The hardware Camera Control button does **not** dispatch through your control delegate by default — you must attach an `AVCaptureEventInteraction`. Without it, half-presses and full-presses are silently swallowed:

```ts
const interaction = new AVCaptureEventInteraction((phase, kind) => {
  if (phase === "ended" && kind === "primary") {
    photoOutput.capturePhoto({ codec: "hevc" })
  }
})
interaction.attach()

// when leaving the page:
interaction.detach()
```

`phase` is `"began" | "ended" | "cancelled"`. `kind` is `"primary"` for the main press and `"secondary"` for half-press / focus events.

## Common pitfalls

* **Delegate never fires.** You forgot `setControlsDelegate(...)`, or the session never started running.
* **Hardware press does nothing.** You forgot `new AVCaptureEventInteraction(...).attach()`.
* **`supportsControls` is `false`.** Either you are on a device without the hardware Camera Control, or the session has not been configured yet — always check after `addInput(...)`.
* **Custom slider does not show.** Either the SF Symbol name is wrong, or `maxControlsCount` is exceeded — Scripting silently drops the `addControl` call in both cases.
