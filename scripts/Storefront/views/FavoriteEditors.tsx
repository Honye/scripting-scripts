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
import { formatMoney } from '../format'
import { regionFor } from '../regions'
import { cleanTags, normalizeTag } from '../favorites'
import { TagChips } from '../components/TagChips'
import { kindLabel } from './EntryEditor'
import type { Account, AppRef, Entry } from '../types'

/**
 * The three small pickers behind a favorite's detail screen. Each is presented
 * modally and resolves with the new selection, or `undefined` when cancelled —
 * the caller owns the favorite and decides what to do with the answer.
 */

function Sheet({
  title,
  onDone,
  children
}: {
  title: string
  onDone: () => void
  children: any
}) {
  const dismiss = Navigation.useDismiss()
  return (
    <NavigationStack>
      <List
        navigationTitle={title}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [<Button title={i18n.cancel} action={() => dismiss()} />],
          topBarTrailing: [<Button title={i18n.done} action={onDone} />]
        }}
      >
        {children}
      </List>
    </NavigationStack>
  )
}

function Check({ on }: { on: boolean }) {
  return (
    <Image
      systemName={on ? 'checkmark.circle.fill' : 'circle'}
      foregroundStyle={on ? 'systemBlue' : 'tertiaryLabel'}
    />
  )
}

/** Toggle existing tags on or off, or type a new one. */
export function TagEditor({
  selected,
  allTags
}: {
  selected: string[]
  /** Every tag in use across favorites, offered for one-tap reuse. */
  allTags: string[]
}) {
  const dismiss = Navigation.useDismiss()
  const [tags, setTags] = useState<string[]>(() => cleanTags(selected))
  const [draft, setDraft] = useState('')

  const keyOf = (t: string) => t.toLowerCase()
  const has = (t: string) => tags.some((x) => keyOf(x) === keyOf(t))
  const toggle = (t: string) =>
    setTags((prev) =>
      prev.some((x) => keyOf(x) === keyOf(t))
        ? prev.filter((x) => keyOf(x) !== keyOf(t))
        : [...prev, t]
    )

  const addDraft = () => {
    const tag = normalizeTag(draft)
    if (tag == null) return
    setTags((prev) => cleanTags([...prev, tag]))
    setDraft('')
  }

  // Tags just typed in this sheet are offered too, so a mistaken one can be
  // switched off again before saving.
  const offered = cleanTags([...allTags, ...tags])

  return (
    <Sheet
      title={i18n.editTags}
      onDone={() => {
        // A tag left in the field without pressing return is still meant.
        const pending = normalizeTag(draft)
        dismiss(cleanTags(pending != null ? [...tags, pending] : tags))
      }}
    >
      <Section>
        <HStack>
          <TextField
            title={i18n.tagNewPrompt}
            labelsHidden
            prompt={i18n.tagNewPrompt}
            value={draft}
            onChanged={setDraft}
            autocorrectionDisabled={true}
            onSubmit={addDraft}
          />
          <Button
            title={i18n.add}
            action={addDraft}
            buttonStyle="borderless"
            disabled={normalizeTag(draft) == null}
          />
        </HStack>
      </Section>
      <Section
        header={<Text>{i18n.tagExisting}</Text>}
        footer={<Text>{i18n.tagEditorHint}</Text>}
      >
        {offered.length === 0 ? (
          <Text foregroundStyle="secondaryLabel">{i18n.tagsEmpty}</Text>
        ) : (
          <TagChips
            chips={offered.map((t) => ({
              key: keyOf(t),
              label: t,
              selected: has(t),
              onTap: () => toggle(t)
            }))}
          />
        )}
      </Section>
    </Sheet>
  )
}

/** Multi-select over accounts; resolves with the chosen ids in account order. */
export function AccountMultiPicker({
  accounts,
  selected
}: {
  accounts: Account[]
  selected: string[]
}) {
  const dismiss = Navigation.useDismiss()
  const [chosen, setChosen] = useState<string[]>(selected)

  const toggle = (id: string) =>
    setChosen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <Sheet
      title={i18n.chooseAccounts}
      onDone={() => dismiss(accounts.map((a) => a.id).filter((id) => chosen.includes(id)))}
    >
      <Section footer={<Text>{i18n.linkedAccountsHint}</Text>}>
        {accounts.length === 0 ? (
          <Text foregroundStyle="secondaryLabel">{i18n.needAccountFirst}</Text>
        ) : (
          accounts.map((account) => {
            const region = regionFor(account.region)
            return (
              <Button key={account.id} action={() => toggle(account.id)}>
                <HStack>
                  <Text>{region.flag}</Text>
                  <VStack alignment="leading" spacing={2}>
                    <Text foregroundStyle="label">{account.alias}</Text>
                    <Text font="caption" foregroundStyle="secondaryLabel">
                      {region.code.toUpperCase()}
                      {account.email !== '' ? ` · ${account.email}` : ''}
                    </Text>
                  </VStack>
                  <Spacer />
                  <Check on={chosen.includes(account.id)} />
                </HStack>
              </Button>
            )
          })
        )}
      </Section>
    </Sheet>
  )
}

/**
 * Multi-select over records that are not already linked through the app id.
 * Resolves with the full set of hand-linked ids.
 */
export function EntryLinkPicker({
  candidates,
  selected,
  accounts,
  appRefs
}: {
  candidates: Entry[]
  selected: string[]
  accounts: Account[]
  appRefs: Record<string, AppRef>
}) {
  const dismiss = Navigation.useDismiss()
  const [chosen, setChosen] = useState<string[]>(selected)
  const byAccount = new Map(accounts.map((a) => [a.id, a]))

  const toggle = (id: string) =>
    setChosen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <Sheet
      title={i18n.linkExistingEntries}
      onDone={() => dismiss(chosen.filter((id) => candidates.some((e) => e.id === id)))}
    >
      <Section>
        {candidates.length === 0 ? (
          <Text foregroundStyle="secondaryLabel">{i18n.linkEntriesEmpty}</Text>
        ) : (
          candidates.map((entry) => {
            const account = byAccount.get(entry.accountId)
            const ref = appRefs[entry.appId]
            return (
              <Button key={entry.id} action={() => toggle(entry.id)}>
                <HStack spacing={10}>
                  {ref?.iconUrl ? (
                    <Image
                      imageUrl={ref.iconUrl}
                      resizable
                      frame={{ width: 28, height: 28 }}
                      clipShape={{ type: 'rect', cornerRadius: 6 }}
                      placeholder={<ProgressView />}
                    />
                  ) : (
                    <Image
                      systemName="app.dashed"
                      font={20}
                      foregroundStyle="tertiaryLabel"
                      frame={{ width: 28, height: 28 }}
                    />
                  )}
                  <VStack alignment="leading" spacing={2}>
                    <Text foregroundStyle="label" lineLimit={1}>
                      {entry.title}
                    </Text>
                    <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>
                      {kindLabel(entry.kind)} · {account != null ? regionFor(account.region).flag : ''}{' '}
                      {account?.alias ?? ''} · {formatMoney(entry.price, entry.currency)}
                    </Text>
                  </VStack>
                  <Spacer />
                  <Check on={chosen.includes(entry.id)} />
                </HStack>
              </Button>
            )
          })
        )}
      </Section>
    </Sheet>
  )
}
