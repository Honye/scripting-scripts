import {
  Device,
  Label,
  Navigation,
  NavigationStack,
  Script,
  Tab,
  TabView
} from 'scripting'
import { HomeView } from './views/HomeView'
import { FavoritesView } from './views/FavoritesView'
import SearchView from './views/SearchView'
import { SettingsView } from './views/SettingsView'

function App() {
  return parseFloat(Device.systemVersion) >= 18 ? (
    <TabView tint="systemTeal" tabViewStyle="sidebarAdaptable">
      <Tab title="首页" systemImage="house">
        <NavigationStack>
          <HomeView />
        </NavigationStack>
      </Tab>
      <Tab title="收藏" systemImage="heart.fill">
        <NavigationStack>
          <FavoritesView />
        </NavigationStack>
      </Tab>
      <Tab title="设置" systemImage="gear">
        <NavigationStack>
          <SettingsView />
        </NavigationStack>
      </Tab>
      <Tab title="搜索" systemImage="magnifyingglass" role="search">
        <NavigationStack>
          <SearchView />
        </NavigationStack>
      </Tab>
    </TabView>
  ) : (
    <TabView tint="systemTeal" tabViewStyle="sidebarAdaptable">
      <NavigationStack tabItem={<Label title="首页" systemImage="house" />}>
        <HomeView />
      </NavigationStack>
      <NavigationStack tabItem={<Label title="收藏" systemImage="heart.fill" />}>
        <FavoritesView />
      </NavigationStack>
      <NavigationStack tabItem={<Label title="设置" systemImage="gear" />}>
        <SettingsView />
      </NavigationStack>
      <NavigationStack
        tabItem={<Label title="搜索" systemImage="magnifyingglass" />}
      >
        <SearchView />
      </NavigationStack>
    </TabView>
  )
}

Navigation.present({
  element: <App />
})
  .then(() => Script.exit())
  .catch((err) => {
    console.error(err)
    Script.exit()
  })
