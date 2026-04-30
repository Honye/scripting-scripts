import {
  Button,
  Circle,
  HStack,
  Image,
  ProgressView,
  ScrollView,
  Spacer,
  Text,
  VStack,
  useState
} from 'scripting'
import type { Color } from 'scripting'
import type { Show } from '../types'
import { DAYS_FULL } from '../data'
import { theme } from '../theme'
import { GenrePill, Poster, PrimaryButton, SectionLabel } from '../components'

function StepperButton({
  systemName,
  action,
  tint
}: {
  systemName: string
  action: () => void
  tint?: Color
}) {
  return (
    <Button action={action} buttonStyle="plain">
      <Image
        systemName={systemName}
        font={16} fontWeight="semibold"
        foregroundStyle={theme.text}
        frame={{ width: 44, height: 44 }}
        background={{
          style: tint ?? theme.surfaceAlt2,
          shape: { type: 'rect', cornerRadius: 14 }
        }}
      />
    </Button>
  )
}

export function DetailView({
  show,
  onClose,
  onSave,
  onDelete
}: {
  show: Show
  onClose: () => void
  onSave: (id: number, watched: number, total: number) => void
  onDelete: (id: number) => void
}) {
  const confirmDelete = async () => {
    const ok = await Dialog.confirm({
      title: '删除追剧',
      message: `确定要从追剧列表中删除《${show.title}》吗？此操作无法撤销。`,
      cancelLabel: '取消',
      confirmLabel: '删除'
    })
    if (ok) {
      onDelete(show.id)
      onClose()
    }
  }
  const [watched, setWatched] = useState(show.watchedEps)
  const [total, setTotal] = useState(show.totalEps)
  const safeTotal = Math.max(total, watched)
  const ratio = safeTotal > 0 ? watched / safeTotal : 0
  const tintColor = `${show.color}55` as Color

  return (
    <ScrollView>
      <VStack
        spacing={20}
        padding={{ horizontal: 20, top: 12, bottom: 32 }}
        frame={{ maxWidth: 'infinity', alignment: 'top' }}
        background={theme.surface}
      >
        <HStack spacing={16} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <Poster show={show} size={64} />
          <VStack alignment="leading" spacing={6}>
            <Text
              font={18}
              fontWeight="bold"
              foregroundStyle={theme.text}
              lineLimit={2}
            >
              {show.title}
            </Text>
            <GenrePill genre={show.genre} color={show.color} />
            <Text
              font={13}
              foregroundStyle={theme.textTertiary}
            >
              共 {safeTotal} 集 · 已看 {watched} 集
            </Text>
          </VStack>
          <Spacer />
        </HStack>

        <VStack spacing={12} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <HStack>
            <SectionLabel>观看进度</SectionLabel>
            <Spacer />
            <Text
              font={13}
              fontWeight="semibold"
              foregroundStyle={theme.text70}
            >
              {Math.round(ratio * 100)}%
            </Text>
          </HStack>
          <ProgressView value={ratio} total={1} tint={show.color as Color} />
          <HStack spacing={20} padding={{ top: 8 }} frame={{ maxWidth: 'infinity' }}>
            <Spacer />
            <StepperButton
              systemName="minus"
              action={() => setWatched(Math.max(0, watched - 1))}
              tint={tintColor}
            />
            <VStack spacing={2} frame={{ minWidth: 60 }}>
              <Text
                font={22}
                fontWeight="bold"
                foregroundStyle={theme.text}
              >
                {watched}
              </Text>
              <Text
                font={11}
                foregroundStyle={theme.textQuaternary}
              >
                已观看
              </Text>
            </VStack>
            <StepperButton
              systemName="plus"
              action={() => setWatched(Math.min(safeTotal, watched + 1))}
              tint={tintColor}
            />
            <Spacer />
          </HStack>
        </VStack>

        <VStack spacing={10} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <HStack>
            <SectionLabel>总集数</SectionLabel>
            <Spacer />
            <Text
              font={14}
              fontWeight="semibold"
              foregroundStyle={theme.text}
            >
              {total} 集
            </Text>
            <Button
              action={() => setTotal(Math.max(watched, total - 1))}
              buttonStyle="plain"
            >
              <Image
                systemName="minus.circle.fill"
                font={22}
                foregroundStyle={theme.text50}
              />
            </Button>
            <Button action={() => setTotal(total + 1)} buttonStyle="plain">
              <Image
                systemName="plus.circle.fill"
                font={22}
                foregroundStyle={theme.brandEnd}
              />
            </Button>
          </HStack>
        </VStack>

        <VStack spacing={6} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          {show.schedules.map((sc, i) => (
            <HStack
              key={i}
              spacing={10}
              padding={{ horizontal: 12, vertical: 10 }}
              background={{
                style: theme.card,
                shape: { type: 'rect', cornerRadius: 10 }
              }}
            >
              <Circle
                fill={show.color as Color}
                frame={{ width: 6, height: 6 }}
              />
              <Text
                font={14}
                fontWeight="medium"
                foregroundStyle={theme.text70}
              >
                每{DAYS_FULL[sc.day]} {sc.time}
              </Text>
              <Spacer />
              <Text
                font={13}
                foregroundStyle={theme.textQuaternary}
              >
                更新 {sc.episodes} 集
              </Text>
            </HStack>
          ))}
        </VStack>

        <PrimaryButton
          title="保存进度"
          action={() => {
            onSave(show.id, watched, safeTotal)
            onClose()
          }}
        />

        <Button action={confirmDelete} buttonStyle="plain">
          <HStack
            spacing={6}
            alignment="center"
            frame={{ maxWidth: 'infinity', height: 44 }}
          >
            <Image
              systemName="trash"
              font={14}
              fontWeight="semibold"
              foregroundStyle="systemRed"
            />
            <Text
              font={14}
              fontWeight="semibold"
              foregroundStyle="systemRed"
            >
              删除追剧
            </Text>
          </HStack>
        </Button>
      </VStack>
    </ScrollView>
  )
}
