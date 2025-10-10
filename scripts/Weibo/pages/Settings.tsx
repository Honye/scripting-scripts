import {
  List,
  Text,
  Section,
  ColorPicker,
  Picker,
  Stepper,
  useCallback,
  HStack,
  useMemo,
  useColorScheme,
} from 'scripting'
import type { Color } from 'scripting'
import { Client, useSettings } from '../store/settings'

export default function Settings() {
  const [settings, setSettings] = useSettings()
  const colorScheme = useColorScheme()
  const background = useMemo(
    () => settings.background[colorScheme],
    [settings.background, colorScheme],
  )
  const color = useMemo(
    () => settings.color[colorScheme],
    [settings.color, colorScheme],
  )
  const timeColor = useMemo(
    () => settings.timeColor[colorScheme],
    [settings.timeColor, colorScheme],
  )

  const onClientChanged = (value: string) => {
    setSettings({ client: value as Client })
  }

  const onDecrement = useCallback(() => {
    setSettings({ fontSize: settings.fontSize - 1 })
  }, [settings.fontSize])

  const onIncrement = useCallback(() => {
    setSettings({ fontSize: settings.fontSize + 1 })
  }, [settings.fontSize])

  const onBackgroundChanged = useCallback(
    (value: Color) => {
      setSettings({
        background: { ...settings.background, [colorScheme]: value },
      })
    },
    [settings.background, colorScheme],
  )

  const onColorChanged = useCallback(
    (value: Color) => {
      setSettings({
        color: { ...settings.color, [colorScheme]: value },
      })
    },
    [settings.color, colorScheme],
  )

  const onTimeColorChanged = useCallback(
    (value: Color) => {
      setSettings({
        timeColor: { ...settings.timeColor, [colorScheme]: value },
      })
    },
    [settings.timeColor, colorScheme],
  )

  return (
    <List navigationTitle='设置' navigationBarTitleDisplayMode='inline'>
      <Section header={<Text>设置</Text>}>
        <Picker
          title='客户端'
          pickerStyle='navigationLink'
          value={settings.client}
          onChanged={onClientChanged}
        >
          <Text tag='h5'>H5</Text>
          <Text tag='international'>微博国际版</Text>
        </Picker>
        <ColorPicker
          title='背景颜色'
          value={background}
          onChanged={onBackgroundChanged}
        />
        <HStack>
          <Stepper
            title='字体大小'
            onDecrement={onDecrement}
            onIncrement={onIncrement}
          />
          <Text>{settings.fontSize}</Text>
        </HStack>
        <ColorPicker
          title='字体颜色'
          value={color}
          onChanged={onColorChanged}
        />
        <ColorPicker
          title='时间颜色'
          value={timeColor}
          onChanged={onTimeColorChanged}
        />
      </Section>
    </List>
  )
}
