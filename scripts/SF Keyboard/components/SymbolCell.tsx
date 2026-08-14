import { Button, Image, VirtualNode } from 'scripting'
import { backgroundColor, foregroundStyleOf, type SymbolStyle } from '../constants/symbolStyle'
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
  /** 图标详情页里配置的渲染主题，不传就用默认前景色 */
  style?: SymbolStyle
}

const SHAPE = { type: 'rect', cornerRadius: 8, style: 'continuous' } as const

/**
 * 单个图标格子。
 *
 * 这里刻意只用 Button + Image 两层：网格一次要渲染几百个格子，
 * 每个格子多一层 ZStack/RoundedRectangle，累计到桥接层就是几千个节点，
 * 主线程被占满后表现就是「滑不动、点不动」。圆角底色改用 background +
 * clipShape 修饰符实现，节点数减半。
 *
 * `contentShape` 保证整个方格都可点，而不是只有图标的那几个像素。
 */
export function SymbolCell({
  name,
  size,
  iconSize,
  onTap,
  menuItems,
  highlighted,
  style,
}: SymbolCellProps) {
  // 主题里选了白/黑底就用它，格子就是导出效果的真实预览；
  // 选「透明」（默认）则退回按键底色，否则白色图标会糊在白色格子上
  const themeBackground = style ? backgroundColor(style.background) : null
  const background = highlighted
    ? KEY_BACKGROUND_ACTIVE
    : (themeBackground ?? KEY_BACKGROUND)

  return (
    <Button
      action={onTap}
      buttonStyle="plain"
      contextMenu={menuItems ? { menuItems } : undefined}
    >
      <Image
        systemName={name}
        font={iconSize}
        minScaleFactor={0.6}
        variableValue={style?.variable ? style.variableValue : undefined}
        symbolRenderingMode={style?.renderingMode}
        foregroundStyle={style ? foregroundStyleOf(style) : FG_PRIMARY}
        frame={{ width: size, height: size }}
        background={background}
        clipShape={SHAPE}
        contentShape={SHAPE}
      />
    </Button>
  )
}
