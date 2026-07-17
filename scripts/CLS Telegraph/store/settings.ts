import { Color, Widget, useReducer } from 'scripting'

export interface Settings {
  fontSize: number
  textColor: { light: Color; dark: Color }
  timeColor: { light: Color; dark: Color }
  background: { light: Color; dark: Color }
  lineLimit: number
  gap: number
  /** 正则过滤排除 */
  exclude: string
}

export function getSettings(): Settings {
  const storedSettings = Storage.get<Settings>('settings')
  return {
    fontSize: 12,
    textColor: { light: '#232323', dark: '#ffffff' },
    timeColor: { light: '#707070', dark: '#c2c2c2' },
    background: { light: '#ffffff', dark: '#242426' },
    lineLimit: 2,
    gap: 4,
    exclude: '',
    ...storedSettings
  }
}

function reducer(state: Settings, action: Settings) {
  return { ...state, ...action }
}

export function useSettings() {
  const [state, dispatch] = useReducer(reducer, getSettings())
  function setSettings(data: Partial<Settings>) {
    const newState = { ...state, ...data }
    Storage.set('settings', newState)
    Widget.reloadAll()
    dispatch(newState)
  }
  return [state, setSettings] as const
}
