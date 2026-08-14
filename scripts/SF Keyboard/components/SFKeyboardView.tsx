import {
  Button,
  Group,
  HStack,
  Image,
  ProgressView,
  Spacer,
  Text,
  VStack,
  ZStack,
  useCallback,
  useState,
} from 'scripting'
import { RECENTS_KEY } from '../constants/categories'
import { t } from '../constants/i18n'
import { FG_PRIMARY, FG_SECONDARY, KEY_BACKGROUND } from '../constants/theme'
import { useSymbolLibrary } from '../hooks/useSymbolLibrary'
import { getKeyboardLayout } from '../utils/layout'
import { copySymbolAsPng } from '../utils/png'
import { CategorySidebar, describeCategory } from './CategorySidebar'
import { SymbolGrid } from './SymbolGrid'

const layout = getKeyboardLayout()

/** 键盘里一页渲染多少个格子。调大会明显拖慢切分类时的第一帧 */
const KEYBOARD_PAGE_SIZE = 60
/** 长按「复制 PNG」用的尺寸（pt），实际是 2 倍像素 */
const KEYBOARD_PNG_SIZE = 128

export function SFKeyboardView() {
  const {
    library,
    loading,
    recents,
    category,
    setCategory,
    query,
    setSearchFromInput,
    clearSearch,
    pendingDelete,
    visibleSymbols,
    categoryKeys,
    markUsed,
  } = useSymbolLibrary()

  const [toast, setToast] = useState<string | null>(null)

  const flash = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 1400)
  }, [])

  /** 取光标前的最后一个词作为搜索关键字 */
  const searchFromInput = useCallback(async () => {
    const before = (await CustomKeyboard.textBeforeCursor) || ''
    const token = before.split(/[\s\n,，。;；:：("'`]/).pop() || ''
    if (!token) {
      flash(t.noWordBeforeCursor)
      return
    }
    setSearchFromInput(token)
    HapticFeedback.selection()
  }, [flash, setSearchFromInput])

  const insertSymbol = useCallback(
    async (name: string) => {
      CustomKeyboard.playInputClick()
      for (let i = 0; i < pendingDelete; i++) {
        await CustomKeyboard.deleteBackward()
      }
      CustomKeyboard.insertText(name)
      markUsed(name)
      clearSearch()
    },
    [pendingDelete, markUsed, clearSearch]
  )

  const copyName = useCallback(
    async (name: string) => {
      await Pasteboard.setString(name)
      markUsed(name)
      flash(t.copied(name))
    },
    [markUsed, flash]
  )

  const copyPng = useCallback(
    async (name: string) => {
      flash(t.renderingPng)
      const ok = await copySymbolAsPng(name, { size: KEYBOARD_PNG_SIZE })
      markUsed(name)
      flash(ok ? t.pngCopiedHint : t.pngFailed)
    },
    [markUsed, flash]
  )

  // 长按菜单是给每一个格子都构造一份的，节点数按页大小成倍放大，
  // 所以这里保持扁平：不套二级 Menu，PNG 尺寸固定，
  // 需要选尺寸去 App 的图标详情页。
  const renderMenu = useCallback(
    (name: string) => (
      <Group>
        <Text>{name}</Text>
        <Button title={t.insertName} systemImage="text.cursor" action={() => insertSymbol(name)} />
        <Button title={t.copyName} systemImage="doc.on.doc" action={() => copyName(name)} />
        <Button title={t.copyPng} systemImage="photo" action={() => copyPng(name)} />
      </Group>
    ),
    [insertSymbol, copyName, copyPng]
  )

  const currentTitle = query.trim()
    ? t.searching(query)
    : describeCategory(category, library).label

  return (
    <VStack spacing={0} frame={{ height: layout.totalHeight }}>
      {/* 顶部信息条 */}
      <HStack spacing={8} padding={{ horizontal: 10 }} frame={{ height: layout.headerHeight }}>
        <Text
          font={12}
          bold
          lineLimit={1}
          foregroundStyle={FG_PRIMARY}
        >
          {toast ?? currentTitle}
        </Text>
        {!toast && visibleSymbols.length > 0 ? (
          <Text font={11} foregroundStyle={FG_SECONDARY}>
            {visibleSymbols.length}
          </Text>
        ) : null}
        <Spacer />
        {query.trim() ? (
          <Button action={clearSearch} buttonStyle="plain">
            <Image
              systemName="xmark.circle.fill"
              font={14}
              foregroundStyle={FG_SECONDARY}
            />
          </Button>
        ) : null}
        <Button action={searchFromInput} buttonStyle="plain">
          <HStack spacing={3}>
            <Image systemName="magnifyingglass" font={12} />
            <Text font={11}>{t.searchWord}</Text>
          </HStack>
        </Button>
      </HStack>

      {/* 主体：左分类 + 右网格 */}
      {loading ? (
        <ZStack frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
          <VStack spacing={6}>
            <ProgressView progressViewStyle="circular" />
            <Text font={11} foregroundStyle={FG_SECONDARY}>
              {t.preparingLibrary}
            </Text>
          </VStack>
        </ZStack>
      ) : (
        <HStack spacing={0} frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
          <CategorySidebar
            library={library}
            keys={categoryKeys}
            selected={query.trim() ? '' : category}
            width={layout.sidebarWidth}
            spacing={layout.spacing}
            onSelect={key => {
              // setCategory 一次性把分类和搜索状态都改掉，只触发一次重渲染
              setCategory(key)
              HapticFeedback.selection()
            }}
          />
          <VStack
            spacing={0}
            padding={{ horizontal: layout.spacing }}
            frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
          >
            <SymbolGrid
              symbols={visibleSymbols}
              cellSize={layout.cellSize}
              iconSize={layout.iconSize}
              spacing={layout.spacing}
              columns={layout.columns}
              pageSize={KEYBOARD_PAGE_SIZE}
              emptyTitle={
                query.trim()
                  ? t.noMatchingSymbols
                  : category === RECENTS_KEY && recents.length === 0
                    ? t.noRecents
                    : t.emptyCategory
              }
              emptyIcon={query.trim() ? 'magnifyingglass' : 'clock'}
              onTap={insertSymbol}
              renderMenu={renderMenu}
            />
          </VStack>
        </HStack>
      )}

      {/* 底部工具条 */}
      <HStack
        spacing={layout.spacing}
        padding={{ horizontal: 8, bottom: 4 }}
        frame={{ height: layout.toolbarHeight }}
      >
        <ToolbarButton
          icon="square.grid.2x2"
          action={() => CustomKeyboard.dismissToHome()}
        />
        <Button
          action={() => {
            CustomKeyboard.playInputClick()
            CustomKeyboard.insertText(' ')
          }}
          buttonStyle="plain"
          frame={{ maxWidth: 'infinity' }}
        >
          <ZStack frame={{ height: layout.toolbarHeight - 10, maxWidth: 'infinity' }}>
            <RoundedKey />
            <Text font={12} foregroundStyle={FG_PRIMARY}>
              {t.space}
            </Text>
          </ZStack>
        </Button>
        <ToolbarButton
          icon="delete.left"
          action={() => {
            CustomKeyboard.playInputClick()
            CustomKeyboard.deleteBackward()
          }}
        />
        <ToolbarButton
          icon="return"
          action={() => {
            CustomKeyboard.playInputClick()
            CustomKeyboard.insertText('\n')
          }}
        />
      </HStack>
    </VStack>
  )
}

function RoundedKey() {
  return (
    <ZStack
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      background={KEY_BACKGROUND}
      clipShape={{ type: 'rect', cornerRadius: 8, style: 'continuous' }}
    />
  )
}

function ToolbarButton({ icon, action }: { icon: string; action: () => void }) {
  return (
    <Button action={action} buttonStyle="plain">
      <ZStack frame={{ width: 44, height: layout.toolbarHeight - 10 }}>
        <RoundedKey />
        <Image
          systemName={icon}
          font={15}
          foregroundStyle={FG_PRIMARY}
        />
      </ZStack>
    </Button>
  )
}
