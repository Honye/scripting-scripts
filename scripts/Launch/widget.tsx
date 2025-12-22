import {
  Color,
  HStack,
  Image,
  Link,
  RoundedRectangle,
  Spacer,
  VStack,
  ZStack,
  Widget,
  EnvironmentValuesReader
} from 'scripting'
import {
  AppItem,
  CONFIG_PATH,
  Config,
  DEFAULT_APPS,
  DEFAULT_CONFIG,
  FILE_PATH,
  getIconCachePath
} from './constants'

function AppIcon({ item, config }: { item: AppItem; config?: Config }) {
  const size = config?.iconSize || DEFAULT_CONFIG.iconSize
  const radius = config?.shape === 'circle' ? size / 2 : size * 0.225
  return (
    <Link url={item.url} buttonStyle='plain'>
      <ZStack>
        {item.iconType === 'image' ? (
          <ZStack
            frame={{ width: size, height: size }}
            clipShape={{
              type: 'rect',
              cornerRadius: radius
            }}
          >
            {(() => {
              const cachePath = getIconCachePath(item.icon)
              if (FileManager.existsSync(cachePath)) {
                return (
                  <Image
                    filePath={cachePath}
                    resizable
                    scaleToFill
                    widgetAccentedRenderingMode={
                      config?.widgetAccentedRenderingMode ||
                      DEFAULT_CONFIG.widgetAccentedRenderingMode
                    }
                  />
                )
              }
              return (
                <Image
                  imageUrl={item.icon}
                  resizable
                  scaleToFill
                  widgetAccentedRenderingMode={
                    config?.widgetAccentedRenderingMode ||
                    DEFAULT_CONFIG.widgetAccentedRenderingMode
                  }
                />
              )
            })()}
          </ZStack>
        ) : (
          <Fragment>
            <EnvironmentValuesReader keys={['widgetRenderingMode']}>
              {({ widgetRenderingMode }) => (
                <RoundedRectangle
                  frame={{ width: size, height: size }}
                  fill={item.color as Color}
                  cornerRadius={radius}
                  opacity={widgetRenderingMode === 'accented' ? 0.2 : 1}
                />
              )}
            </EnvironmentValuesReader>
            <Image
              systemName={item.icon}
              foregroundStyle='white'
              font={size * 0.5}
              widgetAccentable
            />
          </Fragment>
        )}
      </ZStack>
    </Link>
  )
}

export function LauncherWidget({
  apps: propApps,
  config: propConfig
}: {
  apps?: AppItem[]
  config?: Config
}) {
  let apps = propApps
  let config = propConfig

  if (!apps || !config) {
    try {
      if (!apps && FileManager.existsSync(FILE_PATH)) {
        const str = FileManager.readAsStringSync(FILE_PATH)
        apps = JSON.parse(str)
      }
      if (!config && FileManager.existsSync(CONFIG_PATH)) {
        const str = FileManager.readAsStringSync(CONFIG_PATH)
        config = JSON.parse(str)
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (!apps) {
    apps = DEFAULT_APPS
  }

  if (!propConfig) {
    if (FileManager.existsSync(CONFIG_PATH)) {
      const configJson = JSON.parse(FileManager.readAsStringSync(CONFIG_PATH))
      config = {
        ...config,
        ...configJson
      }
    }
  }

  const iconSize = config?.iconSize || DEFAULT_CONFIG.iconSize
  const preferredSpacing =
    config?.spacing !== undefined ? config.spacing : DEFAULT_CONFIG.spacing

  const totalWidth = Widget.displaySize.width
  const totalHeight = Widget.displaySize.height

  const columns = Math.max(
    1,
    Math.floor((totalWidth - preferredSpacing) / (iconSize + preferredSpacing))
  )
  const actualSpacing = (totalWidth - columns * iconSize) / (columns + 1)

  const rowCount = Math.max(
    1,
    Math.floor(
      (totalHeight - 32 + preferredSpacing) / (iconSize + preferredSpacing)
    )
  )
  const maxItems = columns * rowCount
  const displayApps = apps.slice(0, maxItems)

  const rows: AppItem[][] = []
  for (let i = 0; i < displayApps.length; i += columns) {
    rows.push(displayApps.slice(i, i + columns))
  }

  return (
    <VStack
      padding={{
        leading: actualSpacing,
        trailing: actualSpacing,
        top: 16,
        bottom: 16
      }}
      spacing={preferredSpacing}
      alignment='leading'
    >
      <Spacer />
      {rows.map((row, rowIndex) => (
        <HStack key={rowIndex} spacing={actualSpacing}>
          {row.map((item) => (
            <AppIcon key={item.id} item={item} config={config} />
          ))}
        </HStack>
      ))}
      <Spacer />
    </VStack>
  )
}

Widget.present(<LauncherWidget />)
