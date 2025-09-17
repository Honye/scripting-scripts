import { Image, VStack, Widget } from 'scripting'
import { getBackground } from './utils/slice'

function WidgetView() {
  const position = Widget.parameter
  const background = getBackground(Widget.family, position)

  return <VStack
    padding
    frame={Widget.displaySize}
    background={
      background ?
        <Image
          image={background}
          resizable
          scaleToFill
        />
      : 'white'
    }
  />
}

Widget.present(<WidgetView />)
