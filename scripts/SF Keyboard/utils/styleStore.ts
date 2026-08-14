import {
  DEFAULT_ANIMATION,
  DEFAULT_STYLE,
  normalizeAnimation,
  type SymbolAnimation,
  type SymbolStyle,
} from '../constants/symbolStyle'

/**
 * 主题 / 动画设置存在共享域，键盘扩展和 App 读的是同一份，
 * 所以在 App 里调好配色之后，键盘长按复制出来的 PNG 也是同一套样式。
 */

const STYLE_KEY = 'sfkb.style'
const ANIMATION_KEY = 'sfkb.animation'
const SHARED = { shared: true }

export function loadStyle(): SymbolStyle {
  try {
    const stored = Storage.get<Partial<SymbolStyle>>(STYLE_KEY, SHARED)
    if (stored && typeof stored === 'object') return { ...DEFAULT_STYLE, ...stored }
  } catch (e) {
    console.error('读取主题设置失败', e)
  }
  return DEFAULT_STYLE
}

export function saveStyle(style: SymbolStyle) {
  Storage.set(STYLE_KEY, style, SHARED)
}

export function loadAnimation(): SymbolAnimation {
  try {
    const stored = Storage.get<Partial<SymbolAnimation>>(ANIMATION_KEY, SHARED)
    if (stored && typeof stored === 'object') {
      return normalizeAnimation({ ...DEFAULT_ANIMATION, ...stored })
    }
  } catch (e) {
    console.error('读取动画设置失败', e)
  }
  return DEFAULT_ANIMATION
}

export function saveAnimation(animation: SymbolAnimation) {
  Storage.set(ANIMATION_KEY, animation, SHARED)
}

export function resetStyle() {
  Storage.remove(STYLE_KEY, SHARED)
  Storage.remove(ANIMATION_KEY, SHARED)
}
