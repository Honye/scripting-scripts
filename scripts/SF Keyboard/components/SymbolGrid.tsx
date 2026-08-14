import { Image, LazyVGrid, ScrollView, Text, VStack, VirtualNode } from 'scripting'
import { FG_SECONDARY } from '../constants/theme'
import { SymbolCell } from './SymbolCell'

export type SymbolGridProps = {
  symbols: string[]
  cellSize: number
  iconSize: number
  spacing: number
  columns: number
  /** 一次最多渲染多少个，避免超大分类拖慢键盘 */
  limit?: number
  emptyTitle: string
  emptyIcon?: string
  onTap: (name: string) => void
  renderMenu?: (name: string) => VirtualNode
}

export function SymbolGrid({
  symbols,
  cellSize,
  iconSize,
  spacing,
  columns,
  limit = 900,
  emptyTitle,
  emptyIcon = 'square.dashed',
  onTap,
  renderMenu,
}: SymbolGridProps) {
  if (symbols.length === 0) {
    return (
      <VStack spacing={6} frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
        <Image
          systemName={emptyIcon}
          font={22}
          foregroundStyle={FG_SECONDARY}
        />
        <Text font={12} foregroundStyle={FG_SECONDARY}>
          {emptyTitle}
        </Text>
      </VStack>
    )
  }

  const visible = symbols.length > limit ? symbols.slice(0, limit) : symbols

  return (
    <ScrollView axes="vertical" scrollIndicator="hidden">
      <LazyVGrid
        spacing={spacing}
        columns={new Array(columns).fill(0).map(() => ({
          size: { type: 'flexible' as const, min: cellSize, max: cellSize + 12 },
          spacing,
        }))}
      >
        {visible.map(name => (
          <SymbolCell
            key={name}
            name={name}
            size={cellSize}
            iconSize={iconSize}
            onTap={() => onTap(name)}
            menuItems={renderMenu ? renderMenu(name) : undefined}
          />
        ))}
      </LazyVGrid>
      {symbols.length > visible.length ? (
        <Text
          font={11}
          padding={8}
          foregroundStyle={FG_SECONDARY}
        >
          仅显示前 {visible.length} 个，共 {symbols.length} 个，用搜索缩小范围
        </Text>
      ) : null}
    </ScrollView>
  )
}
