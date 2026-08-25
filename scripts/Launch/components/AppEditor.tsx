import {
  Button,
  Color,
  ColorPicker,
  Form,
  HStack,
  Image,
  Label,
  Navigation,
  Picker,
  RoundedRectangle,
  Script,
  Section,
  Spacer,
  Text,
  TextField,
  Toggle,
  VStack,
  ZStack,
  useEffect,
  useMemo,
  useState
} from 'scripting'
import { ITunesApp, SearchSheet } from '../SearchSheet'
import {
  AppItem,
  CACHE_PATH,
  Folder,
  findRepositoryDarkIcon,
  getIconCachePath
} from '../constants'
import {
  readButtonCode,
  runButtonCode,
  saveButtonCode
} from '../buttonCode'
import {
  AppIconView,
  FolderIconView,
  ResolvedIconImage
} from './SharedViews'

type AppLaunchMode = 'url' | 'bundleId' | 'script'
type AppIconType = 'symbol' | 'image' | 'transparent_image'

const EDITOR_SECONDARY = 'secondaryLabel' as Color

async function pickIconFromPhotos(): Promise<string | undefined> {
  try {
    const images = await Photos.pickPhotos(1)
    const image = images?.[0]
    if (!image) return
    const data = image.toPNGData()
    if (!data) return
    const id = `img_${Date.now()}`
    if (!FileManager.existsSync(CACHE_PATH)) {
      FileManager.createDirectorySync(CACHE_PATH, true)
    }
    FileManager.writeAsDataSync(getIconCachePath(id), data)
    return id
  } catch (e) {
    console.error(e)
  }
}

function EditorSectionHeader({ title }: { title: string }) {
  return (
    <HStack spacing={6}>
      <Text font={13} fontWeight="semibold" foregroundStyle={EDITOR_SECONDARY}>
        {title}
      </Text>
    </HStack>
  )
}

function launchModeTitle(mode: AppLaunchMode) {
  if (mode === 'bundleId') return 'App'
  if (mode === 'script') return 'Script'
  return 'URL Scheme'
}

function launchSummary(mode: AppLaunchMode, url: string, bundleId: string) {
  if (mode === 'bundleId') return bundleId.trim() || 'Enter a Bundle ID'
  if (mode === 'script') return 'Runs your custom JavaScript'
  return url.trim() || 'Enter a URL scheme'
}

function AppEditorIconPreview({
  icon,
  iconDark,
  iconType,
  color
}: {
  icon: string
  iconDark?: string
  iconType: AppIconType
  color: Color
}) {
  const size = 72
  const radius = 16

  return (
    <ZStack
      frame={{ width: size, height: size }}
      clipShape={{ type: 'rect', cornerRadius: radius }}
      overlay={
        <RoundedRectangle
          cornerRadius={radius}
          stroke={{
            shapeStyle: 'separator' as Color,
            strokeStyle: { lineWidth: 1 }
          }}
        />
      }
    >
      {iconType === 'image' ? (
        <ResolvedIconImage icon={icon} iconDark={iconDark} />
      ) : (
        <Fragment>
          <RoundedRectangle
            frame={{ width: size, height: size }}
            fill={color}
            cornerRadius={radius}
          />
          {iconType === 'transparent_image' ? (
            <ZStack frame={{ width: 44, height: 44 }}>
              <ResolvedIconImage icon={icon} iconDark={iconDark} fit />
            </ZStack>
          ) : (
            <Image
              systemName={icon || 'app.fill'}
              font={34}
              fontWeight="medium"
              foregroundStyle={'white' as Color}
            />
          )}
        </Fragment>
      )}
    </ZStack>
  )
}

