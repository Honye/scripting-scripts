import {
  Button,
  Color,
  ColorPicker,
  HStack,
  Image,
  List,
  Navigation,
  NavigationStack,
  Path,
  RoundedRectangle,
  Script,
  Section,
  Spacer,
  Stepper,
  Text,
  TextField,
  Widget,
  useState
} from 'scripting'
import { saveImageForWidget } from './utils'
import { dirImages, root } from './paths'

if (!FileManager.existsSync(dirImages)) {
  FileManager.createDirectorySync(dirImages, true)
}

function App() {
  const [texts, setTexts] = useState<string[]>(() => {
    const stored = Storage.get<string[]>('catme_texts')
    if (stored && Array.isArray(stored) && stored.length === 4) {
      return stored
    }
    return ['岁月静好', '猫猫相陪', '执子之爪', '铲屎到老']
  })

  const [fontName, setFontName] = useState(
    () => Storage.get<string>('catme_font_name') ?? 'Muyao-Softbrush'
  )
  const [fontSize, setFontSize] = useState(
    () => Storage.get<number>('catme_font_size') ?? 16
  )

  const [colors, setColors] = useState<Color[]>(() => {
    const stored = Storage.get<Color[]>('catme_colors')
    if (stored && Array.isArray(stored) && stored.length === 4) {
      return stored
    }
    return ['#E5F9E7', '#E5F9E7', '#E5F9E7', '#E5F9E7']
  })

  // Use a counter to force update images when they change
  const [imageTick, setImageTick] = useState(0)

  const handleTextChange = (text: string, index: number) => {
    const newTexts = [...texts]
    newTexts[index] = text
    setTexts(newTexts)
    Storage.set('catme_texts', newTexts)
  }

  const handleColorChange = (color: Color, index: number) => {
    const newColors = [...colors]
    newColors[index] = color
    setColors(newColors)
    Storage.set('catme_colors', newColors)
  }

  const handlePickImage = async (index: number) => {
    try {
      const photos = await Photos.pickPhotos(1)
      const photo = photos?.[0]
      if (photo) {
        const filePath = Path.join(dirImages, `${index + 1}.png`)
        await saveImageForWidget(photo, filePath)
        setImageTick((prev) => prev + 1)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePickFont = async () => {
    const font = await FontPicker.pickFont()
    if (font) {
      setFontName(font)
      Storage.set('catme_font_name', font)
    }
  }

  const handleFontSizeChange = (increment: boolean) => {
    const newSize = increment ? fontSize + 1 : fontSize - 1
    if (newSize > 0) {
      setFontSize(newSize)
      Storage.set('catme_font_size', newSize)
    }
  }

  const [bgType, setBgType] = useState(
    () => Storage.get<string>('catme_bg_type') ?? 'color'
  )
  const [bgColor, setBgColor] = useState(
    () => Storage.get<Color>('catme_bg_color') ?? '#FFFFFF'
  )

  const handlePickBgImage = async () => {
    try {
      const photos = await Photos.pickPhotos(1)
      const photo = photos?.[0]
      if (photo) {
        const filePath = Path.join(root, 'bg.png')
        await saveImageForWidget(photo, filePath)
        setImageTick((prev) => prev + 1)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <NavigationStack>
      <List
        navigationTitle="Life Quartets"
        toolbar={{
          topBarTrailing: (
            <Button
              title="Preview"
              action={async () => {
                await Widget.preview()
              }}
            />
          )
        }}
      >
        <Section header={<Text>Global Settings</Text>}>
          <Button action={handlePickFont}>
            <HStack>
              <Text>Font Name</Text>
              <Spacer />
              <Text foregroundStyle="gray">{fontName}</Text>
            </HStack>
          </Button>
          <Stepper
            onIncrement={() => handleFontSizeChange(true)}
            onDecrement={() => handleFontSizeChange(false)}
          >
            <HStack>
              <Text>Font Size</Text>
              <Spacer />
              <Text foregroundStyle="gray">{fontSize.toString()}</Text>
            </HStack>
          </Stepper>
        </Section>
        {texts.map((text, i) => (
          <Section key={i} header={<Text>Block {i + 1}</Text>}>
            <TextField
              title="Text"
              value={text}
              prompt="Enter text"
              onChanged={(val) => handleTextChange(val, i)}
            />
            <Button action={() => handlePickImage(i)}>
              <HStack>
                <Text>Select Image</Text>
                <Spacer />
                <Image
                  key={`${i}-${imageTick}`}
                  resizable
                  scaleToFit
                  frame={{ width: 40, height: 40 }}
                  filePath={Path.join(dirImages, `${i + 1}.png`)}
                  background={<RoundedRectangle cornerRadius={6} fill="#eee" />}
                />
              </HStack>
            </Button>
            <ColorPicker
              title="Background Color"
              value={colors[i]}
              onChanged={(c) => handleColorChange(c, i)}
            />
          </Section>
        ))}

        <Section header={<Text>Widget Background</Text>}>
          <Button
            action={() => {
              const newType = bgType === 'color' ? 'image' : 'color'
              setBgType(newType)
              Storage.set('catme_bg_type', newType)
            }}
          >
            <HStack>
              <Text>Background Type</Text>
              <Spacer />
              <Text foregroundStyle="gray">
                {bgType === 'color' ? 'Color' : 'Image'}
              </Text>
            </HStack>
          </Button>

          {bgType === 'color' && (
            <ColorPicker
              title="Color"
              value={bgColor}
              onChanged={(c) => {
                setBgColor(c)
                Storage.set('catme_bg_color', c)
              }}
            />
          )}

          {bgType === 'image' && (
            <Button action={handlePickBgImage}>
              <HStack>
                <Text>Select Background Image</Text>
                <Spacer />
                <Image
                  key={`bg-${imageTick}`}
                  filePath={Path.join(root, 'bg.png')}
                  resizable
                  frame={{ width: 40, height: 40 }}
                  mask={<RoundedRectangle cornerRadius={6} />}
                  background={<RoundedRectangle cornerRadius={6} fill="#eee" />}
                />
              </HStack>
            </Button>
          )}

          <Button
            action={() => {
              setBgType('color')
              setBgColor('#FFFFFF')
              Storage.remove('catme_bg_type')
              Storage.remove('catme_bg_color')
              if (FileManager.existsSync(Path.join(root, 'bg.png'))) {
                FileManager.removeSync(Path.join(root, 'bg.png'))
              }
              setImageTick((prev) => prev + 1)
            }}
          >
            <Text foregroundStyle="red">Restore Default Background</Text>
          </Button>
        </Section>
      </List>
    </NavigationStack>
  )
}

Navigation.present({
  element: <App />
})
  .catch((err) => console.error(err))
  .finally(() => Script.exit())
