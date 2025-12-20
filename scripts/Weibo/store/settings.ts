import { Color, useReducer, WidgetAccentedRenderingMode } from 'scripting'

export const enum Client {
  /** 网页版 */
  H5 = 'h5',
  /** 国际版 */
  International = 'international'
}

interface Settings {
  client: Client
  fontSize: number
  color: { light: Color, dark: Color }
  timeColor: { light: Color, dark: Color }
  gap: number
  logoSize: number
  background: { light: Color, dark: Color }
  renderingMode: WidgetAccentedRenderingMode
}

function initState(): Settings {
  const storedSettings = Storage.get<Settings>('settings')
  return {
    client: Client.International,
    fontSize: 14,
    color: { light: '#333333', dark: '#ffffff' },
    timeColor: { light: '#666666', dark: '#666666' },
    gap: 8,
    logoSize: 30,
    background: { light: '#ffffff', dark: '#242426' },
    renderingMode: 'accentedDesaturated',
    ...storedSettings
  }
}

function reducer(state: Settings, action: Settings) {
  return { ...state, ...action }
}

export function useSettings() {
  const [state, dispatch] = useReducer(reducer, initState())
  function setSettings(data: Partial<Settings>) {
    const newState = { ...state, ...data }
    Storage.set('settings', newState)
    dispatch(newState)
  }
  return [state, setSettings] as const
}
