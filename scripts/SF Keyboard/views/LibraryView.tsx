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

      setBusy('正在解析源文件…')
      try {
        const results = []
        for (const path of paths) {
          results.push(await parseSourceFile(path))
        }
        const merged = mergeResults(results)
        if (merged.total === 0) {
          await Dialog.alert({
            title: '没有解析到图标',
            message:
              '请确认文件内容是符号名清单。支持：\n' +
              '· SF Symbols.app 的 symbol_categories.plist / name_availability.plist\n' +
              '· JSON（数组或 分类 -> 名称数组）\n' +
              '· CSV（name,category）\n' +
              '· 纯文本（每行一个名称）',
          })
          return
        }

        const sourceName = paths
          .map(p => p.split('/').pop() || p)
          .join('、')
        const next = applyImport(library, merged, mode, sourceName)

        setBusy('正在校验图标是否可用…')
        const { library: validated, removed } = validateLibrary(next)
        await saveLibrary(validated)
        markValidated()
        setLibrary(validated)

        await Dialog.alert({
          title: '导入完成',
          message:
            `解析到 ${merged.total} 条记录，` +
            `当前系统可用 ${countSymbols(validated)} 个图标` +
            (removed > 0 ? `，已过滤 ${removed} 个不可用的名称。` : '。'),
        })
      } catch (e) {
        console.error(e)
        await Dialog.alert({ title: '导入失败', message: String(e) })
      } finally {
        setBusy(null)
      }
    },
    [library, setLibrary]
  )

  const restoreBuiltin = useCallback(async () => {
    const ok = await Dialog.confirm({
      title: '恢复内置图标列表',
      message: '导入的数据会被清除，恢复为脚本自带的分类和图标。',
      confirmLabel: '恢复',
    })
    if (!ok) return
    setBusy('正在恢复…')
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
    setBusy('正在校验…')
    try {
      const { library: validated, removed } = validateLibrary(library)
      await saveLibrary(validated)
      markValidated()
      setLibrary(validated)
      await Dialog.alert({
        title: '校验完成',
        message: `可用图标 ${countSymbols(validated)} 个${removed > 0 ? `，移除 ${removed} 个` : ''}。`,
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
          title="复制名称"
          systemImage="doc.on.doc"
          action={async () => {
            await Pasteboard.setString(name)
            markUsed(name)
          }}
        />
        <Menu title="复制 PNG" systemImage="photo">
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
        <Menu title="导出 PNG 文件" systemImage="square.and.arrow.down">
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
      navigationTitle="SF Keyboard"
      navigationBarTitleDisplayMode="inline"
      searchable={{
        value: query,
        onChanged: setQuery,
        prompt: '搜索图标名，如 wifi、arrow.up',
      }}
      toolbar={{
        topBarTrailing: [
          <Menu title="更多" systemImage="ellipsis.circle">
            <Button
              title="导入并合并"
              systemImage="square.and.arrow.down.on.square"
              action={() => runImport('merge')}
            />
            <Button
              title="导入并覆盖"
              systemImage="arrow.triangle.2.circlepath"
              action={() => runImport('replace')}
            />
            <Button title="重新校验可用性" systemImage="checkmark.seal" action={revalidate} />
            <Button title="导出当前列表" systemImage="square.and.arrow.up" action={exportLibrary} />
            <Button title="清空最近使用" systemImage="clock.badge.xmark" action={clearRecentSymbols} />
            <Button
              title="恢复内置列表"
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
              {busy ?? '正在加载图标库…'}
            </Text>
          </VStack>
        </ZStack>
      ) : (
        <VStack spacing={0} frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
          {/* 概览 */}
          <HStack spacing={10} padding={{ horizontal: 16, top: 6, bottom: 4 }}>
            <Text font="footnote" foregroundStyle="secondaryLabel">
              {total} 个图标 · 来源：{library?.source ?? '内置'}
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
                {query.trim() ? '没有匹配的图标' : '这个分类还没有图标'}
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
                  仅显示前 1500 个，共 {visibleSymbols.length} 个
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
        topBarTrailing: [<Button title="完成" action={dismiss} />],
      }}
    >
      <Image systemName={name} font={72} foregroundStyle="label" />
      <Text font="headline" multilineTextAlignment="center">
        {name}
      </Text>
      <HStack spacing={12}>
        <Button
          title="复制名称"
          systemImage="doc.on.doc"
          buttonStyle="bordered"
          action={async () => {
            await Pasteboard.setString(name)
            flash('名称已复制')
          }}
        />
        <Menu title="复制 PNG" systemImage="photo" buttonStyle="bordered">
          {PNG_PRESETS.map(p => (
            <Button
              key={p.label}
              title={p.label}
              action={async () => {
                const ok = await copySymbolAsPng(name, { size: p.size })
                flash(ok ? 'PNG 已复制' : '生成失败')
              }}
            />
          ))}
        </Menu>
      </HStack>
      <Menu title="导出 PNG 文件" systemImage="square.and.arrow.down" buttonStyle="bordered">
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
