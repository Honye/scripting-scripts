import { useReducer } from "scripting"

export const enum Client {
  /** 网页版 */
  H5 = 'h5',
  /** 国际版 */
  International = 'international'
}

interface Settings {
  client: Client
}

function initState(): Settings {
  const storedSettings = Storage.get<Settings>('settings')
  return {
    client: Client.International,
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
