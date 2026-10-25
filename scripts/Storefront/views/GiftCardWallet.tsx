import {
  AppEvents,
  Button,
  Group,
  HStack,
  Image,
  ImageRenderer,
  LazyVGrid,
  Divider,
  Navigation,
  Rectangle,
  ScrollView,
  Spacer,
  Text,
  VStack,
  useEffect,
  useRef,
  useState
} from 'scripting'
import type { VirtualNode } from 'scripting'
import { i18n } from '../i18n'
import { formatMoney } from '../format'
import { regionFor, regionName } from '../regions'
import { revealAndCopyGiftCode, revealGiftCode } from '../credentials'
import type { CredentialFailure } from '../credentials'
import {
  checkRedeemable,
  creditAccount,
  markRedeemed,
  designFor,
  designImageUrl,
  redeemUrl,
  summarizeByRegion
} from '../gift_wallet'
import { GiftCardShareImage, GiftCardView } from '../components/GiftCardView'
import { GiftCardEditor } from './GiftCardEditor'
import { SwitchGuide } from './SwitchGuide'
import type { Account, GiftCard } from '../types'

/** Why a code could not be read, as status text. */
function codeFailure(reason: CredentialFailure): string {
  return reason === 'unavailable'
    ? i18n.authUnavailable
    : reason === 'missing'
      ? i18n.giftCardCodeMissing
      : i18n.giftCardAuthDenied
}

/** Flag plus the localized name, e.g. "🇯🇵 Japan". */
function regionLabel(code: string): string {
  const region = regionFor(code)
  return `${region.flag} ${regionName(region)}`
}

/**
 * The gift card wallet: what the user holds, per region, and the redeem flow.
 *
 * Mounted two ways: as its own tab, where it lives as long as the app and
 * `App` re-renders it with every change, and pushed from an account's top-up
 * sheet, narrowed to that region, where its props are whatever they were when
 * it was built. Either way it keeps local copies of what it edits, reports each
 * edit upward — the parent stays the persistence owner — and takes new props
 * whenever they arrive.
 *
 * Redeeming cannot be done for the user: iOS lets no app apply a code. What one
 * tap does here is gate on region, copy the code, and open the App Store's
 * redeem page with the code filled in. Coming back, we ask whether it worked —
 * the App Store tells us nothing.
 */
