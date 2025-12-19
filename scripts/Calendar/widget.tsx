import {
  Button,
  Circle,
  HStack,
  Image,
  Spacer,
  Text,
  VStack,
  ZStack,
  Widget,
  Capsule,
  Grid,
  GridRow,
  Color,
} from 'scripting'
import {
  getWeekNumber,
  formatYear,
  formatMonthDay,
  getWeekDayName,
  startOfWeek as getStartOfWeek,
  addDays,
  isSameDay,
} from './dateUtils'
import {
  ChangeWeekIntent,
  SelectDateIntent,
  ChangeMonthIntent,
} from './app_intents'
import { Lunar } from './lunar_lib'
import { fetchHolidays, getHolidayType } from './holidayUtils'

async function WeeklyWidget() {
  const val = Storage.get<string>('weekOffset') || '0'
  let offset = 0
  try {
    offset = JSON.parse(val)
  } catch (e) {
    console.error(e)
  }
  const sd = Storage.get<string>('selectedDate')
  const selectedDate = sd ? new Date(sd) : null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const displayDate = addDays(today, offset * 7)

  const weekNum = getWeekNumber(displayDate)

  // Lunar Date (Always today)
  const lunar = Lunar.fromDate(today)
  const solarTerm = lunar.getJieQi() ? ` ${lunar.getJieQi()}` : ''

  const descDate = selectedDate || today
  const lunarDesc = Lunar.fromDate(descDate)
  const dayDesc =
    `${formatMonthDay(descDate)}` +
    ` 第${getWeekNumber(descDate)}周` +
    ` ${lunarDesc.getYearInGanZhi()}(${lunarDesc.getYearShengXiao()})年` +
    ` ${lunarDesc.getMonthInChinese()}月${lunarDesc.getDayInChinese()}`

  // Week Days (Sunday start) - Based on offset
  const startOfWeekDate = getStartOfWeek(displayDate)

  const calendars = await Calendar.forEvents()
  const holidayCal = calendars.find(
    (c) => c.title === '中国大陆节假日' || c.title === 'Chinese Holidays',
  )
  let eventTitles: Record<number, string> = {}

  if (holidayCal) {
    const start = startOfWeekDate
    const end = addDays(startOfWeekDate, 7)
    const events = await CalendarEvent.getAll(start, end, [holidayCal])
    for (const event of events) {
      if (event.title.includes('休') || event.title.includes('班')) {
        continue
      }
      const d = event.startDate.getDate()
      eventTitles[d] = event.title
    }
  }

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(startOfWeekDate, i)
    const l = Lunar.fromDate(d)
    return {
      date: d,
      weekDayName: getWeekDayName(d),
      dayNum: d.getDate(),
      lunarDay: l.getDayInChinese(),
      isToday: isSameDay(d, today),
      holidayType: getHolidayType(d),
      eventTitle: eventTitles[d.getDate()],
    }
  })

  return (
    <VStack
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      padding={20}
    >
      {/* Header: Year/Month and Week Number */}
      <HStack>
        <Button
          intent={ChangeWeekIntent('prev')}
          buttonStyle='bordered'
          tint='systemGray2'
        >
          <Image
            systemName='chevron.left'
            font={12}
            foregroundStyle='secondaryLabel'
            widgetAccentable
          />
        </Button>
        <Button intent={ChangeWeekIntent('reset')} buttonStyle='plain'>
          <Text font={24} foregroundStyle='label' widgetAccentable>
            {formatYear(offset ? startOfWeekDate : today)}
            {offset ? startOfWeekDate.getMonth() + 1 : today.getMonth() + 1}月
          </Text>
        </Button>
        <Spacer />
        <VStack alignment='trailing' spacing={2}>
          {/* <Text font={12} foregroundStyle='secondaryLabel'>
            {lunarYear}
            {solarTerm}
          </Text> */}
          <Text font={14} foregroundStyle='secondaryLabel' widgetAccentable>
            第{weekNum}周
          </Text>
        </VStack>
        <Button
          intent={ChangeWeekIntent('next')}
          buttonStyle='bordered'
          tint='systemGray2'
        >
          <Image
            systemName='chevron.right'
            font={12}
            foregroundStyle='secondaryLabel'
            widgetAccentable
          />
        </Button>
      </HStack>

      <Spacer />

      {/* Calendar Week Row */}
      <HStack spacing={4}>
        {weekDays.map((item, index) => (
          <VStack key={index} spacing={4} frame={{ maxWidth: 400 }}>
            <Text
              font={11}
              foregroundStyle={item.isToday ? 'red' : 'secondaryLabel'}
              multilineTextAlignment='center'
            >
              {item.weekDayName}
            </Text>
            <ZStack frame={{ width: 40, height: 40 }} alignment='topTrailing'>
              <Button
                intent={SelectDateIntent(item.date.toISOString())}
                buttonStyle='plain'
              >
                <VStack
                  frame={{ width: 40, height: 40 }}
                  widgetBackground={
                    item.isToday
                      ? { style: 'red', shape: 'circle' }
                      : selectedDate && isSameDay(item.date, selectedDate)
                      ? { style: 'secondarySystemBackground', shape: 'circle' }
                      : undefined
                  }
                  background={
                    item.isToday ? (
                      <Circle fill='red' opacity={0.2} />
                    ) : selectedDate && isSameDay(item.date, selectedDate) ? (
                      <Circle fill='secondarySystemBackground' opacity={0.1} />
                    ) : undefined
                  }
                  alignment='center'
                  spacing={0}
                >
                  <Spacer />
                  <Text
                    font={16}
                    foregroundStyle={item.isToday ? 'white' : 'label'}
                    widgetAccentable
                    multilineTextAlignment='center'
                  >
                    {item.dayNum.toString()}
                  </Text>
                  <Text
                    font={9}
                    lineLimit={1}
                    foregroundStyle={
                      item.isToday
                        ? 'white'
                        : item.eventTitle
                          ? 'red'
                          : 'secondaryLabel'
                    }
                    widgetAccentable
                    multilineTextAlignment='center'
                  >
                    {item.eventTitle || item.lunarDay}
                  </Text>
                  <Spacer />
                </VStack>
              </Button>
              {item.holidayType && (
                <ZStack
                  frame={{ width: 14, height: 14 }}
                  widgetBackground={{
                    style: item.holidayType === 'work' ? 'red' : 'green',
                    shape: 'circle',
                  }}
                >
                  <Circle
                    fill={
                      item.holidayType === 'work'
                        ? 'rgba(255, 0, 0, 0.3)'
                        : 'rgba(0, 255, 0, 0.3)'
                    }
                    widgetAccentable
                  />
                  <Text font={10} foregroundStyle='white' widgetAccentable>
                    {item.holidayType === 'work' ? '班' : '休'}
                  </Text>
                </ZStack>
              )}
            </ZStack>
          </VStack>
        ))}
      </HStack>
      <HStack frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
        <Capsule
          frame={{ width: 4, height: 16 }}
          fill='rgba(255, 0, 0, 0.9)'
          widgetAccentable
        />
        <Text
          font={14}
          foregroundStyle='label'
          multilineTextAlignment='leading'
        >
          {dayDesc}
        </Text>
      </HStack>
    </VStack>
  )
}

