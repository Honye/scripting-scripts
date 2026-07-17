import { AppIntentManager, AppIntentProtocol, Widget } from 'scripting'

/** 点击小组件右上角时间刷新 */
export const IntentRefresh = AppIntentManager.register({
  name: 'IntentRefresh',
  protocol: AppIntentProtocol.AppIntent,
  perform: async (_params: undefined) => {
    Widget.reloadAll()
  }
})
