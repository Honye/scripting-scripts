import type { CategoryMeta } from '../types'
import { IS_ZH } from './i18n'

/** 最近使用（虚拟分类，数据来自使用记录，不参与导入/导出） */
export const RECENTS_KEY = '__recents__'
/** 未分类（导入的图标匹配不到分类时归入此处） */
export const UNCATEGORIZED_KEY = 'uncategorized'

/**
 * 分类元信息。key 与 SF Symbols.app 里 categories.plist 的 key 保持一致，
 * 这样导入官方 plist 时可以直接对上号。
 *
 * `labelEn` 是官方英文名，用于导入时反查；`labelEnShort` 是键盘侧栏用的短名，
 * 因为侧栏只有 60~76pt 宽，放不下 "Communication" 这种长词。
 */
export const CATEGORIES: CategoryMeta[] = [
  { key: RECENTS_KEY, label: '最近', labelEn: 'Recents', labelEnShort: 'Recent', icon: 'clock.arrow.circlepath' },
  { key: 'communication', label: '通讯', labelEn: 'Communication', labelEnShort: 'Comms', icon: 'message' },
  { key: 'weather', label: '天气', labelEn: 'Weather', labelEnShort: 'Weather', icon: 'cloud.sun' },
  { key: 'maps', label: '地图', labelEn: 'Maps', labelEnShort: 'Maps', icon: 'map' },
  { key: 'objectsandtools', label: '物件', labelEn: 'Objects & Tools', labelEnShort: 'Objects', icon: 'folder' },
  { key: 'devices', label: '设备', labelEn: 'Devices', labelEnShort: 'Devices', icon: 'desktopcomputer' },
  { key: 'cameraandphotos', label: '相机', labelEn: 'Camera & Photos', labelEnShort: 'Camera', icon: 'camera' },
  { key: 'gaming', label: '游戏', labelEn: 'Gaming', labelEnShort: 'Gaming', icon: 'gamecontroller' },
  { key: 'connectivity', label: '连接', labelEn: 'Connectivity', labelEnShort: 'Network', icon: 'antenna.radiowaves.left.and.right' },
  { key: 'transportation', label: '交通', labelEn: 'Transportation', labelEnShort: 'Transit', icon: 'car' },
  { key: 'human', label: '人物', labelEn: 'Human', labelEnShort: 'People', icon: 'person.crop.circle' },
  { key: 'nature', label: '自然', labelEn: 'Nature', labelEnShort: 'Nature', icon: 'leaf' },
  { key: 'fitness', label: '健身', labelEn: 'Fitness', labelEnShort: 'Fitness', icon: 'figure.run' },
  { key: 'health', label: '健康', labelEn: 'Health', labelEnShort: 'Health', icon: 'heart' },
  { key: 'home', label: '家居', labelEn: 'Home', labelEnShort: 'Home', icon: 'house' },
  { key: 'editing', label: '编辑', labelEn: 'Editing', labelEnShort: 'Editing', icon: 'slider.horizontal.3' },
  { key: 'textformatting', label: '文本', labelEn: 'Text Formatting', labelEnShort: 'Text', icon: 'textformat' },
  { key: 'media', label: '媒体', labelEn: 'Media', labelEnShort: 'Media', icon: 'playpause' },
  { key: 'keyboard', label: '键盘', labelEn: 'Keyboard', labelEnShort: 'Keys', icon: 'keyboard' },
  { key: 'commerce', label: '商务', labelEn: 'Commerce', labelEnShort: 'Shop', icon: 'cart' },
  { key: 'time', label: '时间', labelEn: 'Time', labelEnShort: 'Time', icon: 'timer' },
  { key: 'privacyandsecurity', label: '隐私', labelEn: 'Privacy & Security', labelEnShort: 'Privacy', icon: 'lock' },
  { key: 'accessibility', label: '无障碍', labelEn: 'Accessibility', labelEnShort: 'Access', icon: 'accessibility' },
  { key: 'arrows', label: '箭头', labelEn: 'Arrows', labelEnShort: 'Arrows', icon: 'arrow.right' },
  { key: 'indices', label: '索引', labelEn: 'Indices', labelEnShort: 'Indices', icon: 'a.circle' },
  { key: 'math', label: '数学', labelEn: 'Math', labelEnShort: 'Math', icon: 'x.squareroot' },
  { key: 'shapes', label: '形状', labelEn: 'Shapes', labelEnShort: 'Shapes', icon: 'square.on.circle' },
  { key: UNCATEGORIZED_KEY, label: '其他', labelEn: 'Uncategorized', labelEnShort: 'Other', icon: 'square.grid.2x2' },
]

const byKey = new Map(CATEGORIES.map(c => [c.key, c]))

export function getCategory(key: string): CategoryMeta | undefined {
  return byKey.get(key)
}

/**
 * 分类显示名。
 * @param compact 侧栏这种窄位置用短名，列表/胶囊用全名
 */
export function categoryLabel(meta: CategoryMeta, compact = false): string {
  if (IS_ZH) return meta.label
  return compact ? meta.labelEnShort : meta.labelEn
}

/** 通过官方英文名反查 key，导入 categories.plist 时使用 */
export function findCategoryKeyByLabel(label: string): string | undefined {
  const normalized = label.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const c of CATEGORIES) {
    if (c.key === normalized) return c.key
    if (c.labelEn.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) return c.key
  }
  return undefined
}
