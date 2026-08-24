import {
  Button,
  HStack,
  Link,
  Rectangle,
  Script,
  Spacer,
  VStack,
  VirtualNode,
  ZStack,
  Widget
} from 'scripting'
import {
  AppItem,
  CONFIG_PATH,
  Config,
  DEFAULT_APPS,
  DEFAULT_CONFIG,
  FILE_PATH,
  FOLDERS_PATH,
  Folder,
  FolderStyle,
  migrateAppItem
} from './constants'
import { AppIconArtwork } from './components/AppIconArtwork'
import { OpenAppIntent, RunButtonIntent } from './app_intents'

function AppIcon({ item, config }: { item: AppItem; config?: Config }) {
  const size = config?.iconSize || DEFAULT_CONFIG.iconSize
  const useBundleId = item.mode === 'bundleId' && !!item.bundleId
  const accentedRenderingMode =
    config?.widgetAccentedRenderingMode ||
    DEFAULT_CONFIG.widgetAccentedRenderingMode
  const iconContent = <AppIconArtwork item={item} config={config} />

  // SwiftUI bug: an `Image` using the `desaturated` / `accentedDesaturated`
  // accented rendering modes swallows taps when it is the label of a `Link` or
  // an intent `Button`, so the tap falls through to the widget itself and just
  // opens Scripting. Work around it by keeping the icon out of the tappable
  // view and overlaying a clear hit target that carries the link/intent.
  const needsOverlayHitTarget =
    accentedRenderingMode === 'desaturated' ||
    accentedRenderingMode === 'accentedDesaturated'

  const tappable = (wrap: (content: VirtualNode) => VirtualNode) =>
    needsOverlayHitTarget ? (
      <ZStack frame={{ width: size, height: size }}>
        {iconContent}
        {wrap(<Rectangle fill="clear" frame={{ width: size, height: size }} />)}
      </ZStack>
    ) : (
      wrap(iconContent)
    )

  if (item.mode === 'script') {
    // `runInWidget` defaults to true: run the code in place, without leaving
    // the Home Screen.
    return item.runInWidget !== false
      ? tappable(content => (
          <Button intent={RunButtonIntent(item.id)} buttonStyle="plain">
            {content}
          </Button>
        ))
      : tappable(content => (
          <Link
            url={Script.createRunSingleURLScheme(Script.name, {
              buttonId: item.id
            })}
            buttonStyle="plain"
          >
            {content}
          </Link>
        ))
  }

  if (useBundleId) {
    return tappable(content => (
      <Button intent={OpenAppIntent(item.bundleId!)} buttonStyle="plain">
        {content}
      </Button>
    ))
  }

  return tappable(content => (
    <Link url={item.url} buttonStyle="plain">
      {content}
    </Link>
  ))
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

  let folderStyle: FolderStyle | undefined
  const folderParam = Widget.parameter?.trim()
  if (folderParam) {
    try {
      const foldersData: Folder[] = FileManager.existsSync(FOLDERS_PATH)
        ? JSON.parse(FileManager.readAsStringSync(FOLDERS_PATH))
        : []
      const folder = foldersData.find(f => f.name === folderParam)
      folderStyle = folder?.style
      apps = folder
        ? apps.filter(a =>
            migrateAppItem(a).folderIds?.includes(folder.id)
          )
        : []
    } catch (e) {
      console.error(e)
    }
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

  if (folderStyle) {
    const base: Config = config ?? {
      shape: DEFAULT_CONFIG.shape,
      iconSize: DEFAULT_CONFIG.iconSize,
      spacing: DEFAULT_CONFIG.spacing,
      widgetAccentedRenderingMode: DEFAULT_CONFIG.widgetAccentedRenderingMode
    }
    config = {
      ...base,
      iconSize: folderStyle.iconSize ?? base.iconSize,
      shape: folderStyle.shape ?? base.shape,
      cornerRadius: folderStyle.cornerRadius ?? base.cornerRadius,
      spacing: folderStyle.spacing ?? base.spacing,
      widgetAccentedRenderingMode:
        folderStyle.widgetAccentedRenderingMode ?? base.widgetAccentedRenderingMode
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
      alignment="leading"
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
