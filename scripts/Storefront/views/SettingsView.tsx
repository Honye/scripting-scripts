import {
  Button,
  HStack,
  List,
  NavigationLink,
  Path,
  Section,
  Spacer,
  Stepper,
  Text,
  VStack,
  useEffect,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { MAX_SCHEDULED, countPending } from '../notifications'
import { applyBackup, buildBackup, parseBackup } from '../backup'
import { Diagnostics } from './Diagnostics'
import type { Settings } from '../types'

/**
 * FR-ALERT-03 and the §7 degradation rule for a denied notification permission.
 *
 * The pending count is shown because it is the only honest answer to "will this
 * actually remind me". There is no permission API to query, so a scheduled
 * count of zero when charges exist is the signal that iOS refused us.
 */
export function SettingsView({
  settings,
  onChange,
  onReschedule,
  hasUpcoming,
  onRestored
}: {
  settings: Settings
  onChange: (settings: Settings) => void
  onReschedule: () => Promise<number>
  hasUpcoming: boolean
  /** Called after a restore so `App` reloads its state from Storage. */
  onRestored: () => void
}) {
  const [pending, setPending] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [dataStatus, setDataStatus] = useState('')

  /**
   * FR-DATA-01/02. The file is built by `backup.ts`, which has no import path to
   * `credentials.ts` at all — so "the export contains no password" is a property
   * of the module graph rather than something to remember at each call site.
   */
  const exportBackup = async () => {
    try {
      const backup = buildBackup()
      const stamp = new Date(backup.exportedAt)
        .toISOString()
        .slice(0, 10)
      const path = Path.join(
        FileManager.temporaryDirectory,
        `storefront-${stamp}.json`
      )
      await FileManager.writeAsString(path, JSON.stringify(backup, null, 2))
      await ShareSheet.present([path])
      setDataStatus('')
    } catch (error) {
      setDataStatus(`${i18n.exportFailed}: ${String(error)}`)
    }
  }

  /** FR-DATA-03/04. Validate everything, confirm, then write — in that order. */
  const importBackup = async () => {
    setDataStatus('')
    const picked = await DocumentPicker.pickFiles({ types: ['public.json'] })
    const path = picked?.[0]
    if (path == null) {
      setDataStatus(i18n.importCancelled)
      return
    }

    let text: string
    try {
      text = await FileManager.readAsString(path)
    } catch (error) {
      setDataStatus(i18n.importInvalid(String(error)))
      return
    }

    const parsed = parseBackup(text)
    if (!parsed.ok) {
      // Nothing has been written at this point, and nothing will be.
      setDataStatus(i18n.importInvalid(parsed.reason))
      return
    }

    const confirmed = await Dialog.confirm({
      title: i18n.importConfirmTitle,
      message: i18n.importConfirmBody(
        parsed.value.accounts.length,
        parsed.value.entries.length,
        parsed.value.tfItems.length
      ),
      cancelLabel: i18n.cancel,
      confirmLabel: i18n.importData
    })
    if (!confirmed) {
      setDataStatus(i18n.importCancelled)
      return
    }

    applyBackup(parsed.value)
    onRestored()
    setDataStatus(i18n.importDone)
  }

  // FR-ALERT-03 caps the lead time at 0–14 days; `Stepper` has no range of its
  // own, so the clamp lives here.
  const setLead = (days: number) =>
    onChange({ ...settings, reminderLeadDays: Math.min(14, Math.max(0, days)) })

  const refresh = async () => {
    setBusy(true)
    setPending(await onReschedule())
    setBusy(false)
  }

  useEffect(() => {
    countPending().then((count) => setPending(count < 0 ? null : count))
  }, [])

  const refused = pending === 0 && hasUpcoming

  return (
    <List navigationTitle={i18n.settings} navigationBarTitleDisplayMode="inline">
      <Section
        header={<Text>{i18n.notifications}</Text>}
        footer={
          <Text foregroundStyle={refused ? 'systemRed' : 'secondaryLabel'}>
            {refused ? i18n.notificationRefused : i18n.notificationCap(MAX_SCHEDULED)}
          </Text>
        }
      >
        <Stepper
          onIncrement={() => setLead(settings.reminderLeadDays + 1)}
          onDecrement={() => setLead(settings.reminderLeadDays - 1)}
        >
          <HStack>
            <Text>{i18n.notificationLead}</Text>
            <Spacer />
            <Text foregroundStyle="secondaryLabel">
              {i18n.notificationLeadUnit(settings.reminderLeadDays)}
            </Text>
          </HStack>
        </Stepper>
        <HStack>
          <Text>{i18n.notificationScheduled(pending ?? 0)}</Text>
          <Spacer />
          <Button
            title={i18n.notificationRefreshNow}
            action={refresh}
            disabled={busy}
          />
        </HStack>
      </Section>

      <Section
        header={<Text>{i18n.data}</Text>}
        footer={
          <VStack alignment="leading" spacing={4}>
            <Text>{i18n.exportDataNote}</Text>
            {dataStatus === '' ? null : (
              <Text foregroundStyle="secondaryLabel">{dataStatus}</Text>
            )}
          </VStack>
        }
      >
        <Button title={i18n.exportData} action={exportBackup} />
        <Button title={i18n.importData} action={importBackup} />
      </Section>

      <Section>
        <NavigationLink destination={<Diagnostics />}>
          <Text foregroundStyle="secondaryLabel">Diagnostics</Text>
        </NavigationLink>
      </Section>
    </List>
  )
}
