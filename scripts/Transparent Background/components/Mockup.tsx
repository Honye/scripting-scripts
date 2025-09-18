import { Image, Path, Script, useMemo, type DynamicImageSource } from 'scripting'

type ImageSource = UIImage | DynamicImageSource<UIImage> | string | DynamicImageSource<string>
const iPhone11 = UIImage.fromFile(
  Path.join(Script.directory, 'assets/iPhone-11.png')
)

export default function Mockup({ screenshot }: { screenshot: ImageSource}) {
  const attrs = useMemo(() => {
    if (typeof screenshot === 'string') return { imageUrl: screenshot }
    if (screenshot instanceof UIImage) return { image: screenshot }
    if (typeof screenshot.light === 'string') return { imageUrl: screenshot as DynamicImageSource<string> }
    return { image: screenshot as DynamicImageSource<UIImage> }
  }, [screenshot])

  const scale = Device.isiOSAppOnMac ? 0.32 : 0.5
  const screenshotFrame = { width: 414 * scale, height: 896 * scale }
  const phoneFrame = { width: 514 * scale, height: 996 * scale }

  return (
    <Image
      {...attrs}
      resizable
      frame={screenshotFrame}
      overlay={
        iPhone11 ?
          <Image resizable frame={phoneFrame} image={iPhone11} />
        : undefined
      }
    />
  )
}
