import { Button, List, Navigation, NavigationLink, NavigationStack, Script, Section, Text, Toggle, useState, VStack } from "scripting"

function SheetExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <Section header={<Text>Showing a sheet</Text>}>
    <Button
      title={"Present"}
      action={() => setIsPresented(true)}
      sheet={{
        isPresented: isPresented,
        onChanged: setIsPresented,
        content: <VStack presentationDragIndicator={"visible"}>
          <Text font={"title"} padding={50}>Sheet content</Text>
          <Button title={"Dismiss"} action={() => setIsPresented(false)} />
        </VStack>
      }}
    />
  </Section>
}

function PopoverExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <Section header={<Text>Showing a popover</Text>}>
    <Button
      title={"Show Popover"}
      action={() => setIsPresented(true)}
      popover={{
        isPresented: isPresented,
        onChanged: setIsPresented,
        presentationCompactAdaptation: "popover",
        content: <Text padding>Popover content</Text>,
        arrowEdge: "top",
      }}
    />
  </Section>
}

function FullScreenCoverExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <Section header={<Text>Showing a full screen cover</Text>}>
    <Button
      title={"Present"}
      action={() => setIsPresented(true)}
      fullScreenCover={{
        isPresented: isPresented,
        onChanged: setIsPresented,
        content: <VStack
          onTapGesture={() => setIsPresented(false)}
          foregroundStyle={"white"}
          frame={{ maxHeight: "infinity", maxWidth: "infinity" }}
          background={"blue"}
          ignoresSafeArea
        >
          <Text>A full-screen modal view.</Text>
          <Text>Tap to dismiss</Text>
        </VStack>
      }}
    />
  </Section>
}

function ConfiguringSheetHeightExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <Section header={<Text>Configuring sheet height</Text>}>
    <Button
      title={"Present"}
      action={() => setIsPresented(true)}
      sheet={{
        isPresented: isPresented,
        onChanged: setIsPresented,
        content: <VStack
          presentationDragIndicator={"visible"}
          presentationDetents={[200, "medium", "large"]}
        >
          <Text font={"title"} padding={50}>Drag the indicator to resize the sheet height.</Text>
          <Button title={"Dismiss"} action={() => setIsPresented(false)} />
        </VStack>
      }}
    />
  </Section>
}

function PresentAlertExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <Section header={<Text>Present an alert view</Text>}>
    <Button
      title={"Present"}
      action={() => setIsPresented(true)}
      alert={{
        isPresented: isPresented,
        onChanged: setIsPresented,
        actions: <Button title={"OK"} action={() => { }} />,
        title: "Alert",
        message: <Text>Everything is OK</Text>
      }}
    />
  </Section>
}

function PresentConfirmationDialogExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <Section header={<Text>Present a confirmation dialog</Text>}>
    <Button
      title={"Present"}
      action={() => setIsPresented(true)}
      confirmationDialog={{
        isPresented,
        onChanged: setIsPresented,
        title: "Do you want to delete this image?",
        actions: <Button
          title={"Delete"}
          role={"destructive"}
          action={() => {
            Dialog.alert({ message: "The image has been deleted." })
          }}
        />
      }}
    />
  </Section>
}

function MultiSheetArrayCase() {
  const [aPresented, setAPresented] = useState(false)
  const [bPresented, setBPresented] = useState(false)

  return <Section
    header={<Text>Case A · sheet[] array, two slots</Text>}
    footer={<Text font="caption">
      Tap each button to present its sheet. The Dismiss button inside
      should close only that sheet.
    </Text>}
  >
    <Button
      title="Present Sheet A"
      action={() => setAPresented(true)}
      sheet={[
        {
          isPresented: aPresented,
          onChanged: setAPresented,
          content: <VStack padding={30}>
            <Text font="title" foregroundStyle={"blue"}>Sheet A</Text>
            <Text>useDismiss should close Sheet A.</Text>
            <DismissButton expected="Sheet A" />
          </VStack>
        },
        {
          isPresented: bPresented,
          onChanged: setBPresented,
          content: <VStack padding={30}>
            <Text font="title" foregroundStyle={"orange"}>Sheet B</Text>
            <Text>useDismiss should close Sheet B.</Text>
            <DismissButton expected="Sheet B" />
          </VStack>
        }
      ]}
    />
    <Button
      title="Present Sheet B"
      action={() => setBPresented(true)}
    />
  </Section>
}

