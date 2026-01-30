import {
  NavigationLink,
  ScrollView,
  LazyVGrid,
  Text,
  VStack,
  useState,
  useEffect,
  ProgressView,
  Button
} from "scripting"
import { API } from "../api"
import { VideoItem } from "../models"
import { VideoGridItem } from "../components/VideoGridItem"
import { DetailView } from "./DetailView"

export default function SearchView() {
  const [searchText, setSearchText] = useState("")
  const [items, setItems] = useState<VideoItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    let ignore = false

    if (!searchText) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)

    // Reset list if page is 1
    if (page === 1) {
      setItems([])
      setHasMore(true)
    }

    API.getSearch(searchText, page)
      .then(res => {
        if (ignore) return
        if (page === 1) {
          setItems(res.list)
        } else {
          setItems(prev => [...prev, ...res.list])
        }
        setHasMore(page < res.pagecount)
      })
      .catch(e => {
        if (ignore) return
        console.error(e)
      })
      .finally(() => {
        if (ignore) return
        setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [searchText, page])

  const columns = [
    { size: { type: 'adaptive' as const, min: 90 }, spacing: 16 }
  ]

  return (
    <VStack
      searchable={{
        value: searchText,
        onChanged: (text) => {
          setSearchText(text)
          setPage(1)
        },
        prompt: "搜索"
      }}
    >
      <ScrollView>
        {items.length > 0 ? (
          <LazyVGrid columns={columns} padding={16} spacing={10}>
            {items.map(item => (
              <NavigationLink key={item.id} destination={<DetailView id={item.id} />}>
                <VideoGridItem item={item} />
              </NavigationLink>
            ))}
          </LazyVGrid>
        ) : (
          !loading && searchText ? (
            <Text
              foregroundStyle="secondaryLabel"
              padding
              frame={{ maxWidth: 'infinity', alignment: 'center' }}
            >
              No results found
            </Text>
          ) : null
        )}

        {loading && <ProgressView />}

        {!loading && hasMore && items.length > 0 && (
          <Button action={() => setPage(page + 1)} padding>
            <Text foregroundStyle="blue">Load More</Text>
          </Button>
        )}

        {!loading && !hasMore && items.length > 0 && (
           <Text foregroundStyle="secondaryLabel" padding>No more results</Text>
        )}
      </ScrollView>
    </VStack>
  )
}
