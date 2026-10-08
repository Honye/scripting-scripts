import {
  AppEvents,
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationLink,
  NavigationStack,
  ProgressView,
  Section,
  Spacer,
  Text,
  VStack,
  Widget,
  useEffect,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { agoShort, compact, failureText, percent, untilShort } from '../format'
import { isSnapshotCurrent, metersFor, worstMeter } from '../limits'
import { refreshProfile } from '../refresh'
import {
  forgetProfile,
  loadProfiles,
  loadSnapshots,
  saveProfiles
} from '../store'
import { UsageRing } from '../components/UsageRing'
import { AccountDetail } from './AccountDetail'
import { ProfileEditor } from './ProfileEditor'
import type { Profile, UsageSnapshot } from '../types'

/** Snapshots younger than this are shown as-is on launch instead of refetched. */
const FRESH_MS = 2 * 60 * 1000

/**
 * Owns all persisted state: one `useState` per collection, flowing down as
 * props, with `useEffect` mirroring profile edits into Storage (the repo
 * convention, as in Storefront's `App`). Snapshots are written to Storage by
 * `refreshProfile` itself, which the widget shares.
 */
export function App() {
  const [profiles, setProfiles] = useState<Profile[]>(() => loadProfiles())
  const [snapshots, setSnapshots] = useState<Record<string, UsageSnapshot>>(
    () => loadSnapshots()
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    saveProfiles(profiles)
    Widget.reloadAll()
  }, [profiles])

  const refreshOne = async (profile: Profile) => {
    setLoading((prev) => ({ ...prev, [profile.id]: true }))
    const res = await refreshProfile(profile)
    setLoading((prev) => ({ ...prev, [profile.id]: false }))
    if (res.ok) {
      setSnapshots((prev) => ({ ...prev, [profile.id]: res.value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[profile.id]
        return next
      })
    } else {
      setErrors((prev) => ({ ...prev, [profile.id]: failureText(res) }))
    }
  }

  const refreshAll = async (force: boolean) => {
    const now = Date.now()
    const due = profiles.filter(
      (p) => force || (snapshots[p.id]?.fetchedAt ?? 0) < now - FRESH_MS
    )
    await Promise.all(due.map(refreshOne))
    if (due.length > 0) Widget.reloadAll()
  }

  useEffect(() => {
    refreshAll(false)
  }, [])

  // The widget may have fetched while the app sat in the background.
  useEffect(() => {
    const listener = (phase: 'active' | 'inactive' | 'background') => {
      if (phase === 'active') setSnapshots(loadSnapshots())
    }
    AppEvents.scenePhase.addListener(listener)
    return () => AppEvents.scenePhase.removeListener(listener)
  }, [])

  const upsertProfile = (profile: Profile) => {
    setProfiles((prev) => {
      const index = prev.findIndex((p) => p.id === profile.id)
      if (index < 0) return [...prev, { ...profile, sortIndex: prev.length }]
      const next = [...prev]
      next[index] = { ...profile, sortIndex: prev[index].sortIndex }
      return next
    })
  }

  const setWatch = (
    profileId: string,
    script: string,
    dailyRequests: number | null
  ) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== profileId) return p
        const others = p.watched.filter((w) => w.script !== script)
        return {
          ...p,
          watched:
            dailyRequests == null
              ? others
              : [...others, { script, dailyRequests }]
        }
      })
    )
  }

  const addProfile = async () => {
    const created = await Navigation.present<Profile | undefined>({
      element: <ProfileEditor />
    })
    if (created == null) return
    upsertProfile(created)
    refreshOne(created)
  }

  const deleteProfile = async (profile: Profile) => {
    const ok = await Dialog.confirm({
      title: i18n.delete,
      message: i18n.deleteProfileConfirm(profile.alias),
      cancelLabel: i18n.cancel,
      confirmLabel: i18n.delete
    })
    if (!ok) return
    forgetProfile(profile.id)
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id))
    setSnapshots((prev) => {
      const next = { ...prev }
      delete next[profile.id]
      return next
    })
  }

  return (
    <NavigationStack>
      <List
        navigationTitle={i18n.appTitle}
        refreshable={() => refreshAll(true)}
        toolbar={{
          topBarTrailing: [
            <Button action={addProfile}>
              <Image systemName="plus" />
            </Button>
          ]
        }}
      >
        {profiles.length === 0 ? (
          <Section footer={<Text>{i18n.profilesEmptyHint}</Text>}>
            <Text foregroundStyle="secondaryLabel">{i18n.profilesEmpty}</Text>
          </Section>
        ) : (
          <Section
            header={<Text>{i18n.profilesHeader}</Text>}
            footer={<Text>{i18n.alertsFooter}</Text>}
          >
            {profiles.map((profile) => (
              <NavigationLink
                key={profile.id}
                destination={
                  <AccountDetail
                    profile={profile}
                    snapshot={snapshots[profile.id]}
                    loading={loading[profile.id] === true}
                    error={errors[profile.id]}
                    onRefresh={() => refreshOne(profile)}
                    onSave={(next) => {
                      upsertProfile(next)
                      refreshOne(next)
                    }}
                    onWatch={(script, cap) => setWatch(profile.id, script, cap)}
                  />
                }
                trailingSwipeActions={{
                  allowsFullSwipe: false,
                  actions: [
                    <Button
                      title={i18n.delete}
                      role="destructive"
                      action={() => deleteProfile(profile)}
                    />
                  ]
                }}
              >
                <ProfileRow
                  profile={profile}
                  snapshot={snapshots[profile.id]}
                  loading={loading[profile.id] === true}
                  error={errors[profile.id]}
                />
              </NavigationLink>
            ))}
          </Section>
        )}
      </List>
    </NavigationStack>
  )
}

