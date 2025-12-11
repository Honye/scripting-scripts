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
  useMemo,
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
import { ChangeWeekIntent, SelectDateIntent } from './app_intents'
import { Lunar } from './lunar_lib'
import { fetchHolidays, getHolidayType } from './holidayUtils'

function WidgetView() {
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
  const displayDate = addDays(today, offset * 7)

  const weekNum = getWeekNumber(displayDate)

  // Lunar Date (Always today)
  const lunar = Lunar.fromDate(today)
  const solarTerm = lunar.getJieQi() ? ` ${lunar.getJieQi()}` : ''

  const dayDesc = useMemo(() => {
    const date = selectedDate || today
    const lunar = Lunar.fromDate(date)
    return (
      `${formatMonthDay(date)}` +
      ` 第${getWeekNumber(date)}周` +
      ` ${lunar.getYearInGanZhi()}(${lunar.getYearShengXiao()})年` +
      ` ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
    )
  }, [today, displayDate, selectedDate])

  // Week Days (Sunday start) - Based on offset
  const startOfWeekDate = getStartOfWeek(displayDate)

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
    }
  })

  return (
    <VStack
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      padding={20}
      background='systemBackground'
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
          />
        </Button>
        <Button intent={ChangeWeekIntent('reset')} buttonStyle='plain'>
          <Text font={24} foregroundStyle='label'>
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
          <Text font={14} foregroundStyle='secondaryLabel'>
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
                  background={
                    item.isToday ? (
                      <Circle fill='red' />
                    ) : selectedDate && isSameDay(item.date, selectedDate) ? (
                      <Circle fill='secondarySystemBackground' />
                    ) : undefined
                  }
                  alignment='center'
                  spacing={0}
                >
                  <Spacer />
                  <Text
                    font={16}
                    foregroundStyle={item.isToday ? 'white' : 'label'}
                    multilineTextAlignment='center'
                  >
                    {item.dayNum.toString()}
                  </Text>
                  <Text
                    font={10}
                    foregroundStyle={item.isToday ? 'white' : 'secondaryLabel'}
                    multilineTextAlignment='center'
                  >
                    {item.lunarDay}
                  </Text>
                  <Spacer />
                </VStack>
              </Button>
              {item.holidayType && (
                <ZStack frame={{ width: 14, height: 14 }}>
                  <Circle
                    fill={item.holidayType === 'work' ? 'red' : 'green'}
                  />
                  <Text font={10} foregroundStyle='white'>
                    {item.holidayType === 'work' ? '班' : '休'}
                  </Text>
                </ZStack>
              )}
            </ZStack>
          </VStack>
        ))}
      </HStack>
      <HStack frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
        <Capsule frame={{ width: 4, height: 16 }} fill='red' />
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

  Widget.present(<WidgetView />)
})()
