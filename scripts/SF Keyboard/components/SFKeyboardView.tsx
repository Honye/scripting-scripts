import {
  Button,
  Group,
  HStack,
  Image,
  Menu,
  ProgressView,
  Spacer,
  Text,
  VStack,
  ZStack,
  useCallback,
  useState,
} from 'scripting'
import { RECENTS_KEY } from '../constants/categories'
import {
  FG_PRIMARY,
  FG_SECONDARY,
  KB_BACKGROUND,
  KEY_BACKGROUND,
} from '../constants/theme'
import { useSymbolLibrary } from '../hooks/useSymbolLibrary'
import { getKeyboardLayout } from '../utils/layout'
import { copySymbolAsPng, PNG_PRESETS } from '../utils/png'
import { CategorySidebar, describeCategory } from './CategorySidebar'
import { SymbolGrid } from './SymbolGrid'

const layout = getKeyboardLayout()

export function SFKeyboardView() {
  const {
    library,
    loading,
    recents,
    category,
    setCategory,
    query,
    setQuery,
    visibleSymbols,
    categoryKeys,
    markUsed,
  } = useSymbolLibrary()

  const [toast, setToast] = useState<string | null>(null)
  /** 搜索词是从输入框取的，插入时需要先把它删掉 */
  const [pendingDelete, setPendingDelete] = useState(0)

  const flash = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 1400)
  }, [])

  const resetSearch = useCallback(() => {
    setQuery('')
    setPendingDelete(0)
  }, [])

  /** 取光标前的最后一个词作为搜索关键字 */
  const searchFromInput = useCallback(async () => {
    const before = (await CustomKeyboard.textBeforeCursor) || ''
    const token = before.split(/[\s\n,，。;；:：("'`]/).pop() || ''
    if (!token) {
      flash('光标前没有可用的关键词')
      return
    }
    setQuery(token)
    setPendingDelete(token.length)
    HapticFeedback.selection()
  }, [flash])

  const insertSymbol = useCallback(
    async (name: string) => {
      CustomKeyboard.playInputClick()
      for (let i = 0; i < pendingDelete; i++) {
        await CustomKeyboard.deleteBackward()
      }
      CustomKeyboard.insertText(name)
      markUsed(name)
      resetSearch()
    },
    [pendingDelete, markUsed, resetSearch]
  )

  const copyName = useCallback(
    async (name: string) => {
      await Pasteboard.setString(name)
      markUsed(name)
      flash(`已复制「${name}」`)
    },
    [markUsed, flash]
  )

  const copyPng = useCallback(
    async (name: string, size: number) => {
      flash('正在生成 PNG…')
      const ok = await copySymbolAsPng(name, { size })
      markUsed(name)
      flash(ok ? 'PNG 已复制，长按输入框粘贴' : 'PNG 生成失败')
    },
    [markUsed, flash]
  )

  const renderMenu = useCallback(
    (name: string) => (
      <Group>
        <Text>{name}</Text>
        <Button title="输入名称" systemImage="text.cursor" action={() => insertSymbol(name)} />
        <Button title="复制名称" systemImage="doc.on.doc" action={() => copyName(name)} />
        <Menu title="复制 PNG" systemImage="photo">
          {PNG_PRESETS.map(preset => (
            <Button
              key={preset.label}
              title={preset.label}
              action={() => copyPng(name, preset.size)}
            />
          ))}
        </Menu>
      </Group>
    ),
    [insertSymbol, copyName, copyPng]
  )

  const currentTitle = query.trim()
    ? `搜索「${query}」`
    : describeCategory(category, library).label

  return (
    <VStack
      spacing={0}
      frame={{ height: layout.totalHeight }}
      // background={KB_BACKGROUND}
    >
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
          <Button action={resetSearch} buttonStyle="plain">
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
            <Text font={11}>取词搜索</Text>
          </HStack>
        </Button>
      </HStack>

      {/* 主体：左分类 + 右网格 */}
      {loading ? (
        <ZStack frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
          <VStack spacing={6}>
            <ProgressView progressViewStyle="circular" />
            <Text font={11} foregroundStyle={FG_SECONDARY}>
              正在准备图标库…
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
              resetSearch()
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
              emptyTitle={
                query.trim()
                  ? '没有匹配的图标'
                  : category === RECENTS_KEY && recents.length === 0
                    ? '还没有用过的图标'
                    : '这个分类是空的'
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
              空格
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
