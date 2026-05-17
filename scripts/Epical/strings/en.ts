export const en = {
  // App
  appTitle: 'Epical',
  tabCalendar: 'Calendar',
  tabShows: 'Shows',

  // Days
  daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  daysFull: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayChip: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  daysJoiner: ', ',
  dateLocale: 'en-US',

  // Common
  cancel: 'Cancel',
  delete: 'Delete',
  add: 'Add',

  // Home
  homeTitle: 'Epical',
  homeNoUpdates: (day: string) =>
    `No updates on ${day}\nAdd a show to get started`,
  homeDayUpdatesHeader: (day: string, count: number) =>
    `${day} · ${count} update${count === 1 ? '' : 's'}`,

  // AllShows
  allShowsTitle: 'My Shows',
  allShowsSubtitle: (count: number) => `${count} total`,
  allShowsEmpty: 'No shows yet',
  episodesCount: (watched: number, total: number) => `${watched}/${total} eps`,
  episodesCountTight: (watched: number, total: number) => `${watched}/${total} eps`,

  // AddShow
  addShowSearchPrompt: 'Search shows…',
  addShowScheduleTitle: 'Set Schedule',
  addShowCustomAdd: (title: string) =>
    `Not found? Add "${title}" as a new show`,
  addShowGenrePrompt: 'Genre, e.g. Drama',
  addShowContinue: 'Continue to set schedule',
  addShowSearchHint: 'Type a show name to search',
  addShowSearching: 'Searching…',
  addShowSearchFailed: 'Search failed',
  addShowResults: (n: number) => `Results · ${n}`,
  addShowNetworkError: 'Network error, please retry',
  addShowDefaultGenre: 'Series',
  addShowModeTitle: 'Update Mode',
  addShowWeekly: 'Weekly',
  addShowDaily: 'Daily',
  addShowUpdateDays: 'Update days (multi-select)',
  addShowUpdateTime: 'Update time',
  addShowUpdateTimeTitle: 'Update time',
  addShowUpdateEps: 'Episodes',
  addShowWeeklyHint: (days: string, time: string, eps: number) =>
    `Every ${days} at ${time}, ${eps} ep${eps === 1 ? '' : 's'}`,
  addShowDailyTime: 'Daily update time',
  addShowDailyEps: 'Episodes per day',
  addShowDailyHint: (time: string, eps: number) =>
    `Every day at ${time}, ${eps} ep${eps === 1 ? '' : 's'}`,
  addShowNoDays: 'No days selected',
  addShowPlayUrl: 'Play URL (optional)',
  addShowPlayUrlPrompt: 'Paste link, leave empty to skip',

  // Detail
  detailDeleteTitle: 'Delete Show',
  detailDeleteMessage: (title: string) =>
    `Remove "${title}" from your list? This cannot be undone.`,
  detailSummary: (total: number, watched: number) =>
    `${total} eps · ${watched} watched`,
  detailProgress: 'Progress',
  detailWatched: 'Watched',
  detailTotalEps: 'Total Episodes',
  detailTotalValue: (n: number) => `${n} eps`,
  detailEpsUnit: 'eps',
  detailScheduleLine: (day: string, time: string) => `Every ${day} at ${time}`,
  detailScheduleEps: (n: number) => `+${n} ep${n === 1 ? '' : 's'}`,
  detailSave: 'Save Progress',
  detailDelete: 'Delete Show',

  // Components
  episodeRange: (start: number, end: number) =>
    start === end
      ? `Today: ep ${start}`
      : `Today: eps ${start}–${end}`,
  componentEpsUpdate: (n: number) => `+${n} ep${n === 1 ? '' : 's'}`,

  // Widget
  widgetNoUpdates: 'No updates today',
  widgetTitle: 'Epical',
  widgetNewCount: 'new',
  widgetMediumHeader: (count: number) =>
    `Today · ${count} update${count === 1 ? '' : 's'}`
}

export type Strings = typeof en
