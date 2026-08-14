import {
  Button,
  Group,
  HStack,
  Image,
  Menu,
  Navigation,
  NavigationStack,
  ProgressView,
  ScrollView,
  Spacer,
  Text,
  VStack,
  ZStack,
  useCallback,
  useMemo,
  useState,
} from 'scripting'
import { RECENTS_KEY } from '../constants/categories'
import { BUILTIN_SOURCE, pick, t } from '../constants/i18n'
import { describeCategory } from '../components/CategorySidebar'
import { SymbolGrid } from '../components/SymbolGrid'
import { SymbolDetailView } from './SymbolDetailView'
import { useSymbolLibrary } from '../hooks/useSymbolLibrary'
import type { ImportMode } from '../utils/library'
import {
  applyImport,
  buildBuiltinLibrary,
  countSymbols,
  deleteLibraryFile,
  markValidated,
  saveLibrary,
  validateLibrary,
} from '../utils/library'
import { mergeResults, parseSourceFile } from '../utils/parser'
import { copySymbolAsPng, exportSymbolPngFile, PNG_PRESETS } from '../utils/png'
import { loadStyle } from '../utils/styleStore'

const CELL = 56
const ICON = 24
/** 主应用不分页，一次铺完整个分类 */
const APP_PAGE_SIZE = 0

/** 旧版本把来源直接存成了中文「内置」，这里一并兼容 */
function isBuiltinSource(source: string): boolean {
  return source === BUILTIN_SOURCE || source === '内置'
}

