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
  /** 每页渲染多少个，点「显示更多」继续加载；传 0 表示不分页，一次全铺开 */
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
 * 分页渲染是键盘里的性能关键：LazyVGrid 只是 SwiftUI 侧的惰性布局，
 * children 数组在 JS 侧仍然会被完整构造并序列化过桥。一个分类几百上千个格子
 * 一次铺开，每次 setState 都要重建整棵树，键盘扩展的主线程被占满，
 * 表现就是列表滑不动、按钮点不动。所以键盘默认只渲染一页，剩下的按需追加。
 *
 * 主应用没有这个约束，传 `pageSize={0}` 一次全部铺开即可。
 */
export function SymbolGrid({
  symbols,
  cellSize,
  iconSize,
  spacing,
  columns,
  pageSize = 60,
  padding = 0,
  emptyTitle,
  emptyIcon = 'square.dashed',
  onTap,
  renderMenu,
}: SymbolGridProps) {
  // 页码和它对应的数据源存在一起，页码是派生出来的：
  // symbols 一换，这一帧算出来的 page 就是 1。
  // 如果改成在 useEffect 里 setPage(1)，切分类的第一帧会先按旧页数
  // 把新分类铺开（翻过几页之后就是好几百个格子），再缩回一页 —— 那一帧
  // 足够把主线程堵住，左边分类栏跟着一起滑不动、点不动。
  const [pageState, setPageState] = useState<{ source: string[]; page: number }>(() => ({
    source: symbols,
    page: 1,
  }))
  const page = pageState.source === symbols ? pageState.page : 1

  const proxyRef = useRef<ScrollViewProxy | null>(null)

  // 换数据源时把列表滚回顶部。放在 setTimeout 里等新内容布局完成再滚。
  useEffect(() => {
    const timer = setTimeout(() => {
      proxyRef.current?.scrollTo(TOP_ANCHOR, 'top')
    }, 0)
    return () => clearTimeout(timer)
  }, [symbols])

  const visible = useMemo(() => {
    if (pageSize <= 0) return symbols
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
              <Button action={() => setPageState({ source: symbols, page: page + 1 })} buttonStyle="plain">
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
