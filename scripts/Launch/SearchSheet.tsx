import {
  Button,
  Divider,
  HStack,
  Image,
  NavigationStack,
  ProgressView,
  ScrollView,
  Text,
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

const TINT_BLUE = '#0A84FF'
const TINT_BLUE_BG = 'rgba(10,132,255,0.12)'
const SECONDARY = 'rgba(60,60,67,0.6)'
const ERROR_BG = 'rgba(255,59,48,0.10)'
const ERROR_RED = '#FF3B30'

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
  const [searchPresented, setSearchPresented] = useState(false)
  const reqIdRef = useRef(0)

  useEffect(() => {
    const handle = setTimeout(() => setSearchPresented(true), 50)
    return () => clearTimeout(handle)
  }, [])

  const runSearch = (q: string) => {
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
    )}&entity=software&country=us&limit=10`
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
    const handle = setTimeout(() => runSearch(trimmed), 350)
    return () => clearTimeout(handle)
  }, [query])

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
        searchable={{
          value: query,
          onChanged: setQuery,
          prompt: 'App name',
          placement: 'navigationBarDrawerAlwaysDisplay',
          presented: {
            value: searchPresented,
            onChanged: setSearchPresented
          }
        }}
      >
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
            <SheetError onRetry={() => runSearch(query)} />
          ) : null}
        </ScrollView>
      </VStack>
    </NavigationStack>
  )
}
