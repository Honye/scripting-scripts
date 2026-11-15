import {
  Button,
  Divider,
  HStack,
  Image,
  LazyVGrid,
  List,
  Navigation,
  NavigationStack,
  ProgressView,
  Rectangle,
  ScrollView,
  Section,
  Spacer,
  Text,
  VStack,
  useEffect,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { formatDate, formatMoney } from '../format'
import { regionFor } from '../regions'
import { chargesInMonth, isBillable, totalsByCurrency } from '../billing'
import { SubscriptionDetail } from './SubscriptionDetail'
import type { EntryDraft } from './EntryEditor'
import type { Account, AppRef, Entry } from '../types'

/** Icons a day cell shows before folding the rest into "+N". */
const MAX_ICONS = 4
const ICON = 20

const COLUMNS = Array.from({ length: 7 }, () => ({
  size: { type: 'flexible' as const },
  spacing: 4
}))

/**
 * A month at a glance: every day an active subscription charges shows the
 * icon of the app it belongs to — one icon per subscription, so an app with a
 * monthly and an add-on plan shows twice. Tapping an icon opens that record.
 *
 * Paused subscriptions are left out entirely (`isBillable`), the same rule the
 * reminders and the alert levels follow.
 *
 * Like `AccountDetail`, it keeps its own copy of the records: a pushed screen
 * does not reliably see the parent's new props, and an edit made from the
 * detail sheet has to move the icon straight away.
 */
export function SubscriptionCalendar({
  accounts,
  entries,
  appRefs,
  onSaveEntry
}: {
  accounts: Account[]
  entries: Entry[]
  appRefs: Record<string, AppRef>
  onSaveEntry: (draft: EntryDraft) => void
}) {
  const [records, setRecords] = useState<Entry[]>(entries)
  const [refs, setRefs] = useState<Record<string, AppRef>>(appRefs)
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  /** Day of the shown month the user picked; starts on today, cleared by paging. */
  const [selected, setSelected] = useState<number | null>(() =>
    new Date().getDate()
  )

  useEffect(() => {
    setRecords(entries)
  }, [entries])

  useEffect(() => {
    setRefs(appRefs)
  }, [appRefs])

  const now = new Date()
  const isCurrentMonth =
    cursor.year === now.getFullYear() && cursor.month === now.getMonth()
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()

  const charges = chargesInMonth(records, cursor.year, cursor.month)
  const hasAny = records.some(isBillable)
  const allCharges = Array.from(charges.values()).flat()
  const totals = totalsByCurrency(allCharges)

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay()
  const weekStart = i18n.weekStartsMonday ? 1 : 0
  const leading = (firstWeekday - weekStart + 7) % 7
  const weekdays = Array.from(
    { length: 7 },
    (_, i) => i18n.weekdaysShort[(i + weekStart) % 7]
  )

  const monthTitle = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    i18n.dateLocale,
    { year: 'numeric', month: 'long' }
  )

  const shift = (delta: number) => {
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
    setSelected(null)
  }

  const goToday = () => {
    const today = new Date()
    setCursor({ year: today.getFullYear(), month: today.getMonth() })
    setSelected(today.getDate())
  }

  /** Reported up to `App`, and applied here so the calendar moves at once. */
  const saved = (draft: EntryDraft) => {
    setRecords((prev) => {
      const index = prev.findIndex((e) => e.id === draft.entry.id)
      if (index < 0) return [...prev, draft.entry]
      const next = [...prev]
      next[index] = draft.entry
      return next
    })
    if (draft.appRef != null) {
      const appRef = draft.appRef
      setRefs((prev) => ({ ...prev, [appRef.appId]: appRef }))
    }
    onSaveEntry(draft)
  }

  const openDetail = async (entry: Entry, day: number) => {
    await Navigation.present({
      element: (
        <SubscriptionDetail
          entry={entry}
          accounts={accounts}
          appRefs={refs}
          chargeAt={new Date(cursor.year, cursor.month, day).getTime()}
          onSaved={saved}
        />
      )
    })
  }

  const openDay = async (day: number, list: Entry[]) => {
    const at = new Date(cursor.year, cursor.month, day).getTime()
    await Navigation.present({
      element: (
        <DaySheet
          title={formatDate(at, i18n.dateLocale)}
          list={list}
          accounts={accounts}
          appRefs={refs}
          onOpen={(entry) => openDetail(entry, day)}
        />
      )
    })
  }

  const icon = (entry: Entry, day: number) => {
    const ref = refs[entry.appId]
    return (
      <Button
        key={entry.id}
        action={() => openDetail(entry, day)}
        buttonStyle="plain"
      >
        {ref?.iconUrl ? (
          <Image
            imageUrl={ref.iconUrl}
            resizable
            frame={{ width: ICON, height: ICON }}
            clipShape={{ type: 'rect', cornerRadius: 5, style: 'continuous' }}
            placeholder={<ProgressView controlSize="mini" />}
          />
        ) : (
          <Image
            systemName="app.dashed"
            font={16}
            foregroundStyle="tertiaryLabel"
            frame={{ width: ICON, height: ICON }}
          />
        )}
      </Button>
    )
  }

  const overflow = (count: number, day: number, list: Entry[]) => (
    <Button key="more" action={() => openDay(day, list)} buttonStyle="plain">
      <Text
        font={10}
        fontWeight="semibold"
        foregroundStyle="secondaryLabel"
        frame={{ width: ICON, height: ICON }}
        background={{
          style: 'tertiarySystemFill',
          shape: { type: 'rect', cornerRadius: 5, style: 'continuous' }
        }}
      >
        +{count}
      </Text>
    </Button>
  )

  /** Up to two rows of two; a fifth subscription turns the last slot into "+N". */
  const icons = (day: number, list: Entry[]) => {
    const shown = list.length > MAX_ICONS ? list.slice(0, MAX_ICONS - 1) : list
    const nodes = shown.map((entry) => icon(entry, day))
    if (list.length > MAX_ICONS) {
      nodes.push(overflow(list.length - shown.length, day, list))
    }
    const rows = [nodes.slice(0, 2), nodes.slice(2, 4)].filter(
      (r) => r.length > 0
    )
    return (
      <VStack spacing={3}>
        {rows.map((row, index) => (
          <HStack key={index} spacing={3}>
            {row}
          </HStack>
        ))}
      </VStack>
    )
  }

  /**
   * Only today and the picked day get a fill, on the number itself: a tinted
   * cell for every charge day turned the month into a checkerboard and hid the
   * one day the user was actually looking at. The icons already say which days
   * charge.
   */
  const cell = (day: number) => {
    const list = charges.get(day) ?? []
    const at = new Date(cursor.year, cursor.month, day).getTime()
    const isToday = at === todayStart
    const isSelected = selected === day
    return (
      <VStack
        key={`d${day}`}
        spacing={4}
        frame={{ maxWidth: 'infinity', minHeight: 84, alignment: 'top' }}
        padding={{ vertical: 4 }}
        contentShape="rect"
        onTapGesture={() => setSelected(day)}
      >
        <Text
          font={17}
          fontWeight="bold"
          foregroundStyle={
            isToday ? 'white' : isSelected ? 'systemBlue' : 'label'
          }
          frame={{ width: 32, height: 32 }}
          background={
            isToday
              ? { style: 'systemBlue', shape: 'circle' }
              : isSelected
                ? {
                    style: { color: 'systemBlue', opacity: 0.15 },
                    shape: 'circle'
                  }
                : undefined
          }
        >
          {String(day)}
        </Text>
        {list.length > 0 ? icons(day, list) : null}
      </VStack>
    )
  }

  const blanks = Array.from({ length: leading }, (_, i) => (
    <Rectangle key={`b${i}`} fill="clear" frame={{ height: 1 }} />
  ))

  return (
    <ScrollView
      navigationTitle={i18n.subscriptionCalendar}
      navigationBarTitleDisplayMode="inline"
      toolbar={{
        topBarTrailing: isCurrentMonth
          ? []
          : [<Button title={i18n.calendarToday} action={goToday} />]
      }}
      background={<Rectangle fill="systemGroupedBackground" ignoresSafeArea />}
    >
      <VStack spacing={14} padding={{ horizontal: 12, vertical: 12 }}>
        <VStack
          spacing={12}
          padding={{ horizontal: 6, top: 12, bottom: 6 }}
          background={{
            style: 'secondarySystemGroupedBackground',
            shape: { type: 'rect', cornerRadius: 16, style: 'continuous' }
          }}
        >
          <HStack padding={{ horizontal: 8 }}>
            <Button action={() => shift(-1)} buttonStyle="borderless">
              <Image systemName="chevron.left" font="title3" />
            </Button>
            <Spacer />
            <Text font="title3" fontWeight="semibold">
              {monthTitle}
            </Text>
            <Spacer />
            <Button action={() => shift(1)} buttonStyle="borderless">
              <Image systemName="chevron.right" font="title3" />
            </Button>
          </HStack>

          <VStack spacing={6}>
            <LazyVGrid columns={COLUMNS} spacing={4}>
              {weekdays.map((label, index) => (
                <Text
                  key={`w${index}`}
                  font="caption"
                  fontWeight="medium"
                  foregroundStyle="secondaryLabel"
                >
                  {label}
                </Text>
              ))}
            </LazyVGrid>
            <LazyVGrid columns={COLUMNS} spacing={4}>
              {[
                ...blanks,
                ...Array.from({ length: daysInMonth }, (_, i) => cell(i + 1))
              ]}
            </LazyVGrid>
          </VStack>
        </VStack>

        {selected == null || selected > daysInMonth ? null : (
          <VStack
            alignment="leading"
            spacing={0}
            frame={{ maxWidth: 'infinity', alignment: 'leading' }}
            padding={{ horizontal: 16, vertical: 6 }}
            background={{
              style: 'secondarySystemGroupedBackground',
              shape: { type: 'rect', cornerRadius: 16, style: 'continuous' }
            }}
          >
            <Text
              font="subheadline"
              fontWeight="semibold"
              padding={{ vertical: 8 }}
            >
              {formatDate(
                new Date(cursor.year, cursor.month, selected).getTime(),
                i18n.dateLocale
              )}
            </Text>
            {(charges.get(selected) ?? []).length === 0 ? (
              <Text foregroundStyle="secondaryLabel" padding={{ bottom: 8 }}>
                {i18n.calendarDayEmpty}
              </Text>
            ) : (
              (charges.get(selected) ?? []).map((entry) => (
                <VStack key={entry.id} spacing={0}>
                  <Divider />
                  <ChargeRow
                    entry={entry}
                    account={accounts.find((a) => a.id === entry.accountId)}
                    appRef={refs[entry.appId]}
                    padding={{ vertical: 8 }}
                    onOpen={() => openDetail(entry, selected)}
                  />
                </VStack>
              ))
            )}
          </VStack>
        )}

        <VStack
          alignment="leading"
          spacing={8}
          frame={{ maxWidth: 'infinity', alignment: 'leading' }}
          padding={{ horizontal: 16, vertical: 14 }}
          background={{
            style: 'secondarySystemGroupedBackground',
            shape: { type: 'rect', cornerRadius: 16, style: 'continuous' }
          }}
        >
          {!hasAny ? (
            <Text foregroundStyle="secondaryLabel">{i18n.upcomingEmpty}</Text>
          ) : allCharges.length === 0 ? (
            <Text foregroundStyle="secondaryLabel">
              {i18n.calendarMonthEmpty}
            </Text>
          ) : (
            <VStack alignment="leading" spacing={8}>
              <Text font="subheadline" fontWeight="semibold">
                {i18n.calendarMonthSummary(allCharges.length)}
              </Text>
              {totals.map(([currency, amount], index) => (
                <VStack key={currency} spacing={8}>
                  {index === 0 ? null : <Divider />}
                  <HStack>
                    <Text foregroundStyle="secondaryLabel">{currency}</Text>
                    <Spacer />
                    <Text fontWeight="semibold">
                      {formatMoney(amount, currency)}
                    </Text>
                  </HStack>
                </VStack>
              ))}
            </VStack>
          )}
        </VStack>

        <Text
          font="caption"
          foregroundStyle="secondaryLabel"
          frame={{ maxWidth: 'infinity', alignment: 'leading' }}
          padding={{ horizontal: 16 }}
        >
          {totals.length > 1
            ? `${i18n.calendarProjectedNote} ${i18n.totalSpentMixed}`
            : i18n.calendarProjectedNote}
        </Text>
      </VStack>
    </ScrollView>
  )
}

