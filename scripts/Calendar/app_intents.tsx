import { AppIntentManager, AppIntentProtocol, Widget } from 'scripting'

export const ChangeWeekIntent = AppIntentManager.register({
  name: "ChangeWeekIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async (direction: 'prev' | 'next' | 'reset') => {
    if (direction === 'reset') {
      Storage.remove('weekOffset')
      Storage.remove('selectedDate')
    } else {
      const val = Storage.get<string>('weekOffset') || '0'
      let currentOffset = 0
      try {
        currentOffset = JSON.parse(val)
      } catch (e) {
        console.error(e)
      }
      const newOffset = currentOffset + (direction === 'next' ? 1 : -1)
      Storage.set('weekOffset', JSON.stringify(newOffset))
    }
    Widget.reloadAll()
  }
})

export const SelectDateIntent = AppIntentManager.register({
  name: "SelectDateIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async (date: string) => {
    Storage.set('selectedDate', date)
    Widget.reloadAll()
  }
})

