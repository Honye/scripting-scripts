import {
  Button,
  ColorPicker,
  HStack,
  List,
  RoundedRectangle,
  ScrollView,
  Section,
  Spacer,
  SVG,
  Text,
  Toggle,
  useMemo,
  useState,
  VStack
} from 'scripting'
import type { Color } from 'scripting'
import { contrastRatio, qrSvg } from '../qr'
import { COLOR_PRESETS, DEFAULT_STYLE, DOT_SHAPES, EYE_SHAPES } from '../settings'
import type { ColorPreset, QRStyle, Settings } from '../settings'

type QRSettings = Settings['qrcode']

/** What every style preview encodes. */
export const PREVIEW_TEXT = 'https://t.me/iiMarkr'
const THUMB = 72
/** Default gradient end when the gradient toggle is first switched on. */
const GRADIENT_END = '#0052B4'

export function previewSvg(style: QRStyle, size: number): string {
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

/** A captioned, horizontally scrolling row of style previews. */
function ThumbRow({ title, children }: { title: string; children: any }) {
  return (
    <VStack alignment="leading" spacing={4}>
      <Text font="subheadline" foregroundStyle="secondaryLabel">
        {title}
      </Text>
      <ScrollView axes="horizontal" scrollIndicator="hidden">
        <HStack spacing={14} padding={{ vertical: 6, horizontal: 2 }}>
          {children}
        </HStack>
      </ScrollView>
    </VStack>
  )
}

/** 二维码: the floating button on/off and the code's style. */
export function QRCodePage({
  value,
  onChange
}: {
  value: QRSettings
  onChange: (next: QRSettings) => void
}) {
  // Own copy, so the page stays current even if the pushed view isn't
  // re-rendered with new props.
  const [qrcode, setQRCode] = useState(value)
  const { enabled, style } = qrcode

  function apply(next: QRSettings) {
    setQRCode(next)
    onChange(next)
  }

  function setStyle(patch: Partial<QRStyle>) {
    apply({ ...qrcode, style: { ...style, ...patch } })
  }

  const bigPreview = useMemo(() => previewSvg(style, 200), [JSON.stringify(style)])
  const contrast = minContrast(style)

  return (
    <List navigationTitle="二维码">
      <Section footer={<Text>在网页上显示悬浮二维码按钮，可拖动并自动吸边；点击后显示当前网址的二维码，可编辑内容后重新生成。</Text>}>
        <Toggle
          title="网页二维码按钮"
          systemImage="qrcode"
          value={enabled}
          onChanged={(on) => apply({ ...qrcode, enabled: on })}
        />
      </Section>

      {enabled ? (
        <Section
          header={<Text>样式</Text>}
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

          <ThumbRow title="码点款式">
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

          <ThumbRow title="定位角">
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

          <ThumbRow title="颜色">
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
        </Section>
      ) : null}

      {enabled ? (
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
          {contrast != null && contrast < 3 ? (
            <Text font="footnote" foregroundStyle="systemOrange">
              前景与背景对比度过低，可能无法扫描。
            </Text>
          ) : null}
          <Button
            title="恢复默认样式"
            role="destructive"
            action={() => setStyle({ ...DEFAULT_STYLE })}
          />
        </Section>
      ) : null}
    </List>
  )
}
