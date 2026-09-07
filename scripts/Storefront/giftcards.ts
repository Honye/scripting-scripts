/**
 * Apple gift card purchase links, and the third-party channel slot.
 *
 * **Every URL in `OFFICIAL` was verified to return 200 at its own address.**
 * That check matters, because FR-GIFT-02 forbids sending the user to a dead
 * link and the failures are not guessable:
 *
 *  - Korea and Singapore *look* fine — `/kr/shop/gift-cards` answers 200 — but
 *    they redirect to `/kr/store`, a generic storefront. A user who tapped
 *    "buy a gift card" would land somewhere else entirely with no explanation.
 *  - Greece, Israel, Indonesia and South Africa answer a plain 404.
 *  - Switzerland, Belgium and Saudi Arabia only exist under a language-suffixed
 *    path (`ch-de`, `be-fr`, `sa-en`), not under the bare country code.
 *
 * A region absent from this map has no online channel we can vouch for, and the
 * UI says exactly that rather than linking anywhere.
 */
export const OFFICIAL: Record<string, string> = {
  ae: 'https://www.apple.com/ae/shop/gift-cards',
  at: 'https://www.apple.com/at/shop/gift-cards',
  au: 'https://www.apple.com/au/shop/gift-cards',
  be: 'https://www.apple.com/be-fr/shop/gift-cards',
  br: 'https://www.apple.com/br/shop/gift-cards',
  ca: 'https://www.apple.com/ca/shop/gift-cards',
  ch: 'https://www.apple.com/ch-de/shop/gift-cards',
  cn: 'https://www.apple.com.cn/shop/gift-cards',
  cz: 'https://www.apple.com/cz/shop/gift-cards',
  de: 'https://www.apple.com/de/shop/gift-cards',
  dk: 'https://www.apple.com/dk/shop/gift-cards',
  es: 'https://www.apple.com/es/shop/gift-cards',
  fi: 'https://www.apple.com/fi/shop/gift-cards',
  fr: 'https://www.apple.com/fr/shop/gift-cards',
  gb: 'https://www.apple.com/uk/shop/gift-cards',
  hk: 'https://www.apple.com/hk/shop/gift-cards',
  hu: 'https://www.apple.com/hu/shop/gift-cards',
  ie: 'https://www.apple.com/ie/shop/gift-cards',
  in: 'https://www.apple.com/in/shop/gift-cards',
  it: 'https://www.apple.com/it/shop/gift-cards',
  jp: 'https://www.apple.com/jp/shop/gift-cards',
  mx: 'https://www.apple.com/mx/shop/gift-cards',
  my: 'https://www.apple.com/my/shop/gift-cards',
  nl: 'https://www.apple.com/nl/shop/gift-cards',
  no: 'https://www.apple.com/no/shop/gift-cards',
  nz: 'https://www.apple.com/nz/shop/gift-cards',
  ph: 'https://www.apple.com/ph/shop/gift-cards',
  pl: 'https://www.apple.com/pl/shop/gift-cards',
  pt: 'https://www.apple.com/pt/shop/gift-cards',
  sa: 'https://www.apple.com/sa-en/shop/gift-cards',
  se: 'https://www.apple.com/se/shop/gift-cards',
  th: 'https://www.apple.com/th/shop/gift-cards',
  tr: 'https://www.apple.com/tr/shop/gift-cards',
  tw: 'https://www.apple.com/tw/shop/gift-cards',
  us: 'https://www.apple.com/shop/gift-cards',
  vn: 'https://www.apple.com/vn/shop/gift-cards'
}

export function officialGiftCardUrl(region: string): string | null {
  return OFFICIAL[region] ?? null
}

/**
 * Apple's redeem page. Distinct from buying: this is where an already-purchased
 * code gets applied. Available in every storefront.
 */
export function redeemUrl(): string {
  return 'https://apps.apple.com/redeem'
}

export type Channel = {
  id: string
  /** Region codes this channel serves; empty means "any". */
  regions: string[]
  name: string
  url: string
  /** FR-GIFT-06: shown with an explicit "Sponsored" tag when true. */
  sponsored: boolean
  order: number
}

/**
 * Third-party resale channels (D5: hard-coded here, no remote config).
 *
 * Entries here are chosen by the app's author, not by this code: these links
 * carry an implied endorsement, and the sponsor slot is a commercial
 * relationship. Whatever ends up listed, the disclaimer in `GiftCards.tsx`
 * stays on screen (FR-GIFT-05) and this section never mixes with Apple's
 * (FR-GIFT-04).
 *
 * `regions: []` means the channel is offered for every storefront.
 * `sponsored: true` adds the "Sponsored" tag FR-GIFT-06 requires — set it only
 * for an actual paid placement, because the tag is a disclosure to the user.
 */
export const CHANNELS: Channel[] = [
  {
    id: 'seagm',
    regions: [],
    name: 'SEAGM',
    url: 'https://www.seagm.com/',
    sponsored: false,
    order: 1
  }
]

export function channelsFor(region: string): Channel[] {
  return CHANNELS.filter(
    (channel) => channel.regions.length === 0 || channel.regions.includes(region)
  ).sort((a, b) => a.order - b.order)
}
