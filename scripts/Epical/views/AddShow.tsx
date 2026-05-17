import {
  Button,
  DatePicker,
  HStack,
  Image,
  NavigationStack,
  Picker,
  ProgressView,
  RoundedRectangle,
  ScrollView,
  Spacer,
  Text,
  TextField,
  VStack,
  useState,
  useEffect
} from 'scripting'
import type { Color } from 'scripting'
import type { Show } from '../types'
import { nextColor } from '../data'
import { searchShows, type SearchItem } from '../api'
import { theme } from '../theme'
import { i18n } from '../i18n'
import { GenrePill, Poster, PrimaryButton, ShowPreviewCard } from '../components'

type Candidate = {
  title: string
  genre: string
  color: string
  coverUrl?: string
}
type UpdateMode = 'weekly' | 'daily'

function defaultTimeAt(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

function tsToHHMM(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Stable color from a string id so the same Douban subject lands on the same accent. */
function colorFromId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return nextColor(Math.abs(h))
}

function ResultRow({
  item,
  color,
  onTap
}: {
  item: SearchItem
  color: string
  onTap: () => void
}) {
  return (
    <Button action={onTap} buttonStyle="plain">
      <HStack
        spacing={14}
        padding={{ horizontal: 14, vertical: 12 }}
        background={{
          style: theme.card,
          shape: { type: 'rect', cornerRadius: 14 }
        }}
        overlay={
          <RoundedRectangle
            cornerRadius={14}
            stroke={{
              shapeStyle: theme.cardBorder,
              strokeStyle: { lineWidth: 1 }
            }}
          />
        }
      >
        <Poster
          show={{ title: item.title, color, coverUrl: item.coverUrl }}
          size={42}
        />
        <VStack
          alignment="leading"
          spacing={4}
          frame={{ maxWidth: 'infinity', alignment: 'leading' }}
        >
          <Text
            font={15}
            fontWeight="semibold"
            foregroundStyle={theme.text}
            lineLimit={1}
            truncationMode="tail"
          >
            {item.title}
          </Text>
          <HStack spacing={6}>
            <GenrePill genre={item.typeName || item.genre} color={color} />
            {item.year ? (
              <Text font={11} foregroundStyle={theme.textTertiary}>
                {item.year}
              </Text>
            ) : null}
            {item.rating > 0 ? (
              <HStack spacing={2}>
                <Image
                  systemName="star.fill"
                  font={9}
                  foregroundStyle={theme.brandEnd}
                />
                <Text
                  font={11}
                  fontWeight="semibold"
                  foregroundStyle={theme.brandEnd}
                >
                  {item.rating.toFixed(1)}
                </Text>
              </HStack>
            ) : null}
          </HStack>
          {item.cardSubtitle ? (
            <Text
              font={11}
              foregroundStyle={theme.textQuaternary}
              lineLimit={1}
              truncationMode="tail"
            >
              {item.cardSubtitle}
            </Text>
          ) : null}
        </VStack>
        <Image
          systemName="chevron.right"
          font={12}
          fontWeight="semibold"
          foregroundStyle={theme.textDisabled}
        />
      </HStack>
    </Button>
  )
}

function SearchStep({
  query,
  results,
  loading,
  error,
  onSelect,
  customGenre,
  setCustomGenre
}: {
  query: string
  results: SearchItem[]
  loading: boolean
  error: string | null
  onSelect: (c: Candidate) => void
  customGenre: string
  setCustomGenre: (s: string) => void
}) {
  const trimmed = query.trim()
  const hasExact = results.some((s) => s.title === trimmed)
  const showCustom = trimmed.length > 0 && !loading && !hasExact

  return (
    <VStack
      spacing={14}
      padding={{ horizontal: 20, top: 12, bottom: 20 }}
      frame={{ maxWidth: 'infinity', alignment: 'top' }}
    >
      {showCustom ? (
        <VStack
          spacing={10}
          padding={14}
          background={{
            style: theme.brandFaintBg,
            shape: { type: 'rect', cornerRadius: 14 }
          }}
        >
          <Text
            font={12}
            fontWeight="medium"
            foregroundStyle={theme.brandEnd}
          >
            {i18n.addShowCustomAdd(trimmed)}
          </Text>
          <TextField
            title=""
            prompt={i18n.addShowGenrePrompt}
            value={customGenre}
            onChanged={setCustomGenre}
            textFieldStyle="roundedBorder"
            foregroundStyle={theme.text}
            font={14}
          />
          <Button
            action={() =>
              onSelect({
                title: trimmed,
                genre: customGenre.trim() || i18n.addShowDefaultGenre,
                color: nextColor(Date.now())
              })
            }
            buttonStyle="plain"
          >
            <HStack
              padding={{ horizontal: 14, vertical: 10 }}
              background={{
                style: {
                  colors: [theme.brandStart, theme.brandEnd],
                  startPoint: 'topLeading',
                  endPoint: 'bottomTrailing'
                },
                shape: { type: 'rect', cornerRadius: 10 }
              }}
            >
              <Text
                font={13}
                fontWeight="semibold"
                foregroundStyle="white"
              >
                {i18n.addShowContinue}
              </Text>
              <Spacer />
              <Image
                systemName="arrow.right"
                font={12} fontWeight="semibold"
                foregroundStyle="white"
              />
            </HStack>
          </Button>
        </VStack>
      ) : null}

      <HStack spacing={8} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
        <Text
          font={12}
          fontWeight="medium"
          foregroundStyle={theme.textQuaternary}
        >
          {trimmed.length === 0
            ? i18n.addShowSearchHint
            : loading
              ? i18n.addShowSearching
              : error
                ? i18n.addShowSearchFailed
                : i18n.addShowResults(results.length)}
        </Text>
        <Spacer />
        {loading ? <ProgressView progressViewStyle="circular" /> : null}
      </HStack>

      {error ? (
        <Text
          font={12}
          foregroundStyle={theme.textTertiary}
          frame={{ maxWidth: 'infinity', alignment: 'leading' }}
        >
          {error}
        </Text>
      ) : null}

      <VStack spacing={8} frame={{ maxWidth: 'infinity', alignment: 'top' }}>
        {results.map((item) => {
          const color = colorFromId(item.id)
          return (
            <ResultRow
              key={item.id}
              item={item}
              color={color}
              onTap={() =>
                onSelect({
                  title: item.title,
                  genre: item.genre,
                  color,
                  coverUrl: item.coverUrl || undefined
                })
              }
            />
          )
        })}
      </VStack>
    </VStack>
  )
}

function ModeToggle({
  mode,
  setMode
}: {
  mode: UpdateMode
  setMode: (m: UpdateMode) => void
}) {
  return (
    <Picker
      title={i18n.addShowModeTitle}
      value={mode}
      onChanged={(v) => setMode(v as UpdateMode)}
      pickerStyle="segmented"
      tint={theme.brandEnd}
    >
      <Text tag="weekly">{i18n.addShowWeekly}</Text>
      <Text tag="daily">{i18n.addShowDaily}</Text>
    </Picker>
  )
}

function DayPicker({
  selected,
  toggle
}: {
  selected: number[]
  toggle: (d: number) => void
}) {
  return (
    <HStack spacing={0} frame={{ maxWidth: 'infinity' }}>
      {i18n.daysShort.flatMap((label, di) => {
        const sel = selected.includes(di)
        const btn = (
          <Button key={di} action={() => toggle(di)} buttonStyle="plain">
            <Text
              font={13}
              fontWeight={sel ? 'bold' : 'regular'}
              foregroundStyle={sel ? ('white' as Color) : theme.text50}
              frame={{ width: 36, height: 36 }}
              background={
                sel
                  ? {
                      style: {
                        colors: [theme.brandStart, theme.brandEnd],
                        startPoint: 'topLeading',
                        endPoint: 'bottomTrailing'
                      },
                      shape: { type: 'rect', cornerRadius: 10 }
                    }
                  : {
                      style: theme.card,
                      shape: { type: 'rect', cornerRadius: 10 }
                    }
              }
              overlay={
                sel ? undefined : (
                  <RoundedRectangle
                    cornerRadius={10}
                    stroke={{
                      shapeStyle: theme.divider,
                      strokeStyle: { lineWidth: 1 }
                    }}
                  />
                )
              }
            >
              {label}
            </Text>
          </Button>
        )
        return di === 0 ? [btn] : [<Spacer key={`s${di}`} />, btn]
      })}
    </HStack>
  )
}

function TimePicker({
  value,
  onChanged
}: {
  value: number
  onChanged: (v: number) => void
}) {
  return (
    <DatePicker
      title={i18n.addShowUpdateTimeTitle}
      value={value}
      onChanged={onChanged}
      displayedComponents={['hourAndMinute']}
      datePickerStyle="compact"
      tint={theme.brandEnd}
      labelsHidden
    />
  )
}

function EpisodeStepper({
  value,
  onChange
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <HStack spacing={6} alignment="center">
      <Button
        action={() => onChange(Math.max(1, value - 1))}
        buttonStyle="plain"
      >
        <Image
          systemName="minus"
          font={12} fontWeight="semibold"
          foregroundStyle="white"
          frame={{ width: 28, height: 38 }}
          background={{
            style: theme.surfaceAlt,
            shape: { type: 'rect', cornerRadius: 8 }
          }}
        />
      </Button>
      <Text
        font={16}
        fontWeight="bold"
        foregroundStyle={theme.text}
        frame={{ width: 24, alignment: 'center' }}
        multilineTextAlignment="center"
      >
        {value}
      </Text>
      <Button
        action={() => onChange(Math.min(10, value + 1))}
        buttonStyle="plain"
      >
        <Image
          systemName="plus"
          font={12} fontWeight="semibold"
          foregroundStyle="white"
          frame={{ width: 28, height: 38 }}
          background={{
            style: theme.surfaceAlt,
            shape: { type: 'rect', cornerRadius: 8 }
          }}
        />
      </Button>
    </HStack>
  )
}

function ScheduleStep({
  selected,
  mode,
  setMode,
  weeklyDays,
  toggleWeekly,
  weeklyTime,
  setWeeklyTime,
  weeklyEps,
  setWeeklyEps,
  dailyTime,
  setDailyTime,
  dailyEps,
  setDailyEps,
  playUrl,
  setPlayUrl,
  onConfirm
}: {
  selected: Candidate
  mode: UpdateMode
  setMode: (m: UpdateMode) => void
  weeklyDays: number[]
  toggleWeekly: (d: number) => void
  weeklyTime: number
  setWeeklyTime: (s: number) => void
  weeklyEps: number
  setWeeklyEps: (n: number) => void
  dailyTime: number
  setDailyTime: (s: number) => void
  dailyEps: number
  setDailyEps: (n: number) => void
  playUrl: string
  setPlayUrl: (s: string) => void
  onConfirm: () => void
}) {
  const weeklyHint =
    weeklyDays
      .slice()
      .sort((a, b) => a - b)
      .map((d) => i18n.daysFull[d])
      .join(i18n.daysJoiner) || i18n.addShowNoDays

  return (
    <VStack
      spacing={20}
      padding={{ horizontal: 20, bottom: 20 }}
      frame={{ maxWidth: 'infinity', alignment: 'top' }}
    >
      <ShowPreviewCard show={selected} />

      <ModeToggle mode={mode} setMode={setMode} />

      <VStack frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
        <VStack
          spacing={14}
          padding={14}
          background={{
            style: theme.card,
            shape: { type: 'rect', cornerRadius: 14 }
          }}
          overlay={
            <RoundedRectangle
              cornerRadius={14}
              stroke={{
                shapeStyle: theme.divider,
                strokeStyle: { lineWidth: 1 }
              }}
            />
          }
        >
          {mode === 'weekly' ? (
            <>
              <VStack alignment="leading" spacing={8}>
                <Text
                  font={12}
                  foregroundStyle={theme.text35}
                >
                  {i18n.addShowUpdateDays}
                </Text>
                <DayPicker selected={weeklyDays} toggle={toggleWeekly} />
              </VStack>
              <HStack spacing={10} frame={{ maxWidth: 'infinity' }}>
                <VStack alignment="leading" spacing={6} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                  <Text
                    font={12}
                    foregroundStyle={theme.text35}
                  >
                    {i18n.addShowUpdateTime}
                  </Text>
                  <TimePicker value={weeklyTime} onChanged={setWeeklyTime} />
                </VStack>
                <VStack alignment="leading" spacing={6}>
                  <Text
                    font={12}
                    foregroundStyle={theme.text35}
                  >
                    {i18n.addShowUpdateEps}
                  </Text>
                  <EpisodeStepper value={weeklyEps} onChange={setWeeklyEps} />
                </VStack>
              </HStack>
              <Text
                font={12}
                foregroundStyle={theme.textQuaternary}
              >
                {i18n.addShowWeeklyHint(weeklyHint, tsToHHMM(weeklyTime), weeklyEps)}
              </Text>
            </>
          ) : (
            <>
              <HStack spacing={10} frame={{ maxWidth: 'infinity' }}>
                <VStack alignment="leading" spacing={6} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                  <Text
                    font={12}
                    foregroundStyle={theme.text35}
                  >
                    {i18n.addShowDailyTime}
                  </Text>
                  <TimePicker value={dailyTime} onChanged={setDailyTime} />
                </VStack>
                <VStack alignment="leading" spacing={6}>
                  <Text
                    font={12}
                    foregroundStyle={theme.text35}
                  >
                    {i18n.addShowDailyEps}
                  </Text>
                  <EpisodeStepper value={dailyEps} onChange={setDailyEps} />
                </VStack>
              </HStack>
              <Text
                font={12}
                foregroundStyle={theme.textQuaternary}
              >
                {i18n.addShowDailyHint(tsToHHMM(dailyTime), dailyEps)}
              </Text>
            </>
          )}
        </VStack>
      </VStack>

      <VStack
        alignment="leading"
        spacing={8}
        frame={{ maxWidth: 'infinity', alignment: 'leading' }}
      >
        <Text
          font={12}
          foregroundStyle={theme.text35}
        >
          {i18n.addShowPlayUrl}
        </Text>
        <TextField
          title=""
          prompt={i18n.addShowPlayUrlPrompt}
          value={playUrl}
          onChanged={setPlayUrl}
          textFieldStyle="roundedBorder"
          keyboardType="URL"
          textInputAutocapitalization="never"
          autocorrectionDisabled
          foregroundStyle={theme.text}
          font={14}
        />
      </VStack>

      <VStack
        padding={{ top: 12 }}
        frame={{ maxWidth: 'infinity' }}
      >
        <PrimaryButton title={i18n.add} action={onConfirm} height={52} />
      </VStack>
    </VStack>
  )
}

export function AddShowView({
  onClose,
  onAdd
}: {
  onClose: () => void
  onAdd: (show: Show) => void
}) {
  const [step, setStep] = useState<'search' | 'schedule'>('search')
  const [query, setQuery] = useState('')
  const [customGenre, setCustomGenre] = useState('')
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [mode, setMode] = useState<UpdateMode>('weekly')
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1])
  const [weeklyTime, setWeeklyTime] = useState(() => defaultTimeAt('20:00'))
  const [weeklyEps, setWeeklyEps] = useState(1)
  const [dailyTime, setDailyTime] = useState(() => defaultTimeAt('20:00'))
  const [dailyEps, setDailyEps] = useState(1)
  const [playUrl, setPlayUrl] = useState('')

  const [results, setResults] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length === 0) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const handle = setTimeout(() => {
      searchShows(trimmed, { count: 20 })
        .then((items) => {
          if (cancelled) return
          setResults(items)
          setLoading(false)
        })
        .catch((e: unknown) => {
          if (cancelled) return
          setResults([])
          setLoading(false)
          setError(e instanceof Error ? e.message : i18n.addShowNetworkError)
        })
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query])

  const toggleWeekly = (d: number) => {
    if (weeklyDays.includes(d)) {
      if (weeklyDays.length > 1) {
        setWeeklyDays(weeklyDays.filter((x) => x !== d))
      }
    } else {
      setWeeklyDays([...weeklyDays, d].sort((a, b) => a - b))
    }
  }

  const handleSelect = (c: Candidate) => {
    setSelected(c)
    setStep('schedule')
  }

  const handleConfirm = () => {
    if (!selected) return
    const schedules =
      mode === 'daily'
        ? Array.from({ length: 7 }, (_, d) => ({
            day: d,
            time: tsToHHMM(dailyTime),
            episodes: dailyEps
          }))
        : weeklyDays.map((d) => ({
            day: d,
            time: tsToHHMM(weeklyTime),
            episodes: weeklyEps
          }))
    const trimmedPlayUrl = playUrl.trim()
    onAdd({
      id: Date.now(),
      title: selected.title,
      genre: selected.genre,
      color: selected.color,
      coverUrl: selected.coverUrl,
      playUrl: trimmedPlayUrl.length > 0 ? trimmedPlayUrl : undefined,
      schedules,
      totalEps: 0,
      watchedEps: 0
    })
    onClose()
  }

  return (
    <NavigationStack>
      {step === 'search' ? (
        <VStack
          spacing={0}
          frame={{ maxWidth: 'infinity', maxHeight: 'infinity', alignment: 'top' }}
          background={theme.bg}
          navigationBarTitleDisplayMode="inline"
          searchable={{
            value: query,
            onChanged: setQuery,
            prompt: i18n.addShowSearchPrompt,
            placement: 'navigationBarDrawerAutomaticDisplay'
          }}
        >
          <ScrollView>
            <SearchStep
              query={query}
              results={results}
              loading={loading}
              error={error}
              onSelect={handleSelect}
              customGenre={customGenre}
              setCustomGenre={setCustomGenre}
            />
          </ScrollView>
        </VStack>
      ) : selected ? (
        <VStack
          spacing={0}
          frame={{ maxWidth: 'infinity', maxHeight: 'infinity', alignment: 'top' }}
          background={theme.bg}
          navigationTitle={i18n.addShowScheduleTitle}
          navigationBarTitleDisplayMode="inline"
          toolbar={{
            topBarLeading: (
              <Button action={() => setStep('search')} buttonStyle="plain">
                <Image
                  systemName="chevron.left"
                  font={17}
                  fontWeight="semibold"
                  foregroundStyle={theme.brandEnd}
                />
              </Button>
            )
          }}
        >
          <ScrollView>
            <ScheduleStep
              selected={selected}
              mode={mode}
              setMode={setMode}
              weeklyDays={weeklyDays}
              toggleWeekly={toggleWeekly}
              weeklyTime={weeklyTime}
              setWeeklyTime={setWeeklyTime}
              weeklyEps={weeklyEps}
              setWeeklyEps={setWeeklyEps}
              dailyTime={dailyTime}
              setDailyTime={setDailyTime}
              dailyEps={dailyEps}
              setDailyEps={setDailyEps}
              playUrl={playUrl}
              setPlayUrl={setPlayUrl}
              onConfirm={handleConfirm}
            />
          </ScrollView>
        </VStack>
      ) : null}
    </NavigationStack>
  )
}
