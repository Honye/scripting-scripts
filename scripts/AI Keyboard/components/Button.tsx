import { Button, ButtonProps, LongPressGesture, VirtualNode, useRef } from "scripting"

type Props = (
  {
    title: string
    systemImage?: string
  } | {
    children: (VirtualNode | undefined | null | (VirtualNode | undefined | null)[])[] | VirtualNode
  }
) & {
  onTap?: () => void
  onLongPress?: () => void
}

export default function TapButton({ onTap, onLongPress, ...props }: Props) {
  let children = 'children' in props ? props.children : []
  const wasLongPressed = useRef(false)

  const longPressGesture = LongPressGesture()
  longPressGesture.onEnded(() => {
    wasLongPressed.current = true
    onLongPress?.()
  })

  const handleTap = () => {
    if (!wasLongPressed.current) {
      onTap?.()
    }
    wasLongPressed.current = false
  }

  return (
    <Button
      action={handleTap}
      simultaneousGesture={longPressGesture}
      {...props}
    >{children}</Button>
  )
}
