import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationLink,
  NavigationStack,
  Script,
  Text,
  VStack,
  useCallback,
  useEffect,
  useState
} from 'scripting'
import { TelegraphItem, fetchTelegraph, formatTime } from './apis/cls'
import Detail from './pages/Detail'
import Settings from './pages/Settings'

const IMPORTANT_COLOR = '#e62429'

function TelegraphRow({ item }: { item: TelegraphItem }) {
  return (
    <VStack alignment='leading' spacing={4}>
      <Text font={13} foregroundStyle='secondaryLabel'>
        {formatTime(item.time)}
      </Text>
      <Text
        font={15}
        fontWeight='medium'
        foregroundStyle={item.isImportant ? IMPORTANT_COLOR : 'label'}
      >
        {item.title || item.content}
      </Text>
      {item.title ? (
        <Text font={13} foregroundStyle='secondaryLabel' lineLimit={2}>
          {item.content}
        </Text>
      ) : null}
    </VStack>
  )
}

function View() {
  const dismiss = Navigation.useDismiss()
  const [items, setItems] = useState<TelegraphItem[]>([])
  const loadItems = useCallback(async () => {
    const data = await fetchTelegraph(50)
    setItems(data)
  }, [])

  useEffect(() => {
    loadItems()
  }, [])

  return (
    <NavigationStack>
      <List
        navigationTitle='财联社电报'
        toolbar={{
          topBarTrailing: [
            <Button title='关闭' action={dismiss} />,
            <NavigationLink destination={<Settings />}>
              <Image systemName='gearshape.fill' />
            </NavigationLink>
          ]
        }}
        refreshable={loadItems}
      >
        {items.map((item) => (
          <NavigationLink key={item.id} destination={<Detail url={item.url} />}>
            <TelegraphRow item={item} />
          </NavigationLink>
        ))}
      </List>
    </NavigationStack>
  )
}

const run = async () => {
  await Navigation.present({
    element: <View />,
    modalPresentationStyle: 'fullScreen'
  })
  Script.exit()
}

run()
