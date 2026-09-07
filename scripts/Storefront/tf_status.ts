import { i18n } from './i18n'
import { checkTF } from './api/testflight'
import type { TFItem, TFStatus } from './types'

export function tfStatusLabel(status: TFStatus): string {
  switch (status) {
    case 'open':
      return i18n.tfStatusOpen
    case 'full':
      return i18n.tfStatusFull
    case 'closed':
      return i18n.tfStatusClosed
    case 'invalid':
      return i18n.tfStatusInvalid
    default:
      return i18n.tfStatusUnknown
  }
}

export function tfStatusColor(
  status: TFStatus
): 'systemGreen' | 'systemOrange' | 'systemRed' | 'secondaryLabel' {
  switch (status) {
    case 'open':
      return 'systemGreen'
    case 'full':
      return 'systemOrange'
    case 'invalid':
      return 'systemRed'
    default:
      return 'secondaryLabel'
  }
}

export type TFRefreshResult = {
  item: TFItem
  /** True when this check is the transition that FR-TF-08 announces. */
  becameOpen: boolean
}

/**
 * Applies one check to one item, deciding what the stored record becomes.
 *
 * Two rules that are easy to get wrong and expensive to get wrong:
 *
 *  - **A manual status always wins** (FR-TF-04). Auto-detection may refresh the
 *    timestamp but must not touch the status, or the user's own correction gets
 *    silently reverted on the next refresh.
 *  - **`unknown` never overwrites a known status.** It means the page did not
 *    parse, which is a statement about our parser, not about the beta.
 */
export function applyCheck(
  item: TFItem,
  detected: { status: TFStatus; appName?: string; iconUrl?: string },
  now: number = Date.now()
): TFRefreshResult {
  const checked: TFItem = { ...item, statusCheckedAt: now }

  if (item.statusIsManual === true) {
    return { item: checked, becameOpen: false }
  }
  if (detected.status === 'unknown') {
    return { item: checked, becameOpen: false }
  }

  const becameOpen = item.status !== 'open' && detected.status === 'open'
  return {
    item: {
      ...checked,
      status: detected.status,
      // A blank name only ever gets filled in, never replaced: the user's own
      // label outranks Apple's page title.
      name: item.name.trim() !== '' ? item.name : (detected.appName ?? item.name)
    },
    becameOpen
  }
}

export async function refreshItem(
  item: TFItem,
  timeoutMs?: number
): Promise<TFRefreshResult | null> {
  const result = await checkTF(item.joinUrl, timeoutMs)
  // A network failure leaves the record exactly as it was — including its old
  // "last checked" time, which is the honest thing to show (FR-TF-09).
  if (!result.ok) return null
  return applyCheck(item, result.value)
}
