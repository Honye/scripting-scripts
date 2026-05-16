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
  getIconCachePath
} from './constants'
import { ITunesApp, SearchSheet } from './SearchSheet'

function FolderNameEditor({
  folder,
  onSave
}: {
  folder?: Folder
  onSave: (name: string) => void
}) {
  const [name, setName] = useState(folder?.name ?? '')
  const dismiss = Navigation.useDismiss()

  return (
    <Form navigationTitle={folder ? 'Rename Folder' : 'New Folder'}>
      <Section>
        <TextField title="Folder Name" value={name} onChanged={setName} />
      </Section>
      <Section>
        <Button
          title="Save"
          action={() => {
            if (name.trim()) {
              onSave(name.trim())
              dismiss()
            }
          }}
        />
      </Section>
    </Form>
  )
}

function AddExistingAppView({
  apps,
  onAdd
}: {
  apps: AppItem[]
  onAdd: (item: AppItem) => void
}) {
  const dismiss = Navigation.useDismiss()

  return (
    <List navigationTitle="Add Apps">
      <Section>
        {apps.map(item => (
          <Button
            key={item.id}
            action={() => {
              onAdd(item)
              dismiss()
            }}
            buttonStyle="plain"
          >
            <HStack>
              <AppIconView
                icon={item.icon}
                iconType={item.iconType}
                color={item.color}
              />
              <Text font={16}>{item.name}</Text>
            </HStack>
          </Button>
        ))}
      </Section>
    </List>
  )
}

function FolderDetail({
  folder,
  allApps,
  folders,
  onUpdateApp,
  onDeleteFolder,
  onRenameFolder
}: {
  folder: Folder
  allApps: AppItem[]
  folders: Folder[]
  onUpdateApp: (item: AppItem) => void
  onDeleteFolder: (id: string) => void
  onRenameFolder: (id: string, name: string) => void
}) {
  const folderApps = allApps.filter(a => a.folderId === folder.id)
  const otherApps = allApps.filter(a => a.folderId !== folder.id)
  const dismiss = Navigation.useDismiss()

  return (
    <List
      navigationTitle={folder.name}
      toolbar={{
        topBarTrailing: [
          <NavigationLink
            key="rename"
            destination={
              <FolderNameEditor
                folder={folder}
                onSave={(name) => onRenameFolder(folder.id, name)}
              />
            }
          >
            <Image systemName="pencil" />
          </NavigationLink>,
          <Button
            key="delete"
            title="Delete"
            systemImage="trash"
            action={() => {
              onDeleteFolder(folder.id)
              dismiss()
            }}
          />
        ]
      }}
    >
      <Section>
        {folderApps.map(item => (
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
                  {item.mode === 'bundleId' ? (item.bundleId ?? '') : item.url}
                </Text>
              </VStack>
            </HStack>
          </NavigationLink>
        ))}
        <NavigationLink
          destination={
            <AppEditor
              folders={folders}
              initialFolderId={folder.id}
              onSave={(item) => onUpdateApp({ ...item, folderId: folder.id })}
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
                onAdd={(item) =>
                  onUpdateApp({ ...item, folderId: folder.id })
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
  initialFolderId,
  onSave
}: {
  item?: AppItem
  folders?: Folder[]
  initialFolderId?: string
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
  const [folderId, setFolderId] = useState<string | undefined>(
    item?.folderId ?? initialFolderId
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const dismiss = Navigation.useDismiss()

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
        <Section header={<Text>Folder</Text>}>
          <Picker
            title="Folder"
            value={folderId ?? ''}
            onChanged={(v: string) => setFolderId(v || undefined)}
          >
            <Text tag="">No Folder</Text>
            {folders.map(f => (
              <Text key={f.id} tag={f.id}>{f.name}</Text>
            ))}
          </Picker>
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
              folderId
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
        apps.setValue(JSON.parse(str))
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

  function addFolder(name: string) {
    setFolders([
      ...folders,
      { id: Math.random().toString(36).slice(2), name }
    ])
  }

  function deleteFolder(id: string) {
    setFolders(folders.filter(f => f.id !== id))
    apps.setValue(
      apps.value.map(a => (a.folderId === id ? { ...a, folderId: undefined } : a))
    )
  }

  function renameFolder(id: string, name: string) {
    setFolders(folders.map(f => (f.id === id ? { ...f, name } : f)))
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
                          {item.folderId ? (
                            <Text font={11} foregroundStyle={'systemBlue' as Color}>
                              {folders.find(f => f.id === item.folderId)?.name ?? ''}
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
                    />
                  }
                >
                  <HStack>
                    <Image
                      systemName="folder.fill"
                      foregroundStyle={'systemBlue' as Color}
                    />
                    <Text>{folder.name}</Text>
                    <Spacer />
                    <Text opacity={0.5}>
                      {apps.value
                        .filter(a => a.folderId === folder.id)
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
