import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationLink,
  NavigationStack,
  ProgressView,
  Script,
  Section,
  Spacer,
  SVG,
  Text,
  useEffect,
  useMemo,
  useRef,
  useState,
  VStack
} from 'scripting'
import { comboLabel, loadSettings, saveSettings } from './settings'
import type { Settings } from './settings'
import { previewSvg, QRCodePage } from './views/QRCodePage'
import { TextSelectPage } from './views/TextSelectPage'

/** A main-page row: icon, title, a one-line status and an optional trailing view. */
function FeatureRow({
  icon,
  title,
  status,
  trailing
}: {
  icon: string
  title: string
  status: string
  trailing?: any
}) {
  return (
    <HStack spacing={12}>
      <Image systemName={icon} foregroundStyle="systemBlue" frame={{ width: 28 }} />
      <VStack alignment="leading" spacing={2}>
        <Text foregroundStyle="label">{title}</Text>
        <Text font="caption" foregroundStyle="secondaryLabel">
          {status}
        </Text>
      </VStack>
      <Spacer />
      {trailing ?? null}
    </HStack>
  )
}

function App() {
  const dismiss = Navigation.useDismiss()
  const [settings, setSettings] = useState<Settings | null>(null)
  // Latest settings, so a sub-page's change never merges into a stale copy.
  const latest = useRef<Settings | null>(null)

  useEffect(() => {
    loadSettings().then((s) => {
      latest.current = s
      setSettings(s)
    })
  }, [])

  async function update(patch: (s: Settings) => Settings) {
    if (!latest.current) return
    const next = patch(latest.current)
    latest.current = next
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

  const styleKey = JSON.stringify(settings?.qrcode.style ?? null)
  const thumb = useMemo(
    () => (settings ? previewSvg(settings.qrcode.style, 36) : ''),
    [styleKey]
  )

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
        <Section>
          <NavigationLink
            destination={
              <QRCodePage
                value={qrcode}
                onChange={(next) => update((s) => ({ ...s, qrcode: next }))}
              />
            }
          >
            <FeatureRow
              icon="qrcode"
              title="二维码"
              status={qrcode.enabled ? '已开启 · 悬浮按钮与样式' : '已关闭'}
              trailing={
                qrcode.enabled && thumb ? (
                  <SVG
                    code={thumb}
                    resizable
                    interpolation="high"
                    antialiased
                    frame={{ width: 36, height: 36 }}
                    clipShape={{ type: 'rect', cornerRadius: 6, style: 'continuous' }}
                  />
                ) : null
              }
            />
          </NavigationLink>

          <NavigationLink
            destination={
              <TextSelectPage
                value={textSelect}
                onChange={(next) => update((s) => ({ ...s, textSelect: next }))}
              />
            }
          >
            <FeatureRow
              icon="character.cursor.ibeam"
              title="文本选择"
              status={
                textSelect.enabled
                  ? `已开启 · 按住 ${comboLabel(textSelect.keys)}`
                  : '已关闭'
              }
            />
          </NavigationLink>
        </Section>

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
