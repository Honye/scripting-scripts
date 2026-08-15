export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Half of the empty space beside a single centered glyph in a grid column.
 *
 * The header spans the whole content width while the weekday letters sit
 * centered in their columns, so without this inset the header text starts
 * visibly left of the first letter and ends right of the last one.
 */
export function columnGlyphInset(
  columnWidth: number,
  font: number,
  sample: string
) {
  // CJK weekday names are full-width, latin ones roughly 0.62em.
  const isFullWidth = (sample.codePointAt(0) ?? 0) > 0x2e80
  const glyphWidth = font * (isFullWidth ? 1 : 0.62)
  return Math.max((columnWidth - glyphWidth) / 2, 0)
}
