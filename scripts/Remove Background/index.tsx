import {
  Button,
  Capsule,
  Circle,
  HStack,
  Image,
  ImageRenderer,
  Navigation,
  NavigationStack,
  RoundedRectangle,
  Script,
  ScrollView,
  Spacer,
  Text,
  TextField,
  VStack,
  WebView,
  ZStack,
  useEffect,
  useMemo,
  useState
} from 'scripting'
import { BgRemover } from './bgRemove'
import { i18n } from './i18n'

const ACCENT = '#5E5CE6'
const ACCENT_DEEP = '#3D3BB8'
const ACCENT_SOFT = 'rgba(94, 92, 230, 0.12)'
const SURFACE = '#FFFFFF'
const TEXT_SECONDARY = 'rgba(60, 60, 67, 0.6)'
const TEXT_TERTIARY = 'rgba(60, 60, 67, 0.3)'
const HAIRLINE = 'rgba(60, 60, 67, 0.12)'
const BG = '#F2F2F0'

type SwatchKind =
  | { id: string; label: string; type: 'checker' }
  | { id: string; label: string; type: 'color'; color: string }
  | { id: string; label: string; type: 'gradient'; from: string; to: string }

const SWATCHES: SwatchKind[] = [
  { id: 'checker', label: 'bgTransparent', type: 'checker' },
  { id: 'white', label: 'bgWhite', type: 'color', color: '#FFFFFF' },
  { id: 'black', label: 'bgBlack', type: 'color', color: '#0D0D0E' },
  { id: 'mint', label: 'bgMint', type: 'color', color: '#B8E5C8' },
  { id: 'butter', label: 'bgButter', type: 'color', color: '#F8E3A8' },
  { id: 'sky', label: 'bgSky', type: 'color', color: '#BCDFF2' },
  { id: 'coral', label: 'bgCoral', type: 'color', color: '#F4B8A8' },
  { id: 'seaside', label: 'bgSeaside', type: 'gradient', from: '#82CDE4', to: '#F3E1B8' },
  { id: 'sunset', label: 'bgSunset', type: 'gradient', from: '#F9C58D', to: '#E8806C' },
  { id: 'darkgradient', label: 'Dark Gradient', type: 'gradient', from: '#434343', to: '#000000' }
]

type Phase = 'input' | 'original' | 'processing' | 'result'

