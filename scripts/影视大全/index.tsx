import { Navigation, NavigationStack, Script } from "scripting"
import { HomeView } from "./views/HomeView"

function App() {
  return (
    <NavigationStack>
      <HomeView />
    </NavigationStack>
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
