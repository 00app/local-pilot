/**
 * Social engine — the "normalization layer" for The Triangle.
 *
 * The three SearchAPI engines we call (`instagram_profile`, `tiktok_profile`,
 * `facebook_business_page`) return wildly different JSON shapes. This module
 * converts each raw payload into a single `SocialSignal` shape so downstream
 * widgets (The Pulse, The Triangle, Pilot Intercom) only ever speak one
 * language. It also contains the two pieces of cross-platform intelligence
 * that the strategy engine alone can't express:
 *
 *   • `calculateFreshnessLeader()` — which platform is carrying the neighbourhood
 *     signal right now (most recent post within 24h; engagement breaks ties).
 *   • `detectViral()` — is a post running 5× a handle's own baseline? If yes,
 *     ship it to Google *immediately* — that's a rare "mirror the pulse" window.
 */

export type SocialPlatform = "instagram" | "tiktok" | "facebook"

/** The one shape every widget speaks. */
export interface SocialSignal {
  platform: SocialPlatform
  handle: string
  displayName?: string
  mediaUrl?: string
  mediaType: "image" | "video"
  caption: string
  engagement: number
  views?: number
  followers?: number
  timestamp: string
  permalink?: string
  isLive: boolean
}

/** Raw SearchAPI payload — loose on purpose, each engine fills different keys. */
export interface RawSocialPayload {
  username?: string
  handle?: string
  full_name?: string
  display_name?: string
  page_name?: string
  followers?: number
  likes?: number
  page_id?: string
  post?: {
    /** SearchAPI instagram_profile uses `link` for the primary image URL. */
    link?: string
    image_url?: string
    thumbnail_url?: string
    caption?: string
    likes?: number
    comments?: number
    shares?: number
    views?: number
    posted_at?: string
    permalink?: string
  }
  isLive?: boolean
}

/**
 * Convert a raw SearchAPI.io payload into a uniform `SocialSignal`.
 * Returns `null` when the payload has no post to normalise — simpler for
 * callers than a half-empty signal.
 */
export function normalizeSocialData(
  platform: SocialPlatform,
  raw: RawSocialPayload | null | undefined,
): SocialSignal | null {
  if (!raw?.post) return null
  const p = raw.post
  const engagement = (p.likes || 0) + (p.comments || 0) + (p.shares || 0)
  return {
    platform,
    handle: raw.username || raw.handle || raw.page_id || "",
    displayName: raw.full_name || raw.display_name || raw.page_name,
    mediaUrl: p.image_url || p.thumbnail_url || p.link,
    mediaType: platform === "tiktok" ? "video" : "image",
    caption: (p.caption || "").toString(),
    engagement,
    views: p.views,
    followers: raw.followers || raw.likes,
    timestamp: p.posted_at || new Date().toISOString(),
    permalink: p.permalink,
    isLive: Boolean(raw.isLive),
  }
}

export interface FreshnessLeader {
  signal: SocialSignal
  hoursOld: number
  isRecent: boolean // under 24h
  tieBreaker: "recency" | "engagement"
}

/**
 * Pick the platform carrying the neighbourhood signal right now.
 *
 * Spec: "The platform with a post < 24h old wins. Tie-breaker: if all are
 * fresh, the one with the highest engagement gets the green ring."
 *
 * So the rule is actually a two-pass sort:
 *   1. If any signal is <24h, only compare among those; otherwise compare all.
 *   2. Within the chosen bucket, sort by timestamp desc, then engagement desc.
 */
export function calculateFreshnessLeader(
  signals: SocialSignal[],
): FreshnessLeader | null {
  if (signals.length === 0) return null
  const now = Date.now()

  const withAge = signals.map((s) => ({
    signal: s,
    hoursOld: (now - new Date(s.timestamp).getTime()) / 3_600_000,
  }))

  const recent = withAge.filter((x) => x.hoursOld < 24)
  const pool = recent.length > 0 ? recent : withAge

  // Inside the pool, sort by recency then engagement (both desc).
  pool.sort((a, b) => {
    if (a.hoursOld !== b.hoursOld) return a.hoursOld - b.hoursOld
    return b.signal.engagement - a.signal.engagement
  })

  // Tie-breaker annotation: if the top two have the same hoursOld, the
  // engagement step decided. (We only look at #1 vs #2, not a full chain.)
  const top = pool[0]
  const runnerUp = pool[1]
  const tieBreaker: FreshnessLeader["tieBreaker"] =
    runnerUp && runnerUp.hoursOld === top.hoursOld ? "engagement" : "recency"

  return {
    signal: top.signal,
    hoursOld: top.hoursOld,
    isRecent: top.hoursOld < 24,
    tieBreaker,
  }
}

export interface ViralSignal {
  signal: SocialSignal
  multiplier: number
  baseline: number
}

/**
 * Detect a post punching 5× above a handle's own baseline.
 *
 * We don't have per-handle historical data in the PoC, so we ship a practical
 * heuristic tuned to the SearchAPI payloads we get today:
 *
 *   • TikTok: `views >= 5 * followers` is the canonical viral signal. Followers
 *     act as the baseline since video reach is roughly proportional to follower
 *     count on the for-you page.
 *   • Instagram / Facebook: `engagement >= 5 * typical_engagement_rate * followers`.
 *     We use 3% as the typical rate on IG (industry median 1–3%) and 1% on FB,
 *     so the trigger becomes `engagement >= 0.15 * followers` (IG) or `0.05`
 *     (FB). A handle with 10k followers and 1500 likes = viral on IG.
 *
 * Returns `null` if we can't confidently call it viral.
 */
export function detectViral(signal: SocialSignal): ViralSignal | null {
  const followers = signal.followers || 0
  if (followers < 100) return null // too small to be meaningful

  if (signal.platform === "tiktok") {
    const views = signal.views || 0
    if (views >= followers * 5) {
      return {
        signal,
        multiplier: Math.round(views / Math.max(1, followers)),
        baseline: followers,
      }
    }
  } else {
    const rate = signal.platform === "instagram" ? 0.03 : 0.01
    const baseline = Math.max(5, followers * rate)
    if (signal.engagement >= baseline * 5) {
      return {
        signal,
        multiplier: Math.round(signal.engagement / baseline),
        baseline: Math.round(baseline),
      }
    }
  }
  return null
}

/** Human-readable age label consistent with the grid's `5m / 2h / 3d` rhythm. */
export function formatAge(iso: string): string {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 60) return `${min}m`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.round(hr / 24)}d`
}
