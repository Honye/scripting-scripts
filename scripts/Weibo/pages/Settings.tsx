import {
  List,
  Text,
  Section,
  ColorPicker,
  Picker,
  Stepper,
  useCallback,
  HStack,
} from 'scripting'
import type { Color } from 'scripting'
import { Client, useSettings } from '../store/settings'

export default function Settings() {
  const [settings, setSettings] = useSettings()

  const onClientChanged = (value: string) => {
    setSettings({ client: value as Client })
  }

  const onDecrement = useCallback(() => {
    setSettings({ fontSize: settings.fontSize - 1 })
  }, [settings.fontSize])

  const onIncrement = useCallback(() => {
    setSettings({ fontSize: settings.fontSize + 1 })
  }, [settings.fontSize])

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
        <HStack>
          <Stepper
            title='字体大小'
            onDecrement={onDecrement}
            onIncrement={onIncrement}
          />
          <Text>{settings.fontSize}</Text>
        </HStack>
        {/* <ColorPicker
          title='字体颜色'
          value={settings.textColor}
          onChanged={onColorChange}
        ></ColorPicker> */}
      </Section>
    </List>
  )
}
