import {
  Button,
  Form,
  HStack,
  Navigation,
  NavigationStack,
  Picker,
  ProgressView,
  SecureField,
  Section,
  Spacer,
  Stepper,
  Text,
  TextField,
  Toggle,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { failureText } from '../format'
import { clampBillingDay } from '../limits'
import { verifyToken } from '../api/cloudflare'
import { getToken, setToken } from '../store'
import { THRESHOLD_CHOICES, defaultLimits, defaultThresholds } from '../types'
import type { CFAccount } from '../api/cloudflare'
import type { Limits, Plan, Profile } from '../types'

function parseLimit(text: string): number | null {
  const n = Number(text.replace(/[,_\s]/g, ''))
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

/**
 * Presented modally; resolves through `dismiss(profile)` so `App` stays the
 * single owner of the profile array. The token does not travel back with the
 * profile: it is written to the Keychain here on save.
 */
export function ProfileEditor({ existing }: { existing?: Profile }) {
  const dismiss = Navigation.useDismiss()
  const editing = existing != null

  const [id] = useState(existing?.id ?? UUID.string())
  const [alias, setAlias] = useState(existing?.alias ?? '')
  const [tokenInput, setTokenInput] = useState('')
  const [hasStoredToken] = useState(() =>
    editing ? getToken(existing!.id) != null : false
  )
  const [accounts, setAccounts] = useState<CFAccount[]>(() =>
    existing != null
      ? [{ id: existing.accountId, name: existing.accountName }]
      : []
  )
  const [accountId, setAccountId] = useState(existing?.accountId ?? '')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const [plan, setPlan] = useState<Plan>(existing?.plan ?? 'free')
  const limits = existing?.limits ?? defaultLimits
  const [daily, setDaily] = useState(String(limits.dailyRequests))
  const [monthly, setMonthly] = useState(String(limits.monthlyRequests))
  const [cpu, setCpu] = useState(String(limits.monthlyCpuMs))
  const [billingDay, setBillingDay] = useState(existing?.billingDay ?? 1)
  const [thresholds, setThresholds] = useState<number[]>(
    existing?.thresholds ?? defaultThresholds
  )

  const token =
    tokenInput.trim() !== '' ? tokenInput.trim() : editing ? getToken(id) : null

  const verify = async () => {
    if (token == null || token === '') return
    setVerifying(true)
    setVerifyError(null)
    const res = await verifyToken(token)
    setVerifying(false)
    if (!res.ok) {
      setVerifyError(failureText(res))
      return
    }
    setAccounts(res.value)
    if (!res.value.some((a) => a.id === accountId)) {
      setAccountId(res.value.length > 0 ? res.value[0].id : '')
    }
    if (alias.trim() === '' && res.value.length > 0) setAlias(res.value[0].name)
  }

  const parsed: Limits | null = (() => {
    const d = parseLimit(daily)
    const m = parseLimit(monthly)
    const c = parseLimit(cpu)
    return d != null && m != null && c != null
      ? { dailyRequests: d, monthlyRequests: m, monthlyCpuMs: c }
      : null
  })()

  const account = accounts.find((a) => a.id === accountId)
  const canSave =
    alias.trim() !== '' &&
    account != null &&
    parsed != null &&
    (tokenInput.trim() !== '' || hasStoredToken)

  const save = () => {
    if (!canSave) return
    if (tokenInput.trim() !== '') setToken(id, tokenInput.trim())
    const profile: Profile = {
      id,
      alias: alias.trim(),
      accountId: account!.id,
      accountName: account!.name,
      plan,
      limits: parsed!,
      billingDay: clampBillingDay(billingDay),
      thresholds: [...thresholds].sort((a, b) => a - b),
      watched: existing?.watched ?? [],
      sortIndex: existing?.sortIndex ?? Number.MAX_SAFE_INTEGER,
      createdAt: existing?.createdAt ?? Date.now()
    }
    dismiss(profile)
  }

  const toggleThreshold = (t: number, on: boolean) => {
    setThresholds((prev) =>
      on ? Array.from(new Set([...prev, t])) : prev.filter((x) => x !== t)
    )
  }

  const limitField = (
    title: string,
    value: string,
    onChanged: (v: string) => void
  ) => (
    <HStack>
      <Text>{title}</Text>
      <Spacer />
      <TextField
        title={title}
        value={value}
        onChanged={onChanged}
        keyboardType="numberPad"
        multilineTextAlignment="trailing"
        foregroundStyle={parseLimit(value) == null ? 'systemRed' : 'label'}
        frame={{ maxWidth: 160 }}
      />
    </HStack>
  )

  return (
    <NavigationStack>
      <Form
        navigationTitle={editing ? i18n.editProfile : i18n.addProfile}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [
            <Button title={i18n.cancel} action={() => dismiss()} />
          ],
          topBarTrailing: [
            <Button title={i18n.save} action={save} disabled={!canSave} />
          ]
        }}
      >
        <Section
          footer={
            <Text>
              {hasStoredToken
                ? `${i18n.tokenStored}\n\n${i18n.tokenHelp}`
                : i18n.tokenHelp}
            </Text>
          }
        >
          <TextField
            title={i18n.alias}
            prompt={i18n.aliasPrompt}
            value={alias}
            onChanged={setAlias}
          />
          <SecureField
            title={i18n.token}
            prompt={i18n.tokenPrompt}
            value={tokenInput}
            onChanged={setTokenInput}
          />
          <Button
            action={verify}
            disabled={verifying || token == null || token === ''}
          >
            <HStack>
              <Text>{verifying ? i18n.verifying : i18n.verify}</Text>
              <Spacer />
              {verifying ? <ProgressView progressViewStyle="circular" /> : null}
            </HStack>
          </Button>
          {verifyError != null ? (
            <Text font="caption" foregroundStyle="systemRed">
              {verifyError}
            </Text>
          ) : null}
        </Section>

        <Section>
          {accounts.length === 0 ? (
            <Text foregroundStyle="secondaryLabel">{i18n.pickAccount}</Text>
          ) : (
            <Picker
              title={i18n.account}
              value={accountId}
              onChanged={(value: string) => setAccountId(value)}
            >
              {accounts.map((a) => (
                <Text key={a.id} tag={a.id}>
                  {a.name}
                </Text>
              ))}
            </Picker>
          )}
        </Section>

        <Section
          header={<Text>{i18n.limits}</Text>}
          footer={
            <Text>
              {plan === 'free' ? i18n.limitsFooterFree : i18n.limitsFooterPaid}
            </Text>
          }
        >
          <Picker
            title={i18n.plan}
            value={plan}
            onChanged={(value: string) => setPlan(value as Plan)}
            pickerStyle="segmented"
          >
            <Text tag="free">{i18n.planFree}</Text>
            <Text tag="paid">{i18n.planPaid}</Text>
          </Picker>
          {plan === 'free'
            ? limitField(i18n.dailyRequests, daily, setDaily)
            : [
                limitField(i18n.monthlyRequests, monthly, setMonthly),
                limitField(i18n.monthlyCpu, cpu, setCpu),
                <Stepper
                  onIncrement={() =>
                    setBillingDay((d) => clampBillingDay(d + 1))
                  }
                  onDecrement={() =>
                    setBillingDay((d) => clampBillingDay(d - 1))
                  }
                >
                  <Text>{i18n.billingDay(billingDay)}</Text>
                </Stepper>
              ]}
        </Section>

        <Section
          header={<Text>{i18n.thresholds}</Text>}
          footer={<Text>{i18n.thresholdsFooter}</Text>}
        >
          {THRESHOLD_CHOICES.map((t) => (
            <Toggle
              key={String(t)}
              title={`${t}%`}
              value={thresholds.includes(t)}
              onChanged={(on: boolean) => toggleThreshold(t, on)}
            />
          ))}
        </Section>
      </Form>
    </NavigationStack>
  )
}
