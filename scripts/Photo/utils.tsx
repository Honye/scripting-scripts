import { Widget } from "scripting"

export const vmin = (num: number) => {
  const { width, height } = Widget.displaySize
  return num * Math.min(width, height) / 100
}

export const rpt = (n: number) => vmin(n * 100 / 329)