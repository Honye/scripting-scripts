import {
  Device,
  Label,
  Navigation,
  NavigationStack,
  Script,
  Tab,
  TabView,
  Widget,
  useEffect,
  useObservable,
  useState
} from 'scripting'
import {
  AppItem,
  BASE_PATH,
  CACHE_PATH,
  CONFIG_PATH,
  Config,
  DEFAULT_APPS,
  DEFAULT_CONFIG,
  FILE_PATH,
  FOLDERS_PATH,
  Folder,
  FolderStyle,
  getIconCachePath,
  migrateAppItem
} from './constants'
import { pruneButtonCode, runButtonById } from './buttonCode'
import { filterApps, matchesQuery } from './components/SharedViews'
import { AppsPage, FoldersPage, SettingsPage } from './components/TabPages'

function App() {
  const apps = useObservable<AppItem[]>([])
  const folders = useObservable<Folder[]>([])
  const [shape, setShape] = useState<Config['shape']>(DEFAULT_CONFIG.shape)
  const [iconSize, setIconSize] = useState(DEFAULT_CONFIG.iconSize)
  const [spacing, setSpacing] = useState(DEFAULT_CONFIG.spacing)
  const [accentedMode, setAccentedMode] = useState<
    Config['widgetAccentedRenderingMode']
  >(DEFAULT_CONFIG.widgetAccentedRenderingMode)
  const [isLoaded, setIsLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const visibleApps = useObservable<AppItem[]>([])
  const dismiss = Navigation.useDismiss()

  useEffect(() => {
    try {
      if (FileManager.existsSync(FILE_PATH)) {
        const source = FileManager.readAsStringSync(FILE_PATH)
        apps.setValue((JSON.parse(source) as AppItem[]).map(migrateAppItem))
      } else {
        apps.setValue(DEFAULT_APPS)
        ensureBaseDirectory()
        FileManager.writeAsStringSync(FILE_PATH, JSON.stringify(DEFAULT_APPS))
      }

      if (FileManager.existsSync(FOLDERS_PATH)) {
        folders.setValue(
          JSON.parse(FileManager.readAsStringSync(FOLDERS_PATH))
        )
      }

      if (FileManager.existsSync(CONFIG_PATH)) {
        const config = JSON.parse(
          FileManager.readAsStringSync(CONFIG_PATH)
        ) as Partial<Config>
        if (config.shape) setShape(config.shape)
        if (config.iconSize) setIconSize(config.iconSize)
        if (config.spacing !== undefined) setSpacing(config.spacing)
        if (config.widgetAccentedRenderingMode) {
          setAccentedMode(config.widgetAccentedRenderingMode)
        }
      }
    } catch (error) {
      console.error(error)
      apps.setValue(DEFAULT_APPS)
    } finally {
      setIsLoaded(true)
      apps.value.forEach(cacheAppIcon)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    try {
      ensureBaseDirectory()
      FileManager.writeAsStringSync(FILE_PATH, JSON.stringify(apps.value))
      pruneButtonCode(apps.value.map(app => app.id))
      Widget.reloadAll()
    } catch (error) {
      console.error(error)
    }
  }, [apps.value, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    try {
      ensureBaseDirectory()
      FileManager.writeAsStringSync(
        FOLDERS_PATH,
        JSON.stringify(folders.value)
      )
      Widget.reloadAll()
    } catch (error) {
      console.error(error)
    }
  }, [folders.value, isLoaded])

  useEffect(() => {
    const folderIDs = new Set(folders.value.map(folder => folder.id))
    let changed = false
    const next = apps.value.map(app => {
      const folderIds = (app.folderIds ?? []).filter(id => folderIDs.has(id))
      if (folderIds.length === (app.folderIds?.length ?? 0)) return app
      changed = true
      return { ...app, folderIds }
    })
    if (changed) apps.setValue(next)
  }, [folders.value])

  useEffect(() => {
    const next = filterApps(apps.value, query)
    if (sameItems(next, visibleApps.value)) return
    visibleApps.setValue(next)
  }, [apps.value, query])

  useEffect(() => {
    if (!isLoaded) return
    const rows = visibleApps.value
    if (sameItems(rows, filterApps(apps.value, query))) return
    if (!query.trim()) {
      apps.setValue(rows)
      return
    }
    const kept = new Set(rows.map(app => app.id))
    apps.setValue(
      apps.value.filter(app => kept.has(app.id) || !matchesQuery(app, query))
    )
  }, [visibleApps.value])

  function saveConfig(
    nextShape: Config['shape'],
    nextIconSize: number,
    nextSpacing: number,
    nextMode: Config['widgetAccentedRenderingMode']
  ) {
    const config: Config = {
      shape: nextShape,
      iconSize: nextIconSize,
      spacing: nextSpacing,
      widgetAccentedRenderingMode: nextMode
    }
    ensureBaseDirectory()
    FileManager.writeAsStringSync(CONFIG_PATH, JSON.stringify(config))
    Widget.reloadAll()
    setShape(nextShape)
    setIconSize(nextIconSize)
    setSpacing(nextSpacing)
    setAccentedMode(nextMode)
  }

  async function cacheIconUrl(url: string) {
    if (!url || !url.startsWith('http')) return false

    const cachePath = getIconCachePath(url)
    if (FileManager.existsSync(cachePath)) return false

    if (!FileManager.existsSync(CACHE_PATH)) {
      FileManager.createDirectorySync(CACHE_PATH, true)
    }

    try {
      const image = await UIImage.fromURL(url)
      const data = image?.toPNGData()
      if (data) {
        FileManager.writeAsDataSync(cachePath, data)
        return true
      }
    } catch (error) {
      console.error(`Failed to cache icon: ${url}`, error)
    }
    return false
  }

  async function cacheAppIcon(item: AppItem) {
    if (item.iconType !== 'image' && item.iconType !== 'transparent_image') {
      return
    }

    const downloaded = await Promise.all([
      cacheIconUrl(item.icon),
      cacheIconUrl(item.iconDark ?? '')
    ])
    if (downloaded.some(Boolean)) Widget.reloadAll()
  }

  function updateApp(item: AppItem) {
    const current = apps.value
    const index = current.findIndex(app => app.id === item.id)
    if (index >= 0) {
      const next = [...current]
      next[index] = item
      apps.setValue(next)
    } else {
      apps.setValue([...current, item])
    }
    cacheAppIcon(item)
  }

  function syncFolderApps(folderId: string, items: AppItem[]) {
    const current = apps.value
    const positions: number[] = []
    current.forEach((app, index) => {
      if (app.folderIds?.includes(folderId)) positions.push(index)
    })

    const remaining = new Map(
      positions.map(position => [current[position].id, current[position]])
    )
    const kept: AppItem[] = []
    items.forEach(item => {
      const app = remaining.get(item.id)
      if (app) {
        kept.push(app)
        remaining.delete(item.id)
      }
    })
    const dropped = Array.from(remaining.values()).map(app => ({
      ...app,
      folderIds: (app.folderIds ?? []).filter(id => id !== folderId)
    }))

    const ordered = [...kept, ...dropped]
    const next = [...current]
    positions.forEach((position, index) => {
      next[position] = ordered[index]
    })
    if (
      positions.every(
        (position, index) => next[position] === current[position]
      )
    ) {
      return
    }
    apps.setValue(next)
  }

  function addFolder(name: string, icon?: string, color?: string) {
    folders.setValue([
      ...folders.value,
      { id: Math.random().toString(36).slice(2), name, icon, color }
    ])
  }

  function deleteFolder(id: string) {
    folders.setValue(folders.value.filter(folder => folder.id !== id))
  }

  function renameFolder(
    id: string,
    name: string,
    icon?: string,
    color?: string
  ) {
    folders.setValue(
      folders.value.map(folder =>
        folder.id === id ? { ...folder, name, icon, color } : folder
      )
    )
  }

  function updateFolderStyle(id: string, style: FolderStyle | undefined) {
    folders.setValue(
      folders.value.map(folder =>
        folder.id === id ? { ...folder, style } : folder
      )
    )
  }

  const config: Config = {
    shape,
    iconSize,
    spacing,
    widgetAccentedRenderingMode: accentedMode
  }
  const tabs = [
    {
      title: 'Apps',
      systemImage: 'square.grid.2x2',
      content: (
        <AppsPage
          apps={apps.value}
          visibleApps={visibleApps}
          folders={folders.value}
          query={query}
          onQueryChanged={setQuery}
          onUpdateApp={updateApp}
          onDismiss={dismiss}
        />
      )
    },
    {
      title: 'Folders',
      systemImage: 'folder',
      content: (
        <FoldersPage
          apps={apps}
          folders={folders.value}
          globalConfig={config}
          onAddFolder={addFolder}
          onDeleteFolder={deleteFolder}
          onUpdateApp={updateApp}
          onSyncFolderApps={syncFolderApps}
          onRenameFolder={renameFolder}
          onUpdateFolderStyle={updateFolderStyle}
        />
      )
    },
    {
      title: 'Settings',
      systemImage: 'gear',
      content: (
        <SettingsPage
          shape={shape}
          iconSize={iconSize}
          spacing={spacing}
          accentedMode={accentedMode}
          onSaveConfig={saveConfig}
        />
      )
    }
  ]

  return parseFloat(Device.systemVersion) >= 18 ? (
    <TabView>
      {tabs.map(tab => (
        <Tab key={tab.title} title={tab.title} systemImage={tab.systemImage}>
          <NavigationStack>{tab.content}</NavigationStack>
        </Tab>
      ))}
    </TabView>
  ) : (
    <TabView>
      {tabs.map((tab, index) => (
        <NavigationStack
          key={tab.title}
          tag={index}
          tabItem={<Label title={tab.title} systemImage={tab.systemImage} />}
        >
          {tab.content}
        </NavigationStack>
      ))}
    </TabView>
  )
}

function ensureBaseDirectory() {
  if (!FileManager.existsSync(BASE_PATH)) {
    FileManager.createDirectory(BASE_PATH)
  }
}

function sameItems(first: AppItem[], second: AppItem[]) {
  return (
    first.length === second.length &&
    first.every((item, index) => item === second[index])
  )
}

const buttonId = Script.queryParameters['buttonId']

if (buttonId) {
  runButtonById(String(buttonId), { env: Script.env })
    .catch(error => console.error(error))
    .finally(() => Script.exit())
} else {
  Navigation.present({ element: <App /> }).finally(() => Script.exit())
}
