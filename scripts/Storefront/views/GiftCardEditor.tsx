import {
  Button,
  Form,
  HStack,
  Image,
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
import {
  giftCodeFingerprint,
  hasGiftCode,
  revealGiftCode,
  setGiftCode
} from '../credentials'
import { looksLikeAppleCode, normalizeCode } from '../gift_wallet'
import { AmountField } from '../components/AmountField'
import { CurrencyPicker } from '../components/CurrencyPicker'
import { RegionPicker } from '../components/RegionPicker'
import type { Region } from '../regions'
import type { GiftCard } from '../types'

/** Fixed-width mask, one dot per character of an Apple code; never sized to the real one. */
const MASK = '●'.repeat(16)

/**
 * Presented modally; resolves through `dismiss(card)` like `AccountEditor`.
 *
 * The code does not travel back with the card. It is written straight to the
 * Keychain on save, and only its last four characters and a keyed fingerprint
 * ride along — the fingerprint is what `others` is checked against, so catching
 * a duplicate never needs a stored code to be read.
 */
export function GiftCardEditor({
  existing,
  others,
  defaultRegion
}: {
  existing?: GiftCard
  /** Every other card in the wallet, for the duplicate check. */
  others: GiftCard[]
  defaultRegion?: string
}) {
  const dismiss = Navigation.useDismiss()
  const editing = existing != null
  const initialRegion = existing?.region ?? defaultRegion ?? DEFAULT_REGION

  const [id] = useState(existing?.id ?? UUID.string())
  const [region, setRegion] = useState(initialRegion)
  const [currency, setCurrency] = useState(
    existing?.currency ?? currencyFor(initialRegion)
  )
  const [amount, setAmount] = useState(
    existing != null ? String(existing.amount) : ''
  )
  const [code, setCode] = useState('')
  const [note, setNote] = useState(existing?.note ?? '')
  const [stored] = useState(() => (editing ? hasGiftCode(id) : false))
  const [revealed, setRevealed] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const parsedAmount = parseAmount(amount)
  const amountInvalid = amount.trim() !== '' && parsedAmount == null
  const normalized = normalizeCode(code)
  const shapeWarning = normalized !== '' && !looksLikeAppleCode(normalized)
  // A new card is nothing without its code; an existing one may keep the
  // stored code by leaving the field blank.
  const canSave =
    parsedAmount != null && parsedAmount > 0 && (normalized !== '' || stored)

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

  const handleSave = async () => {
    let codeHash = existing?.codeHash ?? ''

    if (normalized !== '') {
      const fingerprint = giftCodeFingerprint(normalized)
      if (others.some((c) => c.id !== id && c.codeHash === fingerprint)) {
        await Dialog.alert({ message: i18n.giftCardDuplicate })
        return
      }
      setGiftCode(id, normalized)
      codeHash = fingerprint
    }

    const card: GiftCard = {
      id,
      region,
      currency,
      amount: parsedAmount ?? 0,
      codeHash,
      status: existing?.status ?? 'available',
      redeemedAt: existing?.redeemedAt,
      redeemedAccountId: existing?.redeemedAccountId,
      note: note.trim(),
      createdAt: existing?.createdAt ?? Date.now()
    }
    dismiss(card)
  }

  /** Same one-gesture reveal as the account password, minus the copy. */
  const toggleCode = async () => {
    if (revealed != null) {
      setRevealed(null)
      setStatus('')
      return
    }
    const result = await revealGiftCode(id, i18n.giftCardAuthReason)
    if (result.ok) {
      setRevealed(result.password)
      setStatus('')
      return
    }
    setStatus(
      result.reason === 'unavailable'
        ? i18n.authUnavailable
        : result.reason === 'missing'
          ? i18n.giftCardCodeMissing
          : i18n.giftCardAuthDenied
    )
  }

  const copyRevealed = async () => {
    if (revealed == null) return
    await Pasteboard.setString(revealed)
    setStatus(i18n.giftCardCopied)
  }

  return (
    <NavigationStack>
      <Form
        navigationTitle={editing ? i18n.giftCardEdit : i18n.giftCardNew}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [
            <Button title={i18n.cancel} action={() => dismiss()} />
          ],
          topBarTrailing: [
            <Button title={i18n.save} action={handleSave} disabled={!canSave} />
          ]
        }}
      >
        <Section footer={<Text>{i18n.giftCardRegionHint}</Text>}>
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
          <AmountField
            title={i18n.giftCardAmount}
            currency={currency}
            value={amount}
            onChanged={setAmount}
            invalid={amountInvalid}
          />
        </Section>

        <Section
          header={<Text>{i18n.giftCardCode}</Text>}
          footer={
            shapeWarning ? (
              <Text foregroundStyle="systemOrange">
                {i18n.giftCardCodeShape}
              </Text>
            ) : status !== '' ? (
              <Text foregroundStyle="secondaryLabel">{status}</Text>
            ) : (
              <Text>{i18n.giftCardCodeHint}</Text>
            )
          }
        >
          {stored ? (
            <Button action={toggleCode}>
              <HStack>
                <Text
                  foregroundStyle="secondaryLabel"
                  font={revealed == null ? 'footnote' : undefined}
                  fontDesign={revealed == null ? undefined : 'monospaced'}
                  kerning={revealed == null ? 3 : undefined}
                  lineLimit={1}
                >
                  {revealed ?? MASK}
                </Text>
                <Spacer />
                <Image
                  systemName={revealed == null ? 'faceid' : 'eye.slash'}
                  font="body"
                  foregroundStyle="tertiaryLabel"
                />
              </HStack>
            </Button>
          ) : editing ? (
            <Text foregroundStyle="systemOrange">
              {i18n.giftCardCodeMissing}
            </Text>
          ) : null}
          {revealed != null ? (
            <Button title={i18n.copy} action={copyRevealed} />
          ) : null}
          <SecureField
            title={i18n.giftCardCode}
            prompt={stored ? i18n.giftCardCodeStored : i18n.giftCardCodePrompt}
            value={code}
            onChanged={setCode}
          />
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
