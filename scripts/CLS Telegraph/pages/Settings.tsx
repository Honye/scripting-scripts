import {
  ColorPicker,
  HStack,
  List,
  Section,
  Stepper,
  Text,
  TextField,
  useCallback,
  useColorScheme,
  useMemo
} from 'scripting'
import type { Color } from 'scripting'
import { useSettings } from '../store/settings'

export default function Settings() {
  const [settings, setSettings] = useSettings()
  const colorScheme = useColorScheme()
  const background = useMemo(
    () => settings.background[colorScheme],
    [settings.background, colorScheme]
  )
  const textColor = useMemo(
    () => settings.textColor[colorScheme],
    [settings.textColor, colorScheme]
  )
  const timeColor = useMemo(
    () => settings.timeColor[colorScheme],
    [settings.timeColor, colorScheme]
  )

  const onBackgroundChanged = useCallback(
    (value: Color) => {
      setSettings({
        background: { ...settings.background, [colorScheme]: value }
      })
    },
    [settings.background, colorScheme]
  )

  const onTextColorChanged = useCallback(
    (value: Color) => {
      setSettings({
        textColor: { ...settings.textColor, [colorScheme]: value }
      })
    },
    [settings.textColor, colorScheme]
  )

  const onTimeColorChanged = useCallback(
    (value: Color) => {
      setSettings({
        timeColor: { ...settings.timeColor, [colorScheme]: value }
      })
    },
    [settings.timeColor, colorScheme]
  )

  return (
    <List navigationTitle='设置' navigationBarTitleDisplayMode='inline'>
      <Section header={<Text>小组件</Text>}>
        <HStack>
          <Stepper
            title='字体大小'
            onDecrement={() => setSettings({ fontSize: settings.fontSize - 1 })}
            onIncrement={() => setSettings({ fontSize: settings.fontSize + 1 })}
          />
          <Text>{settings.fontSize}</Text>
        </HStack>
        <HStack>
          <Stepper
            title='行数限制'
            onDecrement={() =>
              setSettings({ lineLimit: Math.max(1, settings.lineLimit - 1) })
            }
            onIncrement={() => setSettings({ lineLimit: settings.lineLimit + 1 })}
          />
          <Text>{settings.lineLimit}</Text>
        </HStack>
        <HStack>
          <Stepper
            title='条目间距'
            onDecrement={() => setSettings({ gap: Math.max(0, settings.gap - 1) })}
            onIncrement={() => setSettings({ gap: settings.gap + 1 })}
          />
          <Text>{settings.gap}</Text>
        </HStack>
        <ColorPicker
          title='背景颜色'
          value={background}
          onChanged={onBackgroundChanged}
        />
        <ColorPicker
          title='文字颜色'
          value={textColor}
          onChanged={onTextColorChanged}
        />
        <ColorPicker
          title='时间颜色'
          value={timeColor}
          onChanged={onTimeColorChanged}
        />
        <TextField
          title='过滤排除'
          prompt='正则表达式'
          value={settings.exclude}
          onChanged={(value) => setSettings({ exclude: value })}
        />
      </Section>
    </List>
  )
}
