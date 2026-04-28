import {
  Button,
  HStack,
  Image,
  Picker,
  RoundedRectangle,
  ScrollView,
  Spacer,
  Text,
  TextField,
  VStack,
  useState,
  useMemo
} from 'scripting'
import type { Color } from 'scripting'
import type { Show } from '../types'
import {
  DAYS_CN,
  SEARCH_POOL,
  TIME_OPTIONS,
  nextColor
} from '../data'
import { theme } from '../theme'
import { GenrePill, Poster, PrimaryButton, SectionLabel, ShowPreviewCard } from '../components'

type Candidate = { title: string; genre: string; color: string }
type UpdateMode = 'weekly' | 'daily'

function NavBar({
  title,
  onBack
}: {
  title: string
  onBack: () => void
}) {
  return (
    <HStack
      spacing={12}
      padding={{ horizontal: 16, top: 8, bottom: 16 }}
      frame={{ maxWidth: 'infinity', alignment: 'leading' }}
    >
      <Button action={onBack} buttonStyle="plain">
        <Image
          systemName="chevron.left"
          font={18} fontWeight="semibold"
          foregroundStyle={theme.textSecondary}
          frame={{ width: 28, height: 28 }}
        />
      </Button>
      <Text
        font={17}
        fontWeight="semibold"
        foregroundStyle={theme.text}
      >
        {title}
      </Text>
      <Spacer />
    </HStack>
  )
}

