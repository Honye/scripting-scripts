import type { ColorStringRGBA } from 'scripting'

export interface Subscription {
  name: string
  version: string
  icon: string
  color: ColorStringRGBA
  repo: `${string}/${string}`
  url: string
}

export interface WidgetJSON {
  root: string
  icon: string
  version: string
  name: string
  color: ColorStringRGBA
  author: string
}
