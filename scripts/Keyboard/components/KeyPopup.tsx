import { DynamicShapeStyle, Font, Path2D, PathShape, Text, ZStack } from 'scripting'
import { Colors } from '../constansts/colors'

// 气泡背景需不透明：亮色纯白，暗色用偏浅的实色灰（不沿用 Background1 的半透明）
const PopupBackground: DynamicShapeStyle = {
  light: 'white',
  dark: '#6E6E73',
}

/**
 * iOS 系统键盘按键气泡：上方一个比按键更宽的圆角“气球”，
 * 经一段内凹的颈部收窄到按键宽度，再向下覆盖按键本身，构成一个连续白色形状。
 */
export default function KeyPopup(props: {
  title: string
  /** 按键宽度（颈部与按键覆盖区的宽度） */
  keyWidth: number
  /** 气球顶部宽度 */
  width: number
  /** 气泡总高度（气球 + 颈部 + 覆盖按键的部分） */
  height: number
  font?: number | Font | { name: string; size: number }
}) {
  const { title, keyWidth, width: W, height: H, font = 26 } = props

  const drawBalloon = (path: Path2D, size: { width: number; height: number }) => {
    const w = size.width
    const h = size.height
    const r = 11 // 气球顶部圆角
    const br = 5 // 按键底部圆角
    const xL = (w - keyWidth) / 2 // 颈部左边（= 按键左边）
    const xR = (w + keyWidth) / 2 // 颈部右边（= 按键右边）
    const bodyH = h * 0.38 // 气球直边底部
    const neckEndY = h * 0.66 // 颈部收窄结束、进入按键直边
    const midY = (bodyH + neckEndY) / 2 // S 形过渡中点

    path.move({ x: r, y: 0 })
    path.addLine({ x: w - r, y: 0 })
    path.addQuadCurve({ x: w, y: r }, { x: w, y: 0 }) // 右上圆角
    path.addLine({ x: w, y: bodyH }) // 气球右直边
    // 右侧 S 形颈部：两端切线均为竖直，平滑衔接气球直边与按键直边
    path.addCurve({ x: xR, y: neckEndY }, { x: w, y: midY }, { x: xR, y: midY })
    path.addLine({ x: xR, y: h - br }) // 按键右直边
    path.addQuadCurve({ x: xR - br, y: h }, { x: xR, y: h }) // 右下圆角
    path.addLine({ x: xL + br, y: h }) // 底边
    path.addQuadCurve({ x: xL, y: h - br }, { x: xL, y: h }) // 左下圆角
    path.addLine({ x: xL, y: neckEndY }) // 按键左直边
    // 左侧 S 形颈部（镜像）
    path.addCurve({ x: 0, y: bodyH }, { x: xL, y: midY }, { x: 0, y: midY })
    path.addLine({ x: 0, y: r }) // 气球左直边
    path.addQuadCurve({ x: r, y: 0 }, { x: 0, y: 0 }) // 左上圆角
    path.closeSubpath()
  }

  return (
    <ZStack
      alignment='top'
      frame={{ width: W, height: H }}
      zIndex={10}
      allowsHitTesting={false}
    >
      <PathShape
        fill={PopupBackground}
        draw={drawBalloon}
        frame={{ width: W, height: H }}
        shadow={{ x: 0, y: 1, color: 'rgba(0,0,0,0.3)', radius: 3 }}
      />
      <Text
        font={typeof font === 'number' ? font * 1.6 : 34}
        foregroundStyle={Colors.Foreground1}
        frame={{ width: W, height: H * 0.42 }}
      >{title}</Text>
    </ZStack>
  )
}
