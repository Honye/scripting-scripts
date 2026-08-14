/**
 * 中英双语文案。跟随系统语言：中文环境显示中文，其余显示英文。
 *
 * 用法：`t.copyName` 取静态文案，`t.copied(name)` 取带参数的文案。
 * 新增文案时把中英两份写在同一行，避免两个表对不上。
 */

function detectLanguage(): 'zh' | 'en' {
  try {
    const code = Device.systemLanguageCode || Device.systemLanguageTag || 'en'
    return code.toLowerCase().startsWith('zh') ? 'zh' : 'en'
  } catch {
    return 'en'
  }
}

export const LANG = detectLanguage()
export const IS_ZH = LANG === 'zh'

/** 按当前语言二选一 */
export function pick(zh: string, en: string): string {
  return IS_ZH ? zh : en
}

/** 内置数据源在 library.source 里存这个值，显示时再翻译 */
export const BUILTIN_SOURCE = 'builtin'

export const t = {
  // -------------------------------------------------- 通用
  appTitle: 'SF Keyboard',
  done: pick('完成', 'Done'),
  copyName: pick('复制名称', 'Copy Name'),
  copyPng: pick('复制 PNG', 'Copy PNG'),
  exportPng: pick('导出 PNG 文件', 'Export PNG File'),
  exportPngShort: pick('导出 PNG', 'Export PNG'),
  insertName: pick('输入名称', 'Insert Name'),
  builtinSource: pick('内置', 'Built-in'),

  pngSmall: pick('小 · 128px', 'Small · 128px'),
  pngMedium: pick('中 · 256px', 'Medium · 256px'),
  pngLarge: pick('大 · 512px', 'Large · 512px'),

  // -------------------------------------------------- 键盘
  searchWord: pick('取词搜索', 'Grab Word'),
  noWordBeforeCursor: pick('光标前没有可用的关键词', 'No word before the cursor'),
  preparingLibrary: pick('正在准备图标库…', 'Preparing symbol library…'),
  space: pick('空格', 'space'),
  renderingPng: pick('正在生成 PNG…', 'Rendering PNG…'),
  pngCopiedHint: pick('PNG 已复制，长按输入框粘贴', 'PNG copied — long press to paste'),
  pngFailed: pick('PNG 生成失败', 'Failed to render PNG'),
  nameCopied: pick('名称已复制', 'Name copied'),
  pngCopied: pick('PNG 已复制', 'PNG copied'),
  renderFailed: pick('生成失败', 'Render failed'),

  noMatchingSymbols: pick('没有匹配的图标', 'No matching symbols'),
  noRecents: pick('还没有用过的图标', 'No symbols used yet'),
  emptyCategory: pick('这个分类是空的', 'This category is empty'),

  searching: (query: string) => pick(`搜索「${query}」`, `Search “${query}”`),
  copied: (name: string) => pick(`已复制「${name}」`, `Copied “${name}”`),
  showMore: (remaining: number) =>
    pick(`显示更多（还有 ${remaining} 个）`, `Show more (${remaining} left)`),

  // -------------------------------------------------- App
  searchPrompt: pick('搜索图标名，如 wifi、arrow.up', 'Search symbol names, e.g. wifi, arrow.up'),
  more: pick('更多', 'More'),
  importMerge: pick('导入并合并', 'Import & Merge'),
  importReplace: pick('导入并覆盖', 'Import & Replace'),
  revalidate: pick('重新校验可用性', 'Revalidate Availability'),
  exportLibrary: pick('导出当前列表', 'Export Current List'),
  clearRecents: pick('清空最近使用', 'Clear Recents'),
  restoreBuiltin: pick('恢复内置列表', 'Restore Built-in List'),

  loadingLibrary: pick('正在加载图标库…', 'Loading symbol library…'),
  parsingSource: pick('正在解析源文件…', 'Parsing source files…'),
  checkingAvailability: pick('正在校验图标是否可用…', 'Checking symbol availability…'),
  validating: pick('正在校验…', 'Validating…'),
  restoring: pick('正在恢复…', 'Restoring…'),

  nothingParsedTitle: pick('没有解析到图标', 'No symbols found'),
  nothingParsedMessage: pick(
    '请确认文件内容是符号名清单。支持：\n' +
      '· SF Symbols.app 的 symbol_categories.plist / name_availability.plist\n' +
      '· JSON（数组或 分类 -> 名称数组）\n' +
      '· CSV（name,category）\n' +
      '· 纯文本（每行一个名称）',
    'Make sure the file contains a list of symbol names. Supported:\n' +
      '· symbol_categories.plist / name_availability.plist from SF Symbols.app\n' +
      '· JSON (an array, or category -> names)\n' +
      '· CSV (name,category)\n' +
      '· Plain text (one name per line)'
  ),
  importDoneTitle: pick('导入完成', 'Import complete'),
  importFailedTitle: pick('导入失败', 'Import failed'),
  validateDoneTitle: pick('校验完成', 'Validation complete'),
  restoreConfirmTitle: pick('恢复内置图标列表', 'Restore built-in list'),
  restoreConfirmMessage: pick(
    '导入的数据会被清除，恢复为脚本自带的分类和图标。',
    'Imported data will be discarded and the script’s own categories and symbols restored.'
  ),
  restoreConfirmLabel: pick('恢复', 'Restore'),

  importDoneMessage: (parsed: number, usable: number, removed: number) =>
    pick(
      `解析到 ${parsed} 条记录，当前系统可用 ${usable} 个图标` +
        (removed > 0 ? `，已过滤 ${removed} 个不可用的名称。` : '。'),
      `Parsed ${parsed} entries, ${usable} symbols available on this system` +
        (removed > 0 ? `, ${removed} unavailable names filtered out.` : '.')
    ),
  validateDoneMessage: (usable: number, removed: number) =>
    pick(
      `可用图标 ${usable} 个${removed > 0 ? `，移除 ${removed} 个` : ''}。`,
      `${usable} symbols available${removed > 0 ? `, ${removed} removed` : ''}.`
    ),
  overview: (total: number, source: string) =>
    pick(`${total} 个图标 · 来源：${source}`, `${total} symbols · source: ${source}`),
  emptyCategoryApp: pick('这个分类还没有图标', 'No symbols in this category yet'),

  // -------------------------------------------------- 图标详情
  tabInfo: pick('信息', 'Info'),
  tabStyle: pick('主题', 'Style'),
  tabAnimation: pick('动画', 'Animation'),

  renderingMode: pick('渲染模式', 'Rendering'),
  gradient: pick('渐变', 'Gradient'),
  variable: pick('可变', 'Variable'),
  variableValue: pick('可变值', 'Variable Value'),
  colorLabel: pick('颜色', 'Color'),
  colorPrimary: pick('第一层', 'Primary'),
  colorSecondary: pick('第二层', 'Secondary'),
  colorTertiary: pick('第三层', 'Tertiary'),
  paletteHint: pick(
    '调色板模式下符号的三层分别用这三种颜色渲染；层数不够的符号，多余的颜色不生效。',
    'In palette mode the symbol’s three layers take these colours; extra colours are ignored on symbols with fewer layers.'
  ),
  opacity: pick('不透明度', 'Opacity'),
  background: pick('背景', 'Background'),

  animationKind: pick('动画', 'Animation'),
  animationVariant: pick('变体', 'Variant'),
  repeatPlay: pick('重复播放', 'Repeat'),
  repeatOnce: pick('一次', 'Once'),
  repeatContinuous: pick('循环', 'Continuous'),
  speed: pick('速度', 'Speed'),
  play: pick('播放', 'Play'),
  reset: pick('还原', 'Reset'),

  nameLabel: pick('名称', 'Name'),
  categoriesLabel: pick('所属分类', 'Categories'),
  variantsLabel: pick('同族变体', 'Variants'),
  variantHint: pick('点按可切换预览', 'Tap to preview'),
  styleSharedHint: pick(
    '这套主题会一起用在键盘长按复制的 PNG 上。',
    'The keyboard’s long-press PNG copy uses this style too.'
  ),
  animationVariantHint: pick(
    '方向和作用范围在 SwiftUI 里是同一个维度，没有「向上 + 按图层」这种组合，所以合成了一个选项。',
    'SwiftUI exposes direction and scope as one axis — there is no “up + by layer” combination, so they share one picker.'
  ),
}
