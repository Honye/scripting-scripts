import {
  Button,
  Color,
  ColorPicker,
  EditButton,
  ForEach,
  Form,
  HStack,
  Image,
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

function FolderNameEditor({
  folder,
  onSave
}: {
  folder?: Folder
  onSave: (name: string, icon: string) => void
}) {
  const [name, setName] = useState(folder?.name ?? '')
  const [icon, setIcon] = useState(folder?.icon ?? 'folder.fill')
  const dismiss = Navigation.useDismiss()

  return (
    <Form navigationTitle={folder ? 'Rename Folder' : 'New Folder'}>
      <Section>
        <TextField title="Folder Name" value={name} onChanged={setName} />
      </Section>
      <Section header={<Text>Appearance</Text>}>
        <HStack>
          <Text>Icon (SF Symbol)</Text>
          <TextField title="Icon" value={icon} onChanged={setIcon} />
          <FolderIconView icon={icon} />
        </HStack>
      </Section>
      <Section>
        <Button
          title="Save"
          action={() => {
            if (name.trim()) {
              onSave(name.trim(), icon.trim() || 'folder.fill')
              dismiss()
            }
          }}
        />
      </Section>
    </Form>
  )
}

function FolderIconView({ icon }: { icon?: string }) {
  const punchSymbol = icon && UIImage.fromSFSymbol(icon) ? icon : ''
  return (
    <ZStack compositingGroup>
      <Image
        systemName="folder.fill"
        font={30}
        foregroundStyle={'systemBlue' as Color}
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

  const selectedItems = apps.filter(a => selected[a.id])

  return (
    <List
      navigationTitle="Add Apps"
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
        {apps.map(item => {
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
  allApps,
  folders,
  onUpdateApp,
  onDeleteFolder,
  onRenameFolder,
  onUpdateFolderStyle
}: {
  folder: Folder
  allApps: AppItem[]
  folders: Folder[]
  onUpdateApp: (item: AppItem) => void
  onDeleteFolder: (id: string) => void
  onRenameFolder: (id: string, name: string, icon: string) => void
  onUpdateFolderStyle: (id: string, style: FolderStyle | undefined) => void
}) {
  const folderApps = allApps.filter(a => a.folderIds?.includes(folder.id))
  const otherApps = allApps.filter(a => !a.folderIds?.includes(folder.id))
  const dismiss = Navigation.useDismiss()

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
                onSave={(name, icon) => onRenameFolder(folder.id, name, icon)}
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
          </NavigationLink>,
          <Button
            key="delete"
            title="Delete"
            systemImage="trash"
            role="destructive"
            action={() => {
              onDeleteFolder(folder.id)
              dismiss()
            }}
          />
        ]
      }}
    >
      <Section>
        <ForEach
          count={folderApps.length}
          itemBuilder={index => {
            const item = folderApps[index]
            return (
              <NavigationLink
                key={item.id}
                destination={
                  <AppEditor item={item} folders={folders} onSave={onUpdateApp} />
                }
              >
                <HStack>
                  <AppIconView
                    icon={item.icon}
                    iconType={item.iconType}
                    color={item.color}
                  />
                  <VStack alignment="leading">
                    <Text font={16}>{item.name}</Text>
                    <Text font={12} opacity={0.6} lineLimit={1}>
                      {item.mode === 'bundleId'
                        ? (item.bundleId ?? '')
                        : item.url}
                    </Text>
                  </VStack>
                </HStack>
              </NavigationLink>
            )
          }}
          onDelete={(indices) => {
            indices.forEach(index => {
              const item = folderApps[index]
              if (item) {
                onUpdateApp({
                  ...item,
                  folderIds: (item.folderIds ?? []).filter(
                    id => id !== folder.id
                  )
                })
              }
            })
          }}
        />
        <NavigationLink
          destination={
            <AppEditor
              folders={folders}
              initialFolderIds={[folder.id]}
              onSave={(item) =>
                onUpdateApp({
                  ...item,
                  folderIds: item.folderIds?.includes(folder.id)
                    ? item.folderIds
                    : [...(item.folderIds ?? []), folder.id]
                })
              }
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
              <AddExistingAppView
                apps={otherApps}
                onAdd={(items) =>
                  items.forEach(item =>
                    onUpdateApp({
                      ...item,
                      folderIds: item.folderIds?.includes(folder.id)
                        ? item.folderIds
                        : [...(item.folderIds ?? []), folder.id]
                    })
                  )
                }
              />
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
  const [name, setName] = useState(item?.name ?? '')
  const [mode, setMode] = useState<'url' | 'bundleId'>(item?.mode ?? 'url')
  const [url, setUrl] = useState(item?.url ?? '')
  const [bundleId, setBundleId] = useState(item?.bundleId ?? '')
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

  function toggleFolder(id: string) {
    setFolderIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
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
          onChanged={(v: string) => setMode(v as 'url' | 'bundleId')}
        >
          <Text tag="url">URL Scheme</Text>
          <Text tag="bundleId">Bundle ID</Text>
        </Picker>
        {mode === 'bundleId' ? (
          <TextField
            title="Bundle ID"
            value={bundleId}
            onChanged={setBundleId}
          />
        ) : (
          <TextField title="URL Scheme" value={url} onChanged={setUrl} />
        )}
      </Section>

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

      <Section>
        <Button
          title="Save"
          action={() => {
            onSave({
              id: item?.id ?? Math.random().toString(36).slice(2),
              name,
              mode,
              url,
              bundleId,
              icon,
              iconType,
              color: color as unknown as string,
              folderIds
            })
            dismiss()
          }}
        />
      </Section>
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

function App() {
  const apps = useObservable<AppItem[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [shape, setShape] = useState<'rounded' | 'circle'>(DEFAULT_CONFIG.shape)
  const [iconSize, setIconSize] = useState(DEFAULT_CONFIG.iconSize)
  const [spacing, setSpacing] = useState(DEFAULT_CONFIG.spacing)
  const [accentedMode, setAccentedMode] = useState<
    Config['widgetAccentedRenderingMode']
  >(DEFAULT_CONFIG.widgetAccentedRenderingMode)
  const [isLoaded, setIsLoaded] = useState(false)
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
        setFolders(JSON.parse(FileManager.readAsStringSync(FOLDERS_PATH)))
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
      FileManager.writeAsStringSync(FOLDERS_PATH, JSON.stringify(folders))
      Widget.reloadAll()
    } catch (e) {
      console.error(e)
    }
  }, [folders, isLoaded])

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

  function addFolder(name: string, icon: string) {
    setFolders([
      ...folders,
      { id: Math.random().toString(36).slice(2), name, icon }
    ])
  }

  function deleteFolder(id: string) {
    setFolders(folders.filter(f => f.id !== id))
    apps.setValue(
      apps.value.map(a => ({
        ...a,
        folderIds: (a.folderIds ?? []).filter(fid => fid !== id)
      }))
    )
  }

  function renameFolder(id: string, name: string, icon: string) {
    setFolders(folders.map(f => (f.id === id ? { ...f, name, icon } : f)))
  }

  function updateFolderStyle(id: string, style: FolderStyle | undefined) {
    setFolders(folders.map(f => (f.id === id ? { ...f, style } : f)))
  }

  return (
    <TabView>
      <Tab title="Apps" systemImage="square.grid.2x2">
        <NavigationStack>
          <List
            navigationTitle="Apps"
            toolbar={{
              topBarLeading: [
                <Button title="Close" systemImage="xmark" action={dismiss} />
              ],
              confirmationAction: [
                <EditButton />,
                <NavigationLink
                  destination={
                    <AppEditor
                      folders={folders}
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
                data={apps}
                editActions="all"
                builder={(item) => (
                  <NavigationLink
                    key={item.id}
                    destination={
                      <AppEditor item={item} folders={folders} onSave={updateApp} />
                    }
                  >
                    <HStack>
                      <AppIconView
                        icon={item.icon}
                        iconType={item.iconType}
                        color={item.color}
                      />
                      <VStack alignment="leading">
                        <Text font={16}>{item.name}</Text>
                        <HStack spacing={4}>
                          <Text font={12} opacity={0.6} lineLimit={1}>
                            {item.mode === 'bundleId'
                              ? (item.bundleId ?? '')
                              : item.url}
                          </Text>
                          {item.folderIds && item.folderIds.length > 0 ? (
                            <Text font={11} foregroundStyle={'systemBlue' as Color}>
                              {item.folderIds
                                .map(fid => folders.find(f => f.id === fid)?.name)
                                .filter(Boolean)
                                .join(', ')}
                            </Text>
                          ) : null}
                        </HStack>
                      </VStack>
                    </HStack>
                  </NavigationLink>
                )}
              />
            </Section>
          </List>
        </NavigationStack>
      </Tab>

      <Tab title="Folders" systemImage="folder">
        <NavigationStack>
          <List navigationTitle="Folders">
            <Section>
              {folders.map(folder => (
                <NavigationLink
                  key={folder.id}
                  destination={
                    <FolderDetail
                      folder={folder}
                      allApps={apps.value}
                      folders={folders}
                      onUpdateApp={updateApp}
                      onDeleteFolder={deleteFolder}
                      onRenameFolder={renameFolder}
                      onUpdateFolderStyle={updateFolderStyle}
                    />
                  }
                >
                  <HStack>
                    <FolderIconView icon={folder.icon} />
                    <Text>{folder.name}</Text>
                    <Spacer />
                    <Text opacity={0.5}>
                      {apps.value
                        .filter(a => a.folderIds?.includes(folder.id))
                        .length.toString()}
                    </Text>
                  </HStack>
                </NavigationLink>
              ))}
              <NavigationLink destination={<FolderNameEditor onSave={addFolder} />}>
                <HStack>
                  <Image
                    systemName="folder.badge.plus"
                    foregroundStyle={'systemBlue' as Color}
                  />
                  <Text>Add Folder</Text>
                </HStack>
              </NavigationLink>
            </Section>
          </List>
        </NavigationStack>
      </Tab>

      <Tab title="Settings" systemImage="gear">
        <NavigationStack>
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
        </NavigationStack>
      </Tab>
    </TabView>
  )
}

Navigation.present({
  element: <App />
}).finally(() => Script.exit())