function App() {
  const remover = useMemo(() => new BgRemover(), [])
  const [urlText, setUrlText] = useState('')
  const [inputImage, setInputImage] = useState<UIImage | null>(null)
  const [resultImage, setResultImage] = useState<UIImage | null>(null)
  const [resultData, setResultData] = useState<Data | null>(null)
  const [processing, setProcessing] = useState(false)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeBg, setActiveBg] = useState<string>('checker')
  const [progress, setProgress] = useState(0)

  const phase: Phase = processing
    ? 'processing'
    : resultImage
    ? 'result'
    : inputImage
    ? 'original'
    : 'input'

  useEffect(() => {
    return () => {
      remover.dispose()
    }
  }, [])

  useEffect(() => {
    if (!processing) {
      setProgress(0)
      return
    }
    setProgress(0)
    let cancelled = false
    let timer: number | null = null
    const tick = () => {
      if (cancelled) return
      setProgress(p => {
        if (p >= 95) return p
        const step = Math.max(0.4, (100 - p) * 0.025)
        return Math.min(95, p + step)
      })
      timer = setTimeout(tick, 200)
    }
    timer = setTimeout(tick, 200)
    return () => {
      cancelled = true
      if (timer !== null) clearTimeout(timer)
    }
  }, [processing])

  const phaseLabel = (() => {
    if (progress < 30) return i18n.phaseDetect
    if (progress < 70) return i18n.phaseSeparate
    if (progress < 95) return i18n.phaseRefine
    return i18n.phaseFinishing
  })()

  const resetAll = () => {
    setInputImage(null)
    setResultImage(null)
    setResultData(null)
    setError(null)
    setActiveBg('checker')
  }

  const onPaste = async () => {
    try {
      const text = await Pasteboard.getString()
      if (text) setUrlText(text)
    } catch {}
  }

  const onStartFromUrl = async () => {
    const url = urlText.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      setError(i18n.errorInvalidUrl)
      return
    }
    setLoadingUrl(true)
    setError(null)
    try {
      const img = await UIImage.fromURL(url)
      if (img) {
        setInputImage(img)
        setResultImage(null)
        setResultData(null)
      } else {
        setError(i18n.errorLoadImage)
      }
    } catch {
      setError(i18n.errorLoadImage)
    } finally {
      setLoadingUrl(false)
    }
  }

  const onPickFromAlbum = async () => {
    try {
      const images = await Photos.pickPhotos(1)
      if (images && images.length > 0) {
        setInputImage(images[0])
        setResultImage(null)
        setResultData(null)
        setError(null)
      }
    } catch {}
  }

  const onRemoveBackground = async () => {
    if (!inputImage || processing) return
    setProcessing(true)
    setError(null)
    setResultImage(null)
    setResultData(null)
    try {
      const base64 = inputImage.toPNGBase64String()
      if (!base64) throw new Error(i18n.errorProcessing)
      const resultBase64 = await remover.processBase64(base64, 'image/png')
      const data = Data.fromBase64String(resultBase64)
      if (!data) throw new Error(i18n.errorProcessing)
      const img = UIImage.fromData(data)
      if (!img) throw new Error(i18n.errorProcessing)
      setProgress(100)
      setResultImage(img)
      setResultData(data)
      HapticFeedback.notificationSuccess()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || i18n.errorProcessing)
      HapticFeedback.notificationError()
    } finally {
      setProcessing(false)
    }
  }

  const activeSwatch = SWATCHES.find(s => s.id === activeBg) || SWATCHES[0]

  const onSave = async () => {
    if (!resultData || !resultImage) return
    try {
      let data: Data | null = resultData
      if (activeSwatch.type !== 'checker') {
        data = await ImageRenderer.toPNGData(
          <CompositeForExport image={resultImage} swatch={activeSwatch} />,
          { scale: 2, opaque: true }
        )
      }
      if (!data) throw new Error(i18n.saveFailed)
      const ok = await Photos.savePhoto(data, {
        fileName: `bg-removed-${Date.now()}.png`
      })
      await Dialog.alert({ message: ok ? i18n.saveSuccess : i18n.saveFailed })
      if (ok) HapticFeedback.notificationSuccess()
    } catch {
      await Dialog.alert({ message: i18n.saveFailed })
    }
  }

  return (
    <NavigationStack>
      <ZStack
        alignment="topLeading"
        background={BG}
      >
        <WebView
          controller={remover.controller}
          frame={{ width: 1, height: 1 }}
          opacity={0.01}
          allowsHitTesting={false}
        />

        <ScrollView frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
          <VStack
            spacing={18}
            alignment="leading"
            padding={{ leading: 20, trailing: 20, top: 8, bottom: 28 }}
            frame={{ maxWidth: 'infinity' }}
          >
            <Header phase={phase} onBack={resetAll} />

            {phase === 'input' ? (
              <InputBlock
                urlText={urlText}
                setUrlText={setUrlText}
                loadingUrl={loadingUrl}
                onPaste={onPaste}
                onStartUrl={onStartFromUrl}
                onPickAlbum={onPickFromAlbum}
              />
            ) : null}

            {phase === 'original' && inputImage ? (
              <OriginalBlock image={inputImage} onRemove={onRemoveBackground} />
            ) : null}

            {phase === 'processing' && inputImage ? (
              <ProcessingBlock
                image={inputImage}
                progress={progress}
                phaseLabel={phaseLabel}
              />
            ) : null}

            {phase === 'result' && resultImage ? (
              <ResultBlock
                image={resultImage}
                swatch={activeSwatch}
                activeBg={activeBg}
                onPickBg={setActiveBg}
                onSave={onSave}
              />
            ) : null}

            {error ? (
              <Text
                foregroundStyle="red"
                font="footnote"
                padding={{ horizontal: 4 }}
              >
                {error}
              </Text>
            ) : null}

            <Spacer minLength={8} />
          </VStack>
        </ScrollView>
      </ZStack>
    </NavigationStack>
  )
}

