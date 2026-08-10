# screenshotRef

Captures a rendered view as a `UIImage`. Attach `screenshotRef` to any view, then call
`screenshot()` on the ref to snapshot that view (including its subviews) on demand.

## `screenshotRef?: RefObject<ScreenshotMaker>`

Create the ref with `useRef` and pass it to the view you want to capture. Once the view has
rendered, `ref.current` is set to a `ScreenshotMaker`.

```ts
abstract class ScreenshotMaker {
  // Renders the attached view into an image. Returns null if the view is not on screen yet.
  screenshot(): UIImage | null
}
```

- `screenshot()` returns a `UIImage`, or `null` when the view has not been laid out / is off screen.
- Call it inside an action (e.g. a button tap), not during rendering — the view must exist first.

## Example

Capture a card and save it to the photo library:

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
      {/* The view to capture */}
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

## Notes

1. `screenshotRef` works on any view. The captured image covers the view and all of its subviews.
2. The ref is filled after the view renders; reading it before the first render returns `null`.
3. To encode the result, use `Data.fromPNG(image)` / `Data.fromJPEG(image, quality)`, then save
   with `Photos.savePhoto` or write it to a file with `FileManager`.
4. Display a captured image directly with `<Image image={...} />`.
