import { Text, VStack, Image, ZStack, Rectangle } from 'scripting'
import { VideoItem } from '../models'

export function VideoGridItem({ item }: { item: VideoItem }) {
  return (
    <VStack alignment="leading" spacing={4}>
      <ZStack alignment="bottomTrailing">
        <Rectangle
          aspectRatio={{ value: 5 / 7, contentMode: 'fill' }}
          fill="secondarySystemBackground"
          overlay={
            <Image
              imageUrl={item.pic}
              resizable
              scaleToFill
              transition={Transition.opacity()}
            />
          }
          clipShape={{ type: 'rect', cornerRadius: 5 }}
        />
        <Text
          font="caption"
          foregroundStyle="white"
          padding={4}
          shadow={{ color: 'black', radius: 1 }}
        >
          {item.remarks}
        </Text>
      </ZStack>
      <Text lineLimit={1} font="subheadline" foregroundStyle="label">
        {item.name}
      </Text>
    </VStack>
  )
}
