import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationLink,
  NavigationStack,
  Path,
  Picker,
  Script,
  Section,
  Spacer,
  Stepper,
  Text,
  useEffect,
  useState,
  TextField,
  VStack,
  Widget,
  Device
} from 'scripting'
import { rpt } from './screen'

const DEFAULT_IMAGE = 'https://picsum.photos/200/300'

type SlotData = {
  path: string
  timestamp: number
}

const SLOT_SIZES = [
  { width: 165.35, height: 314.16 }, // Slot 0
  { width: 165.35, height: 314.16 }, // Slot 1
  { width: 258.36, height: 250.09 }, // Slot 2
  { width: 258.36, height: 206.69 }  // Slot 3
]

function TextEditor({
  text,
  onSave
}: {
  text: string
  onSave: (text: string) => void
}) {
  const [value, setValue] = useState(text)
  return (
    <List navigationTitle='Edit Text'>
      <Section>
        <TextField
          title='Custom Text'
          axis='vertical'
          value={value}
          onChanged={setValue}
          onDisappear={() => onSave(value)}
        />
      </Section>
    </List>
  )
}

export function PhotoConfig() {
  const dismiss = Navigation.useDismiss()
  const [slotPaths, setSlotPaths] = useState<(SlotData | null)[]>([
    null,
    null,
    null,
    null
  ])
  const scriptName = Script.name
  const imageDir = Path.join(FileManager.appGroupDocumentsDirectory, scriptName)
  const [customText, setCustomText] = useState(
    (Storage.get('customText') as string) || 'MOMO\nMIANMIAN'
  )
  const [cornerRadius, setCornerRadius] = useState(
    (Storage.get('cornerRadius') as number) ?? 12
  )
  const [themeMode, setThemeMode] = useState(
    (Storage.get('themeMode') as string) || 'auto'
  )

  useEffect(() => {
    Storage.set('customText', customText)
    Storage.set('cornerRadius', cornerRadius)
    Storage.set('themeMode', themeMode)
    Widget.reloadAll()
  }, [customText, cornerRadius, themeMode])

  useEffect(() => {
    loadImages()
  }, [])

  async function loadImages() {
    try {
      if (!(await FileManager.exists(imageDir))) {
        await FileManager.createDirectory(imageDir, true)
      }

      const newSlots: (SlotData | null)[] = []
      const timestamp = Date.now()
      for (let i = 0; i < 4; i++) {
        const path = Path.join(imageDir, `${i}.jpg`)
        if (await FileManager.exists(path)) {
          newSlots.push({ path, timestamp })
        } else {
          newSlots.push(null)
        }
      }
      setSlotPaths(newSlots)
    } catch (e) {
      console.error('Failed to load images:', e)
    }
  }

  async function handleSelectPhoto(index: number) {
    try {
      const picked = await Photos.pickPhotos(1)
      if (picked && picked.length > 0) {
        const image = picked[0]

        const slotSize = SLOT_SIZES[index]
        const targetWidth = rpt(slotSize.width)
        const targetHeight = rpt(slotSize.height)

        const croppedImage = image.preparingThumbnail({
          width: targetWidth * Device.screen.scale,
          height: targetHeight * Device.screen.scale
        })

        if (croppedImage) {
          const data = croppedImage.toJPEGData()

          if (!data) return
          const filename = `${index}.jpg`
          const filePath = Path.join(imageDir, filename)

          // Ensure directory exists
          if (!(await FileManager.exists(imageDir))) {
            await FileManager.createDirectory(imageDir, true)
          }

          await FileManager.writeAsData(filePath, data)
          await loadImages()
        }
      }
    } catch (e) {
      console.error(e)
      Dialog.alert({ message: 'Failed to set photo: ' + e })
    }
  }

  function getImageProps(index: number) {
    if (slotPaths[index]) {
      return {
        key: slotPaths[index]!.timestamp,
        filePath: slotPaths[index]!.path
      }
    }
    return { imageUrl: DEFAULT_IMAGE }
  }

  return (
    <NavigationStack>
      <List
        navigationTitle={scriptName}
        toolbar={{
          topBarLeading: (
            <Button title='Close' systemImage='xmark' action={dismiss} />
          ),
          topBarTrailing: (
            <Button title='Preview' action={() => Widget.preview()} />
          )
        }}
      >
        <Section header={<Text>Settings</Text>}>
          <Picker
            title='Theme'
            value={themeMode}
            onChanged={(v: string) => setThemeMode(v)}
          >
            <Text tag='auto'>System</Text>
            <Text tag='light'>Light</Text>
            <Text tag='dark'>Dark</Text>
          </Picker>
          <NavigationLink
            destination={
              <TextEditor text={customText} onSave={setCustomText} />
            }
          >
            <HStack>
              <Text>Custom Text</Text>
              <Spacer />
              <Text foregroundStyle='secondaryLabel'>
                {customText.replace(/\n/g, ' ')}
              </Text>
            </HStack>
          </NavigationLink>
          <Stepper
            onIncrement={() => setCornerRadius((c) => c + 1)}
            onDecrement={() => setCornerRadius((c) => Math.max(c - 1, 0))}
          >
            <HStack>
              <Text>Corner Radius</Text>
              <Spacer />
              <Text foregroundStyle='secondaryLabel'>{cornerRadius.toString()}</Text>
            </HStack>
          </Stepper>
        </Section>

        <Section
          header={<Text>Photos</Text>}
          footer={<Text>Tap on an image to replace it.</Text>}
        >
          <VStack padding spacing={20} alignment='center'>
            <HStack spacing={0}>
              {/* Slot 0 */}
              <Button buttonStyle='plain' action={() => handleSelectPhoto(0)}>
                <Image
                  {...getImageProps(0)}
                  resizable
                  scaleToFill
                  frame={{ width: rpt(165.35), height: rpt(314.16) }}
                  clipShape={{ type: 'rect', cornerRadius: rpt(16) }}
                />
              </Button>
              <Spacer minLength={rpt(8.27)} />
              {/* Slot 1 */}
              <Button buttonStyle='plain' action={() => handleSelectPhoto(1)}>
                <Image
                  {...getImageProps(1)}
                  resizable
                  scaleToFill
                  frame={{ width: rpt(165.35), height: rpt(314.16) }}
                  clipShape={{ type: 'rect', cornerRadius: rpt(16) }}
                />
              </Button>
              <Spacer minLength={rpt(16.63)} />
              <VStack spacing={rpt(8.27)}>
                {/* Slot 2 */}
                <Button buttonStyle='plain' action={() => handleSelectPhoto(2)}>
                  <Image
                    {...getImageProps(2)}
                    resizable
                    scaleToFill
                    frame={{ width: rpt(258.36), height: rpt(250.09) }}
                    clipShape={{ type: 'rect', cornerRadius: rpt(16) }}
                  />
                </Button>
                {/* Slot 3 */}
                <Button buttonStyle='plain' action={() => handleSelectPhoto(3)}>
                  <Image
                    {...getImageProps(3)}
                    resizable
                    scaleToFill
                    frame={{ width: rpt(258.36), height: rpt(206.69) }}
                    clipShape={{ type: 'rect', cornerRadius: rpt(16) }}
                  />
                </Button>
              </VStack>
            </HStack>
          </VStack>
        </Section>
      </List>
    </NavigationStack>
  )
}

Navigation.present({
  element: <PhotoConfig />
})
  .catch(console.error)
  .finally(() => Script.exit())
