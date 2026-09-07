import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationStack,
  ProgressView,
  Section,
  Spacer,
  Text,
  TextField,
  VStack,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { DEFAULT_REGION, regionFor, regionName } from '../regions'
import { lookupApp, searchApps } from '../api/itunes'
import { parseAppId, parseAppRegion } from '../api/appstore'
import { RegionPicker } from '../components/RegionPicker'
import { AppDetail } from './AppDetail'
import type { AppInfo } from '../api/itunes'
import type { Region } from '../regions'

type Results =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ok'; value: AppInfo[] }
  | { state: 'failed'; reason: string }

/**
 * Entry point for FR-ENT-08/10 ahead of the entry editor.
 *
 * One field, two modes. If the text contains an app id — a pasted App Store
 * link in any of its shapes, or the bare number — it goes straight to the
 * comparison; anything else is a name search. The user should not have to know
 * which kind of thing they are holding.
 *
 * The search storefront matters and is therefore explicit: results, names and
 * prices all differ per storefront, and an app missing from one region is
 * exactly the situation this app exists to help with.
 */
export function AppLookup({
  accountRegions,
  mode = 'browse'
}: {
  accountRegions: string[]
  /**
   * `browse` opens the comparison view. `select` resolves the presentation with
   * the chosen `AppInfo`, so the entry editor can reuse this whole screen
   * instead of growing a second, worse app picker.
   */
  mode?: 'browse' | 'select'
}) {
  const dismiss = Navigation.useDismiss()
  const [input, setInput] = useState('')
  const [searchRegion, setSearchRegion] = useState(
    accountRegions[0] ?? DEFAULT_REGION
  )
  const [results, setResults] = useState<Results>({ state: 'idle' })

  const appId = parseAppId(input)
  const term = input.trim()

  const choose = async (app: AppInfo) => {
    dismiss(app)
  }

  const openDetail = async (id: string, preferredRegion?: string) => {
    const regions = Array.from(
      new Set([
        ...(preferredRegion != null ? [preferredRegion] : []),
        ...accountRegions
      ])
    )
    await Navigation.present({
      element: <AppDetail appId={id} initialRegions={regions} />
    })
  }

  const submit = async () => {
    if (appId != null) {
      if (mode === 'select') {
        // Resolve what we can offline; the editor fills in the rest.
        const found = await lookupApp(appId, parseAppRegion(input) ?? searchRegion)
        if (found.ok) {
          await choose(found.value)
        } else {
          setResults({ state: 'failed', reason: found.reason })
        }
        return
      }
      await openDetail(appId, parseAppRegion(input) ?? undefined)
      return
    }
    setResults({ state: 'loading' })
    const found = await searchApps(term, searchRegion)
    setResults(
      found.ok
        ? { state: 'ok', value: found.value }
        : { state: 'failed', reason: found.reason }
    )
  }

  const pickRegion = async () => {
    const picked = await Navigation.present<Region | undefined>({
      element: <RegionPicker selected={searchRegion} />
    })
    if (picked == null || picked.code === searchRegion) return
    setSearchRegion(picked.code)
    // The old results belong to the old storefront; showing them under a new
    // flag would be a lie about where those prices came from.
    setResults({ state: 'idle' })
  }

  const region = regionFor(searchRegion)

  const content = (
    <List
      navigationTitle={mode === 'select' ? i18n.entryAppPick : i18n.appLookup}
      navigationBarTitleDisplayMode="inline"
      toolbar={
        mode === 'select'
          ? { topBarLeading: [<Button title={i18n.cancel} action={() => dismiss()} />] }
          : undefined
      }
    >
      <Section footer={<Text>{i18n.appLookupHint}</Text>}>
        <TextField
          title={i18n.appLookupPrompt}
          labelsHidden
          prompt={i18n.appLookupPrompt}
          value={input}
          onChanged={setInput}
          textInputAutocapitalization="never"
          autocorrectionDisabled={true}
          onSubmit={submit}
        />
        <Button action={pickRegion}>
          <HStack>
            <Text foregroundStyle="label">{i18n.searchStorefront}</Text>
            <Spacer />
            <Text foregroundStyle="secondaryLabel">
              {region.flag} {regionName(region)}
            </Text>
          </HStack>
        </Button>
        <Button
          title={appId != null ? i18n.lookupAction : i18n.searchAction}
          action={submit}
          disabled={term === '' || results.state === 'loading'}
        />
      </Section>

      {results.state === 'loading' ? (
        <Section>
          <HStack>
            <ProgressView />
            <Text foregroundStyle="secondaryLabel">{i18n.searching}</Text>
            <Spacer />
          </HStack>
        </Section>
      ) : null}

      {results.state === 'failed' ? (
        <Section>
          <HStack>
            <Text foregroundStyle="secondaryLabel">
              {i18n.fetchError(results.reason)}
            </Text>
            <Spacer />
            <Button title={i18n.retry} action={submit} />
          </HStack>
        </Section>
      ) : null}

      {results.state === 'ok' ? (
        <Section
          header={
            <HStack>
              <Text>{i18n.searchResults}</Text>
              <Spacer />
              <Text foregroundStyle="secondaryLabel">
                {region.flag} {region.code.toUpperCase()}
              </Text>
            </HStack>
          }
          footer={
            results.value.length > 0 ? (
              <Text>{i18n.searchResultsNote}</Text>
            ) : undefined
          }
        >
          {results.value.length === 0 ? (
            <Text foregroundStyle="secondaryLabel">{i18n.searchEmpty}</Text>
          ) : (
            results.value.map((app) => (
              <Button
                key={app.appId}
                action={() =>
                  mode === 'select' ? choose(app) : openDetail(app.appId, searchRegion)
                }
              >
                <HStack spacing={10}>
                  {app.iconUrl ? (
                    <Image
                      imageUrl={app.iconUrl}
                      resizable
                      frame={{ width: 44, height: 44 }}
                      clipShape={{ type: 'rect', cornerRadius: 10 }}
                      placeholder={<ProgressView />}
                    />
                  ) : (
                    <Image
                      systemName="app.dashed"
                      font={30}
                      foregroundStyle="tertiaryLabel"
                    />
                  )}
                  <VStack alignment="leading" spacing={2}>
                    <Text foregroundStyle="label" lineLimit={1}>
                      {app.name}
                    </Text>
                    <Text
                      font="caption"
                      foregroundStyle="secondaryLabel"
                      lineLimit={1}
                    >
                      {app.sellerName ?? ''}
                    </Text>
                  </VStack>
                  <Spacer />
                  <Text font="caption" foregroundStyle="secondaryLabel">
                    {app.formattedPrice ?? ''}
                  </Text>
                </HStack>
              </Button>
            ))
          )}
        </Section>
      ) : null}
    </List>
  )

  // Browse mode is pushed into the caller's stack; select mode is presented
  // modally and has to bring its own, or the toolbar has nowhere to live.
  return mode === 'select' ? <NavigationStack>{content}</NavigationStack> : content
}
