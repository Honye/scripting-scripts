import {
  Circle,
  HStack,
  Image,
  Text,
  UnevenRoundedRectangle,
  VStack,
  Widget,
} from 'scripting'
import { i18n } from './i18n'
import { Pet } from './types'
import { getAge, getDayOffset } from './utils'

function Avatar({ image }: { image: string }) {
  const attrs = /^http/.test(image) ? { imageUrl: image } : { filePath: image }
  return (
    <Image
      resizable
      scaleToFill
      frame={{ width: 48, height: 48 }}
      widgetAccentedRenderingMode={Storage.get('renderingMode') || 'fullColor'}
      {...attrs}
      clipShape='circle'
      padding={1.1}
      background={
        <Circle
          stroke={{
            shapeStyle: 'rgba(30,31,36,0.1)',
            strokeStyle: { lineWidth: 2.2 },
          }}
        />
      }
    />
  )
}

function PetAvatarInfo({ pet }: { pet: Pet }) {
  return (
    <VStack spacing={8}>
      <Avatar image={pet.image} />
      <Text
        font={{ name: 'Muyao-Softbrush', size: 10 }}
        multilineTextAlignment='center'
        foregroundStyle='#80828d'
      >
        {pet.nickname}
      </Text>
    </VStack>
  )
}

function AgeInfo(props: { pet: Pet; reverse?: boolean }) {
  return (
    <VStack
      padding
      background={
        <UnevenRoundedRectangle
          fill='rgba(0,0,0,0)'
          topLeadingRadius={props.reverse ? 12 : 0}
          topTrailingRadius={props.reverse ? 0 : 12}
          bottomTrailingRadius={12}
          bottomLeadingRadius={12}
          stroke={{
            shapeStyle: 'rgba(30,31,36,0.1)',
            strokeStyle: { lineWidth: 3 },
          }}
        />
      }
      alignment='leading'
    >
      <HStack spacing={0}>
        <Text font={{ name: 'Muyao-Softbrush', size: 36 }}>
          {getAge(props.pet.birthday)}
        </Text>
        <Text offset={{ x: 0, y: 6 }} font={12} foregroundStyle='#80828D'>
          {i18n.yearsOld}
        </Text>
      </HStack>
      <HStack spacing={0}>
        <Text offset={{ x: 0, y: 2 }} font={12} foregroundStyle='#80828D'>
          {i18n.hasExisted}
        </Text>
        <Text font={{ name: 'Muyao-Softbrush', size: 24 }}>
          {getDayOffset(props.pet.birthday)}
        </Text>
        <Text offset={{ x: 0, y: 2 }} font={12} foregroundStyle='#80828D'>
          {i18n.days}
        </Text>
      </HStack>
    </VStack>
  )
}

function PetItemView(props: { pet: Pet; reverse?: boolean }) {
  return (
    <HStack spacing={20} alignment='top'>
      {props.reverse
        ? [
            <AgeInfo pet={props.pet} reverse={props.reverse} />,
            <PetAvatarInfo pet={props.pet} />,
          ]
        : [
            <PetAvatarInfo pet={props.pet} />,
            <AgeInfo pet={props.pet} reverse={props.reverse} />,
          ]}
    </HStack>
  )
}

function WidgetView() {
  const pets = Storage.get<Pet[]>('pets') || []
  const message = Storage.get<string>('message') || i18n.defaultMessage

  return (
    <VStack padding spacing={24} alignment='leading'>
      <Text font={{ name: 'MuyaoPleased', size: 24 }}>
        {message}
      </Text>
      {pets.map((item, i) => (
        <PetItemView key={item.nickname} pet={item} reverse={i % 2 === 1} />
      ))}
    </VStack>
  )
}

Widget.present(<WidgetView />)
