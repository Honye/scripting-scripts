import {
  BarChart,
  Chart,
  HStack,
  List,
  Picker,
  ProgressView,
  Section,
  Spacer,
  Text,
  TextField,
  Toggle,
  useEffect,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { failureText, grouped, ms } from '../format'
import { fetchWorkerDetail } from '../api/usage'
import { rollupDaily } from '../api/usage_parse'
import { getToken } from '../store'
import type { WorkerDetailData } from '../api/usage'
import type { Profile } from '../types'

type Range = '24h' | '7d'
const RANGE_HOURS: Record<Range, number> = { '24h': 24, '7d': 24 * 7 }

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

export function WorkerDetail({
  profile,
  script,
  onWatch
}: {
  profile: Profile
  script: string
  /** `null` stops watching. Applied by `App` to its latest state, not to this prop. */
  onWatch: (script: string, dailyRequests: number | null) => void
}) {
  const [range, setRange] = useState<Range>('24h')
  const [data, setData] = useState<WorkerDetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local copies: a pushed destination is not guaranteed to re-render when the
  // parent's profile changes, so the toggle must not depend on the prop alone.
  const initial = profile.watched.find((w) => w.script === script)
  const [watching, setWatching] = useState(initial != null)
  const [capText, setCapText] = useState(
    String(initial?.dailyRequests ?? 10000)
  )

  const load = async () => {
    const token = getToken(profile.id)
    if (token == null) return
    setLoading(true)
    const res = await fetchWorkerDetail(
      token,
      profile.accountId,
      script,
      RANGE_HOURS[range]
    )
    setLoading(false)
    if (res.ok) {
      setData(res.value)
      setError(null)
    } else {
      setError(failureText(res))
    }
  }

  useEffect(() => {
    load()
  }, [range])

  const setWatch = (on: boolean, capValue: string = capText) => {
    const cap = Number(capValue.replace(/[,_\s]/g, ''))
    setWatching(on)
    if (!on) {
      onWatch(script, null)
    } else if (Number.isFinite(cap) && cap > 0) {
      onWatch(script, Math.round(cap))
    }
  }

  const points =
    data == null ? [] : range === '24h' ? data.series : rollupDaily(data.series)

  return (
    <List navigationTitle={script} refreshable={load}>
      <Section>
        <Picker
          title=""
          value={range}
          onChanged={(value: string) => setRange(value as Range)}
          pickerStyle="segmented"
        >
          <Text tag="24h">{i18n.range24h}</Text>
          <Text tag="7d">{i18n.range7d}</Text>
        </Picker>
        {error != null ? (
          <Text font="footnote" foregroundStyle="systemRed">
            {error}
          </Text>
        ) : null}
        {data == null && loading ? <ProgressView /> : null}
        {points.length > 0 ? (
          <Chart frame={{ height: 180 }} padding={{ vertical: 8 }}>
            <BarChart
              marks={points.map((p) => ({
                label: new Date(p.t),
                value: p.requests,
                unit: range === '24h' ? 'hour' : 'day',
                foregroundStyle: 'systemOrange'
              }))}
            />
          </Chart>
        ) : null}
      </Section>

      {data != null ? (
        <Section
          header={<Text>{range === '24h' ? i18n.last24h : i18n.range7d}</Text>}
        >
          <StatRow
            title={i18n.invocations}
            value={grouped(data.totals.requests)}
          />
          <StatRow
            title={i18n.subrequests}
            value={grouped(data.totals.subrequests)}
          />
          <StatRow title={i18n.errors} value={grouped(data.totals.errors)} />
          <StatRow title={i18n.cpuTime} value={ms(data.totals.cpuMs)} />
          <StatRow title={i18n.cpuP50} value={ms(data.quantiles?.cpuP50)} />
          <StatRow title={i18n.cpuP99} value={ms(data.quantiles?.cpuP99)} />
          <StatRow title={i18n.wallP50} value={ms(data.quantiles?.wallP50)} />
          <StatRow title={i18n.wallP99} value={ms(data.quantiles?.wallP99)} />
        </Section>
      ) : null}

      <Section footer={<Text>{i18n.watchFooter}</Text>}>
        <Toggle
          title={i18n.watch}
          value={watching}
          onChanged={(on: boolean) => setWatch(on)}
        />
        {watching ? (
          <HStack>
            <Text>{i18n.watchCap}</Text>
            <Spacer />
            <TextField
              title={i18n.watchCap}
              value={capText}
              onChanged={(value: string) => {
                setCapText(value)
                setWatch(true, value)
              }}
              keyboardType="numberPad"
              multilineTextAlignment="trailing"
              frame={{ maxWidth: 140 }}
            />
          </HStack>
        ) : null}
      </Section>
    </List>
  )
}
