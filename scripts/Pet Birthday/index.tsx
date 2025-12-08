import {
  Button,
  DatePicker,
  HStack,
  Image,
  List,
  Menu,
  Navigation,
  NavigationStack,
  NavigationLink,
  Path,
  Picker,
  Script,
  Section,
  Spacer,
  Text,
  TextField,
  Widget,
  WidgetAccentedRenderingMode,
  useCallback,
  useEffect,
  useState
} from 'scripting'
import { Pet } from './types'
import { i18n } from './i18n'

const modes: WidgetAccentedRenderingMode[] = [
  'accented',
  'desaturated',
  'accentedDesaturated',
  'fullColor'
]

function TextEditorView({
  title,
  text: initialText,
  onSave
}: {
  title: string
  text: string
  onSave: (text: string) => void
}) {
  const [text, setText] = useState(initialText)
  return (
    <List navigationTitle={title}>
      <Section>
        <TextField
          title={title}
          axis='vertical'
          value={text}
          onChanged={setText}
          onDisappear={() => onSave(text)}
        />
      </Section>
    </List>
  )
}

/** 配置页 */
function App() {
  const [renderingMode, setRenderingMode] = useState<WidgetAccentedRenderingMode>(Storage.get('renderingMode') || 'fullColor')
  const [pets, setPets] = useState<Pet[]>(Storage.get('pets') || [])
  const [message, setMessage] = useState<string>(Storage.get('message') || i18n.defaultMessage)

  useEffect(() => {
    Storage.set('renderingMode', renderingMode)
    Widget.reloadAll()
  }, [renderingMode])
  useEffect(() => {
    Storage.set('pets', pets)
    Storage.set('message', message)
    Widget.reloadAll()
  }, [pets, message])

  const addPet = useCallback(() => {
    setPets([
      ...pets,
      {
        nickname: `Pet${pets.length + 1}`,
        birthday: Date.now(),
        image: ''
      }
    ])
  }, [pets])

  const updatePet = (index: number, updatedPet: Pet) => {
    const newPets = [...pets]
    newPets[index] = updatedPet
    setPets(newPets)
  }

  const deletePet = (index: number) => {
    const newPets = [...pets]
    newPets.splice(index, 1)
    setPets(newPets)
  }



  const pickAvatar = useCallback(async (index: number) => {
    let [image] = await Photos.pickPhotos(1)
    image = image.renderedIn({ width: 48, height: 48 })!
    if (!image) return
    let data = image.toPNGData()
    let suffix = '.png'
    if (!data) {
      data = image.toJPEGData()
      suffix = '.jpg'
    }
    if (data) {
      const dir = Path.join(
        FileManager.appGroupDocumentsDirectory,
        Script.name,
        'images'
      )
      if (!FileManager.existsSync(dir)) {
        FileManager.createDirectorySync(dir, true)
      }
      const path = Path.join(dir, `${index}${suffix}`)
      await FileManager.writeAsData(path, data).catch((err) => {
        console.error(err)
        return err
      })
      pets[index].image = path
      setPets([...pets])
    }
  }, [pets])

  return (
    <NavigationStack>
      <List
        navigationTitle={i18n.petBirthday}
        toolbar={{
          topBarTrailing: (
            <Button action={addPet}>
              <Image systemName='plus' />
            </Button>
          )
        }}
      >
        <Section title={i18n.common}>
          <Picker
            title={i18n.imageRenderingMode}
            pickerStyle='navigationLink'
            value={renderingMode}
            onChanged={(value: string) => setRenderingMode(value as WidgetAccentedRenderingMode)}
          >
            {modes.map((mode) => (
              <Text key={mode} tag={mode}>{mode}</Text>
            ))}
          </Picker>
          <NavigationLink
            destination={
              <TextEditorView
                title={i18n.message}
                text={message}
                onSave={setMessage}
              />
            }
          >
            <HStack>
              <Text>{i18n.message}</Text>
              <Spacer />
              <Text foregroundStyle='secondaryLabel'>
                {message.replace(/\s+/g, ' ')}
              </Text>
            </HStack>
          </NavigationLink>
        </Section>
        {(pets.map((pet, index) => {
          return (
            <Section
              key={index}
              header={
                <Menu
                  label={
                    <HStack>
                      <Text foregroundStyle='secondaryLabel' textCase={null}>
                        {i18n.pet} {index + 1}
                      </Text>
                      <Image
                        systemName='chevron.down'
                        foregroundStyle='secondaryLabel'
                        imageScale='small'
                      />
                    </HStack>
                  }
                >
                  <Button
                    role='destructive'
                    textCase={null}
                    title={i18n.delete}
                    systemImage='trash'
                    action={() => deletePet(index)}
                  />
                </Menu>
              }
            >
              <NavigationLink
                destination={
                  <TextEditorView
                    title={i18n.nickname}
                    text={pet.nickname}
                    onSave={(nickname) =>
                      updatePet(index, { ...pet, nickname })
                    }
                  />
                }
              >
                <HStack>
                  <Text>{i18n.nickname}</Text>
                  <Spacer />
                  <Text foregroundStyle='secondaryLabel'>
                    {pet.nickname.replace(/\s+/g, ' ')}
                  </Text>
                </HStack>
              </NavigationLink>
              <DatePicker
                title={i18n.birthday}
                value={pet.birthday}
                onChanged={(birthday) => updatePet(index, { ...pet, birthday })}
                displayedComponents={['date']}
              />
              <Button title={i18n.avatar} action={() => pickAvatar(index)} />
            </Section>
          )
        }))}
        <Section>
          <Button action={() => Widget.preview()}>
            <HStack>
              <Text>{i18n.preview}</Text>
              <Spacer />
              <Image systemName='chevron.right' foregroundStyle='tertiaryLabel' />
            </HStack>
          </Button>
        </Section>
      </List>
    </NavigationStack>
  )
}

async function main() {
  await Navigation.present({ element: <App /> })
  Script.exit()
}

main()
