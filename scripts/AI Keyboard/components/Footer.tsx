import { HStack, Image, Text, useEffect, useState } from 'scripting'
import { adaptiveParams } from '../utils/adaptive'
import Button from "./Button"

type FooterProps = {
  isMultiTurn: boolean
  currentAIServiceName: string
  isGenerating: boolean
  onTap: () => void
  onLongPress: () => void
}

export function Footer({
  isMultiTurn,
  currentAIServiceName,
  isGenerating,
  onTap,
  onLongPress,
}: FooterProps) {
  const [generatingIcon, setGeneratingIcon] = useState(0)

  useEffect(() => {
    let timer: number | null = null
    if (isGenerating) {
      const tick = () => {
        setGeneratingIcon((prev) => (prev ? 0 : 1))
        HapticFeedback.lightImpact()
        setTimeout(() => {
          setGeneratingIcon((prev) => (prev ? 0 : 1))
          HapticFeedback.lightImpact()
        }, 200)
        timer = setTimeout(tick, 1200)
      }
      tick()
    } else {
      setGeneratingIcon(0)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isGenerating])

  const symbol = isGenerating
    ? generatingIcon
      ? 'ellipsis.bubble.fill'
      : 'ellipsis.bubble'
    : isMultiTurn
    ? 'bubble.left.and.bubble.right'
    : 'bubble.left'

  const onPressingChanged = () => {
    let start = Date.now()
    let end = Date.now()
    return (pressing: boolean) => {
      if (pressing) {
        start = Date.now()
      } else {
        end = Date.now()
        if (end - start >= 200) {
          onLongPress()
        } else {
          onTap()
        }
      }
    }
  }

  return (
    <HStack alignment='center' frame={{ height: adaptiveParams.footerHeight }}>
      <Button
        foregroundStyle='#aaaaaa'
        onTap={onTap}
        onLongPress={onLongPress}
      >
        <Image systemName={symbol} />
        <Text font={adaptiveParams.footerFontSize}>
          AI {currentAIServiceName}
        </Text>
      </Button>
    </HStack>
  )
}
