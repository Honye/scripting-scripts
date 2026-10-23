import {
  AppEvents,
  Button,
  ForEach,
  HStack,
  Image,
  List,
  Navigation,
  Section,
  Spacer,
  Text,
  VStack,
  useEffect,
  useObservable,
  useRef,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { formatDate, formatMoney } from '../format'
import { regionFor, regionName } from '../regions'
import { hasGiftCode, revealAndCopyGiftCode } from '../credentials'
import {
  checkRedeemable,
  creditAccount,
  markRedeemed,
  redeemUrl,
  summarizeByRegion
} from '../gift_wallet'
import {
  getCurrentAccountId,
  loadAccounts,
  loadGiftCards,
  loadSettings
} from '../store'
import { GiftCardEditor } from './GiftCardEditor'
import { SwitchGuide } from './SwitchGuide'
import type { Account, GiftCard } from '../types'

/** Flag plus the localized name, e.g. "🇯🇵 Japan". */
function regionLabel(code: string): string {
  const region = regionFor(code)
  return `${region.flag} ${regionName(region)}`
}

/**
 * The gift card wallet: what the user holds, per region, and the redeem flow.
 *
 * Pushed, and reachable from two places — the account list and an account's
 * top-up sheet — so whatever props it was built with may already be old by the
 * time it opens. It therefore seeds itself from `Storage`, which `App` keeps
 * current on every change, and reports each edit upward; the parent stays the
 * persistence owner.
 *
 * Redeeming cannot be done for the user: iOS lets no app apply a code. What one
 * tap does here is gate on region, copy the code, and open the App Store's
 * redeem page with the code filled in. Coming back, we ask whether it worked —
 * the App Store tells us nothing.
 */
export function GiftCardWallet({
  focusRegion,
  onSaveCard,
  onDeleteCards,
  onUpsertAccount,
  onSetCurrent,
  onIntroSeen
}: {
  /** Only this region's cards, when opened from an account's top-up sheet. */
  focusRegion?: string
  onSaveCard: (card: GiftCard) => void
  onDeleteCards: (ids: string[]) => void
  onUpsertAccount: (account: Account) => void
  onSetCurrent: (accountId: string) => void
  onIntroSeen: () => void
}) {
  const [cards, setCards] = useState<GiftCard[]>(() => loadGiftCards())
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts())
  const [currentId, setCurrentId] = useState<string | null>(() =>
    getCurrentAccountId()
  )
  const [introSeen, setIntroSeen] = useState(
    () => loadSettings().switchGuideIntroSeen
  )
  const [showRedeemed, setShowRedeemed] = useState(false)
  const [status, setStatus] = useState('')

  // The scene-phase listener is registered once, so it reads through these
  // rather than through a stale closure.
  const cardsRef = useRef(cards)
  const accountsRef = useRef(accounts)
  cardsRef.current = cards
  accountsRef.current = accounts
  /** Set just before we leave for the App Store; the return prompt needs it. */
  const pending = useRef<{ cardId: string; accountId: string } | null>(null)

  const visible =
    focusRegion == null ? cards : cards.filter((c) => c.region === focusRegion)
  const available = visible
    .filter((c) => c.status === 'available')
    .sort(
      (a, b) => a.region.localeCompare(b.region) || a.createdAt - b.createdAt
    )
  const redeemed = visible
    .filter((c) => c.status === 'redeemed')
    .sort((a, b) => (b.redeemedAt ?? 0) - (a.redeemedAt ?? 0))
  const summary = summarizeByRegion(visible)

  // Both lists go through `ForEach` for the same reason AccountDetail's records
  // do: a swipe-delete against a plain `map()` crashes UIKit.
  const availableRows = useObservable<GiftCard[]>(() => available)
  const redeemedRows = useObservable<GiftCard[]>(() => redeemed)
  const orderKey = (list: GiftCard[]) => list.map((c) => c.id).join(',')

  useEffect(() => {
    availableRows.setValue(available)
    redeemedRows.setValue(redeemed)
  }, [cards])

  /**
   * A swipe has already taken the row out of `rows` by the time this runs.
   * Deleting a card also deletes its code, which nothing can bring back, so it
   * is confirmed first and the row is put back on cancel.
   */
  const handleRowsChanged = async (
    rows: Observable<GiftCard[]>,
    shown: GiftCard[]
  ) => {
    if (orderKey(rows.value) === orderKey(shown)) return
    const remaining = new Set(rows.value.map((c) => c.id))
    const removed = shown.filter((c) => !remaining.has(c.id)).map((c) => c.id)
    if (removed.length === 0) {
      rows.setValue(shown)
      return
    }
    const ok = await Dialog.confirm({
      title: i18n.giftCardDeleteTitle,
      message: i18n.giftCardDeleteBody(removed.length),
      cancelLabel: i18n.cancel,
      confirmLabel: i18n.delete
    })
    if (!ok) {
      rows.setValue(shown)
      return
    }
    const gone = new Set(removed)
    setCards((prev) => prev.filter((c) => !gone.has(c.id)))
    onDeleteCards(removed)
  }

  useEffect(() => {
    handleRowsChanged(availableRows, available)
  }, [availableRows.value])

  useEffect(() => {
    handleRowsChanged(redeemedRows, redeemed)
  }, [redeemedRows.value])

  const replaceCard = (card: GiftCard) => {
    setCards((prev) => {
      const index = prev.findIndex((c) => c.id === card.id)
      if (index < 0) return [...prev, card]
      const next = [...prev]
      next[index] = card
      return next
    })
    onSaveCard(card)
  }

  const replaceAccount = (account: Account) => {
    setAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)))
    onUpsertAccount(account)
  }

  const edit = async (card?: GiftCard) => {
    const saved = await Navigation.present<GiftCard | undefined>({
      element: (
        <GiftCardEditor
          existing={card}
          others={cards}
          defaultRegion={
            focusRegion ?? accounts.find((a) => a.id === currentId)?.region
          }
        />
      )
    })
    if (saved != null) replaceCard(saved)
  }

  /**
   * The current account is in the wrong region, or none is marked. Offers the
   * accounts that could take this card and walks through the switch guide for
   * the one picked. Resolves with that account once the user confirms they are
   * signed in to it, or null.
   */
  const resolveAccount = async (
    card: GiftCard,
    current: Account | null
  ): Promise<Account | null> => {
    const target = regionLabel(card.region)
    const title =
      current == null ? i18n.giftCardNoCurrentTitle : i18n.giftCardMismatchTitle
    const message =
      current == null
        ? i18n.giftCardNoCurrentBody(target)
        : i18n.giftCardMismatchBody(
            `${regionFor(current.region).flag} ${current.alias}`,
            target
          )
    const candidates = accounts.filter((a) => a.region === card.region)
    if (candidates.length === 0) {
      await Dialog.alert({
        title,
        message: `${message}\n\n${i18n.giftCardNoAccountInRegion(target)}`
      })
      return null
    }

    const index = await Dialog.actionSheet({
      title,
      message: `${message}\n\n${i18n.giftCardSwitchTo(target)}`,
      actions: candidates.map((a) => ({ label: a.alias }))
    })
    if (index == null || candidates[index] == null) return null
    const picked = candidates[index]

    let confirmed = false
    await Navigation.present({
      element: (
        <SwitchGuide
          account={picked}
          introSeen={introSeen}
          onIntroSeen={() => {
            setIntroSeen(true)
            onIntroSeen()
          }}
          onConfirmed={() => {
            confirmed = true
            setCurrentId(picked.id)
            onSetCurrent(picked.id)
          }}
        />
      )
    })
    return confirmed ? picked : null
  }

  const redeem = async (card: GiftCard) => {
    setStatus('')
    let account = accounts.find((a) => a.id === currentId) ?? null
    const check = checkRedeemable(card, account)
    if (!check.ok) {
      if (check.reason === 'redeemed') return
      account = await resolveAccount(card, account)
      if (account == null) return
    }
    // Belt and braces after the switch guide: it is the user who picked.
    if (account == null || account.region !== card.region) return

    const ok = await Dialog.confirm({
      title: i18n.giftCardRedeemTitle,
      message: i18n.giftCardRedeemBody(
        formatMoney(card.amount, card.currency),
        account.alias,
        regionFor(account.region).flag
      ),
      cancelLabel: i18n.cancel,
      confirmLabel: i18n.giftCardRedeemOpen
    })
    if (!ok) return

    const result = await revealAndCopyGiftCode(card.id, i18n.giftCardAuthReason)
    if (!result.ok) {
      setStatus(
        result.reason === 'unavailable'
          ? i18n.authUnavailable
          : result.reason === 'missing'
            ? i18n.giftCardCodeMissing
            : i18n.giftCardAuthDenied
      )
      return
    }

    pending.current = { cardId: card.id, accountId: account.id }
    // The prefilled page first; the bare redeem page if that is refused. The
    // code is on the clipboard either way.
    if (await Safari.openURL(redeemUrl(result.password))) {
      setStatus(i18n.giftCardCopied)
      return
    }
    if (await Safari.openURL(redeemUrl())) {
      setStatus(i18n.giftCardCopied)
      return
    }
    pending.current = null
    setStatus(i18n.giftCardOpenFailed)
  }

  /**
   * Marks the card redeemed into `accountId`, crediting the balance when the
   * currencies line up. Asked, never assumed: the App Store reports nothing
   * back, and a declined code looks exactly like a redeemed one from here.
   */
  const confirmRedeemed = async (cardId: string, accountId: string) => {
    const card = cardsRef.current.find((c) => c.id === cardId)
    const account = accountsRef.current.find((a) => a.id === accountId)
    if (card == null || account == null || card.status === 'redeemed') return

    const credited = creditAccount(account, card)
    const ok = await Dialog.confirm({
      title: i18n.giftCardDidRedeemTitle,
      message:
        credited != null
          ? i18n.giftCardDidRedeemBody(
              formatMoney(card.amount, card.currency),
              account.alias
            )
          : i18n.giftCardDidRedeemBodyNoCredit(account.alias, account.currency),
      cancelLabel: i18n.cancel,
      confirmLabel: i18n.giftCardDidRedeemYes
    })
    if (!ok) return
    replaceCard(markRedeemed(card, account.id))
    if (credited != null) replaceAccount(credited)
    setStatus('')
  }

  useEffect(() => {
    const listener = (phase: 'active' | 'inactive' | 'background') => {
      if (phase !== 'active' || pending.current == null) return
      const { cardId, accountId } = pending.current
      pending.current = null
      confirmRedeemed(cardId, accountId)
    }
    AppEvents.scenePhase.addListener(listener)
    return () => AppEvents.scenePhase.removeListener(listener)
  }, [])

  /**
   * The path that always works — the return prompt is best effort, and a card
   * may have been redeemed some other way. Asks which account took it, from
   * the accounts that could have.
   */
  const markManually = async (card: GiftCard) => {
    const candidates = accounts
      .filter((a) => a.region === card.region)
      .sort((a, b) => Number(b.id === currentId) - Number(a.id === currentId))
    const target = regionLabel(card.region)
    if (candidates.length === 0) {
      await Dialog.alert({ message: i18n.giftCardNoAccountInRegion(target) })
      return
    }
    const index =
      candidates.length === 1
        ? 0
        : await Dialog.actionSheet({
            title: i18n.giftCardMarkRedeemed,
            message: target,
            actions: candidates.map((a) => ({ label: a.alias }))
          })
    if (index == null || candidates[index] == null) return
    await confirmRedeemed(card.id, candidates[index].id)
  }

  /** Undo for a mistaken mark. The balance is left alone — fix it by hand. */
  const markAvailable = (card: GiftCard) => {
    replaceCard({
      ...card,
      status: 'available',
      redeemedAt: undefined,
      redeemedAccountId: undefined
    })
  }

  const accountAlias = (id?: string) =>
    accounts.find((a) => a.id === id)?.alias ?? i18n.giftCardDeletedAccount

  return (
    <List
      navigationTitle={
        focusRegion == null
          ? i18n.walletTitle
          : i18n.walletRegionTitle(regionFor(focusRegion).flag)
      }
      navigationBarTitleDisplayMode="inline"
      toolbar={{
        topBarTrailing: [
          <Button action={() => edit()}>
            <Image systemName="plus" />
          </Button>
        ]
      }}
    >
      {summary.length === 0 ? (
        <Section>
          <Text foregroundStyle="secondaryLabel">{i18n.walletEmpty}</Text>
        </Section>
      ) : (
        <Section header={<Text>{i18n.walletSummary}</Text>}>
          {summary.map((row) => (
            <HStack key={`${row.region}|${row.currency}`}>
              <Text font={22}>{regionFor(row.region).flag}</Text>
              <VStack alignment="leading" spacing={2}>
                <Text>{regionName(regionFor(row.region))}</Text>
                {row.redeemedCount > 0 ? (
                  <Text font="caption" foregroundStyle="secondaryLabel">
                    {i18n.walletRedeemedLine(
                      row.redeemedCount,
                      formatMoney(row.redeemedTotal, row.currency)
                    )}
                  </Text>
                ) : null}
              </VStack>
              <Spacer />
              <Text
                fontWeight="semibold"
                foregroundStyle={
                  row.availableCount > 0 ? 'label' : 'secondaryLabel'
                }
              >
                {i18n.walletAvailableLine(
                  row.availableCount,
                  formatMoney(row.availableTotal, row.currency)
                )}
              </Text>
            </HStack>
          ))}
        </Section>
      )}

      {/* Rendered even when empty: its footer is where redeem status lands. */}
      <Section
        header={
          available.length > 0 ? <Text>{i18n.walletAvailable}</Text> : undefined
        }
        footer={
          <Text foregroundStyle="secondaryLabel">
            {status !== '' ? status : i18n.walletFooter}
          </Text>
        }
      >
        <ForEach
          data={availableRows}
          editActions="delete"
          builder={(card) => (
            <Button
              key={card.id}
              action={() => edit(card)}
              leadingSwipeActions={{
                allowsFullSwipe: false,
                actions: [
                  <Button
                    title={i18n.giftCardMarkRedeemed}
                    action={() => markManually(card)}
                    tint="systemGreen"
                  />
                ]
              }}
            >
              <HStack>
                <Text font={22}>{regionFor(card.region).flag}</Text>
                <VStack alignment="leading" spacing={2}>
                  <Text fontWeight="semibold" foregroundStyle="label">
                    {formatMoney(card.amount, card.currency)}
                  </Text>
                  {/* No part of the code is shown here, not even a masked
                      tail; the only thing worth saying is when it is absent,
                      because then Redeem cannot work. */}
                  {hasGiftCode(card.id) ? null : (
                    <Text font="caption" foregroundStyle="systemOrange">
                      {i18n.giftCardCodeMissing}
                    </Text>
                  )}
                  {card.note.trim() === '' ? null : (
                    <Text
                      font="caption2"
                      foregroundStyle="tertiaryLabel"
                      lineLimit={1}
                    >
                      {card.note}
                    </Text>
                  )}
                </VStack>
                <Spacer />
                <Button
                  title={i18n.giftCardRedeemAction}
                  action={() => redeem(card)}
                  buttonStyle="borderedProminent"
                  controlSize="small"
                />
              </HStack>
            </Button>
          )}
        />
      </Section>

      {redeemed.length === 0 ? null : (
        <Section
          header={
            <HStack>
              <Text>{i18n.walletRedeemed}</Text>
              <Spacer />
              <Button
                title={showRedeemed ? i18n.walletHide : i18n.walletShow}
                action={() => setShowRedeemed(!showRedeemed)}
              />
            </HStack>
          }
        >
          {showRedeemed ? (
            <ForEach
              data={redeemedRows}
              editActions="delete"
              builder={(card) => (
                <HStack
                  key={card.id}
                  leadingSwipeActions={{
                    allowsFullSwipe: false,
                    actions: [
                      <Button
                        title={i18n.giftCardMarkAvailable}
                        action={() => markAvailable(card)}
                        tint="systemOrange"
                      />
                    ]
                  }}
                >
                  <Text font={22}>{regionFor(card.region).flag}</Text>
                  <VStack alignment="leading" spacing={2}>
                    <Text foregroundStyle="secondaryLabel">
                      {formatMoney(card.amount, card.currency)}
                    </Text>
                    <Text
                      font="caption"
                      foregroundStyle="tertiaryLabel"
                      lineLimit={1}
                    >
                      {i18n.giftCardRedeemedOn(
                        card.redeemedAt != null
                          ? formatDate(card.redeemedAt, i18n.dateLocale)
                          : '',
                        accountAlias(card.redeemedAccountId)
                      )}
                    </Text>
                  </VStack>
                  <Spacer />
                </HStack>
              )}
            />
          ) : null}
        </Section>
      )}
    </List>
  )
}
