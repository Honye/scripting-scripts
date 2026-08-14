import {
  Button,
  HStack,
  Image,
  List,
  Menu,
  Navigation,
  Picker,
  Rectangle,
  Section,
  Slider,
  Spacer,
  Text,
  Toggle,
  VStack,
  ZStack,
  useCallback,
  useMemo,
  useState,
} from 'scripting'
import { describeCategory } from '../components/CategorySidebar'
import { t } from '../constants/i18n'
import {
  ANIMATION_KINDS,
  ANIMATION_VARIANTS,
  BACKGROUNDS,
  COLOR_PRESETS,
  DEFAULT_ANIMATION,
  DEFAULT_STYLE,
  RENDERING_MODES,
  backgroundColor,
  buildSymbolEffect,
  foregroundStyleOf,
  isTriggerAnimation,
  normalizeAnimation,
  relatedVariants,
  type AnimationKind,
  type SymbolAnimation,
  type SymbolStyle,
} from '../constants/symbolStyle'
import type { SymbolLibrary } from '../types'
import { copySymbolAsPng, exportSymbolPngFile, PNG_PRESETS } from '../utils/png'
import { loadAnimation, loadStyle, saveAnimation, saveStyle } from '../utils/styleStore'

type Tab = 'info' | 'style' | 'animation'

export type SymbolDetailViewProps = {
  name: string
  library: SymbolLibrary | null
}

/**
 * 图标详情，对齐 SF Symbols.app 的检查器：信息 / 主题 / 动画三个面板。
 * 主题与动画设置存在共享域，键盘那边复制 PNG 时会读同一份。
 */
export function SymbolDetailView({ name: initialName, library }: SymbolDetailViewProps) {
  const dismiss = Navigation.useDismiss()

  const [name, setName] = useState(initialName)
  const [tab, setTab] = useState<Tab>('style')
  const [style, setStyle] = useState<SymbolStyle>(() => loadStyle())
  const [animation, setAnimation] = useState<SymbolAnimation>(() => loadAnimation())
  const [playToken, setPlayToken] = useState(0)
  const [triggerActive, setTriggerActive] = useState(true)
  const [status, setStatus] = useState<string | null>(null)

  const flash = useCallback((message: string) => {
    setStatus(message)
    setTimeout(() => setStatus(null), 1500)
  }, [])

  const updateStyle = useCallback((patch: Partial<SymbolStyle>) => {
    setStyle(prev => {
      const next = { ...prev, ...patch }
      saveStyle(next)
      return next
    })
  }, [])

  const updateAnimation = useCallback((patch: Partial<SymbolAnimation>) => {
    setAnimation(prev => {
      const next = normalizeAnimation({ ...prev, ...patch })
      saveAnimation(next)
      return next
    })
  }, [])

  const play = useCallback(() => {
    if (isTriggerAnimation(animation.kind)) setTriggerActive(v => !v)
    else setPlayToken(v => v + 1)
    HapticFeedback.selection()
  }, [animation.kind])

  const variants = useMemo(() => relatedVariants(name), [name])

  const categories = useMemo(() => {
    if (!library) return []
    return library.order
      .filter(key => (library.symbols[key] || []).includes(name))
      .map(key => describeCategory(key, library).label)
  }, [library, name])

  const effect = buildSymbolEffect(animation, playToken, triggerActive)
  const background = backgroundColor(style.background)

  return (
    <VStack
      spacing={0}
      navigationTitle={name}
      navigationBarTitleDisplayMode="inline"
      toolbar={{
        topBarTrailing: [<Button title={t.done} action={dismiss} />],
      }}
    >
      {/* 预览。背景选「透明」就一层都不画，露出表单本身的底色；
          需要底色时用铺满的 Rectangle，直接给 ZStack 加 background
          会先按内容尺寸算出一条窄带。 */}
      <ZStack frame={{ maxWidth: 'infinity', height: 170 }} onTapGesture={play}>
        {background ? <Rectangle fill={background} /> : null}
        <Image
          systemName={name}
          variableValue={style.variable ? style.variableValue : undefined}
          font={84}
          symbolRenderingMode={style.renderingMode}
          foregroundStyle={foregroundStyleOf(style)}
          symbolEffect={effect}
        />
        {status ? (
          <VStack frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }} alignment="center">
            <Spacer />
            <Text font="caption" foregroundStyle="secondaryLabel" padding={{ bottom: 8 }}>
              {status}
            </Text>
          </VStack>
        ) : null}
      </ZStack>

      {/* 面板切换 */}
      <Picker
        title=""
        value={tab}
        onChanged={(value: string) => setTab(value as Tab)}
        pickerStyle="segmented"
        padding={{ horizontal: 16, top: 10, bottom: 4 }}
      >
        <Text tag="info">{t.tabInfo}</Text>
        <Text tag="style">{t.tabStyle}</Text>
        <Text tag="animation">{t.tabAnimation}</Text>
      </Picker>

      {tab === 'info' ? (
        <InfoPanel name={name} categories={categories} variants={variants} onPick={setName} />
      ) : tab === 'style' ? (
        <StylePanel style={style} onChange={updateStyle} />
      ) : (
        <AnimationPanel config={animation} onChange={updateAnimation} onPlay={play} />
      )}

      {/* 复制 / 导出常驻在底部，切到哪个面板都能用 */}
      <HStack spacing={10} padding={{ horizontal: 16, top: 8, bottom: 12 }}>
        <Button
          title={t.copyName}
          systemImage="doc.on.doc"
          buttonStyle="bordered"
          controlSize="small"
          frame={{ maxWidth: 'infinity' }}
          action={async () => {
            await Pasteboard.setString(name)
            flash(t.nameCopied)
          }}
        />
        <Menu
          title={t.copyPng}
          systemImage="photo"
          buttonStyle="bordered"
          controlSize="small"
          frame={{ maxWidth: 'infinity' }}
        >
          {PNG_PRESETS.map(preset => (
            <Button
              key={`copy-${preset.label}`}
              title={preset.label}
              action={async () => {
                const ok = await copySymbolAsPng(name, { size: preset.size, style })
                flash(ok ? t.pngCopied : t.renderFailed)
              }}
            />
          ))}
        </Menu>
        <Menu
          title={t.exportPngShort}
          systemImage="square.and.arrow.down"
          buttonStyle="bordered"
          controlSize="small"
          frame={{ maxWidth: 'infinity' }}
        >
          {PNG_PRESETS.map(preset => (
            <Button
              key={`export-${preset.label}`}
              title={preset.label}
              action={() => exportSymbolPngFile(name, { size: preset.size, style })}
            />
          ))}
        </Menu>
      </HStack>
    </VStack>
  )
}

