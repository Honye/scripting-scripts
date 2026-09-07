import { Strings } from './en'

export const zh: Strings = {
  appTitle: 'Storefront',
  dateLocale: 'zh-CN',

  // 通用
  cancel: '取消',
  save: '保存',
  delete: '删除',
  add: '添加',
  done: '完成',
  edit: '编辑',
  copy: '复制',
  copied: '已复制',
  none: '无',
  optional: '选填',

  // 账号
  accountsTitle: '账号',
  accountsEmpty: '还没有账号',
  accountsEmptyHint: '添加一个账号，开始记录余额与订阅。',
  accountBalance: '余额',
  accountRegion: '地区',
  accountAlias: '名称',
  accountAliasPrompt: '如：美区主号',
  accountEmail: 'Apple 账号',
  accountEmailPrompt: 'name@example.com',
  accountPassword: '密码',
  accountCurrency: '币种',
  currencyHint:
    '默认取该区常用币种。Apple 对部分区实际以美元结算，若与你的账单不符，可在此改。',
  searchRegion: '搜索国家或地区',
  searchRegionEmpty: '没有匹配的国家或地区',
  accountNote: '备注',
  newAccount: '新建账号',
  editAccount: '编辑账号',
  currentAccount: '当前登录',
  markAsCurrent: '标记为当前登录账号',
  balanceUpdated: (days) => (days <= 0 ? '今天更新过' : `${days} 天前更新`),
  balanceStale: '余额可能已过期',
  dueThisMonth: '本月待扣',
  nextBill: '下一笔扣费',
  noSubscriptions: '暂无生效中的订阅',
  otherCurrencyNote: (count) => `另有 ${count} 笔其他币种的订阅，单独列出`,
  alertSevere: '余额不足以支付下一笔扣费',
  alertWarn: '余额可能在 30 天内耗尽',

  // 密码
  passwordStored: '已存入钥匙串',
  passwordNotStored: '未存储',
  passwordFieldHint:
    '选填。仅存在本脚本的钥匙串中，导出文件不含密码。留空表示不存储。',
  passwordKeepExisting: '留空表示保留已存的密码',
  revealPassword: '查看密码',
  copyPassword: '复制密码',
  removePassword: '删除已存密码',
  removePasswordConfirm: '删除钥匙串中为该账号保存的密码？账号本身会保留。',
  authReason: '验证身份后才能使用已存密码',
  passwordCopied: '密码已复制，请尽快使用，用完记得清空剪贴板。',
  authUnavailable: '设备未设置密码或生物识别，无法解锁已存的密码。',
  authDenied: '验证未通过，密码未展示。',
  passwordMissing: '该账号没有存储密码。',

  // 切换助手（FR-SW-05：不得出现「一键切换 / 自动切换」）
  switchAssistant: '切换助手',
  switchAssistantSubtitle: '引导你手动登录到这个账号',
  switchIntroTitle: '这个功能能做什么、不能做什么',
  switchIntroBody:
    'iOS 不允许任何第三方 App 代替你登录账号或更改 App Store 地区。Storefront 只能把资料准备好并打开 App Store，最后几步需要你自己完成。',
  switchStep1: '1. 复制账号',
  switchStep2: '2. 复制密码',
  switchStep3: '3. 打开 App Store',
  switchStep3Hint: '在 App Store 中点头像 → 退出登录 → 用上面的账号登录。',
  openAppStore: '打开 App Store',
  switchConfirmTitle: '已经登录了吗？',
  switchConfirmBody: (alias) => `是否已登录为 ${alias}？`,
  switchConfirmYes: '已登录',
  switchDone: '已标记为当前登录账号',
  emailMissing: '请先填写账号地址',

  // 删除
  deleteAccount: '删除账号',
  deleteAccountConfirm: (alias, entries, tf) => {
    const parts: string[] = []
    if (entries > 0) parts.push(`将同时删除 ${entries} 条已购/订阅记录`)
    if (tf > 0) parts.push(`${tf} 个 TestFlight 项目将转为未关联`)
    const tail = parts.length > 0 ? ` ${parts.join('；')}。` : ''
    return `确定删除「${alias}」？钥匙串中已存的密码会一并清除。${tail}`
  },

  // 设置
  settings: '设置',
  reminderLeadDays: '扣费提前提醒',
  reminderLeadDaysUnit: (days) => (days === 0 ? '当天' : `提前 ${days} 天`),

  // 应用查询 / 跨区比价
  appLookup: '查找应用',
  appLookupPrompt: '应用名、App Store 链接或 ID',
  appLookupHint: '输入应用名搜索，或粘贴 App Store 链接 —— 带不带地区和 slug 都可以。',
  searchStorefront: '搜索地区',
  searchAction: '搜索',
  searching: '搜索中…',
  searchResults: '搜索结果',
  searchResultsNote: '名称与价格来自该地区。点某一项可在你各账号所在地区之间比价。',
  searchEmpty: '该地区没有找到',
  appLookupInvalid: '没能从这段文字里识别出 App ID',
  lookupAction: '查询',
  compareRegions: '地区',
  compareNoConversion: '各地区按自身币种显示。本应用刻意不做任何汇率折算。',
  addRegion: '添加地区',
  removeRegion: '移除',
  storePrice: '售价',
  freePrice: '免费',
  inAppPurchases: '内购项目',
  loadIAP: '加载内购价格',
  loadingIAP: '正在加载内购价格…',
  noIAP: '无内购项目',
  iapPageWeightNote: '内购价格需要抓取完整商品页，因此按地区逐个手动加载。',
  openInAppStore: '在 App Store 中打开',
  retry: '重试',
  seller: '开发者',
  version: '版本',
  bundleId: 'Bundle ID',
  fetchError: (reason) => {
    switch (reason) {
      case 'notfound':
        return '该地区未上架'
      case 'timeout':
        return '请求超时'
      case 'network':
        return '网络错误'
      case 'parse':
        return 'Apple 改了页面结构'
      case 'blocked':
        return '已拦截：不是 Apple 的地址'
      default:
        return '请求失败'
    }
  },

  // 条目（已购 / 内购 / 订阅）
  entries: '记录',
  entriesEmpty: '这个账号下还没有记录',
  newEntry: '新增记录',
  editEntry: '编辑记录',
  deleteEntry: '删除记录',
  deleteEntryConfirm: (title) => `确定删除「${title}」？`,
  kind: '类型',
  kindPurchase: '付费应用',
  kindIAP: '内购',
  kindSubscription: '订阅',
  entryApp: '应用',
  entryAppPick: '选择应用',
  entryTitle: '项目',
  entryTitlePromptPurchase: '应用名称',
  entryTitlePromptIAP: '买的是什么',
  entryAccount: '账号',
  entryPrice: '金额',
  entryPurchasedAt: '购买日期',
  entryNextBilling: '下次扣费',
  entryCycle: '扣费周期',
  cycleMonthly: '每月',
  cycleQuarterly: '每季',
  cycleYearly: '每年',
  cycleCustom: '每 N 天',
  cycleCustomDays: '天数',
  entryActive: '生效中',
  entryPaused: '已暂停',
  entryPausedNote: '暂停的订阅会保留记录，但不计入汇总与预警。',
  priceSourceFetched: '取自 App Store',
  priceSourceManual: '手动填写',
  fetchPrice: '获取价格',
  pickIAPItem: '选择内购项目',
  priceChangedTitle: '价格有变动',
  priceChangedBody: (oldText, newText) =>
    `App Store 现在是 ${newText}，你的记录是 ${oldText}。要更新吗？`,
  priceChangedKeep: '保留我的',
  priceChangedUpdate: '更新',
  fetchFailedManual: '没能连上 App Store —— 请手动填写金额。',
  selectAppFirst: '请先选择应用',

  // 即将扣费 / 按应用
  upcomingBills: '即将扣费',
  upcomingEmpty: '没有待扣费的订阅',
  byApp: '按应用',
  byAppEmpty: '还没有任何记录',
  totalSpent: '合计',
  totalSpentMixed: '合计按币种分开统计，绝不跨币种相加。',
  entryCount: (count) => `${count} 条记录`,
  dueIn: (days) =>
    days < 0 ? '已逾期' : days === 0 ? '今天' : days === 1 ? '明天' : `${days} 天后`,

  // 预警与通知
  notifications: '扣费提醒',
  notificationLead: '提醒时机',
  notificationLeadUnit: (days) => (days === 0 ? '扣费当天' : `提前 ${days} 天`),
  notificationScheduled: (count) =>
    count === 0 ? '当前没有待发提醒' : `已排 ${count} 条提醒`,
  notificationCap: (max) =>
    `只为最近 ${max} 笔排提醒 —— iOS 限制了所有 Scripting 脚本共享的待发通知总数。`,
  notificationRefused:
    'iOS 拒绝了排程。请在「设置」中允许 Scripting 发送通知，然后重新进入本页。',
  notificationRefreshNow: '重建提醒',
  notifyTitle: (alias, title) => `${alias} · ${title}`,
  notifyBody: (amount, date, balance) => `${date} 扣 ${amount}，余额 ${balance}。`,
  notifyBodyShort: (amount, date, balance) =>
    `${date} 要扣 ${amount}，但届时余额只有 ${balance}。请充值，或打开 Storefront 更正余额。`,
  notifyBodyForeign: (amount, date) =>
    `${date} 扣 ${amount}。该笔为其他币种，未计入本账号余额。`,

  // 分享菜单快速录入
  quickAdd: '添加到 Storefront',
  quickAddSaving: '保存中…',
  quickAddSaved: '已保存',
  quickAddNoAccounts: '请先在 Storefront 里添加一个账号，再来分享。',
  quickAddBadUrl: '这不是 App Store 链接。请从 App Store 分享应用，或把链接粘贴到 Storefront 里。',
  quickAddNoInput: '没有收到分享内容。',
  quickAddLoading: '正在读取应用信息…',
  quickAddOffline: '没能连上 App Store。你仍然可以先保存，稍后再补细节。',
  quickAddDuplicateTitle: '已有记录',
  quickAddDuplicateBody: (title, alias) =>
    `「${title}」在「${alias}」下已有记录。要再加一条，还是更新已有的那条？`,
  quickAddDuplicateAdd: '再加一条',
  quickAddDuplicateUpdate: '更新已有',
  close: '关闭',

  // TestFlight
  testflight: 'TestFlight',
  tfEmpty: '还没有跟踪任何 TestFlight',
  tfNew: '添加 TestFlight',
  tfEdit: '编辑 TestFlight',
  tfName: '名称',
  tfLink: '加入链接',
  tfLinkPrompt: 'https://testflight.apple.com/join/…',
  tfLinkInvalid: '这不是 TestFlight 加入链接',
  tfAccount: '使用的账号',
  tfAccountNone: '未关联',
  tfOpenLink: '在 TestFlight 中打开',
  tfRefresh: '全部检查',
  tfRefreshing: '检查中…',
  tfChecked: (text) => `${text}检查过`,
  tfNeverChecked: '尚未检查',
  tfStatusOpen: '可加入',
  tfStatusFull: '名额已满',
  tfStatusClosed: '暂不接受',
  tfStatusInvalid: '链接已失效',
  tfStatusUnknown: '未知',
  tfManual: '你手动设置的',
  tfManualClear: '恢复自动检测',
  tfSetStatus: '状态',
  tfNoticeTitle: '检查频率说明',
  tfNoticeBody:
    '只在你打开本页时检查，以及小组件刷新时顺带检查 —— 时机由 iOS 决定，不保证任何间隔。这个功能适合让你知道某个 beta 重新开放了，不适合用来抢名额。',
  tfOpenedTitle: (name) => `${name} 开放名额了`,
  tfOpenedBody: 'Storefront 上次检查时还有名额，现在不一定还有。',
  tfDelete: '不再跟踪',

  // 礼品卡
  giftCards: '充值',
  giftCardOfficial: 'Apple 官方',
  giftCardOfficialAction: '购买 Apple 礼品卡',
  giftCardRedeem: '兑换充值码',
  giftCardNoOfficial: 'Apple 在该地区不提供线上购买礼品卡。可以找当地零售渠道的实体卡。',
  giftCardThirdParty: '第三方渠道',
  giftCardThirdPartyEmpty: '暂未收录第三方渠道。',
  giftCardSponsored: '赞助',
  giftCardDisclaimer:
    '以下均非 Apple 官方渠道，由第三方运营，Storefront 不参与其中任何交易，风险请自行承担。',
  giftCardAfterTopUp: '充值后请回来更新余额，预警才准。',
  updateBalance: '更新余额',

  // 数据
  data: '数据',
  exportData: '导出备份',
  exportDataNote: '导出账号、记录与 TestFlight 项目为 JSON。密码永不包含在内 —— 它们只存在钥匙串里。',
  exportFailed: '导出失败',
  importData: '从备份恢复',
  importDataNote: '会替换当前存储的全部内容。',
  importConfirmTitle: '替换全部数据？',
  importConfirmBody: (accounts, entries, tf) =>
    `该备份包含 ${accounts} 个账号、${entries} 条记录、${tf} 个 TestFlight 项目。Storefront 中现有的全部内容将被替换。已保存的密码不受影响。`,
  importInvalid: (reason) => `无法导入该文件：${reason}`,
  importDone: '已恢复',
  importCancelled: '未导入任何内容',

  // 小组件
  widgetEmpty: '暂无账号',
  widgetAccountCount: (count) => `${count} 个账号`
}
