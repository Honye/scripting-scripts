import { HStack, ProgressView, Spacer, Text, VStack } from 'scripting'
import { levelColor } from './UsageRing'
import { compact, grouped, percent } from '../format'
import type { Meter } from '../limits'

/** "Requests today   2 / 100,000" over a progress bar, like the dashboard panel. */
export function MeterRow({
  title,
  meter,
  unit,
  caption
}: {
  title: string
  meter: Meter
  unit?: string
  caption?: string
}) {
  const suffix = unit != null ? ` ${unit}` : ''
  const used = unit != null ? compact(meter.used) : grouped(meter.used)
  const limit = unit != null ? compact(meter.limit) : grouped(meter.limit)
  return (
    <VStack alignment="leading" spacing={6}>
      <HStack>
        <Text>{title}</Text>
        <Spacer />
        <Text monospacedDigit foregroundStyle="secondaryLabel">
          {used}
          {suffix} / {limit}
          {suffix}
        </Text>
      </HStack>
      <ProgressView
        value={Math.min(meter.ratio, 1)}
        total={1}
        tint={levelColor(meter.ratio)}
      />
      <HStack>
        <Text font="caption" foregroundStyle={levelColor(meter.ratio)}>
          {percent(meter.ratio)}
        </Text>
        <Spacer />
        {caption != null ? (
          <Text font="caption" foregroundStyle="secondaryLabel">
            {caption}
          </Text>
        ) : null}
      </HStack>
    </VStack>
  )
}
