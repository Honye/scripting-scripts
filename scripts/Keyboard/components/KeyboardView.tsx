import { Button, Group, HStack, Image, RoundedRectangle, Spacer, Text, useMemo, useState, VStack } from "scripting"
import { Colors } from "../constansts/colors"
import { Alphabet, getLettersInRow1, getLettersInRow2, getLettersInRow3, getNumbers } from "../constansts/symbols"
import Key from "./Key"
import { useFontConfig } from "../hooks/useFontConfig"
import { FontSelect } from "./FontSelect"
import { getChars } from "../utils"

// 字母键宽：70
// 符号键宽：90
// 回车键款：194
// 123：91
//
// 每行左右间隙：8
// 字母左右间隙：12
// 字母上下间隙：22

const insertSpace = (() => {
  let interval: number | null = null
  const insert = () => {
    CustomKeyboard.insertText(" ")
    interval = setTimeout(insert, 100)
  }
  return (state: boolean) => {
    if (state) {
      HapticFeedback.lightImpact()
      if (interval !== null) {
        clearTimeout(interval)
        interval = null
      }
      insert()
    } else if (interval !== null) {
      clearTimeout(interval)
      interval = null
    }
  }
})()

export default function KeyboardView() {
  const [hasShiftFlag, setHasShiftFlag] = useState(false)
  const [numFlag, setNumFlag] = useState(false)
  const padding = Number.parseInt(Device.systemVersion) > 18 ? 8 : 4
  const gapX = 6
  const gapY = 11
  const itemHeight = 45

  const types = Object.keys(Alphabet)
  types.unshift("Standard")

  const { config, setFont } = useFontConfig()

  const charsInRow1 = useMemo(
    () => {
      return numFlag
        ? getNumbers(config?.font || 'Standard')
        : getLettersInRow1(hasShiftFlag, config?.font || 'Standard')
    },
    [hasShiftFlag, config?.font, numFlag])
  const charsInRow2 = useMemo(
    () => {
      return numFlag
        ? ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"']
        : getLettersInRow2(hasShiftFlag, config?.font || 'Standard')
    },
    [hasShiftFlag, config?.font, numFlag]
  )
  const charsInRow3 = useMemo(
    () => {
      return numFlag
        ? ['.', ',', '{', '}', '?', '!', "'"]
        : getLettersInRow3(hasShiftFlag, config?.font || 'Standard')
    },
    [hasShiftFlag, config?.font, numFlag]
  )
  const insertText = (char: string) => CustomKeyboard.insertText(char)
  const toggleShiftFlag = () => {
    HapticFeedback.lightImpact()
    setHasShiftFlag(!hasShiftFlag)
  }
  const toggleNumFlag = () => {
    HapticFeedback.lightImpact()
    setNumFlag(!numFlag)
  }

  const handleReturn = () => {
    HapticFeedback.lightImpact()
    insertText("\n")
  }
  const deleteBackward = () => {
    let interval: number | null
    const del = () => {
      CustomKeyboard.deleteBackward()
      interval = setTimeout(del, 100)
    }
    return (state: boolean) => {
      if (state) {
        HapticFeedback.lightImpact()
        if (interval !== null) {
          clearTimeout(interval)
          interval = null
        }
        del()
      } else if (interval !== null) {
        clearTimeout(interval)
        interval = null
      }
    }
  }

  return (
    <VStack
      padding={{
        horizontal: padding,
        top: padding + 1,
        bottom: padding
      }}
      spacing={gapY}
    >
      {/* <HStack spacing={gapX}>
        {getNumbers(config?.font || 'Standard').map((n) => (
          <Key key={n} title={`${n}`} font={22} />
        ))}
      </HStack> */}
      <HStack spacing={gapX}>
        {charsInRow1.map((char) => (
          <Key
            key={char}
            title={char}
            font={hasShiftFlag ? 22 : 26}
          />
        ))}
      </HStack>
      <HStack spacing={gapX}>
        {charsInRow2.map((char) => (
          <Key
            key={char}
            title={char}
            font={hasShiftFlag ? 22 : 26}
          />
        ))}
      </HStack>
      <HStack spacing={6}>
        <Button
          frame={{ width: 45, height: itemHeight }}
          background={
            <RoundedRectangle
              fill={Colors.Background2}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5
              }}
            />
          }
          font={20}
          foregroundStyle={Colors.Foreground2}
          action={toggleShiftFlag}
        >
          <Image systemName={hasShiftFlag ? "shift.fill" : "shift"} />
        </Button>
        <Spacer minLength={0} />
        {charsInRow3.map((char) => (
          <Key
            key={char}
            title={char}
            font={hasShiftFlag ? 22 : 26}
          />
        ))}
        <Spacer minLength={0} />
        <Button
          frame={{ width: 45, height: itemHeight }}
          background={
            <RoundedRectangle
              fill={Colors.Background2}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5
              }}
            />
          }
          font={20}
          foregroundStyle={Colors.Foreground2}
          action={() => {}}
          onLongPressGesture={{
            perform: () => {},
            onPressingChanged: deleteBackward()
          }}
        >
          <Image systemName="delete.left" />
        </Button>
      </HStack>
      <HStack>
        <Button
          frame={{ width: 45, height: itemHeight }}
          title={numFlag ? 'ABC' : '123'}
          background={
            <RoundedRectangle
              fill={Colors.Background2}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5
              }}
            />
          }
          font={16}
          foregroundStyle={Colors.Foreground2}
          action={toggleNumFlag}
        />
        <Button
          frame={{ width: 45, height: itemHeight }}
          background={
            <RoundedRectangle
              fill={Colors.Background2}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5
              }}
            />
          }
          font={20}
          foregroundStyle={Colors.Foreground2}
          action={() => CustomKeyboard.dismissToHome()}
          contextMenu={{
            menuItems: <Group>
              {types.map((type) => (
                <Button
                  key={type}
                  action={() => setFont(type)}
                >
                  <Text>{getChars(type, type)}</Text>
                </Button>
              ))}
            </Group>
          }}
        >
          <Image systemName="face.smiling" />
        </Button>
        <Button
          background={
            <RoundedRectangle
              fill={Colors.Background1}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5
              }}
            />
          }
          font={16}
          foregroundStyle={Colors.Foreground1}
          action={() => {}}
          onLongPressGesture={{
            perform: () => {},
            onPressingChanged: insertSpace
          }}
        >
          <Text frame={{ maxWidth: 'infinity', maxHeight: itemHeight }}>space</Text>
        </Button>
        <Button
          frame={{ width: 97, height: itemHeight }}
          title="return"
          background={
            <RoundedRectangle
              fill={Colors.Background2}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5
              }}
            />
          }
          font={16}
          foregroundStyle={Colors.Foreground2}
          action={handleReturn}
        />
      </HStack>
    </VStack>
  )
}
