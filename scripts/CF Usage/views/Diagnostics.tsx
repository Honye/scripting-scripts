import {
  Button,
  HStack,
  Image,
  List,
  ProgressView,
  Section,
  Text,
  VStack,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { runProbes } from '../api/usage'
import { getToken } from '../store'
import type { Probe } from '../api/usage'
import type { Profile } from '../types'

/**
 * Runs each GraphQL query shape separately and shows Cloudflare's raw answer.
 * The usage fields beyond `requests` are not all in the published docs; this is
 * how a rejected field name gets spotted and fixed on the first device run.
 */
export function Diagnostics({ profile }: { profile: Profile }) {
  const [probes, setProbes] = useState<Probe[]>([])
  const [running, setRunning] = useState(false)

  const run = async () => {
    const token = getToken(profile.id)
    if (token == null) return
    setRunning(true)
    setProbes(await runProbes(token, profile.accountId))
    setRunning(false)
  }

  return (
    <List navigationTitle={i18n.diagnostics}>
      <Section footer={<Text>{profile.accountId}</Text>}>
        <Button action={run} disabled={running}>
          <HStack>
            <Text>{i18n.runProbes}</Text>
            {running ? <ProgressView progressViewStyle="circular" /> : null}
          </HStack>
        </Button>
      </Section>
      {probes.map((probe) => (
        <Section key={probe.name}>
          <VStack alignment="leading" spacing={4}>
            <HStack>
              <Image
                systemName={
                  probe.ok ? 'checkmark.circle.fill' : 'xmark.octagon.fill'
                }
                foregroundStyle={probe.ok ? 'systemGreen' : 'systemRed'}
              />
              <Text font="headline">{probe.name}</Text>
            </HStack>
            <Text font="caption" fontDesign="monospaced" textSelection>
              {probe.detail}
            </Text>
          </VStack>
        </Section>
      ))}
    </List>
  )
}
