export const en = {
  appTitle: 'Storefront',
  dateLocale: 'en-US',

  // Common
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  add: 'Add',
  done: 'Done',
  edit: 'Edit',
  copy: 'Copy',
  copied: 'Copied',
  none: 'None',
  optional: 'Optional',

  // Accounts
  accountsTitle: 'Accounts',
  accountsEmpty: 'No accounts yet',
  accountsEmptyHint: 'Add an account to start tracking balances and subscriptions.',
  accountBalance: 'Balance',
  accountRegion: 'Region',
  accountAlias: 'Name',
  accountAliasPrompt: 'e.g. Main US account',
  accountEmail: 'Apple Account',
  accountEmailPrompt: 'name@example.com',
  accountPassword: 'Password',
  accountCurrency: 'Currency',
  currencyHint:
    'Defaults to the storefront’s usual currency. Apple bills some storefronts in USD instead — change it here if your receipts say otherwise.',
  searchRegion: 'Search country or region',
  searchRegionEmpty: 'No matching country or region',
  accountNote: 'Note',
  newAccount: 'New Account',
  editAccount: 'Edit Account',
  currentAccount: 'Signed in',
  markAsCurrent: 'Mark as the signed-in account',
  balanceUpdated: (days: number) =>
    days <= 0 ? 'Updated today' : `Updated ${days} day${days === 1 ? '' : 's'} ago`,
  balanceStale: 'Balance may be out of date',
  dueThisMonth: 'Due this month',
  nextBill: 'Next charge',
  noSubscriptions: 'No active subscriptions',
  otherCurrencyNote: (count: number) =>
    `${count} subscription${count === 1 ? '' : 's'} in another currency, shown separately`,
  alertSevere: 'Balance will not cover the next charge',
  alertWarn: 'Balance may run out within 30 days',

  // Password / credentials
  passwordStored: 'Stored in Keychain',
  passwordNotStored: 'Not stored',
  passwordFieldHint:
    'Optional. Stored in this script’s Keychain, never in the exported file. Leave empty to keep it out entirely.',
  passwordKeepExisting: 'Leave empty to keep the saved password',
  revealPassword: 'Show password',
  copyPassword: 'Copy password',
  removePassword: 'Remove saved password',
  removePasswordConfirm:
    'Delete the password saved in the Keychain for this account? The account itself is kept.',
  authReason: 'Authenticate to use the saved password',
  passwordCopied: 'Password copied — use it soon, then clear your clipboard.',
  authUnavailable:
    'This device has no passcode or biometrics enabled, so saved passwords cannot be unlocked.',
  authDenied: 'Authentication failed. The password was not shown.',
  passwordMissing: 'No password is saved for this account.',

  // Switch assistant (FR-SW-05: never claim this is automatic)
  switchAssistant: 'Switch assistant',
  switchAssistantSubtitle: 'Walks you through signing in to this account',
  switchIntroTitle: 'What this can and cannot do',
  switchIntroBody:
    'iOS does not allow any third-party app to sign in or change the App Store region for you. Storefront hands you the details and opens the App Store — the last steps are yours.',
  switchStep1: '1. Copy the account',
  switchStep2: '2. Copy the password',
  switchStep3: '3. Open the App Store',
  switchStep3Hint:
    'In the App Store, tap your avatar, sign out, then sign in with the account above.',
  openAppStore: 'Open App Store',
  switchConfirmTitle: 'Signed in?',
  switchConfirmBody: (alias: string) => `Did you sign in to ${alias}?`,
  switchConfirmYes: 'Yes, I signed in',
  switchDone: 'Marked as the signed-in account',
  emailMissing: 'Add the account address first',

  // Delete
  deleteAccount: 'Delete account',
  deleteAccountConfirm: (alias: string, entries: number, tf: number) => {
    const parts: string[] = []
    if (entries > 0) parts.push(`${entries} purchase/subscription record${entries === 1 ? '' : 's'} will be deleted`)
    if (tf > 0) parts.push(`${tf} TestFlight item${tf === 1 ? '' : 's'} will be unlinked`)
    const tail = parts.length > 0 ? ` ${parts.join('. ')}.` : ''
    return `Delete ${alias}? Its saved password will be removed from the Keychain.${tail}`
  },

  // Settings
  settings: 'Settings',
  reminderLeadDays: 'Remind me before a charge',
  reminderLeadDaysUnit: (days: number) => (days === 0 ? 'On the day' : `${days} day${days === 1 ? '' : 's'} before`),

  // App lookup / cross-storefront comparison
  appLookup: 'Find an app',
  appLookupPrompt: 'App name, App Store link, or id',
  appLookupHint:
    'Type a name to search, or paste an App Store link — links with or without the region and slug both work.',
  searchStorefront: 'Search in',
  searchAction: 'Search',
  searching: 'Searching…',
  searchResults: 'Results',
  searchResultsNote:
    'Names and prices are this storefront’s. Tap a result to compare it across your accounts’ storefronts.',
  searchEmpty: 'Nothing found in this storefront',
  appLookupInvalid: 'No app id found in that text',
  lookupAction: 'Look up',
  compareRegions: 'Storefronts',
  compareNoConversion:
    'Each storefront is shown in its own currency. Storefront deliberately never converts between them.',
  addRegion: 'Add a storefront',
  removeRegion: 'Remove',
  storePrice: 'Price',
  freePrice: 'Free',
  inAppPurchases: 'In-app purchases',
  loadIAP: 'Load in-app prices',
  loadingIAP: 'Loading in-app prices…',
  noIAP: 'No in-app purchases',
  iapPageWeightNote:
    'In-app prices come from the full product page, so they load one storefront at a time, on request.',
  openInAppStore: 'Open in App Store',
  retry: 'Retry',
  seller: 'Seller',
  version: 'Version',
  bundleId: 'Bundle ID',
  fetchError: (reason: string): string => {
    switch (reason) {
      case 'notfound':
        return 'Not available in this storefront'
      case 'timeout':
        return 'Timed out'
      case 'network':
        return 'Network error'
      case 'parse':
        return 'Apple changed the page format'
      case 'blocked':
        return 'Blocked: not an Apple address'
      default:
        return 'Request failed'
    }
  },

  // Entries (purchases, in-app purchases, subscriptions)
  entries: 'Records',
  entriesEmpty: 'Nothing recorded on this account yet',
  newEntry: 'New record',
  editEntry: 'Edit record',
  deleteEntry: 'Delete record',
  deleteEntryConfirm: (title: string) => `Delete "${title}"?`,
  kind: 'Type',
  kindPurchase: 'Paid app',
  kindIAP: 'In-app purchase',
  kindSubscription: 'Subscription',
  entryApp: 'App',
  entryAppPick: 'Choose an app',
  entryTitle: 'Item',
  entryTitlePromptPurchase: 'App name',
  entryTitlePromptIAP: 'What you bought',
  entryAccount: 'Account',
  entryPrice: 'Price',
  entryPurchasedAt: 'Purchased on',
  entryNextBilling: 'Next charge',
  entryCycle: 'Billing cycle',
  cycleMonthly: 'Monthly',
  cycleQuarterly: 'Quarterly',
  cycleYearly: 'Yearly',
  cycleCustom: 'Every N days',
  cycleCustomDays: 'Days',
  entryActive: 'Active',
  entryPaused: 'Paused',
  entryPausedNote: 'A paused subscription keeps its record but is left out of totals and alerts.',
  priceSourceFetched: 'From the App Store',
  priceSourceManual: 'Entered by hand',
  fetchPrice: 'Fetch price',
  pickIAPItem: 'Pick an in-app item',
  priceChangedTitle: 'Price has changed',
  priceChangedBody: (oldText: string, newText: string) =>
    `The App Store now says ${newText}; your record says ${oldText}. Update it?`,
  priceChangedKeep: 'Keep mine',
  priceChangedUpdate: 'Update',
  fetchFailedManual: 'Could not reach the App Store — enter the price by hand.',
  selectAppFirst: 'Choose an app first',

  // Upcoming bills / by-app views
  upcomingBills: 'Upcoming charges',
  upcomingEmpty: 'No subscriptions are due',
  byApp: 'By app',
  byAppEmpty: 'Nothing recorded yet',
  totalSpent: 'Total',
  totalSpentMixed: 'Totals are per currency — never combined across currencies.',
  entryCount: (count: number) => `${count} record${count === 1 ? '' : 's'}`,
  dueIn: (days: number) =>
    days < 0
      ? 'Overdue'
      : days === 0
        ? 'Today'
        : days === 1
          ? 'Tomorrow'
          : `In ${days} days`,

  // Alerts and notifications
  notifications: 'Reminders',
  notificationLead: 'Remind me',
  notificationLeadUnit: (days: number): string =>
    days === 0 ? 'On the charge date' : `${days} day${days === 1 ? '' : 's'} before`,
  notificationScheduled: (count: number) =>
    count === 0 ? 'Nothing scheduled' : `${count} reminder${count === 1 ? '' : 's'} scheduled`,
  notificationCap: (max: number) =>
    `Only the ${max} soonest charges are scheduled — iOS limits how many reminders every Scripting script can hold between them.`,
  notificationRefused:
    'iOS refused to schedule reminders. Allow notifications for Scripting in Settings, then reopen this screen.',
  notificationRefreshNow: 'Rebuild reminders',
  notifyTitle: (alias: string, title: string) => `${alias} · ${title}`,
  notifyBody: (
    amount: string,
    date: string,
    balance: string
  ) => `${amount} on ${date}. Balance ${balance}.`,
  notifyBodyShort: (
    amount: string,
    date: string,
    balance: string
  ) =>
    `${amount} on ${date}, but the balance will only be ${balance}. Top up, or open Storefront to correct the balance.`,
  notifyBodyForeign: (amount: string, date: string) =>
    `${amount} on ${date}. Billed in another currency — not counted against this balance.`,

  // Share-sheet quick add
  quickAdd: 'Add to Storefront',
  quickAddSaving: 'Saving…',
  quickAddSaved: 'Saved',
  quickAddNoAccounts: 'Add an account in Storefront first, then share again.',
  quickAddBadUrl:
    'That is not an App Store link. Share an app from the App Store, or paste its link into Storefront.',
  quickAddNoInput: 'Nothing was shared.',
  quickAddLoading: 'Reading app details…',
  quickAddOffline:
    'Could not reach the App Store. You can still save this and fill in the details later.',
  quickAddDuplicateTitle: 'Already recorded',
  quickAddDuplicateBody: (title: string, alias: string) =>
    `"${title}" is already recorded on ${alias}. Add another record, or update the existing one?`,
  quickAddDuplicateAdd: 'Add another',
  quickAddDuplicateUpdate: 'Update existing',
  close: 'Close',

  // TestFlight
  testflight: 'TestFlight',
  tfEmpty: 'No TestFlight betas tracked',
  tfNew: 'Track a beta',
  tfEdit: 'Edit beta',
  tfName: 'Name',
  tfLink: 'Join link',
  tfLinkPrompt: 'https://testflight.apple.com/join/…',
  tfLinkInvalid: 'That is not a TestFlight join link',
  tfAccount: 'Account used',
  tfAccountNone: 'Not linked',
  tfOpenLink: 'Open in TestFlight',
  tfRefresh: 'Check all',
  tfRefreshing: 'Checking…',
  tfChecked: (text: string) => `Checked ${text}`,
  tfNeverChecked: 'Never checked',
  tfStatusOpen: 'Accepting testers',
  tfStatusFull: 'Full',
  tfStatusClosed: 'Not accepting',
  tfStatusInvalid: 'Link is dead',
  tfStatusUnknown: 'Unknown',
  tfManual: 'Set by you',
  tfManualClear: 'Go back to automatic checks',
  tfSetStatus: 'Status',
  tfNoticeTitle: 'How often this checks',
  tfNoticeBody:
    'Checks happen when you open this screen and, opportunistically, when the widget refreshes — iOS decides the timing and guarantees no interval. Treat this as a way to notice a beta reopened, not as a way to win a race for a slot.',
  tfOpenedTitle: (name: string) => `${name} is accepting testers`,
  tfOpenedBody: 'The beta had slots the last time Storefront checked. It may not still.',
  tfDelete: 'Stop tracking',

  // Gift cards
  giftCards: 'Add balance',
  giftCardOfficial: 'Apple',
  giftCardOfficialAction: 'Buy an Apple Gift Card',
  giftCardRedeem: 'Redeem a code',
  giftCardNoOfficial:
    'Apple does not sell gift cards online in this storefront. Look for physical cards from local retailers instead.',
  giftCardThirdParty: 'Other sellers',
  giftCardThirdPartyEmpty: 'No other sellers are listed.',
  giftCardSponsored: 'Sponsored',
  giftCardDisclaimer:
    'These are not Apple. They are run by third parties, Storefront has no part in the transaction, and any purchase is at your own risk.',
  giftCardAfterTopUp: 'After you top up, update the balance here so alerts stay accurate.',
  updateBalance: 'Update balance',

  // Data
  data: 'Data',
  exportData: 'Export a backup',
  exportDataNote:
    'Exports accounts, records and TestFlight items as JSON. Passwords are never included — they stay in the Keychain.',
  exportFailed: 'Export failed',
  importData: 'Restore from a backup',
  importDataNote: 'Replaces everything currently stored.',
  importConfirmTitle: 'Replace all data?',
  importConfirmBody: (accounts: number, entries: number, tf: number) =>
    `This backup holds ${accounts} accounts, ${entries} records and ${tf} TestFlight items. Everything currently in Storefront will be replaced. Saved passwords are not touched.`,
  importInvalid: (reason: string) => `That file could not be imported: ${reason}`,
  importDone: 'Restored',
  importCancelled: 'Nothing was imported',

  // Widget
  widgetEmpty: 'No accounts',
  widgetAccountCount: (count: number) =>
    `${count} account${count === 1 ? '' : 's'}`
}

export type Strings = typeof en
