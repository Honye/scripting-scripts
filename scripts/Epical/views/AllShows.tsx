import {
  HStack,
  Image,
  ProgressView,
  RoundedRectangle,
  ScrollView,
  Spacer,
  Text,
  VStack
} from 'scripting'
import type { Color } from 'scripting'
import type { Show } from '../types'
import { theme } from '../theme'
import { DayChip, GenrePill, Poster } from '../components'

function ShowRow({
  show,
  onTap
}: {
  show: Show
  onTap: () => void
}) {
  const ratio = show.totalEps > 0 ? show.watchedEps / show.totalEps : 0
  return (
    <HStack
      spacing={14}
      padding={14}
      background={{
        style: theme.card,
        shape: { type: 'rect', cornerRadius: 16 }
      }}
      overlay={
        <RoundedRectangle
          cornerRadius={16}
          stroke={{
            shapeStyle: theme.cardBorder,
            strokeStyle: { lineWidth: 1 }
          }}
        />
      }
      contentShape={{ type: 'rect' }}
      onTapGesture={onTap}
    >
      <Poster show={show} size={50} />
      <VStack
        alignment="leading"
        spacing={6}
        frame={{ maxWidth: 'infinity', alignment: 'leading' }}
      >
        <Text
          font={15}
          fontWeight="semibold"
          foregroundStyle={theme.text}
          lineLimit={1}
          truncationMode="tail"
        >
          {show.title}
        </Text>
        <GenrePill genre={show.genre} color={show.color} />
        <ProgressView value={ratio} total={1} tint={show.color as Color} />
        <Text
          font={11}
          foregroundStyle={theme.textQuaternary}
        >
          {show.watchedEps}/{show.totalEps} 集
        </Text>
      </VStack>
      <VStack alignment="trailing" spacing={3}>
        {show.schedules.slice(0, 3).map((sc, i) => (
          <DayChip key={i} day={sc.day} />
        ))}
      </VStack>
    </HStack>
  )
}

function EmptyState() {
  return (
    <VStack
      spacing={12}
      padding={{ vertical: 80 }}
      frame={{ maxWidth: 'infinity' }}
    >
      <Image
        systemName="tv"
        font={38}
        foregroundStyle={theme.text15}
      />
      <Text
        font={14}
        foregroundStyle={theme.textDisabled}
      >
        还没有追的剧
      </Text>
    </VStack>
  )
}

export function AllShowsView({
  shows,
  onShowDetail
}: {
  shows: Show[]
  onShowDetail: (show: Show) => void
}) {
  return (
    <VStack
      spacing={0}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity', alignment: 'top' }}
      background={theme.bg}
      navigationTitle="我的追剧"
      navigationSubtitle={`共 ${shows.length} 部`}
    >
      <ScrollView>
        <VStack
          spacing={10}
          padding={{ horizontal: 20, top: 8, bottom: 20 }}
          frame={{ maxWidth: 'infinity', alignment: 'top' }}
        >
          {shows.length === 0 ? (
            <EmptyState />
          ) : (
            shows.map((show) => (
              <ShowRow
                key={show.id}
                show={show}
                onTap={() => onShowDetail(show)}
              />
            ))
          )}
        </VStack>
      </ScrollView>
    </VStack>
  )
}
