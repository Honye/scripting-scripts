import type { Strings } from './en'

export const zh: Strings = {
  appTitle: 'CF 用量',
  cancel: '取消',
  save: '保存',
  delete: '删除',
  edit: '编辑',
  done: '完成',
  refresh: '刷新',
  retry: '重试',

  profilesEmpty: '还没有账号',
  profilesEmptyHint:
    '点 + 粘贴一个具有「Account Analytics: Read」和「Workers Scripts: Read」权限的 Cloudflare API Token。',
  profilesHeader: '账号',
  addProfile: '添加账号',
  editProfile: '编辑账号',
  deleteProfileConfirm: (alias: string) =>
    `移除「${alias}」？其 Token 会从钥匙串中删除。`,
  alertsFooter:
    '提醒在主屏小组件刷新时（约 15–60 分钟一次，由 iOS 决定）以及在这里手动刷新时检查。请添加一个「CF 用量」小组件以保持提醒生效。',

  updatedAgo: (ago: string) => `${ago}前更新`,
  neverUpdated: '尚未获取',
  staleSnapshot: '额度已重置，等待刷新',
  resetsIn: (t: string) => `${t}后重置`,
  fetchFailed: '获取失败',

  alias: '名称',
  aliasPrompt: '例如：个人',
  token: 'API Token',
  tokenPrompt: '粘贴 Token',
  tokenStored: '已保存 Token，留空则保持不变。',
  tokenHelp:
    '在 dash.cloudflare.com › 我的个人资料 › API 令牌 创建 Token，权限为 帐户 › Account Analytics › 读取 和 帐户 › Workers 脚本 › 读取。Token 保存在本机钥匙串，小组件会用它查询用量。',
  verify: '验证并加载账号',
  verifying: '验证中…',
  account: '账号',
  pickAccount: '先验证 Token 再选择账号',
  plan: '计划',
  planFree: 'Free',
  planPaid: 'Paid',
  limits: '额度',
  dailyRequests: '每日请求数',
  monthlyRequests: '每月请求数',
  monthlyCpu: '每月 CPU 毫秒',
  billingDay: (d: number) => `账单周期从每月 ${d} 日开始（UTC）`,
  limitsFooterFree:
    'Free：Workers 与 Pages Functions 合计每天 100,000 次请求，UTC 0 点重置。',
  limitsFooterPaid:
    'Workers Paid 每月含 1000 万次请求和 3000 万 CPU 毫秒，可按实际合同调整。',
  thresholds: '提醒阈值',
  thresholdsFooter: '每个额度周期内，每档阈值只提醒一次。',
  invalidNumber: '请输入正数',

  usage: '用量',
  requestsToday: '今日请求',
  requestsPeriod: '本周期请求',
  requestsMonth: '本月请求',
  cpuTime: 'CPU 时间',
  cpuPeriod: '本周期 CPU',
  subrequests: '子请求',
  errors: '错误',
  pagesFunctions: 'Pages Functions',
  pagesUnavailable: '无法读取 Pages Functions 数据，总量可能偏低。',
  cpuUnavailable: 'API 不接受 CPU 时间字段。',
  last24h: '最近 24 小时',
  workers: 'Workers',
  workersEmpty: '本周期没有 Worker 流量',
  allWorkers: '全部 Workers',
  loadWorkersFailed: '无法获取 Worker 列表',
  today: '今日',
  diagnostics: '诊断',
  runProbes: '运行检测',

  range24h: '24 小时',
  range7d: '7 天',
  invocations: '调用次数',
  cpuP50: 'CPU 中位数',
  cpuP99: 'CPU P99',
  wallP50: '墙钟中位数',
  wallP99: '墙钟 P99',
  watch: '为此 Worker 单独提醒',
  watchCap: '每日请求上限',
  watchFooter: '该 Worker 当日（UTC）请求数达到上限时提醒一次。',

  alertTitle: (alias: string) => `Cloudflare 用量 · ${alias}`,
  alertRequests: (used: string, limit: string, pct: string, reset: string) =>
    `请求 ${used} / ${limit}（${pct}），${reset}后重置。`,
  alertCpu: (used: string, limit: string, pct: string, reset: string) =>
    `CPU 时间 ${used} / ${limit}（${pct}），${reset}后重置。`,
  alertWorker: (script: string, used: string, cap: string) =>
    `${script} 今日已处理 ${used} 次请求（上限 ${cap}）。`,

  widgetEmpty: '请先在应用中添加账号',
  widgetNoData: '暂无数据',
  widgetWorkerMissing: (name: string) => `${name} 暂无数据`
}
