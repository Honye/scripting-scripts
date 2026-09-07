import {
  AppEvents,
  NavigationStack,
  Notification,
  Widget,
  useEffect,
  useRef,
  useState
} from 'scripting'
import { AccountList } from './AccountList'
import {
  loadAccounts,
  loadEntries,
  loadSettings,
  loadTFItems,
  getCurrentAccountId,
  saveAccounts,
  saveEntries,
  saveSettings,
  saveTFItems,
  setCurrentAccountId
} from '../store'
import { clearPassword } from '../credentials'
import { advanceEntry, isBillable } from '../billing'
import { rescheduleAll } from '../notifications'
import { renderReminder } from '../notify_text'
import { loadAppRefs, saveAppRefs } from '../store'
import type { EntryDraft } from './EntryEditor'
import type { Account, AppRef, Entry, Settings, TFItem } from '../types'

/**
 * Owns all persisted state. Following the repo convention, state lives in one
 * top-level `useState` per collection and flows down as props — no Context, no
 * store singleton — with `useEffect` mirroring each change into `Storage` and
 * refreshing the widget.
 */
export function App() {
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts())
  /**
   * FR-SUB-05: a billing date in the past means the charge already happened, so
   * it is rolled forward at launch rather than lingering as a false "overdue".
   * Done in the initializer so nothing ever renders the stale date.
   */
  const [entries, setEntries] = useState<Entry[]>(() =>
    loadEntries().map((entry) => advanceEntry(entry))
  )
  const [appRefs, setAppRefs] = useState<Record<string, AppRef>>(() => loadAppRefs())
  const [tfItems, setTFItems] = useState<TFItem[]>(() => loadTFItems())
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [currentId, setCurrentId] = useState<string | null>(() =>
    getCurrentAccountId()
  )

  useEffect(() => {
    saveAccounts(accounts)
    Widget.reloadAll()
  }, [accounts])

  useEffect(() => {
    saveEntries(entries)
    // The widget shows the next charge and the alert level, both of which are
    // derived from entries — not just from accounts.
    Widget.reloadAll()
  }, [entries])

  useEffect(() => {
    saveAppRefs(appRefs)
  }, [appRefs])

  useEffect(() => {
    saveTFItems(tfItems)
  }, [tfItems])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    setCurrentAccountId(currentId)
    Widget.reloadAll()
  }, [currentId])

  /**
   * FR-ALERT-07: rebuild the whole pending set whenever anything a reminder is
   * derived from moves. Balances, billing dates and the lead time all feed the
   * text and the timing, so a surviving stale reminder would state a number
   * that is no longer true.
   *
   * Runs strictly one at a time. `rescheduleAll` clears before it schedules, so
   * two overlapping runs would let the second one's clear wipe what the first
   * had already laid down and leave a partial set behind. A pending edit is
   * remembered and replayed once the run in flight finishes.
   */
  const rescheduling = useRef(false)
  const rescheduleQueued = useRef(false)

  const runReschedule = async (): Promise<number> => {
    if (rescheduling.current) {
      rescheduleQueued.current = true
      return -1
    }
    rescheduling.current = true
    let outcome
    try {
      outcome = await rescheduleAll(
        accounts,
        entries,
        settings.reminderLeadDays,
        (plan) => renderReminder(plan, accounts)
      )
    } finally {
      rescheduling.current = false
    }
    if (rescheduleQueued.current) {
      rescheduleQueued.current = false
      return runReschedule()
    }
    return outcome.scheduled
  }

  useEffect(() => {
    runReschedule()
  }, [accounts, entries, settings.reminderLeadDays])

  /**
   * `intent.tsx` is a separate process and writes `entries` too. While this app
   * sits in the background its in-memory copy goes stale, and the next save
   * here would erase whatever the share sheet added. Re-reading on the way back
   * to the foreground closes that window.
   */
  useEffect(() => {
    const listener = (phase: 'active' | 'inactive' | 'background') => {
      if (phase !== 'active') return
      setEntries(loadEntries().map((entry) => advanceEntry(entry)))
      setAppRefs(loadAppRefs())
    }
    AppEvents.scenePhase.addListener(listener)
    return () => AppEvents.scenePhase.removeListener(listener)
  }, [])

  /**
   * FR-ALERT-06. A tapped reminder launches the script, and `Notification.current`
   * carries the ids we attached when scheduling, so the account that is about to
   * be charged is the one that opens.
   */
  const [launchAccountId] = useState<string | null>(() => {
    const info = Notification.current
    const accountId = info?.request.content.userInfo?.accountId
    return typeof accountId === 'string' ? accountId : null
  })

  const upsertAccount = (account: Account) => {
    setAccounts((prev) => {
      const index = prev.findIndex((a) => a.id === account.id)
      if (index < 0) {
        return [...prev, { ...account, sortIndex: prev.length }]
      }
      const next = [...prev]
      next[index] = { ...account, sortIndex: prev[index].sortIndex }
      return next
    })
  }

  /**
   * Entries are deleted with their account: an entry records which account paid
   * for something, so it is meaningless once that account is gone. TestFlight
   * items only reference an account optionally, so they are unlinked instead.
   */
  const deleteAccount = (accountId: string) => {
    clearPassword(accountId)
    setAccounts((prev) => prev.filter((a) => a.id !== accountId))
    setEntries((prev) => prev.filter((e) => e.accountId !== accountId))
    setTFItems((prev) =>
      prev.map((t) => (t.accountId === accountId ? { ...t, accountId: undefined } : t))
    )
    setCurrentId((prev) => (prev === accountId ? null : prev))
  }

  const saveEntry = ({ entry, appRef }: EntryDraft) => {
    setEntries((prev) => {
      const index = prev.findIndex((e) => e.id === entry.id)
      if (index < 0) return [...prev, entry]
      const next = [...prev]
      next[index] = entry
      return next
    })
    // Cache the app's name and icon once, keyed by app id, so every list can
    // render it without another lookup.
    if (appRef != null) {
      setAppRefs((prev) => ({ ...prev, [appRef.appId]: appRef }))
    }
  }

  const deleteEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }

  /** After a restore, Storage is the truth and every in-memory copy is stale. */
  const reloadFromStorage = () => {
    setAccounts(loadAccounts())
    setEntries(loadEntries().map((entry) => advanceEntry(entry)))
    setAppRefs(loadAppRefs())
    setTFItems(loadTFItems())
    setSettings(loadSettings())
    setCurrentId(getCurrentAccountId())
  }

  const saveTFItem = (item: TFItem) => {
    setTFItems((prev) => {
      const index = prev.findIndex((t) => t.id === item.id)
      if (index < 0) return [...prev, item]
      const next = [...prev]
      next[index] = item
      return next
    })
  }

  const deleteTFItem = (id: string) => {
    setTFItems((prev) => prev.filter((t) => t.id !== id))
  }

  const reorderAccounts = (ids: string[]) => {
    setAccounts((prev) => {
      const byId = new Map(prev.map((a) => [a.id, a]))
      const ordered: Account[] = []
      ids.forEach((id, index) => {
        const account = byId.get(id)
        if (account != null) {
          ordered.push({ ...account, sortIndex: index })
          byId.delete(id)
        }
      })
      // Anything the drag did not mention keeps its relative order at the end.
      for (const leftover of byId.values()) {
        ordered.push({ ...leftover, sortIndex: ordered.length })
      }
      return ordered
    })
  }

  return (
    <NavigationStack>
      <AccountList
        accounts={accounts}
        entries={entries}
        appRefs={appRefs}
        tfItems={tfItems}
        currentAccountId={currentId}
        settings={settings}
        onUpsert={upsertAccount}
        onDelete={deleteAccount}
        onReorder={reorderAccounts}
        onSetCurrent={(id) => setCurrentId(id)}
        onSettingsChange={setSettings}
        onSaveEntry={saveEntry}
        onDeleteEntry={deleteEntry}
        onReschedule={runReschedule}
        hasUpcoming={entries.some(isBillable)}
        launchAccountId={launchAccountId}
        onSaveTFItem={saveTFItem}
        onDeleteTFItem={deleteTFItem}
        onRestored={reloadFromStorage}
      />
    </NavigationStack>
  )
}
