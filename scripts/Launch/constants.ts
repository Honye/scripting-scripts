import { fetch, Path, Script } from 'scripting'
import type { DynamicImageSource } from 'scripting'

export const BASE_PATH = Path.join(
  FileManager.appGroupDocumentsDirectory,
  Script.name
)
export const FILE_PATH = Path.join(BASE_PATH, 'launcher_apps.json')
export const CONFIG_PATH = Path.join(BASE_PATH, 'launcher_config.json')
export const CACHE_PATH = Path.join(BASE_PATH, 'cache')
export const FOLDERS_PATH = Path.join(BASE_PATH, 'launcher_folders.json')
/** Directory holding the user-authored JS of "button" items, keyed by item id. */
export const BUTTONS_PATH = Path.join(BASE_PATH, 'buttons')
const APP_ICON_ASSETS_BASE_URL =
  'https://raw.githubusercontent.com/Honye/assets/main/AppIcons'

export function getButtonCodePath(id: string) {
  return Path.join(BUTTONS_PATH, `${id}.js`)
}

export function getIconCachePath(url: string) {
  if (!url) return ''
  const hash = Crypto.md5(Data.fromRawString(url)!).toHexString()
  return Path.join(CACHE_PATH, `${hash}.png`)
}

function appIconAssetUrl(bundleId: string, appearance: 'dark' | 'light') {
  return `${APP_ICON_ASSETS_BASE_URL}/${encodeURIComponent(bundleId)}/100x100-${appearance}.jpg`
}

/**
 * Finds the best icon from Honye/assets to use for an app's dark appearance.
 * A real dark variant wins; apps with only a light repository asset use that
 * as the fallback. Missing assets and network failures leave the field empty.
 */
export async function findRepositoryDarkIcon(
  bundleId: string
): Promise<string | undefined> {
  const id = bundleId.trim()
  if (!id) return

  for (const appearance of ['dark', 'light'] as const) {
    const url = appIconAssetUrl(id, appearance)
    try {
      const response = await fetch(url, { method: 'HEAD', timeout: 5 })
      if (response.ok) return url
    } catch (error) {
      console.error(`Failed to look up repository icon: ${url}`, error)
      return
    }
  }
}

/**
 * An `Image` source: either a local cache file or a remote URL, single or
 * light/dark. `Image` refuses to mix `filePath` and `imageUrl` in one
 * `DynamicImageSource`, so callers branch on `kind`.
 */
export interface ResolvedIcon {
  kind: 'file' | 'url'
  source: string | DynamicImageSource<string>
}

function cachedFile(icon: string) {
  const path = getIconCachePath(icon)
  return path && FileManager.existsSync(path) ? path : ''
}

/**
 * Resolves an item's icon, preferring the downloaded cache file over the
 * network URL. A dark icon only kicks in once both variants are available in
 * the same form; until then it falls back to the light icon alone, and the
 * next cache pass upgrades it to a pair.
 */
export function resolveIconSource(
  icon: string,
  iconDark?: string
): ResolvedIcon {
  const light = cachedFile(icon)
  const single: ResolvedIcon = light
    ? { kind: 'file', source: light }
    : { kind: 'url', source: icon }

  const dark = iconDark?.trim()
  if (!dark || dark === icon) return single

  const darkFile = cachedFile(dark)
  if (light && darkFile) {
    return { kind: 'file', source: { light, dark: darkFile } }
  }
  if (icon.startsWith('http') && dark.startsWith('http')) {
    return { kind: 'url', source: { light: icon, dark } }
  }
  return single
}

// Migrates legacy single-folder data (folderId) to the multi-folder format (folderIds).
export function migrateAppItem(
  item: AppItem & { folderId?: string }
): AppItem {
  const { folderId, ...rest } = item
  const folderIds = [...(rest.folderIds ?? [])]
  if (folderId && !folderIds.includes(folderId)) {
    folderIds.push(folderId)
  }
  return { ...rest, folderIds }
}

export interface AppItem {
  id: string
  name: string
  icon: string
  /**
   * Icon used in dark mode. Empty falls back to `icon`. Only meaningful for
   * the image-based `iconType`s.
   */
  iconDark?: string
  iconType?: 'symbol' | 'image' | 'transparent_image'
  mode?: 'url' | 'bundleId' | 'script'
  url: string
  bundleId?: string
  /**
   * For `mode === 'script'`: run the JS inside the widget extension when
   * tapped, instead of opening the Scripting app. Defaults to `true`.
   */
  runInWidget?: boolean
  color: string
  /** Folders this app belongs to (an app can be in multiple folders). */
  folderIds?: string[]
}

export interface FolderStyle {
  iconSize?: number
  shape?: 'rounded' | 'circle'
  cornerRadius?: number
  spacing?: number
  widgetAccentedRenderingMode?: Config['widgetAccentedRenderingMode']
}

export interface Folder {
  id: string
  name: string
  icon?: string
  /** Custom folder color (hex string). Falls back to system blue when unset. */
  color?: string
  style?: FolderStyle
}

export interface Config {
  shape: 'rounded' | 'circle'
  iconSize: number
  spacing: number
  widgetAccentedRenderingMode:
    | 'accented'
    | 'desaturated'
    | 'accentedDesaturated'
    | 'fullColor'
  cornerRadius?: number
}

export const DEFAULT_CONFIG: Config = {
  shape: 'rounded',
  iconSize: 50,
  spacing: 15,
  widgetAccentedRenderingMode: 'fullColor'
}

export const DEFAULT_APPS: AppItem[] = [
  {
    id: '1',
    name: 'Scripting',
    icon: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/44/19/69/441969d8-13c7-7234-01f4-2056b8e28a28/AppIcon-0-0-1x_U007epad-0-1-P3-85-220.png/100x100bb.jpg',
    iconType: 'image',
    mode: 'bundleId',
    url: '',
    bundleId: 'com.scripting.ios',
    color: '#1677FF'
  }
]