export function GiftCardWallet({
  cards: cardsProp,
  accounts: accountsProp,
  currentId: currentIdProp,
  introSeen: introSeenProp,
  focusRegion,
  onSaveCard,
  onDeleteCards,
  onUpsertAccount,
  onSetCurrent,
  onIntroSeen
}: {
  cards: GiftCard[]
  accounts: Account[]
  currentId: string | null
  /** `Settings.switchGuideIntroSeen`, for the switch guide redeem may open. */
  introSeen: boolean
  /** Only this region's cards, when opened from an account's top-up sheet. */
  focusRegion?: string
  onSaveCard: (card: GiftCard) => void
  onDeleteCards: (ids: string[]) => void
  onUpsertAccount: (account: Account) => void
  onSetCurrent: (accountId: string) => void
  onIntroSeen: () => void
}) {
  const [cards, setCards] = useState<GiftCard[]>(cardsProp)
  const [accounts, setAccounts] = useState<Account[]>(accountsProp)
  const [currentId, setCurrentId] = useState<string | null>(currentIdProp)
  const [introSeen, setIntroSeen] = useState(introSeenProp)

  // As a tab this view outlives any one edit: an account added on the other
  // tab, or a different one marked signed in, has to reach the redeem gate.
  useEffect(() => setCards(cardsProp), [cardsProp])
  useEffect(() => setAccounts(accountsProp), [accountsProp])
  useEffect(() => setCurrentId(currentIdProp), [currentIdProp])
  useEffect(() => setIntroSeen(introSeenProp), [introSeenProp])
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

  /** Deleting a card also deletes its code, which nothing can bring back. */
  const deleteCard = async (card: GiftCard) => {
    const ok = await Dialog.confirm({
      title: i18n.giftCardDeleteTitle,
      message: i18n.giftCardDeleteBody(1),
      cancelLabel: i18n.cancel,
      confirmLabel: i18n.delete
    })
    if (!ok) return
    setCards((prev) => prev.filter((c) => c.id !== card.id))
    onDeleteCards([card.id])
  }

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
      setStatus(codeFailure(result.reason))
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
   * A picture of the card with its code printed on it, handed to the share
   * sheet — for giving the card to someone. The code is read only now, behind
   * authentication, and the image lives in memory only: nothing is written to
   * disk or kept once the sheet closes.
   */
  const share = async (card: GiftCard) => {
    setStatus('')
    const result = await revealGiftCode(card.id, i18n.giftCardAuthReason)
    if (!result.ok) {
      setStatus(codeFailure(result.reason))
      return
    }
    try {
      const design = designFor(card)
      // The renderer snapshots once and will not wait for a network image.
      const artwork = await UIImage.fromURL(designImageUrl(design)).catch(
        () => null
      )
      const image = await ImageRenderer.toUIImage(
        <GiftCardShareImage
          design={design}
          region={card.region}
          amount={card.amount}
          currency={card.currency}
          code={result.password}
          artwork={artwork}
        />,
        // Square-cornered, so there is no transparency to keep.
        { scale: 2, opaque: true }
      )
      await ShareSheet.present([image])
    } catch {
      setStatus(i18n.giftCardShareFailed)
    }
  }

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

  /**
   * Just the card face. Everything a card can do — Redeem included — is in
   * its long-press menu; a tap opens the editor.
   */
  const cell = (card: GiftCard) => {
    const spent = card.status === 'redeemed'
    return (
      <Button key={card.id} action={() => edit(card)} buttonStyle="plain">
        <GiftCardView
          design={designFor(card)}
          region={card.region}
          amount={card.amount}
          currency={card.currency}
          redeemed={spent}
          menu={
            <Group>
              {spent ? null : (
                <Button
                  title={i18n.giftCardRedeemAction}
                  systemImage="giftcard"
                  action={() => redeem(card)}
                />
              )}
              {/* A spent code is worth nothing to whoever receives it. */}
              {spent ? null : (
                <Button
                  title={i18n.giftCardShare}
                  systemImage="square.and.arrow.up"
                  action={() => share(card)}
                />
              )}
              {spent ? (
                <Button
                  title={i18n.giftCardMarkAvailable}
                  systemImage="arrow.uturn.backward"
                  action={() => markAvailable(card)}
                />
              ) : (
                <Button
                  title={i18n.giftCardMarkRedeemed}
                  systemImage="checkmark.circle"
                  action={() => markManually(card)}
                />
              )}
              <Button
                title={i18n.edit}
                systemImage="square.and.pencil"
                action={() => edit(card)}
              />
              <Button
                title={i18n.delete}
                systemImage="trash"
                role="destructive"
                action={() => deleteCard(card)}
              />
            </Group>
          }
        />
      </Button>
    )
  }

  /**
   * Adaptive columns: as many as fit at the minimum width, so the count follows
   * the screen and its rotation — two on any phone held upright, more on its
   * side and on iPad, where the minimum is raised to keep cards full-size.
   */
  const grid = (list: GiftCard[]) => (
    <LazyVGrid
      columns={[
        {
          size: { type: 'adaptive', min: Device.isiPad ? 260 : 150 },
          spacing: 12
        }
      ]}
      spacing={12}
    >
      {list.map(cell)}
    </LazyVGrid>
  )

  const header = (title: string, trailing?: VirtualNode) => (
    <HStack padding={{ horizontal: 16, top: 8 }}>
      <Text
        font="subheadline"
        fontWeight="semibold"
        foregroundStyle="secondaryLabel"
      >
        {title}
      </Text>
      <Spacer />
      {trailing ?? null}
    </HStack>
  )

  const groupBox = {
    padding: { horizontal: 16, vertical: 4 },
    background: {
      style: 'secondarySystemGroupedBackground',
      shape: { type: 'rect', cornerRadius: 24, style: 'continuous' }
    }
  } as const

  /**
   * A ScrollView, not a List: inside a List the long-press menu lifts the
   * whole cell, and with the grid in one cell that was every card at once.
   * Here each card is its own view, so the menu lifts just the one pressed.
   * The grouped look is kept by hand.
   */
  return (
    <ScrollView
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
      // A view that ignores the safe area, not a bare colour: the colour stopped
      // at the safe area, so the strip behind the tab bar showed the default
      // background and the bar looked detached from the page.
      background={<Rectangle fill="systemGroupedBackground" ignoresSafeArea />}
    >
      <VStack
        alignment="leading"
        spacing={10}
        padding={{ horizontal: 20, vertical: 12 }}
      >
        {summary.length === 0 ? (
          <VStack
            frame={{ maxWidth: 'infinity', alignment: 'leading' }}
            {...groupBox}
          >
            <Text foregroundStyle="secondaryLabel" padding={{ vertical: 12 }}>
              {i18n.walletEmpty}
            </Text>
          </VStack>
        ) : (
          <VStack alignment="leading" spacing={10}>
            {header(i18n.walletSummary)}
            <VStack spacing={0} {...groupBox}>
              {summary.map((row, index) => (
                <VStack key={`${row.region}|${row.currency}`} spacing={0}>
                  {index === 0 ? null : <Divider />}
                  <HStack padding={{ vertical: 12 }}>
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
                </VStack>
              ))}
            </VStack>
          </VStack>
        )}

        {available.length === 0 ? null : (
          <VStack alignment="leading" spacing={10} padding={{ top: 14 }}>
            {header(i18n.walletAvailable)}
            {grid(available)}
          </VStack>
        )}

        {/* Always shown: it is where redeem status lands. */}
        <Text
          font="footnote"
          foregroundStyle="secondaryLabel"
          padding={{ horizontal: 16 }}
        >
          {status !== '' ? status : i18n.walletFooter}
        </Text>

        {redeemed.length === 0 ? null : (
          <VStack alignment="leading" spacing={10} padding={{ top: 14 }}>
            {header(
              i18n.walletRedeemed,
              <Button
                title={showRedeemed ? i18n.walletHide : i18n.walletShow}
                action={() => setShowRedeemed(!showRedeemed)}
              />
            )}
            {showRedeemed ? grid(redeemed) : null}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  )
}
