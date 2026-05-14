import { Widget } from 'scripting'

export const vmin = (n: number) => {
  const { width, height } = Widget.displaySize
  return (n * Math.min(width, height)) / 100
}

export const rpt = (n: number) => vmin((n * 100) / 155)
