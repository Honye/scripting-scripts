import { Label, Navigation, NavigationStack, Script, TabView } from 'scripting'
import { DiscoverView } from './views/Discover'
import { LibraryView } from './views/Library'
import { SearchView } from './views/Search'
import { SettingsView } from './views/Settings'
import { errorMessage } from './parse'
import { theme } from './theme'
import { verifyMediaEngine } from './tests/device_verify'

function App() {
  return (
    <TabView tint={theme.accent}>
      <NavigationStack tabItem={<Label title="发现" systemImage="play.rectangle" />}><DiscoverView /></NavigationStack>
      <NavigationStack tabItem={<Label title="搜索" systemImage="magnifyingglass" />}><SearchView /></NavigationStack>
      <NavigationStack tabItem={<Label title="追剧" systemImage="heart" />}><LibraryView /></NavigationStack>
      <NavigationStack tabItem={<Label title="设置" systemImage="gearshape" />}><SettingsView /></NavigationStack>
    </TabView>
  )
}

async function main() {
  try {
    if (Script.queryParameters.verifyMedia === '1') {
      await Dialog.alert(await verifyMediaEngine())
      return
    }
    await Navigation.present({ element: <App /> })
  } catch (error) {
    await Dialog.alert(errorMessage(error))
  } finally {
    Script.exit()
  }
}

void main()
