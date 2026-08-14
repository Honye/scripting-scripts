import { ImageRenderer, Image, ZStack } from 'scripting'
import { t } from '../constants/i18n'
import type { PngExportOptions } from '../types'

export const PNG_PRESETS: { label: string; size: number }[] = [
  { label: t.pngSmall, size: 64 },
  { label: t.pngMedium, size: 128 },
  { label: t.pngLarge, size: 256 },
]

export const DEFAULT_PNG_OPTIONS: PngExportOptions = {
  size: 128,
  scale: 2,
  color: '#000000',
  background: null,
}

/** 把 SF Symbol 渲染成 PNG Data */
export async function renderSymbolPng(
  name: string,
  options: Partial<PngExportOptions> = {}
): Promise<Data> {
  const opts = { ...DEFAULT_PNG_OPTIONS, ...options }
  const element = (
    <ZStack
      frame={{ width: opts.size, height: opts.size }}
      background={opts.background ?? undefined}
    >
      <Image
        systemName={name}
        resizable
        aspectRatio={{ value: null, contentMode: 'fit' }}
        frame={{ width: opts.size * 0.76, height: opts.size * 0.76 }}
        foregroundStyle={opts.color}
      />
    </ZStack>
  )

  return ImageRenderer.toPNGData(element, {
    scale: opts.scale,
    opaque: opts.background != null,
  })
}

/** 渲染并写入剪贴板，返回是否成功 */
export async function copySymbolAsPng(
  name: string,
  options: Partial<PngExportOptions> = {}
): Promise<boolean> {
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
export async function exportSymbolPngFile(
  name: string,
  options: Partial<PngExportOptions> = {}
): Promise<boolean> {
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
