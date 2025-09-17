import { HStack, Image, Spacer, Text, VStack, Widget, fetch } from 'scripting'

const preference = {
  fontSize: 14,
  gap: 8,
  logoSize: 30
}

function WidgetView({ list }: { list: any[] }) {
  const { fontSize, gap, logoSize } = preference
  const { height } = Widget.displaySize

  const count = Math.floor((height - 10 * 2 + gap) / (fontSize + gap))
  const logoLines = logoSize ? Math.ceil(logoSize / (fontSize + gap)) : 0
  const now = new Date()

  const getItemLink = (item: any) => {
    const [, queryString] = item.scheme.split('?')
    const query: Record<string, string> = {}
    queryString.split('&').forEach((item: string) => {
      const [key, value] = item.split('=')
      query[key] = value
    })
    return `https://m.weibo.cn/search?containerid=${encodeURIComponent('100103type=1&t=10&q=' + query.keyword)}`
  }

  return (
    <VStack padding={12} spacing={0}>
    {list.slice(0, count - logoLines).map((item, i) => (
      <HStack key={item.itemid} frame={{ height: fontSize + gap }} alignment='center' widgetURL={getItemLink(item)}>
        <Text
          font={fontSize}
          fontWeight='bold'
          foregroundStyle={item.pic_id > 3 ? '#f5c94c' : '#fe4f67'}
        >{item.pic_id}</Text>
        <Text
          font={fontSize}
          foregroundStyle='#333333'
        >{item.title}</Text>
        <Image imageUrl={item.icon} frame={{ width: 12, height: 12 }} resizable />
        <Spacer />
        {i === 0
          ? <HStack spacing={2}>
              <Image systemName='clock.arrow.circlepath' font={fontSize * 0.7} foregroundStyle='#666666' />
              <Text font={fontSize * 0.7} foregroundStyle='#666666'>{`${now.getHours()}`.padStart(2, '0')}:{`${now.getMinutes()}`.padStart(2, '0')}</Text>
            </HStack> 
          : null}
      </HStack>
    ))}
      <HStack alignment='bottom'>
        <VStack spacing={0}>
        {list.slice(count - logoLines, count).map((item, i) => (
          <HStack key={item.itemid} frame={{ height: fontSize + gap }} alignment='center'>
            <Text
              font={fontSize}
              fontWeight='bold'
              foregroundStyle={item.pic_id > 3 ? '#f5c94c' : '#fe4f67'}
            >{item.pic_id}</Text>
            <Text
              font={fontSize}
              foregroundStyle='#333333'
            >{item.title}</Text>
            <Image imageUrl={item.icon} frame={{ width: 12, height: 12 }} resizable />
            <Spacer />
          </HStack>
        ))}
        </VStack>
        <Image imageUrl='https://www.sinaimg.cn/blog/developer/wiki/LOGO_64x64.png' frame={{ width: logoSize, height: logoSize }} resizable />
      </HStack>
    </VStack>
  )
}

(async () => {
  const url = 'https://weibointl.api.weibo.cn/portal.php?ct=feed&a=search_topic'
  const { data } = await fetch(url).then((resp) => resp.json())
  Widget.present(<WidgetView list={data} />)
})()