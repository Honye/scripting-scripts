import { Button, Image, RoundedRectangle, VirtualNode, ZStack } from 'scripting'
import { FG_PRIMARY, KEY_BACKGROUND, KEY_BACKGROUND_ACTIVE } from '../constants/theme'

export type SymbolCellProps = {
  name: string
  /** 格子边长 */
  size: number
  /** 图标字号 */
  iconSize: number
  onTap: () => void
  /** 长按菜单内容 */
  menuItems?: VirtualNode
  highlighted?: boolean
}

export function SymbolCell({
  name,
  size,
  iconSize,
  onTap,
  menuItems,
  highlighted,
}: SymbolCellProps) {
  return (
    <Button
      action={onTap}
      buttonStyle="plain"
      contextMenu={menuItems ? { menuItems } : undefined}
    >
      <ZStack frame={{ width: size, height: size }}>
        <RoundedRectangle
          cornerRadius={8}
          fill={highlighted ? KEY_BACKGROUND_ACTIVE : KEY_BACKGROUND}
        />
        <Image
          systemName={name}
          font={iconSize}
          foregroundStyle={FG_PRIMARY}
          minScaleFactor={0.6}
        />
      </ZStack>
    </Button>
  )
}
