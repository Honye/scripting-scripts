import {
  Circle,
  Color,
  Device,
  EnvironmentValuesReader,
  HStack,
  Image,
  Rectangle,
  RoundedRectangle,
  Spacer,
  Text,
  VirtualNode,
  VStack,
  ZStack,
  gradient
} from 'scripting'
import { AppItem, Folder, resolveIconSource } from '../constants'

const EDITOR_SECONDARY = 'secondaryLabel' as Color
const EDITOR_TERTIARY = 'tertiarySystemFill' as Color
const BACKGROUND_MESH_POINTS: [number, number][] = [
  [0, 0],
  [0.5, -0.05],
  [1, 0],
  [-0.08, 0.52],
  [0.5, 0.42],
  [1.08, 0.55],
  [0, 1],
  [0.48, 1.05],
  [1, 1]
]

export function FolderIconView({
  icon,
  color
}: {
  icon?: string
  color?: string
}) {
  const punchSymbol = icon && UIImage.fromSFSymbol(icon) ? icon : ''
  return (
    <ZStack compositingGroup>
      <Image
        systemName="folder.fill"
        font={30}
        foregroundStyle={(color ?? 'systemBlue') as Color}
      />
      {punchSymbol ? (
        <Image
          systemName={punchSymbol}
          font={13}
          offset={{ x: 0, y: 4 }}
          blendMode="destinationOut"
        />
      ) : null}
    </ZStack>
  )
}

export function ResolvedIconImage({
  icon,
  iconDark,
  fit = false
}: {
  icon: string
  iconDark?: string
  fit?: boolean
}) {
  const common = fit ? { scaleToFit: true } : { scaleToFill: true }
  const placeholder = (
    <ZStack
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      background={EDITOR_TERTIARY}
    >
      <Image systemName="photo" foregroundStyle={EDITOR_SECONDARY} />
    </ZStack>
  )
  if (!icon.trim()) return placeholder

  const src = resolveIconSource(icon, iconDark)
  return src.kind === 'file' ? (
    <Image filePath={src.source} resizable {...common} />
  ) : (
    <Image
      imageUrl={src.source}
      resizable
      {...common}
      placeholder={placeholder}
    />
  )
}

export function AppIconView({
  icon,
  iconDark,
  iconType,
  color,
  size = 24
}: {
  icon: string
  iconDark?: string
  iconType: AppItem['iconType']
  color: string
  size?: number
}) {
  const cornerRadius = size * 0.225

  if (iconType === 'image') {
    return (
      <ZStack
        frame={{ width: size, height: size }}
        clipShape={{ type: 'rect', cornerRadius }}
      >
        <ResolvedIconImage icon={icon} iconDark={iconDark} />
      </ZStack>
    )
  }
  return (
    <ZStack frame={{ width: size, height: size }}>
      <RoundedRectangle
        frame={{ width: size, height: size }}
        fill={color as Color}
        cornerRadius={cornerRadius}
      />
      {iconType === 'transparent_image' ? (
        <ZStack frame={{ width: size * 0.6, height: size * 0.6 }}>
          <ResolvedIconImage icon={icon} iconDark={iconDark} fit />
        </ZStack>
      ) : (
        <Image
          systemName={icon}
          font={size * 0.5}
          foregroundStyle="white"
        />
      )}
    </ZStack>
  )
}

export function getAppSubtitle(item: AppItem) {
  if (item.mode === 'bundleId') return item.bundleId ?? ''
  if (item.mode === 'script') return 'Custom Code'
  return item.url
}

export function matchesQuery(item: AppItem, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    item.name.toLowerCase().includes(q) ||
    getAppSubtitle(item).toLowerCase().includes(q)
  )
}

export function filterApps(items: AppItem[], query: string) {
  return query.trim() ? items.filter(item => matchesQuery(item, query)) : items
}

export function AppRow({
  item,
  folders
}: {
  item: AppItem
  folders?: Folder[]
}) {
  const subtitle = getAppSubtitle(item)
  const folderNames = (item.folderIds ?? [])
    .map(fid => folders?.find(f => f.id === fid)?.name)
    .filter(Boolean)
    .join(', ')

  return (
    <HStack alignment="center">
      <AppIconView
        icon={item.icon}
        iconDark={item.iconDark}
        iconType={item.iconType}
        color={item.color}
        size={34}
      />
      <VStack alignment="leading" spacing={2}>
        <Text font={16}>{item.name}</Text>
        {subtitle || folderNames ? (
          <HStack spacing={4}>
            {subtitle ? (
              <Text font={12} opacity={0.6} lineLimit={1}>
                {subtitle}
              </Text>
            ) : null}
            {folderNames ? (
              <Text font={11} foregroundStyle={'systemBlue' as Color}>
                {folderNames}
              </Text>
            ) : null}
          </HStack>
        ) : null}
      </VStack>
    </HStack>
  )
}

function TexturedBackground() {
  return (
    <EnvironmentValuesReader keys={['colorScheme']}>
      {({ colorScheme }) => {
        const isDark = colorScheme === 'dark'
        const background =
          parseFloat(Device.systemVersion) >= 18
            ? gradient('mesh', {
                width: 3,
                height: 3,
                points: BACKGROUND_MESH_POINTS,
                colors: (isDark
                  ? [
                      '#111C2E',
                      '#261B32',
                      '#102A28',
                      '#19243A',
                      '#2B2420',
                      '#17243A',
                      '#142C2A',
                      '#231B31',
                      '#141922'
                    ]
                  : [
                      '#DCEBFF',
                      '#F2E4FF',
                      '#DDF6EF',
                      '#EAF1FF',
                      '#F8F1E7',
                      '#E2ECFF',
                      '#DDF2EE',
                      '#EFE4FA',
                      '#F4F6FA'
                    ]) as Color[],
                background: (isDark ? '#141922' : '#EEF2F7') as Color
              })
            : gradient('linear', {
                colors: (isDark
                  ? ['#111C2E', '#261B32', '#102A28']
                  : ['#DCEBFF', '#F2E4FF', '#DDF6EF']) as Color[],
                startPoint: 'topLeading',
                endPoint: 'bottomTrailing'
              })

        return (
          <ZStack
            frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
            ignoresSafeArea={{ regions: 'container', edges: 'all' }}
            allowsHitTesting={false}
          >
            <Rectangle
              fill={background}
              frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
            />
            <Circle
              frame={{ width: 300, height: 300 }}
              fill={
                (isDark
                  ? 'rgba(80,150,255,0.14)'
                  : 'rgba(255,255,255,0.48)') as Color
              }
              blur={48}
              offset={{ x: -150, y: -260 }}
            />
            <Circle
              frame={{ width: 340, height: 340 }}
              fill={
                (isDark
                  ? 'rgba(205,115,255,0.12)'
                  : 'rgba(173,125,255,0.13)') as Color
              }
              blur={56}
              offset={{ x: 180, y: 280 }}
            />
          </ZStack>
        )
      }}
    </EnvironmentValuesReader>
  )
}

export function TexturedTabPage({ children }: { children: VirtualNode }) {
  return (
    <ZStack
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      toolbarBackground={{
        style: 'clear',
        bars: ['navigationBar', 'tabBar']
      }}
      toolbarBackgroundVisibility={
        parseFloat(Device.systemVersion) >= 18
          ? {
              visibility: 'hidden',
              bars: ['navigationBar', 'tabBar']
            }
          : undefined
      }
    >
      <TexturedBackground />
      {children}
    </ZStack>
  )
}
