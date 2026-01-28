import {
  NavigationLink,
  ScrollView,
  LazyVGrid,
  Text,
  VStack,
  useState,
  useEffect,
  Spacer
} from "scripting"
import { VideoItem } from "../models"



import { VideoGridItem } from "../components/VideoGridItem"
import { DetailView } from "./DetailView"
import { DB } from "../db"

export function FavoritesView() {
  const [items, setItems] = useState<VideoItem[]>([])

  // Helper to refresh data
  const refresh = () => {
    const favs = DB.getFavorites()
    // Simple comparison to avoid unnecessary re-renders if deep comparison were cheap,
    // but here we just set it. React handles reference check.
    // To ensure UI updates when removing an item, we might need to be careful.
    // Since getFavorites returns new array reference, it will trigger update.
    setItems(favs)
  }

  // Initial load and polling for updates
  useEffect(() => {
    let timer: number
    let ignore = false

    const poll = () => {
      refresh()
      if (!ignore) {
        timer = setTimeout(poll, 1000)
      }
    }

    poll()

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [])

  const columns = [
    { size: { type: 'adaptive' as const, min: 90 }, spacing: 16 }
  ]

  return (
    <VStack>
      <Text font="largeTitle" bold padding={{ horizontal: 16, top: 16, bottom: 8 }}>Favorites</Text>

      {items.length === 0 ? (
        <VStack spacing={16} padding={32} alignment="center">
          <Spacer />
          <Text foregroundStyle="secondaryLabel" font="title3">
            No favorites yet.
          </Text>
          <Spacer />
        </VStack>
      ) : (
        <ScrollView>
          <LazyVGrid columns={columns} padding={16} spacing={10}>
            {items.map(item => (
              <NavigationLink key={item.id} destination={<DetailView id={item.id} />}>
                <VideoGridItem item={item} />
              </NavigationLink>
            ))}
          </LazyVGrid>
        </ScrollView>
      )}
    </VStack>
  )
}
