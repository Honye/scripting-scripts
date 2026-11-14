import {
  Button,
  ForEach,
  HStack,
  Image,
  List,
  Menu,
  Navigation,
  NavigationLink,
  NavigationStack,
  ProgressView,
  Section,
  Spacer,
  Text,
  VStack,
  useEffect,
  useObservable,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { regionFor } from '../regions'
import {
  allTags,
  emptyFilter,
  filterFavorites,
  isFiltering,
  linkedEntries,
  newFavorite,
  pruneFilter,
  sortFavorites,
  toggleFilterTag
} from '../favorites'
import { TagChips, TagLine } from '../components/TagChips'
import { AppLookup } from './AppLookup'
import { FavoriteDetail } from './FavoriteDetail'
import type { AppInfo } from '../api/itunes'
import type { EntryDraft } from './EntryEditor'
import type { FavoriteFilter } from '../favorites'
import type { Account, AppRef, Entry, Favorite } from '../types'

type Row = { id: string; favorite: Favorite }

export function appRefFrom(info: AppInfo): AppRef {
  return {
    appId: info.appId,
    name: info.name,
    iconUrl: info.iconUrl,
    bundleId: info.bundleId,
    fetchedRegion: info.region,
    fetchedAt: Date.now()
  }
}

/**
 * The favorites tab: apps the user keeps an eye on, with a tag filter on top.
 *
 * Also pushed from an account's detail screen, narrowed to that account. A
 * pushed destination does not receive new props, so the collections are
 * mirrored locally — re-seeded whenever `App` does send new ones (the tab
 * case) and updated in place on every edit made from here (both cases).
 */
export function FavoriteList({
  favorites: favoritesProp,
  accounts,
  entries: entriesProp,
  appRefs: appRefsProp,
  fixedAccountId,
  onSave,
  onRemove,
  onSaveEntry
}: {
  favorites: Favorite[]
  accounts: Account[]
  entries: Entry[]
  appRefs: Record<string, AppRef>
  /** Opens with this account's filter already applied. */
  fixedAccountId?: string
  onSave: (favorite: Favorite, appRef?: AppRef) => void
  onRemove: (appId: string) => void
  onSaveEntry: (draft: EntryDraft) => void
}) {
  const [favorites, setFavorites] = useState<Favorite[]>(favoritesProp)
  const [entries, setEntries] = useState<Entry[]>(entriesProp)
  const [appRefs, setAppRefs] = useState<Record<string, AppRef>>(appRefsProp)
  const [filter, setFilter] = useState<FavoriteFilter>({
    ...emptyFilter,
    accountId: fixedAccountId ?? null
  })

  useEffect(() => {
    setFavorites(favoritesProp)
  }, [favoritesProp])
  useEffect(() => {
    setEntries(entriesProp)
  }, [entriesProp])
  useEffect(() => {
    setAppRefs(appRefsProp)
  }, [appRefsProp])

  const tags = allTags(favorites)
  // A tag renamed or removed elsewhere must not leave the filter stuck on it.
  useEffect(() => {
    setFilter((prev) => pruneFilter(prev, tags))
  }, [tags.join('\n')])

  const visible = filterFavorites(sortFavorites(favorites, appRefs), filter)

  const save = (favorite: Favorite, appRef?: AppRef) => {
    setFavorites((prev) => {
      const index = prev.findIndex((f) => f.appId === favorite.appId)
      if (index < 0) return [...prev, favorite]
      const next = [...prev]
      next[index] = favorite
      return next
    })
    if (appRef != null) setAppRefs((prev) => ({ ...prev, [appRef.appId]: appRef }))
    onSave(favorite, appRef)
  }

  const remove = (appId: string) => {
    setFavorites((prev) => prev.filter((f) => f.appId !== appId))
    onRemove(appId)
  }

  const saveEntry = (draft: EntryDraft) => {
    setEntries((prev) => {
      const index = prev.findIndex((e) => e.id === draft.entry.id)
      if (index < 0) return [...prev, draft.entry]
      const next = [...prev]
      next[index] = draft.entry
      return next
    })
    if (draft.appRef != null) {
      const ref = draft.appRef
      setAppRefs((prev) => ({ ...prev, [ref.appId]: ref }))
    }
    onSaveEntry(draft)
  }

  // Swipe-to-delete goes through `ForEach`, which rewrites this observable in
  // place; see `AccountDetail` for why a plain `.map()` is not safe here.
  const rows = useObservable<Row[]>(() =>
    visible.map((favorite) => ({ id: favorite.appId, favorite }))
  )
  const orderKey = (list: { id: string }[]) => list.map((r) => r.id).join(',')
  const visibleKey = visible.map((f) => f.appId).join(',')

  useEffect(() => {
    rows.setValue(visible.map((favorite) => ({ id: favorite.appId, favorite })))
  }, [visible.map((f) => JSON.stringify(f)).join('|'), appRefs])

  useEffect(() => {
    if (orderKey(rows.value) === visibleKey) return
    const remaining = new Set(rows.value.map((r) => r.id))
    for (const favorite of visible) {
      if (!remaining.has(favorite.appId)) remove(favorite.appId)
    }
  }, [rows.value])

  const detailFor = (favorite: Favorite, presented = false) => (
    <FavoriteDetail
      favorite={favorite}
      accounts={accounts}
      entries={entries}
      appRefs={appRefs}
      allTags={tags}
      presented={presented}
      onSave={(f) => save(f)}
      onRemove={remove}
      onSaveEntry={saveEntry}
    />
  )

  const add = async () => {
    const picked = await Navigation.present<AppInfo | undefined>({
      element: (
        <AppLookup
          accountRegions={Array.from(new Set(accounts.map((a) => a.region)))}
          mode="select"
        />
      )
    })
    if (picked == null) return
    const ref = appRefFrom(picked)
    let favorite = favorites.find((f) => f.appId === picked.appId)
    if (favorite == null) {
      favorite = newFavorite(picked.appId)
      // Opened from an account: the app being added is most likely on it.
      if (fixedAccountId != null) favorite.accountIds = [fixedAccountId]
    }
    save(favorite, ref)
    await Navigation.present({
      element: (
        <NavigationStack>{detailFor(favorite, true)}</NavigationStack>
      )
    })
  }

  const byAccount = new Map(accounts.map((a) => [a.id, a]))
  const filterAccount =
    filter.accountId != null ? byAccount.get(filter.accountId) : undefined

  const accountMenu = (
    <Menu
      label={
        <Image
          systemName={
            filter.accountId != null
              ? 'person.crop.circle.fill'
              : 'person.crop.circle'
          }
        />
      }
    >
      <Button
        title={i18n.filterAllAccounts}
        systemImage={filter.accountId == null ? 'checkmark' : undefined}
        action={() => setFilter((prev) => ({ ...prev, accountId: null }))}
      />
      {accounts.map((account) => (
        <Button
          key={account.id}
          title={`${regionFor(account.region).flag} ${account.alias}`}
          systemImage={filter.accountId === account.id ? 'checkmark' : undefined}
          action={() => setFilter((prev) => ({ ...prev, accountId: account.id }))}
        />
      ))}
    </Menu>
  )

  const title =
    filterAccount != null
      ? `${regionFor(filterAccount.region).flag} ${filterAccount.alias}`
      : i18n.favoritesTab

  return (
    <List
      navigationTitle={fixedAccountId != null ? i18n.favoriteApps : i18n.favoritesTab}
      toolbar={{
        topBarTrailing: [
          ...(accounts.length > 0 ? [accountMenu] : []),
          <Button action={add}>
            <Image systemName="plus" />
          </Button>
        ]
      }}
    >
      {favorites.length === 0 ? (
        <Section footer={<Text>{i18n.favoritesEmptyHint}</Text>}>
          <Text foregroundStyle="secondaryLabel">{i18n.favoritesEmpty}</Text>
        </Section>
      ) : (
        <Section
          header={
            filterAccount != null ? (
              <Text>{title}</Text>
            ) : undefined
          }
        >
          <TagChips
            chips={[
              {
                key: '\u0000all',
                label: i18n.tagAll,
                selected: filter.tags.length === 0 && !filter.untagged,
                onTap: () => setFilter((prev) => ({ ...prev, tags: [], untagged: false }))
              },
              ...tags.map((tag) => ({
                key: tag.toLowerCase(),
                label: `#${tag}`,
                selected: filter.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
                onTap: () => setFilter((prev) => toggleFilterTag(prev, tag))
              })),
              {
                key: '\u0000untagged',
                label: i18n.tagUntagged,
                selected: filter.untagged,
                onTap: () =>
                  setFilter((prev) => ({ ...prev, tags: [], untagged: !prev.untagged }))
              }
            ]}
          />
        </Section>
      )}

      {favorites.length > 0 && visible.length === 0 ? (
        <Section>
          <Text foregroundStyle="secondaryLabel">{i18n.favoritesNoMatch}</Text>
          {isFiltering(filter) ? (
            <Button title={i18n.clearFilters} action={() => setFilter(emptyFilter)} />
          ) : null}
        </Section>
      ) : null}

      {visible.length > 0 ? (
        <Section>
          <ForEach
            data={rows}
            editActions="delete"
            builder={({ favorite }) => {
              const ref = appRefs[favorite.appId]
              const owners = favorite.accountIds
                .map((id) => byAccount.get(id))
                .filter((a): a is Account => a != null)
              const count = linkedEntries(favorite, entries).length
              return (
                <NavigationLink key={favorite.appId} destination={detailFor(favorite)}>
                  <HStack spacing={12}>
                    {ref?.iconUrl ? (
                      <Image
                        imageUrl={ref.iconUrl}
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
                        frame={{ width: 44, height: 44 }}
                      />
                    )}
                    <VStack alignment="leading" spacing={3}>
                      <Text foregroundStyle="label" lineLimit={1}>
                        {ref?.name ?? favorite.appId}
                      </Text>
                      <TagLine tags={favorite.tags} />
                      {owners.length > 0 || count > 0 ? (
                        <Text font="caption2" foregroundStyle="tertiaryLabel" lineLimit={1}>
                          {[
                            owners
                              .map((a) => `${regionFor(a.region).flag} ${a.alias}`)
                              .join('  '),
                            count > 0 ? i18n.entryCount(count) : ''
                          ]
                            .filter((part) => part !== '')
                            .join(' · ')}
                        </Text>
                      ) : null}
                    </VStack>
                    <Spacer />
                  </HStack>
                </NavigationLink>
              )
            }}
          />
        </Section>
      ) : null}
    </List>
  )
}
