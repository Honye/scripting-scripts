/**
 * SF Keyboard - 共享类型定义
 */
import type { Color } from 'scripting'

/** 单个分类的元信息 */
export type CategoryMeta = {
  /** 分类唯一标识，与 SF Symbols 官方 category key 保持一致 */
  key: string
  /** 中文名称 */
  label: string
  /** 英文名称（导入 SF Symbols 官方数据时用于匹配） */
  labelEn: string
  /** 英文短名，给键盘侧栏这种窄位置用 */
  labelEnShort: string
  /** 侧栏展示用的 SF Symbol 图标 */
  icon: string
}

/**
 * 图标库数据结构。
 * `categories` 为分类顺序，`symbols` 为 分类key -> 图标名数组。
 */
export type SymbolLibrary = {
  /** 数据版本，便于以后做迁移 */
  version: number
  /** 数据来源描述，例如 "内置" 或 "symbol_categories.plist" */
  source: string
  /** 更新时间戳（毫秒） */
  updatedAt: number
  /** 分类顺序（key 列表），未在此列出的分类不展示 */
  order: string[]
  /** 分类 key -> 图标名数组 */
  symbols: Record<string, string[]>
  /** 自定义分类的显示名（导入数据带来的新分类） */
  customLabels?: Record<string, string>
}

/** 源文件解析结果 */
export type ParseResult = {
  /** 分类 key -> 图标名数组 */
  symbols: Record<string, string[]>
  /** 分类 key -> 显示名 */
  labels: Record<string, string>
  /** 解析出的图标总数（去重后） */
  total: number
  /** 使用的解析器名称 */
  format: string
}

/** 复制 PNG 时的配置 */
export type PngExportOptions = {
  /** 边长（pt） */
  size: number
  /** 渲染倍率 */
  scale: number
  /** 前景色 */
  color: Color
  /** 背景色，null 表示透明 */
  background: Color | null
}
