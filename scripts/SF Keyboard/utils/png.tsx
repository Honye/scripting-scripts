import { ImageRenderer, Image, ZStack } from 'scripting'
import { t } from '../constants/i18n'
import { backgroundColor, foregroundStyleOf, type SymbolStyle } from '../constants/symbolStyle'
import { loadStyle } from './styleStore'

export const PNG_PRESETS: { label: string; size: number }[] = [
  { label: t.pngSmall, size: 64 },
  { label: t.pngMedium, size: 128 },
  { label: t.pngLarge, size: 256 },
]

export type PngOptions = {
  /** 边长（pt），实际像素是它的 2 倍 */
  size?: number
  scale?: number
  /** 不传就用共享存储里保存的主题 */
  style?: SymbolStyle
}

/** 把 SF Symbol 按当前主题渲染成 PNG Data */
export async function renderSymbolPng(name: string, options: PngOptions = {}): Promise<Data> {
  const size = options.size ?? 128
  const scale = options.scale ?? 2
  const style = options.style ?? loadStyle()
  const background = backgroundColor(style.background)

  const element = (
    <ZStack frame={{ width: size, height: size }} background={background ?? undefined}>
      <Image
        systemName={name}
        variableValue={style.variable ? style.variableValue : undefined}
        resizable
        aspectRatio={{ value: null, contentMode: 'fit' }}
        frame={{ width: size * 0.76, height: size * 0.76 }}
        symbolRenderingMode={style.renderingMode}
        foregroundStyle={foregroundStyleOf(style)}
      />
    </ZStack>
  )

  return ImageRenderer.toPNGData(element, {
    scale,
    opaque: background != null,
  })
}

/** 渲染并写入剪贴板，返回是否成功 */
export async function copySymbolAsPng(name: string, options: PngOptions = {}): Promise<boolean> {
  try {
    const data = await renderSymbolPng(name, options)
    if (UIImage.fromData(data) == null) return false
    // Pasteboard.Item 的类型声明要求列出所有 UTType，这里只提供需要的两种
    const item = {
      'public.png': data,
      'public.plain-text': name,
    } as unknown as Pasteboard.Item
    await Pasteboard.setItems([item])
    return true
  } catch (e) {
    console.error('复制 PNG 失败', e)
    return false
  }
}

/** 导出 PNG 文件（App 内使用，弹出「存储到文件」） */
export async function exportSymbolPngFile(name: string, options: PngOptions = {}): Promise<boolean> {
  try {
    const data = await renderSymbolPng(name, options)
    const result = await DocumentPicker.exportFiles({
      files: [{ data, name: `${name}.png` }],
    })
    return result.length > 0
  } catch (e) {
    console.error('导出 PNG 失败', e)
    return false
  }
}
