import {
  Button,
  HStack,
  Image,
  Link,
  Spacer,
  Text,
  VStack,
  Widget,
} from 'scripting'
import { IntentRefresh } from './app_intents'
import { TelegraphItem, fetchTelegraph, filterItems, formatTime } from './apis/cls'
import { getSettings } from './store/settings'

const LOGO_URL =
  'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/d8/03/5d/d8035d9a-bd09-dc3a-6aa4-fe29a805568e/AppIcon-0-0-1x_U007epad-0-0-0-sRGB-85-220.png/434x0w.webp'
/** 加红电报颜色 */
const IMPORTANT_COLOR = '#e62429'

/** 估算文本渲染宽度:全角字符按字号计,半角字符按 0.56 倍字号计 */
function estimateTextWidth(text: string, fontSize: number) {
  let width = 0
  for (const ch of text) {
    width += (ch.codePointAt(0) ?? 0) > 0x2e7f ? fontSize : fontSize * 0.56
  }
  return width
}

function WidgetView({ items }: { items: TelegraphItem[] }) {
  const settings = getSettings()
  const { fontSize, lineLimit, gap } = settings
  const isSmall = Widget.family === 'systemSmall'
  const paddingX = 12
  const paddingY = 10
  const headerHeight = fontSize * 1.2 + 2
  const lineHeight = Math.ceil(fontSize * 1.3)
  const timeWidth = estimateTextWidth('00:00', fontSize)
  // 标题可用宽度 = 小组件宽度 - 左右边距 - 时间列宽 - 列间距
  const textWidth = Widget.displaySize.width - paddingX * 2 - timeWidth - 4
  const now = new Date()

  // 按剩余高度逐条计算实际渲染行数,行高随内容自适应
  let leftHeight = Widget.displaySize.height - paddingY * 2 - headerHeight - gap
  const rows: { item: TelegraphItem; lines: number }[] = []
  for (const item of items) {
    const maxLines = Math.min(lineLimit, Math.floor(leftHeight / lineHeight))
    if (maxLines < 1) break
    const text = item.title || item.content
    const lines = Math.min(
      Math.max(1, Math.ceil(estimateTextWidth(text, fontSize) / textWidth)),
      maxLines
    )
    rows.push({ item, lines })
    leftHeight -= lines * lineHeight + gap
  }

  return (
    <VStack
      padding={{ horizontal: paddingX, vertical: paddingY }}
      frame={Widget.displaySize}
      spacing={gap}
      widgetBackground={settings.background}
    >
      <HStack alignment='center' frame={{ height: headerHeight }}>
        <Link buttonStyle='plain' url='https://m.cls.cn'>
          <HStack alignment='center' spacing={4}>
            <Image
              imageUrl={LOGO_URL}
              frame={{ width: headerHeight, height: headerHeight }}
              clipShape={{ type: 'rect', cornerRadius: 4 }}
              resizable
            />
            {!isSmall ? (
              <Text
                font={fontSize * 1.2}
                fontWeight='medium'
                foregroundStyle={settings.textColor}
              >
                财联社电报
              </Text>
            ) : null}
          </HStack>
        </Link>
        <Spacer />
        <Button buttonStyle='plain' intent={IntentRefresh(undefined)}>
          <HStack spacing={2}>
            <Image
              systemName='clock.arrow.circlepath'
              font={10}
              foregroundStyle={settings.timeColor}
            />
            <Text font={10} foregroundStyle={settings.timeColor}>
              {formatTime(now.getTime() / 1000)}
            </Text>
          </HStack>
        </Button>
      </HStack>
      {rows.map(({ item, lines }) => (
        <Link key={item.id} buttonStyle='plain' url={item.url}>
          <HStack alignment='top' spacing={4}>
            <Text font={fontSize} foregroundStyle={settings.timeColor}>
              {formatTime(item.time)}
            </Text>
            <Text
              font={fontSize}
              lineLimit={lines}
              foregroundStyle={
                item.isImportant ? IMPORTANT_COLOR : settings.textColor
              }
            >
              {item.title || item.content}
            </Text>
            <Spacer />
          </HStack>
        </Link>
      ))}
      <Spacer minLength={0} />
    </VStack>
  )
}

function ErrorView({ message }: { message: string }) {
  const settings = getSettings()
  return (
    <VStack
      padding={12}
      frame={Widget.displaySize}
      spacing={8}
      widgetBackground={settings.background}
    >
      <Text font={14} foregroundStyle={settings.textColor}>
        加载失败
      </Text>
      <Text font={10} foregroundStyle={settings.timeColor} lineLimit={4}>
        {message}
      </Text>
    </VStack>
  )
}

;(async () => {
  const reloadPolicy = {
    policy: 'after',
    date: new Date(Date.now() + 10 * 60 * 1000)
  } as const
  try {
    const items = await fetchTelegraph(30)
    const filtered = filterItems(items, getSettings().exclude)
    Widget.present(<WidgetView items={filtered} />, { reloadPolicy })
  } catch (e) {
    Widget.present(<ErrorView message={String(e)} />, { reloadPolicy })
  }
})()
