import {
  Color,
  EnvironmentValuesReader,
  HStack,
  Image,
  modifiers,
  Path,
  RoundedRectangle,
  Script,
  Spacer,
  Text,
  VStack,
  Widget
} from 'scripting'

const root = Path.join(FileManager.appGroupDocumentsDirectory, Script.name)
const dirImages = Path.join(root, 'images')

function WidgetView() {
  const stored = Storage.get<string[]>('catme_texts')
  const rawTexts =
    stored && stored.length === 4
      ? stored
      : ['岁月静好', '猫猫相陪', '执子之爪', '铲屎到老']

  const texts = rawTexts.map((t) => ({
    text: t,
    size: 56
  }))

  const fontName = Storage.get<string>('catme_font_name') ?? 'Muyao-Softbrush'
  const fontSize = Storage.get<number>('catme_font_size') ?? 16
  const colors = Storage.get<Color[]>('catme_colors') ?? [
    '#E5F9E7',
    '#E5F9E7',
    '#E5F9E7',
    '#E5F9E7'
  ]

  return (
    <EnvironmentValuesReader keys={['widgetRenderingMode']}>
      {({ widgetRenderingMode }) => (
        <HStack
          padding={12}
          spacing={12}
          background={
            widgetRenderingMode !== 'accented'
              ? {
                  content: <Image filePath={Path.join(root, 'bg.png')} />,
                  alignment: 'center'
                }
              : undefined
          }
        >
          {texts.map(({ text, size }, i) => (
            <VStack
              key={i}
              frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
              padding={{ vertical: 12, horizontal: 0 }}
              modifiers={modifiers()
                .background(
                  <RoundedRectangle
                    cornerRadius={20}
                    fill={colors[i] ?? '#e5f9e7'}
                  />
                )
                .background(
                  widgetRenderingMode !== 'accented' ? (
                    <RoundedRectangle
                      cornerRadius={20}
                      fill="ultraThinMaterial"
                    />
                  ) : (
                    'clear'
                  )
                )}
            >
              {text.split('').map((c) => (
                <Text
                  font={{
                    name: fontName,
                    size: fontSize
                  }}
                >
                  {c}
                </Text>
              ))}
              <Spacer frame={{ height: 6 }} />
              <Image
                filePath={Path.join(dirImages, `${i + 1}.png`)}
                resizable
                scaleToFit
                frame={{ width: size, height: size }}
                widgetAccentedRenderingMode="fullColor"
              />
            </VStack>
          ))}
        </HStack>
      )}
    </EnvironmentValuesReader>
  )
}

Widget.present(<WidgetView />)
