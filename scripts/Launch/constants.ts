import { Path, Script } from 'scripting'

export const BASE_PATH = Path.join(FileManager.appGroupDocumentsDirectory, Script.name)
export const FILE_PATH = Path.join(BASE_PATH, 'launcher_apps.json')
export const CONFIG_PATH = Path.join(BASE_PATH, 'launcher_config.json')

export interface AppItem {
  id: string
  name: string
  icon: string
  iconType?: 'symbol' | 'image'
  url: string
  color: string
}

export interface Config {
  shape: 'rounded' | 'circle'
  iconSize: number
  spacing: number
}

export const DEFAULT_CONFIG: Config = {
  shape: 'rounded',
  iconSize: 50,
  spacing: 15
}

export const DEFAULT_APPS: AppItem[] = [
  {
    id: '1',
    name: '微信',
    icon: 'message.fill',
    url: 'weixin://',
    color: '#07C160'
  },
  {
    id: '2',
    name: '支付宝',
    icon: 'yen.sign.circle.fill',
    url: 'alipay://',
    color: '#1677FF'
  },
  {
    id: '3',
    name: '设置',
    icon: 'gear',
    url: 'App-Prefs:root',
    color: '#8E8E93'
  },
  {
    id: '4',
    name: '扫一扫',
    icon: 'qrcode.viewfinder',
    url: 'weixin://scanqrcode',
    color: '#07C160'
  },
  {
    id: '5',
    name: '付款码',
    icon: 'barcode.viewfinder',
    url: 'alipayqr://platformapi/startapp?saId=10000007',
    color: '#1677FF'
  },
  {
    id: '6',
    name: '乘车码',
    icon: 'bus.fill',
    url: 'alipayqr://platformapi/startapp?saId=200011235',
    color: '#1677FF'
  },
  {
    id: '7',
    name: '日历',
    icon: 'calendar',
    url: 'calshow://',
    color: '#FF3B30'
  },
  {
    id: '8',
    name: '照片',
    icon: 'photo.fill',
    url: 'photos-redirect://',
    color: '#FF2D55'
  }
]
