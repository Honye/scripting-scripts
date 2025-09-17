import {
  Button,
  HStack,
  Image,
  Menu,
  Navigation,
  NavigationStack,
  Path,
  Picker,
  RoundedRectangle, Script, TabView, Text, useColorScheme, useEffect, useState,
  VStack,
  Widget,
  type DynamicImageSource
} from 'scripting'
import ScreenshotSelect from './components/ScreenshotSelect'
import { getBackground, sliceWallpaper } from './utils/slice'
import { darkDir, lightDir } from "./utils/common"
import { getAllWidgets, type WidgetJSON } from './utils/widget'

function View() {
  const colorScheme = useColorScheme()
  const [image, setImage] = useState<UIImage>()
  const [isPresented, setIsPresented] = useState(false)

  const showTutorial = () => {
    sliceWallpaper()
    HapticFeedback.lightImpact()
    setIsPresented(true)
  }

  useEffect(() => {
    const path = Path.join(
      colorScheme === 'dark'?darkDir:lightDir, 'screenshot.jpg')
    ;(async () => {
      if (
        await FileManager.exists(path)
      ) {
        const image = UIImage.fromFile(path)
        if (image) setImage(image)
      }
    })()
  }, [colorScheme])

  const [widgets, setWidgets] = useState<WidgetJSON[]>([])
  const [widget, setWidget] = useState<string>()
  useEffect(() => setWidgets(getAllWidgets()), [])
  const onLink = (scriptRoot: string) => {
    const libsDir = Path.join(scriptRoot, 'libs')
    if (!FileManager.existsSync(libsDir)) {
      FileManager.createDirectorySync(libsDir)
    }
    const target = Path.join(scriptRoot, 'libs/transparent-background')
    if (FileManager.existsSync(target) && FileManager.isLinkSync(target)) {
      FileManager.removeSync(target)
    }
    FileManager.createLinkSync(
      target,
      Path.join(Script.directory, 'wallpapers')
    )
    setWidget(scriptRoot)
  }

  return (
    <NavigationStack>
      <VStack
        toolbar={{
          topBarTrailing: [
            <Menu
              label={
                <Image systemName='square.and.arrow.up' foregroundStyle='accentColor' />
              }
            >
              {/* <Button title='Share Slices' action={() => {}} /> */}
              <Picker
                title='Link Widget'
                pickerStyle='navigationLink'
                value={widget || ''}
                onChanged={onLink}
              >
                {widgets.map((widget) => (
                  <HStack tag={widget.root}>
                    <Image
                      frame={{ width: 32, height: 32 }}
                      systemName={widget.icon}
                      foregroundStyle='white'
                      font={14}
                      background={
                        <RoundedRectangle fill={widget.color} cornerRadius={8} />
                      }
                    />
                    <Text>{widget.name}</Text>
                  </HStack>
                ))}
              </Picker>
            </Menu>
          ]
        }}
      >
        <HStack>
          <ScreenshotSelect
            image={image}
            onSelect={setImage}
          />
        </HStack>
        {/* <Button
          title='弹出'
          action={showTutorial}
          popover={{
            isPresented: isPresented,
            onChanged: setIsPresented,
            arrowEdge: 'top',
            content: <Tutorial onConfirm={() => setIsPresented(false)} />,
          }}
        /> */}
      </VStack>
    </NavigationStack>
  )
}

function Tutorial({ onConfirm }: { onConfirm: () => void }) {
  return (
    <VStack>
      <TabView tabViewStyle='pageAlwaysDisplayIndex'>
        <Text>Tutorial</Text>
        <Text>Hello</Text>
      </TabView>
      <Button action={onConfirm}>
        <Text
          padding
          background={
            <RoundedRectangle fill="blue" cornerRadius={4} />
          }
        >BUTTON</Text>
      </Button>
      <Button
        background="blue"
        buttonBorderShape='capsule'
        padding={10}
        title='Got it'
        action={onConfirm}
      />
    </VStack>
  )
}

function runAsModule(): UIImage | DynamicImageSource<UIImage> | null {
  const { family, position } = Script.queryParameters
  const dir = Path.join(Script.directory, `wallpapers`)
  const lightImage = UIImage.fromFile(Path.join(dir, `light/${family}-${position}.jpg`))
  const darkImage = UIImage.fromFile(Path.join(dir, `dark/${family}-${position}.jpg`))
  if (lightImage && darkImage) {
    return ({
      light: lightImage,
      dark: darkImage
    })
  }
  return (Device.colorScheme === 'dark' ? darkImage : lightImage) || lightImage || darkImage
}

;(async function() {
  const { family, position } = Script.queryParameters
  if (position) {
    Script.exit(getBackground(family || Widget.family, position))
  } else {
    await Navigation.present({
      element: <View />,
      modalPresentationStyle: 'automatic'
    }).finally(() => {
      Script.exit()
    })
  }
})()
