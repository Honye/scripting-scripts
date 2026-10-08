import {
  BarChart,
  Button,
  Chart,
  HStack,
  Image,
  List,
  Navigation,
  NavigationLink,
  ProgressView,
  Section,
  Spacer,
  Text,
  VStack,
  useEffect,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import {
  agoShort,
  compact,
  failureText,
  grouped,
  ms,
  untilShort,
  utcRange
} from '../format'
import { isSnapshotCurrent, metersFor } from '../limits'
import { listWorkers } from '../api/cloudflare'
import { getToken } from '../store'
import { MeterRow } from '../components/MeterRow'
import { ProfileEditor } from './ProfileEditor'
import { WorkerDetail } from './WorkerDetail'
import { Diagnostics } from './Diagnostics'
import type { Profile, UsageSnapshot, WorkerUsage } from '../types'

function StatRow({ title, value }: { title: string; value: string }) {
  return (
    <HStack>
      <Text>{title}</Text>
      <Spacer />
      <Text monospacedDigit foregroundStyle="secondaryLabel">
        {value}
      </Text>
    </HStack>
  )
}

export function AccountDetail({
  profile,
  snapshot,
  loading,
  error,
  onRefresh,
  onSave,
  onWatch
}: {
  profile: Profile
  snapshot?: UsageSnapshot
  loading: boolean
  error?: string
  onRefresh: () => Promise<void>
  onSave: (profile: Profile) => void
  onWatch: (script: string, dailyRequests: number | null) => void
}) {
  const now = Date.now()
  const current = snapshot != null && isSnapshotCurrent(snapshot, now)

  // Workers with no traffic this period are absent from the analytics rows, so
  // the full list comes from the scripts endpoint and is merged in.
  const [allScripts, setAllScripts] = useState<string[] | null>(null)
  const [scriptsError, setScriptsError] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken(profile.id)
    if (token == null) return
    listWorkers(token, profile.accountId).then((res) => {
      if (res.ok) {
        setAllScripts(res.value.map((w) => w.id))
        setScriptsError(null)
      } else {
        setScriptsError(failureText(res))
      }
    })
  }, [profile.id, profile.accountId])

  const edit = async () => {
    const next = await Navigation.present<Profile | undefined>({
      element: <ProfileEditor existing={profile} />
    })
    if (next != null) onSave(next)
  }

  const workers: WorkerUsage[] = (() => {
    const known = snapshot?.perWorker ?? []
    const names = new Set(known.map((w) => w.script))
    const idle = (allScripts ?? [])
      .filter((name) => !names.has(name))
      .sort()
      .map<WorkerUsage>((script) => ({
        script,
        requests: 0,
        subrequests: 0,
        errors: 0,
        todayRequests: 0
      }))
    return [...known, ...idle]
  })()

  const meters = current ? metersFor(profile, snapshot!) : []
  const windowLabel =
    snapshot != null ? utcRange(snapshot.windowStart, snapshot.fetchedAt) : ''

  return (
    <List
      navigationTitle={profile.alias}
      refreshable={onRefresh}
      toolbar={{
        topBarTrailing: [
          <Button action={() => onRefresh()} disabled={loading}>
            {loading ? (
              <ProgressView progressViewStyle="circular" />
            ) : (
              <Image systemName="arrow.clockwise" />
            )}
          </Button>,
          <Button title={i18n.edit} action={edit} />
        ]
      }}
    >
      <Section
        header={<Text>{i18n.usage}</Text>}
        footer={
          snapshot != null ? (
            <Text>
              {profile.accountName} ·{' '}
              {i18n.updatedAgo(agoShort(snapshot.fetchedAt, now))}
            </Text>
          ) : undefined
        }
      >
        {error != null ? (
          <Text font="footnote" foregroundStyle="systemRed">
            {error}
          </Text>
        ) : null}
        {snapshot == null ? (
          <Text foregroundStyle="secondaryLabel">{i18n.neverUpdated}</Text>
        ) : !current ? (
          <Text foregroundStyle="secondaryLabel">{i18n.staleSnapshot}</Text>
        ) : (
          meters.map((meter) => (
            <MeterRow
              key={meter.kind}
              title={
                meter.kind === 'cpu'
                  ? i18n.cpuPeriod
                  : profile.plan === 'free'
                    ? i18n.requestsToday
                    : i18n.requestsPeriod
              }
              meter={meter}
              unit={meter.kind === 'cpu' ? 'ms' : undefined}
              caption={i18n.resetsIn(untilShort(snapshot.periodEnd, now))}
            />
          ))
        )}
      </Section>

      {snapshot != null ? (
        <Section header={<Text>{windowLabel} (UTC)</Text>}>
          <StatRow
            title={
              profile.plan === 'free' ? i18n.requestsMonth : i18n.requestsPeriod
            }
            value={grouped(
              snapshot.window.requests + (snapshot.pagesWindow ?? 0)
            )}
          />
          <StatRow title={i18n.cpuTime} value={ms(snapshot.window.cpuMs)} />
          <StatRow
            title={i18n.subrequests}
            value={grouped(snapshot.window.subrequests)}
          />
          <StatRow
            title={i18n.errors}
            value={grouped(snapshot.window.errors)}
          />
          {snapshot.pagesWindow != null ? (
            <StatRow
              title={i18n.pagesFunctions}
              value={grouped(snapshot.pagesWindow)}
            />
          ) : null}
          {snapshot.warnings.includes('pages') ? (
            <Text font="caption" foregroundStyle="systemOrange">
              {i18n.pagesUnavailable}
            </Text>
          ) : null}
          {snapshot.warnings.includes('cpu') ? (
            <Text font="caption" foregroundStyle="systemOrange">
              {i18n.cpuUnavailable}
            </Text>
          ) : null}
        </Section>
      ) : null}

      {snapshot != null && snapshot.hourly.length > 0 ? (
        <Section header={<Text>{i18n.last24h}</Text>}>
          <Chart frame={{ height: 160 }} padding={{ vertical: 8 }}>
            <BarChart
              marks={snapshot.hourly.map((p) => ({
                label: new Date(p.t),
                value: p.requests,
                unit: 'hour',
                foregroundStyle: 'systemOrange'
              }))}
            />
          </Chart>
        </Section>
      ) : null}

      <Section
        header={<Text>{i18n.workers}</Text>}
        footer={
          scriptsError != null ? (
            <Text>{`${i18n.loadWorkersFailed}: ${scriptsError}`}</Text>
          ) : undefined
        }
      >
        {workers.length === 0 ? (
          <Text foregroundStyle="secondaryLabel">{i18n.workersEmpty}</Text>
        ) : (
          workers.map((worker) => {
            const watched = profile.watched.find(
              (w) => w.script === worker.script
            )
            return (
              <NavigationLink
                key={worker.script}
                destination={
                  <WorkerDetail
                    profile={profile}
                    script={worker.script}
                    onWatch={onWatch}
                  />
                }
              >
                <HStack>
                  {watched != null ? (
                    <Image
                      systemName="bell.fill"
                      font="caption"
                      foregroundStyle="systemOrange"
                    />
                  ) : null}
                  <Text lineLimit={1}>{worker.script}</Text>
                  <Spacer />
                  <VStack alignment="trailing" spacing={1}>
                    <Text monospacedDigit>{compact(worker.todayRequests)}</Text>
                    <Text
                      font="caption2"
                      foregroundStyle="secondaryLabel"
                      monospacedDigit
                    >
                      {compact(worker.requests)} · {ms(worker.cpuMs)}
                    </Text>
                  </VStack>
                </HStack>
              </NavigationLink>
            )
          })
        )}
      </Section>

      <Section>
        <NavigationLink destination={<Diagnostics profile={profile} />}>
          <HStack>
            <Image systemName="stethoscope" />
            <Text>{i18n.diagnostics}</Text>
          </HStack>
        </NavigationLink>
      </Section>
    </List>
  )
}
