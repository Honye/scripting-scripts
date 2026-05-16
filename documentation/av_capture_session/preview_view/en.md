`<CaptureVideoPreviewView/>` is the SwiftUI surface for rendering a live preview of any `AVCaptureSession` you have built. It mirrors `<VideoRecorderPreviewView/>` but accepts an arbitrary session, so it works with the pipelines you assemble manually.

```tsx
<CaptureVideoPreviewView
  session={session}
  videoDevice={camera}
  videoGravity="resizeAspectFill"
  cornerRadius={12}
  masksToBounds
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `session` | `AVCaptureSession` | required | The session to render. Must already have a video input attached to actually show frames. |
| `videoDevice` | `AVCaptureDevice` | optional | Pass the device backing the input. Doing so enables `AVCaptureDevice.RotationCoordinator`, so the preview rotates with the device. Without it the preview keeps the connection's default orientation. |
| `videoGravity` | `'resize' \| 'resizeAspect' \| 'resizeAspectFill'` | `'resizeAspectFill'` | Same semantics as `AVLayerVideoGravity`. |
| `isVideoMirrored` | `boolean` | system default | Force the connection's `videoMirrored` flag (e.g. mirror front camera). |
| `cornerRadius` | `number` | `0` | Convenience for rounded preview tiles. Set `masksToBounds` if you need clipping. |
| `masksToBounds` | `boolean` | `false` | Apply `masksToBounds` to the preview layer (turn on for `cornerRadius`). |

## Lifecycle

The preview view does **not** start or stop the session for you — call `session.startRunning()` from JavaScript when you want frames flowing. A typical SwiftUI-style pattern:

```tsx
function CameraPage() {
  const session = useMemo(() => buildSession(), [])

  useEffect(() => {
    session.startRunning()
    return () => {
      session.stopRunning()
      session.dispose()
    }
  }, [])

  return (
    <VStack>
      <CaptureVideoPreviewView session={session} videoDevice={camera} />
      <Button title="Capture" action={() => photoOutput.capturePhoto()} />
    </VStack>
  )
}
```

## Notes

* The same `AVCaptureSession` may only be rendered by one preview view at a time.
* Changing `videoGravity` / `isVideoMirrored` / `cornerRadius` after the view has rendered re-applies them on the next layout pass.
* For multi-cam setups (multiple inputs in the same session) use a single preview view; AVFoundation does the compositing internally.
