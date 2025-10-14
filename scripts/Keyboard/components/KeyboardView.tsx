import {
  Button,
  Group,
  HStack,
  Image,
  RoundedRectangle,
  Spacer,
  Text,
  useCallback,
  useMemo,
  useState,
  VStack,
} from 'scripting'
import { Colors } from '../constansts/colors'
import {
  Alphabet,
  getLettersInRow1,
  getLettersInRow2,
  getLettersInRow3,
  getNumbers,
} from '../constansts/symbols'
import Key from './Key'
import { useFontConfig } from '../hooks/useFontConfig'
import { FontSelect } from './FontSelect'
import { getChars } from '../utils'

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
    CustomKeyboard.insertText(' ')
    interval = setTimeout(insert, 100)
  }
  return (state: boolean) => {
    if (state) {
      HapticFeedback.selection()
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
  const [charsFlag, setCharsFlag] = useState(false)
  const padding = Number.parseInt(Device.systemVersion) > 18 ? 8 : 4
  const gapX = 6
  const gapY = 11
  const itemHeight = 45

  const types = Object.keys(Alphabet)
  types.unshift('Standard')

  const { config, setFont } = useFontConfig()

  const charsInRow1 = useMemo(() => {
    return numFlag
      ? charsFlag
        ? ['[', ']', '{', '}', '#', '%', '^', '*', '+', '=']
        : getNumbers(config?.font || 'Standard')
      : getLettersInRow1(hasShiftFlag, config?.font || 'Standard')
  }, [hasShiftFlag, config?.font, numFlag, charsFlag])
  const charsInRow2 = useMemo(() => {
    return numFlag
      ? charsFlag
        ? ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•']
        : ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"']
      : getLettersInRow2(hasShiftFlag, config?.font || 'Standard')
  }, [hasShiftFlag, config?.font, numFlag, charsFlag])
  const charsInRow3 = useMemo(() => {
    return numFlag
      ? ['.', ',', '{', '}', '?', '!', "'"]
      : getLettersInRow3(hasShiftFlag, config?.font || 'Standard')
  }, [hasShiftFlag, config?.font, numFlag])
  const insertText = (char: string) => CustomKeyboard.insertText(char)
  const onShiftTap = useCallback(() => {
    HapticFeedback.selection()
    if (numFlag) {
      setCharsFlag(!charsFlag)
    } else {
      setHasShiftFlag(!hasShiftFlag)
    }
  }, [charsFlag, hasShiftFlag, numFlag])

  const toggleNumFlag = useCallback(() => {
    HapticFeedback.selection()
    if (numFlag) {
      setCharsFlag(false)
    }
    setNumFlag(!numFlag)
  }, [numFlag])

  const handleReturn = () => {
    HapticFeedback.selection()
    insertText('\n')
  }
  const deleteBackward = () => {
    let interval: number | null
    const del = () => {
      CustomKeyboard.deleteBackward()
      interval = setTimeout(del, 100)
    }
    return (state: boolean) => {
      if (state) {
        HapticFeedback.selection()
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
        bottom: padding,
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
          <Key key={char} title={char} font={hasShiftFlag ? 22 : 26} />
        ))}
      </HStack>
      <HStack spacing={gapX}>
        {charsInRow2.map((char) => (
          <Key key={char} title={char} font={hasShiftFlag ? 22 : 26} />
        ))}
      </HStack>
      <HStack spacing={6}>
        <Button
          background={
            <RoundedRectangle
              fill={Colors.Background2}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5,
              }}
            />
          }
          font={20}
          foregroundStyle={Colors.Foreground2}
          action={onShiftTap}
        >
          {numFlag ? (
            <Text frame={{ width: 45, height: itemHeight }} font={16}>#+=</Text>
          ) : (
            <Image
              frame={{ width: 45, height: itemHeight }}
              systemName={hasShiftFlag ? 'shift.fill' : 'shift'}
            />
          )}
        </Button>
        <Spacer minLength={0} />
        {charsInRow3.map((char) => (
          <Key key={char} title={char} font={hasShiftFlag ? 22 : 26} />
        ))}
        <Spacer minLength={0} />
        <Button
          background={
            <RoundedRectangle
              fill={Colors.Background2}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5,
              }}
            />
          }
          font={20}
          foregroundStyle={Colors.Foreground2}
          action={() => {}}
          onLongPressGesture={{
            perform: () => {},
            onPressingChanged: deleteBackward(),
          }}
        >
          <Image frame={{ width: 45, height: itemHeight }} systemName='delete.left' />
        </Button>
      </HStack>
      <HStack>
        <Button
          background={
            <RoundedRectangle
              fill={Colors.Background2}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5,
              }}
            />
          }
          font={16}
          foregroundStyle={Colors.Foreground2}
          action={toggleNumFlag}
        >
          <Text frame={{ width: 45, height: itemHeight }}>{numFlag ? 'ABC' : '123'}</Text>
        </Button>
        <Button
          background={
            <RoundedRectangle
              fill={Colors.Background2}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5,
              }}
            />
          }
          font={20}
          foregroundStyle={Colors.Foreground2}
          action={() => CustomKeyboard.dismissToHome()}
          contextMenu={{
            menuItems: (
              <Group>
                {types.map((type) => (
                  <Button key={type} action={() => setFont(type)}>
                    <Text>{getChars(type, type)}</Text>
                  </Button>
                ))}
              </Group>
            ),
          }}
        >
          <Image frame={{ width: 45, height: itemHeight }} systemName='face.smiling' />
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
                radius: 0.5,
              }}
            />
          }
          font={16}
          foregroundStyle={Colors.Foreground1}
          action={() => {}}
          onLongPressGesture={{
            perform: () => {},
            onPressingChanged: insertSpace,
          }}
        >
          <Text frame={{ maxWidth: 'infinity', maxHeight: itemHeight }}>
            space
          </Text>
        </Button>
        <Button
          background={
            <RoundedRectangle
              fill={Colors.Background2}
              cornerRadius={6}
              shadow={{
                x: 0.5,
                y: 1,
                color: 'rgba(0,0,0,0.3)',
                radius: 0.5,
              }}
            />
          }
          font={16}
          foregroundStyle={Colors.Foreground2}
          action={handleReturn}
        >
          <Text frame={{ width: 97, height: itemHeight }}>return</Text>
        </Button>
      </HStack>
    </VStack>
  )
}
