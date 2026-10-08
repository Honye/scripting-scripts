import {
  BarChart,
  Capsule,
  Chart,
  Divider,
  Gauge,
  HStack,
  Image,
  Spacer,
  Text,
  VStack,
  Widget,
  ZStack
} from 'scripting'
import { i18n } from './i18n'
import { agoShort, compact, percent, untilShort } from './format'
import { isSnapshotCurrent, metersFor, worstMeter } from './limits'
import { refreshProfile } from './refresh'
import { loadProfiles, loadSnapshots } from './store'
import { parseTargets } from './widget_param'
import { UsageRing, levelColor } from './components/UsageRing'
import type { Meter } from './limits'
import type { Target } from './widget_param'
import type { Profile, UsageSnapshot } from './types'

/**
 * Home Screen / Lock Screen widget, and the engine behind alerts.
 *
 * The one rule in this file (as in Storefront's widget): **`Widget.present` is
 * always reached.** Fetching and alerting are individually budgeted and wrapped;
 * the render depends only on cached snapshots.
 *
 * `Widget.parameter` picks what to show — one account, one Worker, or several
 * of either separated by commas (see `widget_param.ts` for the full syntax).
 * A single target gets the detailed layouts; several get a compact list.
 */

/** Whole background run, well inside the extension's budget. */
const BACKGROUND_BUDGET_MS = 15000
const PER_PROFILE_TIMEOUT_MS = 6000
/** A snapshot this fresh is reused rather than refetched. */
const MIN_FETCH_INTERVAL_MS = 5 * 60 * 1000
const REFRESH_MINUTES = 30

function withBudget<T>(work: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    work.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  ])
}

// --- Background work -----------------------------------------------------------

/**
 * Refreshes every account: the displayed ones first, in the order they appear,
 * then the stalest, so alerts keep working for accounts that have no widget of
 * their own.
 */
async function runBackgroundWork(targets: Target[], profiles: Profile[]) {
  const started = Date.now()
  const snapshots = loadSnapshots()
  const shown = Array.from(new Set(targets.map((t) => t.profile.id)))
  const rank = (p: Profile) => {
    const i = shown.indexOf(p.id)
    return i < 0 ? shown.length : i
  }
  const ordered = [...profiles].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (snapshots[a.id]?.fetchedAt ?? 0) - (snapshots[b.id]?.fetchedAt ?? 0)
  )

  for (const profile of ordered) {
    const remaining = BACKGROUND_BUDGET_MS - (Date.now() - started)
    if (remaining < 2000) break
    if (
      (snapshots[profile.id]?.fetchedAt ?? 0) >
      Date.now() - MIN_FETCH_INTERVAL_MS
    )
      continue
    const timeout = Math.min(PER_PROFILE_TIMEOUT_MS, remaining - 500)
    await withBudget(refreshProfile(profile, timeout), timeout + 500)
  }
}

// --- Views -----------------------------------------------------------------------

type View = {
  profile: Profile
  snapshot?: UsageSnapshot
  meter: Meter | null
  current: boolean
}

function viewFor(
  profile: Profile,
  snapshots: Record<string, UsageSnapshot>,
  now: number
): View {
  const snapshot = snapshots[profile.id]
  const current = snapshot != null && isSnapshotCurrent(snapshot, now)
  const meter = current ? worstMeter(metersFor(profile, snapshot!)) : null
  return { profile, snapshot, meter, current }
}

function footnote(view: View, now: number): string {
  if (view.snapshot == null) return i18n.widgetNoData
  if (!view.current) return i18n.staleSnapshot
  return view.profile.plan === 'free'
    ? i18n.resetsIn(untilShort(view.snapshot.periodEnd, now))
    : i18n.updatedAgo(agoShort(view.snapshot.fetchedAt, now))
}

function meterText(meter: Meter | null): string {
  if (meter == null) return '–'
  const unit = meter.kind === 'cpu' ? ' ms' : ''
  return `${compact(meter.used)}${unit} / ${compact(meter.limit)}${unit}`
}

/**
 * The Worker glyph shown before account and Worker names.
 *
 * The symbol ships a Right-to-Left variant; SF Symbols picks it from the layout
 * direction, so only the image is switched to RTL — the surrounding row keeps
 * its normal direction.
 */
function WorkerIcon({ size }: { size: number }) {
  return (
    <Image
      systemName="square.stack.3d.forward.dottedline"
      font={size}
      fontWeight="semibold"
      foregroundStyle="systemOrange"
      environments={{ layoutDirection: 'rightToLeft' }}
    />
  )
}

