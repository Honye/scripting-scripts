import {
  Navigation,
  NavigationStack,
  Script,
  Tab,
  TabView,
  VStack,
  useEffect,
  useState
} from 'scripting'
import type { Show } from './types'
import { theme } from './theme'
import { loadShows, saveShows } from './store'
import { HomeView } from './views/Home'
import { AllShowsView } from './views/AllShows'
import { AddShowView } from './views/AddShow'
import { DetailView } from './views/Detail'

function App() {
  const [shows, setShows] = useState<Show[]>(() => loadShows())
  const [showAdd, setShowAdd] = useState(false)
  const [addNonce, setAddNonce] = useState(0)
  const [detailId, setDetailId] = useState<number | null>(null)

  const openAdd = () => {
    setAddNonce((n) => n + 1)
    setShowAdd(true)
  }

  useEffect(() => {
    saveShows(shows)
  }, [shows])

  const detailShow =
    detailId != null ? shows.find((s) => s.id === detailId) ?? null : null

  const handleAdd = (show: Show) => setShows([...shows, show])
  const handleSaveDetail = (id: number, watched: number, total: number) => {
    setShows(
      shows.map((s) =>
        s.id === id ? { ...s, watchedEps: watched, totalEps: total } : s
      )
    )
  }
  const handleDelete = (id: number) => {
    setShows(shows.filter((s) => s.id !== id))
    setDetailId(null)
  }

  return (
    <VStack
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      background={theme.bg}
      tint={theme.brandEnd}
      sheet={[
        {
          isPresented: showAdd,
          onChanged: setShowAdd,
          content: showAdd ? (
            <VStack
              frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
              background={theme.bg}
              presentationDragIndicator="visible"
            >
              <AddShowView
                key={addNonce}
                onClose={() => setShowAdd(false)}
                onAdd={handleAdd}
              />
            </VStack>
          ) : (
            <VStack />
          )
        },
        {
          isPresented: detailShow != null,
          onChanged: (open) => {
            if (!open) setDetailId(null)
          },
          content: detailShow ? (
            <VStack
              frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
              background={theme.surface}
              presentationDragIndicator="visible"
              presentationDetents={['medium', 'large']}
            >
              <DetailView
                show={detailShow}
                onClose={() => setDetailId(null)}
                onSave={handleSaveDetail}
                onDelete={handleDelete}
              />
            </VStack>
          ) : (
            <VStack />
          )
        }
      ]}
    >
      <TabView>
        <Tab title="日历" systemImage="calendar">
          <NavigationStack>
            <HomeView
              shows={shows}
              onAddPress={openAdd}
              onShowDetail={(s) => setDetailId(s.id)}
            />
          </NavigationStack>
        </Tab>
        <Tab title="追剧" systemImage="list.bullet">
          <NavigationStack>
            <AllShowsView
              shows={shows}
              onShowDetail={(s) => setDetailId(s.id)}
            />
          </NavigationStack>
        </Tab>
      </TabView>
    </VStack>
  )
}

async function main() {
  await Navigation.present({ element: <App /> })
  Script.exit()
}

main()
