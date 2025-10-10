import { Button, Font } from 'scripting'
import { RoundedRectangle } from 'scripting'
import { Colors } from '../constansts/colors'

export default function Key(props: {
  title: string
  font?: number | Font | { name: string; size: number }
}) {
  const { title, font = 26 } = props
  const padding = 4
  const gapX = 6
  // 第一排最多，10 个按键
  const charWidth = (Device.screen.width - padding * 2 + gapX) / 10 - gapX

  const insertText = (char: string) => {
    HapticFeedback.selection()
    CustomKeyboard.insertText(char)
  }

  return (
    <Button
      frame={{ width: charWidth, height: 45 }}
      title={title}
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
      action={() => insertText(title)}
    />
  )
}
