import { AppIntentManager, AppIntentProtocol, Widget } from 'scripting'

export const OpenAppIntent = AppIntentManager.register({
  name: 'OpenAppIntent',
  protocol: AppIntentProtocol.AppIntent,
  perform: async (bundleId: string) => {
    Widget.openApp(bundleId)
  }
})
