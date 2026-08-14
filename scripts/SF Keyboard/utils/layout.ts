/**
 * 键盘尺寸自适应。参考 AI Keyboard 的做法，按屏幕宽度插值。
 */

function interpolate(
  current: number,
  minWidth: number,
  maxWidth: number,
  minValue: number,
  maxValue: number
): number {
  if (current <= minWidth) return minValue
  if (current >= maxWidth) return maxValue
  const ratio = (current - minWidth) / (maxWidth - minWidth)
  return minValue + ratio * (maxValue - minValue)
}

export type KeyboardLayout = {
  /** 键盘总高度 */
  totalHeight: number
  /** 左侧分类栏宽度 */
  sidebarWidth: number
  /** 图标格子边长 */
  cellSize: number
  /** 图标字号 */
  iconSize: number
  /** 网格间距 */
  spacing: number
  /** 底部工具条高度 */
  toolbarHeight: number
  /** 顶部信息条高度 */
  headerHeight: number
  /** 每行列数 */
  columns: number
}

export function getKeyboardLayout(): KeyboardLayout {
  const width = Device.isiOSAppOnMac ? 740 : Device.screen.width

  const totalHeight = Math.round(interpolate(width, 320, 450, 268, 330))
  const sidebarWidth = Math.round(interpolate(width, 320, 450, 62, 76))
  const cellSize = Math.round(interpolate(width, 320, 450, 42, 50))
  const iconSize = Math.round(interpolate(width, 320, 450, 20, 24))
  const spacing = Math.round(interpolate(width, 320, 450, 4, 7))
  const toolbarHeight = Math.round(interpolate(width, 320, 450, 40, 46))
  const headerHeight = Math.round(interpolate(width, 320, 450, 28, 32))

  const gridWidth = width - sidebarWidth - spacing * 2
  const columns = Math.max(4, Math.floor(gridWidth / (cellSize + spacing)))

  return {
    totalHeight,
    sidebarWidth,
    cellSize,
    iconSize,
    spacing,
    toolbarHeight,
    headerHeight,
    columns,
  }
}