// ---------------------------------------------------------------- 信息

function InfoPanel({
  name,
  categories,
  variants,
  onPick,
}: {
  name: string
  categories: string[]
  variants: string[]
  onPick: (name: string) => void
}) {
  return (
    <List>
      <Section>
        <HStack>
          <Text>{t.nameLabel}</Text>
          <Spacer />
          <Text foregroundStyle="secondaryLabel" lineLimit={1} minScaleFactor={0.7}>
            {name}
          </Text>
        </HStack>
        {categories.length ? (
          <HStack>
            <Text>{t.categoriesLabel}</Text>
            <Spacer />
            <Text foregroundStyle="secondaryLabel">{categories.join(' · ')}</Text>
          </HStack>
        ) : null}
      </Section>

      {variants.length > 1 ? (
        <Section
          header={<Text>{t.variantsLabel}</Text>}
          footer={<Text>{t.variantHint}</Text>}
        >
          {variants.map(variant => (
            <Button key={variant} action={() => onPick(variant)} buttonStyle="plain">
              <HStack spacing={12}>
                <Image
                  systemName={variant}
                  font={20}
                  frame={{ width: 30 }}
                  foregroundStyle={variant === name ? 'systemBlue' : 'label'}
                />
                <Text
                  font="callout"
                  lineLimit={1}
                  minScaleFactor={0.7}
                  foregroundStyle={variant === name ? 'systemBlue' : 'label'}
                >
                  {variant}
                </Text>
                <Spacer />
                {variant === name ? (
                  <Image systemName="checkmark" font={13} foregroundStyle="systemBlue" />
                ) : null}
              </HStack>
            </Button>
          ))}
        </Section>
      ) : null}
    </List>
  )
}

// ---------------------------------------------------------------- 主题

