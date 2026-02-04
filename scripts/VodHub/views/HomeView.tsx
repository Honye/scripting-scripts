import {
  NavigationLink,
  ScrollView,
  LazyVGrid,
  LazyVStack,
  Section,
  Text,
  VStack,
  HStack,
  Button,
  useState,
  useEffect,
  ProgressView,
  Picker,
  Image,
  GridItem,
  useCallback
} from 'scripting'
import { API, CATEGORIES } from '../api'
import { VideoItem, Category } from '../models'
import { VideoGridItem } from '../components/VideoGridItem'
import { DetailView } from './DetailView'
import { HistoryView } from './HistoryView'

export function HomeView() {
  const [selectedMainTab, setSelectedMainTab] = useState<Category>(
    CATEGORIES[0]
  )
  const [selectedSubTabId, setSelectedSubTabId] = useState<
    number | string | undefined
  >(undefined)

  const [items, setItems] = useState<VideoItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Initialize subtab when main tab changes
  useEffect(() => {
    // 切换主分类时重置状态
    setItems([])
    setPage(1)
    setHasMore(true)

    if (selectedMainTab.subtabs && selectedMainTab.subtabs.length > 0) {
      setSelectedSubTabId(selectedMainTab.subtabs[0].id)
    } else {
      setSelectedSubTabId(selectedMainTab.id)
    }
  }, [selectedMainTab])

  // Fetch data when tabs, page, or search text change
  useEffect(() => {
    let ignore = false

    // Reset list if page is 1
    if (page === 1) {
      setItems([])
      setHasMore(true)
    }

    setLoading(true)

    const promise = API.getList(selectedSubTabId, page, selectedMainTab.hours)

    if (!selectedSubTabId && !selectedMainTab.hours) {
      setLoading(false)
      return
    }

    promise
      .then((res) => {
        if (ignore) return
        if (page === 1) {
          setItems(res.list)
        } else {
          setItems((prev) => [...prev, ...res.list])
        }
        setHasMore(page < res.pagecount)
      })
      .catch((e) => {
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
  }, [selectedMainTab, selectedSubTabId, page])

  const columns: GridItem[] = [
    { size: { type: 'adaptive', min: 90 }, spacing: 16 }
  ]

  // 渲染主分类选择器放到导航栏
  const renderCategoryToolbar = () => (
    <Picker
      title=""
      value={selectedMainTab.name}
      onChanged={(name: string) => {
        const cat = CATEGORIES.find((c) => c.name === name)
        if (cat) {
          setSelectedMainTab(cat)
          setPage(1)
        }
      }}
      pickerStyle="segmented"
    >
      {CATEGORIES.map((cat) => (
        <Text key={cat.name} tag={cat.name}>
          {cat.name}
        </Text>
      ))}
    </Picker>
  )

  // 渲染子分类标签（显示在内容区域顶部）
  const renderSubCategoryTabs = () => (
    <HStack padding={{ horizontal: true }}>
      <ScrollView
        axes="horizontal"
        scrollIndicator="hidden"
        glassEffect={parseFloat(Device.systemVersion) >= 26}
        background={
          parseFloat(Device.systemVersion) >= 26
            ? undefined
            : {
                style: 'thinMaterial',
                shape: { type: 'rect', cornerRadius: 12 }
              }
        }
      >
        <HStack padding={8} spacing={12}>
          {selectedMainTab.subtabs?.map((sub) => (
            <Button
              key={sub.name}
              action={() => {
                setItems([])
                setSelectedSubTabId(sub.id)
                setPage(1)
                setHasMore(true)
              }}
            >
              <Text
                foregroundStyle={
                  selectedSubTabId === sub.id ? 'systemTeal' : 'secondaryLabel'
                }
                font="subheadline"
              >
                {sub.name}
              </Text>
            </Button>
          ))}
        </HStack>
      </ScrollView>
    </HStack>
  )

  const loadmore = useCallback(() => {
    !loading && setPage(page + 1)
  }, [loading, page])

  return (
    <VStack
      toolbarTitleDisplayMode="inline"
      toolbar={{
        principal: renderCategoryToolbar(),
        topBarTrailing: (
          <NavigationLink destination={<HistoryView />}>
            <Image systemName="clock.fill" />
          </NavigationLink>
        )
      }}
    >
      <ScrollView>
        {items.length > 0 ? (
          <LazyVStack pinnedViews="sectionHeaders">
            <Section
              header={selectedMainTab.subtabs && renderSubCategoryTabs()}
            >
              <LazyVGrid columns={columns} padding={16} spacing={10}>
                {items.map((item) => (
                  <NavigationLink
                    key={item.id}
                    destination={<DetailView id={item.id} />}
                  >
                    <VideoGridItem item={item} />
                  </NavigationLink>
                ))}
              </LazyVGrid>
              {/* 自动加载下一页 */}
              {hasMore && (
                <ProgressView
                  padding
                  onAppear={loadmore}
                />
              )}
              {!loading && !hasMore && items.length > 0 && (
                <Text foregroundStyle="secondaryLabel" padding>
                  No more videos
                </Text>
              )}
            </Section>
          </LazyVStack>
        ) : (
          <VStack>
            <Section
              header={selectedMainTab.subtabs && renderSubCategoryTabs()}
            >
              {loading && <ProgressView />}
            </Section>
          </VStack>
        )}
      </ScrollView>
    </VStack>
  )
}