function SearchBar({
  query,
  setQuery
}: {
  query: string
  setQuery: (s: string) => void
}) {
  return (
    <HStack
      spacing={10}
      padding={{ horizontal: 16, vertical: 12 }}
      background={{
        style: theme.surfaceAlt2,
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
      <Image
        systemName="magnifyingglass"
        font={14}
        foregroundStyle={theme.text35}
      />
      <TextField
        title=""
        prompt="搜索影视名称…"
        value={query}
        onChanged={setQuery}
        textFieldStyle="plain"
        foregroundStyle={theme.text}
        font={15}
        frame={{ maxWidth: 'infinity' }}
      />
      {query.length > 0 ? (
        <Button action={() => setQuery('')} buttonStyle="plain">
          <Image
            systemName="xmark.circle.fill"
            font={14}
            foregroundStyle={theme.textTertiary}
          />
        </Button>
      ) : null}
    </HStack>
  )
}

function ResultRow({
  show,
  onTap
}: {
  show: Candidate
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
        <Poster show={show} size={42} />
        <VStack alignment="leading" spacing={4}>
          <Text
            font={15}
            fontWeight="semibold"
            foregroundStyle={theme.text}
            lineLimit={1}
          >
            {show.title}
          </Text>
          <GenrePill genre={show.genre} color={show.color} />
        </VStack>
        <Spacer />
        <Image
          systemName="chevron.right"
          font={12} fontWeight="semibold"
          foregroundStyle={theme.textDisabled}
        />
      </HStack>
    </Button>
  )
}

function SearchStep({
  query,
  setQuery,
  results,
  onSelect,
  customGenre,
  setCustomGenre
}: {
  query: string
  setQuery: (s: string) => void
  results: Candidate[]
  onSelect: (c: Candidate) => void
  customGenre: string
  setCustomGenre: (s: string) => void
}) {
  const trimmed = query.trim()
  const hasExact = SEARCH_POOL.some((s) => s.title === trimmed)
  const showCustom = trimmed.length > 0 && !hasExact

  return (
    <VStack
      spacing={14}
      padding={{ horizontal: 20, top: 36 }}
      frame={{ maxWidth: 'infinity', alignment: 'top' }}
    >
      <SearchBar query={query} setQuery={setQuery} />

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
            找不到？添加 “{trimmed}” 为新剧
          </Text>
          <TextField
            title=""
            prompt="类型，例如：古装剧"
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
                genre: customGenre.trim() || '剧集',
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
                继续设置更新时间
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

      <Text
        font={12}
        fontWeight="medium"
        foregroundStyle={theme.textQuaternary}
        frame={{ maxWidth: 'infinity', alignment: 'leading' }}
      >
        {query.length > 0 ? '搜索结果' : '热门推荐'}
      </Text>

      <VStack spacing={8} frame={{ maxWidth: 'infinity', alignment: 'top' }}>
        {results.map((show, i) => (
          <ResultRow
            key={`${show.title}-${i}`}
            show={show}
            onTap={() => onSelect(show)}
          />
        ))}
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
  const opts: Array<{ id: UpdateMode; label: string }> = [
    { id: 'weekly', label: '每周更新' },
    { id: 'daily', label: '每日更新' }
  ]
  return (
    <HStack
      spacing={3}
      padding={3}
      background={{
        style: theme.surfaceAlt2,
        shape: { type: 'rect', cornerRadius: 12 }
      }}
    >
      {opts.map((opt) => {
        const active = mode === opt.id
        return (
          <Button key={opt.id} action={() => setMode(opt.id)} buttonStyle="plain">
            <HStack
              alignment="center"
              padding={{ vertical: 9 }}
              frame={{ maxWidth: 'infinity', height: 38 }}
              background={
                active
                  ? {
                      style: {
                        colors: [theme.brandStart, theme.brandEnd],
                        startPoint: 'topLeading',
                        endPoint: 'bottomTrailing'
                      },
                      shape: { type: 'rect', cornerRadius: 10 }
                    }
                  : undefined
              }
            >
              <Text
                font={14}
                fontWeight={active ? 'semibold' : 'regular'}
                foregroundStyle={active ? ('white' as Color) : theme.textTertiary}
              >
                {opt.label}
              </Text>
            </HStack>
          </Button>
        )
      })}
    </HStack>
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
    <HStack spacing={6} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      {DAYS_CN.map((label, di) => {
        const sel = selected.includes(di)
        return (
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
      })}
    </HStack>
  )
}

function TimePicker({
  value,
  onChanged
}: {
  value: string
  onChanged: (v: string) => void
}) {
  return (
    <Picker
      title="更新时间"
      value={value}
      onChanged={onChanged}
      pickerStyle="menu"
      tint={theme.brandEnd}
    >
      {TIME_OPTIONS.map((t) => (
        <Text key={t} tag={t}>
          {t}
        </Text>
      ))}
    </Picker>
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
  onConfirm
}: {
  selected: Candidate
  mode: UpdateMode
  setMode: (m: UpdateMode) => void
  weeklyDays: number[]
  toggleWeekly: (d: number) => void
  weeklyTime: string
  setWeeklyTime: (s: string) => void
  weeklyEps: number
  setWeeklyEps: (n: number) => void
  dailyTime: string
  setDailyTime: (s: string) => void
  dailyEps: number
  setDailyEps: (n: number) => void
  onConfirm: () => void
}) {
  const weeklyHint =
    weeklyDays
      .slice()
      .sort((a, b) => a - b)
      .map((d) => `周${DAYS_CN[d]}`)
      .join('、') || '尚未选择'

  return (
    <VStack
      spacing={20}
      padding={{ horizontal: 20, bottom: 20 }}
      frame={{ maxWidth: 'infinity', alignment: 'top' }}
    >
      <ShowPreviewCard show={selected} />

      <VStack spacing={10} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
        <SectionLabel>更新方式</SectionLabel>
        <ModeToggle mode={mode} setMode={setMode} />
      </VStack>

      <VStack spacing={10} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
        <SectionLabel>更新时间</SectionLabel>
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
                  更新日（可多选）
                </Text>
                <DayPicker selected={weeklyDays} toggle={toggleWeekly} />
              </VStack>
              <HStack spacing={10} frame={{ maxWidth: 'infinity' }}>
                <VStack alignment="leading" spacing={6} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                  <Text
                    font={12}
                    foregroundStyle={theme.text35}
                  >
                    更新时间
                  </Text>
                  <TimePicker value={weeklyTime} onChanged={setWeeklyTime} />
                </VStack>
                <VStack alignment="leading" spacing={6}>
                  <Text
                    font={12}
                    foregroundStyle={theme.text35}
                  >
                    更新集数
                  </Text>
                  <EpisodeStepper value={weeklyEps} onChange={setWeeklyEps} />
                </VStack>
              </HStack>
              <Text
                font={12}
                foregroundStyle={theme.textQuaternary}
              >
                将在每{weeklyHint} {weeklyTime} 更新 {weeklyEps} 集
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
                    每天更新时间
                  </Text>
                  <TimePicker value={dailyTime} onChanged={setDailyTime} />
                </VStack>
                <VStack alignment="leading" spacing={6}>
                  <Text
                    font={12}
                    foregroundStyle={theme.text35}
                  >
                    每天更新集数
                  </Text>
                  <EpisodeStepper value={dailyEps} onChange={setDailyEps} />
                </VStack>
              </HStack>
              <Text
                font={12}
                foregroundStyle={theme.textQuaternary}
              >
                将在每天 {dailyTime} 更新 {dailyEps} 集
              </Text>
            </>
          )}
        </VStack>
      </VStack>

      <PrimaryButton title="添加到追剧日历" action={onConfirm} height={52} />
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
  const [weeklyTime, setWeeklyTime] = useState('20:00')
  const [weeklyEps, setWeeklyEps] = useState(1)
  const [dailyTime, setDailyTime] = useState('20:00')
  const [dailyEps, setDailyEps] = useState(1)

  const results = useMemo(() => {
    const trimmed = query.trim()
    if (trimmed.length > 0) {
      return SEARCH_POOL.filter((s) => s.title.includes(trimmed)).slice(0, 5)
    }
    return SEARCH_POOL.slice(0, 6)
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
            time: dailyTime,
            episodes: dailyEps
          }))
        : weeklyDays.map((d) => ({
            day: d,
            time: weeklyTime,
            episodes: weeklyEps
          }))
    onAdd({
      id: Date.now(),
      title: selected.title,
      genre: selected.genre,
      color: selected.color,
      schedules,
      totalEps: 0,
      watchedEps: 0
    })
    onClose()
  }

  return (
    <VStack
      spacing={0}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity', alignment: 'top' }}
      background={theme.bg}
    >
      {step === 'schedule' && (
        <NavBar title="设置更新时间" onBack={() => setStep('search')} />
      )}
      <ScrollView>
        {step === 'search' && (
          <SearchStep
            query={query}
            setQuery={setQuery}
            results={results}
            onSelect={handleSelect}
            customGenre={customGenre}
            setCustomGenre={setCustomGenre}
          />
        )}
        {step === 'schedule' && selected && (
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
            onConfirm={handleConfirm}
          />
        )}
      </ScrollView>
    </VStack>
  )
}
