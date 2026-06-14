import { Button, Font, Text, useState } from 'scripting'
import { RoundedRectangle } from 'scripting'
import { Colors } from '../constansts/colors'
import { ITEM_HEIGHT, POPUP_RISE } from '../constansts/layout'
import KeyPopup from './KeyPopup'

export default function Key(props: {
  title: string
  /** 基础字符（用于生成候选词）；缺省时退回 title */
  char?: string
  /** 按下时回调，上报基础字符与实际插入的字形 */
  onPress?: (base: string, inserted: string) => void
  font?: number | Font | { name: string; size: number }
}) {
  const { title, char, onPress, font = 26 } = props
  const padding = 4
  const gapX = 6
  // 第一排最多，10 个按键
  const charWidth = (Device.screen.width - padding * 2 + gapX) / 10 - gapX

  const [pressed, setPressed] = useState(false)

  const insertText = (char: string) => {
    HapticFeedback.selection()
    CustomKeyboard.insertText(char)
  }

  return (
    <Button
      background={
        <RoundedRectangle
          fill={Colors.Background1}
          cornerRadius={6}
          shadow={{
            x: 0.5,
            y: 1,
            color: 'rgba(0,0,0,0.3)',
            radius: 0.5,
          }}
        />
      }
      font={font}
      foregroundStyle={Colors.Foreground1}
      action={() => {}}
      onLongPressGesture={{
        perform: () => {},
        onPressingChanged: (state) => {
          if (state) {
            // 按下即插入并弹出气泡（字母键单次插入，不连发）
            insertText(title)
            onPress?.(char ?? title, title)
            setPressed(true)
          } else {
            setPressed(false)
          }
        },
      }}
      overlay={
        pressed
          ? {
              alignment: 'bottom',
              content: (
                <KeyPopup
                  title={title}
                  keyWidth={charWidth}
                  width={charWidth + 24}
                  height={ITEM_HEIGHT + POPUP_RISE}
                  font={font}
                />
              ),
            }
          : undefined
      }
    >
      <Text
        frame={{ width: charWidth, height: ITEM_HEIGHT }}
      >{title}</Text>
    </Button>
  )
}
