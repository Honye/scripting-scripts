import {
  Button,
  HStack,
  Image,
  Menu,
  Navigation,
  NavigationStack,
  Path,
  Picker,
  RoundedRectangle, Script, Spacer, TabView, Text, useColorScheme, useEffect, useState,
  VStack,
  Widget
} from 'scripting'
import ScreenshotSelect from './components/ScreenshotSelect'
import { getBackground, sliceWallpaper } from './utils/slice'
import { darkDir, lightDir } from "./utils/common"
import { getAllWidgets, type WidgetJSON } from './utils/widget'
import Mockup from './components/Mockup'

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
        spacing={24}
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
        <Button
          systemImage='questionmark.circle'
          title='Help'
          action={showTutorial}
          sheet={{
            isPresented: isPresented,
            onChanged: setIsPresented,
            content: <Tutorial onConfirm={() => setIsPresented(false)} />,
          }}
        />
      </VStack>
    </NavigationStack>
  )
}

function Tutorial({ onConfirm }: { onConfirm: () => void }) {
  const screenshot = UIImage.fromFile(
    Path.join(Script.directory, 'assets/screenshot.jpeg')
  )
  const imgSelect = UIImage.fromFile(
    Path.join(Script.directory, 'assets/select.png')
  )
  return (
    <VStack>
      <TabView
        tabViewStyle='pageAlwaysDisplayIndex'
      >
        <VStack padding={32} spacing={30}>
          <Text
            font='title2'
            fontWeight='medium'
          >Capture Blank Home Screen</Text>
          <Text
            multilineTextAlignment='center'
            foregroundStyle='gray'
          >Capture a blank home screen without any icons, it must be a screenshot of the current device, wallpapers is not allowed~</Text>
          {screenshot && <Mockup screenshot={screenshot} />}
        </VStack>
        <VStack padding={32} spacing={30}>
          <Text
            font='title2'
            fontWeight='medium'
          >Select Screenshot</Text>
          <Text
            multilineTextAlignment='center'
            foregroundStyle='gray'
          >If the phone is in light mode, upload a screenshot in light mode. If the phone is in dark mode, upload a screenshot in dark mode</Text>
          {imgSelect && <Mockup screenshot={imgSelect} />}
        </VStack>
      </TabView>
      <Button action={onConfirm}>
        <Text
          padding
          background={
            <RoundedRectangle
              frame={{ width: 120, height: 44 }}
              fill='accentColor'
              cornerRadius={22}
            />
          }
          fontWeight='medium'
          foregroundStyle='white'
        >Got it</Text>
      </Button>
      <Spacer minLength={32} />
    </VStack>
  )
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
