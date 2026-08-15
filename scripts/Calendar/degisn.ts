import type { ShapeStyle, DynamicShapeStyle, ColorStringRGBA, Color, ColorStringHSL } from 'scripting'

type ColorRGBA = ColorStringRGBA | { light: ColorStringRGBA, dark: ColorStringRGBA }

export const colors = {
    systemRed: {
        light: 'rgba(255,56,60,1)',
        dark: 'rgba(255,66,69,1)',
    },
    systemGreen: {
        light: 'rgba(52,199,89,1)',
        dark: 'rgba(48,209,88,1)',
    }
} satisfies Record<string, ColorRGBA>

/** `#rgb` / `#rrggbb(aa)` / `rgb()` / `rgba()` -> `[r, g, b]`, or null when unparsable. */
function parseRGB(value: string): [number, number, number] | null {
    const hex = value.trim().replace(/^#/, '')
    if (/^[0-9a-f]{3}$/i.test(hex)) {
        return [
            parseInt(hex[0] + hex[0], 16),
            parseInt(hex[1] + hex[1], 16),
            parseInt(hex[2] + hex[2], 16)
        ]
    }
    if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) {
        return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16)
        ]
    }
    const match = value.match(/^rgba?\(([^)]+)\)$/i)
    if (match) {
        const parts = match[1].split(',').map((v) => Number.parseFloat(v))
        if (parts.length >= 3 && parts.slice(0, 3).every((v) => !Number.isNaN(v))) {
            return [parts[0], parts[1], parts[2]]
        }
    }
    return null
}

function rgbToHSL(r: number, g: number, b: number) {
    const rd = r / 255
    const gd = g / 255
    const bd = b / 255
    const max = Math.max(rd, gd, bd)
    const min = Math.min(rd, gd, bd)
    const delta = max - min
    const l = (max + min) / 2

    let h = 0
    let s = 0
    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1))
        if (max === rd) {
            h = ((gd - bd) / delta) % 6
        } else if (max === gd) {
            h = (bd - rd) / delta + 2
        } else {
            h = (rd - gd) / delta + 4
        }
        h = Math.round(h * 60)
        if (h < 0) h += 360
    }
    return { h, s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hsl(h: number, s: number, l: number) {
    return `hsl(${h},${s}%,${l}%)` as ColorStringHSL
}

/**
 * Calendar colors are picked to read on a white sheet, so a saturated one can
 * vanish against either widget background. Pull the lightness into a readable
 * band per color scheme: dark enough in light mode, bright enough in dark mode.
 */
export function adaptEventColor(value: Color): Color | DynamicShapeStyle {
    const rgb = parseRGB(value)
    if (!rgb) {
        return value
    }
    const { h, s, l } = rgbToHSL(rgb[0], rgb[1], rgb[2])
    return {
        light: hsl(h, s, Math.min(l, 30)),
        dark: hsl(h, s, Math.max(l, 60))
    }
}

export function color(rgba: ColorRGBA, alpha: number) {
    if (typeof rgba === 'string') {
        return rgba.replace(/,\s*[\d.]+\)$/, `,${alpha})`) as ColorStringRGBA
    }
    return {
        light: rgba.light.replace(/,\s*[\d.]+\)$/, `,${alpha})`),
        dark: rgba.dark.replace(/,\s*[\d.]+\)$/, `,${alpha})`)
    } as ColorRGBA
}