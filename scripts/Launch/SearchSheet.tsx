import {
  Button,
  Divider,
  HStack,
  Image,
  Navigation,
  NavigationLink,
  NavigationStack,
  ProgressView,
  ScrollView,
  Text,
  TextField,
  VStack,
  ZStack,
  useEffect,
  useRef,
  useState
} from 'scripting'
import type { Color } from 'scripting'

export interface ITunesApp {
  trackId: number
  trackName: string
  artistName: string
  bundleId: string
  artworkUrl60?: string
  artworkUrl100?: string
  artworkUrl512?: string
}

type SearchState = 'empty' | 'loading' | 'results' | 'noresults' | 'error'

interface Region {
  code: string
  name: string
  flag: string
}

const TINT_BLUE = '#0A84FF'
const TINT_BLUE_BG = 'rgba(10,132,255,0.12)'
const SECONDARY = 'rgba(60,60,67,0.6)'
const TERTIARY = 'rgba(60,60,67,0.3)'
const PILL_BG = 'rgba(118,118,128,0.12)'
const ERROR_BG = 'rgba(255,59,48,0.10)'
const ERROR_RED = '#FF3B30'

const REGIONS: Region[] = [
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'cn', name: 'China', flag: '🇨🇳' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦' },
  { code: 'au', name: 'Australia', flag: '🇦🇺' },
  { code: 'in', name: 'India', flag: '🇮🇳' },
  { code: 'hk', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'tw', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'sg', name: 'Singapore', flag: '🇸🇬' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷' }
]

const DEFAULT_REGION = 'us'
const REGION_STORAGE_KEY = 'launch_search_region'

function regionFor(code: string): Region {
  return REGIONS.find((r) => r.code === code) || REGIONS[0]
}

function pickArtwork(app: ITunesApp): string | undefined {
  return app.artworkUrl100 || app.artworkUrl60
}

function ResultRow({
  app,
  onSelect
}: {
  app: ITunesApp
  onSelect: () => void
}) {
  const artwork = pickArtwork(app)
  return (
    <Button action={onSelect} buttonStyle="plain">
      <HStack
        spacing={12}
        padding={{ horizontal: 16, vertical: 12 }}
        frame={{ maxWidth: 'infinity', alignment: 'leading' }}
      >
        {artwork ? (
          <Image
            imageUrl={artwork}
            resizable
            scaleToFill
            frame={{ width: 48, height: 48 }}
            clipShape={{ type: 'rect', cornerRadius: 11 }}
          />
        ) : (
          <ZStack
            frame={{ width: 48, height: 48 }}
            background={{
              style: 'rgba(60,60,67,0.08)' as Color,
              shape: { type: 'rect', cornerRadius: 11 }
            }}
          >
            <Image
              systemName="app"
              font={22}
              foregroundStyle={SECONDARY as Color}
            />
          </ZStack>
        )}
        <VStack
          alignment="leading"
          spacing={2}
          frame={{ maxWidth: 'infinity', alignment: 'leading' }}
        >
          <Text
            font={17}
            fontWeight="medium"
            foregroundStyle={'label' as Color}
            lineLimit={1}
            truncationMode="tail"
          >
            {app.trackName}
          </Text>
          <Text
            font={13}
            foregroundStyle={SECONDARY as Color}
            lineLimit={1}
            truncationMode="tail"
          >
            {app.artistName}
          </Text>
        </VStack>
      </HStack>
    </Button>
  )
}

function SheetEmpty() {
  return (
    <VStack
      spacing={4}
      padding={{ horizontal: 24, vertical: 64 }}
      frame={{ maxWidth: 'infinity', alignment: 'center' }}
    >
      <ZStack
        frame={{ width: 56, height: 56 }}
        background={{
          style: TINT_BLUE_BG as Color,
          shape: { type: 'rect', cornerRadius: 14 }
        }}
      >
        <Image
          systemName="magnifyingglass"
          font={26}
          fontWeight="semibold"
          foregroundStyle={TINT_BLUE as Color}
        />
      </ZStack>
      <Text
        font={17}
        fontWeight="semibold"
        foregroundStyle={'label' as Color}
        padding={{ top: 10 }}
      >
        Find an app
      </Text>
      <Text
        font={15}
        foregroundStyle={SECONDARY as Color}
        multilineTextAlignment="center"
        frame={{ maxWidth: 280 }}
      >
        Search to auto-fill the icon and name from the App Store.
      </Text>
    </VStack>
  )
}

function SheetLoading() {
  return (
    <VStack
      spacing={12}
      padding={{ horizontal: 24, vertical: 64 }}
      frame={{ maxWidth: 'infinity', alignment: 'center' }}
    >
      <ProgressView progressViewStyle="circular" />
      <Text font={13} foregroundStyle={SECONDARY as Color}>
        Searching App Store…
      </Text>
    </VStack>
  )
}

function SheetResults({
  results,
  onSelect
}: {
  results: ITunesApp[]
  onSelect: (app: ITunesApp) => void
}) {
  return (
    <VStack
      spacing={0}
      padding={{ horizontal: 16, top: 12, bottom: 24 }}
      frame={{ maxWidth: 'infinity', alignment: 'leading' }}
    >
      <VStack
        spacing={0}
        background={{
          style: 'systemBackground' as Color,
          shape: { type: 'rect', cornerRadius: 14 }
        }}
        clipShape={{ type: 'rect', cornerRadius: 14 }}
        frame={{ maxWidth: 'infinity', alignment: 'leading' }}
      >
        {results.map((app, i) => (
          <VStack key={app.trackId} spacing={0}>
            <ResultRow app={app} onSelect={() => onSelect(app)} />
            {i < results.length - 1 ? (
              <Divider padding={{ leading: 76 }} />
            ) : null}
          </VStack>
        ))}
      </VStack>
    </VStack>
  )
}

function SheetNoResults({
  query,
  onUseManual
}: {
  query: string
  onUseManual: () => void
}) {
  return (
    <VStack
      spacing={6}
      padding={{ horizontal: 32, vertical: 48 }}
      frame={{ maxWidth: 'infinity', alignment: 'center' }}
    >
      <ZStack
        frame={{ width: 56, height: 56 }}
        background={{
          style: 'rgba(60,60,67,0.08)' as Color,
          shape: { type: 'rect', cornerRadius: 14 }
        }}
      >
        <Image
          systemName="magnifyingglass"
          font={26}
          fontWeight="semibold"
          foregroundStyle={SECONDARY as Color}
        />
      </ZStack>
      <Text
        font={17}
        fontWeight="semibold"
        foregroundStyle={'label' as Color}
        padding={{ top: 8 }}
      >
        No Results
      </Text>
      <Text
        font={15}
        foregroundStyle={SECONDARY as Color}
        multilineTextAlignment="center"
      >
        {`No apps matched "${query}". Try a different name, or enter your own icon URL.`}
      </Text>
      <Button action={onUseManual} buttonStyle="plain">
        <Text
          font={15}
          fontWeight="medium"
          foregroundStyle={TINT_BLUE as Color}
          padding={{ horizontal: 18, vertical: 10 }}
          background={{
            style: TINT_BLUE_BG as Color,
            shape: 'capsule'
          }}
        >
          Enter manually
        </Text>
      </Button>
    </VStack>
  )
}

function SheetError({ onRetry }: { onRetry: () => void }) {
  return (
    <VStack
      spacing={6}
      padding={{ horizontal: 32, vertical: 48 }}
      frame={{ maxWidth: 'infinity', alignment: 'center' }}
    >
      <ZStack
        frame={{ width: 56, height: 56 }}
        background={{
          style: ERROR_BG as Color,
          shape: { type: 'rect', cornerRadius: 14 }
        }}
      >
        <Image
          systemName="wifi.slash"
          font={26}
          fontWeight="semibold"
          foregroundStyle={ERROR_RED as Color}
        />
      </ZStack>
      <Text
        font={17}
        fontWeight="semibold"
        foregroundStyle={'label' as Color}
        padding={{ top: 8 }}
      >
        Couldn't reach App Store
      </Text>
      <Text
        font={15}
        foregroundStyle={SECONDARY as Color}
        multilineTextAlignment="center"
      >
        Check your connection and try again.
      </Text>
      <Button action={onRetry} buttonStyle="plain">
        <Text
          font={15}
          fontWeight="medium"
          foregroundStyle="white"
          padding={{ horizontal: 22, vertical: 10 }}
          background={{
            style: TINT_BLUE as Color,
            shape: 'capsule'
          }}
        >
          Retry
        </Text>
      </Button>
    </VStack>
  )
}

function RegionPill({ region }: { region: Region }) {
  return (
    <HStack
      spacing={4}
      padding={{ leading: 10, trailing: 10, vertical: 8 }}
      background={{
        style: PILL_BG as Color,
        shape: 'capsule'
      }}
    >
      <Text font={15}>{region.flag}</Text>
      <Text
        font={13}
        fontWeight="semibold"
        foregroundStyle={'label' as Color}
      >
        {region.code.toUpperCase()}
      </Text>
      <Image
        systemName="chevron.up.chevron.down"
        font={10}
        fontWeight="semibold"
        foregroundStyle={SECONDARY as Color}
      />
    </HStack>
  )
}

function RegionPicker({
  selected,
  onSelect
}: {
  selected: string
  onSelect: (code: string) => void
}) {
  const dismiss = Navigation.useDismiss()
  return (
    <ScrollView frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
      <VStack
        spacing={0}
        alignment="leading"
        padding={{ horizontal: 16, top: 12, bottom: 24 }}
        frame={{ maxWidth: 'infinity', alignment: 'leading' }}
      >
        <Text
          font={13}
          foregroundStyle={SECONDARY as Color}
          padding={{ horizontal: 16, bottom: 8 }}
        >
          APP STORE STOREFRONT
        </Text>
        <VStack
          spacing={0}
          background={{
            style: 'systemBackground' as Color,
            shape: { type: 'rect', cornerRadius: 14 }
          }}
          clipShape={{ type: 'rect', cornerRadius: 14 }}
          frame={{ maxWidth: 'infinity', alignment: 'leading' }}
        >
          {REGIONS.map((r, i) => (
            <VStack key={r.code} spacing={0}>
              <Button
                action={() => {
                  onSelect(r.code)
                  dismiss()
                }}
                buttonStyle="plain"
              >
                <HStack
                  spacing={12}
                  padding={{ horizontal: 16, vertical: 11 }}
                  frame={{ maxWidth: 'infinity', alignment: 'leading' }}
                  contentShape="rect"
                >
                  <Text font={22}>{r.flag}</Text>
                  <Text
                    font={17}
                    foregroundStyle={'label' as Color}
                    frame={{ maxWidth: 'infinity', alignment: 'leading' }}
                  >
                    {r.name}
                  </Text>
                  <Text font={13} foregroundStyle={TERTIARY as Color}>
                    {r.code.toUpperCase()}
                  </Text>
                  {r.code === selected ? (
                    <Image
                      systemName="checkmark"
                      font={16}
                      fontWeight="semibold"
                      foregroundStyle={TINT_BLUE as Color}
                    />
                  ) : null}
                </HStack>
              </Button>
              {i < REGIONS.length - 1 ? (
                <Divider padding={{ leading: 50 }} />
              ) : null}
            </VStack>
          ))}
        </VStack>
        <Text
          font={13}
          foregroundStyle={SECONDARY as Color}
          padding={{ horizontal: 16, top: 8 }}
        >
          Results come from the selected country's App Store. Switch regions to
          find apps that aren't published in your storefront.
        </Text>
      </VStack>
    </ScrollView>
  )
}

export function SearchSheet({
  initialQuery,
  onClose,
  onSelect
}: {
  initialQuery: string
  onClose: () => void
  onSelect: (app: ITunesApp) => void
}) {
  const [query, setQuery] = useState(initialQuery)
  const [state, setState] = useState<SearchState>(
    initialQuery.trim() ? 'loading' : 'empty'
  )
  const [results, setResults] = useState<ITunesApp[]>([])
  const [region, setRegion] = useState<string>(() => {
    try {
      return Storage.get<string>(REGION_STORAGE_KEY) || DEFAULT_REGION
    } catch {
      return DEFAULT_REGION
    }
  })
  const reqIdRef = useRef(0)

  const runSearch = (q: string, countryCode: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setState('empty')
      setResults([])
      return
    }
    setState('loading')
    const reqId = ++reqIdRef.current
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      trimmed
    )}&entity=software&country=${countryCode}&limit=10`
    fetch(url)
      .then((r) => r.json())
      .then((data: { resultCount: number; results: ITunesApp[] }) => {
        if (reqId !== reqIdRef.current) return
        const list = Array.isArray(data?.results) ? data.results : []
        if (list.length === 0) {
          setResults([])
          setState('noresults')
        } else {
          setResults(list)
          setState('results')
        }
      })
      .catch((e: unknown) => {
        if (reqId !== reqIdRef.current) return
        console.error('iTunes search failed', e)
        setState('error')
      })
  }

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setState('empty')
      setResults([])
      return
    }
    const handle = setTimeout(() => runSearch(trimmed, region), 350)
    return () => clearTimeout(handle)
  }, [query, region])

  const handleRegionChange = (code: string) => {
    setRegion(code)
    try {
      Storage.set(REGION_STORAGE_KEY, code)
    } catch (e) {
      console.error('Failed to save region', e)
    }
  }

  const current = regionFor(region)

  return (
    <NavigationStack>
      <VStack
        spacing={0}
        frame={{ maxWidth: 'infinity', maxHeight: 'infinity', alignment: 'top' }}
        navigationTitle="Search App Store"
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          confirmationAction: [
            <Button title="Cancel" action={onClose} />
          ]
        }}
      >
        <HStack
          spacing={8}
          padding={{ horizontal: 16, top: 10, bottom: 8 }}
          frame={{ maxWidth: 'infinity', alignment: 'center' }}
        >
          <NavigationLink
            destination={
              <RegionPicker selected={region} onSelect={handleRegionChange} />
            }
          >
            <HStack padding={{ vertical: 4 }} contentShape="rect">
              <RegionPill region={current} />
            </HStack>
          </NavigationLink>
          <HStack
            spacing={6}
            padding={{ horizontal: 8, vertical: 7 }}
            background={{
              style: PILL_BG as Color,
              shape: { type: 'rect', cornerRadius: 10 }
            }}
            frame={{ maxWidth: 'infinity', alignment: 'leading' }}
          >
            <Image
              systemName="magnifyingglass"
              font={15}
              foregroundStyle={SECONDARY as Color}
            />
            <TextField
              title=""
              prompt="App name"
              value={query}
              onChanged={setQuery}
              textFieldStyle="plain"
              autofocus
            />
            {query ? (
              <Button action={() => setQuery('')} buttonStyle="plain">
                <Image
                  systemName="xmark.circle.fill"
                  font={16}
                  foregroundStyle={'rgba(60,60,67,0.4)' as Color}
                />
              </Button>
            ) : null}
          </HStack>
        </HStack>
        <ScrollView>
          {state === 'empty' ? <SheetEmpty /> : null}
          {state === 'loading' ? <SheetLoading /> : null}
          {state === 'results' ? (
            <SheetResults results={results} onSelect={onSelect} />
          ) : null}
          {state === 'noresults' ? (
            <SheetNoResults query={query} onUseManual={onClose} />
          ) : null}
          {state === 'error' ? (
            <SheetError onRetry={() => runSearch(query, region)} />
          ) : null}
        </ScrollView>
      </VStack>
    </NavigationStack>
  )
}
