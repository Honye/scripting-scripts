import {
  Button,
  Form,
  HStack,
  Navigation,
  NavigationStack,
  SecureField,
  Section,
  Spacer,
  Text,
  TextField,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { currencySymbol, parseAmount } from '../format'
import { DEFAULT_REGION, currencyFor, regionFor, regionName } from '../regions'
import { clearPassword, hasPassword, setPassword } from '../credentials'
import { AmountField } from '../components/AmountField'
import { CurrencyPicker } from '../components/CurrencyPicker'
import { RegionPicker } from '../components/RegionPicker'
import type { Region } from '../regions'
import type { Account } from '../types'

/**
 * Presented modally; resolves through `dismiss(account)` so the caller stays the
 * single owner of the account array. Cancelling — including a swipe-down —
 * resolves with `undefined`.
 *
 * The password is the one thing that does not travel back with the account: it
 * is written straight to the Keychain here, and only the `hasPassword` flag
 * rides along in the returned object.
 */
export function AccountEditor({ existing }: { existing?: Account }) {
  const dismiss = Navigation.useDismiss()
  const editing = existing != null

  const [id] = useState(existing?.id ?? UUID.string())
  const [alias, setAlias] = useState(existing?.alias ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [region, setRegion] = useState(existing?.region ?? DEFAULT_REGION)
  const [currency, setCurrency] = useState(
    existing?.currency ?? currencyFor(DEFAULT_REGION)
  )
  const [balance, setBalance] = useState(
    existing != null ? String(existing.balance) : ''
  )
  const [note, setNote] = useState(existing?.note ?? '')
  const [password, setPasswordInput] = useState('')
  const [stored, setStored] = useState(() => (editing ? hasPassword(id) : false))

  const parsedBalance = balance.trim() === '' ? 0 : parseAmount(balance)
  const balanceInvalid = parsedBalance == null
  const canSave = alias.trim().length > 0 && !balanceInvalid

  // Currency follows the region unless the user has overridden it for this
  // account — a region change is far more often a correction than a mismatch.
  const pickRegion = async () => {
    const picked = await Navigation.present<Region | undefined>({
      element: <RegionPicker selected={region} />
    })
    if (picked == null) return
    if (currency === currencyFor(region)) setCurrency(picked.currency)
    setRegion(picked.code)
  }

  const pickCurrency = async () => {
    const picked = await Navigation.present<string | undefined>({
      element: <CurrencyPicker selected={currency} />
    })
    if (picked != null) setCurrency(picked)
  }

  const handleSave = () => {
    const amount = parsedBalance ?? 0
    const balanceChanged = existing == null || existing.balance !== amount

    if (password.length > 0) {
      setPassword(id, password)
    }

    const account: Account = {
      id,
      alias: alias.trim(),
      region,
      currency,
      email: email.trim(),
      hasPassword: password.length > 0 || stored,
      balance: amount,
      // Only stamp a fresh timestamp when the number actually moved, so opening
      // and saving the editor does not disguise a stale balance as current.
      balanceUpdatedAt: balanceChanged
        ? Date.now()
        : (existing?.balanceUpdatedAt ?? Date.now()),
      note: note.trim(),
      sortIndex: existing?.sortIndex ?? Number.MAX_SAFE_INTEGER,
      createdAt: existing?.createdAt ?? Date.now()
    }
    dismiss(account)
  }

  const handleRemovePassword = async () => {
    const ok = await Dialog.confirm({
      title: i18n.removePassword,
      message: i18n.removePasswordConfirm,
      cancelLabel: i18n.cancel,
      confirmLabel: i18n.delete
    })
    if (!ok) return
    clearPassword(id)
    setPasswordInput('')
    setStored(false)
  }

  return (
    <NavigationStack>
      <Form
        navigationTitle={editing ? i18n.editAccount : i18n.newAccount}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [<Button title={i18n.cancel} action={() => dismiss()} />],
          topBarTrailing: [
            <Button title={i18n.save} action={handleSave} disabled={!canSave} />
          ]
        }}
      >
        <Section footer={<Text>{i18n.currencyHint}</Text>}>
          <TextField
            title={i18n.accountAlias}
            prompt={i18n.accountAliasPrompt}
            value={alias}
            onChanged={setAlias}
          />
          <Button action={pickRegion}>
            <HStack>
              <Text foregroundStyle="label">{i18n.accountRegion}</Text>
              <Spacer />
              <Text foregroundStyle="secondaryLabel">
                {regionFor(region).flag} {regionName(regionFor(region))}
              </Text>
            </HStack>
          </Button>
          <Button action={pickCurrency}>
            <HStack>
              <Text foregroundStyle="label">{i18n.accountCurrency}</Text>
              <Spacer />
              <Text foregroundStyle="secondaryLabel">
                {currencySymbol(currency)} {currency}
              </Text>
            </HStack>
          </Button>
        </Section>

        <Section header={<Text>{i18n.accountBalance}</Text>}>
          <AmountField
            title={i18n.accountBalance}
            currency={currency}
            value={balance}
            onChanged={setBalance}
            invalid={balanceInvalid}
          />
        </Section>

        <Section
          header={<Text>{i18n.accountEmail}</Text>}
          footer={
            <Text>
              {stored ? i18n.passwordKeepExisting : i18n.passwordFieldHint}
            </Text>
          }
        >
          <TextField
            title={i18n.accountEmail}
            prompt={i18n.accountEmailPrompt}
            value={email}
            onChanged={setEmail}
            keyboardType="emailAddress"
            textInputAutocapitalization="never"
            autocorrectionDisabled={true}
          />
          <SecureField
            title={i18n.accountPassword}
            prompt={stored ? i18n.passwordStored : i18n.optional}
            value={password}
            onChanged={setPasswordInput}
          />
          {stored ? (
            <Button
              title={i18n.removePassword}
              role="destructive"
              action={handleRemovePassword}
            />
          ) : null}
        </Section>

        <Section header={<Text>{i18n.accountNote}</Text>}>
          <TextField
            title={i18n.accountNote}
            prompt={i18n.optional}
            value={note}
            onChanged={setNote}
            axis="vertical"
          />
        </Section>
      </Form>
    </NavigationStack>
  )
}
