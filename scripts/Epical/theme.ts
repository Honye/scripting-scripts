import type { Color, DynamicShapeStyle } from 'scripting'

/** Symmetric overlay (white on dark / black on light) at a given alpha. */
const tone = (a: number): DynamicShapeStyle => ({
  light: `rgba(0,0,0,${a})` as Color,
  dark: `rgba(255,255,255,${a})` as Color
})

export const theme = {
  // Backgrounds — explicit dicts so adaptation works in every context.
  /** Page background. */
  bg: { light: '#f2f2f7', dark: '#0d0d14' } as DynamicShapeStyle,
  /** Sheet / detail surface (sits above page). */
  surface: { light: '#ffffff', dark: '#1a1a28' } as DynamicShapeStyle,

  // Subtle overlays for cards, borders, dividers, track fills.
  card: tone(0.05),
  cardPressed: tone(0.08),
  cardBorder: tone(0.1),
  divider: tone(0.1),
  surfaceAlt: tone(0.06),
  surfaceAlt2: tone(0.08),
  trackBg: tone(0.12),

  // Text — primary uses near-pure label colors; tiers below use overlays
  // bumped vs. the iOS defaults so both modes stay clearly readable.
  text: { light: '#1c1c1e', dark: '#f5f5f7' } as DynamicShapeStyle,
  textSecondary: tone(0.75),
  textTertiary: tone(0.6),
  textQuaternary: tone(0.45),
  textDisabled: tone(0.35),
  text80: tone(0.85),
  text70: tone(0.75),
  text50: tone(0.62),
  text35: tone(0.5),
  text15: tone(0.3),

  // Brand — same in both modes.
  brandStart: '#8b5a3c' as Color,
  brandEnd: '#c08552' as Color,
  brandSoftBg: 'rgba(192,133,82,0.2)' as Color,
  brandFaintBg: 'rgba(139,90,60,0.12)' as Color,
  brandShadow: 'rgba(139,90,60,0.4)' as Color
}

/** Soft tinted background derived from a show's accent color. Light mode needs a bit more alpha to stay visible on white. */
export function tintedBg(hex: string): DynamicShapeStyle {
  return {
    light: `${hex}33` as Color,
    dark: `${hex}22` as Color
  }
}
