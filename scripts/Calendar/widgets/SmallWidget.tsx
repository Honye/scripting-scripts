import {
  VStack,
  HStack,
  Text,
  Spacer,
  Grid,
  GridRow,
  ZStack,
  Circle,
  Widget,
  type WidgetRenderingMode,
  type Color
} from 'scripting'
import { isSameDay } from '../dateUtils'
import { lunar } from '../lunar'
import { colors } from '../degisn'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

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

  // Every metric is derived from the real widget size: a small widget is 141pt
  // wide on a 4" screen and 170pt on a 6.9" one, so fixed paddings and cell
  // sizes overflow the smaller ones.
  const displaySize = Widget.displaySize
  const width = displaySize.width || 155
  const height = displaySize.height || width
  const padding = clamp(Math.round(width * 0.075), 8, 16)
  const rowSpacing = 2

  const cellWidth = (width - padding * 2) / 7
  const headerFont = clamp(Math.round(width * 0.075), 9, 13)
  const weekDayFont = clamp(Math.round(cellWidth * 0.55), 7, 11)

  // Vertical space left for the day rows once the header and weekday row are
  // laid out; rows never grow wider than they are tall to keep days circular.
  const gridHeight =
    height -
    padding * 2 -
    Math.round(headerFont * 1.4) -
    Math.round(weekDayFont * 1.4) -
    rowSpacing * (weeks.length + 1)
  const rowHeight = clamp(gridHeight / weeks.length, 12, cellWidth + 2)
  const daySize = Math.min(cellWidth, rowHeight)
  const dayFont = clamp(Math.round(daySize * 0.6), 8, 13)
  const dotSize = clamp(Math.round(daySize * 0.16), 2, 4)

  return (
    <VStack padding={padding} frame={displaySize} spacing={0}>
      {/* Header */}
      <HStack alignment="center">
        <Text
          font={headerFont}
          fontWeight="medium"
          foregroundStyle={colors.systemRed}
          lineLimit={1}
        >
          {month + 1}月
        </Text>
        <Spacer minLength={2} />
        <Text
          font={headerFont}
          fontWeight="medium"
          foregroundStyle={colors.systemRed}
          lineLimit={1}
          minScaleFactor={0.8}
        >
          {lunarText}
        </Text>
      </HStack>
      <Spacer />
      {/* Calendar Grid */}
      <Grid verticalSpacing={rowSpacing} horizontalSpacing={0}>
        <GridRow>
          {weekDayNames.map((name, i) => (
            <Text
              key={i}
              font={weekDayFont}
              fontWeight="medium"
              foregroundStyle={
                (firstDayOfWeek === 1
                  ? i === 5 || i === 6
                  : i === 0 || i === 6)
                  ? 'secondaryLabel'
                  : 'label'
              }
              frame={{ maxWidth: 'infinity' }}
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
                // Empty cell
                return (
                  <ZStack
                    key={j}
                    frame={{ maxWidth: 'infinity', height: rowHeight }}
                  />
                )
              }
              const isToday = isSameDay(date, today)
              const dotColor = dots[date.getDate()]
              return (
                <ZStack
                  key={j}
                  frame={{ maxWidth: 'infinity', height: rowHeight }}
                >
                  <VStack
                    frame={{ width: daySize, height: daySize }}
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
                      font={dayFont}
                      fontWeight="medium"
                      foregroundStyle={
                        isToday
                          ? 'white'
                          : date.getDay() === 0 || date.getDay() === 6
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
                    {dotColor && (
                      <Circle
                        fill={dotColor}
                        frame={{ width: dotSize, height: dotSize }}
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
