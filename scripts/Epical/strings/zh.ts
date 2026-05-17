import { Strings } from './en'

export const zh: Strings = {
  // App
  appTitle: '追剧日历',
  tabCalendar: '日历',
  tabShows: '追剧',

  // Days
  daysShort: ['日', '一', '二', '三', '四', '五', '六'],
  daysFull: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  dayChip: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  daysJoiner: '、',
  dateLocale: 'zh-CN',

  // Common
  cancel: '取消',
  delete: '删除',
  add: '添加',

  // Home
  homeTitle: '追剧日历',
  homeNoUpdates: (day) => `${day}没有更新\n去添加你喜欢的剧吧`,
  homeDayUpdatesHeader: (day, count) => `${day} · ${count} 部更新`,

  // AllShows
  allShowsTitle: '我的追剧',
  allShowsSubtitle: (count) => `共 ${count} 部`,
  allShowsEmpty: '还没有追的剧',
  episodesCount: (watched, total) => `${watched}/${total} 集`,
  episodesCountTight: (watched, total) => `${watched}/${total}集`,

  // AddShow
  addShowSearchPrompt: '搜索影视名称…',
  addShowScheduleTitle: '设置更新时间',
  addShowCustomAdd: (title) => `找不到？添加 "${title}" 为新剧`,
  addShowGenrePrompt: '类型，例如：古装剧',
  addShowContinue: '继续设置更新时间',
  addShowSearchHint: '输入剧名开始搜索',
  addShowSearching: '搜索中…',
  addShowSearchFailed: '搜索失败',
  addShowResults: (n) => `搜索结果 · ${n}`,
  addShowNetworkError: '网络异常，请重试',
  addShowDefaultGenre: '剧集',
  addShowModeTitle: '更新方式',
  addShowWeekly: '每周更新',
  addShowDaily: '每日更新',
  addShowUpdateDays: '更新日（可多选）',
  addShowUpdateTime: '更新时间',
  addShowUpdateTimeTitle: '更新时间',
  addShowUpdateEps: '更新集数',
  addShowWeeklyHint: (days, time, eps) =>
    `将在每${days} ${time} 更新 ${eps} 集`,
  addShowDailyTime: '每天更新时间',
  addShowDailyEps: '每天更新集数',
  addShowDailyHint: (time, eps) => `将在每天 ${time} 更新 ${eps} 集`,
  addShowNoDays: '尚未选择',
  addShowPlayUrl: '播放地址（可选）',
  addShowPlayUrlPrompt: '粘贴播放链接，留空则不设置',

  // Detail
  detailDeleteTitle: '删除追剧',
  detailDeleteMessage: (title) =>
    `确定要从追剧列表中删除《${title}》吗？此操作无法撤销。`,
  detailSummary: (total, watched) => `共 ${total} 集 · 已看 ${watched} 集`,
  detailProgress: '观看进度',
  detailWatched: '已观看',
  detailTotalEps: '总集数',
  detailTotalValue: (n) => `${n} 集`,
  detailEpsUnit: '集',
  detailScheduleLine: (day, time) => `每${day} ${time}`,
  detailScheduleEps: (n) => `更新 ${n} 集`,
  detailSave: '保存进度',
  detailDelete: '删除追剧',

  // Components
  episodeRange: (start, end) =>
    start === end
      ? `今日更新第 ${start} 集`
      : `今日更新第 ${start}–${end} 集`,
  componentEpsUpdate: (n) => `更新${n}集`,

  // Widget
  widgetNoUpdates: '今日没有更新',
  widgetTitle: '剧历',
  widgetNewCount: '部上新',
  widgetMediumHeader: (count) => `今日更新 · ${count} 部`
}
