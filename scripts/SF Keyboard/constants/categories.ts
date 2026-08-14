import type { CategoryMeta } from '../types'

/** 最近使用（虚拟分类，数据来自使用记录，不参与导入/导出） */
export const RECENTS_KEY = '__recents__'
/** 未分类（导入的图标匹配不到分类时归入此处） */
export const UNCATEGORIZED_KEY = 'uncategorized'

/**
 * 分类元信息。key 与 SF Symbols.app 里 categories.plist 的 key 保持一致，
 * 这样导入官方 plist 时可以直接对上号。
 */
export const CATEGORIES: CategoryMeta[] = [
  { key: RECENTS_KEY, label: '最近', labelEn: 'Recents', icon: 'clock.arrow.circlepath' },
  { key: 'communication', label: '通讯', labelEn: 'Communication', icon: 'message' },
  { key: 'weather', label: '天气', labelEn: 'Weather', icon: 'cloud.sun' },
  { key: 'maps', label: '地图', labelEn: 'Maps', icon: 'map' },
  { key: 'objectsandtools', label: '物件', labelEn: 'Objects & Tools', icon: 'folder' },
  { key: 'devices', label: '设备', labelEn: 'Devices', icon: 'desktopcomputer' },
  { key: 'cameraandphotos', label: '相机', labelEn: 'Camera & Photos', icon: 'camera' },
  { key: 'gaming', label: '游戏', labelEn: 'Gaming', icon: 'gamecontroller' },
  { key: 'connectivity', label: '连接', labelEn: 'Connectivity', icon: 'antenna.radiowaves.left.and.right' },
  { key: 'transportation', label: '交通', labelEn: 'Transportation', icon: 'car' },
  { key: 'human', label: '人物', labelEn: 'Human', icon: 'person.crop.circle' },
  { key: 'nature', label: '自然', labelEn: 'Nature', icon: 'leaf' },
  { key: 'fitness', label: '健身', labelEn: 'Fitness', icon: 'figure.run' },
  { key: 'health', label: '健康', labelEn: 'Health', icon: 'heart' },
  { key: 'home', label: '家居', labelEn: 'Home', icon: 'house' },
  { key: 'editing', label: '编辑', labelEn: 'Editing', icon: 'slider.horizontal.3' },
  { key: 'textformatting', label: '文本', labelEn: 'Text Formatting', icon: 'textformat' },
  { key: 'media', label: '媒体', labelEn: 'Media', icon: 'playpause' },
  { key: 'keyboard', label: '键盘', labelEn: 'Keyboard', icon: 'keyboard' },
  { key: 'commerce', label: '商务', labelEn: 'Commerce', icon: 'cart' },
  { key: 'time', label: '时间', labelEn: 'Time', icon: 'timer' },
  { key: 'privacyandsecurity', label: '隐私', labelEn: 'Privacy & Security', icon: 'lock' },
  { key: 'accessibility', label: '无障碍', labelEn: 'Accessibility', icon: 'accessibility' },
  { key: 'arrows', label: '箭头', labelEn: 'Arrows', icon: 'arrow.right' },
  { key: 'indices', label: '索引', labelEn: 'Indices', icon: 'a.circle' },
  { key: 'math', label: '数学', labelEn: 'Math', icon: 'x.squareroot' },
  { key: 'shapes', label: '形状', labelEn: 'Shapes', icon: 'square.on.circle' },
  { key: UNCATEGORIZED_KEY, label: '其他', labelEn: 'Uncategorized', icon: 'square.grid.2x2' },
]

const byKey = new Map(CATEGORIES.map(c => [c.key, c]))

export function getCategory(key: string): CategoryMeta | undefined {
  return byKey.get(key)
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
