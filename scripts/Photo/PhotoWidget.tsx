import { Color, HStack, Image, Link, Path, Script, Spacer, Text, VStack, Widget } from "scripting"
import { rpt } from "./utils"
import type { DynamicShapeStyle } from 'scripting'


function getLunarDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    calendar: "chinese",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
  const parts = formatter.formatToParts(date)
  
  const yearName = parts.find(p => (p.type as string) === "yearName")?.value || "" // e.g. "乙巳" or "甲辰"
  const monthStr = parts.find(p => p.type === "month")?.value || "" // e.g. "十一月"
  const dayVal = parts.find(p => p.type === "day")?.value || "1" // e.g. "3"
  
  // Zodiac Mapping
  // Stems: 甲乙丙丁戊己庚辛壬癸
  // Branches: 子丑寅卯辰巳午未申酉戌亥
  // Zodiac: 鼠牛虎兔龙蛇马羊猴鸡狗猪
  // The second char of yearName is the branch.
  const branches = "子丑寅卯辰巳午未申酉戌亥"
  const zodiacs = "鼠牛虎兔龙蛇马羊猴鸡狗猪"
  let zodiac = ""
  if (yearName.length > 1) {
    const branch = yearName[1]
    const idx = branches.indexOf(branch)
    if (idx !== -1) {
      zodiac = zodiacs[idx]
    }
  }
  
  // Month Mapping
  // Intl returns "十一月" (Chinese characters).
  // Map specific months to traditional names.
  const monthMap: Record<string, string> = {
    "一月": "正月",
    "十一月": "冬月",
    "十二月": "腊月"
  }
  const lunarMonth = monthMap[monthStr] || monthStr
  
  // Day Mapping
  const dayNum = parseInt(dayVal)
  const dayChars = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]
  let lunarDay = ""
  if (dayNum <= 10) {
    lunarDay = "初" + dayChars[dayNum]
  } else if (dayNum < 20) {
    lunarDay = "十" + dayChars[dayNum - 10]
  } else if (dayNum === 20) {
    lunarDay = "二十"
  } else if (dayNum < 30) {
    lunarDay = "廿" + dayChars[dayNum - 20]
  } else if (dayNum === 30) {
    lunarDay = "三十"
  }
  
  return `${zodiac}年${lunarMonth}${lunarDay}`
}

const COLORS = {
  light: {
    background: '#ffffff',
    primaryText: '#000000',
    secondaryText: '#80828d'
  },
  dark: {
    background: '#1c1c1e',
    primaryText: '#ffffff',
    secondaryText: '#b3b3bd'
  }
}

export function PhotoWidget() {
  const imageDir = Path.join(FileManager.appGroupDocumentsDirectory, Script.name)
  const date = new Date()
  const cnMonths = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"]
  const cnWeekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  const month = cnMonths[date.getMonth()]
  const weekday = cnWeekdays[date.getDay()]
  const lunarDate = getLunarDate(date)
  const customText = (Storage.get("customText") as string) || "MOMO\nMIANMIAN"
  const cornerRadius = (Storage.get("cornerRadius") as number) ?? 12
  const themeMode = (Storage.get("themeMode") as string) || "auto"

  const colors = (() => {
    if (themeMode === 'light') return {
      background: COLORS.light.background as Color,
      primaryText: COLORS.light.primaryText as Color,
      secondaryText: COLORS.light.secondaryText as Color
    }
    if (themeMode === 'dark') return {
      background: COLORS.dark.background as Color,
      primaryText: COLORS.dark.primaryText as Color,
      secondaryText: COLORS.dark.secondaryText as Color
    }
    return {
      background: { light: COLORS.light.background, dark: COLORS.dark.background } as DynamicShapeStyle,
      primaryText: { light: COLORS.light.primaryText, dark: COLORS.dark.primaryText } as DynamicShapeStyle,
      secondaryText: { light: COLORS.light.secondaryText, dark: COLORS.dark.secondaryText } as DynamicShapeStyle
    }
  })()

  
  const getProps = (index: number) => {
    const path = Path.join(imageDir, `${index}.jpg`)
    try {
      if (FileManager.existsSync(path)) {
        return { filePath: path }
      }
    } catch (e) {
      // Ignore error
    }
    return {
      imageUrl: `https://picsum.photos/200/300?t=${Date.now() + index}`
    }
  }

  return (
    <VStack
      padding={rpt(16)}
      spacing={rpt(12)}
      frame={Widget.displaySize}
      widgetBackground={colors.background}
    >
      <HStack spacing={0}>
        <Text
          font={{ name: "DFPKanTingLiuW9-GB", size: rpt(28) }}
          foregroundStyle={colors.primaryText}
        >{customText}</Text>
        <Spacer />
        <Link url={Device.isiOSAppOnMac ? 'ical://' : 'calshow://'}>
          <HStack spacing={rpt(6)}>
            <Text
              font={{ name: "DIN Alternate", size: rpt(38) }}
              foregroundStyle={colors.primaryText}
            >{date.getDate().toString().padStart(2, "0")}</Text>
            <VStack spacing={rpt(4)}>
              <Text font={rpt(10)} foregroundStyle={colors.secondaryText}>{`${month}月｜${weekday}`}</Text>
              <Text font={rpt(10)} foregroundStyle={colors.secondaryText}>{lunarDate}</Text>
            </VStack>
          </HStack>
        </Link>
      </HStack>
      <HStack spacing={0}>
        <Image
          widgetAccentedRenderingMode="fullColor"
          {...getProps(0)}
          resizable
          scaleToFill
          frame={{ width: rpt(80), height: rpt(152) }}
          clipShape={{
            type: "rect",
            cornerRadius
          }}
        />
        <Spacer minLength={rpt(4)} />
        <Image
          {...getProps(1)}
          widgetAccentedRenderingMode="fullColor"
          resizable
          scaleToFill
          frame={{ width: rpt(80), height: rpt(152) }}
          clipShape={{
            type: "rect",
            cornerRadius
          }}
        />
        <Spacer minLength={rpt(8)} />
        <VStack spacing={rpt(4)}>
          <Image
            resizable
            scaleToFill
            frame={{ width: rpt(125), height: rpt(121) }}
            {...getProps(2)}
            widgetAccentedRenderingMode="fullColor"
            clipShape={{
              type: "rect",
              cornerRadius
            }}
          />
          <Image
            resizable
            scaleToFill
            frame={{ width: rpt(125), height: rpt(100) }}
            {...getProps(3)}
            widgetAccentedRenderingMode="fullColor"
            clipShape={{
              type: "rect",
              cornerRadius
            }}
          />
        </VStack>
      </HStack>
    </VStack>
  )
}
