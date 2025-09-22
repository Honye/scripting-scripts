import { AppIntentManager, AppIntentProtocol, Widget } from 'scripting'

// Register an AppIntent with parameters
export const ToggleIntentWithParams = AppIntentManager.register({
  name: "ToggleIntentWithParams",
  protocol: AppIntentProtocol.AppIntent,
  perform: async (audioName: string) => {
    // Perform action based on the parameter
    console.log(`Toggling audio playback for: ${audioName}`)
    // Widget.reloadAll()
  }
})

export const IntentOpenSearch = AppIntentManager.register({
  name: 'IntentOpenSearch',
  protocol: AppIntentProtocol.AppIntent,
  perform: async (item: any) => {
    Widget.reloadAll()
    const [, queryString] = item.scheme.split('?')
    const query: Record<string, string> = {}
    queryString.split('&').forEach((item: string) => {
      const [key, value] = item.split('=')
      query[key] = value
    })
    const url = `https://m.weibo.cn/search?containerid=${encodeURIComponent('100103type=1&t=10&q=' + query.keyword)}`
    Safari.openURL(url)
  }
})
