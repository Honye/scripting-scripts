import type { PlaySource, Show } from './types'
import { i18n } from './i18n'

/** Synthetic source id standing for the hand-entered `Show.playUrl`. */
export const CUSTOM_SOURCE_ID = 'custom'

/**
 * Douban sometimes reports a zero episode count for subjects it has no episode
 * data for, formatting it as "0集全" / "更新至0集". That tells the user nothing
 * and reads as wrong next to a show they know has episodes, so drop it.
 * A leading digit guard keeps "10集全" / "更新至20集" intact.
 */
export function cleanEpisodesInfo(raw?: string): string | undefined {
  const value = raw?.trim()
  if (!value) return undefined
  return /(^|[^0-9])0\s*集/.test(value) ? undefined : value
}

/** The "36集全 · VIP免费观看" line under a source's name. Empty when neither is known. */
export function sourceSubtitle(source: PlaySource): string {
  return [cleanEpisodesInfo(source.episodesInfo), source.paymentDesc]
    .filter(Boolean)
    .join(' · ')
}

/** Every source the user can pick: discovered vendors first, the manual link last. */
export function listSources(show: Show): PlaySource[] {
  const sources = [...(show.sources ?? [])]
  const custom = show.playUrl?.trim()
  if (custom) {
    sources.push({
      id: CUSTOM_SOURCE_ID,
      title: i18n.sourceCustom,
      uri: custom
    })
  }
  return sources
}

/** The source list rows, the widget and the app intent all jump to. */
export function preferredSource(show: Show): PlaySource | undefined {
  const sources = listSources(show)
  if (sources.length === 0) return undefined
  const picked = sources.find((s) => s.id === show.defaultSourceId)
  return picked ?? sources[0]
}

/** True when the show has anything to play — drives the play badge. */
export function hasPlayable(show: Show): boolean {
  return listSources(show).length > 0
}

/** Douban's own subject page, used when a vendor exposes no http URL. */
export function doubanFallbackUrl(show: Show): string | undefined {
  return show.doubanId
    ? `https://movie.douban.com/subject/${show.doubanId}/`
    : undefined
}

/** Query param that pins a vendor link to a single episode, keyed by vendor id. */
const EPISODE_PARAM: Record<string, string> = {
  qq: 'vid',
  iqiyi: 'tvid'
}

/**
 * Strip the episode-pinning parameter from a vendor deep link.
 *
 * Douban links 腾讯视频 with `vid=` and 爱奇艺 with `tvid=`, both pointing at the
 * first episode, so tapping through always restarted the series. Dropping them
 * leaves the series id (`cid`/`aid`), which opens the show's page and lets the
 * platform app resume from its own saved position. Vendors whose links are
 * already season-level (bilibili, youku, miguvideo) are left untouched.
 */
export function seriesLevelUri(source: PlaySource): string | undefined {
  const uri = source.uri
  const param = EPISODE_PARAM[source.id]
  if (!uri || !param) return uri
  const cut = uri.indexOf('?')
  if (cut < 0) return uri
  const pairs = uri.slice(cut + 1).split('&').filter(Boolean)
  const valueOf = (key: string) =>
    pairs.find((p) => p.startsWith(`${key}=`))?.slice(key.length + 1)
  // 爱奇艺 repeats the same id for a standalone video (a film) — nothing to strip.
  if (source.id === 'iqiyi' && valueOf('aid') === valueOf('tvid')) return uri
  const kept = pairs.filter((p) => !p.startsWith(`${param}=`))
  if (kept.length === pairs.length) return uri
  const base = uri.slice(0, cut)
  return kept.length > 0 ? `${base}?${kept.join('&')}` : base
}

/**
 * The URL a widget `Link` should point at for this show.
 *
 * Widgets cannot use `openSource`: a widget extension runs out-of-process, so an
 * AppIntent's `perform` has no way to open a URL. Only `Link`/`widgetURL` work,
 * and they take a single URL decided at render time — there is no runtime
 * fallback if the platform app turns out not to be installed.
 */
export function widgetPlayUrl(show: Show): string | undefined {
  const source = preferredSource(show)
  if (!source) return undefined
  return seriesLevelUri(source) ?? source.url ?? doubanFallbackUrl(show)
}

/**
 * Open a source, preferring the platform app.
 * `Safari.openURL` resolves false when no installed app handles the scheme —
 * the only "is it installed" signal available — so fall back down the chain:
 * app deep link, then the vendor's web page, then the Douban subject page.
 */
export async function openSource(show: Show, source: PlaySource): Promise<boolean> {
  const candidates = [seriesLevelUri(source), source.url, doubanFallbackUrl(show)]
  for (const url of candidates) {
    if (!url) continue
    try {
      if (await Safari.openURL(url)) return true
    } catch {
      // A malformed URL must not abort the rest of the chain.
    }
  }
  // Widget taps run without a UI to attach an alert to, so this is best-effort.
  try {
    await Dialog.alert({
      title: i18n.playFailedTitle,
      message: i18n.playFailedMessage(source.title)
    })
  } catch {
    console.error(`Epical: no way to open ${source.title}`)
  }
  return false
}

/** Convenience for the poster / widget tap: open whatever the show defaults to. */
export async function openPreferred(show: Show): Promise<boolean> {
  const source = preferredSource(show)
  return source ? openSource(show, source) : false
}
