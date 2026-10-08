import { Circle, ZStack } from 'scripting'
import { levelFor } from '../limits'
import type { VirtualNode } from 'scripting'

export function levelColor(
  ratio: number
): 'systemRed' | 'systemOrange' | 'systemBlue' {
  const level = levelFor(ratio)
  if (level === 'severe') return 'systemRed'
  if (level === 'warn') return 'systemOrange'
  return 'systemBlue'
}

/**
 * Ring gauge drawn from two trimmed circles (same technique as
 * `scripts/Gauge/widget.tsx`), so it renders identically in the app and in a
 * widget. A non-zero ratio is drawn at least as a dot, so "2 of 100k" reads as
 * "something" rather than as an empty ring.
 */
export function UsageRing({
  ratio,
  size,
  lineWidth,
  children
}: {
  ratio: number
  size: number
  lineWidth: number
  children?: VirtualNode
}) {
  const shown = ratio <= 0 ? 0 : Math.min(1, Math.max(0.01, ratio))
  return (
    <ZStack frame={{ width: size, height: size }}>
      <Circle
        stroke={{
          shapeStyle: 'systemGray5',
          strokeStyle: { lineWidth }
        }}
      />
      <Circle
        trim={{ from: 0, to: shown }}
        stroke={{
          shapeStyle: levelColor(ratio),
          strokeStyle: { lineWidth, lineCap: 'round' }
        }}
        rotationEffect={-90}
      />
      {children ?? null}
    </ZStack>
  )
}
