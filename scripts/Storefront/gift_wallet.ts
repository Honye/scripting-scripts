/**
 * Gift card wallet rules. Pure — no `scripting` import and no App-side globals —
 * so the summary and the redeem gate can be asserted in Node.
 *
 * Kept apart from `giftcards.ts`, which is about where to *buy* a card; this
 * module is about the cards the user already holds.
 */
import type { Account, GiftCard, GiftCardDesign } from './types'

export const GIFT_CARD_DESIGNS: GiftCardDesign[] = [
  'geode',
  'fogcamo',
  'lofi',
  'convo',
  'melted'
]

/**
 * The card's chosen artwork, or a stable one derived from its id — so cards
 * saved before there was a choice still look the same every time.
 */
export function designFor(
  card: Pick<GiftCard, 'id' | 'design'>
): GiftCardDesign {
  if (card.design != null && GIFT_CARD_DESIGNS.includes(card.design)) {
    return card.design
  }
  let sum = 0
  for (let i = 0; i < card.id.length; i++) sum += card.id.charCodeAt(i)
  return GIFT_CARD_DESIGNS[sum % GIFT_CARD_DESIGNS.length]
}

/** Apple's artwork for the design: the logo alone, on a transparent square. */
export function designImageUrl(design: GiftCardDesign): string {
  return (
    'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/' +
    `giftcard-email-${design}-select-2021?wid=600&hei=600&fmt=png-alpha`
  )
}

/** Apple prints codes in groups and people paste them with spaces or dashes. */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, '')
}

/**
 * Apple Gift Card and App Store card codes are 16 characters starting with `X`.
 * Only ever a hint: older and promotional codes differ, and refusing to store a
 * real card because of its shape would be worse than storing a typo.
 */
export function looksLikeAppleCode(code: string): boolean {
  return /^X[A-Z0-9]{15}$/.test(code)
}

export type RegionSummary = {
  region: string
  currency: string
  availableCount: number
  availableTotal: number
  redeemedCount: number
  redeemedTotal: number
}

/**
 * One row per region × currency. Currency is part of the key on purpose: a
 * card whose currency was overridden must not be added into another currency's
 * total (FR-SUB-04 — amounts in different currencies are never summed).
 *
 * Sorted by the most money still waiting to be redeemed first; that is what the
 * summary is for.
 */
export function summarizeByRegion(cards: GiftCard[]): RegionSummary[] {
  const rows = new Map<string, RegionSummary>()
  for (const card of cards) {
    const key = `${card.region}|${card.currency}`
    let row = rows.get(key)
    if (row == null) {
      row = {
        region: card.region,
        currency: card.currency,
        availableCount: 0,
        availableTotal: 0,
        redeemedCount: 0,
        redeemedTotal: 0
      }
      rows.set(key, row)
    }
    if (card.status === 'redeemed') {
      row.redeemedCount += 1
      row.redeemedTotal += card.amount
    } else {
      row.availableCount += 1
      row.availableTotal += card.amount
    }
  }
  return Array.from(rows.values()).sort(
    (a, b) =>
      b.availableCount - a.availableCount ||
      a.region.localeCompare(b.region) ||
      a.currency.localeCompare(b.currency)
  )
}

export function availableIn(cards: GiftCard[], region: string): GiftCard[] {
  return cards.filter((c) => c.region === region && c.status === 'available')
}

/**
 * The App Store's redeem sheet — available in every storefront — with the code
 * filled in when one is given.
 * The user still has to tap Redeem there — iOS offers no way around that.
 */
export function redeemUrl(code?: string): string {
  const base = 'https://apps.apple.com/redeem'
  return code == null || code === ''
    ? base
    : `${base}?code=${encodeURIComponent(code)}`
}

export type RedeemBlock = 'redeemed' | 'no-current' | 'region-mismatch'

export type RedeemCheck = { ok: true } | { ok: false; reason: RedeemBlock }

/**
 * Apple only redeems a card on an account of the storefront it was issued for.
 * Checking first saves a round trip to an App Store error — but "current" is
 * the account the user marked as signed in, not one we can observe, so this is
 * only as good as that mark.
 */
export function checkRedeemable(
  card: GiftCard,
  current: Account | null
): RedeemCheck {
  if (card.status === 'redeemed') return { ok: false, reason: 'redeemed' }
  if (current == null) return { ok: false, reason: 'no-current' }
  if (current.region !== card.region)
    return { ok: false, reason: 'region-mismatch' }
  return { ok: true }
}

/**
 * The account after the card went in. The balance moves only when the account
 * keeps its books in the card's currency; otherwise the caller has to ask the
 * user, because we cannot know what the top-up came to.
 */
export function creditAccount(
  account: Account,
  card: GiftCard,
  now: number = Date.now()
): Account | null {
  if (account.currency !== card.currency) return null
  return {
    ...account,
    balance: Math.round((account.balance + card.amount) * 100) / 100,
    balanceUpdatedAt: now
  }
}

export function markRedeemed(
  card: GiftCard,
  accountId: string,
  now: number = Date.now()
): GiftCard {
  return {
    ...card,
    status: 'redeemed',
    redeemedAt: now,
    redeemedAccountId: accountId
  }
}
