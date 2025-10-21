import {
  VStack,
  HStack,
  Image,
  Text,
  Grid,
  GridRow,
  useCallback,
  useEffect,
  useState,
  RoundedRectangle,
  ScrollView,
  ZStack,
  ViewModifiers,
  Group,
  Spacer,
} from 'scripting'
import {
  ai_configs,
  edit_tool,
  role_data,
  sprayButtonModeKey,
  translateTargets,
} from '../config/constants'
import { useAIKeyboard } from '../hooks/useAIKeyboard'
import { adaptiveParams } from '../utils/adaptive'
import { Footer } from './Footer'
import { performSearch } from '../services/search'
import Button from './Button'

const editToolKeys = Object.keys(edit_tool)
const roleKeys = Object.keys(role_data)
const firstRoleName = roleKeys[0]

export function AIKeyboardView() {
  const {
    state,
    actions,
    edit,
    gpt,
    fetchTextAndSend,
    showLanguageMenu,
    showAIModelMenu,
  } = useAIKeyboard()

  const [trollTimer, setTrollTimer] = useState<number | null>(null)
  const [sprayButtonTapCount, setSprayButtonTapCount] = useState(0)
  const [lastSprayButtonTapTime, setLastSprayButtonTapTime] = useState(0)
  const [sprayActionTimeoutId, setSprayActionTimeoutId] = useState<
    number | null
  >(null)

  const [sprayButtonMode, setSprayButtonMode] = useState(
    Storage.get<string>(sprayButtonModeKey) || '吐槽'
  )

  const tripleTapInterval = 500
  const sprayActionDelay = 300

  const handleTrollTap = useCallback(() => {
    const currentTime = Date.now()

    if (sprayActionTimeoutId) {
      clearTimeout(sprayActionTimeoutId)
      setSprayActionTimeoutId(null)
    }

    let newTapCount = sprayButtonTapCount
    if (currentTime - lastSprayButtonTapTime < tripleTapInterval) {
      newTapCount++
    } else {
      newTapCount = 1
    }
    setSprayButtonTapCount(newTapCount)
    setLastSprayButtonTapTime(currentTime)

    if (newTapCount >= 3) {
      const newMode = sprayButtonMode === '开喷' ? '吐槽' : '开喷'
      setSprayButtonMode(newMode)
      Dialog.alert({ message: `已切换至"${newMode}"模式` })
      Storage.set(sprayButtonModeKey, newMode)

      setSprayButtonTapCount(0)
      setLastSprayButtonTapTime(0)
      HapticFeedback.selection()
      return
    }

    if (newTapCount === 1) {
      const modeWhenClicked = sprayButtonMode
      const timeoutId = setTimeout(() => {
        if (sprayButtonMode === modeWhenClicked && sprayButtonTapCount === 1) {
          if (modeWhenClicked === '开喷') {
            HapticFeedback.selection()
            fetchTextAndSend()
          } else {
            gpt('吐槽', 'tap')
          }
          setSprayButtonTapCount(0)
          setLastSprayButtonTapTime(0)
        }
        setSprayActionTimeoutId(null)
      }, sprayActionDelay)
      setSprayActionTimeoutId(timeoutId)
    }
  }, [
    sprayButtonTapCount,
    lastSprayButtonTapTime,
    sprayButtonMode,
    sprayActionTimeoutId,
    gpt,
    fetchTextAndSend,
  ])

  const handleLongPress = useCallback(
    (key: string) => {
      if (trollTimer) {
        clearTimeout(trollTimer)
        setTrollTimer(null)
      }
      if (sprayActionTimeoutId) {
        clearTimeout(sprayActionTimeoutId)
        setSprayActionTimeoutId(null)
      }
      setSprayButtonTapCount(0)
      setLastSprayButtonTapTime(0)

      if (key === firstRoleName) {
        showAIModelMenu()
        return
      }

      if (key === '翻译文本') {
        showLanguageMenu()
        return
      }

      if (key === '吐槽' && sprayButtonMode === '开喷') {
        HapticFeedback.selection()
        if (trollTimer) {
          clearTimeout(trollTimer)
          setTrollTimer(null)
        }
        const tick = () => {
          fetchTextAndSend()
          const newTimerId = setTimeout(tick, 1000)
          setTrollTimer(newTimerId)
        }
        const timerId = setTimeout(tick, 0) // Start immediately
        setTrollTimer(timerId)
        Dialog.alert({ message: '长按连续开喷中，再次点击停止' })
      } else if (editToolKeys.includes(key)) {
        edit(key, 'long_press')
      } else {
        gpt(key, 'long_press')
      }
    },
    [
      trollTimer,
      sprayActionTimeoutId,
      sprayButtonMode,
      edit,
      gpt,
      fetchTextAndSend,
      showAIModelMenu,
      showLanguageMenu,
    ]
  )

  const handleTap = useCallback(
    async (key: string) => {
      if (trollTimer) {
        clearTimeout(trollTimer)
        setTrollTimer(null)
        return
      }

      if (key === '吐槽') {
        handleTrollTap()
      } else if (key === '百度搜索') {
        await performSearch('baidu', actions.setGenerating)
      } else if (key === '谷歌搜索') {
        await performSearch('google', actions.setGenerating)
      } else if (editToolKeys.includes(key)) {
        edit(key, 'tap')
      } else {
        gpt(key, 'tap')
      }
    },
    [trollTimer, handleTrollTap, edit, gpt, actions.setGenerating]
  )

  useEffect(() => {
    return () => {
      if (trollTimer) clearTimeout(trollTimer)
      if (sprayActionTimeoutId) clearTimeout(sprayActionTimeoutId)
    }
  }, [trollTimer, sprayActionTimeoutId])

  const assistantButton = (
    <Button
      key='助手'
      frame={{ height: adaptiveParams.keyHeight }}
      foregroundStyle={{ light: 'black', dark: 'white' }}
      onTap={() => handleTap('助手')}
      contextMenu={{
        menuItems: (
          <Group>
            {Object.keys(ai_configs).map((name) => (
              <Button onTap={() => actions.changeAiService(name as any)}>
                <Text>
                  {name}
                  {state.currentAIServiceName === name ? ' ✓' : ''}
                </Text>
              </Button>
            ))}
          </Group>
        ),
      }}
    >
      <HStack
        frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
        background={
          <RoundedRectangle
            fill={{ light: 'white', dark: 'rgba(255,255,255,0.3)' }}
            cornerRadius={8}
          />
        }
      >
        <Text>助手</Text>
      </HStack>
    </Button>
  )

  const translateButton = (
    <Button
      key='翻译文本'
      frame={{ height: adaptiveParams.keyHeight }}
      foregroundStyle={{ light: 'black', dark: 'white' }}
      onTap={() => handleTap('翻译文本')}
      contextMenu={{
        menuItems: (
          <Group>
            {Object.keys(translateTargets).map((key) => (
              <Button onTap={() => actions.changeTranslateTarget(key)}>
                <Text>
                  {translateTargets[key].name}
                  {state.currentTranslateTarget === key ? ' ✓' : ''}
                </Text>
              </Button>
            ))}
          </Group>
        ),
      }}
    >
      <HStack
        frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
        background={
          <RoundedRectangle
            fill={{ light: 'white', dark: 'rgba(255,255,255,0.3)' }}
            cornerRadius={8}
          />
        }
      >
        <Text>翻译文本</Text>
      </HStack>
    </Button>
  )

  const renderKey = (key: string, isEditTool: boolean) => {
    const isTucao = key === '吐槽'
    const isKaiPen = isTucao && sprayButtonMode === '开喷'

    if (key === '助手') return assistantButton
    if (key == '翻译文本') return translateButton

    return (
      <Button
        key={key}
        systemImage={isEditTool ? edit_tool[key] : undefined}
        frame={{ height: adaptiveParams.keyHeight }}
        foregroundStyle={{ light: 'black', dark: 'white' }}
        onTap={() => handleTap(key)}
        onLongPress={() => handleLongPress(key)}
      >
        <HStack
          frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
          background={
            <RoundedRectangle
              fill={
                isKaiPen
                  ? 'rgba(255, 240, 240, 1)' // light red
                  : { light: 'white', dark: 'rgba(255,255,255,0.3)' } // white
              }
              cornerRadius={8}
            />
          }
        >
          {isEditTool ? (
            <Image systemName={edit_tool[key]} />
          ) : (
            <Text>{isTucao ? sprayButtonMode : key}</Text>
          )}
        </HStack>
      </Button>
    )
  }

  const editTools = (() => {
    const res: JSX.Element[] = []
    const cols = 5
    for (let i = 0; i < editToolKeys.length; i += cols) {
      res.push(
        <GridRow key={`edit-row-${i}`} frame={{ maxWidth: 'infinity' }}>
          {editToolKeys.slice(i, i + cols).map((key) => renderKey(key, true))}
        </GridRow>
      )
    }
    return res
  })()

  const roleRows = []
  const rolesPerRow = 3
  for (let i = 0; i < roleKeys.length; i += rolesPerRow) {
    const rowSlice = roleKeys.slice(i, i + rolesPerRow)
    roleRows.push(
      <GridRow key={`role-row-${i}`} frame={{ maxWidth: 'infinity' }}>
        {rowSlice.map((key) => renderKey(key, false))}
      </GridRow>
    )
  }

  return (
    <ZStack alignment='topLeading'>
      <VStack
        frame={{
          maxWidth: 'infinity',
          maxHeight: 'infinity',
        }}
        padding={adaptiveParams.spacing}
        spacing={adaptiveParams.spacing}
      >
        <Grid
          horizontalSpacing={adaptiveParams.spacing}
          verticalSpacing={adaptiveParams.spacing}
        >
          {editTools}
        </Grid>
        <Grid
          horizontalSpacing={adaptiveParams.spacing}
          verticalSpacing={adaptiveParams.spacing}
        >
          {roleRows}
        </Grid>
        <Footer
          isMultiTurn={state.isMultiTurn}
          currentAIServiceName={state.currentAIServiceName}
          isGenerating={state.isGenerating}
          onTap={actions.showContext}
          onLongPress={actions.toggleMultiTurn}
          popover={{
            arrowEdge: 'bottom',
            isPresented: state.contextVisible,
            content: (
              <ScrollView
                padding={8}
                frame={{
                  width: Device.screen.width - 60,
                  height: 200,
                  alignment: 'top',
                }}
              >
                <Text
                  frame={{ maxWidth: 'infinity', alignment: 'leading' }}
                  font={14}
                  multilineTextAlignment='leading'
                >
                  {state.contextContent}
                </Text>
              </ScrollView>
            ),
            onChanged(visible) {
              visible ? actions.showContext() : actions.dismissContext()
            },
            presentationCompactAdaptation: 'popover',
          }}
        />
      </VStack>
      {state.banner ? (
        <VStack
          frame={{ maxWidth: 'infinity' }}
          alignment='leading'
          modifiers={new ViewModifiers().padding(8)}
          background={<RoundedRectangle fill='systemYellow' cornerRadius={8} />}
          padding
          foregroundStyle='black'
          contentTransition='opacity'
        >
          <Text frame={{ maxWidth: 'infinity' }} fontWeight='medium'>
            {state.banner}
          </Text>
        </VStack>
      ) : null}
    </ZStack>
  )
}