export function AppEditor({
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
  const [mode, setMode] = useState<AppLaunchMode>(item?.mode ?? 'url')
  const [url, setUrl] = useState(item?.url ?? '')
  const [bundleId, setBundleId] = useState(item?.bundleId ?? '')
  const [runInWidget, setRunInWidget] = useState(item?.runInWidget !== false)
  const [icon, setIcon] = useState(item?.icon ?? 'app')
  const [iconDark, setIconDark] = useState(item?.iconDark ?? '')
  const [iconType, setIconType] = useState<AppIconType>(
    item?.iconType ?? 'symbol'
  )
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
  const hasLaunchTarget =
    mode === 'script' ||
    (mode === 'bundleId' ? !!bundleId.trim() : !!url.trim())
  const canSave = !!name.trim() && !!icon.trim() && hasLaunchTarget

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

  async function testURLScheme() {
    const target = url.trim()
    if (!target) return

    try {
      const didOpen = await Safari.openURL(target)
      if (!didOpen) {
        await Dialog.alert({
          title: "Couldn't Open URL Scheme",
          message:
            'No installed app can open this URL. Check the scheme and try again.'
        })
      }
    } catch (e) {
      console.error(e)
      await Dialog.alert({
        title: "Couldn't Open URL Scheme",
        message: String(e)
      })
    }
  }

  function handleSelectApp(app: ITunesApp) {
    setName(app.trackName)
    if (app.bundleId) {
      setBundleId(app.bundleId)
      setMode('bundleId')
    }
    const artwork = app.artworkUrl100 || app.artworkUrl60 || ''
    if (artwork) {
      setIcon(artwork)
      setIconType('image')
      setIconDark('')
      findRepositoryDarkIcon(app.bundleId).then(repositoryIcon => {
        if (repositoryIcon) setIconDark(repositoryIcon)
      })
    }
    setSearchOpen(false)
  }

  function save() {
    if (mode === 'script') {
      saveButtonCode(id, codeController.content)
    }
    onSave({
      id,
      name: name.trim(),
      mode,
      url: url.trim(),
      bundleId: bundleId.trim(),
      runInWidget,
      icon: icon.trim(),
      iconDark:
        iconType === 'symbol' ? undefined : iconDark.trim() || undefined,
      iconType,
      color: color as unknown as string,
      folderIds
    })
    dismiss()
  }

  async function testScript() {
    const code = codeController.content
    saveButtonCode(id, code)
    try {
      await runButtonCode(code, { item, env: Script.env })
    } catch (e) {
      console.error(e)
      await Dialog.alert({ title: 'Run failed', message: String(e) })
    }
  }

  return (
    <Form
      navigationTitle={item ? 'Edit App' : 'Add App'}
      navigationBarTitleDisplayMode="inline"
      formStyle="grouped"
      scrollDismissesKeyboard="interactively"
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
            disabled={!canSave}
            action={save}
          />
        ]
      }}
    >
      <Section>
        <HStack spacing={16} padding={{ vertical: 8 }}>
          <AppEditorIconPreview
            icon={icon}
            iconDark={iconDark}
            iconType={iconType}
            color={color}
          />
          <VStack
            alignment="leading"
            spacing={4}
            frame={{ maxWidth: 'infinity', alignment: 'leading' }}
          >
            <Text
              font={20}
              fontWeight="semibold"
              lineLimit={1}
              truncationMode="tail"
            >
              {name.trim() || 'Untitled App'}
            </Text>
            <Text
              font={13}
              foregroundStyle={EDITOR_SECONDARY}
              lineLimit={1}
              truncationMode="middle"
            >
              {launchSummary(mode, url, bundleId)}
            </Text>
            <HStack spacing={4} padding={{ top: 3 }}>
              <Image
                systemName={
                  mode === 'script'
                    ? 'chevron.left.forwardslash.chevron.right'
                    : mode === 'bundleId'
                      ? 'app.badge'
                      : 'link'
                }
                font={11}
                foregroundStyle={'systemBlue' as Color}
              />
              <Text font={12} foregroundStyle={'systemBlue' as Color}>
                {launchModeTitle(mode)}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Section>

      <Section
        header={<EditorSectionHeader title="Basic Info" />}
        footer={
          !hasLaunchTarget ? (
            <Text>Choose a launch mode and enter its required destination.</Text>
          ) : undefined
        }
      >
        <HStack spacing={10}>
          <TextField
            label={<Label title="Name" systemImage="textformat" />}
            prompt="App name"
            value={name}
            onChanged={setName}
          />
          <Button
            buttonStyle="borderedProminent"
            buttonBorderShape="circle"
            action={() => setSearchOpen(true)}
            accessibilityLabel="Find app in the App Store"
          >
            <Image
              systemName="magnifyingglass"
              font={14}
              fontWeight="semibold"
              frame={{ width: 18, height: 18 }}
            />
          </Button>
        </HStack>
        <Picker
          title="Launch Mode"
          value={mode}
          pickerStyle="segmented"
          onChanged={(v: string) => {
            const next = v as AppLaunchMode
            setMode(next)
            if (next === 'script' && icon === 'app' && iconType === 'symbol') {
              setIcon('bolt.fill')
            }
          }}
        >
          <Text tag="url">URL</Text>
          <Text tag="bundleId">App</Text>
          <Text tag="script">Script</Text>
        </Picker>
        {mode === 'bundleId' ? (
          <TextField
            label={<Label title="Bundle ID" systemImage="app.dashed" />}
            prompt="com.example.app"
            value={bundleId}
            onChanged={setBundleId}
          />
        ) : mode === 'script' ? null : (
          <Fragment>
            <TextField
              label={<Label title="URL Scheme" systemImage="link" />}
              prompt="example://"
              value={url}
              onChanged={setUrl}
            />
            <Button
              title="Test URL Scheme"
              systemImage="play.circle.fill"
              buttonStyle="bordered"
              disabled={!url.trim()}
              action={testURLScheme}
              accessibilityLabel="Test URL Scheme"
            />
          </Fragment>
        )}
      </Section>

      {mode === 'script' && (
        <Section
          header={
            <EditorSectionHeader title="Custom Code" />
          }
          footer={
            <Text>
              Top-level await is supported. When Run in Widget is enabled, use
              notifications or side effects instead of UI such as Dialog.
            </Text>
          }
        >
          <Button
            title="Open Code Editor"
            systemImage="chevron.left.forwardslash.chevron.right"
            buttonStyle="bordered"
            action={() => {
              codeController.present({
                navigationTitle: name || 'Button Code',
                fullscreen: true
              })
            }}
          />
          <Button
            title="Test Run"
            systemImage="play.fill"
            buttonStyle="bordered"
            action={testScript}
          />
          <Toggle
            title="Run in Widget"
            systemImage="square.grid.2x2"
            value={runInWidget}
            onChanged={setRunInWidget}
          />
        </Section>
      )}

      <Section
        header={<EditorSectionHeader title="Appearance" />}
        footer={
          <Text>
            The dark icon is optional. If empty, the light icon is used in both
            appearances.
          </Text>
        }
      >
        <Picker
          title="Icon Type"
          value={iconType}
          pickerStyle="segmented"
          onChanged={(v: string) => setIconType(v as AppIconType)}
        >
          <Text tag="symbol">Symbol</Text>
          <Text tag="image">App Icon</Text>
          <Text tag="transparent_image">Transparent</Text>
        </Picker>

        {iconType === 'symbol' ? (
          <HStack>
            <TextField
              label={<Label title="SF Symbol" systemImage="sparkles" />}
              prompt="app.fill"
              value={icon}
              onChanged={setIcon}
            />
            <Image
              systemName={icon || 'app.fill'}
              font={20}
              foregroundStyle={color}
              frame={{ width: 28, height: 28 }}
            />
          </HStack>
        ) : (
          <Fragment>
            <HStack>
              <TextField
                label={<Label title="Light" systemImage="sun.max.fill" />}
                prompt="Image URL or choose a photo"
                value={icon}
                onChanged={setIcon}
              />
              <Button
                buttonStyle="bordered"
                buttonBorderShape="circle"
                accessibilityLabel="Choose light icon from Photos"
                action={async () => {
                  const nextIcon = await pickIconFromPhotos()
                  if (nextIcon) setIcon(nextIcon)
                }}
              >
                <Image
                  systemName="photo.on.rectangle"
                  font={15}
                  frame={{ width: 18, height: 18 }}
                />
              </Button>
              <AppIconView
                icon={icon}
                iconType={iconType}
                color={color as unknown as string}
              />
            </HStack>
            <HStack>
              <TextField
                label={<Label title="Dark" systemImage="moon.fill" />}
                prompt="Optional"
                value={iconDark}
                onChanged={setIconDark}
              />
              <Button
                buttonStyle="bordered"
                buttonBorderShape="circle"
                accessibilityLabel="Choose dark icon from Photos"
                action={async () => {
                  const nextIcon = await pickIconFromPhotos()
                  if (nextIcon) setIconDark(nextIcon)
                }}
              >
                <Image
                  systemName="photo.on.rectangle"
                  font={15}
                  frame={{ width: 18, height: 18 }}
                />
              </Button>
              <AppIconView
                icon={iconDark || icon}
                iconType={iconType}
                color={color as unknown as string}
              />
            </HStack>
          </Fragment>
        )}

        <ColorPicker value={color} onChanged={setColor}>
          <Text>Theme Color</Text>
        </ColorPicker>
      </Section>

      {folders.length > 0 && (
        <Section
          header={<EditorSectionHeader title="Folders" />}
          footer={
            <Text>
              {folderIds.length === 0
                ? 'This app will only appear in the main Apps list.'
                : `${folderIds.length} folder${folderIds.length === 1 ? '' : 's'} selected.`}
            </Text>
          }
        >
          {folders.map(folder => (
            <Toggle
              key={folder.id}
              value={folderIds.includes(folder.id)}
              onChanged={() => toggleFolder(folder.id)}
            >
              <HStack spacing={10}>
                <FolderIconView icon={folder.icon} color={folder.color} />
                <Text>{folder.name}</Text>
              </HStack>
            </Toggle>
          ))}
        </Section>
      )}
    </Form>
  )
}
