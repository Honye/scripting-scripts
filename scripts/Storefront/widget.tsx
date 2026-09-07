import { HStack, Image, Spacer, Text, VStack, Widget } from 'scripting'
import { i18n } from './i18n'
import { daysUntil, formatMoney, isBalanceStale } from './format'
import { regionFor } from './regions'
import { isBillable, rankAccounts } from './billing'
import { countPending, notifyNow, rescheduleAll } from './notifications'
import { renderReminder } from './notify_text'
import { refreshItem } from './tf_status'
import {
  loadAccounts,
  loadEntries,
  loadSettings,
  loadTFItems,
  saveTFItems
} from './store'
import type { AccountStanding } from './billing'

/**
 * Home Screen widget (FR-WG-01..05).
 *
 * The one inviolable rule in this file: **`Widget.present` is always reached.**
 * A widget extension that throws, or that runs out of time before presenting,
 * shows the user a blank rectangle with no error and no way to diagnose it. So
 * every piece of optional work is individually wrapped and individually
 * budgeted, and the render itself depends on none of it.
 *
 * Two things this file deliberately does not do:
 *
 *  - **It never fetches an App Store product page.** Those are 670–780KB, and a
 *    widget extension has a far smaller memory ceiling than the app. Only the
 *    TestFlight pages (~40KB) are cheap enough to touch here.
 *  - **It never imports `credentials.ts`.** The widget has no business with
 *    passwords, and it can be rendered while the device is locked.
 */

/** Hard ceiling on all background work, well inside the extension's budget. */
const BACKGROUND_BUDGET_MS = 15000
/** Per-TestFlight-check budget (FR-TF-07). */
const TF_CHECK_TIMEOUT_MS = 6000
/** How many TestFlight items one refresh may check. */
const TF_CHECK_LIMIT = 3

const REFRESH_MINUTES = 60

function withBudget<T>(work: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    work.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  ])
}

// --- Views -----------------------------------------------------------------

function AccountRow({
  standing,
  compact
}: {
  standing: AccountStanding
  compact: boolean
}) {
  const { account, level, next } = standing
  const region = regionFor(account.region)
  const tint = level === 'severe' ? 'systemRed' : 'label'

  return (
    <HStack spacing={6}>
      <Text font={compact ? 13 : 14}>{region.flag}</Text>
      <Text font={compact ? 13 : 14} lineLimit={1} foregroundStyle="label">
        {account.alias}
      </Text>
      {level === 'severe' ? (
        <Image
          systemName="exclamationmark.triangle.fill"
          font={10}
          foregroundStyle="systemRed"
        />
      ) : level === 'warn' ? (
        <Image
          systemName="exclamationmark.circle"
          font={10}
          foregroundStyle="systemOrange"
        />
      ) : null}
      <Spacer />
      <VStack alignment="trailing" spacing={0}>
        <Text font={compact ? 13 : 14} fontWeight="medium" foregroundStyle={tint}>
          {formatMoney(account.balance, account.currency)}
        </Text>
        {next != null ? (
          <Text font={10} foregroundStyle="secondaryLabel">
            {formatMoney(next.price, next.currency)} ·{' '}
            {i18n.dueIn(daysUntil(next.nextBillingAt!))}
          </Text>
        ) : null}
      </VStack>
    </HStack>
  )
}

/** small: one account — the one most in need of attention (FR-WG-03). */
function SmallView({ standing }: { standing: AccountStanding }) {
  const { account, level, next } = standing
  const region = regionFor(account.region)

  return (
    <VStack alignment="leading" spacing={4} padding={14}>
      <HStack spacing={5}>
        <Text font={16}>{region.flag}</Text>
        <Text font={13} lineLimit={1}>
          {account.alias}
        </Text>
        <Spacer />
      </HStack>
      <Text
        font={24}
        fontWeight="semibold"
        foregroundStyle={level === 'severe' ? 'systemRed' : 'label'}
        lineLimit={1}
        minScaleFactor={0.6}
      >
        {formatMoney(account.balance, account.currency)}
      </Text>
      {isBalanceStale(account.balanceUpdatedAt) ? (
        <Text font={10} foregroundStyle="systemOrange" lineLimit={1}>
          {i18n.balanceStale}
        </Text>
      ) : null}
      <Spacer />
      {next != null ? (
        <VStack alignment="leading" spacing={1}>
          <Text font={11} foregroundStyle="secondaryLabel" lineLimit={1}>
            {next.title}
          </Text>
          <Text
            font={12}
            fontWeight="medium"
            foregroundStyle={level === 'severe' ? 'systemRed' : 'label'}
            lineLimit={1}
          >
            {formatMoney(next.price, next.currency)} ·{' '}
            {i18n.dueIn(daysUntil(next.nextBillingAt!))}
          </Text>
        </VStack>
      ) : (
        <Text font={11} foregroundStyle="secondaryLabel">
          {i18n.noSubscriptions}
        </Text>
      )}
    </VStack>
  )
}

