export function vmin(n: number) {
  const { width, height } = Device.screen
  const base = Math.min(width, height)
  return n * base / 100
}

export function rpt(n: number) {
  return vmin(n * 100 / 750)
}