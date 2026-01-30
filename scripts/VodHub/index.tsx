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
    <TabView tint="systemTeal">
      <Tab title="" systemImage="house">
        <NavigationStack>
          <HomeView />
        </NavigationStack>
      </Tab>
      <Tab title="" systemImage="heart.fill">
        <NavigationStack>
          <FavoritesView />
        </NavigationStack>
      </Tab>
      <Tab title="" systemImage="gear">
        <NavigationStack>
          <SettingsView />
        </NavigationStack>
      </Tab>
      <Tab title="" systemImage="magnifyingglass" role="search">
        <NavigationStack>
          <SearchView />
        </NavigationStack>
      </Tab>
    </TabView>
  ) : (
    <TabView tint="systemTeal">
      <NavigationStack tabItem={<Label title="" systemImage="house" />}>
        <HomeView />
      </NavigationStack>
      <NavigationStack tabItem={<Label title="" systemImage="heart.fill" />}>
        <FavoritesView />
      </NavigationStack>
      <NavigationStack tabItem={<Label title="" systemImage="gear" />}>
        <SettingsView />
      </NavigationStack>
      <NavigationStack
        tabItem={<Label title="" systemImage="magnifyingglass" />}
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
