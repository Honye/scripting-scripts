import { Button, Form, Picker, Section, Text, Toggle, useMemo, useState } from "scripting"
import { CodePreview } from "../../ui_example"

type NotifyMeAboutType = "directMessages" | "mentions" | "anything"
type ProfileImageSize = "large" | "medium" | "small"

export function FormExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const [notifyMeAbout, setNotifyMeAbout] = useState<NotifyMeAboutType>("directMessages")
  const [playNotificationSounds, setPlayNotificationSounds] = useState(true)
  const [profileImageSize, setprofileImageSize] = useState<ProfileImageSize>("medium")
  const [sendReadReceipts, setSendReadReceipts] = useState(false)

  return <Form
    navigationTitle={"Form"}
    toolbar={{
      topBarTrailing: <Button
        title={"Code"}
        buttonStyle={'borderedProminent'}
        controlSize={'small'}
        action={() => setCodeVisible(true)}
        popover={{
          isPresented: codeVisible,
          onChanged: setCodeVisible,
          content: <CodePreview
            code={code}
            dismiss={() => setCodeVisible(false)}
          />
        }}
      />,
    }}
  >
    <Section
      header={<Text>Notifications</Text>}
    >
      <Picker
        title={"Notify Me About"}
        value={notifyMeAbout}
        onChanged={setNotifyMeAbout as any}
      >
        <Text
          tag={"directMessages"}
        >Direct Messages</Text>
        <Text
          tag={"mentions"}
        >Mentions</Text>
        <Text
          tag={"anything"}
        >Anything</Text>
      </Picker>

      <Toggle
        title={"Play notification sounds"}
        value={playNotificationSounds}
        onChanged={setPlayNotificationSounds}
      />
      <Toggle
        title={"Send read receipts"}
        value={sendReadReceipts}
        onChanged={setSendReadReceipts}
      />
    </Section>

    <Section
      header={<Text>User Profiles</Text>}
    >
      <Picker
        title={"Profile Image Size"}
        value={profileImageSize}
        onChanged={setprofileImageSize as any}
      >
        <Text
          tag={"large"}
        >Large</Text>
        <Text
          tag={"medium"}
        >Medium</Text>
        <Text
          tag={"small"}
        >Small</Text>
      </Picker>

      <Button
        title={"Clear Image Cache"}
        action={() => { }}
      />
    </Section>
  </Form>
}

const code = `function FormView() {
  const [notifyMeAbout, setNotifyMeAbout] = useState<NotifyMeAboutType>("directMessages")
  const [playNotificationSounds, setPlayNotificationSounds] = useState(true)
  const [profileImageSize, setprofileImageSize] = useState<ProfileImageSize>("medium")
  const [sendReadReceipts, setSendReadReceipts] = useState(false)

  return <Form>
    <Section
      header={<Text>Notifications</Text>}
    >
      <Picker
        title={"Notify Me About"}
        value={notifyMeAbout}
        onChanged={setNotifyMeAbout as any}
      >
        <Text
          tag={"directMessages"}
        >Direct Messages</Text>
        <Text
          tag={"mentions"}
        >Mentions</Text>
        <Text
          tag={"anything"}
        >Anything</Text>
      </Picker>

      <Toggle
        title={"Play notification sounds"}
        value={playNotificationSounds}
        onChanged={setPlayNotificationSounds}
      />
      <Toggle
        title={"Send read receipts"}
        value={sendReadReceipts}
        onChanged={setSendReadReceipts}
      />
    </Section>

    <Section
      header={<Text>User Profiles</Text>}
    >
      <Picker
        title={"Profile Image Size"}
        value={profileImageSize}
        onChanged={setprofileImageSize as any}
      >
        <Text
          tag={"large"}
        >Large</Text>
        <Text
          tag={"medium"}
        >Medium</Text>
        <Text
          tag={"small"}
        >Small</Text>
      </Picker>

      <Button
        title={"Clear Image Cache"}
        action={() => { }}
      />
    </Section>
  </Form>
}`