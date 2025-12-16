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
  CONFIG_PATH,
  DEFAULT_APPS,
  DEFAULT_CONFIG,
  FILE_PATH
} from './constants'

function AppEditor({
  item,
  onSave
}: {
  item?: AppItem
  onSave: (item: AppItem) => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [icon, setIcon] = useState(item?.icon ?? 'app')
  const [iconType, setIconType] = useState<'symbol' | 'image'>(
    item?.iconType ?? 'symbol'
  )
  const [color, setColor] = useState<Color>((item?.color ?? '#007AFF') as Color)
  const dismiss = Navigation.useDismiss()

  return (
    <Form navigationTitle={item ? 'Edit App' : 'Add App'}>
      <Section header={<Text>Basic Info</Text>}>
        <TextField title='Name' value={name} onChanged={setName} />
        <TextField title='URL Scheme' value={url} onChanged={setUrl} />
      </Section>

      <Section header={<Text>Appearance</Text>}>
          <Picker
            title='Icon Type'
            value={iconType}
            onChanged={(v: string) => setIconType(v as 'symbol' | 'image')}
          >
            <Text tag='symbol'>SF Symbol</Text>
            <Text tag='image'>Network Image</Text>
          </Picker>

        {iconType === 'symbol' ? (
          <HStack>
            <Text>Icon (SF Symbol)</Text>
            <TextField title='Icon' value={icon} onChanged={setIcon} />
            <Image systemName={icon} font={20} foregroundStyle={color} />
          </HStack>
        ) : (
          <HStack>
            <Text>Image URL</Text>
            <TextField title='URL' value={icon} onChanged={setIcon} />
            <ZStack
              frame={{ width: 20, height: 20 }}
              clipShape={{ type: 'rect', cornerRadius: 4 }}
            >
              <Image imageUrl={icon} resizable scaleToFill />
            </ZStack>
          </HStack>
        )}

        <ColorPicker value={color} onChanged={setColor}>
          <Text>Theme Color</Text>
        </ColorPicker>
      </Section>

      <Section>
        <Button
          title='Save'
          action={() => {
            onSave({
              id: item?.id ?? Math.random().toString(36).slice(2),
              name,
              url,
              icon,
              iconType,
              color: color as unknown as string
            })
            dismiss()
          }}
        />
      </Section>
    </Form>
  )
}

function App() {
  const apps = useObservable<AppItem[]>([])
  const [shape, setShape] = useState<'rounded' | 'circle'>(DEFAULT_CONFIG.shape)
  const [iconSize, setIconSize] = useState(DEFAULT_CONFIG.iconSize)
  const [spacing, setSpacing] = useState(DEFAULT_CONFIG.spacing)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data
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

      if (FileManager.existsSync(CONFIG_PATH)) {
        const config = JSON.parse(FileManager.readAsStringSync(CONFIG_PATH))
        setShape(config.shape)
        if (config.iconSize) setIconSize(config.iconSize)
        if (config.spacing !== undefined) setSpacing(config.spacing)
      }
    } catch (e) {
      console.error(e)
      apps.setValue(DEFAULT_APPS)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Persist apps data
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

  function saveConfig(s: 'rounded' | 'circle', i: number, sp: number) {
    const config = { shape: s, iconSize: i, spacing: sp }
    if (!FileManager.existsSync(BASE_PATH)) {
      FileManager.createDirectory(BASE_PATH)
    }
    FileManager.writeAsStringSync(CONFIG_PATH, JSON.stringify(config))
    Widget.reloadAll()
    setShape(s)
    setIconSize(i)
    setSpacing(sp)
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
  }


  return (
    <NavigationStack>
      <List
        navigationTitle='Launch'
        toolbar={{
          confirmationAction: [
            <EditButton />,
            <NavigationLink
              destination={
                <AppEditor
                  onSave={(item) => {
                    updateApp(item)
                  }}
                />
              }
            >
              <Image systemName='plus' />
            </NavigationLink>
          ]
        }}
      >
        <Section header={<Text>Settings</Text>}>
          <Picker
            title='Icon Shape'
            value={shape}
            onChanged={(v: string) =>
              saveConfig(v as 'rounded' | 'circle', iconSize, spacing)
            }
          >
            <Text tag='rounded'>Rounded Rectangle</Text>
            <Text tag='circle'>Circle</Text>
          </Picker>
          <Stepper
            onIncrement={() => {
              if (iconSize < 100) saveConfig(shape, iconSize + 1, spacing)
            }}
            onDecrement={() => {
              if (iconSize > 20) saveConfig(shape, iconSize - 1, spacing)
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
              if (spacing < 50) saveConfig(shape, iconSize, spacing + 1)
            }}
            onDecrement={() => {
              if (spacing > 0) saveConfig(shape, iconSize, spacing - 1)
            }}
          >
            <HStack>
              <Text>Spacing</Text>
              <Spacer />
              <Text opacity={0.5}>{spacing.toString()}</Text>
            </HStack>
          </Stepper>
        </Section>

        <Section header={<Text>Apps</Text>}>
          <ForEach
            data={apps}
            editActions='all'
            builder={(item) => (
              <NavigationLink
                key={item.id}
                destination={<AppEditor item={item} onSave={updateApp} />}
              >
                <HStack>
                  {item.iconType === 'image' ? (
                    <ZStack
                      frame={{ width: 24, height: 24 }}
                      clipShape={{ type: 'rect', cornerRadius: 6 }}
                    >
                      <Image imageUrl={item.icon} resizable scaleToFill />
                    </ZStack>
                  ) : (
                    <Image
                      systemName={item.icon}
                      foregroundStyle={item.color as Color}
                    />
                  )}
                  <VStack alignment='leading'>
                    <Text font={16}>{item.name}</Text>
                    <Text font={12} opacity={0.6} lineLimit={1}>
                      {item.url}
                    </Text>
                  </VStack>
                </HStack>
              </NavigationLink>
            )}
          />
        </Section>
        <Section>
          <Button
            title='Preview Widget'
            action={async () => {
              await Widget.preview({ family: 'systemMedium' })
            }}
          />
        </Section>
      </List>
    </NavigationStack>
  )
}

Navigation.present({
  element: <App />
}).finally(() => Script.exit())
