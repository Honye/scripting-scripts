import {
  Button,
  HStack,
  Image,
  ProgressView,
  ScrollView,
  Spacer,
  Text,
  TextField,
  VStack,
  ZStack,
  useEffect,
  useRef,
  useState
} from 'scripting'
import type { Color } from 'scripting'
import type { PlaySource, Show } from '../types'
import { theme } from '../theme'
import { i18n } from '../i18n'
import { fetchPlaySources } from '../api'
import { CUSTOM_SOURCE_ID, listSources, openSource } from '../play'
import {
  CompletedBadge,
  GenrePill,
  Poster,
  PrimaryButton,
  SectionLabel,
  SourceRow
} from '../components'

/** Sources older than this are silently refreshed when the sheet opens. */
const SOURCES_TTL = 7 * 24 * 60 * 60 * 1000

function RepeatButton({
  action,
  children
}: {
  action: () => void
  children: any
}) {
  const active = useRef(false)
  const timer = useRef<number | null>(null)

  const stop = () => {
    active.current = false
    if (timer.current != null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const repeat = () => {
    if (!active.current) return
    action()
    timer.current = setTimeout(repeat, 80)
  }

  return (
    <ZStack
      onTapGesture={action}
      onLongPressGesture={{
        minDuration: 400,
        perform: () => {
          stop()
          active.current = true
          repeat()
        },
        onPressingChanged: (pressing) => {
          if (!pressing) stop()
        }
      }}
    >
      {children}
    </ZStack>
  )
}

function StepperButton({
  systemName,
  action,
  tint
}: {
  systemName: string
  action: () => void
  tint?: Color
}) {
  return (
    <RepeatButton action={action}>
      <Image
        systemName={systemName}
        font={16} fontWeight="semibold"
        foregroundStyle={theme.text}
        frame={{ width: 44, height: 44 }}
        background={{
          style: tint ?? theme.surfaceAlt2,
          shape: { type: 'rect', cornerRadius: 14 }
        }}
      />
    </RepeatButton>
  )
}

/** Discovered streaming vendors plus the manual link, with a radio to pick the default. */
function SourcesSection({
  show,
  onUpdate
}: {
  show: Show
  onUpdate: (id: number, patch: Partial<Show>) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlInput, setUrlInput] = useState(show.playUrl ?? '')

  const sources = listSources(show)
  const selectedId =
    sources.find((s) => s.id === show.defaultSourceId)?.id ?? sources[0]?.id

  const refresh = () => {
    const doubanId = show.doubanId
    const doubanType = show.doubanType
    if (!doubanId || !doubanType || loading) return
    setLoading(true)
    setError(null)
    fetchPlaySources(doubanId, doubanType)
      .then((found: PlaySource[]) => {
        setLoading(false)
        const stillValid =
          show.defaultSourceId === CUSTOM_SOURCE_ID ||
          found.some((s) => s.id === show.defaultSourceId)
        onUpdate(show.id, {
          sources: found,
          sourcesUpdatedAt: Date.now(),
          defaultSourceId: stillValid ? show.defaultSourceId : found[0]?.id
        })
      })
      .catch(() => {
        setLoading(false)
        setError(i18n.sourcesFailed)
      })
  }

  // Refresh silently on open when the cached sources are missing or stale.
  useEffect(() => {
    if (!show.doubanId || !show.doubanType) return
    const age = show.sourcesUpdatedAt ? Date.now() - show.sourcesUpdatedAt : Infinity
    if (age > SOURCES_TTL) refresh()
  }, [])

  const commitUrl = () => {
    const trimmed = urlInput.trim()
    const patch: Partial<Show> = {
      playUrl: trimmed.length > 0 ? trimmed : undefined
    }
    // Dropping the custom link cannot leave it selected as the default.
    if (trimmed.length === 0 && show.defaultSourceId === CUSTOM_SOURCE_ID) {
      patch.defaultSourceId = show.sources?.[0]?.id
    }
    onUpdate(show.id, patch)
    setEditingUrl(false)
  }

  const canFetch = show.doubanId != null && show.doubanType != null

  return (
    <VStack spacing={10} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      <HStack>
        <SectionLabel>{i18n.sourcesTitle}</SectionLabel>
        <Spacer />
        {loading ? (
          <HStack spacing={6}>
            <ProgressView progressViewStyle="circular" />
            <Text font={12} foregroundStyle={theme.textQuaternary}>
              {i18n.sourcesLoading}
            </Text>
          </HStack>
        ) : null}
      </HStack>

      {sources.map((src) => (
        <SourceRow
          key={src.id}
          source={src}
          selected={src.id === selectedId}
          onSelect={() => onUpdate(show.id, { defaultSourceId: src.id })}
          onPlay={() => {
            openSource(show, src).catch((e) => console.error(e))
          }}
        />
      ))}

      {sources.length === 0 && !loading ? (
        <Text font={13} foregroundStyle={theme.textQuaternary}>
          {error ?? i18n.sourcesNone}
        </Text>
      ) : null}

      {sources.length > 1 ? (
        <Text font={11} foregroundStyle={theme.textDisabled}>
          {i18n.sourcesHint}
        </Text>
      ) : null}

      {error != null && sources.length > 0 ? (
        <Text font={12} foregroundStyle="systemRed">
          {error}
        </Text>
      ) : null}

      {editingUrl ? (
        <TextField
          title=""
          prompt={i18n.sourceEditUrlPrompt}
          value={urlInput}
          onChanged={setUrlInput}
          textFieldStyle="roundedBorder"
          keyboardType="URL"
          textInputAutocapitalization="never"
          autocorrectionDisabled
          autofocus
          foregroundStyle={theme.text}
          font={14}
          onBlur={commitUrl}
          onSubmit={commitUrl}
        />
      ) : null}

      <HStack spacing={16} frame={{ maxWidth: 'infinity' }}>
        <Spacer />
        {canFetch ? (
          <Button action={refresh} buttonStyle="plain">
            <HStack spacing={5}>
              <Image
                systemName="arrow.clockwise"
                font={12}
                fontWeight="semibold"
                foregroundStyle={theme.brandEnd}
              />
              <Text font={13} fontWeight="semibold" foregroundStyle={theme.brandEnd}>
                {sources.length > 0 ? i18n.sourcesRefresh : i18n.sourcesFind}
              </Text>
            </HStack>
          </Button>
        ) : null}
        <Button
          action={() => {
            setUrlInput(show.playUrl ?? '')
            setEditingUrl(true)
          }}
          buttonStyle="plain"
        >
          <HStack spacing={5}>
            <Image
              systemName="link"
              font={12}
              fontWeight="semibold"
              foregroundStyle={theme.brandEnd}
            />
            <Text font={13} fontWeight="semibold" foregroundStyle={theme.brandEnd}>
              {i18n.sourceEditUrl}
            </Text>
          </HStack>
        </Button>
        <Spacer />
      </HStack>
    </VStack>
  )
}

export function DetailView({
  show,
  onClose,
  onSave,
  onDelete,
  onToggleCompleted,
  onUpdate
}: {
  show: Show
  onClose: () => void
  onSave: (id: number, watched: number, total: number) => void
  onDelete: (id: number) => void
  onToggleCompleted: (id: number) => void
  onUpdate: (id: number, patch: Partial<Show>) => void
}) {
  const confirmDelete = async () => {
    const ok = await Dialog.confirm({
      title: i18n.detailDeleteTitle,
      message: i18n.detailDeleteMessage(show.title),
      cancelLabel: i18n.cancel,
      confirmLabel: i18n.delete
    })
    if (ok) {
      onDelete(show.id)
      onClose()
    }
  }
  const [watched, setWatched] = useState(show.watchedEps)
  const [total, setTotal] = useState(show.totalEps)
  const safeTotal = Math.max(total, watched)
  const ratio = safeTotal > 0 ? watched / safeTotal : 0
  const tintColor = `${show.color}55` as Color

  const [editingWatched, setEditingWatched] = useState(false)
  const [watchedInput, setWatchedInput] = useState('')
  const [editingTotal, setEditingTotal] = useState(false)
  const [totalInput, setTotalInput] = useState('')

  const commitWatched = () => {
    const n = parseInt(watchedInput, 10)
    if (!isNaN(n)) setWatched(Math.max(0, Math.min(safeTotal, n)))
    setEditingWatched(false)
  }

  const commitTotal = () => {
    const n = parseInt(totalInput, 10)
    if (!isNaN(n)) setTotal(Math.max(watched, Math.max(0, n)))
    setEditingTotal(false)
  }

  return (
    <ScrollView>
      <VStack
        spacing={20}
        padding={{ horizontal: 20, top: 12, bottom: 32 }}
        frame={{ maxWidth: 'infinity', alignment: 'top' }}
        background={theme.surface}
      >
        <HStack spacing={16} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <Poster show={show} size={64} />
          <VStack alignment="leading" spacing={6}>
            <Text
              font={18}
              fontWeight="bold"
              foregroundStyle={theme.text}
              lineLimit={2}
            >
              {show.title}
            </Text>
            <HStack spacing={6}>
              <GenrePill genre={show.genre} color={show.color} />
              {show.completed ? <CompletedBadge /> : null}
            </HStack>
            <Text
              font={13}
              foregroundStyle={theme.textTertiary}
            >
              {i18n.detailSummary(safeTotal, watched)}
            </Text>
          </VStack>
          <Spacer />
        </HStack>

        <VStack spacing={12} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <HStack>
            <SectionLabel>{i18n.detailProgress}</SectionLabel>
            <Spacer />
            <Text
              font={13}
              fontWeight="semibold"
              foregroundStyle={theme.text70}
            >
              {Math.round(ratio * 100)}%
            </Text>
          </HStack>
          <ProgressView value={ratio} total={1} tint={show.color as Color} />
          <HStack spacing={20} padding={{ top: 8 }} frame={{ maxWidth: 'infinity' }}>
            <Spacer />
            <StepperButton
              systemName="minus"
              action={() => setWatched(Math.max(0, watched - 1))}
              tint={tintColor}
            />
            <VStack spacing={2} frame={{ minWidth: 60 }}>
              {editingWatched ? (
                <TextField
                  title=""
                  value={watchedInput}
                  onChanged={setWatchedInput}
                  keyboardType="numberPad"
                  textFieldStyle="plain"
                  autofocus
                  multilineTextAlignment="center"
                  font={22}
                  fontWeight="bold"
                  foregroundStyle={theme.text}
                  frame={{ minWidth: 60 }}
                  onBlur={commitWatched}
                  onSubmit={commitWatched}
                />
              ) : (
                <Text
                  font={22}
                  fontWeight="bold"
                  foregroundStyle={theme.text}
                  onTapGesture={() => {
                    setWatchedInput(String(watched))
                    setEditingWatched(true)
                  }}
                >
                  {watched}
                </Text>
              )}
              <Text
                font={11}
                foregroundStyle={theme.textQuaternary}
              >
                {i18n.detailWatched}
              </Text>
            </VStack>
            <StepperButton
              systemName="plus"
              action={() => setWatched(Math.min(safeTotal, watched + 1))}
              tint={tintColor}
            />
            <Spacer />
          </HStack>
        </VStack>

        <VStack spacing={10} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <HStack>
            <SectionLabel>{i18n.detailTotalEps}</SectionLabel>
            <Spacer />
            {editingTotal ? (
              <HStack spacing={2}>
                <TextField
                  title=""
                  value={totalInput}
                  onChanged={setTotalInput}
                  keyboardType="numberPad"
                  textFieldStyle="plain"
                  autofocus
                  font={14}
                  fontWeight="semibold"
                  foregroundStyle={theme.text}
                  fixedSize={{ horizontal: true, vertical: false }}
                  onBlur={commitTotal}
                  onSubmit={commitTotal}
                />
                <Text font={14} fontWeight="semibold" foregroundStyle={theme.text}>{i18n.detailEpsUnit}</Text>
              </HStack>
            ) : (
              <Text
                font={14}
                fontWeight="semibold"
                foregroundStyle={theme.text}
                onTapGesture={() => {
                  setTotalInput(String(total))
                  setEditingTotal(true)
                }}
              >
                {i18n.detailTotalValue(total)}
              </Text>
            )}
            <RepeatButton action={() => setTotal(Math.max(watched, total - 1))}>
              <Image
                systemName="minus.circle.fill"
                font={22}
                foregroundStyle={theme.text50}
              />
            </RepeatButton>
            <RepeatButton action={() => setTotal(total + 1)}>
              <Image
                systemName="plus.circle.fill"
                font={22}
                foregroundStyle={theme.brandEnd}
              />
            </RepeatButton>
          </HStack>
        </VStack>

        <SourcesSection show={show} onUpdate={onUpdate} />

        <PrimaryButton
          title={i18n.detailSave}
          action={() => {
            onSave(show.id, watched, safeTotal)
            onClose()
          }}
        />

        <Button
          action={() => onToggleCompleted(show.id)}
          buttonStyle="plain"
        >
          <HStack
            spacing={6}
            alignment="center"
            frame={{ maxWidth: 'infinity', height: 44 }}
          >
            <Image
              systemName={show.completed ? 'arrow.uturn.backward' : 'checkmark.seal'}
              font={14}
              fontWeight="semibold"
              foregroundStyle={theme.brandEnd}
            />
            <Text
              font={14}
              fontWeight="semibold"
              foregroundStyle={theme.brandEnd}
            >
              {show.completed ? i18n.detailUnmarkCompleted : i18n.detailMarkCompleted}
            </Text>
          </HStack>
        </Button>

        <Button action={confirmDelete} buttonStyle="plain">
          <HStack
            spacing={6}
            alignment="center"
            frame={{ maxWidth: 'infinity', height: 44 }}
          >
            <Image
              systemName="trash"
              font={14}
              fontWeight="semibold"
              foregroundStyle="systemRed"
            />
            <Text
              font={14}
              fontWeight="semibold"
              foregroundStyle="systemRed"
            >
              {i18n.detailDelete}
            </Text>
          </HStack>
        </Button>
      </VStack>
    </ScrollView>
  )
}
