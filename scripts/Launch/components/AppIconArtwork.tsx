import {
  Color,
  EnvironmentValuesReader,
  Image,
  RoundedRectangle,
  ZStack
} from 'scripting'
import {
  AppItem,
  Config,
  DEFAULT_CONFIG,
  resolveIconSource
} from '../constants'

/** The visual artwork shared by the widget and its in-app folder previews. */
export function AppIconArtwork({
  item,
  config
}: {
  item: AppItem
  config?: Config
}) {
  const size = config?.iconSize || DEFAULT_CONFIG.iconSize
  const radius =
    config?.shape === 'circle'
      ? size / 2
      : (config?.cornerRadius ?? size * 0.225)
  const accentedRenderingMode =
    config?.widgetAccentedRenderingMode ||
    DEFAULT_CONFIG.widgetAccentedRenderingMode

  return (
    <ZStack frame={{ width: size, height: size }}>
      {item.iconType === 'image' ? (
        <ZStack
          frame={{ width: size, height: size }}
          clipShape={{
            type: 'rect',
            cornerRadius: radius
          }}
        >
          {(() => {
            const src = resolveIconSource(item.icon, item.iconDark)
            return src.kind === 'file' ? (
              <Image
                filePath={src.source}
                resizable
                scaleToFill
                widgetAccentedRenderingMode={accentedRenderingMode}
              />
            ) : (
              <Image
                imageUrl={src.source}
                resizable
                scaleToFill
                widgetAccentedRenderingMode={accentedRenderingMode}
              />
            )
          })()}
        </ZStack>
      ) : (
        <Fragment>
          <EnvironmentValuesReader keys={['widgetRenderingMode']}>
            {({ widgetRenderingMode }) => (
              <RoundedRectangle
                frame={{ width: size, height: size }}
                fill={item.color as Color}
                cornerRadius={radius}
                opacity={widgetRenderingMode === 'accented' ? 0.2 : 1}
              />
            )}
          </EnvironmentValuesReader>
          {item.iconType === 'transparent_image' ? (
            (() => {
              const src = resolveIconSource(item.icon, item.iconDark)
              return src.kind === 'file' ? (
                <Image
                  filePath={src.source}
                  resizable
                  scaleToFit
                  frame={{ width: size * 0.6, height: size * 0.6 }}
                  widgetAccentedRenderingMode={accentedRenderingMode}
                />
              ) : (
                <Image
                  imageUrl={src.source}
                  resizable
                  scaleToFit
                  frame={{ width: size * 0.6, height: size * 0.6 }}
                  widgetAccentedRenderingMode={accentedRenderingMode}
                />
              )
            })()
          ) : (
            <Image
              systemName={item.icon}
              foregroundStyle="white"
              font={size * 0.5}
              widgetAccentable
              widgetAccentedRenderingMode={accentedRenderingMode}
            />
          )}
        </Fragment>
      )}
    </ZStack>
  )
}
