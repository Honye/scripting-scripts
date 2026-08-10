import { AppIntentManager, AppIntentProtocol, Script, Widget } from 'scripting'
import { runButtonById } from './buttonCode'

export const OpenAppIntent = AppIntentManager.register({
  name: 'OpenAppIntent',
  protocol: AppIntentProtocol.AppIntent,
  perform: async (bundleId: string) => {
    Widget.openApp(bundleId)
  }
})

export const RunButtonIntent = AppIntentManager.register({
  name: 'RunButtonIntent',
  protocol: AppIntentProtocol.AppIntent,
  perform: async (appId: string) => {
    try {
      await runButtonById(appId, { env: Script.env })
    } catch (e) {
      console.error(e)
    }
  }
})
