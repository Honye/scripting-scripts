import {
  Button,
  Form,
  HStack,
  Navigation,
  NavigationStack,
  Picker,
  Section,
  Spacer,
  Text,
  TextField,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { regionFor } from '../regions'
import { joinUrlFor, parseJoinCode } from '../api/testflight'
import { tfStatusLabel } from '../tf_status'
import type { Account, TFItem, TFStatus } from '../types'

const STATUSES: TFStatus[] = ['open', 'full', 'closed', 'invalid', 'unknown']

/** FR-TF-01, FR-TF-02, FR-TF-04. */
export function TFEditor({
  existing,
  accounts
}: {
  existing?: TFItem
  accounts: Account[]
}) {
  const dismiss = Navigation.useDismiss()

  const [id] = useState(existing?.id ?? UUID.string())
  const [name, setName] = useState(existing?.name ?? '')
  const [link, setLink] = useState(existing?.joinUrl ?? '')
  const [accountId, setAccountId] = useState(existing?.accountId ?? '')
  const [status, setStatus] = useState<TFStatus>(existing?.status ?? 'unknown')
  const [isManual, setIsManual] = useState(existing?.statusIsManual ?? false)
  const [note, setNote] = useState(existing?.note ?? '')

  const code = parseJoinCode(link)
  const linkInvalid = link.trim() !== '' && code == null
  const canSave = name.trim() !== '' && code != null

  const handleSave = () => {
    const item: TFItem = {
      id,
      name: name.trim(),
      joinUrl: joinUrlFor(code!),
      accountId: accountId === '' ? undefined : accountId,
      status,
      statusCheckedAt: existing?.statusCheckedAt,
      // Only a status the user actually chose counts as manual; opening the
      // editor and leaving it alone must not freeze automatic detection.
      statusIsManual: isManual ? true : undefined,
      appId: existing?.appId,
      note: note.trim()
    }
    dismiss(item)
  }

  return (
    <NavigationStack>
      <Form
        navigationTitle={existing != null ? i18n.tfEdit : i18n.tfNew}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [<Button title={i18n.cancel} action={() => dismiss()} />],
          topBarTrailing: [
            <Button title={i18n.save} action={handleSave} disabled={!canSave} />
          ]
        }}
      >
        <Section
          footer={
            linkInvalid ? (
              <Text foregroundStyle="systemRed">{i18n.tfLinkInvalid}</Text>
            ) : undefined
          }
        >
          <TextField
            title={i18n.tfName}
            prompt={i18n.tfName}
            value={name}
            onChanged={setName}
          />
          <TextField
            title={i18n.tfLink}
            prompt={i18n.tfLinkPrompt}
            value={link}
            onChanged={setLink}
            textInputAutocapitalization="never"
            autocorrectionDisabled={true}
            keyboardType="URL"
          />
        </Section>

        <Section header={<Text>{i18n.tfAccount}</Text>}>
          <Picker
            title={i18n.tfAccount}
            value={accountId}
            onChanged={setAccountId}
          >
            <Text tag="">{i18n.tfAccountNone}</Text>
            {accounts.map((account) => (
              <Text key={account.id} tag={account.id}>
                {`${regionFor(account.region).flag} ${account.alias}`}
              </Text>
            ))}
          </Picker>
        </Section>

        <Section
          header={<Text>{i18n.tfSetStatus}</Text>}
          footer={
            isManual ? (
              <Text>{i18n.tfManual}</Text>
            ) : (
              <Text>{i18n.tfNoticeBody}</Text>
            )
          }
        >
          <Picker
            title={i18n.tfSetStatus}
            value={status}
            onChanged={(value: string) => {
              setStatus(value as TFStatus)
              setIsManual(true)
            }}
          >
            {STATUSES.map((value) => (
              <Text key={value} tag={value}>
                {tfStatusLabel(value)}
              </Text>
            ))}
          </Picker>
          {isManual ? (
            <Button title={i18n.tfManualClear} action={() => setIsManual(false)} />
          ) : null}
        </Section>

        <Section header={<Text>{i18n.accountNote}</Text>}>
          <TextField
            title={i18n.accountNote}
            prompt={i18n.optional}
            value={note}
            onChanged={setNote}
            axis="vertical"
          />
        </Section>
      </Form>
    </NavigationStack>
  )
}
