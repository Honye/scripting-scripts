import {
  Button,
  Group,
  HStack,
  Image,
  LazyVGrid,
  Menu,
  Navigation,
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
import { SymbolCell } from '../components/SymbolCell'
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

const CELL = 56
const ICON = 24

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

  const renderMenu = useCallback(
    (name: string) => (
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
          {PNG_PRESETS.map(p => (
            <Button
              key={p.label}
              title={p.label}
              action={async () => {
                await copySymbolAsPng(name, { size: p.size })
                markUsed(name)
              }}
            />
          ))}
        </Menu>
        <Menu title={t.exportPng} systemImage="square.and.arrow.down">
          {PNG_PRESETS.map(p => (
            <Button
              key={p.label}
              title={p.label}
              action={() => exportSymbolPngFile(name, { size: p.size })}
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

          {/* 图标网格 */}
          {visibleSymbols.length === 0 ? (
            <VStack spacing={8} frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
              <Image systemName="magnifyingglass" font={28} foregroundStyle="secondaryLabel" />
              <Text font="footnote" foregroundStyle="secondaryLabel">
                {query.trim() ? t.noMatchingSymbols : t.emptyCategoryApp}
              </Text>
            </VStack>
          ) : (
            <ScrollView axes="vertical">
              <LazyVGrid
                spacing={10}
                columns={[{ size: { type: 'adaptive', min: CELL, max: CELL + 16 }, spacing: 10 }]}
                padding={{ horizontal: 16, vertical: 10 }}
              >
                {visibleSymbols.slice(0, 1500).map(name => (
                  <SymbolCell
                    key={name}
                    name={name}
                    size={CELL}
                    iconSize={ICON}
                    onTap={() => {
                      markUsed(name)
                      Navigation.present({
                        element: <SymbolDetailView name={name} />,
                        modalPresentationStyle: 'pageSheet',
                      })
                    }}
                    menuItems={renderMenu(name)}
                  />
                ))}
              </LazyVGrid>
              {visibleSymbols.length > 1500 ? (
                <Text font="caption" foregroundStyle="secondaryLabel" padding={16}>
                  {t.showingFirstApp(1500, visibleSymbols.length)}
                </Text>
              ) : null}
            </ScrollView>
          )}
        </VStack>
      )}
    </VStack>
  )
}

// ---------------------------------------------------------------- 详情

function SymbolDetailView({ name }: { name: string }) {
  const dismiss = Navigation.useDismiss()
  const [status, setStatus] = useState<string | null>(null)

  const flash = (message: string) => {
    setStatus(message)
    setTimeout(() => setStatus(null), 1500)
  }

  return (
    <VStack
      spacing={18}
      padding={24}
      navigationTitle={name}
      navigationBarTitleDisplayMode="inline"
      toolbar={{
        topBarTrailing: [<Button title={t.done} action={dismiss} />],
      }}
    >
      <Image systemName={name} font={72} foregroundStyle="label" />
      <Text font="headline" multilineTextAlignment="center">
        {name}
      </Text>
      <HStack spacing={12}>
        <Button
          title={t.copyName}
          systemImage="doc.on.doc"
          buttonStyle="bordered"
          action={async () => {
            await Pasteboard.setString(name)
            flash(t.nameCopied)
          }}
        />
        <Menu title={t.copyPng} systemImage="photo" buttonStyle="bordered">
          {PNG_PRESETS.map(p => (
            <Button
              key={p.label}
              title={p.label}
              action={async () => {
                const ok = await copySymbolAsPng(name, { size: p.size })
                flash(ok ? t.pngCopied : t.renderFailed)
              }}
            />
          ))}
        </Menu>
      </HStack>
      <Menu title={t.exportPng} systemImage="square.and.arrow.down" buttonStyle="bordered">
        {PNG_PRESETS.map(p => (
          <Button
            key={p.label}
            title={p.label}
            action={() => exportSymbolPngFile(name, { size: p.size })}
          />
        ))}
      </Menu>
      <Text font="footnote" foregroundStyle="secondaryLabel">
        {status ?? ' '}
      </Text>
      <Spacer />
    </VStack>
  )
}
