import { Text, VStack, Image, ZStack, GeometryReader } from 'scripting'
import { VideoItem } from '../models'

export function VideoGridItem({ item }: { item: VideoItem }) {
  return (
    <VStack alignment="leading" spacing={4}>
      <ZStack alignment="bottomTrailing">
        <VStack
          frame={{ maxWidth: 'infinity' }}
          aspectRatio={{ value: 5/7, contentMode: 'fit' }}
          background='gray'
          clipShape={{ type: 'rect', cornerRadius: 5 }}
        >
          <GeometryReader>
            {({ size }) => (
              <Image
                imageUrl={item.pic}
                resizable
                scaleToFill
                frame={{ width: size.width }}
              />
            )}
          </GeometryReader>
        </VStack>
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
