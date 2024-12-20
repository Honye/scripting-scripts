import { DatePicker, DatePickerComponents, DatePickerStyle, Divider, HStack, Image, Picker, ScrollView, Section, Spacer, Text, Toggle, useMemo, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

const oneDay = 1000 * 60 * 60 * 24

export function DatePickerExample() {
  const [date, setDate] = useState(() => Date.now())
  const [startDateEnabled, setStartDateEnabled] = useState(false)
  const [endDateEnabled, setEndDateEnabled] = useState(false)
  const startDate = useMemo(() => Date.now() - oneDay * 7, [])
  const endDate = useMemo(() => Date.now() + oneDay * 7, [])
  const components = useMemo<DatePickerComponents[]>(() => [
    'date',
    'hourAndMinute'
  ], [])
  const [displayedComponents, setDisplayedComponents] = useState<DatePickerComponents[]>([
    'date', 'hourAndMinute'
  ])
  const datePickerStyles = useMemo<DatePickerStyle[]>(() => [
    'compact',
    'graphical',
    'wheel',
  ], [])
  const [selectedStyle, setSelectedStyle] = useState<DatePickerStyle>('graphical')

  return <ScrollView>
    <UIExample
      title={"DatePicker"}
      code={`const oneDay = 1000 * 60 * 60 * 24
    
function DatePickerView() {
  const [date, setDate] = useState(() => Date.now())  
  const startDate = useMemo(() => Date.now() - oneDay * 7, [])
  const endDate = useMemo(() => Date.now() + oneDay * 7, [])

  return <DatePicker
    title={"DatePicker"}
    value={date}
    onChanged={setDate}
    startDate={startDate}
    endDate={endDate}
    displayedComponents={["date", "hourAndMinute"]}
    datePickerStyle={"graphical"}
  />
}`}
    >
      <VStack>
        <Toggle
          title={"Use startDate"}
          value={startDateEnabled}
          onChanged={setStartDateEnabled}
        />

        <Toggle
          title={"Use endDate"}
          value={endDateEnabled}
          onChanged={setEndDateEnabled}
        />
        <Divider />
        {components.map(name =>
          <VStack>
            <HStack
              contentShape={'rect'}
              onTapGesture={() => {
                if (displayedComponents.includes(name)) {
                  if (displayedComponents.length > 1) {
                    setDisplayedComponents(displayedComponents.filter(e => e !== name))
                  }
                } else {
                  setDisplayedComponents([name, ...displayedComponents])
                }
              }}
            >
              <Text>Display: {name}</Text>
              <Spacer />
              {displayedComponents.includes(name)
                ? <Image
                  systemName={"checkmark"}
                  foregroundStyle={"systemBlue"}
                />
                : undefined}
            </HStack>
            <Divider />
          </VStack>
        )}
        <HStack>
          <Text>DatePicker Style</Text>
          <Spacer />
          <Picker
            title={"DatePicker Style"}
            value={selectedStyle}
            onChanged={setSelectedStyle as any}
            pickerStyle={'menu'}
          >
            {datePickerStyles.map(style =>
              <Text tag={style}>{style}</Text>
            )}
          </Picker>
        </HStack>
        <Divider />
        <DatePicker
          title={"DatePicker"}
          value={date}
          onChanged={setDate}
          startDate={startDateEnabled ? startDate : undefined}
          endDate={endDateEnabled ? endDate : undefined}
          displayedComponents={displayedComponents}
          datePickerStyle={selectedStyle}
        />
      </VStack>
    </UIExample>
  </ScrollView>
}