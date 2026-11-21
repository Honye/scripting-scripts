import {
  Button,
  List,
  Navigation,
  NavigationStack,
  ProgressView,
  Script,
  Section,
  Text,
  Toggle,
  useEffect,
  useState
} from 'scripting'
import {
  comboLabel,
  HOLD_KEYS,
  loadSettings,
  saveSettings
} from './settings'
import type { HoldKey, Settings } from './settings'

function App() {
  const dismiss = Navigation.useDismiss()
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    loadSettings().then(setSettings)
  }, [])

  async function update(next: Settings) {
    setSettings(next)
    try {
      await saveSettings(next)
    } catch (e) {
      await Dialog.alert({
        title: '保存失败',
        message: e instanceof Error ? e.message : String(e)
      })
    }
  }

  function toggleKey(key: HoldKey, on: boolean) {
    if (!settings) return
    const current = settings.textSelect.keys
    const keys = on
      ? HOLD_KEYS.map((k) => k.key).filter((k) => k === key || current.includes(k))
      : current.filter((k) => k !== key)
    // At least one key must stay selected.
    if (keys.length === 0) return
    update({ ...settings, textSelect: { ...settings.textSelect, keys } })
  }

  const toolbar = {
    cancellationAction: <Button title="完成" action={() => dismiss()} />
  }

  if (!settings) {
    return (
      <NavigationStack>
        <List navigationTitle="网页工具" toolbar={toolbar}>
          <ProgressView />
        </List>
      </NavigationStack>
    )
  }

  const { qrcode, textSelect } = settings

  return (
    <NavigationStack>
      <List navigationTitle="网页工具" toolbar={toolbar}>
        <Section
          header={<Text>二维码</Text>}
          footer={<Text>在网页右下角显示二维码按钮，可编辑内容后重新生成。</Text>}
        >
          <Toggle
            title="网页二维码按钮"
            systemImage="qrcode"
            value={qrcode.enabled}
            onChanged={(enabled) => update({ ...settings, qrcode: { enabled } })}
          />
        </Section>

        <Section
          header={<Text>文本选择</Text>}
          footer={
            <Text>
              {`按住 ${comboLabel(textSelect.keys)} 拖动，即可选择网页禁止选择的文字；松开后仍可 ⌘C 复制。`}
            </Text>
          }
        >
          <Toggle
            title="按住快捷键选择任意文字"
            systemImage="character.cursor.ibeam"
            value={textSelect.enabled}
            onChanged={(enabled) =>
              update({ ...settings, textSelect: { ...textSelect, enabled } })
            }
          />
        </Section>

        {textSelect.enabled ? (
          <Section
            header={<Text>快捷键</Text>}
            footer={
              <Text>
                需要同时按住所有已选按键。iPad 上长按 ⌘ 会弹出快捷键列表，建议优先使用 ⌥。
              </Text>
            }
          >
            {HOLD_KEYS.map(({ key, label }) => {
              const on = textSelect.keys.includes(key)
              return (
                <Toggle
                  key={key}
                  title={label}
                  value={on}
                  // The last selected key can't be turned off.
                  disabled={on && textSelect.keys.length === 1}
                  onChanged={(value) => toggleKey(key, value)}
                />
              )
            })}
          </Section>
        ) : null}

        <Section>
          <Text font="footnote" foregroundStyle="secondaryLabel">
            修改后刷新网页生效。需在 Safari 中允许 Scripting 扩展访问网页。
          </Text>
        </Section>
      </List>
    </NavigationStack>
  )
}

async function main() {
  await Navigation.present({ element: <App /> })
  Script.exit()
}

main()
