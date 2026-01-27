import {
  NavigationLink,
  ScrollView,
  LazyVGrid,
  Text,
  VStack,
  HStack,
  Button,
  useState,
  useEffect,
  ProgressView,
  Picker
} from "scripting"
import { API, CATEGORIES } from "../api"
import { VideoItem, Category } from "../models"
import { VideoGridItem } from "../components/VideoGridItem"
import { DetailView } from "./DetailView"

export function HomeView() {
  const [selectedMainTab, setSelectedMainTab] = useState<Category>(CATEGORIES[0])
  const [selectedSubTabId, setSelectedSubTabId] = useState<number | string | undefined>(undefined)

  const [items, setItems] = useState<VideoItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Initialize subtab when main tab changes
  useEffect(() => {
    if (selectedMainTab.subtabs && selectedMainTab.subtabs.length > 0) {
      setSelectedSubTabId(selectedMainTab.subtabs[0].id)
    } else {
      setSelectedSubTabId(selectedMainTab.id)
    }
  }, [selectedMainTab])

  // Fetch data when tabs or page change
  useEffect(() => {
    // Reset list if page is 1
    if (page === 1) {
      setItems([])
      setHasMore(true)
    }
    fetchData()
  }, [selectedMainTab, selectedSubTabId, page])

  async function fetchData() {
    if (loading) return

    const typeId = selectedSubTabId
    const hours = selectedMainTab.hours
    if (!typeId && !hours) return

    setLoading(true)
    try {
      const res = await API.getList(typeId, page, hours)
      if (page === 1) {
        setItems(res.list)
      } else {
        setItems(prev => [...prev, ...res.list])
      }
      setHasMore(page < res.pagecount)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { size: { type: 'flexible' as const }, spacing: 16 },
    { size: { type: 'flexible' as const }, spacing: 16 },
    { size: { type: 'flexible' as const }, spacing: 16 }
  ]

  return (
    <VStack>
      {/* Category Tabs */}
      <Picker
        title="Category"
        value={selectedMainTab.name}
        onChanged={(name: string) => {
          const cat = CATEGORIES.find(c => c.name === name)
          if (cat) {
            setSelectedMainTab(cat)
            setPage(1)
          }
        }}
        pickerStyle="segmented"
      >
        {CATEGORIES.map(cat => (
          <Text key={cat.name} tag={cat.name}>
            {cat.name}
          </Text>
        ))}
      </Picker>

      {/* Sub Category Tabs */}
      {selectedMainTab.subtabs && (
        <ScrollView axes="horizontal" scrollIndicator="hidden">
          <HStack padding={8} spacing={12}>
            {selectedMainTab.subtabs.map(sub => (
              <Button
                key={sub.name}
                action={() => {
                  setSelectedSubTabId(sub.id)
                  setPage(1)
                }}
              >
                <Text
                   foregroundStyle={selectedSubTabId === sub.id ? "blue" : "secondaryLabel"}
                   font="subheadline"
                >
                  {sub.name}
                </Text>
              </Button>
            ))}
          </HStack>
        </ScrollView>
      )}

      {/* Video Grid */}
      <ScrollView>
        <LazyVGrid columns={columns} padding={16}>
          {items.map(item => (
            <NavigationLink key={item.id} destination={<DetailView id={item.id} />}>
              <VideoGridItem item={item} />
            </NavigationLink>
          ))}
        </LazyVGrid>

        {loading && <ProgressView />}

        {!loading && hasMore && (
          <Button action={() => setPage(page + 1)} padding>
            <Text foregroundStyle="blue">Load More</Text>
          </Button>
        )}

        {!loading && !hasMore && items.length > 0 && (
           <Text foregroundStyle="secondaryLabel" padding>No more videos</Text>
        )}
      </ScrollView>
    </VStack>
  )
}
