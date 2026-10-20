import { STOREFRONT_IDS } from './regions_data'

/**
 * Opening the App Store on a given region's storefront.
 *
 * `itms-apps://` alone always lands on the signed-in account's storefront (D1).
 * The App Store also honours an undocumented `resetAndRedirect?dsf=<id>` URL
 * that switches the storefront it is *browsing* — the route storefront-switcher
 * apps on the App Store itself use. It changes nothing about the account:
 * prices shown are that region's, but buying still goes through whichever
 * account is signed in. That is why every label for this stays "browse".
 *
 * Undocumented means it can stop working with any iOS update, and the App Store
 * ignores an unknown `dsf` silently rather than failing — so there is nothing to
 * detect. The fallback below only covers the case we *can* see: no ID, or the
 * system refusing the URL outright.
 */
export function storefrontUrl(region: string): string | null {
  const id = STOREFRONT_IDS[region]
  if (id == null) return null
  const target = `/WebObjects/MZStore.woa/wa/viewGrouping?cc=${region}&mt=8`
  return (
    'itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/resetAndRedirect' +
    `?dsf=${id}&mt=8&url=${encodeURIComponent(target)}`
  )
}

export async function openStorefront(region: string): Promise<void> {
  const url = storefrontUrl(region)
  if (url != null && (await Safari.openURL(url))) return
  await Safari.openURL('itms-apps://')
}
