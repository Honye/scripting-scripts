/**
 * Data model for Storefront. See .specify/2026-09-04-storefront/spec.md section 3.
 *
 * Passwords never appear in these types: they live in the Keychain, keyed by
 * `Account.id`, and are reached only through `credentials.ts`.
 */

/** An Apple account, bound to exactly one storefront region. */
export type Account = {
  id: string
  /** User-defined nickname, required. */
  alias: string
  /** ISO 3166-1 alpha-2, lowercase — also the App Store URL path segment. */
  region: string
  /** ISO 4217, derived from `region` but overridable. */
  currency: string
  email: string
  /** Whether a password is stored in the Keychain. The password itself is not here. */
  hasPassword: boolean
  /** Prepaid balance, in `currency`. Maintained by hand — Apple exposes no API. */
  balance: number
  /** When `balance` was last edited, used for the staleness hint. */
  balanceUpdatedAt: number
  note: string
  sortIndex: number
  createdAt: number
}

/** Cached App Store metadata, shared by every entry pointing at the same app. */
export type AppRef = {
  /** Numeric App Store id, primary key. */
  appId: string
  name: string
  iconUrl: string
  bundleId?: string
  /** Which storefront the metadata came from — names and prices are localized. */
  fetchedRegion: string
  fetchedAt: number
}

export type EntryKind = 'purchase' | 'iap' | 'subscription'

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'custom'

/**
 * A purchase, an in-app purchase or a subscription. One type rather than three
 * because they share `app × account × price`, and users ask cross-kind questions
 * like "how much have I spent on this app in total".
 */
export type Entry = {
  id: string
  kind: EntryKind
  appId: string
  accountId: string
  /** App name for `purchase`; the in-app item name for `iap` / `subscription`. */
  title: string
  price: number
  /** Kept per entry: a historical price does not follow the account's currency. */
  currency: string
  priceSource: 'fetched' | 'manual'
  purchasedAt?: number

  // subscription only
  cycle?: BillingCycle
  customCycleDays?: number
  nextBillingAt?: number
  active?: boolean

  note: string
}

export type TFStatus = 'open' | 'full' | 'closed' | 'invalid' | 'unknown'

export type TFItem = {
  id: string
  /** Optional: a TestFlight build has no App Store entry until it ships. */
  appId?: string
  name: string
  /** https://testflight.apple.com/join/{code} */
  joinUrl: string
  accountId?: string
  status: TFStatus
  statusCheckedAt?: number
  /** Set when the user overrides the detected status; manual wins. */
  statusIsManual?: boolean
  note: string
}

export type Settings = {
  /** Days before a billing date to fire the reminder, 0-14. */
  reminderLeadDays: number
  /** FR-SW-06: the "iOS will not let us do this for you" note is shown once. */
  switchGuideIntroSeen: boolean
  /** FR-TF-09: the "this is not for racing slots" note is shown once. */
  tfNoticeSeen: boolean
}

export const defaultSettings: Settings = {
  reminderLeadDays: 3,
  switchGuideIntroSeen: false,
  tfNoticeSeen: false
}

export type GiftCardStatus = 'available' | 'redeemed'

/** Apple's own gift card artwork, by the name in its image URL. */
export type GiftCardDesign = 'geode' | 'fogcamo' | 'lofi' | 'convo' | 'melted'

/**
 * An Apple Gift Card the user holds. Like `Account`, the secret is not here:
 * the full code lives in the Keychain, keyed by `GiftCard.id`, and is reached
 * only through `credentials.ts`.
 */
export type GiftCard = {
  id: string
  /** Storefront the card was issued for — Apple only redeems it there. */
  region: string
  /** ISO 4217, derived from `region` but overridable. */
  currency: string
  /** Face value, in `currency`. */
  amount: number
  /**
   * HMAC of the normalized code under a key that never leaves this device's
   * Keychain. Lets the editor reject a duplicate without reading any stored
   * code, and is useless to anyone holding only a backup.
   */
  codeHash: string
  /** Which artwork the card shows; unset picks one from `id` (see `designFor`). */
  design?: GiftCardDesign
  status: GiftCardStatus
  redeemedAt?: number
  /** Which account it went into; cleared if that account is deleted. */
  redeemedAccountId?: string
  note: string
  createdAt: number
}
