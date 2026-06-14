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
  useRef,
  useState,
  VStack,
} from 'scripting'
import { Colors } from '../constansts/colors'
import {
  Alphabet,
  getCandidates,
} from '../constansts/symbols'
import Key from './Key'
import { useFontConfig } from '../hooks/useFontConfig'
import { FontSelect } from './FontSelect'
import { getChars } from '../utils'
import { POPUP_RISE } from '../constansts/layout'
import CandidateBar from './CandidateBar'

type KeyItem = { base: string; display: string }

/** 把基础字符数组转成 { 基础字符, 当前字体显示字形 } 列表 */
const toItems = (bases: string[], font: string): KeyItem[] =>
  bases.map((base) => ({ base, display: getChars(base, font) }))

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
  // 大小写状态：off 小写 / once 单次大写(输入一个字符后回小写) / lock 固定大写
  const [shiftState, setShiftState] = useState<'off' | 'once' | 'lock'>('off')
  const hasShiftFlag = shiftState !== 'off'
  const lastShiftTapRef = useRef(0)
  const [numFlag, setNumFlag] = useState(false)
  const [charsFlag, setCharsFlag] = useState(false)
  const padding = Number.parseInt(Device.systemVersion) > 18 ? 8 : 4
  const gapX = 6
  const gapY = 11
  const itemHeight = 45

  const types = Object.keys(Alphabet)
  types.unshift('Standard')

  const { config, setFont } = useFontConfig()
  const font = config?.font || 'Standard'

  // 候选词栏：当前按键的所有字体样式变体
  const [candidates, setCandidates] = useState<string[]>([])

  const charsInRow1 = useMemo<KeyItem[]>(() => {
    const bases = numFlag
      ? charsFlag
        ? ['[', ']', '{', '}', '#', '%', '^', '*', '+', '=']
        : '1234567890'.split('')
      : (hasShiftFlag ? 'QWERTYUIOP' : 'qwertyuiop').split('')
    return toItems(bases, font)
  }, [hasShiftFlag, font, numFlag, charsFlag])
  const charsInRow2 = useMemo<KeyItem[]>(() => {
    const bases = numFlag
      ? charsFlag
        ? ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•']
        : ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"']
      : (hasShiftFlag ? 'ASDFGHJKL' : 'asdfghjkl').split('')
    return toItems(bases, font)
  }, [hasShiftFlag, font, numFlag, charsFlag])
  const charsInRow3 = useMemo<KeyItem[]>(() => {
    const bases = numFlag
      ? ['.', ',', '{', '}', '?', '!', "'"]
      : (hasShiftFlag ? 'ZXCVBNM' : 'zxcvbnm').split('')
    return toItems(bases, font)
  }, [hasShiftFlag, font, numFlag])

  const insertText = (char: string) => CustomKeyboard.insertText(char)

  // 按键按下：刷新候选词；若处于单次大写则输入后回到小写
  const handleKeyPress = useCallback((base: string, _inserted: string) => {
    setCandidates(getCandidates(base))
    setShiftState((prev) => (prev === 'once' ? 'off' : prev))
  }, [])

  // 点候选：删除刚输入（或上一次所选）的字形，插入所选样式（可连续重选）
  const handleCandidateTap = (glyph: string) => {
    HapticFeedback.selection()
    CustomKeyboard.deleteBackward()
    CustomKeyboard.insertText(glyph)
  }

  const onShiftTap = useCallback(() => {
    HapticFeedback.selection()
    setCandidates([])
    if (numFlag) {
      setCharsFlag(!charsFlag)
      return
    }
    // 300ms 内连按两次 = 双击 → 固定大写；否则单击在 小写/单次大写 间切换
    const now = Date.now()
    const isDouble = now - lastShiftTapRef.current < 300
    lastShiftTapRef.current = now
    setShiftState((prev) =>
      isDouble ? 'lock' : prev === 'off' ? 'once' : 'off'
    )
  }, [charsFlag, numFlag])

  const toggleNumFlag = useCallback(() => {
    HapticFeedback.selection()
    setCandidates([])
    if (numFlag) {
      setCharsFlag(false)
    }
    setNumFlag(!numFlag)
  }, [numFlag])

  const handleReturn = () => {
    HapticFeedback.selection()
    setCandidates([])
    insertText('\n')
  }
  // 删除键的按住连删处理器。必须在多次 render 间保持同一实例：
  // 否则按下时 setCandidates([]) 触发的重渲染会换掉处理器实例，
  // 使旧实例启动的 setTimeout 连删循环无人清除而一直删除。
  const deletePressHandler = useMemo(() => {
    let interval: number | null = null
    const del = () => {
      CustomKeyboard.deleteBackward()
      interval = setTimeout(del, 100)
    }
    return (state: boolean) => {
      if (state) {
        HapticFeedback.selection()
        setCandidates([])
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
  }, [])

  return (
    <VStack
      padding={{
        horizontal: padding,
        top: padding + 1,
        bottom: padding,
      }}
      spacing={gapY}
    >
      {/* 候选词栏：占据顶部一条区域，第一排气泡可向上覆盖在它之上 */}
      <CandidateBar candidates={candidates} onSelect={handleCandidateTap} />
      {/* 气泡向上鼓起、覆盖上一排，故各排 zIndex 递增，保证下排绘制在上排之上 */}
      <HStack spacing={gapX} zIndex={1}>
        {charsInRow1.map((item) => (
          <Key
            key={item.base}
            char={item.base}
            title={item.display}
            onPress={handleKeyPress}
            font={hasShiftFlag ? 22 : 26}
          />
        ))}
      </HStack>
      <HStack spacing={gapX} zIndex={2}>
        {charsInRow2.map((item) => (
          <Key
            key={item.base}
            char={item.base}
            title={item.display}
            onPress={handleKeyPress}
            font={hasShiftFlag ? 22 : 26}
          />
        ))}
      </HStack>
      <HStack spacing={6} zIndex={3}>
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
              systemName={
                shiftState === 'lock'
                  ? 'capslock.fill'
                  : shiftState === 'once'
                    ? 'shift.fill'
                    : 'shift'
              }
            />
          )}
        </Button>
        <Spacer minLength={0} />
        {charsInRow3.map((item) => (
          <Key
            key={item.base}
            char={item.base}
            title={item.display}
            onPress={handleKeyPress}
            font={hasShiftFlag ? 22 : 26}
          />
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
            onPressingChanged: deletePressHandler,
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
            onPressingChanged: (s) => {
              if (s) setCandidates([])
              insertSpace(s)
            },
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
