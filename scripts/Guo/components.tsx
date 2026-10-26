import { Button, HStack, Image, LazyVGrid, NavigationLink, ProgressView, Spacer, Text, VStack, ZStack } from 'scripting'
import type { Drama } from './types'
import { theme } from './theme'
import { DetailView } from './views/Detail'
import { errorMessage } from './parse'

export async function perform(action: () => unknown | Promise<unknown>) {
  try { await action() } catch (error) { await Dialog.alert(errorMessage(error)) }
}

export function Poster({ drama, width = 72 }: { drama: Drama; width?: number }) {
  const fallback = (
    <ZStack frame={{ width, height: width * 1.4 }} background={theme.soft}>
      <Text font="title2" fontWeight="bold" foregroundStyle={theme.accent}>{drama.title.slice(0, 2)}</Text>
    </ZStack>
  )
  return drama.cover ? (
    <Image imageUrl={drama.cover} placeholder={fallback} resizable scaleToFill
      frame={{ width, height: width * 1.4 }} clipShape={{ type: 'rect', cornerRadius: 10 }} />
  ) : <VStack clipShape={{ type: 'rect', cornerRadius: 10 }}>{fallback}</VStack>
}

export function DramaRow({ drama, subtitle }: { drama: Drama; subtitle?: string }) {
  return (
    <HStack spacing={14} padding={{ top: 5, bottom: 5 }}>
      <Poster drama={drama} width={60} />
      <VStack alignment="leading" spacing={7}>
        <Text font="headline" foregroundStyle={theme.text} lineLimit={2}>{drama.title}</Text>
        <Text font="caption" foregroundStyle={theme.secondary} lineLimit={1}>{drama.category} · {drama.remark || '红果短剧'}</Text>
        {subtitle ? <Text font="caption" foregroundStyle={theme.accent} lineLimit={1}>{subtitle}</Text> : null}
      </VStack>
      <Spacer />
    </HStack>
  )
}

export function DramaGrid({ items }: { items: Drama[] }) {
  return (
    <LazyVGrid columns={[{ size: { type: 'adaptive', min: 155 }, spacing: 12 }]} spacing={12} padding={{ leading: 16, trailing: 16 }}>
      {items.map(drama => (
        <NavigationLink key={drama.id} destination={<DetailView initial={drama} />} buttonStyle="plain">
          <HStack alignment="top" spacing={10} padding={12} frame={{ maxWidth: 'infinity', alignment: 'leading' }}
            background={theme.card} clipShape={{ type: 'rect', cornerRadius: 16 }}>
            <Poster drama={drama} width={52} />
            <VStack alignment="leading" spacing={6}>
              <Text font="subheadline" fontWeight="semibold" foregroundStyle={theme.text} lineLimit={2}>{drama.title}</Text>
              <Text font="caption2" foregroundStyle={theme.secondary} lineLimit={1}>{drama.category}</Text>
              <Text font="caption2" foregroundStyle={theme.accent} lineLimit={1}>{drama.remark || '查看分集'}</Text>
            </VStack>
            <Spacer minLength={0} />
          </HStack>
        </NavigationLink>
      ))}
    </LazyVGrid>
  )
}

export function Notice({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <VStack spacing={10} padding={20} frame={{ maxWidth: 'infinity' }}>
      <Text font="subheadline" foregroundStyle={theme.secondary} multilineTextAlignment="center">{message}</Text>
      {retry ? <Button title="重试" systemImage="arrow.clockwise" action={retry} /> : null}
    </VStack>
  )
}

export function Loading({ title = '正在加载…' }: { title?: string }) {
  return <HStack spacing={10} padding={20} frame={{ maxWidth: 'infinity' }}><ProgressView /><Text foregroundStyle={theme.secondary}>{title}</Text></HStack>
}