function ListView({
  standings,
  limit
}: {
  standings: AccountStanding[]
  limit: number
}) {
  return (
    <VStack alignment="leading" spacing={5} padding={14}>
      <HStack>
        <Text font={11} fontWeight="medium" foregroundStyle="secondaryLabel">
          {i18n.appTitle}
        </Text>
        <Spacer />
        <Text font={11} foregroundStyle="tertiaryLabel">
          {i18n.widgetAccountCount(standings.length)}
        </Text>
      </HStack>
      {standings.slice(0, limit).map((standing) => (
        <AccountRow
          key={standing.account.id}
          standing={standing}
          compact={limit > 4}
        />
      ))}
      <Spacer />
    </VStack>
  )
}

function EmptyView() {
  return (
    <VStack spacing={4} padding={14}>
      <Image systemName="creditcard" foregroundStyle="secondaryLabel" />
      <Text font="caption" foregroundStyle="secondaryLabel">
        {i18n.widgetEmpty}
      </Text>
    </VStack>
  )
}

/** Lock Screen families get one line — there is room for nothing else. */
function AccessoryView({ standing }: { standing: AccountStanding }) {
  const { account, level, next } = standing
  return (
    <HStack spacing={4}>
      <Image
        systemName={level === 'severe' ? 'exclamationmark.triangle.fill' : 'creditcard'}
      />
      <Text lineLimit={1}>
        {formatMoney(account.balance, account.currency)}
        {next != null ? ` · ${i18n.dueIn(daysUntil(next.nextBillingAt!))}` : ''}
      </Text>
    </HStack>
  )
}

function build() {
  const accounts = loadAccounts()
  if (accounts.length === 0) return <EmptyView />

  const standings = rankAccounts(accounts, loadEntries())
  const family = Widget.family

  switch (family) {
    case 'accessoryCircular':
    case 'accessoryRectangular':
    case 'accessoryInline':
      return <AccessoryView standing={standings[0]} />
    case 'systemSmall':
      return <SmallView standing={standings[0]} />
    case 'systemLarge':
    case 'systemExtraLarge':
      return <ListView standings={standings} limit={8} />
    default:
      return <ListView standings={standings} limit={4} />
  }
}

// --- Background work (FR-WG-04) --------------------------------------------

/**
 * FR-ALERT-07 asks the widget to help keep reminders fresh, but the widget must
 * never *destroy* them: `rescheduleAll` clears before it schedules, and if the
 * extension turns out to be unable to schedule notifications, that sequence
 * would silently wipe every reminder the app had set. So the widget only ever
 * fills a gap it finds — when nothing at all is pending — and otherwise leaves
 * the main app's set alone.
 */
async function topUpReminders() {
  const accounts = loadAccounts()
  const entries = loadEntries()
  if (!entries.some(isBillable)) return

  const pending = await countPending()
  if (pending !== 0) return

  await rescheduleAll(accounts, entries, loadSettings().reminderLeadDays, (plan) =>
    renderReminder(plan, accounts)
  )
}

/** FR-TF-07: opportunistic, capped, and least-recently-checked first. */
async function checkSomeTestFlights() {
  const items = loadTFItems()
  if (items.length === 0) return

  const candidates = items
    .filter((item) => item.statusIsManual !== true)
    .sort((a, b) => (a.statusCheckedAt ?? 0) - (b.statusCheckedAt ?? 0))
    .slice(0, TF_CHECK_LIMIT)

  let changed = false
  const next = [...items]

  for (const item of candidates) {
    const result = await refreshItem(item, TF_CHECK_TIMEOUT_MS)
    if (result == null) continue
    const index = next.findIndex((t) => t.id === result.item.id)
    if (index >= 0) next[index] = result.item
    changed = true
    if (result.becameOpen) {
      await notifyNow(i18n.tfOpenedTitle(result.item.name), i18n.tfOpenedBody, {
        tfItemId: result.item.id
      })
    }
  }

  if (changed) saveTFItems(next)
}

async function runBackgroundWork() {
  const started = Date.now()
  const remaining = () => BACKGROUND_BUDGET_MS - (Date.now() - started)

  // Reminders first: cheap, local, and the thing the user actually depends on.
  await withBudget(topUpReminders(), Math.min(4000, Math.max(0, remaining())))
  await withBudget(checkSomeTestFlights(), Math.max(0, remaining()))
}

// --- Entry point -----------------------------------------------------------

async function main() {
  const reloadPolicy = {
    policy: 'after',
    date: new Date(Date.now() + REFRESH_MINUTES * 60 * 1000)
  } as const

  // Never allowed to prevent the render.
  try {
    await withBudget(runBackgroundWork(), BACKGROUND_BUDGET_MS)
  } catch {
    // Intentionally swallowed.
  }

  try {
    Widget.present(build(), { reloadPolicy })
  } catch {
    Widget.present(<EmptyView />, { reloadPolicy })
  }
}

main()
