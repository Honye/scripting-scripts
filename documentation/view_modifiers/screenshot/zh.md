# screenshotRef

把已渲染的视图捕获为 `UIImage`。给任意视图挂上 `screenshotRef`,之后在该 ref 上调用
`screenshot()` 即可按需对这个视图(含其子视图)截图。

## `screenshotRef?: RefObject<ScreenshotMaker>`

用 `useRef` 创建 ref 并传给你想捕获的视图。视图渲染后,`ref.current` 会被设为一个
`ScreenshotMaker`。

```ts
abstract class ScreenshotMaker {
  // 把所挂视图渲染成图片;视图尚未上屏时返回 null。
  screenshot(): UIImage | null
}
```

- `screenshot()` 返回 `UIImage`;当视图尚未完成布局 / 不在屏幕上时返回 `null`。
- 在动作里调用(如按钮点击),不要在渲染过程中调用——视图必须先存在。

## 示例

捕获一张卡片并保存到相册:

```tsx
import {
  Button,
  Data,
  Image,
  Navigation,
  Photos,
  RoundedRectangle,
  Script,
  ScreenshotMaker,
  Text,
  useRef,
  useState,
  VStack,
} from "scripting"

function CaptureDemo() {
  const shotRef = useRef<ScreenshotMaker>()
  const [preview, setPreview] = useState<UIImage | null>(null)

  return (
    <VStack spacing={16} padding>
      {/* 要捕获的视图 */}
      <VStack
        screenshotRef={shotRef}
        spacing={8}
        padding
        background={
          <RoundedRectangle cornerRadius={16} fill="systemBlue" />
        }
      >
        <Text font="headline" foregroundStyle="white">Hello Scripting</Text>
        <Text font="subheadline" foregroundStyle="white">Snapshot me!</Text>
      </VStack>

      <Button
        title="Capture & Save"
        action={async () => {
          const image = shotRef.current?.screenshot()
          if (image == null) {
            console.log("view not ready")
            return
          }
          setPreview(image)

          const png = Data.fromPNG(image)
          if (png != null) {
            await Photos.savePhoto(png)
          }
        }}
      />

      {preview != null
        ? <Image image={preview} resizable scaleToFit frame={{ height: 160 }} />
        : null}
    </VStack>
  )
}

async function run() {
  await Navigation.present({ element: <CaptureDemo /> })
  Script.exit()
}

run()
```

## 说明

1. `screenshotRef` 可用于任意视图;捕获的图片覆盖该视图及其全部子视图。
2. ref 在视图渲染后才被填充;首次渲染前读取返回 `null`。
3. 编码结果用 `Data.fromPNG(image)` / `Data.fromJPEG(image, quality)`,再用 `Photos.savePhoto`
   保存,或用 `FileManager` 写入文件。
4. 用 `<Image image={...} />` 可直接显示捕获到的图片。
