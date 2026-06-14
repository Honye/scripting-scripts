import { Button, HStack, ScrollView, Spacer } from 'scripting'
import { POPUP_RISE } from '../constansts/layout'

/**
 * 顶部候选词栏：横向滚动列出当前按键的所有字体样式变体。
 * 高度固定为 POPUP_RISE，与第一排气泡的鼓起量一致，气泡可覆盖其上。
 * 无候选（≤1 个）时渲染等高占位，保证顶部区域始终存在、供气泡覆盖。
 */
export default function CandidateBar(props: {
  candidates: string[]
  onSelect: (glyph: string) => void
}) {
  const { candidates, onSelect } = props

  if (candidates.length <= 1) {
    return (
      <HStack frame={{ maxWidth: 'infinity', height: POPUP_RISE }}>
        <Spacer minLength={0} />
      </HStack>
    )
  }

  return (
    <ScrollView
      axes='horizontal'
      scrollIndicator='hidden'
      frame={{ height: POPUP_RISE }}
    >
      <HStack spacing={6}>
        {candidates.map((g, i) => (
          <Button
            key={`${g}-${i}`}
            buttonStyle='plain'
            title={g}
            font={24}
            padding={{ horizontal: 10 }}
            frame={{ height: POPUP_RISE - 8 }}
            clipShape={{ type: 'rect', cornerRadius: 8 }}
            action={() => onSelect(g)}
          />
        ))}
      </HStack>
    </ScrollView>
  )
}
