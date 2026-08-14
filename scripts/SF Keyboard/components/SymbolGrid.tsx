import {
  Button,
  Image,
  LazyVGrid,
  ScrollView,
  ScrollViewProxy,
  ScrollViewReader,
  Text,
  VStack,
  VirtualNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'scripting'
import { t } from '../constants/i18n'
import { FG_ACCENT, FG_SECONDARY } from '../constants/theme'
import { SymbolCell } from './SymbolCell'

/** 滚动锚点：Scripting 用 `key` 当 SwiftUI 的 `.id()`，scrollTo 认的就是它 */
const TOP_ANCHOR = 'sfkb-grid-top'

export type SymbolGridProps = {
  symbols: string[]
  cellSize: number
  iconSize: number
  spacing: number
  /** 固定列数；不传则按 cellSize 自适应排列 */
  columns?: number
  /** 每页渲染多少个，滑到底可以继续加载 */
  pageSize?: number
  padding?: number
  emptyTitle: string
  emptyIcon?: string
  onTap: (name: string) => void
  renderMenu?: (name: string) => VirtualNode
}

/**
 * 图标网格。
 *
 * 分页渲染是性能的关键：LazyVGrid 只是 SwiftUI 侧的惰性布局，
 * children 数组在 JS 侧仍然会被完整构造并序列化过桥。一个分类几百上千个格子
 * 一次铺开，每次 setState 都要重建整棵树，主线程被占满，
 * 表现就是列表滑不动、按钮点不动。所以默认只渲染一页，剩下的按需追加。
 */
export function SymbolGrid({
  symbols,
  cellSize,
  iconSize,
  spacing,
  columns,
  pageSize = 120,
  padding = 0,
  emptyTitle,
  emptyIcon = 'square.dashed',
  onTap,
  renderMenu,
}: SymbolGridProps) {
  const [page, setPage] = useState(1)
  const proxyRef = useRef<ScrollViewProxy | null>(null)

  // 切换分类 / 改搜索词时回到第一页，并把列表滚回顶部。
  // scrollTo 放在 setTimeout 里，等这次 setPage 引起的重渲染完成、
  // 新内容完成布局之后再滚，否则可能滚到旧内容的位置。
  useEffect(() => {
    setPage(1)
    const timer = setTimeout(() => {
      proxyRef.current?.scrollTo(TOP_ANCHOR, 'top')
    }, 0)
    return () => clearTimeout(timer)
  }, [symbols])

  const visible = useMemo(() => {
    const end = page * pageSize
    return symbols.length <= end ? symbols : symbols.slice(0, end)
  }, [symbols, page, pageSize])

  const gridColumns = useMemo(() => {
    if (columns && columns > 0) {
      return new Array(columns).fill(0).map(() => ({
        size: { type: 'flexible' as const, min: cellSize, max: cellSize + 12 },
        spacing,
      }))
    }
    return [
      {
        size: { type: 'adaptive' as const, min: cellSize, max: cellSize + 16 },
        spacing,
      },
    ]
  }, [columns, cellSize, spacing])

  const cells = useMemo(
    () =>
      visible.map(name => (
        <SymbolCell
          key={name}
          name={name}
          size={cellSize}
          iconSize={iconSize}
          onTap={() => onTap(name)}
          menuItems={renderMenu ? renderMenu(name) : undefined}
        />
      )),
    [visible, cellSize, iconSize, onTap, renderMenu]
  )

  if (symbols.length === 0) {
    return (
      <VStack spacing={6} frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
        <Image systemName={emptyIcon} font={22} foregroundStyle={FG_SECONDARY} />
        <Text font={12} foregroundStyle={FG_SECONDARY}>
          {emptyTitle}
        </Text>
      </VStack>
    )
  }

  const remaining = symbols.length - visible.length

  return (
    <ScrollViewReader>
      {proxy => {
        // proxy 只在渲染时给到，存起来给上面的 effect 用
        proxyRef.current = proxy
        return (
          <ScrollView axes="vertical" scrollIndicator="hidden">
            <LazyVGrid
              key={TOP_ANCHOR}
              spacing={spacing}
              columns={gridColumns}
              padding={padding ? { horizontal: padding, vertical: padding } : undefined}
            >
              {cells}
            </LazyVGrid>
            {remaining > 0 ? (
              <Button action={() => setPage(p => p + 1)} buttonStyle="plain">
                <Text
                  font={12}
                  padding={{ vertical: 10 }}
                  frame={{ maxWidth: 'infinity' }}
                  foregroundStyle={FG_ACCENT}
                >
                  {t.showMore(remaining)}
                </Text>
              </Button>
            ) : null}
          </ScrollView>
        )
      }}
    </ScrollViewReader>
  )
}