function Header({ title }: { title: string }) {
  return (
    <HStack spacing={4}>
      <Image systemName="cloud.fill" font={11} foregroundStyle="systemOrange" />
      <Text font={12} fontWeight="semibold" lineLimit={1}>
        {title}
      </Text>
      <Spacer />
    </HStack>
  )
}

function RingBlock({ view, size }: { view: View; size: number }) {
  const ratio = view.meter?.ratio ?? 0
  return (
    <UsageRing ratio={ratio} size={size} lineWidth={size / 9}>
      <VStack spacing={0}>
        <Text
          font={size / 4.2}
          fontWeight="bold"
          monospacedDigit
          foregroundStyle={
            view.meter != null ? levelColor(ratio) : 'secondaryLabel'
          }
          lineLimit={1}
          minScaleFactor={0.5}
        >
          {view.meter != null ? percent(ratio) : '–'}
        </Text>
        {view.meter?.kind === 'cpu' ? (
          <Text font={9} foregroundStyle="secondaryLabel">
            CPU
          </Text>
        ) : null}
      </VStack>
    </UsageRing>
  )
}

function SmallView({ view, now }: { view: View; now: number }) {
  return (
    <VStack spacing={4} padding={12}>
      <Header title={view.profile.alias} />
      <Spacer />
      <RingBlock view={view} size={70} />
      <Spacer />
      <Text
        font={12}
        fontWeight="medium"
        monospacedDigit
        lineLimit={1}
        minScaleFactor={0.6}
      >
        {meterText(view.meter)}
      </Text>
      <Text font={10} foregroundStyle="secondaryLabel" lineLimit={1}>
        {footnote(view, now)}
      </Text>
    </VStack>
  )
}

function WorkerList({ view, limit }: { view: View; limit: number }) {
  const workers = view.current ? view.snapshot!.perWorker.slice(0, limit) : []
  const daily = view.profile.plan === 'free'
  if (workers.length === 0) {
    return (
      <Text font={11} foregroundStyle="secondaryLabel">
        {i18n.workersEmpty}
      </Text>
    )
  }
  return (
    <VStack alignment="leading" spacing={5}>
      {workers.map((w) => (
        <HStack key={w.script} spacing={4}>
          <WorkerIcon size={10} />
          <Text font={12} lineLimit={1}>
            {w.script}
          </Text>
          <Spacer />
          <Text font={12} fontWeight="medium" monospacedDigit>
            {compact(daily ? w.todayRequests : w.requests)}
          </Text>
        </HStack>
      ))}
    </VStack>
  )
}

function MediumView({ view, now }: { view: View; now: number }) {
  return (
    <HStack spacing={14} padding={14}>
      <VStack spacing={6}>
        <RingBlock view={view} size={78} />
        <Text
          font={11}
          fontWeight="medium"
          monospacedDigit
          lineLimit={1}
          minScaleFactor={0.6}
        >
          {meterText(view.meter)}
        </Text>
      </VStack>
      <VStack alignment="leading" spacing={6}>
        <Header title={view.profile.alias} />
        <WorkerList view={view} limit={4} />
        <Spacer />
        <Text font={10} foregroundStyle="secondaryLabel" lineLimit={1}>
          {footnote(view, now)}
        </Text>
      </VStack>
    </HStack>
  )
}

function LargeView({
  views,
  target,
  now
}: {
  views: View[]
  target: View
  now: number
}) {
  return (
    <VStack alignment="leading" spacing={8} padding={14}>
      <Header title={i18n.appTitle} />
      {views.slice(0, 3).map((view) => (
        <HStack key={view.profile.id} spacing={10}>
          <RingBlock view={view} size={40} />
          <VStack alignment="leading" spacing={1}>
            <Text font={13} fontWeight="medium" lineLimit={1}>
              {view.profile.alias}
            </Text>
            <Text font={10} foregroundStyle="secondaryLabel" lineLimit={1}>
              {footnote(view, now)}
            </Text>
          </VStack>
          <Spacer />
          <Text font={12} monospacedDigit>
            {meterText(view.meter)}
          </Text>
        </HStack>
      ))}
      <Divider />
      {target.current && target.snapshot!.hourly.length > 0 ? (
        <Chart frame={{ height: 70 }} chartXAxis="hidden">
          <BarChart
            marks={target.snapshot!.hourly.map((p) => ({
              label: new Date(p.t),
              value: p.requests,
              unit: 'hour',
              foregroundStyle: 'systemOrange'
            }))}
          />
        </Chart>
      ) : null}
      <WorkerList view={target} limit={4} />
      <Spacer />
    </VStack>
  )
}

