import {
  Capsule,
  Gauge,
  HStack,
  Image,
  Rectangle,
  RoundedRectangle,
  Spacer,
  Text,
  VStack,
  Widget,
  ZStack
} from 'scripting'
import { errorMessage, getData } from './api/client'
import {
  LEVEL_COLORS,
  LEVEL_GRADIENTS,
  LEVEL_NAMES,
  LEVEL_TRACKS,
  barItems,
  normalize,
  segmentFills,
  stepProgress
} from './data'
import { loadPreference } from './store'
import type { AccountData, Bar, Level } from './data'
import type { Preference } from './store'

/**
 * Home Screen / Lock Screen widget, ported from the Scriptable SGCC.js.
 *
 * **`Widget.present` is always reached**: the fetch is budgeted and wrapped,
 * and any failure renders the error view instead.
 *
 * `Widget.parameter` picks the account: `0` (default) is the first 户号, `1`
 * the second, and so on.
 */

/** Login plus ~5 requests per account, each with pure-JS SM2 on both ends. */
const FETCH_BUDGET_MS = 20000
const REFRESH_MINUTES = 60
const LOGO_URL =
  'https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts@master/static/sgcc.png'

const TEXT = { light: '#18231C', dark: '#FFFFFF' } as const
const TEXT_SECONDARY = {
  light: 'rgba(24,35,28,0.7)',
  dark: 'rgba(255,255,255,0.7)'
} as const
const CARD = {
  light: 'rgba(0,112,107,0.05)',
  dark: 'rgba(4,96,91,0.15)'
} as const
const TRANSPARENT = 'rgba(0,112,107,0)'

const vmin = (n: number) => {
  const { width, height } = Widget.displaySize
  return (n * Math.min(width, height)) / 100
}
/** Scriptable-era sizes were tuned on a 155pt small widget. */
const rpt = (n: number) => vmin((n * 100) / 155)

function withBudget<T>(work: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('请求国网超时，请稍后再试')), ms)
    )
  ])
}