async function MonthlyWidget() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const lunar = Lunar.fromDate(today)
  const lunarText = `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay() // 0 is Sunday

  const calendars = await Calendar.forEvents()
  const holidayCal = calendars.find(
    (c) => c.title === '中国大陆节假日' || c.title === 'Chinese Holidays',
  )
  const dots: Record<number, Color> = {}
  let eventTitles: Record<number, string> = {}

  if (holidayCal) {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 1)
    const events = await CalendarEvent.getAll(start, end, [holidayCal])
    for (const event of events) {
      const d = event.startDate.getDate()
      dots[d] = holidayCal.color
    }
  }

  // Generate grid cells
  const gridDays: (Date | null)[] = []

  // Start padding
  for (let i = 0; i < startDayOfWeek; i++) {
    gridDays.push(null)
  }
  // Dates
  for (let i = 1; i <= daysInMonth; i++) {
    gridDays.push(new Date(year, month, i))
  }
  // End padding
  while (gridDays.length % 7 !== 0) {
    gridDays.push(null)
  }

  // Chunk into weeks
  const weeks = []
  for (let i = 0; i < gridDays.length; i += 7) {
    weeks.push(gridDays.slice(i, i + 7))
  }

  const weekDayNames = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <VStack
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      padding={20}
    >
      {/* Header */}
      <HStack alignment='center'>
        <Text font={12} fontWeight='medium' foregroundStyle='red'>
          {month + 1}月
        </Text>
        <Spacer />
        <Text font={12} fontWeight='medium' foregroundStyle='red'>
          {lunarText}
        </Text>
      </HStack>
      <Spacer />
      {/* Calendar Grid */}
      <Grid verticalSpacing={2} horizontalSpacing={0}>
        <GridRow>
          {weekDayNames.map((name, i) => (
            <Text
              key={i}
              font={10}
              fontWeight='medium'
              foregroundStyle={i === 0 || i === 6 ? 'secondaryLabel' : 'label'}
              frame={{ maxWidth: 'infinity' }}
              multilineTextAlignment='center'
            >
              {name}
            </Text>
          ))}
        </GridRow>
        {weeks.map((week, i) => (
          <GridRow key={i}>
            {week.map((date, j) => {
              if (!date) {
                // Empty cell
                return (
                  <ZStack
                    key={j}
                    frame={{ maxWidth: 'infinity', height: 18 }}
                  />
                )
              }
              const isToday = isSameDay(date, today)
              const dotColor = dots[date.getDate()]
              return (
                <ZStack
                  key={j}
                  frame={{ maxWidth: 'infinity', height: 20 }}
                  alignment='center'
                >
                  {isToday && (
                    <Circle
                      frame={{ width: 20, height: 20 }}
                      widgetBackground={{ style: 'red', shape: 'circle' }}
                      fill='rgba(255,0,0,0.2)'
                    />
                  )}
                  <VStack spacing={0} alignment='center'>
                    <Text
                      font={11}
                      fontWeight='medium'
                      foregroundStyle={
                        isToday
                          ? 'white'
                          : j === 0 || j === 6
                            ? 'secondaryLabel'
                            : 'label'
                      }
                      widgetAccentable
                      multilineTextAlignment='center'
                    >
                      {date.getDate().toString()}
                    </Text>
                    {dotColor && (
                      <Circle
                        fill={dotColor}
                        frame={{ width: 3, height: 3 }}
                        widgetAccentable
                      />
                    )}
                  </VStack>
                </ZStack>
              )
            })}
          </GridRow>
        ))}
      </Grid>
    </VStack>
  )
}

async function LargeMonthlyWidget() {
  const val = Storage.get<string>('monthOffset') || '0'
  let offset = 0
  try {
    offset = JSON.parse(val)
  } catch (e) {
    console.error(e)
  }

  const today = new Date()

  const sd = Storage.get<string>('selectedDate')
  const selectedDate = sd ? new Date(sd) : null

  const descDate = selectedDate || today
  const lunarDesc = Lunar.fromDate(descDate)
  const dayDesc =
    `${formatMonthDay(descDate)}` +
    ` 第${getWeekNumber(descDate)}周` +
    ` ${lunarDesc.getYearInGanZhi()}(${lunarDesc.getYearShengXiao()})年` +
    ` ${lunarDesc.getMonthInChinese()}月${lunarDesc.getDayInChinese()}`

  const displayDate = new Date(
    today.getFullYear(),
    today.getMonth() + offset,
    1,
  )
  const year = displayDate.getFullYear()
  const month = displayDate.getMonth()

  await fetchHolidays(year)

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay() // 0 is Sunday

  const calendars = await Calendar.forEvents()
  const holidayCal = calendars.find(
    (c) => c.title === '中国大陆节假日' || c.title === 'Chinese Holidays',
  )
  let eventTitles: Record<number, string> = {}

  if (holidayCal) {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 1)
    const events = await CalendarEvent.getAll(start, end, [holidayCal])
    for (const event of events) {
      if (event.title.includes('休') || event.title.includes('班')) {
        continue
      }
      const d = event.startDate.getDate()
      eventTitles[d] = event.title
    }
  }

  // Generate grid cells
  const gridDays: (Date | null)[] = []

  // Start padding
  for (let i = 0; i < startDayOfWeek; i++) {
    gridDays.push(null)
  }
  // Dates
  for (let i = 1; i <= daysInMonth; i++) {
    gridDays.push(new Date(year, month, i))
  }
  // End padding
  while (gridDays.length % 7 !== 0) {
    gridDays.push(null)
  }

  // Chunk into weeks
  const weeks = []
  for (let i = 0; i < gridDays.length; i += 7) {
    weeks.push(gridDays.slice(i, i + 7))
  }

  const weekDayNames = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <VStack
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      padding={20}
      widgetBackground='systemBackground'
    >
      {/* Header */}
      <HStack alignment='center'>
        <Button
          intent={ChangeMonthIntent('prev')}
          buttonStyle='bordered'
          tint='systemGray2'
        >
          <Image
            systemName='chevron.left'
            font={12}
            foregroundStyle='secondaryLabel'
            widgetAccentable
          />
        </Button>
        <Button intent={ChangeMonthIntent('reset')} buttonStyle='plain'>
          <Text font={16} fontWeight='bold' foregroundStyle='label' widgetAccentable>
            {year}年{month + 1}月
          </Text>
        </Button>
        <Spacer />
        <Button
          intent={ChangeMonthIntent('next')}
          buttonStyle='bordered'
          tint='systemGray2'
        >
          <Image
            systemName='chevron.right'
            font={12}
            foregroundStyle='secondaryLabel'
            widgetAccentable
          />
        </Button>
      </HStack>

      <Spacer />

      {/* Calendar Grid */}
      <Grid verticalSpacing={4} horizontalSpacing={0}>
        <GridRow>
          {weekDayNames.map((name, i) => (
            <Text
              key={i}
              font={12}
              fontWeight='medium'
              foregroundStyle={i === 0 || i === 6 ? 'secondaryLabel' : 'label'}
              frame={{ maxWidth: 'infinity' }}
              multilineTextAlignment='center'
            >
              {name}
            </Text>
          ))}
        </GridRow>
        {weeks.map((week, i) => (
          <GridRow key={i}>
            {week.map((date, j) => {
              if (!date) {
                // Empty cell
                return (
                  <ZStack
                    key={j}
                    frame={{ maxWidth: 'infinity', height: 40 }}
                  />
                )
              }
              const isToday = isSameDay(date, today)
              const eventTitle = eventTitles[date.getDate()]
              const lunar = Lunar.fromDate(date)
              const lunarDay = lunar.getDayInChinese()
              const holidayType = getHolidayType(date)

              return (
                <ZStack
                  key={j}
                  frame={{ maxWidth: 'infinity', height: 40 }}
                  alignment='topTrailing'
                >
                  <ZStack
                    frame={{ maxWidth: 'infinity', height: 40 }}
                    alignment='center'
                  >
                    <Button
                      intent={SelectDateIntent(date.toISOString())}
                      buttonStyle='plain'
                    >
                      <VStack
                        frame={{ width: 40, height: 40 }}
                        widgetBackground={
                          isToday
                            ? { style: 'red', shape: 'circle' }
                            : undefined
                        }
                        background={
                          isToday ? (
                            <Circle
                              fill='rgba(255, 0, 0, 0.3)'
                              widgetAccentable
                            />
                          ) : selectedDate && isSameDay(date, selectedDate) ? (
                            <Circle
                              fill='secondarySystemBackground'
                              opacity={0.5}
                            />
                          ) : undefined
                        }
                        alignment='center'
                        spacing={0}
                      >
                        <Spacer />
                        <Text
                          font={14}
                          fontWeight='medium'
                          foregroundStyle={
                            isToday
                              ? 'white'
                              : j === 0 || j === 6
                                ? 'secondaryLabel'
                                : 'label'
                          }
                          widgetAccentable
                          multilineTextAlignment='center'
                        >
                          {date.getDate().toString()}
                        </Text>
                        <Text
                          font={9}
                          foregroundStyle={
                            isToday
                              ? 'white'
                              : eventTitle
                                ? 'red'
                                : 'secondaryLabel'
                          }
                          widgetAccentable={isToday}
                          lineLimit={1}
                          multilineTextAlignment='center'
                        >
                          {eventTitle || lunarDay}
                        </Text>
                        <Spacer />
                      </VStack>
                    </Button>
                  </ZStack>
                  {holidayType && (
                    <ZStack
                      frame={{ width: 14, height: 14 }}
                      widgetBackground={{
                        style: holidayType === 'work' ? 'red' : 'green',
                        shape: 'circle',
                      }}
                    >
                      <Circle
                        fill={
                          holidayType === 'work'
                            ? 'rgba(255, 0, 0, 0.3)'
                            : 'rgba(0, 255, 0, 0.3)'
                        }
                        widgetAccentable
                      />
                      <Text font={10} foregroundStyle='white' widgetAccentable>
                        {holidayType === 'work' ? '班' : '休'}
                      </Text>
                    </ZStack>
                  )}
                </ZStack>
              )
            })}
          </GridRow>
        ))}
      </Grid>
      <Spacer />
      <HStack frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
        <Capsule
          frame={{ width: 4, height: 16 }}
          fill='rgba(255, 0, 0, 0.9)'
          widgetAccentable
        />
        <Text
          font={14}
          foregroundStyle='label'
          multilineTextAlignment='leading'
        >
          {dayDesc}
        </Text>
      </HStack>
    </VStack>
  )
}

async function WidgetView() {
  if (Widget.family === 'systemSmall') {
    return await MonthlyWidget()
  }
  if (Widget.family === 'systemLarge') {
    return await LargeMonthlyWidget()
  }
  return await WeeklyWidget()
}

// Main execution
;(async () => {
  const val = Storage.get<string>('weekOffset') || '0'
  let offset = 0
  try {
    offset = JSON.parse(val)
  } catch (e) {
    console.error(e)
  }
  const today = new Date()
  const displayDate = addDays(today, offset * 7)

  await fetchHolidays(displayDate.getFullYear())

  Widget.present(await WidgetView())
})()
