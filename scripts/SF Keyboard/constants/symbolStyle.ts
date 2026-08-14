import type { Color, SymbolEffect, SymbolRenderingMode } from 'scripting'
import { pick } from './i18n'

// ---------------------------------------------------------------- 主题

export type SymbolBackground = 'none' | 'white' | 'black'

export type SymbolStyle = {
  renderingMode: SymbolRenderingMode
  /** 前景色是否用渐变 */
  gradient: boolean
  /** 是否演示「可变」符号 */
  variable: boolean
  /** 可变值 0~1 */
  variableValue: number
  /** 前景色，'label' 表示跟随系统 */
  color: Color
  /** 不透明度 0~1 */
  opacity: number
  background: SymbolBackground
}

export const DEFAULT_STYLE: SymbolStyle = {
  renderingMode: 'monochrome',
  gradient: false,
  variable: false,
  variableValue: 1,
  color: 'label',
  opacity: 1,
  background: 'none',
}

export const RENDERING_MODES: { value: SymbolRenderingMode; label: string }[] = [
  { value: 'monochrome', label: pick('单色', 'Monochrome') },
  { value: 'hierarchical', label: pick('分层', 'Hierarchical') },
  { value: 'palette', label: pick('调色板', 'Palette') },
  { value: 'multicolor', label: pick('多色', 'Multicolor') },
]

/** 取色盘。用十六进制而不是语义色，导出 PNG 时才能拿到确定的颜色 */
export const COLOR_PRESETS: { value: Color; label: string }[] = [
  { value: 'label', label: pick('默认', 'Default') },
  { value: '#FF3B30', label: pick('红色', 'Red') },
  { value: '#FF9500', label: pick('橙色', 'Orange') },
  { value: '#FFCC00', label: pick('黄色', 'Yellow') },
  { value: '#34C759', label: pick('绿色', 'Green') },
  { value: '#00C7BE', label: pick('薄荷', 'Mint') },
  { value: '#30B0C7', label: pick('青色', 'Teal') },
  { value: '#32ADE6', label: pick('蓝绿', 'Cyan') },
  { value: '#007AFF', label: pick('蓝色', 'Blue') },
  { value: '#5856D6', label: pick('靛蓝', 'Indigo') },
  { value: '#AF52DE', label: pick('紫色', 'Purple') },
  { value: '#FF2D55', label: pick('粉色', 'Pink') },
  { value: '#A2845E', label: pick('棕色', 'Brown') },
  { value: '#8E8E93', label: pick('灰色', 'Gray') },
  { value: '#000000', label: pick('黑色', 'Black') },
  { value: '#FFFFFF', label: pick('白色', 'White') },
]

export const BACKGROUNDS: { value: SymbolBackground; label: string }[] = [
  { value: 'none', label: pick('透明', 'Transparent') },
  { value: 'white', label: pick('白色', 'White') },
  { value: 'black', label: pick('黑色', 'Black') },
]

export function backgroundColor(background: SymbolBackground): Color | null {
  if (background === 'white') return '#FFFFFF'
  if (background === 'black') return '#000000'
  return null
}

/**
 * 把主题换算成 `foregroundStyle` 的取值。
 * palette 模式需要多个层的颜色，这里用同一个色相的三档透明度顶上。
 */
export function foregroundStyleOf(style: SymbolStyle): any {
  if (style.renderingMode === 'multicolor') return undefined

  const base =
    style.gradient || style.opacity < 1
      ? style.gradient
        ? { color: style.color, gradient: true as const, opacity: style.opacity }
        : { color: style.color, opacity: style.opacity }
      : style.color

  if (style.renderingMode !== 'palette') return base

  const fade = (o: number) => ({ color: style.color, opacity: style.opacity * o })
  return { primary: base, secondary: fade(0.65), tertiary: fade(0.35) }
}

// ---------------------------------------------------------------- 动画

export type AnimationKind =
  | 'none'
  | 'bounce'
  | 'breathe'
  | 'pulse'
  | 'rotate'
  | 'wiggle'
  | 'variableColor'
  | 'appear'
  | 'disappear'
  | 'scale'

export type SymbolAnimation = {
  kind: AnimationKind
  /** 变体后缀，直接拼在 kind 后面构成 SwiftUI 的 effect 名 */
  variant: string
  repeatMode: 'once' | 'continuous'
  speed: number
}

export const DEFAULT_ANIMATION: SymbolAnimation = {
  kind: 'bounce',
  variant: '',
  repeatMode: 'once',
  speed: 1,
}

/** 由 `isActive` 触发的效果，其余的靠 value 变化触发 */
const TRIGGER_KINDS: AnimationKind[] = ['appear', 'disappear', 'scale']

export const ANIMATION_KINDS: { value: AnimationKind; label: string }[] = [
  { value: 'none', label: pick('无', 'None') },
  { value: 'bounce', label: pick('弹跳', 'Bounce') },
  { value: 'breathe', label: pick('呼吸', 'Breathe') },
  { value: 'pulse', label: pick('脉冲', 'Pulse') },
  { value: 'rotate', label: pick('旋转', 'Rotate') },
  { value: 'wiggle', label: pick('摇摆', 'Wiggle') },
  { value: 'variableColor', label: pick('可变颜色', 'Variable Color') },
  { value: 'appear', label: pick('出现', 'Appear') },
  { value: 'disappear', label: pick('消失', 'Disappear') },
  { value: 'scale', label: pick('缩放', 'Scale') },
]

