export const TIME_OPTIONS = [
  '08:00', '10:00', '12:00', '14:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '20:30', '21:00', '22:00', '23:00'
]

/** Hex palette used to colorize new shows. Cycles for autoassignment. */
export const COLOR_PALETTE = [
  '#c0392b', '#8e44ad', '#d35400', '#27ae60', '#2980b9',
  '#a93226', '#7d3c98', '#1a5276', '#1e8449', '#6e2f7a',
  '#0e6655', '#b7950b', '#7b241c', '#1f618d', '#117a65'
]

export function getTodayIndex(): number {
  return new Date().getDay()
}

export function nextColor(existingCount: number): string {
  return COLOR_PALETTE[existingCount % COLOR_PALETTE.length]
}