// ───────────────────────────────────────────────────────────────
// Header
// ───────────────────────────────────────────────────────────────

function Header({ phase, onBack }: { phase: Phase; onBack: () => void }) {
  if (phase === 'input') {
    return (
      <VStack
        alignment="leading"
        spacing={4}
        padding={{ top: 32, bottom: 4 }}
      >
        <Text font={32} fontWeight="bold" foregroundStyle="label">
          {i18n.title}
        </Text>
        <Text font={15} foregroundStyle={TEXT_SECONDARY}>
          {i18n.subtitle}
        </Text>
      </VStack>
    )
  }
  const title =
    phase === 'processing'
      ? i18n.processingLabel
      : phase === 'result'
      ? i18n.doneLabel
      : i18n.originalLabel
  return (
    <HStack
      padding={{ top: 12, bottom: 4 }}
      frame={{ maxWidth: 'infinity' }}
    >
      <Button action={onBack}>
        <HStack spacing={4}>
          <Image
            systemName="chevron.left"
            foregroundStyle={TEXT_SECONDARY}
          />
          <Text
            font={15}
            fontWeight="semibold"
            foregroundStyle={TEXT_SECONDARY}
          >
            {i18n.back}
          </Text>
        </HStack>
      </Button>
      <Spacer />
      <Text font={15} fontWeight="semibold" foregroundStyle="label">
        {title}
      </Text>
      <Spacer />
      <HStack frame={{ width: 56 }} />
    </HStack>
  )
}

// ───────────────────────────────────────────────────────────────
// Input
// ───────────────────────────────────────────────────────────────

function InputBlock(props: {
  urlText: string
  setUrlText: (v: string) => void
  loadingUrl: boolean
  onPaste: () => void
  onStartUrl: () => void
  onPickAlbum: () => void
}) {
  const { urlText, setUrlText, loadingUrl, onPaste, onStartUrl, onPickAlbum } = props
  const valid = /^https?:\/\/.+/.test(urlText.trim())

  return (
    <VStack alignment="leading" spacing={14} frame={{ maxWidth: 'infinity' }}>
      {/* URL row */}
      <HStack
        spacing={8}
        padding={{ leading: 14, trailing: 6, vertical: 6 }}
        background={<RoundedRectangle fill={SURFACE} cornerRadius={16} />}
        frame={{ maxWidth: 'infinity' }}
      >
        <Image
          systemName="link"
          font={15}
          foregroundStyle={TEXT_TERTIARY}
        />
        <TextField
          title=""
          prompt={i18n.urlInputPlaceholder}
          value={urlText}
          onChanged={setUrlText}
          textFieldStyle="plain"
          keyboardType="URL"
          autocorrectionDisabled
          textInputAutocapitalization="never"
          font={15}
          frame={{ maxWidth: 'infinity', height: 36 }}
        />
        {urlText ? (
          <Button
            action={() => valid && onStartUrl()}
            disabled={!valid || loadingUrl}
          >
            <Text
              padding={{ horizontal: 14 }}
              frame={{ height: 36 }}
              font={14}
              fontWeight="semibold"
              foregroundStyle={ACCENT_DEEP}
              background={
                <RoundedRectangle fill={ACCENT_SOFT} cornerRadius={11} />
              }
            >
              {loadingUrl ? '…' : i18n.startButton}
            </Text>
          </Button>
        ) : (
          <Button action={onPaste}>
            <HStack
              spacing={4}
              padding={{ horizontal: 14 }}
              frame={{ height: 36 }}
              background={
                <RoundedRectangle fill={ACCENT_SOFT} cornerRadius={11} />
              }
            >
              <Image
                systemName="doc.on.clipboard"
                font={12}
                foregroundStyle={ACCENT_DEEP}
              />
              <Text
                font={14}
                fontWeight="semibold"
                foregroundStyle={ACCENT_DEEP}
              >
                {i18n.pasteButton}
              </Text>
            </HStack>
          </Button>
        )}
      </HStack>

      {/* OR divider */}
      <HStack
        spacing={10}
        padding={{ vertical: 4 }}
        frame={{ maxWidth: 'infinity' }}
      >
        <RoundedRectangle
          fill={HAIRLINE}
          frame={{ height: 1, maxWidth: 'infinity' }}
          cornerRadius={0.5}
        />
        <Text
          font={12}
          fontWeight="semibold"
          foregroundStyle={TEXT_TERTIARY}
          kerning={0.4}
        >
          {i18n.orDivider}
        </Text>
        <RoundedRectangle
          fill={HAIRLINE}
          frame={{ height: 1, maxWidth: 'infinity' }}
          cornerRadius={0.5}
        />
      </HStack>

      {/* Album tile */}
      <Button action={onPickAlbum} frame={{ maxWidth: 'infinity' }}>
        <VStack
          spacing={6}
          alignment="center"
          padding={{ vertical: 22, horizontal: 12 }}
          frame={{ maxWidth: 'infinity', height: 110 }}
          background={<RoundedRectangle fill={SURFACE} cornerRadius={18} />}
        >
          <ZStack
            frame={{ width: 44, height: 44 }}
            background={<RoundedRectangle fill={ACCENT_SOFT} cornerRadius={13} />}
          >
            <Image
              systemName="photo.on.rectangle.angled"
              font={22}
              foregroundStyle={ACCENT_DEEP}
            />
          </ZStack>
          <Text
            font={15}
            fontWeight="semibold"
            foregroundStyle="label"
            padding={{ top: 4 }}
          >
            {i18n.fromAlbum}
          </Text>
        </VStack>
      </Button>
    </VStack>
  )
}

