/**
 * Pure transforms from the raw `queryAccount` result to what the widget draws,
 * moved over from the Scriptable SGCC.js.
 */
import type { Color } from 'scripting'
import type { Dimension } from './store'

/** Shape returned by `queryAccount` in `vendor/sgcc_protocol.ts`. */
export type RawAccount = {
  userInfo?: {
    consNo?: string
    consNo_dst?: string
    consName_dst?: string
    orgName?: string
    proNo?: string
  }
  arrearsOfFees?: boolean
  /** 后付费户才有 `accountBalance`（账户预存款） */
  eleBill?: { sumMoney?: number | string; accountBalance?: number | string }
  dayElecQuantity31?: {
    sevenEleList?: { day: string; dayElePq: number | string }[]
  }
  monthElecQuantity?: {
    mothEleList?: {
      month: string
      monthEleNum: number | string
      monthEleCost: number | string
    }[]
    dataInfo?: { totalEleNum?: number | string; totalEleCost?: number | string }
  }
}

export type DailyItem = { day: string; value: number }
export type MonthlyItem = { month: string; pq: number; cost: number }

export type AccountData = {
  arrearsOfFees: boolean
  balance: string
  lastAmount: string
  lastPq: number
  yearPq: number
  yearAmount: string
  /** Kilowatt-hours that count toward this year's tier. */
  stepPq: number
  daily: DailyItem[]
  monthly: MonthlyItem[]
}

export type Level = 1 | 2 | 3

export type Bar = { value: number; level: Level }

/** Top → bottom gradient for each tier's bars. */
export const LEVEL_GRADIENTS: Record<Level, [Color, Color]> = {
  1: ['#81CDC7', '#00706B'],
  2: ['#FFEE8C', '#E8C70B'],
  3: ['#FCBF94', '#D0580D']
}

export const LEVEL_COLORS: Record<Level, Color> = {
  1: '#00706B',
  2: '#E8C70B',
  3: '#D0580D'
}

/** The unfilled track behind each tier: the tier color at 10%. */
export const LEVEL_TRACKS: Record<Level, Color> = {
  1: 'rgba(0,112,107,0.1)',
  2: 'rgba(232,199,11,0.1)',
  3: 'rgba(208,88,13,0.1)'
}

const toNumber = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const currentYm = () => {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function normalize(data: RawAccount): AccountData {
  const {
    eleBill = {},
    dayElecQuantity31 = {},
    monthElecQuantity = {}
  } = data
  const daily = (dayElecQuantity31.sevenEleList || [])
    .filter(
      ({ dayElePq }) =>
        dayElePq !== '' &&
        dayElePq != null &&
        !Number.isNaN(Number(dayElePq))
    )
    .map(({ day, dayElePq }) => ({ day: String(day), value: Number(dayElePq) }))
    .sort((a, b) => a.day.localeCompare(b.day))
  const monthly = (monthElecQuantity.mothEleList || [])
    .map(({ month, monthEleNum, monthEleCost }) => ({
      month: String(month),
      pq: toNumber(monthEleNum),
      cost: toNumber(monthEleCost)
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const ym = currentYm()
  // 最近一个已结算月份作为“上期”
  const settled = monthly.filter(
    ({ month, pq, cost }) => month < ym && (pq > 0 || cost > 0)
  )
  const last = settled[settled.length - 1]
  const yearPq = toNumber(monthElecQuantity.dataInfo?.totalEleNum)
  // 阶梯电量 = 年度已结算电量 + 本月未结算的日用电
  const pendingPq = monthly.some(({ month }) => month === ym)
    ? 0
    : daily
        .filter(({ day }) => day.startsWith(ym))
        .reduce((sum, { value }) => sum + value, 0)

  const arrearsOfFees = !!data.arrearsOfFees
  // 后付费用户 sumMoney 为账单应缴金额，余额应取账户预存款 accountBalance
  const isPostPaid = Object.prototype.hasOwnProperty.call(eleBill, 'accountBalance')
  const balance =
    isPostPaid && !arrearsOfFees ? eleBill.accountBalance : eleBill.sumMoney

  return {
    arrearsOfFees,
    balance: toNumber(balance).toFixed(2),
    lastAmount: last ? last.cost.toFixed(2) : '0.00',
    lastPq: last ? last.pq : 0,
    yearPq,
    yearAmount: toNumber(monthElecQuantity.dataInfo?.totalEleCost).toFixed(2),
    stepPq: Math.round(yearPq + pendingPq),
    daily,
    monthly
  }
}

export function getLevel(total: number, oneLevelPq: number, twoLevelPq: number): Level {
  return total > twoLevelPq ? 3 : total > oneLevelPq ? 2 : 1
}

/** The last `barCount` bars, each colored by the tier its period fell into. */
export function barItems(
  data: AccountData,
  options: {
    dimension: Dimension
    barCount: number
    oneLevelPq: number
    twoLevelPq: number
  }
): Bar[] {
  const { dimension, barCount, oneLevelPq, twoLevelPq } = options
  /** 每月对应的阶梯，按年累计 */
  const monthLevels: Record<string, Level> = {}
  let bars: Bar[] = []
  let year = ''
  let yearTotal = 0
  for (const { month, pq } of data.monthly) {
    if (month.slice(0, 4) !== year) {
      year = month.slice(0, 4)
      yearTotal = 0
    }
    yearTotal += pq
    const level = getLevel(yearTotal, oneLevelPq, twoLevelPq)
    monthLevels[month] = level
    if (dimension === 'monthly') bars.push({ value: pq, level })
  }
  if (dimension === 'daily') {
    const thisYear = String(new Date().getFullYear())
    const thisYearMonths = Object.keys(monthLevels).filter((m) =>
      m.startsWith(thisYear)
    )
    // 本月未结算时沿用今年最近一个月的阶梯
    const latestLevel = monthLevels[thisYearMonths[thisYearMonths.length - 1]] || 1
    for (const { day, value } of data.daily) {
      const month = day.slice(0, 6)
      // 非今年数据默认阶梯为 1
      const level = month.startsWith(thisYear)
        ? monthLevels[month] || latestLevel
        : 1
      bars.push({ value, level })
    }
  }
  return bars.slice(-Math.max(1, barCount))
}

/**
 * Current tier and how far into it the year is. The third tier has no cap, so
 * its bar is scaled to the same width as the second (`2 * two - one`).
 */
export function stepProgress(
  stepPq: number,
  oneLevelPq: number,
  twoLevelPq: number
): { level: Level; percent: number } {
  const level = getLevel(stepPq, oneLevelPq, twoLevelPq)
  const cap = [oneLevelPq, twoLevelPq, twoLevelPq * 2 - oneLevelPq][level - 1]
  const percent = cap > 0 ? Math.min(stepPq / cap, 1) : 0
  return { level, percent }
}

/**
 * How full each of the three tier segments is, measured on the same scale as
 * `stepProgress` (`level * percent` segments filled in total).
 */
export function segmentFills(level: Level, percent: number): [number, number, number] {
  const filled = level * percent
  const fill = (i: number) => Math.max(0, Math.min(1, filled - i))
  return [fill(0), fill(1), fill(2)]
}

export const LEVEL_NAMES: Record<Level, string> = { 1: '一', 2: '二', 3: '三' }
