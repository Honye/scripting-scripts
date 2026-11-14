import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationLink,
  ProgressView,
  Section,
  Spacer,
  Text,
  TextField,
  VStack,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { formatMoney } from '../format'
import { regionFor } from '../regions'
import { totalsByCurrency } from '../billing'
import {
  isManualLink,
  linkedEntries,
  suggestedAccountIds
} from '../favorites'
import { AppDetail } from './AppDetail'
import { EntryEditor, kindLabel } from './EntryEditor'
import { AccountMultiPicker, EntryLinkPicker, TagEditor } from './FavoriteEditors'
import type { EntryDraft } from './EntryEditor'
import type { Account, AppRef, Entry, Favorite } from '../types'

/**
 * One favorite app: its tags, the accounts that own it, and the in-app purchases
 * and other records that belong to it.
 *
 * Like `AccountDetail`, this is a pushed destination, built once when the link
 * is tapped, so it cannot rely on new props arriving from `App`. It keeps a
 * local mirror of the favorite and of the records it shows, and reports every
 * change upward.
 */
export function FavoriteDetail({
  favorite: initialFavorite,
  accounts,
  entries: initialEntries,
  appRefs,
  allTags,
  presented = false,
  onSave,
  onRemove,
  onSaveEntry
}: {
  favorite: Favorite
  accounts: Account[]
  entries: Entry[]
  appRefs: Record<string, AppRef>
  allTags: string[]
  /** Shown as a sheet right after adding, so it brings its own Done button. */
  presented?: boolean
  onSave: (favorite: Favorite) => void
  onRemove: (appId: string) => void
  onSaveEntry: (draft: EntryDraft) => void
}) {
  const dismiss = Navigation.useDismiss()
  const [favorite, setFavorite] = useState<Favorite>(initialFavorite)
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [refs, setRefs] = useState<Record<string, AppRef>>(appRefs)

  const ref = refs[favorite.appId]
  const name = ref?.name ?? favorite.appId
  const byAccount = new Map(accounts.map((a) => [a.id, a]))
  const linkedAccounts = favorite.accountIds
    .map((id) => byAccount.get(id))
    .filter((a): a is Account => a != null)
  const suggested = suggestedAccountIds(favorite, entries)
    .map((id) => byAccount.get(id))
    .filter((a): a is Account => a != null)
  const records = linkedEntries(favorite, entries)
  const totals = totalsByCurrency(records)

  const update = (next: Favorite) => {
    setFavorite(next)
    onSave(next)
  }

  const editTags = async () => {
    const tags = await Navigation.present<string[] | undefined>({
      element: <TagEditor selected={favorite.tags} allTags={allTags} />
    })
    if (tags != null) update({ ...favorite, tags })
  }

  const chooseAccounts = async () => {
    const ids = await Navigation.present<string[] | undefined>({
      element: <AccountMultiPicker accounts={accounts} selected={favorite.accountIds} />
    })
    if (ids != null) update({ ...favorite, accountIds: ids })
  }

  const addAccount = (id: string) =>
    update({ ...favorite, accountIds: [...favorite.accountIds, id] })

  /** Records not already linked through the app id are the ones worth offering. */
  const linkEntries = async () => {
    const candidates = entries.filter((e) => e.appId !== favorite.appId)
    const ids = await Navigation.present<string[] | undefined>({
      element: (
        <EntryLinkPicker
          candidates={candidates}
          selected={favorite.entryIds}
          accounts={accounts}
          appRefs={refs}
        />
      )
    })
    if (ids != null) update({ ...favorite, entryIds: ids })
  }

  const editEntry = async (entry?: Entry) => {
    if (entry == null && accounts.length === 0) {
      await Dialog.alert({ message: i18n.needAccountFirst })
      return
    }
    const draft = await Navigation.present<EntryDraft | undefined>({
      element: (
        <EntryEditor
          existing={entry}
          accounts={accounts}
          appRefs={refs}
          defaultAccountId={favorite.accountIds[0]}
          defaultKind="iap"
          defaultApp={entry == null ? ref : undefined}
        />
      )
    })
    if (draft == null) return
    setEntries((prev) => {
      const index = prev.findIndex((e) => e.id === draft.entry.id)
      if (index < 0) return [...prev, draft.entry]
      const next = [...prev]
      next[index] = draft.entry
      return next
    })
    if (draft.appRef != null) {
      const appRef = draft.appRef
      setRefs((prev) => ({ ...prev, [appRef.appId]: appRef }))
    }
    onSaveEntry(draft)
    // Buying something on an account is the clearest sign that it owns the app.
    const accountId = draft.entry.accountId
    const belongs =
      draft.entry.appId === favorite.appId || favorite.entryIds.includes(draft.entry.id)
    if (entry == null && belongs && !favorite.accountIds.includes(accountId)) {
      addAccount(accountId)
    }
  }

  const remove = async () => {
    const ok = await Dialog.confirm({
      title: i18n.favoriteRemove,
      message: i18n.favoriteRemoveConfirm(name),
      confirmLabel: i18n.favoriteRemove
    })
    if (!ok) return
    onRemove(favorite.appId)
    dismiss()
  }

  const openInAppStore = async () => {
    try {
      await AppStore.presentApp(favorite.appId)
    } catch {
      // Already showing; nothing useful to say.
    }
  }

  const accountRegions = Array.from(new Set(accounts.map((a) => a.region)))
  const pinnedRegions = Array.from(
    new Set([
      ...linkedAccounts.map((a) => a.region),
      ...(ref != null ? [ref.fetchedRegion] : []),
      ...accountRegions
    ])
  )

  return (
    <List
      navigationTitle={name}
      navigationBarTitleDisplayMode="inline"
      toolbar={
        presented
          ? { topBarTrailing: [<Button title={i18n.done} action={() => dismiss()} />] }
          : undefined
      }
    >
      <Section>
        <HStack spacing={12}>
          {ref?.iconUrl ? (
            <Image
              imageUrl={ref.iconUrl}
              resizable
              frame={{ width: 60, height: 60 }}
              clipShape={{ type: 'rect', cornerRadius: 13 }}
              placeholder={<ProgressView />}
            />
          ) : (
            <Image systemName="app.dashed" font={40} foregroundStyle="tertiaryLabel" />
          )}
          <VStack alignment="leading" spacing={3}>
            <Text fontWeight="semibold" lineLimit={2}>
              {name}
            </Text>
            <Text font="caption2" foregroundStyle="tertiaryLabel">
              {favorite.appId}
            </Text>
          </VStack>
          <Spacer />
        </HStack>
        <NavigationLink
          destination={
            <AppDetail
              appId={favorite.appId}
              pinnedRegions={pinnedRegions}
              accountRegions={accountRegions}
            />
          }
        >
          <HStack>
            <Image systemName="globe" />
            <Text foregroundStyle="label">{i18n.favoriteCompare}</Text>
            <Spacer />
          </HStack>
        </NavigationLink>
        <Button action={openInAppStore}>
          <HStack>
            <Image systemName="arrow.up.forward.app" />
            <Text foregroundStyle="label">{i18n.openInAppStore}</Text>
            <Spacer />
          </HStack>
        </Button>
      </Section>

      <Section
        header={
          <HStack>
            <Text>{i18n.tags}</Text>
            <Spacer />
            <Button title={i18n.edit} action={editTags} />
          </HStack>
        }
      >
        {favorite.tags.length === 0 ? (
          <Button action={editTags}>
            <Text foregroundStyle="secondaryLabel">{i18n.tagsEmpty}</Text>
          </Button>
        ) : (
          <Button action={editTags}>
            <Text foregroundStyle="label">
              {favorite.tags.map((t) => `#${t}`).join('  ')}
            </Text>
          </Button>
        )}
      </Section>

      <Section
        header={
          <HStack>
            <Text>{i18n.linkedAccounts}</Text>
            <Spacer />
            <Button title={i18n.edit} action={chooseAccounts} />
          </HStack>
        }
        footer={<Text>{i18n.linkedAccountsHint}</Text>}
      >
        {linkedAccounts.length === 0 ? (
          <Button action={chooseAccounts}>
            <Text foregroundStyle="secondaryLabel">{i18n.linkedAccountsEmpty}</Text>
          </Button>
        ) : (
          linkedAccounts.map((account) => (
            <AccountRow key={account.id} account={account} />
          ))
        )}
        {suggested.map((account) => (
          <Button key={`s-${account.id}`} action={() => addAccount(account.id)}>
            <HStack>
              <AccountRow account={account} dimmed />
              <Image systemName="plus.circle.fill" foregroundStyle="systemGreen" />
            </HStack>
          </Button>
        ))}
        {suggested.length > 0 ? (
          <Text font="caption" foregroundStyle="secondaryLabel">
            {i18n.suggestedAccounts}
          </Text>
        ) : null}
      </Section>

      <Section
        header={<Text>{i18n.linkedEntries}</Text>}
        footer={
          <VStack alignment="leading" spacing={6}>
            {totals.length > 0 ? (
              <HStack>
                <Text>{i18n.totalSpent}</Text>
                <Spacer />
                <Text>
                  {totals.map(([currency, sum]) => formatMoney(sum, currency)).join('  ·  ')}
                </Text>
              </HStack>
            ) : null}
            <Text>{i18n.linkedEntriesHint}</Text>
          </VStack>
        }
      >
        {records.length === 0 ? (
          <Text foregroundStyle="secondaryLabel">{i18n.linkedEntriesEmpty}</Text>
        ) : (
          records.map((entry) => {
            const account = byAccount.get(entry.accountId)
            return (
              <Button key={entry.id} action={() => editEntry(entry)}>
                <HStack>
                  <VStack alignment="leading" spacing={2}>
                    <Text foregroundStyle="label" lineLimit={1}>
                      {entry.title}
                    </Text>
                    <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>
                      {kindLabel(entry.kind)} ·{' '}
                      {account != null ? regionFor(account.region).flag : ''}{' '}
                      {account?.alias ?? ''}
                      {entry.kind === 'subscription' && entry.active === false
                        ? ` · ${i18n.entryPaused}`
                        : ''}
                      {isManualLink(favorite, entry) ? ` · ${i18n.manualLink}` : ''}
                    </Text>
                  </VStack>
                  <Spacer />
                  <Text foregroundStyle="secondaryLabel">
                    {formatMoney(entry.price, entry.currency)}
                  </Text>
                </HStack>
              </Button>
            )
          })
        )}
        <Button action={() => editEntry()}>
          <HStack>
            <Image systemName="plus" />
            <Text>{i18n.newIapEntry}</Text>
            <Spacer />
          </HStack>
        </Button>
        <Button action={linkEntries}>
          <HStack>
            <Image systemName="link" />
            <Text>{i18n.linkExistingEntries}</Text>
            <Spacer />
          </HStack>
        </Button>
      </Section>

      <Section header={<Text>{i18n.favoriteNote}</Text>}>
        <TextField
          title={i18n.favoriteNote}
          labelsHidden
          prompt={i18n.optional}
          value={favorite.note}
          onChanged={(note) => update({ ...favorite, note })}
          axis="vertical"
        />
      </Section>

      <Section>
        <Button title={i18n.favoriteRemove} role="destructive" action={remove} />
      </Section>
    </List>
  )
}

function AccountRow({ account, dimmed = false }: { account: Account; dimmed?: boolean }) {
  const region = regionFor(account.region)
  return (
    <HStack>
      <Text>{region.flag}</Text>
      <VStack alignment="leading" spacing={2}>
        <Text foregroundStyle={dimmed ? 'secondaryLabel' : 'label'}>{account.alias}</Text>
        <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>
          {region.code.toUpperCase()}
          {account.email !== '' ? ` · ${account.email}` : ''}
        </Text>
      </VStack>
      <Spacer />
    </HStack>
  )
}
