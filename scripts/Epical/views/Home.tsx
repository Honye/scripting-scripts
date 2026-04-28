import {
  Button,
  HStack,
  Image,
  ScrollView,
  Text,
  VStack,
  useState
} from 'scripting'
import type { Color, DynamicShapeStyle } from 'scripting'
import type { Show } from '../types'
import { DAYS_CN, DAYS_FULL, getTodayIndex } from '../data'
import { theme } from '../theme'
import { EpisodeCard } from '../components'

const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6]

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
                {DAYS_CN[d]}
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
        {DAYS_FULL[day]}没有更新{'\n'}去添加你喜欢的剧吧
      </Text>
    </VStack>
  )
}

export function HomeView({
  shows,
  onAddPress,
  onShowDetail
}: {
  shows: Show[]
  onAddPress: () => void
  onShowDetail: (show: Show) => void
}) {
  const today = getTodayIndex()
  const [selectedDay, setSelectedDay] = useState(today)

  const countPerDay = WEEK_DAYS.map(
    (d) => shows.filter((s) => s.schedules.some((sc) => sc.day === d)).length
  )

  const todaysShows = shows.filter((s) =>
    s.schedules.some((sc) => sc.day === selectedDay)
  )

  const dateLabel = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric'
  })

  return (
    <VStack
      spacing={0}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity', alignment: 'top' }}
      background={theme.bg}
      navigationTitle="追剧日历"
      navigationSubtitle={`${dateLabel} · ${DAYS_FULL[today]}`}
      toolbar={{
        topBarTrailing: (
          <Button action={onAddPress}>
            <Image systemName="plus" />
          </Button>
        )
      }}
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
      <ScrollView>
        <VStack
          spacing={10}
          padding={{ horizontal: 20, top: 8, bottom: 20 }}
          frame={{ maxWidth: 'infinity', alignment: 'top' }}
        >
          {todaysShows.length === 0 ? (
            <EmptyState day={selectedDay} />
          ) : (
            <>
              <Text
                font={12}
                fontWeight="medium"
                foregroundStyle={theme.textQuaternary}
                frame={{ maxWidth: 'infinity', alignment: 'leading' }}
              >
                {DAYS_FULL[selectedDay]} · {todaysShows.length} 部更新
              </Text>
              {todaysShows.flatMap((show) =>
                show.schedules
                  .filter((sc) => sc.day === selectedDay)
                  .map((sc, i) => (
                    <EpisodeCard
                      key={`${show.id}-${i}`}
                      show={show}
                      schedule={sc}
                      onTap={() => onShowDetail(show)}
                    />
                  ))
              )}
            </>
          )}
        </VStack>
      </ScrollView>
    </VStack>
  )
}
