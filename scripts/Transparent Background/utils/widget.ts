import { Path, type ColorStringRGBA } from 'scripting'

export interface WidgetFrame {
  small: number,
  medium: number,
  large: number,
  left: number,
  right: number,
  top: number,
  middle: number,
  bottom: number
}

export interface WidgetJSON {
  root: string
  icon: string
  version: string
  name: string
  color: ColorStringRGBA
  author: string
}

export function getWidgetFrame(screenHeight: number) {
  const devices: Record<number, WidgetFrame> = {
    /** 11, XR */
    1792: {
      small: 338,
      medium: 720,
      large: 758,
      left: 54,
      right: 436,
      top: 160,
      middle: 580,
      bottom: 1000
    },
  }
  const device = devices[screenHeight]
  if (device) return device
  return null
}

export function getAllWidgets() {
  const dir = FileManager.scriptsDirectory
  const content = FileManager.readDirectorySync(dir)
  const widgets: WidgetJSON[] = []
  for (const name of content) {
    const scriptDir = Path.join(dir, name)
    const isWidget = FileManager.existsSync(Path.join(scriptDir, 'widget.tsx'))
    if (!isWidget) continue
    const jsonPath = Path.join(scriptDir, 'script.json')
    if (FileManager.existsSync(jsonPath)) {
      try {
        const json = JSON.parse(FileManager.readAsStringSync(jsonPath, 'utf-8'))
        json.root = scriptDir
        widgets.push(json)
      } catch(e) {}
    }
  }
  return widgets
}