// ───────────────────────────────────────────────────────────────
// Original
// ───────────────────────────────────────────────────────────────

function OriginalBlock({
  image,
  onRemove
}: {
  image: UIImage
  onRemove: () => void
}) {
  return (
    <VStack alignment="leading" spacing={14} frame={{ maxWidth: 'infinity' }}>
      <ZStack
        alignment="topLeading"
        frame={{ maxWidth: 'infinity' }}
        clipShape={{ type: 'rect', cornerRadius: 22 }}
        shadow={{ color: 'rgba(20,25,30,0.06)', radius: 12, y: 6 }}
      >
        <Image
          image={image}
          resizable
          scaleToFit
          frame={{ maxWidth: 'infinity', maxHeight: 420 }}
        />
        <ChipLabel text={i18n.originalLabel} />
      </ZStack>

      <Spacer minLength={4} />

      <PrimaryCTA
        action={onRemove}
        systemImage="sparkles"
        label={i18n.removeButton}
      />
    </VStack>
  )
}

// ───────────────────────────────────────────────────────────────
// Processing
// ───────────────────────────────────────────────────────────────

function ProcessingBlock({
  image,
  progress,
  phaseLabel
}: {
  image: UIImage
  progress: number
  phaseLabel: string
}) {
  return (
    <VStack alignment="leading" spacing={16} frame={{ maxWidth: 'infinity' }}>
      <ZStack
        alignment="center"
        frame={{ maxWidth: 'infinity' }}
        clipShape={{ type: 'rect', cornerRadius: 22 }}
        shadow={{ color: 'rgba(20,25,30,0.06)', radius: 12, y: 6 }}
      >
        <Image
          image={image}
          resizable
          scaleToFit
          frame={{ maxWidth: 'infinity', maxHeight: 420 }}
          opacity={Math.max(0.25, 1 - progress / 100)}
        />
        <RoundedRectangle
          fill="rgba(94,92,230,0.08)"
          frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
          cornerRadius={0}
        />
      </ZStack>

      <HStack spacing={14} frame={{ maxWidth: 'infinity' }}>
        <ProgressRing value={progress} />
        <VStack alignment="leading" spacing={4} frame={{ maxWidth: 'infinity' }}>
          <Text font={17} fontWeight="semibold" foregroundStyle="label">
            {phaseLabel}
          </Text>
          <Text font={13} foregroundStyle={TEXT_SECONDARY}>
            {i18n.processingHint}
          </Text>
          <ZStack
            alignment="leading"
            frame={{ maxWidth: 'infinity', height: 4 }}
            padding={{ top: 6 }}
          >
            <RoundedRectangle
              fill="rgba(0,0,0,0.06)"
              frame={{ maxWidth: 'infinity', height: 4 }}
              cornerRadius={2}
            />
            <RoundedRectangle
              fill={ACCENT}
              frame={{
                width: Math.max(4, (progress / 100) * 240),
                height: 4
              }}
              cornerRadius={2}
            />
          </ZStack>
        </VStack>
      </HStack>

      <Text
        font={12}
        foregroundStyle={TEXT_TERTIARY}
        padding={{ horizontal: 4 }}
      >
        {i18n.modelHint}
      </Text>
    </VStack>
  )
}

