import { Path, Script, type WidgetFamily, type DynamicImageSource } from 'scripting'
import { darkDir, lightDir } from "./common"
import { getWidgetFrame, WidgetFrame } from './widget'

export async function sliceImage(base64: string, { x, y, width, height }: {
  x: number
  y: number
  width: number
  height: number
}) {
  const controller = new WebViewController()
  const sliceBase64 = await controller.evaluateJavaScript(`
    const x = ${x}
    const y = ${y}
    const width = ${width}
    const height = ${height}
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = async () => {
        const canvas = new OffscreenCanvas(width, height)
       const ctx = canvas.getContext('2d')
       ctx.drawImage(image, x, y, width, height, 0, 0, width, height)
       const blob = await canvas.convertToBlob({ type: 'image/jpeg' })
       const reader = new FileReader()
       reader.onload = () => {
         resolve(reader.result)
       }
       reader.readAsDataURL(blob)
      }
      image.onerror = (e) => {
        reject(e)
      }
      image.src = 'data:image/jpeg;base64,${base64}'
    })
  `)
  const data = Data.fromBase64String(sliceBase64.replace(/^data:image\/jpeg;base64,/, ''))
  return data
  // if (data) {
  //   await FileManager.writeAsData(
  //     Path.join(lightDir, 'medium.jpg'),
  //     data
  //   )
  // }
}

function createSliceSaver(screenshot: Data, frame: WidgetFrame) {
  async function saveBgSlice(widgetFamily: 'systemSmall', position: 'top-left'|'top-right'|'middle-left'|'middle-right'|'bottom-left'|'bottom-right'): Promise<void>
  async function saveBgSlice(widgetFamily: 'systemMedium', position: 'top'|'middle'|'bottom'): Promise<void>
  async function saveBgSlice(widgetFamily: 'systemLarge', position: 'top'|'middle'): Promise<void>
  async function saveBgSlice(widgetFamily: WidgetFamily, position: string): Promise<void> {
    const dir = Device.colorScheme === 'dark' ? darkDir : lightDir

    const x = /right$/.test(position) ? frame.right : frame.left
    const y = /^top/.test(position) ? frame.top : /^middle/.test(position) ? frame.middle : frame.bottom
    const width = widgetFamily === 'systemSmall' ? frame.small : frame.medium
    const height = widgetFamily === 'systemLarge' ? frame.large : frame.small

    const screenshotBase64 = screenshot.toBase64String()
    const sliceData = await sliceImage(
      screenshotBase64,
      { x, y, width, height }
    )
    if (sliceData) {
      await FileManager.writeAsData(
        Path.join(dir, `${widgetFamily}-${position}.jpg`),
        sliceData
      )
    }
  }
  return saveBgSlice
}


export async function sliceWallpaper() {
  const { colorScheme, screen } = Device
  const dir = colorScheme === 'dark' ? darkDir : lightDir
  const filePath = Path.join(dir, 'screenshot.jpg')
  if (!FileManager.exists(filePath)) {
    return false
  }
  const data = Data.fromFile(filePath)
  if (!data) return false

  const frame = getWidgetFrame(screen.height * screen.scale)
  if (!frame) return

  const saveBgSlice = createSliceSaver(data, frame)

  await saveBgSlice('systemSmall', 'top-left')
  await saveBgSlice('systemSmall', 'top-right')
  await saveBgSlice('systemSmall', 'middle-left')
  await saveBgSlice('systemSmall', 'middle-right')
  await saveBgSlice('systemSmall', 'bottom-left')
  await saveBgSlice('systemSmall', 'bottom-right')

  await saveBgSlice('systemMedium', 'top')
  await saveBgSlice('systemMedium', 'middle')
  await saveBgSlice('systemMedium', 'bottom')

  await saveBgSlice('systemLarge', 'top')
  await saveBgSlice('systemLarge', 'middle')
}

export function getBackground(family: string, position: string): UIImage | DynamicImageSource<UIImage> | null {
  const dir = Path.join(Script.directory, `wallpapers`)
  const lightImage = UIImage.fromFile(Path.join(dir, `light/${family}-${position}.jpg`))
  const darkImage = UIImage.fromFile(Path.join(dir, `dark/${family}-${position}.jpg`))
  if (lightImage && darkImage) {
    return ({
      light: lightImage,
      dark: darkImage
    })
  }
  return (Device.colorScheme === 'dark' ? darkImage : lightImage) || lightImage || darkImage
}
