import { Text, VStack, Image, ZStack } from 'scripting'
import { VideoItem } from '../models'

export function VideoGridItem({ item }: { item: VideoItem }) {
  return (
    <VStack alignment="leading" spacing={4}>
      <ZStack alignment="bottomTrailing">
        <Image
          imageUrl={item.pic}
          resizable
          aspectRatio={{ value: 5/7, contentMode: 'fill' }}
          clipShape={{ type: 'rect', cornerRadius: 5 }}
          frame={{ maxWidth: 'infinity' }}
        />
        <Text font="caption" foregroundStyle="white" padding={4}>
          {item.remarks}
        </Text>
      </ZStack>
      <Text lineLimit={1} font="subheadline" foregroundStyle="label">
        {item.name}
      </Text>
    </VStack>
  )
}
