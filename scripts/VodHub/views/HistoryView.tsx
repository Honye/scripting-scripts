import {
  NavigationLink,
  ScrollView,
  LazyVGrid,
  Text,
  VStack,
  useState,
  useEffect,
  Spacer,
  Button,
  Image
} from "scripting"
import { VideoGridItem } from "../components/VideoGridItem"
import { DetailView } from "./DetailView"
import { DB } from "../db"

export function HistoryView() {
  const [items, setItems] = useState<any[]>([])

  // Initial load and polling for updates
  useEffect(() => {
    let timer: number
    let ignore = false

    const poll = () => {
      const history = DB.getHistory()
      setItems(history)
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
      {items.length === 0 ? (
        <VStack spacing={16} padding={32} alignment="center">
          <Spacer />
          <Text foregroundStyle="secondaryLabel" font="title3">
            No history yet.
          </Text>
          <Spacer />
        </VStack>
      ) : (
        <ScrollView>
          <LazyVGrid columns={columns} padding={16} spacing={10}>
            {items.map(item => (
              <NavigationLink key={item.id} destination={<DetailView id={item.id} sourceId={item.source_id} />}>
                <VStack
                  spacing={4}
                  contextMenu={{
                    menuItems: (
                      <Button action={() => {
                        DB.removeHistory(item.id)
                        setItems(prev => prev.filter((i: any) => i.id !== item.id))
                      }}>
                        <Text>Delete</Text>
                        <Image systemName="trash" />
                      </Button>
                    )
                  }}
                >
                  <VideoGridItem item={item} />
                  <Text font="caption"  foregroundStyle="secondaryLabel" lineLimit={1}>
                    {item.episode_name}
                  </Text>
                  <Text font="caption2" foregroundStyle="tertiaryLabel">
                    {Math.floor(item.progress / 60)}m {Math.floor(item.progress % 60)}s
                  </Text>
                </VStack>
              </NavigationLink>
            ))}
          </LazyVGrid>
        </ScrollView>
      )}
    </VStack>
  )
}
