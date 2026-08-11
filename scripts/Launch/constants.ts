import { Path, Script } from 'scripting'

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

export function getButtonCodePath(id: string) {
  return Path.join(BUTTONS_PATH, `${id}.js`)
}

export function getIconCachePath(url: string) {
  if (!url) return ''
  const hash = Crypto.md5(Data.fromRawString(url)!).toHexString()
  return Path.join(CACHE_PATH, `${hash}.png`)
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
