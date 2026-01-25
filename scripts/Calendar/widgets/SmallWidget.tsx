import {
  VStack,
  HStack,
  Text,
  Spacer,
  Grid,
  GridRow,
  ZStack,
  Circle,
  type WidgetRenderingMode,
  type Color
} from 'scripting'
import { isSameDay } from '../dateUtils'
import { lunar } from '../lunar'
import { colors } from '../degisn'

export default function SmallWidget({
  widgetRenderingMode,
  dots
}: {
  widgetRenderingMode: WidgetRenderingMode
  dots: Record<number, Color>
}) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const lunarDate = lunar(today)
  const lunarText = `${lunarDate.monthName}月${lunarDate.dayName}`

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const firstDayOfWeek = parseInt(Storage.get<string>('firstDayOfWeek') || '0')
  const startDayOfWeek = (firstDay.getDay() - firstDayOfWeek + 7) % 7

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

  // Chunk into weeks
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < gridDays.length; i += 7) {
    weeks.push(gridDays.slice(i, i + 7))
  }

  const weekDayNames =
    firstDayOfWeek === 1
      ? ['一', '二', '三', '四', '五', '六', '日']
      : ['日', '一', '二', '三', '四', '五', '六']

  return (
    <VStack
      padding={20}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
    >
      {/* Header */}
      <HStack alignment="center">
        <Text font={12} fontWeight="medium" foregroundStyle={colors.systemRed}>
          {month + 1}月
        </Text>
        <Spacer />
        <Text font={12} fontWeight="medium" foregroundStyle={colors.systemRed}>
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
              fontWeight="medium"
              foregroundStyle={i === 0 || i === 6 ? 'secondaryLabel' : 'label'}
              frame={{ maxWidth: 'infinity' }}
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
                <VStack
                  frame={{ width: 20, height: 20 }}
                  spacing={0}
                  alignment="center"
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
                >
                  <Text
                    font={11}
                    fontWeight="medium"
                    foregroundStyle={
                      isToday
                        ? 'white'
                        : j === 0 || j === 6
                          ? 'secondaryLabel'
                          : 'label'
                    }
                    widgetAccentable
                    multilineTextAlignment="center"
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
              )
            })}
          </GridRow>
        ))}
      </Grid>
    </VStack>
  )
}
