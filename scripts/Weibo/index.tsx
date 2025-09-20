import {
  Navigation, Script,
  NavigationStack, Button, List, useCallback, useEffect, useState,
  NavigationLink,
  Image
} from "scripting"
import { fetchHotSearch, Weibo } from "./apis/weibo"
import HotSearch from "./components/HotSearch"
import Settings from './pages/Settings'
import Search from "./pages/Search"

function View() {
  const dismiss = Navigation.useDismiss()
  const [searches, setSearches] = useState<Weibo.HotSearchItem[]>([])
  const setSearchesAsync = useCallback(async () => {
    const data = await fetchHotSearch()
    console.log(data)
    setSearches(data)
  }, [])

  const getItemURL = (item: Weibo.HotSearchItem) => {
    const [, queryString] = item.scheme.split('?')
    const query: Record<string, string> = {}
    queryString.split('&').forEach((item: string) => {
      const [key, value] = item.split('=')
      query[key] = value
    })
    const url = `https://m.weibo.cn/search?containerid=${encodeURIComponent('100103type=1&t=10&q=' + query.keyword)}`
    return url
  }

  const onItemTap = (item: Weibo.HotSearchItem) => {
    Safari.present(getItemURL(item), false)
  }

  useEffect(() => {
    setSearchesAsync()
  }, [])

  return (
    <NavigationStack>
      <List
        navigationTitle="微博"
        toolbar={{
          topBarTrailing: [
            <Button title='关闭' action={dismiss} />,
            <NavigationLink destination={<Settings />}>
              <Image systemName='gearshape.fill' />
            </NavigationLink>
          ]
        }}
        refreshable={setSearchesAsync}
      >
        {searches.map((item) => (
          <NavigationLink
            destination={<Search url={getItemURL(item)} />}
          >
            <HotSearch key={item.pic_id} data={item} />
          </NavigationLink>
        ))}
      </List>
    </NavigationStack>
  )
}

const run = async () => {
  await Navigation.present({
    element: <View />,
    modalPresentationStyle: "fullScreen"
  })
  Script.exit()
}

run()
