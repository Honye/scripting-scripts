import type { Show } from './types'

export const DAYS_CN = ['日', '一', '二', '三', '四', '五', '六']
export const DAYS_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export const TIME_OPTIONS = [
  '08:00', '10:00', '12:00', '14:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '20:30', '21:00', '22:00', '23:00'
]

/** Hex palette used to colorize new shows. Cycles for autoassignment. */
export const COLOR_PALETTE = [
  '#c0392b', '#8e44ad', '#d35400', '#27ae60', '#2980b9',
  '#a93226', '#7d3c98', '#1a5276', '#1e8449', '#6e2f7a',
  '#0e6655', '#b7950b', '#7b241c', '#1f618d', '#117a65'
]

export const SEED_SHOWS: Show[] = [
  {
    id: 1, title: '庆余年 第三季', genre: '古装剧', color: '#c0392b',
    schedules: [{ day: 1, time: '20:00', episodes: 2 }, { day: 2, time: '20:00', episodes: 2 }],
    totalEps: 40, watchedEps: 6
  },
  {
    id: 2, title: '与凤行', genre: '仙侠剧', color: '#8e44ad',
    schedules: [{ day: 3, time: '18:00', episodes: 1 }, { day: 5, time: '18:00', episodes: 1 }],
    totalEps: 36, watchedEps: 12
  },
  {
    id: 3, title: '繁花 第二季', genre: '年代剧', color: '#d35400',
    schedules: [{ day: 0, time: '21:00', episodes: 3 }],
    totalEps: 30, watchedEps: 0
  },
  {
    id: 4, title: '漫长的季节', genre: '悬疑剧', color: '#27ae60',
    schedules: [{ day: 4, time: '20:30', episodes: 2 }, { day: 6, time: '20:30', episodes: 2 }],
    totalEps: 12, watchedEps: 4
  },
  {
    id: 5, title: '狂飙 续集', genre: '刑侦剧', color: '#2980b9',
    schedules: [{ day: 1, time: '22:00', episodes: 1 }, { day: 2, time: '22:00', episodes: 1 }, { day: 3, time: '22:00', episodes: 1 }],
    totalEps: 24, watchedEps: 0
  }
]

export const SEARCH_POOL: Array<{ title: string; genre: string; color: string }> = [
  { title: '甄嬛传 重制版', genre: '古装剧', color: '#a93226' },
  { title: '星汉灿烂 续集', genre: '仙侠剧', color: '#7d3c98' },
  { title: '去有风的地方 2', genre: '生活剧', color: '#1a5276' },
  { title: '山河令 第二季', genre: '武侠剧', color: '#1e8449' },
  { title: '长月烬明 第二季', genre: '仙侠剧', color: '#6e2f7a' },
  { title: '苍兰诀 续集', genre: '仙侠剧', color: '#0e6655' },
  { title: '赘婿 第三季', genre: '穿越剧', color: '#b7950b' },
  { title: '知否知否应是绿肥红瘦 2', genre: '古装剧', color: '#7b241c' },
  { title: '琅琊榜 新传', genre: '权谋剧', color: '#1f618d' },
  { title: '陈情令 第二季', genre: '仙侠剧', color: '#117a65' }
]

export function getTodayIndex(): number {
  return new Date().getDay()
}

export function nextColor(existingCount: number): string {
  return COLOR_PALETTE[existingCount % COLOR_PALETTE.length]
}
