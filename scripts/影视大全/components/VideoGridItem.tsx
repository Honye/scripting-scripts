import { Text, VStack, Image, ZStack } from "scripting"
import { VideoItem } from "../models"

export function VideoGridItem({ item }: { item: VideoItem }) {
  return (
    <VStack alignment="leading" spacing={4}>
      <ZStack alignment="bottomTrailing">
        <Image
          imageUrl={item.pic}
          resizable={true}
          aspectRatio={{ contentMode: "fill" }}
          clipShape={{ type: "rect", cornerRadius: 5 }}
          frame={{ height: 160 }}
        />
        <ZStack>
          <Text
            font="caption"
            foregroundStyle="white"
            padding={4}
          >
            {item.remarks}
          </Text>
        </ZStack>
      </ZStack>
      <Text lineLimit={1} font="subheadline">
        {item.name}
      </Text>
      <Text lineLimit={1} font="caption" foregroundStyle="secondaryLabel">
        {item.score}
      </Text>
    </VStack>
  )
}