/**
 * Every subscription charged on one day, for a day with more than fit in its
 * cell. Rows open the same detail sheet the icons do.
 */
function DaySheet({
  title,
  list,
  accounts,
  appRefs,
  onOpen
}: {
  title: string
  list: Entry[]
  accounts: Account[]
  appRefs: Record<string, AppRef>
  onOpen: (entry: Entry) => void
}) {
  const dismiss = Navigation.useDismiss()
  const byId = new Map(accounts.map((a) => [a.id, a]))

  return (
    <NavigationStack>
      <List
        navigationTitle={title}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarTrailing: [
            <Button title={i18n.done} action={() => dismiss()} />
          ]
        }}
      >
        <Section>
          {list.map((entry) => (
            <ChargeRow
              key={entry.id}
              entry={entry}
              account={byId.get(entry.accountId)}
              appRef={appRefs[entry.appId]}
              onOpen={() => onOpen(entry)}
            />
          ))}
        </Section>
      </List>
    </NavigationStack>
  )
}

/** One charge: icon, plan, account and price; tapping opens the detail sheet. */
function ChargeRow({
  entry,
  account,
  appRef,
  padding,
  onOpen
}: {
  entry: Entry
  account?: Account
  appRef?: AppRef
  padding?: { vertical: number }
  onOpen: () => void
}) {
  const region = account != null ? regionFor(account.region) : null
  return (
    <Button action={onOpen} buttonStyle="plain">
      <HStack spacing={10} padding={padding} contentShape="rect">
        {appRef?.iconUrl ? (
          <Image
            imageUrl={appRef.iconUrl}
            resizable
            frame={{ width: 32, height: 32 }}
            clipShape={{ type: 'rect', cornerRadius: 7 }}
            placeholder={<ProgressView />}
          />
        ) : (
          <Image
            systemName="app.dashed"
            font={22}
            foregroundStyle="tertiaryLabel"
            frame={{ width: 32, height: 32 }}
          />
        )}
        <VStack alignment="leading" spacing={2}>
          <Text foregroundStyle="label" lineLimit={1}>
            {entry.title}
          </Text>
          <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>
            {region?.flag ?? ''} {account?.alias ?? ''}
          </Text>
        </VStack>
        <Spacer />
        <Text foregroundStyle="secondaryLabel">
          {formatMoney(entry.price, entry.currency)}
        </Text>
      </HStack>
    </Button>
  )
}
