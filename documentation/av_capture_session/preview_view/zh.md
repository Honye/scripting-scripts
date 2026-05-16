`<CaptureVideoPreviewView/>` 是给你自己组装的 `AVCaptureSession` 用的预览组件。和 `<VideoRecorderPreviewView/>` 一致,但接受任意 session,可以挂到自己搭的 pipeline 上。

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

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `session` | `AVCaptureSession` | 必填 | 要预览的 session。需要至少有一个 video input,否则黑屏。 |
| `videoDevice` | `AVCaptureDevice` | 可选 | 传入背后的 device 后会启用 `AVCaptureDevice.RotationCoordinator`,预览会随设备旋转;不传则保留 connection 默认方向。 |
| `videoGravity` | `'resize' \| 'resizeAspect' \| 'resizeAspectFill'` | `'resizeAspectFill'` | 等同于 `AVLayerVideoGravity`。 |
| `isVideoMirrored` | `boolean` | 系统默认 | 强制 connection 的 `videoMirrored`,例如前置摄像头镜像。 |
| `cornerRadius` | `number` | `0` | 预览圆角。需要裁剪请同时开 `masksToBounds`。 |
| `masksToBounds` | `boolean` | `false` | 给预览 layer 加 `masksToBounds`。 |

## 生命周期

预览组件**不**主动启停 session——什么时候出帧由 JS 端 `session.startRunning()` 控制。典型的 SwiftUI 写法:

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
      <Button title="拍照" action={() => photoOutput.capturePhoto()} />
    </VStack>
  )
}
```

## 注意

* 同一个 `AVCaptureSession` 同一时刻只能挂在一个预览 view 上。
* 改 `videoGravity` / `isVideoMirrored` / `cornerRadius` 会在下一次 layout 时生效。
* 多镜头(同一 session 多 input)只挂一个预览即可,合成由 AVFoundation 内部完成。
