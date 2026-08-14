import type { Color } from 'scripting'

type DynamicColor = { light: Color; dark: Color }

/**
 * 键盘配色。
 *
 * 前景色一律用系统语义色（`label` / `secondaryLabel` / `systemBlue`），
 * 它们会跟随浅色/深色自动反转，不需要手写两套。
 * 背景色系统语义色对不上键盘的灰底，所以显式给出 light / dark 两个值。
 *
 * 注意：不要用 `#RRGGBBAA` 这种带 alpha 的十六进制表示透明，
 * 解析不了会退化成白色。需要透明请用关键字 `clear`，或者干脆不渲染这个形状。
 */

/** 键盘整体背景 */
export const KB_BACKGROUND: DynamicColor = { light: '#d1d3d8', dark: '#2c2c2e' }

/** 普通按键 / 图标格子的底色 */
export const KEY_BACKGROUND: DynamicColor = { light: '#ffffff', dark: '#5b5b5e' }

/** 按下 / 选中态的按键底色 */
export const KEY_BACKGROUND_ACTIVE: DynamicColor = { light: '#c9d3e0', dark: '#4a4a4c' }

/** 左侧分类栏选中项的底色 */
export const SIDEBAR_ACTIVE_BACKGROUND: DynamicColor = { light: '#ffffff', dark: '#48484a' }

/** 主文字 / 图标 */
export const FG_PRIMARY: Color = 'label'

/** 次要文字 */
export const FG_SECONDARY: Color = 'secondaryLabel'

/** 强调色（选中的分类） */
export const FG_ACCENT: Color = 'systemBlue'

/** 完全透明 */
export const CLEAR: Color = 'clear'