function WorkerView({
  view,
  script,
  now
}: {
  view: View
  script: string
  now: number
}) {
  const worker = view.current
    ? view.snapshot!.perWorker.find((w) => w.script === script)
    : undefined
  const cap = view.profile.watched.find(
    (w) => w.script === script
  )?.dailyRequests
  const today = worker?.todayRequests ?? 0
  const ratio = cap != null && cap > 0 ? today / cap : null

  return (
    <VStack alignment="leading" spacing={4} padding={12}>
      <Header title={script} />
      <Spacer />
      {view.snapshot == null ? (
        <Text font={11} foregroundStyle="secondaryLabel">
          {i18n.widgetWorkerMissing(script)}
        </Text>
      ) : (
        <HStack spacing={10}>
          <VStack alignment="leading" spacing={0}>
            <Text font={10} foregroundStyle="secondaryLabel">
              {i18n.today}
            </Text>
            <Text
              font={26}
              fontWeight="semibold"
              monospacedDigit
              lineLimit={1}
              minScaleFactor={0.5}
            >
              {compact(today)}
            </Text>
          </VStack>
          <Spacer />
          {ratio != null ? (
            <UsageRing ratio={ratio} size={40} lineWidth={5}>
              <Text font={10} fontWeight="semibold" monospacedDigit>
                {percent(ratio)}
              </Text>
            </UsageRing>
          ) : null}
        </HStack>
      )}
      <Spacer />
      {worker != null ? (
        <Text font={10} foregroundStyle="secondaryLabel" lineLimit={1}>
          {i18n.subrequests} {compact(worker.subrequests)} · {i18n.errors}{' '}
          {compact(worker.errors)}
        </Text>
      ) : null}
      <Text font={10} foregroundStyle="tertiaryLabel" lineLimit={1}>
        {view.profile.alias} · {footnote(view, now)}
      </Text>
    </VStack>
  )
}

function AccessoryView({ view }: { view: View }) {
  const ratio = Math.min(1, view.meter?.ratio ?? 0)
  switch (Widget.family) {
    case 'accessoryCircular':
      return (
        <Gauge
          value={ratio}
          label={<Image systemName="cloud.fill" />}
          currentValueLabel={
            <Text>{view.meter != null ? percent(view.meter.ratio) : '–'}</Text>
          }
          gaugeStyle="accessoryCircularCapacity"
        />
      )
    case 'accessoryInline':
      return <Text>☁︎ {meterText(view.meter)}</Text>
    default:
      return (
        <VStack alignment="leading" spacing={2}>
          <Text font="headline" lineLimit={1}>
            {view.profile.alias}
          </Text>
          <Text font="caption" monospacedDigit lineLimit={1}>
            {meterText(view.meter)}
          </Text>
          <Gauge
            value={ratio}
            label={<Text>{''}</Text>}
            gaugeStyle="accessoryLinearCapacity"
          />
        </VStack>
      )
  }
}

// --- Several targets -------------------------------------------------------------

/** One displayed row/column, whether it stands for an account or a Worker. */
type Item = {
  key: string
  title: string
  /** null when there is nothing to measure against (no data, or no cap set). */
  ratio: number | null
  /** Short text inside / next to the ring. */
  badge: string
  value: string
  caption: string
}

function accountItem(view: View, now: number): Item {
  return {
    key: view.profile.id,
    title: view.profile.alias,
    ratio: view.meter?.ratio ?? null,
    badge: view.meter != null ? percent(view.meter.ratio) : '–',
    value: meterText(view.meter),
    caption: footnote(view, now)
  }
}

function workerItem(view: View, script: string, now: number): Item {
  const worker = view.current
    ? view.snapshot!.perWorker.find((w) => w.script === script)
    : undefined
  const cap = view.profile.watched.find(
    (w) => w.script === script
  )?.dailyRequests
  const today = worker?.todayRequests ?? 0
  const ratio = view.current && cap != null && cap > 0 ? today / cap : null
  return {
    key: `${view.profile.id}/${script}`,
    title: script,
    ratio,
    badge: ratio != null ? percent(ratio) : view.current ? compact(today) : '–',
    value: !view.current
      ? '–'
      : cap != null
        ? `${compact(today)} / ${compact(cap)}`
        : `${i18n.today} ${compact(today)}`,
    caption: `${view.profile.alias} · ${footnote(view, now)}`
  }
}