function MixedKindsCase() {
  const [sheetOn, setSheetOn] = useState(false)
  const [popoverOn, setPopoverOn] = useState(false)
  const [coverOn, setCoverOn] = useState(false)

  return <Section
    header={<Text>Case B · sheet + popover + fullScreenCover mixed</Text>}
    footer={<Text font="caption">
      Present each modal in turn. Dismiss inside each should close only
      that layer.
    </Text>}
  >
    <Button
      title="Present Sheet"
      action={() => setSheetOn(true)}
      sheet={{
        isPresented: sheetOn,
        onChanged: setSheetOn,
        content: <VStack padding={30}>
          <Text font="title">Sheet layer</Text>
          <DismissButton expected="Sheet layer" />
        </VStack>
      }}
      popover={{
        isPresented: popoverOn,
        onChanged: setPopoverOn,
        presentationCompactAdaptation: "popover",
        arrowEdge: "top",
        content: <VStack padding={20}>
          <Text>Popover layer</Text>
          <DismissButton expected="Popover layer" />
        </VStack>
      }}
      fullScreenCover={{
        isPresented: coverOn,
        onChanged: setCoverOn,
        content: <VStack
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          background={"black"}
          foregroundStyle={"white"}
          ignoresSafeArea
        >
          <Text font="title">FullScreenCover layer</Text>
          <DismissButton expected="FullScreenCover layer" />
        </VStack>
      }}
    />
    <Button
      title="Present Popover"
      action={() => setPopoverOn(true)}
    />
    <Button
      title="Present FullScreenCover"
      action={() => setCoverOn(true)}
    />
  </Section>
}

function ConditionalModifierShiftCase() {
  const [withPopover, setWithPopover] = useState(false)
  const [sheetOn, setSheetOn] = useState(false)
  const [popoverOn, setPopoverOn] = useState(false)

  return <Section
    header={<Text>Case C · conditional modifier (drift test)</Text>}
    footer={<Text font="caption">
      Toggle "Mount popover" a few times, then present Sheet. The Dismiss
      inside Sheet should always close Sheet — never any other layer.
    </Text>}
  >
    <Toggle
      title="Mount popover"
      value={withPopover}
      onChanged={setWithPopover}
    />
    <Button
      title="Present Sheet"
      action={() => setSheetOn(true)}
      sheet={{
        isPresented: sheetOn,
        onChanged: setSheetOn,
        content: <VStack padding={30}>
          <Text font="title">Sheet (Case C)</Text>
          <Text>Dismiss should close Sheet regardless of popover state.</Text>
          <DismissButton expected="Sheet (Case C)" />
        </VStack>
      }}
      popover={withPopover ? {
        isPresented: popoverOn,
        onChanged: setPopoverOn,
        presentationCompactAdaptation: "popover",
        arrowEdge: "top",
        content: <VStack padding={20}>
          <Text>Popover (Case C)</Text>
          <DismissButton expected="Popover (Case C)" />
        </VStack>
      } : undefined}
    />
    {withPopover && <Button
      title="Present Popover"
      action={() => setPopoverOn(true)}
    />}
  </Section>
}

function NavigationLinkWithSheetCase() {
  const [sheetOn, setSheetOn] = useState(false)

  return <Section
    header={<Text>Case D · NavigationLink + sheet on same component</Text>}
    footer={<Text font="caption">
      Push to Detail then Dismiss — should pop the detail, not close Sheet.
      Present Sheet then Dismiss — should close Sheet, not pop navigation.
    </Text>}
  >
    <NavigationLink
      destination={
        <VStack padding={20} navigationTitle="Detail D">
          <Text font="title">NavigationLink Detail</Text>
          <Text>useDismiss should pop this layer.</Text>
          <DismissButton expected="Detail D (pop)" />
        </VStack>
      }
    >
      <Text>Push to Detail</Text>
    </NavigationLink>
    <Button
      title="Present Sheet"
      action={() => setSheetOn(true)}
      sheet={{
        isPresented: sheetOn,
        onChanged: setSheetOn,
        content: <VStack padding={30}>
          <Text font="title">Sheet (Case D)</Text>
          <DismissButton expected="Sheet (Case D)" />
        </VStack>
      }}
    />
  </Section>
}

function DismissButton({ expected }: { expected: string }) {
  const dismiss = Navigation.useDismiss()
  return <Button
    title={`Dismiss (expected target: ${expected})`}
    action={() => dismiss()}
    padding
  />
}

function Example() {
  return <NavigationStack>
    <List
      navigationTitle={"Modal presentations"}
      navigationBarTitleDisplayMode={"inline"}
    >
      <SheetExample />
      <ConfiguringSheetHeightExample />
      <FullScreenCoverExample />
      <PopoverExample />
      <PresentAlertExample />
      <PresentConfirmationDialogExample />

      <MultiSheetArrayCase />
      <MixedKindsCase />
      <ConditionalModifierShiftCase />
      <NavigationLinkWithSheetCase />
    </List>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()