function ProgressRing({ value }: { value: number }) {
  const pct = Math.round(value)
  return (
    <ZStack
      alignment="center"
      frame={{ width: 84, height: 84 }}
    >
      <Circle
        stroke={{
          shapeStyle: 'rgba(0,0,0,0.06)',
          strokeStyle: { lineWidth: 8 }
        }}
        frame={{ width: 76, height: 76 }}
      />
      <Circle
        stroke={{
          shapeStyle: ACCENT,
          strokeStyle: { lineWidth: 8, lineCap: 'round' }
        }}
        trim={{ from: 0, to: Math.max(0.001, value / 100) }}
        rotationEffect={{ angle: { degrees: -90 } }}
        frame={{ width: 76, height: 76 }}
      />
      <Text font={18} fontWeight="bold" foregroundStyle="label">
        {pct}
      </Text>
    </ZStack>
  )
}

// ───────────────────────────────────────────────────────────────
// Result
// ───────────────────────────────────────────────────────────────

function ResultBlock({
  image,
  swatch,
  activeBg,
  onPickBg,
  onSave
}: {
  image: UIImage
  swatch: SwatchKind
  activeBg: string
  onPickBg: (id: string) => void
  onSave: () => void
}) {
  return (
    <VStack alignment="leading" spacing={14} frame={{ maxWidth: 'infinity' }}>
      <ZStack
        alignment="center"
        frame={{ maxWidth: 'infinity' }}
        clipShape={{ type: 'rect', cornerRadius: 22 }}
        shadow={{ color: 'rgba(20,25,30,0.06)', radius: 12, y: 6 }}
      >
        <SwatchBackground swatch={swatch} />
        <Image
          image={image}
          resizable
          scaleToFit
          frame={{ maxWidth: 'infinity', maxHeight: 420 }}
        />
      </ZStack>

      <HStack
        padding={{ top: 4 }}
        frame={{ maxWidth: 'infinity' }}
      >
        <Text
          font={13}
          fontWeight="bold"
          foregroundStyle={TEXT_SECONDARY}
          kerning={0.2}
        >
          {i18n.changeBg}
        </Text>
        <Spacer />
        <Text font={11} foregroundStyle={TEXT_TERTIARY}>
          {(i18n as Record<string, string>)[swatch.label] || swatch.label}
        </Text>
      </HStack>

      <ScrollView axes="horizontal" frame={{ maxWidth: 'infinity' }}>
        <HStack
          spacing={8}
          padding={8}
          background={<RoundedRectangle fill={SURFACE} cornerRadius={16} />}
        >
          {SWATCHES.map(s => (
            <Button key={s.id} action={() => onPickBg(s.id)}>
              <Swatch swatch={s} active={s.id === activeBg} />
            </Button>
          ))}
        </HStack>
      </ScrollView>

      <Spacer minLength={6} />

      <PrimaryCTA
        action={onSave}
        systemImage="square.and.arrow.down"
        label={i18n.saveToAlbum}
      />
    </VStack>
  )
}

