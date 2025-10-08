import { DynamicShapeStyle } from "scripting"

export const Colors: Record<string, DynamicShapeStyle> = {
  Background1: {
    light: 'white',
    // dark: 'systemGray2'
    dark: "rgba(255,255,255,0.3)"
  },
  Foreground1: {
    light: 'black',
    dark: 'white'
  },
  Background2: {
    light: '#ABB0BA',
    // dark: 'systemGray4',
    dark: "rgba(255,255,255,0.15)"
  },
  Foreground2: { light: 'black', dark: "white" }
}
