export const en = {
  appTitle: 'CF Usage',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  done: 'Done',
  refresh: 'Refresh',
  retry: 'Retry',

  profilesEmpty: 'No accounts yet',
  profilesEmptyHint:
    'Tap + and paste a Cloudflare API token with "Account Analytics: Read" and "Workers Scripts: Read".',
  profilesHeader: 'Accounts',
  addProfile: 'Add Account',
  editProfile: 'Edit Account',
  deleteProfileConfirm: (alias: string) =>
    `Remove "${alias}"? Its token is deleted from the Keychain.`,
  alertsFooter:
    "Alerts are checked whenever the Home Screen widget refreshes (roughly every 15–60 minutes, at iOS's discretion) and when you refresh here. Add a CF Usage widget to keep them running.",

  updatedAgo: (ago: string) => `Updated ${ago} ago`,
  neverUpdated: 'Not fetched yet',
  staleSnapshot: 'Quota reset since last fetch',
  resetsIn: (t: string) => `Resets in ${t}`,
  fetchFailed: 'Fetch failed',

  // Editor
  alias: 'Name',
  aliasPrompt: 'e.g. Personal',
  token: 'API Token',
  tokenPrompt: 'Paste token',
  tokenStored: 'A token is saved. Leave blank to keep it.',
  tokenHelp:
    'Create a token at dash.cloudflare.com › My Profile › API Tokens with Account › Account Analytics › Read and Account › Workers Scripts › Read. It is stored in the Keychain on this device and used by the widget to check usage.',
  verify: 'Verify & Load Accounts',
  verifying: 'Verifying…',
  account: 'Account',
  pickAccount: 'Verify the token to choose an account',
  plan: 'Plan',
  planFree: 'Free',
  planPaid: 'Paid',
  limits: 'Limits',
  dailyRequests: 'Requests / day',
  monthlyRequests: 'Requests / month',
  monthlyCpu: 'CPU ms / month',
  billingDay: (d: number) => `Billing cycle starts on day ${d} (UTC)`,
  limitsFooterFree:
    'Free: 100,000 Workers + Pages Functions requests per day, reset at 00:00 UTC.',
  limitsFooterPaid:
    'Workers Paid includes 10M requests and 30M CPU ms per month; adjust if your contract differs.',
  thresholds: 'Alert at',
  thresholdsFooter: 'One notification per threshold per quota period.',
  invalidNumber: 'Enter a positive number',

  // Detail
  usage: 'Usage',
  requestsToday: 'Requests today',
  requestsPeriod: 'Requests this cycle',
  requestsMonth: 'Requests this month',
  cpuTime: 'CPU time',
  cpuPeriod: 'CPU this cycle',
  subrequests: 'Subrequests',
  errors: 'Errors',
  pagesFunctions: 'Pages Functions',
  pagesUnavailable: 'Pages Functions data unavailable — total may be low.',
  cpuUnavailable: 'CPU time field was rejected by the API.',
  last24h: 'Last 24 hours',
  workers: 'Workers',
  workersEmpty: 'No Worker traffic in this period',
  allWorkers: 'All Workers',
  loadWorkersFailed: 'Could not list Workers',
  today: 'Today',
  diagnostics: 'Diagnostics',
  runProbes: 'Run Probes',

  // Worker detail
  range24h: '24h',
  range7d: '7d',
  invocations: 'Invocations',
  cpuP50: 'CPU median',
  cpuP99: 'CPU P99',
  wallP50: 'Wall median',
  wallP99: 'Wall P99',
  watch: 'Alert on this Worker',
  watchCap: 'Daily request cap',
  watchFooter:
    'Notifies once per UTC day when this Worker alone reaches the cap.',

  // Alerts
  alertTitle: (alias: string) => `Cloudflare usage · ${alias}`,
  alertRequests: (used: string, limit: string, pct: string, reset: string) =>
    `Requests ${used} / ${limit} (${pct}). Resets in ${reset}.`,
  alertCpu: (used: string, limit: string, pct: string, reset: string) =>
    `CPU time ${used} / ${limit} (${pct}). Resets in ${reset}.`,
  alertWorker: (script: string, used: string, cap: string) =>
    `${script} has served ${used} requests today (cap ${cap}).`,

  // Widget
  widgetEmpty: 'Add an account in the app',
  widgetNoData: 'No data yet',
  widgetWorkerMissing: (name: string) => `No data for ${name}`
}

export type Strings = typeof en