const hhmm = (time: number) => {
  const d = new Date(time)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// --- Pieces ------------------------------------------------------------------------

function Logo({ size }: { size: number }) {
  return (
    <Image
      imageUrl={LOGO_URL}
      resizable
      scaleToFit
      frame={{ width: size, height: size }}
      widgetAccentedRenderingMode="fullColor"
    />
  )
}

function Bars({
  bars,
  height,
  barWidth,
  gap,
  inset
}: {
  bars: Bar[]
  height: number
  barWidth: number
  /**
   * Not named `padding`: that is a common view prop, which the runtime would
   * also apply to this component's element, doubling the inset.
   */
  inset?: { vertical: number; horizontal: number }
  /** Fixed gap; when omitted, bars spread across the full width. */
  gap?: number
}) {
  const max = Math.max(0, ...bars.map(({ value }) => value)) || 1
  return (
    <HStack
      alignment="bottom"
      spacing={gap ?? 0}
      frame={{ height }}
      padding={inset}
    >
      {bars.flatMap(({ value, level }, i) => [
        ...(i > 0 && gap == null ? [<Spacer key={`s${i}`} minLength={0} />] : []),
        <Capsule
          key={`b${i}`}
          fill={{
            colors: LEVEL_GRADIENTS[level],
            startPoint: 'top',
            endPoint: 'bottom'
          }}
          frame={{
            width: barWidth,
            height: Math.max(barWidth, (value / max) * height)
          }}
        />
      ])}
    </HStack>
  )
}

/**
 * Three tier segments along the bottom edge of the small widget's card, each
 * filled as far as the year has reached (the card's corners clip the ends).
 */
function StepBar({
  level,
  percent,
  width
}: {
  level: Level
  percent: number
  width: number
}) {
  const fills = segmentFills(level, percent)
  const height = rpt(4)
  const gap = width * 0.02
  const segment = (width - gap * 2) / 3
  return (
    <HStack spacing={gap} frame={{ width, height }}>
      {([1, 2, 3] as Level[]).map((l, i) => (
        <ZStack key={l} alignment="leading" frame={{ width: segment, height }}>
          <Rectangle fill={LEVEL_TRACKS[l]} />
          {fills[i] > 0 ? (
            <Rectangle
              fill={LEVEL_COLORS[l]}
              frame={{ width: segment * fills[i], height }}
            />
          ) : null}
        </ZStack>
      ))}
    </HStack>
  )
}

/** The medium widget's tick-style tier meter. */
function StepTicks({
  level,
  percent,
  width
}: {
  level: Level
  percent: number
  width: number
}) {
  const gap = rpt(2)
  const tickWidth = 2
  const perLevel = Math.max(1, Math.floor(Math.floor((width + gap) / (tickWidth + gap)) / 3))
  const end = Math.floor(perLevel * level * percent)
  const ticks = Array.from({ length: perLevel * 3 }, (_, i) => {
    const l = (Math.floor(i / perLevel) + 1) as Level
    return i > end ? LEVEL_TRACKS[l] : LEVEL_COLORS[l]
  })
  return (
    <HStack spacing={gap} frame={{ maxHeight: 'infinity' }}>
      {ticks.map((color, i) => (
        <RoundedRectangle
          key={i}
          cornerRadius={1}
          fill={color}
          frame={{ width: tickWidth, maxHeight: 'infinity' }}
        />
      ))}
    </HStack>
  )
}

function LabelValue({ label, value }: { label: string; value: string | number }) {
  return (
    <VStack
      alignment="leading"
      spacing={1}
      frame={{ maxWidth: 'infinity', alignment: 'leading' }}
      padding={{ vertical: rpt(6), horizontal: rpt(12) }}
      background={<RoundedRectangle cornerRadius={rpt(6)} fill={CARD} />}
    >
      <Text font={rpt(8)} foregroundStyle={TEXT_SECONDARY}>
        {label}
      </Text>
      <Text
        font={14}
        fontWeight="bold"
        fontDesign="rounded"
        foregroundStyle={TEXT}
        lineLimit={1}
        minScaleFactor={0.5}
      >
        {value}
      </Text>
    </VStack>
  )
}

// --- Layouts -----------------------------------------------------------------------

type Props = {
  data: AccountData
  preference: Preference
  fetchedAt: number
  error?: string
}

function SmallView({ data, preference }: Props) {
  const bars = barItems(data, preference)
  const step = stepProgress(data.stepPq, preference.oneLevelPq, preference.twoLevelPq)
  const { lastAmount } = data
  return (
    <VStack
      alignment="leading"
      spacing={0}
      padding={12}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      widgetBackground={{
        light: {
          stops: [
            { color: '#FFFFFF', location: 0.65 },
            { color: 'rgba(0,112,107,0.18)', location: 1 }
          ],
          startPoint: 'topLeading',
          endPoint: 'bottomTrailing'
        },
        dark: '#171A18'
      }}
    >
      <VStack
        spacing={0}
        clipShape={{ type: 'rect', cornerRadius: 6 }}
        background={
          <RoundedRectangle
            cornerRadius={6}
            fill={{
              light: {
                colors: [TRANSPARENT, CARD.light],
                startPoint: 'top',
                endPoint: 'bottom'
              },
              dark: {
                colors: [TRANSPARENT, CARD.dark],
                startPoint: 'top',
                endPoint: 'bottom'
              }
            }}
          />
        }
      >
        <Bars
          bars={bars}
          height={rpt(68) - rpt(10) * 2}
          barWidth={rpt(8)}
          inset={{ vertical: rpt(10), horizontal: rpt(8) }}
        />
        {preference.showStepProgress ? (
          <StepBar
            level={step.level}
            percent={step.percent}
            width={Widget.displaySize.width - 24}
          />
        ) : null}
      </VStack>
      <Spacer minLength={rpt(4)} />
      <VStack alignment="leading" spacing={rpt(6)} padding={{ bottom: rpt(2) }}>
        <Text font={rpt(12)} foregroundStyle={TEXT_SECONDARY} lineLimit={1}>
          {`余额${Number(lastAmount) ? `(上期:${lastAmount})` : ''}`}
        </Text>
        <HStack>
          <Text
            font={rpt(24)}
            fontWeight="bold"
            fontDesign="rounded"
            foregroundStyle={TEXT}
            lineLimit={1}
            minScaleFactor={0.5}
          >
            {data.balance}
          </Text>
          <Spacer />
          <Logo size={rpt(24)} />
        </HStack>
      </VStack>
    </VStack>
  )
}

function MediumView({ data, preference, fetchedAt, error }: Props) {
  const { barCount } = preference
  const bars = barItems(data, preference)
  const step = stepProgress(data.stepPq, preference.oneLevelPq, preference.twoLevelPq)

  const padding = rpt(12)
  const lpx = rpt(4)
  const barWidth = rpt(6)
  const barGap = rpt(6)
  const leftWidth = Math.max(barCount, 7) * (barWidth + barGap) - barGap + lpx * 2
  const lrGap = rpt(12)
  const stepPaddingX = rpt(12)
  const rightWidth = Widget.displaySize.width - padding * 2 - leftWidth - lrGap

  return (
    <HStack
      alignment="top"
      spacing={lrGap}
      padding={padding}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      widgetBackground={{
        light: {
          stops: [
            { color: 'rgba(0,112,107,0.18)', location: 0 },
            { color: '#FFFFFF', location: 0.35 }
          ],
          startPoint: 'topLeading',
          endPoint: { x: 0.45, y: 1 }
        },
        dark: '#171A18'
      }}
    >
      <VStack
        alignment="leading"
        spacing={0}
        padding={{ horizontal: lpx, bottom: rpt(4) }}
        frame={{ width: leftWidth, maxHeight: 'infinity', alignment: 'topLeading' }}
        background={
          <RoundedRectangle
            cornerRadius={rpt(6)}
            fill={{
              light: {
                stops: [
                  { color: TRANSPARENT, location: 0.4 },
                  { color: CARD.light, location: 1 }
                ],
                startPoint: 'top',
                endPoint: 'bottom'
              },
              dark: {
                stops: [
                  { color: TRANSPARENT, location: 0.4 },
                  { color: CARD.dark, location: 1 }
                ],
                startPoint: 'top',
                endPoint: 'bottom'
              }
            }}
          />
        }
      >
        <Logo size={rpt(24)} />
        <Spacer minLength={rpt(12)} />
        <Text font={rpt(10)} foregroundStyle={TEXT_SECONDARY}>
          {data.arrearsOfFees ? '待缴电费' : '剩余电费'}
        </Text>
        <Text
          font={rpt(18)}
          fontWeight="bold"
          fontDesign="rounded"
          foregroundStyle={TEXT}
          lineLimit={1}
          minScaleFactor={0.5}
        >
          {data.balance}
        </Text>
        <Spacer minLength={0} />
        <Bars
          bars={bars}
          height={rpt(40) - rpt(4) * 2}
          barWidth={barWidth}
          gap={barGap}
        />
      </VStack>

      <VStack spacing={rpt(6)} frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
        <HStack spacing={rpt(8)}>
          <LabelValue label="上期电费" value={data.lastAmount} />
          <LabelValue label="上期电量" value={data.lastPq} />
        </HStack>
        <HStack spacing={rpt(8)}>
          <LabelValue label="年度电费" value={data.yearAmount} />
          <LabelValue label="年度电量" value={data.yearPq} />
        </HStack>
        <VStack
          alignment="leading"
          spacing={rpt(4)}
          frame={{ maxWidth: 'infinity', maxHeight: 'infinity', alignment: 'topLeading' }}
          padding={{ vertical: rpt(6), horizontal: stepPaddingX }}
          background={<RoundedRectangle cornerRadius={rpt(6)} fill={CARD} />}
        >
          <HStack spacing={2}>
            <Text font={rpt(8)} foregroundStyle={TEXT_SECONDARY} lineLimit={1}>
              {preference.showStepProgress
                ? `第${LEVEL_NAMES[step.level]}梯度：${Number((step.percent * 100).toFixed(2))}%`
                : `阶梯电量：${data.stepPq}`}
            </Text>
            <Spacer />
            <Image
              systemName={error ? 'exclamationmark.triangle' : 'clock.arrow.circlepath'}
              font={rpt(8)}
              foregroundStyle={error ? 'systemOrange' : TEXT_SECONDARY}
            />
            <Text font={rpt(8)} foregroundStyle={TEXT_SECONDARY}>
              {hhmm(fetchedAt)}
            </Text>
          </HStack>
          {preference.showStepProgress ? (
            <StepTicks
              level={step.level}
              percent={step.percent}
              width={rightWidth - stepPaddingX * 2}
            />
          ) : null}
        </VStack>
      </VStack>
    </HStack>
  )
}

function AccessoryView({ data, preference }: Props) {
  const step = stepProgress(data.stepPq, preference.oneLevelPq, preference.twoLevelPq)
  const overall = (step.level * step.percent) / 3
  const stepText = `第${LEVEL_NAMES[step.level]}梯度 ${Math.round(step.percent * 100)}%`
  const balanceLabel = data.arrearsOfFees ? '待缴' : '余额'

  switch (Widget.family) {
    case 'accessoryCircular':
      return (
        <Gauge
          value={overall}
          label={<Image systemName="bolt.fill" />}
          currentValueLabel={
            <Text minScaleFactor={0.5} lineLimit={1}>
              {data.balance}
            </Text>
          }
          gaugeStyle="accessoryCircularCapacity"
        />
      )
    case 'accessoryInline':
      return <Text>{`⚡︎ ${balanceLabel} ${data.balance} · ${stepText}`}</Text>
    default:
      return (
        <VStack alignment="leading" spacing={2}>
          <HStack spacing={4}>
            <Image systemName="bolt.fill" font="caption" />
            <Text font="caption" fontWeight="semibold">
              网上国网
            </Text>
          </HStack>
          <Text font="title3" fontWeight="bold" fontDesign="rounded" lineLimit={1} minScaleFactor={0.5}>
            {`${balanceLabel} ${data.balance}`}
          </Text>
          {preference.showStepProgress ? (
            <Gauge
              value={overall}
              label={<Text font="caption2">{stepText}</Text>}
              gaugeStyle="accessoryLinearCapacity"
            />
          ) : (
            <Text font="caption2">{`年度 ${data.yearPq} 度 · ${data.yearAmount} 元`}</Text>
          )}
        </VStack>
      )
  }
}

function ErrorView({ message }: { message: string }) {
  if (Widget.family.startsWith('accessory')) {
    return (
      <VStack alignment="leading" spacing={2}>
        <Text font="caption" fontWeight="semibold">
          网上国网
        </Text>
        <Text font="caption2" minScaleFactor={0.6}>
          {message}
        </Text>
      </VStack>
    )
  }
  return (
    <VStack
      alignment="leading"
      spacing={6}
      padding={12}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity', alignment: 'topLeading' }}
      widgetBackground={{ light: '#FFFFFF', dark: '#171A18' }}
    >
      <Text font={14} fontWeight="bold" foregroundStyle={TEXT}>
        网上国网
      </Text>
      <Text font={12} minScaleFactor={0.6} foregroundStyle={TEXT_SECONDARY}>
        {message}
      </Text>
      <Spacer />
    </VStack>
  )
}

function build(props: Props) {
  switch (Widget.family) {
    case 'systemSmall':
      return <SmallView {...props} />
    case 'accessoryCircular':
    case 'accessoryRectangular':
    case 'accessoryInline':
      return <AccessoryView {...props} />
    default:
      return <MediumView {...props} />
  }
}

// --- Entry point -------------------------------------------------------------------

async function main() {
  const reloadPolicy = {
    policy: 'after',
    date: new Date(Date.now() + REFRESH_MINUTES * 60 * 1000)
  } as const

  try {
    const preference = loadPreference()
    const [i] = (Widget.parameter || '').split(';').map((item) => item.trim())
    const index = Number(i || 0)
    const { list, fetchedAt, error } = await withBudget(getData(), FETCH_BUDGET_MS)
    const item = Number.isInteger(index) ? list[index] : null
    if (!item) throw new Error(`户号 ${i || 0} 不存在或查询失败`)
    Widget.present(
      build({ data: normalize(item), preference, fetchedAt, error }),
      { reloadPolicy }
    )
  } catch (e) {
    console.error(e)
    Widget.present(<ErrorView message={errorMessage(e)} />, { reloadPolicy })
  }
}

main()