function Swatch({ swatch, active }: { swatch: SwatchKind; active: boolean }) {
  const size = 40
  const radius = 11
  let inner
  if (swatch.type === 'checker') {
    inner = <CheckerTile size={size} radius={radius} />
  } else if (swatch.type === 'color') {
    inner = (
      <RoundedRectangle
        fill={swatch.color}
        frame={{ width: size, height: size }}
        cornerRadius={radius}
      />
    )
  } else {
    inner = (
      <RoundedRectangle
        fill={{
          colors: [swatch.from, swatch.to],
          startPoint: 'top',
          endPoint: 'bottom'
        }}
        frame={{ width: size, height: size }}
        cornerRadius={radius}
      />
    )
  }

  return (
    <ZStack frame={{ width: size + 6, height: size + 6 }}>
      {active ? (
        <RoundedRectangle
          stroke={{ shapeStyle: ACCENT, strokeStyle: { lineWidth: 2 } }}
          cornerRadius={radius + 3}
          frame={{ width: size + 6, height: size + 6 }}
        />
      ) : null}
      {inner}
    </ZStack>
  )
}

function CheckerTile({ size, radius }: { size: number; radius: number }) {
  return (
    <ZStack frame={{ width: size, height: size }}>
      <RoundedRectangle
        fill="#FFFFFF"
        frame={{ width: size, height: size }}
        cornerRadius={radius}
      />
      <HStack spacing={0} frame={{ width: size, height: size }}>
        <RoundedRectangle
          fill="rgba(0,0,0,0.08)"
          frame={{ width: size / 2, height: size / 2 }}
          cornerRadius={0}
        />
        <RoundedRectangle
          fill="rgba(0,0,0,0)"
          frame={{ width: size / 2, height: size / 2 }}
          cornerRadius={0}
        />
      </HStack>
    </ZStack>
  )
}

function SwatchBackground({ swatch }: { swatch: SwatchKind }) {
  if (swatch.type === 'checker') {
    return (
      <RoundedRectangle
        fill="#F4F4F2"
        frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
        cornerRadius={0}
      />
    )
  }
  if (swatch.type === 'color') {
    return (
      <RoundedRectangle
        fill={swatch.color}
        frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
        cornerRadius={0}
      />
    )
  }
  return (
    <RoundedRectangle
      fill={{
        colors: [swatch.from, swatch.to],
        startPoint: 'top',
        endPoint: 'bottom'
      }}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      cornerRadius={0}
    />
  )
}

function CompositeForExport({
  image,
  swatch
}: {
  image: UIImage
  swatch: SwatchKind
}) {
  return (
    <ZStack alignment="center" frame={{ width: 1024, height: 1024 }}>
      <SwatchBackground swatch={swatch} />
      <Image
        image={image}
        resizable
        scaleToFit
        frame={{ width: 1024, height: 1024 }}
      />
    </ZStack>
  )
}

// ───────────────────────────────────────────────────────────────
// Reusable bits
// ───────────────────────────────────────────────────────────────

function PrimaryCTA({
  action,
  systemImage,
  label
}: {
  action: () => void
  systemImage: string
  label: string
}) {
  return (
    <Button action={action} frame={{ maxWidth: 'infinity' }}>
      <HStack
        spacing={8}
        frame={{ maxWidth: 'infinity', height: 56 }}
        padding={{ horizontal: 12 }}
        background={<RoundedRectangle fill={ACCENT} cornerRadius={16} />}
        shadow={{ color: 'rgba(94,92,230,0.38)', radius: 18, y: 6 }}
      >
        <Image
          systemName={systemImage}
          font={17}
          foregroundStyle="white"
        />
        <Text font={17} fontWeight="semibold" foregroundStyle="white">
          {label}
        </Text>
      </HStack>
    </Button>
  )
}

function ChipLabel({ text }: { text: string }) {
  return (
    <HStack padding={{ leading: 12, top: 12 }}>
      <Text
        padding={{ horizontal: 10, vertical: 4 }}
        font={11}
        fontWeight="bold"
        foregroundStyle="white"
        kerning={0.8}
        background={<Capsule fill="rgba(20,22,24,0.6)" />}
      >
        {text.toUpperCase()}
      </Text>
    </HStack>
  )
}

// ───────────────────────────────────────────────────────────────

;(async function () {
  await Navigation.present({
    element: <App />,
    modalPresentationStyle: 'pageSheet'
  })
  Script.exit()
})()