function ProfileRow({
  profile,
  snapshot,
  loading,
  error
}: {
  profile: Profile
  snapshot?: UsageSnapshot
  loading: boolean
  error?: string
}) {
  const now = Date.now()
  const current = snapshot != null && isSnapshotCurrent(snapshot, now)
  const worst = current ? worstMeter(metersFor(profile, snapshot!)) : null
  const ratio = worst?.ratio ?? 0

  return (
    <HStack spacing={12} padding={{ vertical: 4 }}>
      <UsageRing ratio={ratio} size={40} lineWidth={5}>
        {loading ? (
          <ProgressView progressViewStyle="circular" controlSize="mini" />
        ) : (
          <Text font={10} fontWeight="semibold" monospacedDigit>
            {worst != null ? percent(ratio) : '–'}
          </Text>
        )}
      </UsageRing>
      <VStack alignment="leading" spacing={2}>
        <Text font="headline" lineLimit={1}>
          {profile.alias}
        </Text>
        <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>
          {profile.accountName} ·{' '}
          {profile.plan === 'free' ? i18n.planFree : i18n.planPaid}
        </Text>
        {error != null ? (
          <Text font="caption2" foregroundStyle="systemRed" lineLimit={2}>
            {error}
          </Text>
        ) : null}
      </VStack>
      <Spacer />
      <VStack alignment="trailing" spacing={2}>
        {worst != null ? (
          <Text font="subheadline" monospacedDigit>
            {compact(worst.used)} / {compact(worst.limit)}
          </Text>
        ) : null}
        <Text font="caption2" foregroundStyle="secondaryLabel">
          {snapshot == null
            ? i18n.neverUpdated
            : !current
              ? i18n.staleSnapshot
              : profile.plan === 'free'
                ? i18n.resetsIn(untilShort(snapshot.periodEnd, now))
                : i18n.updatedAgo(agoShort(snapshot.fetchedAt, now))}
        </Text>
      </VStack>
    </HStack>
  )
}
