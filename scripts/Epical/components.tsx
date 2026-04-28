import {
  Button,
  HStack,
  ProgressView,
  RoundedRectangle,
  Spacer,
  Text,
  VStack,
  ZStack
} from 'scripting'
import type { Color } from 'scripting'
import type { Schedule, Show } from './types'
import { theme, tintedBg } from './theme'

/** Compact poster: a tall rounded rect with diagonal gradient and the title's first 2 chars. */
export function Poster({
  show,
  size = 50
}: {
  show: Show | { title: string; color: string }
  size?: number
}) {
  const initials = show.title.slice(0, 2)
  const w = size
  const h = Math.round(size * 1.4)
  const fontSize = Math.round(size * 0.28)
  return (
    <ZStack
      frame={{ width: w, height: h }}
      background={
        <RoundedRectangle
          cornerRadius={8}
          fill={{
            colors: [`${show.color}cc` as Color, `${show.color}55` as Color],
            startPoint: 'topLeading',
            endPoint: 'bottomTrailing'
          }}
        />
      }
      overlay={
        <RoundedRectangle
          cornerRadius={8}
          stroke={{
            shapeStyle: theme.divider,
            strokeStyle: { lineWidth: 1 }
          }}
        />
      }
      clipShape={{ type: 'rect', cornerRadius: 8 }}
    >
      <Text
        font={fontSize}
        fontWeight="bold"
        foregroundStyle="rgba(255,255,255,0.9)"
        kerning={0.3}
      >
        {initials}
      </Text>
    </ZStack>
  )
}

/** Small pill showing the genre, tinted with the show's accent color. */
export function GenrePill({
  genre,
  color
}: {
  genre: string
  color: string
}) {
  return (
    <Text
      font={11}
      fontWeight="medium"
      foregroundStyle={color as Color}
      padding={{ horizontal: 6, vertical: 2 }}
      background={{
        style: tintedBg(color),
        shape: { type: 'rect', cornerRadius: 4 }
      }}
    >
      {genre}
    </Text>
  )
}

/** A row in the calendar showing one scheduled airing for one show today. */
export function EpisodeCard({
  show,
  schedule,
  onTap
}: {
  show: Show
  schedule: Schedule
  onTap: () => void
}) {
  const nextEp = show.watchedEps + 1
  const lastEp = nextEp + schedule.episodes - 1
  const ratio = show.totalEps > 0 ? show.watchedEps / show.totalEps : 0
  return (
    <Button action={onTap} buttonStyle="plain">
      <HStack
        alignment="center"
        spacing={14}
        padding={{ horizontal: 16, vertical: 14 }}
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
      >
        <Poster show={show} size={50} />
        <VStack
          alignment="leading"
          spacing={3}
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
          <HStack spacing={6}>
            <GenrePill genre={show.genre} color={show.color} />
            <Text
              font={12}
              foregroundStyle={theme.textTertiary}
              lineLimit={1}
            >
              今日更新第 {nextEp}–{lastEp} 集
            </Text>
          </HStack>
          <HStack spacing={8} padding={{ top: 5 }}>
            <ProgressView
              value={ratio}
              total={1}
              tint={show.color as Color}
            />
            <Text
              font={11}
              foregroundStyle={theme.textQuaternary}
            >
              {show.watchedEps}/{show.totalEps}集
            </Text>
          </HStack>
        </VStack>
        <VStack alignment="trailing" spacing={4}>
          <Text
            font={15}
            fontWeight="semibold"
            foregroundStyle={theme.text80}
          >
            {schedule.time}
          </Text>
          <Text
            font={11}
            foregroundStyle={theme.textQuaternary}
          >
            更新{schedule.episodes}集
          </Text>
        </VStack>
      </HStack>
    </Button>
  )
}

/** A small chip showing which weekday a show airs on. */
export function DayChip({ day }: { day: number }) {
  const labels = ['日', '一', '二', '三', '四', '五', '六']
  return (
    <Text
      font={10}
      fontWeight="semibold"
      foregroundStyle={theme.brandEnd}
      padding={{ horizontal: 5, vertical: 2 }}
      background={{
        style: theme.brandSoftBg,
        shape: { type: 'rect', cornerRadius: 4 }
      }}
    >
      周{labels[day]}
    </Text>
  )
}

/** Filled purple pill button — main call-to-action. */
export function PrimaryButton({
  title,
  action,
  height = 50
}: {
  title: string
  action: () => void
  height?: number
}) {
  return (
    <Button action={action} buttonStyle="plain">
      <HStack
        alignment="center"
        frame={{ maxWidth: 'infinity', height }}
        background={{
          style: {
            colors: [theme.brandStart, theme.brandEnd],
            startPoint: 'topLeading',
            endPoint: 'bottomTrailing'
          },
          shape: { type: 'rect', cornerRadius: 14 }
        }}
        shadow={{
          color: theme.brandShadow,
          radius: 16,
          y: 4
        }}
      >
        <Text
          font={16}
          fontWeight="semibold"
          foregroundStyle="white"
        >
          {title}
        </Text>
      </HStack>
    </Button>
  )
}

/** Layout helper: dimmed section header text. */
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      font={13}
      fontWeight="medium"
      foregroundStyle={theme.text50}
    >
      {children}
    </Text>
  )
}

/** Used in the 'Add' flow to render the selected-show preview card. */
export function ShowPreviewCard({
  show
}: {
  show: { title: string; genre: string; color: string }
}) {
  return (
    <HStack
      spacing={14}
      padding={14}
      background={{
        style: theme.surfaceAlt,
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
    >
      <Poster show={show} size={44} />
      <VStack alignment="leading" spacing={4}>
        <Text
          font={16}
          fontWeight="bold"
          foregroundStyle={theme.text}
        >
          {show.title}
        </Text>
        <GenrePill genre={show.genre} color={show.color} />
      </VStack>
      <Spacer />
    </HStack>
  )
}
