import {
  HStack,
  Image,
  Link,
  RoundedRectangle,
  Spacer,
  Text,
  VStack,
  Widget,
  ZStack
} from 'scripting'
import type { Color } from 'scripting'
import type { Show } from './types'
import { getTodayIndex } from './data'
import { loadShows } from './store'
import { theme } from './theme'
import { rpt } from './utils'

function loadTodaysShows(): Show[] {
  const today = getTodayIndex()
  const timeFor = (s: Show) =>
    s.schedules.find((sc) => sc.day === today)?.time ?? '99:99'
  return loadShows()
    .filter((s) => s.schedules.some((sc) => sc.day === today))
    .sort((a, b) => timeFor(a).localeCompare(timeFor(b)))
}

function PosterImage({ show, w, h }: { show: Show; w: number; h: number }) {
  const initials = show.title.slice(0, 2)
  const fontSize = Math.max(rpt(12), Math.round(w * 0.28))
  const radius = rpt(8)
  const fallback = (
    <ZStack
      frame={{ width: w, height: h }}
      background={
        <RoundedRectangle
          cornerRadius={radius}
          fill={{
            colors: [`${show.color}cc` as Color, `${show.color}55` as Color],
            startPoint: 'topLeading',
            endPoint: 'bottomTrailing'
          }}
        />
      }
      clipShape={{ type: 'rect', cornerRadius: radius }}
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

  if (show.coverUrl) {
    return (
      <Image
        imageUrl={show.coverUrl}
        widgetAccentedRenderingMode='fullColor'
        placeholder={fallback}
        resizable
        scaleToFill
        frame={{ width: w, height: h }}
        clipShape={{ type: 'rect', cornerRadius: radius }}
        overlay={
          <RoundedRectangle
            cornerRadius={radius}
            stroke={{
              shapeStyle: 'rgba(255,255,255,0.18)' as Color,
              strokeStyle: { lineWidth: 1 }
            }}
          />
        }
      />
    )
  }
  return fallback
}

function PlayBadge({ size }: { size: number }) {
  return (
    <Image
      systemName="play.circle.fill"
      font={size}
      foregroundStyle="white"
      shadow={{ color: 'rgba(0,0,0,0.35)' as Color, radius: 3 }}
    />
  )
}

function EmptyView() {
  return (
    <VStack
      frame={Widget.displaySize}
      spacing={rpt(8)}
      widgetBackground={theme.bg}
    >
      <Spacer />
      <Image
        systemName="moon.zzz"
        font={rpt(28)}
        foregroundStyle={theme.text35}
      />
      <Text
        font={rpt(12)}
        foregroundStyle={theme.textTertiary}
        multilineTextAlignment="center"
      >
        今日没有更新
      </Text>
      <Spacer />
    </VStack>
  )
}

function SmallView({ shows, count }: { shows: Show[]; count: number }) {
  const stack = shows.slice(0, 3)
  const front = stack[0]
  const pSize = rpt(52)
  const pHeight = Math.round(pSize * 1.42)
  const offStepX = rpt(12)
  const offStepY = rpt(3)
  const stackW = pSize + (stack.length - 1) * offStepX
  const stackH = pHeight + (stack.length - 1) * offStepY

  const date = new Date()
  const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]

  return (
    <VStack
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      padding={{ horizontal: rpt(6) }}
      spacing={0}
      alignment="leading"
      widgetBackground={theme.surface}
    >
      <HStack alignment="center" spacing={rpt(4)}>
        <Image
          systemName="play.circle.fill"
          font={rpt(11)}
          foregroundStyle={theme.brandEnd}
        />
        <Text
          font={rpt(10)}
          fontWeight="bold"
          foregroundStyle={theme.textSecondary}
          kerning={0.2}
          lineLimit={1}
        >
          剧历
        </Text>
        <Spacer />
        <Text
          font={rpt(9)}
          fontWeight="semibold"
          foregroundStyle={theme.textTertiary}
          kerning={0.3}
          lineLimit={1}
        >
          {dateLabel} · {weekday}
        </Text>
      </HStack>

      <HStack
        alignment="lastTextBaseline"
        spacing={rpt(3)}
        padding={{ top: rpt(2) }}
      >
        <Text
          font={rpt(26)}
          fontWeight="black"
          foregroundStyle={theme.text}
          kerning={-1}
        >
          {count}
        </Text>
        <Text
          font={rpt(10)}
          fontWeight="semibold"
          foregroundStyle={theme.textTertiary}
        >
          部上新
        </Text>
      </HStack>

      <HStack
        alignment="bottom"
        spacing={rpt(6)}
        padding={{ top: rpt(8) }}
        frame={{ maxWidth: 'infinity' }}
      >
        <ZStack
          alignment="bottomLeading"
          frame={{ width: stackW, height: stackH }}
        >
          {[2, 1, 0]
            .filter((origIdx) => origIdx < stack.length)
            .map((origIdx) => {
              const s = stack[origIdx]
              const offX = origIdx * offStepX
              const offY = origIdx * offStepY
              const rot = origIdx * 3
              const scale = 1 - origIdx * 0.04
              const isFront = origIdx === 0
              const poster = (
                <ZStack
                  frame={{ width: pSize, height: pHeight }}
                  offset={{ x: offX, y: offY }}
                  rotationEffect={{ degrees: rot, anchor: 'bottomLeading' }}
                  scaleEffect={{ x: scale, y: scale, anchor: 'bottomLeading' }}
                  shadow={{
                    color: 'rgba(0,0,0,0.22)' as Color,
                    radius: rpt(3),
                    y: rpt(2)
                  }}
                >
                  <PosterImage show={s} w={pSize} h={pHeight} />
                </ZStack>
              )
              return isFront && s.playUrl ? (
                <Link key={s.id} url={s.playUrl}>
                  {poster}
                </Link>
              ) : (
                <ZStack key={s.id}>{poster}</ZStack>
              )
            })}
        </ZStack>

        <VStack
          alignment="trailing"
          spacing={rpt(3)}
          frame={{ maxWidth: 'infinity', alignment: 'bottomTrailing' }}
        >
          <Text
            font={rpt(8)}
            fontWeight="bold"
            foregroundStyle={theme.textTertiary}
            kerning={0.4}
            lineLimit={1}
            padding={{ horizontal: rpt(5), vertical: rpt(1) }}
            background={{
              style: theme.surfaceAlt,
              shape: { type: 'rect', cornerRadius: rpt(4) }
            }}
          >
            {front.genre}
          </Text>
          <Text
            font={rpt(10)}
            fontWeight="bold"
            foregroundStyle={theme.text}
            lineLimit={2}
            multilineTextAlignment="trailing"
          >
            {front.title}
          </Text>
        </VStack>
      </HStack>
    </VStack>
  )
}

