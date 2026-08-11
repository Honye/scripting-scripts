import {
  Button,
  Color,
  ColorPicker,
  ContentUnavailableView,
  Device,
  EditButton,
  ForEach,
  Form,
  HStack,
  Image,
  Label,
  List,
  Navigation,
  NavigationLink,
  NavigationStack,
  Picker,
  Script,
  Section,
  Spacer,
  Stepper,
  Tab,
  TabView,
  Text,
  TextField,
  Toggle,
  VStack,
  Widget,
  ZStack,
  useEffect,
  useMemo,
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
import { ITunesApp, SearchSheet } from './SearchSheet'
import {
  pruneButtonCode,
  readButtonCode,
  runButtonById,
  runButtonCode,
  saveButtonCode
} from './buttonCode'

function FolderNameEditor({
  folder,
  onSave
}: {
  folder?: Folder
  onSave: (name: string, icon?: string, color?: string) => void
}) {
  const [name, setName] = useState(folder?.name ?? '')
  const [icon, setIcon] = useState(folder?.icon ?? '')
  const [color, setColor] = useState<Color>(
    (folder?.color ?? '#007AFF') as Color
  )
  const dismiss = Navigation.useDismiss()

  return (
    <Form
      navigationTitle={folder ? 'Rename Folder' : 'New Folder'}
      toolbar={{
        confirmationAction: [
          <Button
            key="save"
            title="Save"
            systemImage="checkmark"
            disabled={!name.trim()}
            action={() => {
              if (name.trim()) {
                onSave(
                  name.trim(),
                  icon.trim() || undefined,
                  color as unknown as string
                )
                dismiss()
              }
            }}
          />
        ]
      }}
    >
      <Section>
        <TextField title="Folder Name" value={name} onChanged={setName} />
      </Section>
      <Section
        header={<Text>Appearance</Text>}
        footer={<Text>Leave the icon empty to use a plain folder.</Text>}
      >
        <HStack>
          <Text>Icon (SF Symbol)</Text>
          <TextField
            title="Icon"
            prompt="Optional"
            value={icon}
            onChanged={setIcon}
          />
          <FolderIconView
            icon={icon}
            color={color as unknown as string}
          />
        </HStack>
        <ColorPicker value={color} onChanged={setColor}>
          <Text>Folder Color</Text>
        </ColorPicker>
      </Section>
    </Form>
  )
}

function FolderIconView({ icon, color }: { icon?: string; color?: string }) {
  const punchSymbol = icon && UIImage.fromSFSymbol(icon) ? icon : ''
  return (
    <ZStack compositingGroup>
      <Image
        systemName="folder.fill"
        font={30}
        foregroundStyle={(color ?? 'systemBlue') as Color}
      />
      {punchSymbol ? (
        <Image
          systemName={punchSymbol}
          font={13}
          offset={{ x: 0, y: 4 }}
          blendMode="destinationOut"
        />
      ) : null}
    </ZStack>
  )
}

function AddExistingAppView({
  apps,
  onAdd
}: {
  apps: AppItem[]
  onAdd: (items: AppItem[]) => void
}) {
  const dismiss = Navigation.useDismiss()
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState('')

  function toggle(id: string) {
    setSelected(prev => {
      const next = { ...prev }
      if (next[id]) {
        delete next[id]
      } else {
        next[id] = true
      }
      return next
    })
  }

  // Counted over the whole list, not the filtered view, so picks made under one
  // query survive changing or clearing it.
  const selectedItems = apps.filter(a => selected[a.id])
  const visible = filterApps(apps, query)

  return (
    <List
      navigationTitle="Add Apps"
      searchable={{
        value: query,
        onChanged: setQuery,
        prompt: 'Search Apps'
      }}
      overlay={
        visible.length === 0 ? (
          <ContentUnavailableView
            title="No Results"
            systemImage="magnifyingglass"
          />
        ) : undefined
      }
      toolbar={{
        topBarTrailing: [
          <Button
            key="add"
            title={
              selectedItems.length > 0
                ? `Add (${selectedItems.length})`
                : 'Add'
            }
            action={() => {
              if (selectedItems.length === 0) return
              onAdd(selectedItems)
              dismiss()
            }}
          />
        ]
      }}
    >
      <Section
        footer={<Text>Select one or more apps to add to this folder.</Text>}
      >
        {visible.map(item => {
          const isSelected = !!selected[item.id]
          return (
            <Button
              key={item.id}
              action={() => toggle(item.id)}
              buttonStyle="plain"
            >
              <HStack>
                <AppIconView
                  icon={item.icon}
                  iconType={item.iconType}
                  color={item.color}
                />
                <Text font={16}>{item.name}</Text>
                <Spacer />
                <Image
                  systemName={
                    isSelected ? 'checkmark.circle.fill' : 'circle'
                  }
                  foregroundStyle={
                    (isSelected ? 'systemBlue' : 'systemGray') as Color
                  }
                />
              </HStack>
            </Button>
          )
        })}
      </Section>
    </List>
  )
}

function FolderSettingsView({
  folder,
  onUpdateFolderStyle
}: {
  folder: Folder
  onUpdateFolderStyle: (id: string, style: FolderStyle | undefined) => void
}) {
  const [customize, setCustomize] = useState(
    !!folder.style && Object.keys(folder.style).length > 0
  )
  const [fStyle, setFStyle] = useState<FolderStyle>(folder.style ?? {})

  function updateStyle(patch: Partial<FolderStyle>) {
    const next = { ...fStyle, ...patch }
    setFStyle(next)
    onUpdateFolderStyle(folder.id, Object.keys(next).length > 0 ? next : undefined)
  }

  function setCustomized(v: boolean) {
    setCustomize(v)
    if (v) {
      setFStyle(folder.style ?? {})
    } else {
      onUpdateFolderStyle(folder.id, undefined)
    }
  }

  return (
    <Form navigationTitle="Folder Settings">
      <Section>
        <Toggle
          title="Customize This Folder"
          value={customize}
          onChanged={setCustomized}
        />
      </Section>
      {customize && (
        <Section header={<Text>Appearance</Text>}>
          <Stepper
            onIncrement={() => {
              const v = (fStyle.iconSize ?? DEFAULT_CONFIG.iconSize) + 1
              if (v <= 100) updateStyle({ iconSize: v })
            }}
            onDecrement={() => {
              const v = (fStyle.iconSize ?? DEFAULT_CONFIG.iconSize) - 1
              if (v >= 20) updateStyle({ iconSize: v })
            }}
          >
            <HStack>
              <Text>Icon Size</Text>
              <Spacer />
              <Text opacity={0.5}>
                {(fStyle.iconSize ?? DEFAULT_CONFIG.iconSize).toString()}
              </Text>
            </HStack>
          </Stepper>
          <Picker
            title="Icon Shape"
            value={fStyle.shape ?? DEFAULT_CONFIG.shape}
            onChanged={(v: string) =>
              updateStyle({ shape: v as 'rounded' | 'circle' })
            }
          >
            <Text tag="rounded">Rounded Rectangle</Text>
            <Text tag="circle">Circle</Text>
          </Picker>
          {(fStyle.shape ?? DEFAULT_CONFIG.shape) === 'rounded' && (
            <Stepper
              onIncrement={() => {
                const base =
                  fStyle.cornerRadius ?? DEFAULT_CONFIG.iconSize * 0.225
                const v = base + 1
                if (v <= 50) updateStyle({ cornerRadius: v })
              }}
              onDecrement={() => {
                const base =
                  fStyle.cornerRadius ?? DEFAULT_CONFIG.iconSize * 0.225
                const v = base - 1
                if (v >= 0) updateStyle({ cornerRadius: v })
              }}
            >
              <HStack>
                <Text>Corner Radius</Text>
                <Spacer />
                <Text opacity={0.5}>
                  {Math.round(
                    fStyle.cornerRadius ?? DEFAULT_CONFIG.iconSize * 0.225
                  ).toString()}
                </Text>
              </HStack>
            </Stepper>
          )}
          <Stepper
            onIncrement={() => {
              const v = (fStyle.spacing ?? DEFAULT_CONFIG.spacing) + 1
              if (v <= 50) updateStyle({ spacing: v })
            }}
            onDecrement={() => {
              const v = (fStyle.spacing ?? DEFAULT_CONFIG.spacing) - 1
              if (v >= 0) updateStyle({ spacing: v })
            }}
          >
            <HStack>
              <Text>Spacing</Text>
              <Spacer />
              <Text opacity={0.5}>
                {(fStyle.spacing ?? DEFAULT_CONFIG.spacing).toString()}
              </Text>
            </HStack>
          </Stepper>
          <Picker
            title="Icon Rendering Mode"
            value={
              fStyle.widgetAccentedRenderingMode ??
              DEFAULT_CONFIG.widgetAccentedRenderingMode
            }
            onChanged={(v: string) =>
              updateStyle({
                widgetAccentedRenderingMode:
                  v as Config['widgetAccentedRenderingMode']
              })
            }
          >
            <Text tag="fullColor">Full Color</Text>
            <Text tag="accented">Accented</Text>
            <Text tag="desaturated">Desaturated</Text>
            <Text tag="accentedDesaturated">Accented & Desaturated</Text>
          </Picker>
        </Section>
      )}
      {customize && (
        <Section>
          <Button
            title="Reset to Global Settings"
            role="destructive"
            action={() => {
              setCustomize(false)
              setFStyle({})
              onUpdateFolderStyle(folder.id, undefined)
            }}
          />
        </Section>
      )}
    </Form>
  )
}

function FolderDetail({
  folder,
  apps,
  folders,
  onUpdateApp,
  onSyncFolderApps,
  onRenameFolder,
  onUpdateFolderStyle
}: {
  folder: Folder
  apps: Observable<AppItem[]>
  folders: Folder[]
  onUpdateApp: (item: AppItem) => void
  onSyncFolderApps: (folderId: string, items: AppItem[]) => void
  onRenameFolder: (id: string, name: string, icon?: string, color?: string) => void
  onUpdateFolderStyle: (id: string, style: FolderStyle | undefined) => void
}) {
  // This view is pushed with the props it was built with, so a snapshot of the
  // global list would go stale the moment an app is added from here. Subscribe
  // to the shared observable instead so every change flows back in.
  const [allApps, setAllApps] = useState<AppItem[]>(() => apps.value)

  useEffect(() => {
    const onAppsChanged = (value: AppItem[]) => setAllApps(value)
    apps.subscribe(onAppsChanged)
    return () => apps.unsubscribe(onAppsChanged)
  }, [])

  // The rows are a filtered view of the global list, but `ForEach` needs its
  // own observable to drive drag-to-reorder, so keep a local copy and mirror
  // every edit back into the global list.
  const folderApps = useObservable<AppItem[]>(() =>
    apps.value.filter(a => a.folderIds?.includes(folder.id))
  )
  const otherApps = allApps.filter(a => !a.folderIds?.includes(folder.id))

  // Drag-to-reorder and swipe-to-delete are applied by `ForEach` to the local
  // array, so push the result back into the global list.
  useEffect(() => {
    onSyncFolderApps(folder.id, folderApps.value)
  }, [folderApps.value])

  useEffect(() => {
    const next = allApps.filter(a => a.folderIds?.includes(folder.id))
    const current = folderApps.value
    // Reordering here already pushed the same array upwards, so this only
    // fires for changes made elsewhere (app edited, added to the folder, ...).
    if (next.length === current.length && next.every((a, i) => a === current[i])) {
      return
    }
    folderApps.setValue(next)
  }, [allApps])

  // `ForEach` renders `folderApps`, so adding has to reach that observable to
  // show up. Don't wait for the change to travel back down from the global
  // list — tag the apps, then re-derive the rows from the updated list right
  // away, which also keeps them in the global order.
  function addToFolder(items: AppItem[]) {
    items.forEach(item =>
      onUpdateApp({
        ...item,
        folderIds: item.folderIds?.includes(folder.id)
          ? item.folderIds
          : [...(item.folderIds ?? []), folder.id]
      })
    )
    folderApps.setValue(apps.value.filter(a => a.folderIds?.includes(folder.id)))
  }

  return (
    <List
      navigationTitle={folder.name}
      toolbar={{
        topBarTrailing: [
          <EditButton key="edit" />,
          <NavigationLink
            key="rename"
            destination={
              <FolderNameEditor
                folder={folder}
                onSave={(name, icon, color) =>
                  onRenameFolder(folder.id, name, icon, color)
                }
              />
            }
          >
            <Image systemName="pencil" />
          </NavigationLink>,
          <NavigationLink
            key="settings"
            destination={
              <FolderSettingsView
                folder={folder}
                onUpdateFolderStyle={onUpdateFolderStyle}
              />
            }
          >
            <Image systemName="gearshape" />
          </NavigationLink>
        ]
      }}
    >
      <Section>
        <ForEach
          data={folderApps}
          editActions="all"
          builder={item => (
            <NavigationLink
              key={item.id}
              destination={
                <AppEditor item={item} folders={folders} onSave={onUpdateApp} />
              }
            >
              <AppRow item={item} />
            </NavigationLink>
          )}
        />
        <NavigationLink
          destination={
            <AppEditor
              folders={folders}
              initialFolderIds={[folder.id]}
              onSave={(item) => addToFolder([item])}
            />
          }
        >
          <HStack>
            <Image
              systemName="plus.circle.fill"
              foregroundStyle={'systemGreen' as Color}
            />
            <Text>Add New App</Text>
          </HStack>
        </NavigationLink>
      </Section>
      {otherApps.length > 0 && (
        <Section>
          <NavigationLink
            destination={
              <AddExistingAppView apps={otherApps} onAdd={addToFolder} />
            }
          >
            <HStack>
              <Image
                systemName="plus.square.on.square"
                foregroundStyle={'systemBlue' as Color}
              />
              <Text>Add Existing App</Text>
            </HStack>
          </NavigationLink>
        </Section>
      )}
    </List>
  )
}

function AppEditor({
  item,
  folders = [],
  initialFolderIds,
  onSave
}: {
  item?: AppItem
  folders?: Folder[]
  initialFolderIds?: string[]
  onSave: (item: AppItem) => void
}) {
  const [id] = useState(() => item?.id ?? Math.random().toString(36).slice(2))
  const [name, setName] = useState(item?.name ?? '')
  const [mode, setMode] = useState<'url' | 'bundleId' | 'script'>(
    item?.mode ?? 'url'
  )
  const [url, setUrl] = useState(item?.url ?? '')
  const [bundleId, setBundleId] = useState(item?.bundleId ?? '')
  const [runInWidget, setRunInWidget] = useState(item?.runInWidget !== false)
  const [icon, setIcon] = useState(item?.icon ?? 'app')
  const [iconType, setIconType] = useState<
    'symbol' | 'image' | 'transparent_image'
  >(item?.iconType ?? 'symbol')
  const [color, setColor] = useState<Color>((item?.color ?? '#007AFF') as Color)
  const [folderIds, setFolderIds] = useState<string[]>(() => {
    const legacy = (item as AppItem & { folderId?: string } | undefined)
      ?.folderId
    return Array.from(
      new Set([
        ...(item?.folderIds ?? []),
        ...(legacy ? [legacy] : []),
        ...(initialFolderIds ?? [])
      ])
    )
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const dismiss = Navigation.useDismiss()

  const codeController = useMemo(
    () =>
      new EditorController({
        ext: 'js',
        content: readButtonCode(id)
      }),
    []
  )

  useEffect(() => {
    return () => codeController.dispose()
  }, [codeController])

  function toggleFolder(folderId: string) {
    setFolderIds(prev =>
      prev.includes(folderId)
        ? prev.filter(x => x !== folderId)
        : [...prev, folderId]
    )
  }

  const handleSelectApp = (app: ITunesApp) => {
    setName(app.trackName)
    if (app.bundleId) {
      setBundleId(app.bundleId)
      setMode('bundleId')
    }
    const artwork = app.artworkUrl100 || app.artworkUrl60 || ''
    if (artwork) {
      setIcon(artwork)
      setIconType('image')
    }
    setSearchOpen(false)
  }

  return (
    <Form
      navigationTitle={item ? 'Edit App' : 'Add App'}
      sheet={{
        isPresented: searchOpen,
        onChanged: setSearchOpen,
        content: searchOpen ? (
          <VStack
            frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
            presentationDragIndicator="visible"
            presentationDetents={['medium', 'large']}
          >
            <SearchSheet
              initialQuery={name}
              onClose={() => setSearchOpen(false)}
              onSelect={handleSelectApp}
            />
          </VStack>
        ) : (
          <VStack />
        )
      }}
      toolbar={{
        confirmationAction: [
          <Button
            key="save"
            title="Save"
            systemImage="checkmark"
            action={() => {
              if (mode === 'script') {
                saveButtonCode(id, codeController.content)
              }
              onSave({
                id,
                name,
                mode,
                url,
                bundleId,
                runInWidget,
                icon,
                iconType,
                color: color as unknown as string,
                folderIds
              })
              dismiss()
            }}
          />
        ]
      }}
    >
      <Section header={<Text>Basic Info</Text>}>
        <HStack>
          <TextField title="Name" value={name} onChanged={setName} />
          <Button action={() => setSearchOpen(true)} buttonStyle="plain">
            <Image
              systemName="magnifyingglass"
              font={14}
              fontWeight="semibold"
              foregroundStyle={'white' as Color}
              frame={{ width: 28, height: 28 }}
              background={{
                style: '#0A84FF' as Color,
                shape: 'circle'
              }}
            />
          </Button>
        </HStack>
        <Picker
          title="Launch Mode"
          value={mode}
          onChanged={(v: string) => {
            const next = v as 'url' | 'bundleId' | 'script'
            setMode(next)
            if (next === 'script' && icon === 'app' && iconType === 'symbol') {
              setIcon('bolt.fill')
            }
          }}
        >
          <Text tag="url">URL Scheme</Text>
          <Text tag="bundleId">Bundle ID</Text>
          <Text tag="script">Custom Script</Text>
        </Picker>
        {mode === 'bundleId' ? (
          <TextField
            title="Bundle ID"
            value={bundleId}
            onChanged={setBundleId}
          />
        ) : mode === 'script' ? null : (
          <TextField title="URL Scheme" value={url} onChanged={setUrl} />
        )}
      </Section>

      {mode === 'script' && (
        <Section
          header={<Text>Custom Code</Text>}
          footer={
            <Text>
              Plain JavaScript, top-level await supported. With "Run in Widget"
              on, the code runs inside the widget extension where there is no UI
              host — prefer Notification or side effects over Dialog there.
              Deleting this app also deletes its code.
            </Text>
          }
        >
          <Button
            title="Edit Code"
            systemImage="chevron.left.forwardslash.chevron.right"
            action={() => {
              codeController.present({
                navigationTitle: name || 'Button Code',
                fullscreen: true
              })
            }}
          />
          <Button
            title="Run"
            systemImage="play.fill"
            action={async () => {
              const code = codeController.content
              saveButtonCode(id, code)
              try {
                await runButtonCode(code, { item, env: Script.env })
              } catch (e) {
                console.error(e)
                await Dialog.alert({ title: 'Run failed', message: String(e) })
              }
            }}
          />
          <Toggle
            title="Run in Widget"
            value={runInWidget}
            onChanged={setRunInWidget}
          />
        </Section>
      )}

      <Section header={<Text>Appearance</Text>}>
        <Picker
          title="Icon Type"
          value={iconType}
          onChanged={(v: string) =>
            setIconType(v as 'symbol' | 'image' | 'transparent_image')
          }
        >
          <Text tag="symbol">SF Symbol</Text>
          <Text tag="image">Network Image</Text>
          <Text tag="transparent_image">Transparent Image</Text>
        </Picker>

        {iconType === 'symbol' ? (
          <HStack>
            <Text>Icon (SF Symbol)</Text>
            <TextField title="Icon" value={icon} onChanged={setIcon} />
            <Image systemName={icon} font={20} foregroundStyle={color} />
          </HStack>
        ) : (
          <HStack>
            <Text>Image URL</Text>
            <TextField title="URL" value={icon} onChanged={setIcon} />
            <Button
              title="Photos"
              action={async () => {
                try {
                  const images = await Photos.pickPhotos(1)
                  const image = images?.[0]
                  if (image) {
                    const data = image.toPNGData()
                    if (data) {
                      const id = `img_${Date.now()}`
                      if (!FileManager.existsSync(CACHE_PATH)) {
                        FileManager.createDirectorySync(CACHE_PATH, true)
                      }
                      const cachePath = getIconCachePath(id)
                      FileManager.writeAsDataSync(cachePath, data)
                      setIcon(id)
                    }
                  }
                } catch (e) {
                  console.error(e)
                }
              }}
            />
            <AppIconView
              icon={icon}
              iconType={iconType}
              color={color as unknown as string}
            />
          </HStack>
        )}

        <ColorPicker value={color} onChanged={setColor}>
          <Text>Theme Color</Text>
        </ColorPicker>
      </Section>

      {folders.length > 0 && (
        <Section header={<Text>Folders</Text>}>
          {folders.map(f => (
            <Toggle
              key={f.id}
              title={f.name}
              value={folderIds.includes(f.id)}
              onChanged={() => toggleFolder(f.id)}
            />
          ))}
        </Section>
      )}

    </Form>
  )
}

function AppIconView({
  icon,
  iconType,
  color
}: {
  icon: string
  iconType: AppItem['iconType']
  color: string
}) {
  if (iconType === 'image' || iconType === 'transparent_image') {
    const cachePath = getIconCachePath(icon)
    if (FileManager.existsSync(cachePath)) {
      return (
        <ZStack
          frame={{ width: 24, height: 24 }}
          clipShape={{ type: 'rect', cornerRadius: 6 }}
        >
          <Image filePath={cachePath} resizable scaleToFill />
        </ZStack>
      )
    }
    return (
      <ZStack
        frame={{ width: 24, height: 24 }}
        clipShape={{ type: 'rect', cornerRadius: 6 }}
      >
        <Image imageUrl={icon} resizable scaleToFill />
      </ZStack>
    )
  }
  return <Image systemName={icon} foregroundStyle={color as Color} />
}

function getAppSubtitle(item: AppItem) {
  if (item.mode === 'bundleId') return item.bundleId ?? ''
  if (item.mode === 'script') return 'Custom Code'
  return item.url
}

// Search matches the app name and the subtitle line shown in the row
// (bundleId / url / Custom Code) — the text the user actually sees.
function matchesQuery(item: AppItem, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    item.name.toLowerCase().includes(q) ||
    getAppSubtitle(item).toLowerCase().includes(q)
  )
}

function filterApps(items: AppItem[], query: string) {
  return query.trim() ? items.filter(item => matchesQuery(item, query)) : items
}

function AppRow({ item, folders }: { item: AppItem; folders?: Folder[] }) {
  const subtitle = getAppSubtitle(item)
  const folderNames = (item.folderIds ?? [])
    .map(fid => folders?.find(f => f.id === fid)?.name)
    .filter(Boolean)
    .join(', ')

  return (
    <HStack alignment="center">
      <AppIconView
        icon={item.icon}
        iconType={item.iconType}
        color={item.color}
      />
      <VStack alignment="leading" spacing={2}>
        <Text font={16}>{item.name}</Text>
        {/* Skip the second line entirely when empty, otherwise it still takes
            up a line and pushes the name above the icon's center. */}
        {subtitle || folderNames ? (
          <HStack spacing={4}>
            {subtitle ? (
              <Text font={12} opacity={0.6} lineLimit={1}>
                {subtitle}
              </Text>
            ) : null}
            {folderNames ? (
              <Text font={11} foregroundStyle={'systemBlue' as Color}>
                {folderNames}
              </Text>
            ) : null}
          </HStack>
        ) : null}
      </VStack>
    </HStack>
  )
}

function App() {
  const apps = useObservable<AppItem[]>([])
  const folders = useObservable<Folder[]>([])
  const [shape, setShape] = useState<'rounded' | 'circle'>(DEFAULT_CONFIG.shape)
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
        const str = FileManager.readAsStringSync(FILE_PATH)
        apps.setValue((JSON.parse(str) as AppItem[]).map(migrateAppItem))
      } else {
        apps.setValue(DEFAULT_APPS)
        if (!FileManager.existsSync(BASE_PATH)) {
          FileManager.createDirectory(BASE_PATH)
        }
        FileManager.writeAsStringSync(FILE_PATH, JSON.stringify(DEFAULT_APPS))
      }

      if (FileManager.existsSync(FOLDERS_PATH)) {
        folders.setValue(JSON.parse(FileManager.readAsStringSync(FOLDERS_PATH)))
      }

      if (FileManager.existsSync(CONFIG_PATH)) {
        const config = JSON.parse(FileManager.readAsStringSync(CONFIG_PATH))
        setShape(config.shape)
        if (config.iconSize) setIconSize(config.iconSize)
        if (config.spacing !== undefined) setSpacing(config.spacing)
        if (config.widgetAccentedRenderingMode)
          setAccentedMode(config.widgetAccentedRenderingMode)
      }
    } catch (e) {
      console.error(e)
      apps.setValue(DEFAULT_APPS)
    } finally {
      setIsLoaded(true)
      apps.value.forEach(cacheAppIcon)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    try {
      if (!FileManager.existsSync(BASE_PATH)) {
        FileManager.createDirectory(BASE_PATH)
      }
      FileManager.writeAsStringSync(FILE_PATH, JSON.stringify(apps.value))
      // Swipe-to-delete goes straight through ForEach's edit actions, so there
      // is no delete callback to hook — reconcile the code files here instead.
      pruneButtonCode(apps.value.map(a => a.id))
      Widget.reloadAll()
    } catch (e) {
      console.error(e)
    }
  }, [apps.value, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    try {
      if (!FileManager.existsSync(BASE_PATH)) {
        FileManager.createDirectory(BASE_PATH)
      }
      FileManager.writeAsStringSync(FOLDERS_PATH, JSON.stringify(folders.value))
      Widget.reloadAll()
    } catch (e) {
      console.error(e)
    }
  }, [folders.value, isLoaded])

  // Swipe-to-delete goes straight through ForEach's edit actions, so there is
  // no delete callback to hook — reconcile the apps' folder references here
  // instead (mirrors how the apps list prunes button code on swipe-to-delete).
  useEffect(() => {
    const ids = new Set(folders.value.map(f => f.id))
    let changed = false
    const next = apps.value.map(a => {
      const folderIds = (a.folderIds ?? []).filter(id => ids.has(id))
      if (folderIds.length === (a.folderIds?.length ?? 0)) return a
      changed = true
      return { ...a, folderIds }
    })
    if (changed) apps.setValue(next)
  }, [folders.value])

  function saveConfig(
    s: 'rounded' | 'circle',
    i: number,
    sp: number,
    m: Config['widgetAccentedRenderingMode']
  ) {
    const config: Config = {
      shape: s,
      iconSize: i,
      spacing: sp,
      widgetAccentedRenderingMode: m
    }
    if (!FileManager.existsSync(BASE_PATH)) {
      FileManager.createDirectory(BASE_PATH)
    }
    FileManager.writeAsStringSync(CONFIG_PATH, JSON.stringify(config))
    Widget.reloadAll()
    setShape(s)
    setIconSize(i)
    setSpacing(sp)
    setAccentedMode(m)
  }

  async function cacheAppIcon(item: AppItem) {
    if (
      (item.iconType !== 'image' && item.iconType !== 'transparent_image') ||
      !item.icon
    )
      return

    const cachePath = getIconCachePath(item.icon)
    if (FileManager.existsSync(cachePath)) return

    if (!FileManager.existsSync(CACHE_PATH)) {
      FileManager.createDirectorySync(CACHE_PATH, true)
    }

    try {
      if (item.icon.startsWith('http')) {
        const image = await UIImage.fromURL(item.icon)
        if (image) {
          const data = image.toPNGData()
          if (data) {
            FileManager.writeAsDataSync(cachePath, data)
            Widget.reloadAll()
          }
        }
      }
    } catch (e) {
      console.error(`Failed to cache icon: ${item.icon}`, e)
    }
  }

  function updateApp(item: AppItem) {
    const currentApps = apps.value
    const index = currentApps.findIndex((a) => a.id === item.id)
    if (index >= 0) {
      const newApps = [...currentApps]
      newApps[index] = item
      apps.setValue(newApps)
    } else {
      apps.setValue([...currentApps, item])
    }
    cacheAppIcon(item)
  }

  // A folder shows a filtered slice of the global list, so reordering inside it
  // rewrites that list in place: the slots the folder occupies keep their
  // positions, only their contents get shuffled. Apps the folder no longer
  // lists were removed from it (swipe-to-delete) and just lose the folder id.
  function syncFolderApps(folderId: string, items: AppItem[]) {
    const current = apps.value
    const positions: number[] = []
    current.forEach((a, i) => {
      if (a.folderIds?.includes(folderId)) positions.push(i)
    })

    const remaining = new Map(positions.map(p => [current[p].id, current[p]]))
    const kept: AppItem[] = []
    items.forEach(item => {
      const app = remaining.get(item.id)
      if (app) {
        kept.push(app)
        remaining.delete(item.id)
      }
    })
    const dropped = Array.from(remaining.values()).map(a => ({
      ...a,
      folderIds: (a.folderIds ?? []).filter(id => id !== folderId)
    }))

    const ordered = [...kept, ...dropped]
    const next = [...current]
    positions.forEach((p, i) => {
      next[p] = ordered[i]
    })
    if (positions.every((p, i) => next[p] === current[p])) return
    apps.setValue(next)
  }

  function addFolder(name: string, icon?: string, color?: string) {
    folders.setValue([
      ...folders.value,
      { id: Math.random().toString(36).slice(2), name, icon, color }
    ])
  }

  function renameFolder(
    id: string,
    name: string,
    icon?: string,
    color?: string
  ) {
    folders.setValue(
      folders.value.map(f => (f.id === id ? { ...f, name, icon, color } : f))
    )
  }

  function updateFolderStyle(id: string, style: FolderStyle | undefined) {
    folders.setValue(
      folders.value.map(f => (f.id === id ? { ...f, style } : f))
    )
  }

  // The rows always come from `visibleApps`, never from `apps` directly: the
  // list keeps its edit actions while filtering only if `ForEach` owns the
  // array it renders, and swapping which observable is bound (as the query
  // comes and goes) leaves the list rendering a stale array.
  const sameItems = (a: AppItem[], b: AppItem[]) =>
    a.length === b.length && a.every((item, i) => item === b[i])

  useEffect(() => {
    const next = filterApps(apps.value, query)
    if (sameItems(next, visibleApps.value)) return
    visibleApps.setValue(next)
  }, [apps.value, query])

  // Drag-to-reorder and swipe-to-delete are applied by `ForEach` to its own
  // array, so push the result back into the global list.
  useEffect(() => {
    if (!isLoaded) return
    const rows = visibleApps.value
    if (sameItems(rows, filterApps(apps.value, query))) return
    if (!query.trim()) {
      // Unfiltered: the rows *are* the global list, reordering included.
      apps.setValue(rows)
      return
    }
    // Filtered: reordering is off, so a row that vanished was deleted. Apps
    // the query didn't match keep their places untouched.
    const kept = new Set(rows.map(a => a.id))
    apps.setValue(
      apps.value.filter(a => kept.has(a.id) || !matchesQuery(a, query))
    )
  }, [visibleApps.value])

  const appRow = (item: AppItem) => (
    <NavigationLink
      key={item.id}
      destination={
        <AppEditor item={item} folders={folders.value} onSave={updateApp} />
      }
    >
      <AppRow item={item} folders={folders.value} />
    </NavigationLink>
  )

  const appsList = (
    <List
      navigationTitle="Apps"
      searchable={{
        value: query,
        onChanged: setQuery,
        prompt: 'Search Apps'
      }}
      overlay={
        query.trim() && filterApps(apps.value, query).length === 0 ? (
          <ContentUnavailableView
            title="No Results"
            systemImage="magnifyingglass"
          />
        ) : undefined
      }
      toolbar={{
        topBarLeading: [
          <Button title="Close" systemImage="xmark" action={dismiss} />
        ],
        confirmationAction: [
          <EditButton />,
          <NavigationLink
            destination={
              <AppEditor
                folders={folders.value}
                onSave={(item) => updateApp(item)}
              />
            }
          >
            <Image systemName="plus" />
          </NavigationLink>
        ]
      }}
    >
      <Section>
        <ForEach
          data={visibleApps}
          editActions={query.trim() ? 'delete' : 'all'}
          builder={appRow}
        />
      </Section>
    </List>
  )

  const foldersList = (
    <List
      navigationTitle="Folders"
      toolbar={{
        confirmationAction: [
          <NavigationLink
            key="add"
            destination={<FolderNameEditor onSave={addFolder} />}
          >
            <Image systemName="folder.badge.plus" />
          </NavigationLink>
        ]
      }}
    >
      <Section>
        <ForEach
          data={folders}
          editActions="delete"
          builder={(folder) => (
            <NavigationLink
              key={folder.id}
              destination={
                <FolderDetail
                  folder={folder}
                  apps={apps}
                  folders={folders.value}
                  onUpdateApp={updateApp}
                  onSyncFolderApps={syncFolderApps}
                  onRenameFolder={renameFolder}
                  onUpdateFolderStyle={updateFolderStyle}
                />
              }
            >
              <HStack>
                <FolderIconView icon={folder.icon} color={folder.color} />
                <Text>{folder.name}</Text>
                <Spacer />
                <Text opacity={0.5}>
                  {apps.value
                    .filter(a => a.folderIds?.includes(folder.id))
                    .length.toString()}
                </Text>
              </HStack>
            </NavigationLink>
          )}
        />
      </Section>
    </List>
  )

  const settingsList = (
    <List navigationTitle="Settings">
      <Section>
        <Picker
          title="Icon Shape"
          value={shape}
          onChanged={(v: string) =>
            saveConfig(v as 'rounded' | 'circle', iconSize, spacing, accentedMode)
          }
        >
          <Text tag="rounded">Rounded Rectangle</Text>
          <Text tag="circle">Circle</Text>
        </Picker>
        <Stepper
          onIncrement={() => {
            if (iconSize < 100)
              saveConfig(shape, iconSize + 1, spacing, accentedMode)
          }}
          onDecrement={() => {
            if (iconSize > 20)
              saveConfig(shape, iconSize - 1, spacing, accentedMode)
          }}
        >
          <HStack>
            <Text>Icon Size</Text>
            <Spacer />
            <Text opacity={0.5}>{iconSize.toString()}</Text>
          </HStack>
        </Stepper>
        <Stepper
          onIncrement={() => {
            if (spacing < 50)
              saveConfig(shape, iconSize, spacing + 1, accentedMode)
          }}
          onDecrement={() => {
            if (spacing > 0)
              saveConfig(shape, iconSize, spacing - 1, accentedMode)
          }}
        >
          <HStack>
            <Text>Spacing</Text>
            <Spacer />
            <Text opacity={0.5}>{spacing.toString()}</Text>
          </HStack>
        </Stepper>
        <Picker
          title="Icon Rendering Mode"
          value={accentedMode}
          onChanged={(v: string) =>
            saveConfig(shape, iconSize, spacing, v as Config['widgetAccentedRenderingMode'])
          }
        >
          <Text tag="fullColor">Full Color</Text>
          <Text tag="accented">Accented</Text>
          <Text tag="desaturated">Desaturated</Text>
          <Text tag="accentedDesaturated">Accented & Desaturated</Text>
        </Picker>
      </Section>
      <Section>
        <Button
          title="Preview Widget"
          action={async () => {
            await Widget.preview({ family: 'systemMedium' })
          }}
        />
      </Section>
    </List>
  )

  const tabs = [
    { title: 'Apps', systemImage: 'square.grid.2x2', content: appsList },
    { title: 'Folders', systemImage: 'folder', content: foldersList },
    { title: 'Settings', systemImage: 'gear', content: settingsList }
  ]

  // `Tab` is iOS 18.0+ only; fall back to the legacy `tabItem` form below that.
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

// Launched from a widget tile whose "Run in Widget" is off: run that button's
// code headlessly and quit, without showing the launcher UI.
const buttonId = Script.queryParameters['buttonId']

if (buttonId) {
  runButtonById(String(buttonId), { env: Script.env })
    .catch(e => console.error(e))
    .finally(() => Script.exit())
} else {
  Navigation.present({
    element: <App />
  }).finally(() => Script.exit())
}
