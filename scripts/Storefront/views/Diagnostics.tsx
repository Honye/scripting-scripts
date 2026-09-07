import {
  Button,
  List,
  NavigationStack,
  Notification,
  Section,
  Text,
  VStack,
  useState
} from 'scripting'
import { clearPassword, hasPassword, revealPassword, setPassword } from '../credentials'
import { clearPending, countPending, scheduleAt } from '../notifications'
import { fetchJson, fetchText } from '../api/http'

/**
 * P1 spike surface. Every capability with no precedent anywhere in this repo —
 * Keychain, LocalAuth, scheduled notifications, aborting fetch — gets exercised
 * here before any feature code depends on it.
 *
 * Developer-facing and deliberately not localized. P9 removes the entry point
 * from Settings but keeps the file for regression checks.
 */
const PROBE_ACCOUNT = 'diagnostics-probe'
const PROBE_SECRET = 'hunter2-probe'

export function Diagnostics() {
  const [log, setLog] = useState<string[]>([])

  const write = (line: string) =>
    setLog((prev) => [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 60))

  // --- Keychain -----------------------------------------------------------
  const kcWrite = () => {
    const ok = setPassword(PROBE_ACCOUNT, PROBE_SECRET)
    write(`Keychain.set -> ${ok}`)
  }
  const kcRead = async () => {
    const result = await revealPassword(PROBE_ACCOUNT, 'Diagnostics: read probe secret')
    write(
      result.ok
        ? `revealPassword -> ok, matches=${result.password === PROBE_SECRET}`
        : `revealPassword -> denied (${result.reason})`
    )
  }
  const kcContains = () => write(`hasPassword -> ${hasPassword(PROBE_ACCOUNT)}`)
  const kcKeys = () => {
    try {
      write(`Keychain.keys -> ${JSON.stringify(Keychain.keys())}`)
    } catch (e) {
      write(`Keychain.keys threw: ${String(e)}`)
    }
  }
  const kcClear = () => {
    clearPassword(PROBE_ACCOUNT)
    write(`clearPassword done, hasPassword=${hasPassword(PROBE_ACCOUNT)}`)
  }

  // --- LocalAuth ----------------------------------------------------------
  const authCaps = () =>
    write(
      `isAvailable=${LocalAuth.isAvailable} biometrics=${LocalAuth.isBiometricsAvailable} type=${LocalAuth.biometryType}`
    )

  // --- Pasteboard ---------------------------------------------------------
  const pbWrite = async () => {
    await Pasteboard.setString('storefront-probe')
    write('Pasteboard.setString done — paste elsewhere to confirm')
  }

  // --- Notifications ------------------------------------------------------
  const notifySoon = async (timeSensitive: boolean) => {
    const fireAt = new Date(Date.now() + 60 * 1000)
    const ok = await scheduleAt({
      title: timeSensitive ? 'Storefront (time sensitive)' : 'Storefront probe',
      body: `Scheduled for ${fireAt.toLocaleTimeString()}`,
      fireAt,
      timeSensitive,
      userInfo: { kind: 'probe', at: fireAt.getTime() },
      threadIdentifier: 'storefront-probe'
    })
    write(`schedule(+60s, timeSensitive=${timeSensitive}) -> ${ok}`)
  }
  const notifyCount = async () => write(`pending (this script) -> ${await countPending()}`)
  const notifyClear = async () => {
    await clearPending()
    write(`cleared, pending now -> ${await countPending()}`)
  }
  const notifyCurrent = () => {
    const info = Notification.current
    write(
      `Notification.current -> ${
        info ? JSON.stringify(info.request.content.userInfo) : 'null'
      }`
    )
  }

  // --- Network ------------------------------------------------------------
  const netOk = async () => {
    const r = await fetchJson<{ resultCount: number }>(
      'https://itunes.apple.com/lookup?id=1016366447&country=us'
    )
    write(r.ok ? `lookup -> resultCount=${r.value.resultCount}` : `lookup -> ${r.reason}`)
  }
  const netTimeout = async () => {
    const r = await fetchText('https://apps.apple.com/us/app/id1016366447', {
      timeoutMs: 1
    })
    write(`1ms timeout -> ${r.ok ? 'unexpectedly ok' : r.reason}`)
  }
  const netBlocked = async () => {
    const r = await fetchText('https://example.com')
    write(`non-allowlisted host -> ${r.ok ? 'LEAKED' : r.reason}`)
  }

  return (
    <NavigationStack>
      <List navigationTitle="Diagnostics" navigationBarTitleDisplayMode="inline">
        <Section header={<Text>Keychain</Text>}>
          <Button title="set probe password" action={kcWrite} />
          <Button title="reveal (Face ID)" action={kcRead} />
          <Button title="hasPassword" action={kcContains} />
          <Button title="keys()" action={kcKeys} />
          <Button title="clear probe" role="destructive" action={kcClear} />
        </Section>

        <Section
          header={<Text>LocalAuth</Text>}
          footer={
            <Text>
              Turn Face ID off in Settings, then re-check: reveal must refuse, never fall
              through to plaintext.
            </Text>
          }
        >
          <Button title="capabilities" action={authCaps} />
        </Section>

        <Section header={<Text>Pasteboard</Text>}>
          <Button title="copy probe string" action={pbWrite} />
        </Section>

        <Section
          header={<Text>Notifications</Text>}
          footer={<Text>Schedule, then lock the device and wait ~60s.</Text>}
        >
          <Button title="schedule +60s (active)" action={() => notifySoon(false)} />
          <Button title="schedule +60s (timeSensitive)" action={() => notifySoon(true)} />
          <Button title="count pending" action={notifyCount} />
          <Button title="clear pending (this script)" action={notifyClear} />
          <Button title="read Notification.current" action={notifyCurrent} />
        </Section>

        <Section header={<Text>Network</Text>}>
          <Button title="iTunes lookup (expect ok)" action={netOk} />
          <Button title="1ms timeout (expect timeout)" action={netTimeout} />
          <Button title="example.com (expect blocked)" action={netBlocked} />
        </Section>

        <Section header={<Text>Log</Text>}>
          {log.length === 0 ? (
            <Text foregroundStyle="secondaryLabel">No output yet</Text>
          ) : (
            log.map((line, index) => (
              <VStack key={`${index}-${line}`} alignment="leading">
                <Text font="caption" fontDesign="monospaced">
                  {line}
                </Text>
              </VStack>
            ))
          )}
        </Section>
      </List>
    </NavigationStack>
  )
}