function MediumView({ shows, count }: { shows: Show[]; count: number }) {
  const padH = rpt(14)
  const colSpacing = rpt(8)
  const w = Math.floor(
    (Widget.displaySize.width - padH * 2 - colSpacing * 3) / 4
  )
  const h = Math.round(w * 1.4)
  const playBadge = Math.round(w * 0.42)
  const cardRadius = rpt(8)

  const date = new Date()
  const dateLabel = `${date.getMonth() + 1}月${date.getDate()}日`

  return (
    <VStack
      frame={Widget.displaySize}
      padding={{ top: rpt(24), bottom: rpt(12), leading: padH, trailing: padH }}
      spacing={rpt(8)}
      widgetBackground={theme.bg}
    >
      <HStack padding={{ horizontal: padH }}>
        <Text
          font={rpt(11)}
          fontWeight="semibold"
          foregroundStyle={theme.brandEnd}
        >
          今日更新 · {count} 部
        </Text>
        <Spacer />
        <Text
          font={rpt(11)}
          foregroundStyle={theme.textQuaternary}
        >
          {dateLabel}
        </Text>
      </HStack>
      <HStack
        spacing={colSpacing}
        alignment="top"
        frame={{ maxWidth: 'infinity', alignment: 'center' }}
      >
        {shows.map((s) => {
          const card = (
            <ZStack
              frame={{ width: w, height: h }}
              clipShape={{ type: 'rect', cornerRadius: cardRadius }}
            >
              <PosterImage show={s} w={w} h={h} />
              {s.playUrl ? (
                <ZStack frame={{ width: w, height: h }}>
                  <RoundedRectangle
                    cornerRadius={cardRadius}
                    fill={'rgba(0,0,0,0.22)' as Color}
                    frame={{ width: w, height: h }}
                  />
                  <PlayBadge size={playBadge} />
                </ZStack>
              ) : null}
            </ZStack>
          )
          return (
            <VStack key={s.id} spacing={rpt(4)} frame={{ width: w }}>
              {s.playUrl ? <Link url={s.playUrl}>{card}</Link> : card}
              <Text
                font={rpt(10)}
                fontWeight="medium"
                foregroundStyle={theme.text80}
                lineLimit={1}
                truncationMode="tail"
                multilineTextAlignment="center"
                frame={{ width: w }}
              >
                {s.title}
              </Text>
            </VStack>
          )
        })}
      </HStack>
      <Spacer />
    </VStack>
  )
}

function WidgetView() {
  const todaysShows = loadTodaysShows()
  if (todaysShows.length === 0) {
    return <EmptyView />
  }
  const count = todaysShows.length
  if (Widget.family === 'systemSmall') {
    return <SmallView shows={todaysShows.slice(0, 3)} count={count} />
  }
  return <MediumView shows={todaysShows.slice(0, 4)} count={count} />
}

Widget.present(<WidgetView />)