function StylePanel({
  style,
  onChange,
}: {
  style: SymbolStyle
  onChange: (patch: Partial<SymbolStyle>) => void
}) {
  return (
    <List>
      <Section footer={<Text>{t.styleSharedHint}</Text>}>
        <Picker
          title={t.renderingMode}
          value={style.renderingMode}
          onChanged={(value: string) => onChange({ renderingMode: value as any })}
          pickerStyle="menu"
        >
          {RENDERING_MODES.map(mode => (
            <Text key={mode.value} tag={mode.value}>
              {mode.label}
            </Text>
          ))}
        </Picker>
        <Toggle
          title={t.gradient}
          value={style.gradient}
          onChanged={value => onChange({ gradient: value })}
        />
        <Toggle
          title={t.variable}
          value={style.variable}
          onChanged={value => onChange({ variable: value })}
        />
        {style.variable ? (
          <HStack spacing={12}>
            <Text font="callout">{t.variableValue}</Text>
            <Slider
              value={style.variableValue}
              onChanged={value => onChange({ variableValue: value })}
              min={0}
              max={1}
              step={0.05}
            />
            <Text font="caption" foregroundStyle="secondaryLabel" frame={{ width: 40 }}>
              {Math.round(style.variableValue * 100)}%
            </Text>
          </HStack>
        ) : null}
      </Section>

      <Section>
        <Picker
          title={t.colorLabel}
          value={String(style.color)}
          onChanged={(value: string) => onChange({ color: value as any })}
          pickerStyle="menu"
        >
          {COLOR_PRESETS.map(preset => (
            <Text key={String(preset.value)} tag={String(preset.value)}>
              {preset.label}
            </Text>
          ))}
        </Picker>
        <HStack spacing={12}>
          <Text font="callout">{t.opacity}</Text>
          <Slider
            value={style.opacity}
            onChanged={value => onChange({ opacity: value })}
            min={0.1}
            max={1}
            step={0.05}
          />
          <Text font="caption" foregroundStyle="secondaryLabel" frame={{ width: 40 }}>
            {Math.round(style.opacity * 100)}%
          </Text>
        </HStack>
      </Section>

      <Section>
        <Picker
          title={t.background}
          value={style.background}
          onChanged={(value: string) => onChange({ background: value as any })}
          pickerStyle="menu"
        >
          {BACKGROUNDS.map(item => (
            <Text key={item.value} tag={item.value}>
              {item.label}
            </Text>
          ))}
        </Picker>
        <Button
          title={t.reset}
          systemImage="arrow.counterclockwise"
          role="destructive"
          action={() => onChange(DEFAULT_STYLE)}
        />
      </Section>
    </List>
  )
}

// ---------------------------------------------------------------- 动画

/** props 里不能叫 `animation`：那是 CommonViewProps 的保留属性名 */
function AnimationPanel({
  config,
  onChange,
  onPlay,
}: {
  config: SymbolAnimation
  onChange: (patch: Partial<SymbolAnimation>) => void
  onPlay: () => void
}) {
  const variants = ANIMATION_VARIANTS[config.kind] || []

  return (
    <List>
      <Section footer={<Text>{t.animationVariantHint}</Text>}>
        <Picker
          title={t.animationKind}
          value={config.kind}
          onChanged={(value: string) => onChange({ kind: value as AnimationKind })}
          pickerStyle="menu"
        >
          {ANIMATION_KINDS.map(item => (
            <Text key={item.value} tag={item.value}>
              {item.label}
            </Text>
          ))}
        </Picker>
        {variants.length > 1 ? (
          <Picker
            title={t.animationVariant}
            value={config.variant}
            onChanged={(value: string) => onChange({ variant: value })}
            pickerStyle="menu"
          >
            {variants.map(item => (
              <Text key={item.value || 'default'} tag={item.value}>
                {item.label}
              </Text>
            ))}
          </Picker>
        ) : null}
      </Section>

      <Section>
        <Picker
          title={t.repeatPlay}
          value={config.repeatMode}
          onChanged={(value: string) => onChange({ repeatMode: value as any })}
          pickerStyle="menu"
        >
          <Text tag="once">{t.repeatOnce}</Text>
          <Text tag="continuous">{t.repeatContinuous}</Text>
        </Picker>
        <HStack spacing={12}>
          <Text font="callout">{t.speed}</Text>
          <Slider
            value={config.speed}
            onChanged={value => onChange({ speed: value })}
            min={0.25}
            max={3}
            step={0.25}
          />
          <Text font="caption" foregroundStyle="secondaryLabel" frame={{ width: 44 }}>
            {config.speed.toFixed(2)}x
          </Text>
        </HStack>
      </Section>

      <Section>
        <Button title={t.play} systemImage="play.fill" action={onPlay} />
        <Button
          title={t.reset}
          systemImage="arrow.counterclockwise"
          role="destructive"
          action={() => onChange(DEFAULT_ANIMATION)}
        />
      </Section>
    </List>
  )
}
