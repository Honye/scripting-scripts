import {
  Button,
  ForEach,
  HStack,
  Image,
  List,
  Rectangle,
  Text,
  VStack,
  useEffect,
  useObservable,
  useState
} from 'scripting'
import type { Color, DynamicShapeStyle } from 'scripting'
import type { Schedule, Show } from '../types'
import { airsOnDay, getTodayIndex, showsForDay } from '../data'
import { theme } from '../theme'
import { i18n } from '../i18n'
import { EpisodeCard } from '../components'

const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6]

/**
 * Strips the List's default row chrome so the cards keep their standalone look.
 * The 5pt top/bottom insets add up to the 10pt gap the cards used to get from `spacing`.
 */
function rowStyle() {
  return {
    listRowInsets: { top: 5, leading: 20, bottom: 5, trailing: 20 },
    listRowBackground: <Rectangle fill="clear" />,
    listRowSeparator: 'hidden'
  } as const
}

function DaySelector({
  selectedDay,
  setSelectedDay,
  today,
  countPerDay
}: {
  selectedDay: number
  setSelectedDay: (d: number) => void
  today: number
  countPerDay: number[]
}) {
  return (
    <HStack
      spacing={2}
      padding={4}
      background={{
        style: theme.surfaceAlt,
        shape: { type: 'rect', cornerRadius: 14 }
      }}
    >
      {WEEK_DAYS.map((d) => {
        const isSelected = d === selectedDay
        const isToday = d === today
        const cnt = countPerDay[d]
        const labelColor: Color | DynamicShapeStyle = isSelected
          ? 'white'
          : isToday
            ? theme.brandEnd
            : theme.textTertiary
        return (
          <Button key={d} action={() => setSelectedDay(d)} buttonStyle="plain">
            <VStack
              spacing={3}
              padding={{ horizontal: 4, vertical: 7 }}
              frame={{ maxWidth: 'infinity' }}
              background={
                isSelected
                  ? {
                      style: {
                        colors: [theme.brandStart, theme.brandEnd],
                        startPoint: 'topLeading',
                        endPoint: 'bottomTrailing'
                      },
                      shape: { type: 'rect', cornerRadius: 10 }
                    }
                  : undefined
              }
            >
              <Text
                font={12}
                fontWeight={isSelected ? 'bold' : 'regular'}
                foregroundStyle={labelColor}
              >
                {i18n.daysShort[d]}
              </Text>
              {cnt > 0 ? (
                <Text
                  font={9}
                  fontWeight="semibold"
                  foregroundStyle={
                    isSelected ? 'rgba(255,255,255,0.85)' as Color : theme.textQuaternary
                  }
                >
                  {cnt}
                </Text>
              ) : (
                <Text font={9} foregroundStyle="clear">
                 ·
                </Text>
              )}
            </VStack>
          </Button>
        )
      })}
    </HStack>
  )
}

function EmptyState({ day }: { day: number }) {
  return (
    <VStack
      spacing={12}
      padding={{ vertical: 60 }}
      frame={{ maxWidth: 'infinity' }}
    >
      <Image
        systemName="moon.zzz"
        font={38}
        foregroundStyle={theme.text15}
      />
      <Text
        font={14}
        foregroundStyle={theme.textDisabled}
        multilineTextAlignment="center"
      >
        {i18n.homeNoUpdates(i18n.daysFull[day])}
      </Text>
    </VStack>
  )
}

/** One draggable row: a show plus every airing it has on the selected day. */
type DayItem = {
  id: string
  show: Show
  schedules: Schedule[]
}

export function HomeView({
  shows,
  onAddPress,
  onShowDetail,
  onReorder,
  onMarkWatched,
  onDelete
}: {
  shows: Show[]
  onAddPress: () => void
  onShowDetail: (show: Show) => void
  onReorder: (day: number, orderedIds: number[]) => void
  onMarkWatched: (id: number, day: number) => void
  onDelete: (id: number) => void
}) {
  const today = getTodayIndex()
  const [selectedDay, setSelectedDay] = useState(today)

  const countPerDay = WEEK_DAYS.map(
    (d) => shows.filter((s) => airsOnDay(s, d)).length
  )

  const items: DayItem[] = showsForDay(shows, selectedDay).map((show) => ({
    id: String(show.id),
    show,
    schedules: show.schedules.filter((sc) => sc.day === selectedDay)
  }))

  // `ForEach` reorders by rewriting this observable in place, so it has to be
  // re-seeded whenever the day or the shows themselves change.
  const rows = useObservable<DayItem[]>(() => items)
  const orderKey = (list: DayItem[]) => list.map((it) => it.id).join(',')

  useEffect(() => {
    rows.setValue(items)
  }, [shows, selectedDay])

  useEffect(() => {
    // Only a real drag should be persisted. Without this guard, merely opening a
    // day would freeze its air-time ordering into dayOrder.
    if (orderKey(rows.value) === orderKey(items)) return
    onReorder(
      selectedDay,
      rows.value.map((it) => it.show.id)
    )
  }, [rows.value])

  const dateLabel = new Date().toLocaleDateString(i18n.dateLocale, {
    month: 'long',
    day: 'numeric'
  })

  return (
    <VStack
      background={theme.bg}
      safeAreaInset={{
        top: {
          spacing: 0,
          content: (
            <VStack
              padding={{ horizontal: 20, top: 8, bottom: 8 }}
              background={theme.bg}
            >
              <DaySelector
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                today={today}
                countPerDay={countPerDay}
              />
            </VStack>
          )
        }
      }}
    >
      <List
        listStyle="plain"
        scrollContentBackground="hidden"
        navigationTitle={i18n.homeTitle}
        navigationSubtitle={`${dateLabel} · ${i18n.daysFull[today]}`}
        toolbar={{
          topBarTrailing: (
            <Button action={onAddPress}>
              <Image systemName="plus" />
            </Button>
          )
        }}
      >
        {items.length === 0 ? (
          <VStack {...rowStyle()}>
            <EmptyState day={selectedDay} />
          </VStack>
        ) : (
          <>
            <VStack {...rowStyle()} padding={{ top: 8, bottom: 2 }}>
              <Text
                font={12}
                fontWeight="medium"
                foregroundStyle={theme.textQuaternary}
                frame={{ maxWidth: 'infinity', alignment: 'leading' }}
              >
                {i18n.homeDayUpdatesHeader(
                  i18n.daysFull[selectedDay],
                  items.length
                )}
              </Text>
            </VStack>
            <ForEach
              data={rows}
              editActions="move"
              builder={(item) => (
                <VStack
                  key={item.id}
                  spacing={10}
                  {...rowStyle()}
                  leadingSwipeActions={{
                    allowsFullSwipe: true,
                    actions: [
                      <Button
                        title={i18n.homeMarkWatched}
                        systemImage="checkmark.circle.fill"
                        tint="systemGreen"
                        action={() => onMarkWatched(item.show.id, selectedDay)}
                      />
                    ]
                  }}
                  trailingSwipeActions={{
                    // A full swipe deletes outright — no button tap, no confirmation.
                    allowsFullSwipe: true,
                    actions: [
                      <Button
                        title={i18n.delete}
                        systemImage="trash"
                        role="destructive"
                        action={() => onDelete(item.show.id)}
                      />
                    ]
                  }}
                >
                  {item.schedules.map((sc, i) => (
                    <EpisodeCard
                      key={`${item.id}-${i}`}
                      show={item.show}
                      schedule={sc}
                      onTap={() => onShowDetail(item.show)}
                    />
                  ))}
                </VStack>
              )}
            />
          </>
        )}
      </List>
    </VStack>
  )
}
