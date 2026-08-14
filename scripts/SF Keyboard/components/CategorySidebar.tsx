import { Button, Image, RoundedRectangle, ScrollView, Text, VStack, ZStack } from 'scripting'
import { RECENTS_KEY, categoryLabel, getCategory } from '../constants/categories'
import { FG_ACCENT, FG_PRIMARY, SIDEBAR_ACTIVE_BACKGROUND } from '../constants/theme'
import type { SymbolLibrary } from '../types'

export type CategorySidebarProps = {
  library: SymbolLibrary | null
  keys: string[]
  selected: string
  width: number
  spacing: number
  onSelect: (key: string) => void
}

/**
 * 拿到分类的显示名与图标，兼容导入进来的自定义分类。
 * @param compact 侧栏用短名，其他地方用全名
 */
export function describeCategory(
  key: string,
  library: SymbolLibrary | null,
  compact = false
): { label: string; icon: string } {
  const meta = getCategory(key)
  if (meta) return { label: categoryLabel(meta, compact), icon: meta.icon }
  const custom = library?.customLabels?.[key]
  return {
    label: custom || key.replace(/[._-]/g, ' '),
    icon: 'square.grid.2x2',
  }
}

export function CategorySidebar({
  library,
  keys,
  selected,
  width,
  spacing,
  onSelect,
}: CategorySidebarProps) {
  return (
    <ScrollView axes="vertical" scrollIndicator="hidden" frame={{ width }}>
      <VStack spacing={spacing} padding={{ vertical: spacing }}>
        {keys.map(key => {
          const { label, icon } = describeCategory(key, library, true)
          const active = key === selected
          // 未选中时不画底色形状：透明色在这里不可靠，少画一层最稳
          const foreground = active ? FG_ACCENT : FG_PRIMARY
          return (
            <Button key={key} action={() => onSelect(key)} buttonStyle="plain">
              <ZStack
                frame={{ width: width - spacing * 2, height: 46 }}
                contentShape={{ type: 'rect', cornerRadius: 9, style: 'continuous' }}
              >
                {active ? (
                  <RoundedRectangle cornerRadius={9} fill={SIDEBAR_ACTIVE_BACKGROUND} />
                ) : null}
                <VStack spacing={2}>
                  <Image
                    systemName={key === RECENTS_KEY ? 'clock.arrow.circlepath' : icon}
                    font={16}
                    foregroundStyle={foreground}
                  />
                  <Text
                    font={10}
                    lineLimit={1}
                    minScaleFactor={0.6}
                    foregroundStyle={foreground}
                  >
                    {label}
                  </Text>
                </VStack>
              </ZStack>
            </Button>
          )
        })}
      </VStack>
    </ScrollView>
  )
}