function itemFor(
  target: Target,
  snapshots: Record<string, UsageSnapshot>,
  now: number
): Item {
  const view = viewFor(target.profile, snapshots, now)
  return target.script != null
    ? workerItem(view, target.script, now)
    : accountItem(view, now)
}

/**
 * A thick capsule bar with the percentage written on it. Hand-drawn because
 * `ProgressView`'s thickness is fixed and it cannot carry a label.
 *
 * The label sits just inside the end of the fill, in white, when the fill is
 * wide enough to hold it; otherwise just past the end, on the grey track, in
 * the bar's colour — so it is always readable and always marks where usage is.
 */
function UsageBar({
  item,
  width,
  height
}: {
  item: Item
  width: number
  height: number
}) {
  const ratio = item.ratio
  const color = ratio != null ? levelColor(ratio) : 'systemGray3'
  const fraction = ratio == null || ratio <= 0 ? 0 : Math.min(1, ratio)
  const label = ratio != null ? percent(ratio) : item.badge
  const labelFont = Math.round(height * 0.64)
  // Bold monospaced digits are ~0.62em wide; estimate a little wide so a white
  // label never spills past the end of the fill onto the grey track.
  const labelWidth = label.length * labelFont * 0.68
  const inset = 6

  // Never thinner than a circle, so a tiny but non-zero usage still shows.
  const fill = fraction > 0 ? Math.max(height, width * fraction) : 0
  const inside = fill >= labelWidth + inset * 2
  const leading = inside
    ? fill - labelWidth - inset
    : Math.min(fill + inset, width - labelWidth - inset)

  return (
    <ZStack alignment="leading" frame={{ width, height }}>
      <Capsule fill="systemGray5" />
      {fill > 0 ? (
        <Capsule fill={color} frame={{ width: fill, height }} />
      ) : null}
      <Text
        font={labelFont}
        fontWeight="bold"
        monospacedDigit
        lineLimit={1}
        foregroundStyle={inside ? 'white' : color}
        padding={{ leading: Math.max(inset, leading) }}
      >
        {label}
      </Text>
    </ZStack>
  )
}

/**
 * One account (or Worker) as a horizontal bar: name top-left, used / limit
 * top-right, the bar underneath.
 */
function BarRow({
  item,
  font,
  bar,
  width,
  caption
}: {
  item: Item
  font: number
  bar: number
  width: number
  caption: boolean
}) {
  return (
    <VStack alignment="leading" spacing={4}>
      <HStack spacing={6}>
        <HStack spacing={4}>
          <WorkerIcon size={font - 2} />
          <Text font={font} fontWeight="medium" lineLimit={1}>
            {item.title}
          </Text>
        </HStack>
        <Spacer minLength={4} />
        <Text
          font={font}
          monospacedDigit
          foregroundStyle={
            item.ratio != null ? levelColor(item.ratio) : 'secondaryLabel'
          }
          lineLimit={1}
          minScaleFactor={0.7}
        >
          {item.value}
        </Text>
      </HStack>
      <UsageBar item={item} width={width} height={bar} />
      {caption ? (
        <Text font={10} foregroundStyle="secondaryLabel" lineLimit={1}>
          {item.caption}
        </Text>
      ) : null}
    </VStack>
  )
}

/** Inner padding of the bar list; the bars span the widget minus this on each side. */
const BAR_PADDING = 14

/**
 * The bar's width comes from the widget's own size rather than a
 * `GeometryReader`: in a widget the reader ignores a fixed height and grows to
 * share the leftover space, which spread the rows far apart.
 */
function barWidth(): number {
  const width = Widget.displaySize?.width ?? 0
  return width > BAR_PADDING * 2 ? width - BAR_PADDING * 2 : 130
}

/**
 * How many bars fit, and whether each gets its caption line. `spacing` is the
 * gap between rows; `headerGap` is the gap under the title, kept a little
 * larger so the title reads as a heading rather than as another row.
 */
const BAR_LAYOUT = {
  systemSmall: {
    limit: 3,
    font: 11,
    bar: 13,
    caption: false,
    spacing: 7,
    headerGap: 11
  },
  systemMedium: {
    limit: 3,
    font: 13,
    bar: 15,
    caption: false,
    spacing: 7,
    headerGap: 11
  },
  systemLarge: {
    limit: 6,
    font: 14,
    bar: 18,
    caption: true,
    spacing: 11,
    headerGap: 16
  }
} as const

