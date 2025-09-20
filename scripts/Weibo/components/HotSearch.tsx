import { HStack, Image, Spacer, Text } from 'scripting'
import { Weibo } from '../apis/weibo'

export default function HotSearch({ data }: { data: Weibo.HotSearchItem }) {
  return (
    <HStack frame={{ maxWidth: 'infinity' }} alignment='center'>
      <Text
        fontWeight='bold'
        foregroundStyle={data.pic_id > 3 ? '#f5c94c' : '#fe4f67'}
      >{ data.pic_id }</Text>
      <Text>{ data.title }</Text>
      <Image imageUrl={data.icon} frame={{ width: 12, height: 12 }} resizable />
      <Spacer />
    </HStack>
  )
}
