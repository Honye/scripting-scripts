import {
  Button,
  DynamicShapeStyle,
  HStack,
  Image,
  Link,
  Spacer,
  Text,
  VStack,
  Widget,
  fetch,
  useCallback,
  useMemo,
} from 'scripting'
import { IntentOpenSearch } from './app_intents'
import { Client, useSettings } from './store/settings'

const preference = {
  gap: 8,
  logoSize: 30,
}

function WidgetView({ list }: { list: any[] }) {
  const [settings] = useSettings()
  const { gap, logoSize } = preference
  const { height } = Widget.displaySize
  const color: DynamicShapeStyle = { light: '#333333', dark: '#ffffff' }

  const count = Math.floor((height - 10 * 2 + gap) / (settings.fontSize + gap))
  const logoLines = logoSize
    ? Math.ceil(logoSize / (settings.fontSize + gap))
    : 0
  const now = new Date()

  const getItemLink = useCallback((item: any) => {
    const [, queryString] = item.scheme.split('?')
    const query: Record<string, string> = {}
    queryString.split('&').forEach((item: string) => {
      const [key, value] = item.split('=')
      query[key] = value
    })
    if (settings.client === Client.International) {
      return `weibointernational://search?keyword=${encodeURIComponent(query.keyword)}`
    }
    return `https://m.weibo.cn/search?containerid=${encodeURIComponent('100103type=1&t=10&q=' + query.keyword)}`
  }, [])

  const hotSearchLink = useMemo(() => {
    if (settings.client === Client.International) {
      return 'weibointernational://hotsearch'
    }
    return `https://m.weibo.cn/p/index?containerid=${encodeURIComponent('106003&filter_type=realtimehot')}`
  }, [settings.client])

  return (
    <VStack padding={12} spacing={0}>
      {list.slice(0, count - logoLines).map((item, i) => (
        <Link key={item.itemid} buttonStyle='plain' url={getItemLink(item)}>
          <HStack alignment='top'>
            <HStack
              key={item.itemid}
              frame={{ height: settings.fontSize + gap }}
              alignment='center'
            >
              <Text
                font={settings.fontSize}
                fontWeight='bold'
                foregroundStyle={item.pic_id > 3 ? '#f5c94c' : '#fe4f67'}
              >
                {item.pic_id}
              </Text>
              <Text font={settings.fontSize} foregroundStyle={color}>
                {item.title}
              </Text>
              <Image
                imageUrl={item.icon}
                frame={{ width: 12, height: 12 }}
                resizable
              />
              <Spacer />
            </HStack>
            {i === 0 ? (
              <Button buttonStyle='plain' intent={IntentOpenSearch(item)}>
                <HStack spacing={2}>
                  <Image
                    systemName='clock.arrow.circlepath'
                    font={settings.fontSize * 0.7}
                    foregroundStyle='#666666'
                  />
                  <Text
                    font={settings.fontSize * 0.7}
                    foregroundStyle='#666666'
                  >
                    {`${now.getHours()}`.padStart(2, '0')}:
                    {`${now.getMinutes()}`.padStart(2, '0')}
                  </Text>
                </HStack>
              </Button>
            ) : null}
          </HStack>
        </Link>
      ))}
      <HStack alignment='bottom'>
        <VStack spacing={0}>
          {list.slice(count - logoLines, count).map((item, i) => (
            <Link key={item.itemid} buttonStyle='plain' url={getItemLink(item)}>
              <HStack
                key={item.itemid}
                frame={{ height: settings.fontSize + gap }}
                alignment='center'
              >
                <Text
                  font={settings.fontSize}
                  fontWeight='bold'
                  foregroundStyle={item.pic_id > 3 ? '#f5c94c' : '#fe4f67'}
                >
                  {item.pic_id}
                </Text>
                <Text font={settings.fontSize} foregroundStyle={color}>
                  {item.title}
                </Text>
                <Image
                  imageUrl={item.icon}
                  frame={{ width: 12, height: 12 }}
                  resizable
                />
                <Spacer />
              </HStack>
            </Link>
          ))}
        </VStack>
        <Link url={hotSearchLink}>
          <Image
            imageUrl='https://www.sinaimg.cn/blog/developer/wiki/LOGO_64x64.png'
            frame={{ width: logoSize, height: logoSize }}
            resizable
          />
        </Link>
      </HStack>
    </VStack>
  )
}

;(async () => {
  const url = 'https://weibointl.api.weibo.cn/portal.php?ct=feed&a=search_topic'
  const { data } = await fetch(url).then((resp) => resp.json())
  Widget.present(<WidgetView list={data} />)
})()
