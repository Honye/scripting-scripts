import { Device, Navigation, NavigationStack, Script, Tab, TabView, Text } from "scripting"
import { HomeView } from "./views/HomeView"
import { FavoritesView } from "./views/FavoritesView"
import SearchView from "./views/SearchView"
import { SettingsView } from "./views/SettingsView"

function App() {
  return (
    <TabView>
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
      <Tab title="" systemImage="magnifyingglass" role={parseFloat(Device.systemVersion) >= 18 ? 'search' : undefined}>
        <NavigationStack>
          <SearchView />
        </NavigationStack>
      </Tab>
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
