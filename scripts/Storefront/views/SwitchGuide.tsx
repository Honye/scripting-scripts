import {
  AppEvents,
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationStack,
  Section,
  Spacer,
  Text,
  VStack,
  useEffect,
  useRef,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { regionFor } from '../regions'
import { copyPassword, hasPassword } from '../credentials'
import type { Account } from '../types'

/**
 * FR-SW-01..06. This is an assistant, not an automation: iOS gives no API to
 * sign in to an Apple account or change the App Store storefront, so every word
 * here has to describe guidance rather than action. FR-SW-05 makes the absence
 * of "one tap" / "automatic" wording a hard requirement, not a style choice.
 */
export function SwitchGuide({
  account,
  introSeen,
  onIntroSeen,
  onConfirmed
}: {
  account: Account
  introSeen: boolean
  onIntroSeen: () => void
  onConfirmed: () => void
}) {
  const dismiss = Navigation.useDismiss()
  const region = regionFor(account.region)
  const [status, setStatus] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  // Guards the scene-phase listener: we only ask "did you sign in?" after the
  // user actually left for the App Store, never on an incidental app switch.
  const awaitingReturn = useRef(false)

  useEffect(() => {
    if (!introSeen) onIntroSeen()
  }, [])

  const confirm = () => {
    onConfirmed()
    setConfirmed(true)
    setStatus(i18n.switchDone)
  }

  const askOnReturn = async () => {
    if (!awaitingReturn.current) return
    awaitingReturn.current = false
    const ok = await Dialog.confirm({
      title: i18n.switchConfirmTitle,
      message: i18n.switchConfirmBody(account.alias),
      cancelLabel: i18n.cancel,
      confirmLabel: i18n.switchConfirmYes
    })
    if (ok) confirm()
  }

  useEffect(() => {
    const listener = (phase: 'active' | 'inactive' | 'background') => {
      if (phase === 'active') askOnReturn()
    }
    AppEvents.scenePhase.addListener(listener)
    return () => AppEvents.scenePhase.removeListener(listener)
  }, [account.id])

  const copyEmail = async () => {
    if (account.email.trim() === '') {
      setStatus(i18n.emailMissing)
      return
    }
    await Pasteboard.setString(account.email.trim())
    setStatus(`${i18n.copied}: ${account.email.trim()}`)
  }

  const copyPwd = async () => {
    if (!hasPassword(account.id)) {
      setStatus(i18n.passwordMissing)
      return
    }
    const result = await copyPassword(account.id, i18n.authReason)
    if (result.ok) {
      setStatus(i18n.passwordCopied)
      return
    }
    setStatus(
      result.reason === 'unavailable'
        ? i18n.authUnavailable
        : result.reason === 'missing'
          ? i18n.passwordMissing
          : i18n.authDenied
    )
  }

  const openAppStore = async () => {
    awaitingReturn.current = true
    // No storefront can be targeted from a URL — the App Store always opens in
    // whichever region the signed-in account belongs to (D1).
    await Safari.openURL('itms-apps://')
  }

  return (
    <NavigationStack>
      <List
        navigationTitle={i18n.switchAssistant}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarTrailing: [<Button title={i18n.done} action={() => dismiss()} />]
        }}
      >
        <Section
          header={<Text>{i18n.switchIntroTitle}</Text>}
          footer={<Text>{i18n.switchStep3Hint}</Text>}
        >
          <Text font="footnote" foregroundStyle="secondaryLabel">
            {i18n.switchIntroBody}
          </Text>
        </Section>

        <Section>
          <HStack>
            <Text font={22}>{region.flag}</Text>
            <VStack alignment="leading" spacing={2}>
              <Text fontWeight="semibold">{account.alias}</Text>
              <Text font="caption" foregroundStyle="secondaryLabel">
                {account.email.trim() === '' ? i18n.none : account.email}
              </Text>
            </VStack>
            <Spacer />
          </HStack>
        </Section>

        <Section>
          <Button action={copyEmail}>
            <HStack>
              <Image systemName="person.crop.circle" />
              <Text foregroundStyle="label">{i18n.switchStep1}</Text>
              <Spacer />
            </HStack>
          </Button>
          <Button action={copyPwd}>
            <HStack>
              <Image systemName="key.fill" />
              <Text foregroundStyle="label">{i18n.switchStep2}</Text>
              <Spacer />
              {hasPassword(account.id) ? null : (
                <Text font="caption" foregroundStyle="secondaryLabel">
                  {i18n.passwordNotStored}
                </Text>
              )}
            </HStack>
          </Button>
          <Button action={openAppStore}>
            <HStack>
              <Image systemName="arrow.up.forward.app" />
              <Text foregroundStyle="label">{i18n.switchStep3}</Text>
              <Spacer />
            </HStack>
          </Button>
        </Section>

        <Section
          footer={
            status === '' ? undefined : (
              <Text foregroundStyle="secondaryLabel">{status}</Text>
            )
          }
        >
          {/* The scene-phase prompt is best effort; this button is the path
              that always works, including when the user never leaves the app. */}
          <Button
            title={confirmed ? i18n.switchDone : i18n.markAsCurrent}
            action={confirm}
            disabled={confirmed}
          />
        </Section>
      </List>
    </NavigationStack>
  )
}
