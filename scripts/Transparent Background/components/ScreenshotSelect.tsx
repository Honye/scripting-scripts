import { Button, Image, Path, RoundedRectangle, Text, useState, VStack , ProgressView} from 'scripting'
import { callAsyncFn, darkDir, lightDir } from '../utils/common'
import { sliceWallpaper } from '../utils/slice'

async function chooseImage() {
  const { isiOSAppOnMac } = Device
  if (isiOSAppOnMac) {
    const [filePath] = await DocumentPicker.pickFiles({
      types: ['public.image']
    })
    if (filePath) {
      return UIImage.fromFile(filePath)
    }
    return null
  }
  const [image] = await Photos.pickPhotos(1)
  return image || null
}

export default function ScreenshotSelect({
  image,
  onSelect
}: { 
  image?: UIImage
  onSelect?: (image: UIImage) => void
}) {
  const { isiOSAppOnMac, screen } = Device
  const innerWidth = isiOSAppOnMac ? 590 : screen.width
  let width = innerWidth / 3 * 2
  if (isiOSAppOnMac) width = innerWidth / 4 * 3
  const height = width * screen.height / screen.width
  const [loading, setLoading] = useState(false)

  const chooseScreenshot = async () => {
    const image = await chooseImage()
    if (!image) return
    if ((screen.width / screen.height).toFixed(2) !== (image.width / image.height).toFixed(2)) {
      return
    }
    const data = Data.fromJPEG(image)
    if (data) {
      const dir = Device.colorScheme === 'dark' ? darkDir : lightDir
      if (!(await FileManager.exists(dir))) {
        await callAsyncFn(
          FileManager.createDirectory(dir, true)
        )
      }
      await callAsyncFn(
        FileManager.writeAsData(
          Path.join(dir, 'screenshot.jpg'),
          data
        )
      )
      await sliceWallpaper()
    }
    onSelect?.(image)
  }

  const onTap = () => {
    setLoading(true)
    chooseScreenshot().finally(() => {
      setLoading(false)
    })
  }

  return (
    <Button
      background={
        <RoundedRectangle
          stroke={{
            shapeStyle: '#414141',
            strokeStyle: { lineWidth: isiOSAppOnMac ? 10 : 20 }
          }}
          cornerRadius={24}
        />
      }
      action={onTap}
      overlay={ loading ? {
        alignment: 'center',
        content: (
          <VStack>
            <ProgressView />
            <Text
              fontWeight='medium'
              foregroundStyle='label'
              shadow={{ color: 'secondarySystemBackground', radius: 2 }}
            >Loading</Text>
          </VStack>
        )
      } : undefined}
    >
      {image
        ? (
          <Image
            resizable
            scaleToFill
            frame={{ width, height }}
            image={image}
            clipShape={{ type: 'rect', cornerRadius: 24 }}
          />
        )
        : (
          <VStack frame={{ width, height }} >
            <Image
              systemName='plus'
              font={30}
              padding={6}
              background={<RoundedRectangle fill='gray' cornerRadius={4} />}
              foregroundStyle='darkGray'
            />
            <Text font='caption' foregroundStyle='gray'>Select Screenshot</Text>
          </VStack>
        )
      }
    </Button>
  )
}