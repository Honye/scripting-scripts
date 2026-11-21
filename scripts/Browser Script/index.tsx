import {
  Button,
  ColorPicker,
  HStack,
  List,
  Navigation,
  NavigationStack,
  ProgressView,
  RoundedRectangle,
  Script,
  ScrollView,
  Section,
  Spacer,
  SVG,
  Text,
  Toggle,
  useEffect,
  useMemo,
  useState,
  VStack
} from 'scripting'
import type { Color } from 'scripting'
import { contrastRatio, qrSvg } from './qr'
import {
  COLOR_PRESETS,
  comboLabel,
  DEFAULT_STYLE,
  DOT_SHAPES,
  EYE_SHAPES,
  HOLD_KEYS,
  loadSettings,
  saveSettings
} from './settings'
import type { ColorPreset, HoldKey, QRStyle, Settings } from './settings'

/** What every style preview encodes. */
const PREVIEW_TEXT = 'https://t.me/iiMarkr'
const THUMB = 72
/** Default gradient end when the gradient toggle is first switched on. */
const GRADIENT_END = '#0052B4'

function previewSvg(style: QRStyle, size: number): string {
  try {
    // ×3 so the rasterised bitmap stays sharp on Retina screens.
    return qrSvg(PREVIEW_TEXT, style, { px: size * 3 })
  } catch {
    return ''
  }
}

function sameColors(style: QRStyle, preset: ColorPreset): boolean {
  const eq = (a: string | null, b: string | null) =>
    (a ?? '').toLowerCase() === (b ?? '').toLowerCase()
  return eq(style.fg, preset.fg) && eq(style.fg2, preset.fg2) && eq(style.bg, preset.bg)
}

/** Lowest contrast between the foreground colour(s) and the background. */
function minContrast(style: QRStyle): number | null {
  const ratios = [style.fg, style.fg2]
    .filter((c): c is string => !!c)
    .map((c) => contrastRatio(c, style.bg))
  if (ratios.some((r) => r == null)) return null
  return Math.min(...(ratios as number[]))
}

function QRThumb({
  style,
  label,
  selected,
  onSelect
}: {
  style: QRStyle
  label: string
  selected: boolean
  onSelect: () => void
}) {
  const code = useMemo(() => previewSvg(style, THUMB), [JSON.stringify(style)])
  return (
    <Button action={onSelect} buttonStyle="plain">
      <VStack spacing={6}>
        <SVG
          code={code}
          resizable
          interpolation="high"
          antialiased
          frame={{ width: THUMB, height: THUMB }}
          clipShape={{ type: 'rect', cornerRadius: 12, style: 'continuous' }}
          overlay={
            <RoundedRectangle
              cornerRadius={12}
              style="continuous"
              stroke={{
                shapeStyle: selected ? 'systemBlue' : ('separator' as Color),
                strokeStyle: { lineWidth: selected ? 2.5 : 0.5 }
              }}
            />
          }
        />
        <Text
          font="caption"
          foregroundStyle={selected ? 'systemBlue' : 'secondaryLabel'}
        >
          {label}
        </Text>
      </VStack>
    </Button>
  )
}

/** A horizontally scrolling row of style previews. */
function ThumbRow({ children }: { children: any }) {
  return (
    <ScrollView axes="horizontal" scrollIndicator="hidden">
      <HStack spacing={14} padding={{ vertical: 6, horizontal: 2 }}>
        {children}
      </HStack>
    </ScrollView>
  )
}

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

  function setStyle(patch: Partial<QRStyle>) {
    if (!settings) return
    const { qrcode } = settings
    update({ ...settings, qrcode: { ...qrcode, style: { ...qrcode.style, ...patch } } })
  }

  const style = settings?.qrcode.style ?? DEFAULT_STYLE
  const bigPreview = useMemo(() => previewSvg(style, 200), [JSON.stringify(style)])

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
            onChanged={(enabled) => update({ ...settings, qrcode: { ...qrcode, enabled } })}
          />
        </Section>

        {qrcode.enabled ? (
          <Section
            header={<Text>二维码样式</Text>}
            footer={<Text>{`预览内容：${PREVIEW_TEXT}`}</Text>}
          >
            <HStack padding={{ vertical: 8 }}>
              <Spacer />
              <SVG
                code={bigPreview}
                resizable
                interpolation="high"
                antialiased
                frame={{ width: 200, height: 200 }}
                clipShape={{ type: 'rect', cornerRadius: 16, style: 'continuous' }}
              />
              <Spacer />
            </HStack>

            <VStack alignment="leading" spacing={4}>
              <Text font="subheadline" foregroundStyle="secondaryLabel">码点款式</Text>
              <ThumbRow>
                {DOT_SHAPES.map((d) => (
                  <QRThumb
                    key={d.id}
                    style={{ ...style, dot: d.id }}
                    label={d.label}
                    selected={style.dot === d.id}
                    onSelect={() => setStyle({ dot: d.id })}
                  />
                ))}
              </ThumbRow>
            </VStack>

            <VStack alignment="leading" spacing={4}>
              <Text font="subheadline" foregroundStyle="secondaryLabel">定位角</Text>
              <ThumbRow>
                {EYE_SHAPES.map((e) => (
                  <QRThumb
                    key={e.id}
                    style={{ ...style, eye: e.id }}
                    label={e.label}
                    selected={style.eye === e.id}
                    onSelect={() => setStyle({ eye: e.id })}
                  />
                ))}
              </ThumbRow>
            </VStack>

            <VStack alignment="leading" spacing={4}>
              <Text font="subheadline" foregroundStyle="secondaryLabel">颜色</Text>
              <ThumbRow>
                {COLOR_PRESETS.map((p) => (
                  <QRThumb
                    key={p.id}
                    style={{ ...style, fg: p.fg, fg2: p.fg2, bg: p.bg }}
                    label={p.label}
                    selected={sameColors(style, p)}
                    onSelect={() => setStyle({ fg: p.fg, fg2: p.fg2, bg: p.bg })}
                  />
                ))}
              </ThumbRow>
            </VStack>
          </Section>
        ) : null}

        {qrcode.enabled ? (
          <Section header={<Text>自定义颜色</Text>}>
            <ColorPicker
              title="前景色"
              supportsOpacity={false}
              value={style.fg as Color}
              onChanged={(fg) => setStyle({ fg: String(fg) })}
            />
            <Toggle
              title="渐变"
              value={style.fg2 != null}
              onChanged={(on) => setStyle({ fg2: on ? GRADIENT_END : null })}
            />
            {style.fg2 != null ? (
              <ColorPicker
                title="渐变色"
                supportsOpacity={false}
                value={style.fg2 as Color}
                onChanged={(fg2) => setStyle({ fg2: String(fg2) })}
              />
            ) : null}
            <ColorPicker
              title="背景色"
              supportsOpacity={false}
              value={style.bg as Color}
              onChanged={(bg) => setStyle({ bg: String(bg) })}
            />
            {(() => {
              const c = minContrast(style)
              return c != null && c < 3 ? (
                <Text font="footnote" foregroundStyle="systemOrange">
                  前景与背景对比度过低，可能无法扫描。
                </Text>
              ) : null
            })()}
            <Button
              title="恢复默认样式"
              role="destructive"
              action={() => setStyle({ ...DEFAULT_STYLE })}
            />
          </Section>
        ) : null}

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
