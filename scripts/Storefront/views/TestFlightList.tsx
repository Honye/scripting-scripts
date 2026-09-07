import {
  Button,
  ForEach,
  HStack,
  Image,
  List,
  Navigation,
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
import { daysUntil, formatDate } from '../format'
import { regionFor } from '../regions'
import { notifyNow } from '../notifications'
import { refreshItem, tfStatusColor, tfStatusLabel } from '../tf_status'
import { TFEditor } from './TFEditor'
import type { Account, Settings, TFItem } from '../types'

/** Per-item budget for the batch refresh; the whole list runs sequentially. */
const CHECK_TIMEOUT_MS = 8000

/**
 * FR-TF-01..09.
 *
 * FR-TF-09 is a hard requirement and it is the reason for both the per-row
 * timestamp and the standing footer: iOS decides when background work runs, so
 * any status here is a statement about the last time we looked, never about
 * now. The copy says so rather than letting the UI imply otherwise.
 */
export function TestFlightList({
  items,
  accounts,
  settings,
  onSave,
  onDelete,
  onSettingsChange
}: {
  items: TFItem[]
  accounts: Account[]
  settings: Settings
  onSave: (item: TFItem) => void
  onDelete: (id: string) => void
  onSettingsChange: (settings: Settings) => void
}) {
  // Owned locally: this is a pushed destination, and the same divergence that
  // crashed the records list would apply here.
  const [local, setLocal] = useState<TFItem[]>(() => items)
  const [busy, setBusy] = useState(false)

  const rows = useObservable<TFItem[]>(() => local)
  const orderKey = (list: TFItem[]) => list.map((t) => t.id).join(',')

  useEffect(() => {
    rows.setValue(local)
  }, [local])

  useEffect(() => {
    if (orderKey(rows.value) === orderKey(local)) return
    const remaining = new Set(rows.value.map((t) => t.id))
    const removed = local.filter((t) => !remaining.has(t.id))
    setLocal(rows.value)
    for (const item of removed) onDelete(item.id)
  }, [rows.value])

  useEffect(() => {
    if (!settings.tfNoticeSeen) onSettingsChange({ ...settings, tfNoticeSeen: true })
  }, [])

  const edit = async (item?: TFItem) => {
    const saved = await Navigation.present<TFItem | undefined>({
      element: <TFEditor existing={item} accounts={accounts} />
    })
    if (saved == null) return
    setLocal((prev) => {
      const index = prev.findIndex((t) => t.id === saved.id)
      if (index < 0) return [...prev, saved]
      const next = [...prev]
      next[index] = saved
      return next
    })
    onSave(saved)
  }

  /**
   * FR-TF-06. Sequential rather than parallel: a dozen simultaneous requests on
   * a phone network produce timeouts that look like "full" to nobody's benefit.
   */
  const refreshAll = async () => {
    if (busy) return
    setBusy(true)
    for (const item of local) {
      const result = await refreshItem(item, CHECK_TIMEOUT_MS)
      if (result == null) continue
      setLocal((prev) =>
        prev.map((t) => (t.id === result.item.id ? result.item : t))
      )
      onSave(result.item)
      if (result.becameOpen) {
        // FR-TF-08. Deliberately hedged: by the time this is read the slot may
        // be gone, and promising otherwise would be the "race for a slot"
        // framing FR-TF-09 forbids.
        await notifyNow(i18n.tfOpenedTitle(result.item.name), i18n.tfOpenedBody, {
          tfItemId: result.item.id
        })
      }
    }
    setBusy(false)
  }

  useEffect(() => {
    refreshAll()
  }, [])

  const checkedLabel = (item: TFItem) => {
    if (item.statusCheckedAt == null) return i18n.tfNeverChecked
    const days = daysUntil(item.statusCheckedAt)
    return i18n.tfChecked(
      days === 0 ? i18n.dueIn(0) : formatDate(item.statusCheckedAt, i18n.dateLocale)
    )
  }

  return (
    <List
      navigationTitle={i18n.testflight}
      navigationBarTitleDisplayMode="inline"
      toolbar={{
        topBarTrailing: [
          <Button action={() => edit()}>
            <Image systemName="plus" />
          </Button>
        ]
      }}
    >
      <Section
        footer={
          <VStack alignment="leading" spacing={4}>
            <Text>{i18n.tfNoticeBody}</Text>
          </VStack>
        }
      >
        <HStack>
          <Button
            title={busy ? i18n.tfRefreshing : i18n.tfRefresh}
            action={refreshAll}
            disabled={busy || local.length === 0}
          />
          <Spacer />
          {busy ? <ProgressView /> : null}
        </HStack>
      </Section>

      {local.length === 0 ? (
        <Section>
          <Text foregroundStyle="secondaryLabel">{i18n.tfEmpty}</Text>
        </Section>
      ) : (
        <Section>
          <ForEach
            data={rows}
            editActions="delete"
            builder={(item) => {
              const account = accounts.find((a) => a.id === item.accountId)
              return (
                <Button key={item.id} action={() => edit(item)}>
                  <HStack>
                    <VStack alignment="leading" spacing={3}>
                      <Text foregroundStyle="label" lineLimit={1}>
                        {item.name}
                      </Text>
                      <HStack spacing={5}>
                        <Text
                          font="caption"
                          foregroundStyle={tfStatusColor(item.status)}
                        >
                          {tfStatusLabel(item.status)}
                        </Text>
                        {item.statusIsManual === true ? (
                          <Text font="caption2" foregroundStyle="tertiaryLabel">
                            · {i18n.tfManual}
                          </Text>
                        ) : null}
                        {account != null ? (
                          <Text font="caption2" foregroundStyle="tertiaryLabel">
                            · {regionFor(account.region).flag} {account.alias}
                          </Text>
                        ) : null}
                      </HStack>
                      {/* FR-TF-09: never present a status without saying when
                          it was last true. */}
                      <Text font="caption2" foregroundStyle="tertiaryLabel">
                        {checkedLabel(item)}
                      </Text>
                    </VStack>
                    <Spacer />
                    <Button
                      action={() => Safari.openURL(item.joinUrl)}
                      buttonStyle="borderless"
                    >
                      <Image systemName="arrow.up.forward.app" />
                    </Button>
                  </HStack>
                </Button>
              )
            }}
          />
        </Section>
      )}
    </List>
  )
}