const V_DEFAULT = { value: '', label: pick('默认', 'Default') }
const V_LAYER = { value: 'ByLayer', label: pick('按图层', 'By Layer') }
const V_WHOLE = { value: 'WholeSymbol', label: pick('整个符号', 'Whole Symbol') }
const V_UP = { value: 'Up', label: pick('向上', 'Up') }
const V_DOWN = { value: 'Down', label: pick('向下', 'Down') }

/**
 * 每种动画可用的变体。
 *
 * 注意：SwiftUI 桥接过来的是一串固定的效果名（`bounceUp`、`bounceByLayer`…），
 * 「方向」和「作用范围」在这里是同一个维度，没有 `bounceUpByLayer` 这种组合。
 * 所以这里做成一个下拉，而不是像 SF Symbols.app 那样拆成两行 —— 拆成两行的话
 * 总有一行是点了不生效的。
 */
export const ANIMATION_VARIANTS: Record<AnimationKind, { value: string; label: string }[]> = {
  none: [V_DEFAULT],
  bounce: [V_DEFAULT, V_UP, V_DOWN, V_LAYER, V_WHOLE],
  breathe: [
    V_DEFAULT,
    { value: 'Plain', label: pick('平稳', 'Plain') },
    { value: 'Pulse', label: pick('脉动', 'Pulse') },
    V_LAYER,
    V_WHOLE,
  ],
  pulse: [V_DEFAULT, V_LAYER, V_WHOLE],
  rotate: [
    V_DEFAULT,
    { value: 'Clockwise', label: pick('顺时针', 'Clockwise') },
    { value: 'CounterClockwise', label: pick('逆时针', 'Counterclockwise') },
    V_LAYER,
    V_WHOLE,
  ],
  wiggle: [
    V_DEFAULT,
    V_UP,
    V_DOWN,
    { value: 'Left', label: pick('向左', 'Left') },
    { value: 'Right', label: pick('向右', 'Right') },
    { value: 'Clockwise', label: pick('顺时针', 'Clockwise') },
    { value: 'CounterClockwise', label: pick('逆时针', 'Counterclockwise') },
    V_LAYER,
    V_WHOLE,
  ],
  variableColor: [
    V_DEFAULT,
    { value: 'Cumulative', label: pick('累积', 'Cumulative') },
    { value: 'Iterative', label: pick('逐层', 'Iterative') },
    { value: 'Reversing', label: pick('往返', 'Reversing') },
    { value: 'NonReversing', label: pick('单向', 'Non-reversing') },
    { value: 'DimInactiveLayers', label: pick('暗化未激活层', 'Dim Inactive') },
    { value: 'HideInactiveLayers', label: pick('隐藏未激活层', 'Hide Inactive') },
  ],
  appear: [V_DEFAULT, V_UP, V_DOWN, V_LAYER, V_WHOLE],
  disappear: [V_DEFAULT, V_UP, V_DOWN, V_LAYER, V_WHOLE],
  scale: [V_DEFAULT, V_UP, V_DOWN, V_LAYER, V_WHOLE],
}

export function isTriggerAnimation(kind: AnimationKind): boolean {
  return TRIGGER_KINDS.includes(kind)
}

/**
 * 组装 `symbolEffect`。
 * @param playToken 每点一次播放就 +1，value 变化会让离散动画重放
 * @param triggerActive 触发型动画的开关状态
 */
export function buildSymbolEffect(
  animation: SymbolAnimation,
  playToken: number,
  triggerActive: boolean
): SymbolEffect | undefined {
  if (animation.kind === 'none') return undefined

  const effect = `${animation.kind}${animation.variant}`
  const options =
    animation.repeatMode === 'continuous'
      ? { speed: animation.speed, repeat: 'continuous' as const }
      : { speed: animation.speed, nonRepeating: true }

  if (isTriggerAnimation(animation.kind)) {
    return { effect: effect as any, isActive: triggerActive, options }
  }
  return { effect: effect as any, value: playToken, options }
}

/** 换动画种类时，旧的变体多半不适用，重置回默认 */
export function normalizeAnimation(animation: SymbolAnimation): SymbolAnimation {
  const allowed = ANIMATION_VARIANTS[animation.kind] || [V_DEFAULT]
  if (allowed.some(v => v.value === animation.variant)) return animation
  return { ...animation, variant: '' }
}

// ---------------------------------------------------------------- 变体探测

const KNOWN_SHAPE_SUFFIXES = [
  '.circle.fill',
  '.square.fill',
  '.rectangle.fill',
  '.slash.fill',
  '.circle',
  '.square',
  '.rectangle',
  '.slash',
  '.fill',
]

/** 去掉 .fill / .circle 之类的外观后缀，拿到基础名 */
export function baseSymbolName(name: string): string {
  for (const suffix of KNOWN_SHAPE_SUFFIXES) {
    if (name.endsWith(suffix)) return name.slice(0, -suffix.length)
  }
  return name
}

/** 探测这个符号还有哪些同族变体真实存在 */
export function relatedVariants(name: string): string[] {
  const base = baseSymbolName(name)
  const candidates = [base, ...KNOWN_SHAPE_SUFFIXES.map(s => base + s)]
  const seen = new Set<string>()
  const out: string[] = []
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue
    seen.add(candidate)
    try {
      if (UIImage.fromSFSymbol(candidate) != null) out.push(candidate)
    } catch {
      /* 忽略 */
    }
  }
  return out
}