export function LibraryView() {
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
    clearRecentSymbols,
    reload,
    setLibrary,
  } = useSymbolLibrary()

  const [busy, setBusy] = useState<string | null>(null)
  // 详情页里改的渲染主题，网格跟着一起变
  const [style, setStyle] = useState(() => loadStyle())

  const total = useMemo(() => (library ? countSymbols(library) : 0), [library])

  // ------------------------------------------------------------ 导入

  const runImport = useCallback(
    async (mode: ImportMode) => {
      if (!library) return
      let paths: string[] = []
      try {
        paths = await DocumentPicker.pickFiles({
          allowsMultipleSelection: true,
          shouldShowFileExtensions: true,
        })
      } catch (e) {
        console.error('选择文件失败', e)
        return
      }
      if (!paths.length) return

      setBusy(t.parsingSource)
      try {
        const results = []
        for (const path of paths) {
          results.push(await parseSourceFile(path))
        }
        const merged = mergeResults(results)
        if (merged.total === 0) {
          await Dialog.alert({
            title: t.nothingParsedTitle,
            message: t.nothingParsedMessage,
          })
          return
        }

        const sourceName = paths
          .map(p => p.split('/').pop() || p)
          .join(pick('、', ', '))
        const next = applyImport(library, merged, mode, sourceName)

        setBusy(t.checkingAvailability)
        const { library: validated, removed } = validateLibrary(next)
        await saveLibrary(validated)
        markValidated()
        setLibrary(validated)

        await Dialog.alert({
          title: t.importDoneTitle,
          message: t.importDoneMessage(merged.total, countSymbols(validated), removed),
        })
      } catch (e) {
        console.error(e)
        await Dialog.alert({ title: t.importFailedTitle, message: String(e) })
      } finally {
        setBusy(null)
      }
    },
    [library, setLibrary]
  )

  const restoreBuiltin = useCallback(async () => {
    const ok = await Dialog.confirm({
      title: t.restoreConfirmTitle,
      message: t.restoreConfirmMessage,
      confirmLabel: t.restoreConfirmLabel,
    })
    if (!ok) return
    setBusy(t.restoring)
    try {
      await deleteLibraryFile()
      const fresh = buildBuiltinLibrary()
      const { library: validated } = validateLibrary(fresh)
      await saveLibrary(validated)
      markValidated()
      setLibrary(validated)
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(null)
    }
  }, [setLibrary])

  const revalidate = useCallback(async () => {
    if (!library) return
    setBusy(t.validating)
    try {
      const { library: validated, removed } = validateLibrary(library)
      await saveLibrary(validated)
      markValidated()
      setLibrary(validated)
      await Dialog.alert({
        title: t.validateDoneTitle,
        message: t.validateDoneMessage(countSymbols(validated), removed),
      })
    } finally {
      setBusy(null)
    }
  }, [library, setLibrary])

  const exportLibrary = useCallback(async () => {
    if (!library) return
    const data = Data.fromString(JSON.stringify(library, null, 2))
    if (!data) return
    await DocumentPicker.exportFiles({
      files: [{ data, name: 'sf-keyboard-library.json' }],
    })
  }, [library])

  // ------------------------------------------------------------ 单个图标

  const openDetail = useCallback(
    async (name: string) => {
      markUsed(name)
      await Navigation.present({
        // 必须包一层 NavigationStack：不然 navigationTitle / toolbar 都不会渲染，
        // 「完成」和复制按钮会整个消失
        element: (
          <NavigationStack>
            <SymbolDetailView name={name} library={library} />
          </NavigationStack>
        ),
        modalPresentationStyle: 'pageSheet',
      })
      // 详情页里可能改了主题，关掉之后把网格的渲染同步过来
      setStyle(loadStyle())
    },
    [markUsed, library]
  )

  const renderMenu = useCallback(
    (name: string) => (
      // 键盘那边这份菜单是扁平的（节点数按格子数成倍放大），
      // App 不受这个约束，尺寸子菜单保留
      <Group>
        <Text>{name}</Text>
        <Button
          title={t.copyName}
          systemImage="doc.on.doc"
          action={async () => {
            await Pasteboard.setString(name)
            markUsed(name)
          }}
        />
        <Menu title={t.copyPng} systemImage="photo">
          {PNG_PRESETS.map(preset => (
            <Button
              key={`copy-${preset.label}`}
              title={preset.label}
              action={async () => {
                await copySymbolAsPng(name, { size: preset.size })
                markUsed(name)
              }}
            />
          ))}
        </Menu>
        <Menu title={t.exportPngShort} systemImage="square.and.arrow.down">
          {PNG_PRESETS.map(preset => (
            <Button
              key={`export-${preset.label}`}
              title={preset.label}
              action={() => exportSymbolPngFile(name, { size: preset.size })}
            />
          ))}
        </Menu>
      </Group>
    ),
    [markUsed]
  )

  // ------------------------------------------------------------ UI

  return (
    <VStack
      spacing={0}
      navigationTitle={t.appTitle}
      navigationBarTitleDisplayMode="inline"
      searchable={{
        value: query,
        onChanged: setQuery,
        prompt: t.searchPrompt,
      }}
      toolbar={{
        topBarTrailing: [
          <Menu title={t.more} systemImage="ellipsis.circle">
            <Button
              title={t.importMerge}
              systemImage="square.and.arrow.down.on.square"
              action={() => runImport('merge')}
            />
            <Button
              title={t.importReplace}
              systemImage="arrow.triangle.2.circlepath"
              action={() => runImport('replace')}
            />
            <Button title={t.revalidate} systemImage="checkmark.seal" action={revalidate} />
            <Button title={t.exportLibrary} systemImage="square.and.arrow.up" action={exportLibrary} />
            <Button title={t.clearRecents} systemImage="clock.badge.xmark" action={clearRecentSymbols} />
            <Button
              title={t.restoreBuiltin}
              systemImage="arrow.counterclockwise"
              role="destructive"
              action={restoreBuiltin}
            />
          </Menu>,
        ],
      }}
    >
      {loading || busy ? (
        <ZStack frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
          <VStack spacing={8}>
            <ProgressView progressViewStyle="circular" />
            <Text font="footnote" foregroundStyle="secondaryLabel">
              {busy ?? t.loadingLibrary}
            </Text>
          </VStack>
        </ZStack>
      ) : (
        <VStack spacing={0} frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
          {/* 概览 */}
          <HStack spacing={10} padding={{ horizontal: 16, top: 6, bottom: 4 }}>
            <Text font="footnote" foregroundStyle="secondaryLabel">
              {t.overview(
                total,
                !library || isBuiltinSource(library.source) ? t.builtinSource : library.source
              )}
            </Text>
            <Spacer />
            <Text font="footnote" foregroundStyle="secondaryLabel">
              {library ? new Date(library.updatedAt).toLocaleDateString() : ''}
            </Text>
          </HStack>

          {/* 分类切换 */}
          {query.trim() ? null : (
            <ScrollView axes="horizontal" scrollIndicator="hidden">
              <HStack spacing={8} padding={{ horizontal: 16, vertical: 6 }}>
                {categoryKeys.map(key => {
                  const { label } = describeCategory(key, library)
                  const active = key === category
                  const count =
                    key === RECENTS_KEY
                      ? recents.length
                      : (library?.symbols[key]?.length ?? 0)
                  return (
                    <Button key={key} action={() => setCategory(key)} buttonStyle="plain">
                      <Text
                        font="caption"
                        padding={{ horizontal: 12, vertical: 6 }}
                        foregroundStyle={active ? 'white' : 'label'}
                        background={active ? 'systemBlue' : 'systemFill'}
                        clipShape="capsule"
                      >
                        {label} {count}
                      </Text>
                    </Button>
                  )
                })}
              </HStack>
            </ScrollView>
          )}

          {/* 图标网格：分页渲染，见 SymbolGrid 的说明 */}
          <SymbolGrid
            symbols={visibleSymbols}
            cellSize={CELL}
            iconSize={ICON}
            spacing={10}
            padding={16}
            pageSize={APP_PAGE_SIZE}
            emptyTitle={query.trim() ? t.noMatchingSymbols : t.emptyCategoryApp}
            emptyIcon="magnifyingglass"
            onTap={openDetail}
            renderMenu={renderMenu}
            style={style}
          />
        </VStack>
      )}
    </VStack>
  )
}