function BarList({
  items,
  layout
}: {
  items: Item[]
  layout: (typeof BAR_LAYOUT)[keyof typeof BAR_LAYOUT]
}) {
  const shown = items.slice(0, layout.limit)
  const hidden = items.length - shown.length
  const width = barWidth()
  return (
    <VStack alignment="leading" spacing={layout.spacing} padding={BAR_PADDING}>
      <HStack
        spacing={4}
        padding={{ bottom: layout.headerGap - layout.spacing }}
      >
        <Image
          systemName="cloud.fill"
          font={11}
          foregroundStyle="systemOrange"
        />
        <Text font={12} fontWeight="semibold" lineLimit={1}>
          {i18n.appTitle}
        </Text>
        <Spacer />
        {hidden > 0 ? (
          <Text font={11} foregroundStyle="secondaryLabel">
            +{hidden}
          </Text>
        ) : null}
      </HStack>
      {shown.map((item) => (
        <BarRow
          key={item.key}
          item={item}
          font={layout.font}
          bar={layout.bar}
          width={width}
          caption={layout.caption}
        />
      ))}
      <Spacer minLength={0} />
    </VStack>
  )
}

function MultiView({ items }: { items: Item[] }) {
  switch (Widget.family) {
    case 'accessoryCircular': {
      const item = items[0]
      return (
        <Gauge
          value={Math.min(1, item.ratio ?? 0)}
          label={<Image systemName="cloud.fill" />}
          currentValueLabel={<Text>{item.badge}</Text>}
          gaugeStyle="accessoryCircularCapacity"
        />
      )
    }
    case 'accessoryInline':
      return (
        <Text>
          ☁︎{' '}
          {items
            .slice(0, 2)
            .map((item) => `${item.title} ${item.badge}`)
            .join(' · ')}
        </Text>
      )
    case 'accessoryRectangular':
      return (
        <VStack alignment="leading" spacing={1}>
          {items.slice(0, 3).map((item) => (
            <HStack key={item.key} spacing={4}>
              <Text font="caption" lineLimit={1}>
                {item.title}
              </Text>
              <Spacer />
              <Text font="caption" fontWeight="semibold" monospacedDigit>
                {item.badge}
              </Text>
            </HStack>
          ))}
        </VStack>
      )
    case 'systemSmall':
      return <BarList items={items} layout={BAR_LAYOUT.systemSmall} />
    case 'systemLarge':
    case 'systemExtraLarge':
      return <BarList items={items} layout={BAR_LAYOUT.systemLarge} />
    default:
      return <BarList items={items} layout={BAR_LAYOUT.systemMedium} />
  }
}

function EmptyView() {
  return (
    <VStack spacing={6} padding={14}>
      <Image systemName="cloud" foregroundStyle="secondaryLabel" />
      <Text
        font="caption"
        foregroundStyle="secondaryLabel"
        multilineTextAlignment="center"
      >
        {i18n.widgetEmpty}
      </Text>
    </VStack>
  )
}

function build(profiles: Profile[], targets: Target[]) {
  if (targets.length === 0) return <EmptyView />
  const now = Date.now()
  const snapshots = loadSnapshots()

  if (targets.length > 1) {
    return <MultiView items={targets.map((t) => itemFor(t, snapshots, now))} />
  }

  const target = targets[0]
  const view = viewFor(target.profile, snapshots, now)

  switch (Widget.family) {
    case 'accessoryCircular':
    case 'accessoryRectangular':
    case 'accessoryInline':
      return <AccessoryView view={view} />
    case 'systemSmall':
      return target.script != null ? (
        <WorkerView view={view} script={target.script} now={now} />
      ) : (
        <SmallView view={view} now={now} />
      )
    case 'systemLarge':
    case 'systemExtraLarge':
      return (
        <LargeView
          views={profiles.map((p) => viewFor(p, snapshots, now))}
          target={view}
          now={now}
        />
      )
    default:
      return target.script != null ? (
        <WorkerView view={view} script={target.script} now={now} />
      ) : (
        <MediumView view={view} now={now} />
      )
  }
}

// --- Entry point -------------------------------------------------------------------

async function main() {
  const reloadPolicy = {
    policy: 'after',
    date: new Date(Date.now() + REFRESH_MINUTES * 60 * 1000)
  } as const

  const profiles = loadProfiles()
  const targets = parseTargets(Widget.parameter ?? '', profiles)

  try {
    await withBudget(runBackgroundWork(targets, profiles), BACKGROUND_BUDGET_MS)
  } catch {
    // Never allowed to prevent the render.
  }

  try {
    Widget.present(build(profiles, targets), { reloadPolicy })
  } catch {
    Widget.present(<EmptyView />, { reloadPolicy })
  }
}

main()
