import {
  VStack,
  HStack,
  Text,
  Spacer,
  Grid,
  GridRow,
  ZStack,
  Capsule,
  Widget,
  type WidgetRenderingMode,
  type Color
} from 'scripting'
import {
  isSameDay,
  buildMonthWeeks,
  getWeekDayNarrowNames,
  formatMonthTitle
} from '../dateUtils'
import { lunar } from '../lunar'
import { adaptEventColor, colors } from '../degisn'

export interface EventItem {
  title: string
  color: Color
  date: Date
  isAllDay: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

const dateFormat = new Intl.DateTimeFormat([], {
  month: '2-digit',
  day: '2-digit'
}).format
const timeFormat = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).format
// `auto` spells the near days out: 今天 / 明天 / 后天 / 3天后.
const relativeFormat = new Intl.RelativeTimeFormat([], { numeric: 'auto' })

/** `08/19 4天后` — date, time when it isn't all-day, and how far off it is. */
function formatEventDate(date: Date, isAllDay: boolean, today: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const diff = Math.round((startOfDay.getTime() - today.getTime()) / 86400000)
  const relative = relativeFormat.format(diff, 'day')

  const parts: string[] = []
  // Today's relative label replaces the date instead of trailing it.
  parts.push(diff === 0 ? relative : dateFormat(date))
  if (!isAllDay) {
    parts.push(timeFormat(date))
  }
  if (diff > 0) {
    parts.push(relative)
  }
  return parts.join(' ')
}

export default function MediumWidget({
  widgetRenderingMode,
  events
}: {
  widgetRenderingMode: WidgetRenderingMode
  events: EventItem[]
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const month = today.getMonth()

  const lunarDate = lunar(today)
  const lunarText = `${lunarDate.yearName}${lunarDate.yearZodiac}年${lunarDate.monthName}月${lunarDate.dayName}`

  const firstDayOfWeek = parseInt(Storage.get<string>('firstDayOfWeek') || '0')
  const weeks = buildMonthWeeks(year, month, firstDayOfWeek)
  const weekDayNames = getWeekDayNarrowNames(firstDayOfWeek)

  // Every metric is derived from the real widget size: a medium widget is 292pt
  // wide on a 4" screen and 364pt on a 6.9" one, and a month spans 5 or 6 rows,
  // so fixed paddings and cell sizes overflow the tight combinations.
  const displaySize = Widget.displaySize
  const width = displaySize.width || 338
  const height = displaySize.height || 158
  const hPadding = clamp(Math.round(width * 0.042), 10, 16)
  const vPadding = clamp(Math.round(height * 0.076), 8, 14)
  const rowSpacing = 2

  const contentWidth = width - hPadding * 2
  const headerFont = clamp(Math.round(width * 0.037), 10, 13)

  // The weekday row shares the grid's row budget with the weeks below it.
  const rows = weeks.length + 1
  const gridHeight =
    height - vPadding * 2 - Math.round(headerFont * 1.3) - rowSpacing
  const rowHeight = clamp(gridHeight / rows - rowSpacing, 11, 22)
  // Cap the columns so the calendar never crowds out the event list.
  const columnWidth = Math.min((contentWidth * 0.46) / 7, rowHeight + 3)
  const gridWidth = columnWidth * 7
  const daySize = Math.min(columnWidth, rowHeight)
  // Two digits have to sit inside the circle with room to spare, so the font
  // stays well under the circle's diameter.
  const dayFont = clamp(Math.round(daySize * 0.58), 8, 13)
  const weekDayFont = clamp(Math.round(columnWidth * 0.55), 7, 11)

  const eventTitleFont = clamp(Math.round(width * 0.04), 11, 14)
  const eventDateFont = Math.round((eventTitleFont * 12) / 13)
  const eventRowHeight = Math.round(eventTitleFont * 2.2)

  return (
    <VStack
      padding={{ horizontal: hPadding, vertical: vPadding }}
      frame={displaySize}
      spacing={rowSpacing}
      widgetURL="calshow://"
    >
      {/* Header: month name and lunar date */}
      <HStack alignment="center">
        <Text
          font={headerFont}
          fontWeight="semibold"
          foregroundStyle={colors.systemRed}
          lineLimit={1}
          widgetAccentable
        >
          {formatMonthTitle(today)}
        </Text>
        <Spacer minLength={4} />
        <Text
          font={headerFont}
          fontWeight="semibold"
          foregroundStyle={colors.systemRed}
          lineLimit={1}
          minScaleFactor={0.8}
          widgetAccentable
        >
          {lunarText}
        </Text>
      </HStack>

      <HStack alignment="top" spacing={hPadding}>
        {/* Month grid */}
        <Grid
          verticalSpacing={rowSpacing}
          horizontalSpacing={0}
          frame={{ width: gridWidth }}
        >
          <GridRow>
            {weekDayNames.map((name, i) => (
              <Text
                key={i}
                font={weekDayFont}
                fontWeight="medium"
                foregroundStyle="secondaryLabel"
                frame={{ width: columnWidth, height: rowHeight }}
                lineLimit={1}
                multilineTextAlignment="center"
              >
                {name}
              </Text>
            ))}
          </GridRow>
          {weeks.map((week, i) => (
            <GridRow key={i}>
              {week.map((date, j) => {
                if (!date) {
                  return (
                    <ZStack
                      key={j}
                      frame={{ width: columnWidth, height: rowHeight }}
                    />
                  )
                }
                const isToday = isSameDay(date, today)
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                return (
                  <ZStack
                    key={j}
                    frame={{ width: columnWidth, height: rowHeight }}
                  >
                    <Text
                      font={dayFont}
                      fontWeight="medium"
                      frame={{ width: daySize, height: daySize }}
                      background={
                        isToday
                          ? {
                              style:
                                widgetRenderingMode === 'accented'
                                  ? 'rgba(255,0,0,0.3)'
                                  : colors.systemRed,
                              shape: 'circle'
                            }
                          : undefined
                      }
                      foregroundStyle={
                        isToday
                          ? 'white'
                          : isWeekend
                            ? 'secondaryLabel'
                            : 'label'
                      }
                      widgetAccentable
                      lineLimit={1}
                      minScaleFactor={0.7}
                      multilineTextAlignment="center"
                    >
                      {date.getDate().toString()}
                    </Text>
                  </ZStack>
                )
              })}
            </GridRow>
          ))}
        </Grid>

        {/* Upcoming events */}
        <VStack
          alignment="leading"
          spacing={rowSpacing * 2}
          frame={{
            maxWidth: 'infinity',
            maxHeight: 'infinity',
            alignment: 'topLeading'
          }}
        >
          {events.map((event, i) => (
            <HStack key={i} alignment="center" spacing={6}>
              <Capsule
                fill={event.color}
                frame={{ width: 2.5, height: eventRowHeight }}
                widgetAccentable
              />
              <VStack alignment="leading" spacing={1}>
                <Text
                  font={eventTitleFont}
                  fontWeight="bold"
                  foregroundStyle={adaptEventColor(event.color)}
                  lineLimit={1}
                  widgetAccentable
                >
                  {event.title}
                </Text>
                <Text
                  font={eventDateFont}
                  foregroundStyle="secondaryLabel"
                  lineLimit={1}
                >
                  {formatEventDate(event.date, event.isAllDay, today)}
                </Text>
              </VStack>
              <Spacer minLength={0} />
            </HStack>
          ))}
          <Spacer minLength={0} />
        </VStack>
      </HStack>
    </VStack>
  )
}
