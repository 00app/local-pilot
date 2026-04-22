"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { MapPin, ExternalLink, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PilotInfo, PILOT_TINT } from "@/components/pilot-info"
import {
  generateStrategy,
  type PostTone,
  type EnvMode,
  type OvenHeat,
} from "@/lib/strategy"
import {
  calculateFreshnessLeader,
  detectViral,
  formatAge,
  type SocialSignal,
  type SocialPlatform,
} from "@/lib/social-engine"
import { proxiedSocialImageUrl } from "@/lib/social-image-url"

/**
 * The Triangle — cross-platform social pulse.
 *
 * Aggregates the latest post from Instagram (`instagram_profile`), TikTok
 * (`tiktok_profile`), and Facebook (`facebook_business_page`) plus a Google
 * Maps pin (`google_maps`) into one Col-12 module. Identifies the freshest
 * platform and lets the Pilot syndicate that post to Google Posts via
 * `generateStrategy()` so the three social channels compound into local-SEO
 * freshness rather than leaking into separate silos.
 */

export type TrianglePlatform = SocialPlatform

export interface TriangleSocial {
  platform: TrianglePlatform
  handle: string
  displayName?: string
  followers?: number
  views?: number
  latestPost?: {
    image?: string
    caption: string
    likes?: number
    comments?: number
    postedAt: string
    permalink?: string
  }
  isLive: boolean
}

/**
 * Map the UI-facing `TriangleSocial` into the flat `SocialSignal` the
 * engine operates on. Returns null when there's no post to analyse.
 */
function toSignal(ts: TriangleSocial): SocialSignal | null {
  if (!ts.latestPost) return null
  return {
    platform: ts.platform,
    handle: ts.handle,
    displayName: ts.displayName,
    mediaUrl: ts.latestPost.image,
    mediaType: ts.platform === "tiktok" ? "video" : "image",
    caption: ts.latestPost.caption,
    engagement:
      (ts.latestPost.likes || 0) + (ts.latestPost.comments || 0),
    views: ts.views,
    followers: ts.followers,
    timestamp: ts.latestPost.postedAt,
    permalink: ts.latestPost.permalink,
    isLive: ts.isLive,
  }
}

export interface TriangleMapsPin {
  query: string
  lat?: number
  lng?: number
  topResultName?: string
  topResultAddress?: string
  nearbyCount: number
  isLive: boolean
}

interface SocialTriangleCardProps {
  postcode: string
  street?: string
  instagramHandle?: string
  tiktokHandle?: string
  facebookPage?: string
  initialSocials?: TriangleSocial[]
  initialMapsPin?: TriangleMapsPin
  envMode?: EnvMode
  ovenStatus?: OvenHeat
  defaultTone?: PostTone
  /**
   * Maps `q` query string — replaces the legacy hardcoded `bakery <postcode>`
   * seed so rescan surfaces the correct vertical for any business.
   */
  businessQuery?: string
}

const PLATFORM_META: Record<
  TrianglePlatform,
  { label: string; tint: string; textOn: string; icon: React.ReactNode }
> = {
  instagram: {
    label: "Instagram",
    tint: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500",
    textOn: "text-white",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  tiktok: {
    label: "TikTok",
    tint: "bg-black dark:bg-white",
    textOn: "text-white dark:text-black",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
  facebook: {
    label: "Facebook",
    tint: "bg-blue-600",
    textOn: "text-white",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
}

export function SocialTriangleCard({
  postcode,
  street = "your street",
  instagramHandle,
  tiktokHandle,
  facebookPage,
  initialSocials = [],
  initialMapsPin,
  envMode,
  ovenStatus,
  defaultTone = "direct",
  businessQuery,
}: SocialTriangleCardProps) {
  const [socials, setSocials] = useState<TriangleSocial[]>(initialSocials)
  const [mapsPin, setMapsPin] = useState<TriangleMapsPin | undefined>(initialMapsPin)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState<TrianglePlatform | null>(null)

  const rescan = useCallback(async () => {
    setLoading(true)
    const promises: Promise<TriangleSocial | null>[] = []
    if (instagramHandle?.trim())
      promises.push(
        fetchSocial("/api/instagram", { username: instagramHandle }, "instagram"),
      )
    if (tiktokHandle?.trim())
      promises.push(
        fetchSocial("/api/tiktok", { username: tiktokHandle }, "tiktok"),
      )
    if (facebookPage?.trim())
      promises.push(
        fetchSocial("/api/facebook", { page: facebookPage }, "facebook"),
      )

    const mapsPromise = fetchJSON<TriangleMapsPin>("/api/maps", {
      postcode,
      q: businessQuery || postcode,
    })

    const [socialResults, mapsResult] = await Promise.all([
      Promise.all(promises),
      mapsPromise,
    ])
    setSocials(socialResults.filter((s): s is TriangleSocial => s !== null))
    if (mapsResult) setMapsPin(mapsResult)
    setLoading(false)
  }, [instagramHandle, tiktokHandle, facebookPage, postcode, businessQuery])

  // Only rescan on mount if we weren't handed initial snapshots.
  useEffect(() => {
    if (initialSocials.length === 0 && !initialMapsPin) {
      void rescan()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Normalise all UI socials into the engine's flat SocialSignal shape so
  // freshness + viral detection speak one language.
  const signals = useMemo<SocialSignal[]>(
    () => socials.map(toSignal).filter((s): s is SocialSignal => s !== null),
    [socials],
  )

  // Freshness leader — recency first, engagement breaks ties (see social-engine).
  const leader = useMemo(() => calculateFreshnessLeader(signals), [signals])
  const freshestPlatform = leader?.signal.platform ?? null

  // Viral detection — flag any signal running 5× its platform baseline. The
  // first time we see a given (platform · timestamp) pair, fire a priority
  // toast and remember it so we don't spam on re-renders.
  const viralShownRef = useRef<Set<string>>(new Set())
  const viral = useMemo(
    () =>
      signals
        .map((s) => detectViral(s))
        .filter((v): v is NonNullable<ReturnType<typeof detectViral>> => v !== null)
        .sort((a, b) => b.multiplier - a.multiplier)[0] ?? null,
    [signals],
  )

  useEffect(() => {
    if (!viral) return
    const key = `${viral.signal.platform}·${viral.signal.timestamp}`
    if (viralShownRef.current.has(key)) return
    viralShownRef.current.add(key)
    const label = PLATFORM_META[viral.signal.platform].label
    toast.success(`Your ${label} is trending.`, {
      description: `Running ${viral.multiplier}× baseline. Deploying as a 'what's new' Google post while the signal is hot.`,
      duration: 6000,
    })
  }, [viral])

  const isAnyLive = socials.some((s) => s.isLive) || Boolean(mapsPin?.isLive)

  const handleSyndicate = async (platform: TrianglePlatform) => {
    const source = socials.find((s) => s.platform === platform)
    if (!source?.latestPost) return
    setSyncing(platform)
    await new Promise((r) => setTimeout(r, 900))
    // Viral posts auto-upgrade to the "direct" tone to ride the wave without
    // dilution; non-viral posts use the caller's chosen default tone.
    const isViralSource = viral?.signal.platform === platform
    const tone: PostTone = isViralSource ? "direct" : defaultTone
    const translated = generateStrategy({
      caption: source.latestPost.caption,
      postcode,
      street,
      envMode,
      ovenStatus,
      tone,
    })
    setSyncing(null)
    toast.success(
      isViralSource
        ? `Riding the ${PLATFORM_META[platform].label} wave → Google.`
        : `Syndicated ${PLATFORM_META[platform].label} → Google`,
      {
        description: translated.optimized_post,
      },
    )
  }

  return (
    <div className="strategy-card-wide card-mint h-full">
      <p className="widget-index mb-2">08 · The triangle</p>
      <PilotInfo
        tint={PILOT_TINT.mint}
        title="signal-to-seo syndication"
        explanation="instagram is for aspiration, tiktok is for discovery, facebook is for community. google is for intent. the triangle picks the freshest of the three, strips the hashtags + emoji, rewrites the caption with your postcode, and syndicates it as a google 'what's new' post. a viral post (5× baseline) auto-ships to ride the wave while the signal is hot."
      />

      <div className="flex items-start justify-between gap-8 mb-6">
        <div>
          <p className="stat-massive">
            {socials.filter((s) => s.latestPost).length}
            <span className="text-4xl font-bold opacity-60 ml-2">
              / {[instagramHandle, tiktokHandle, facebookPage].filter(Boolean).length || 3}
            </span>
          </p>
          <p className="pilot-label">social channels live.</p>
        </div>

        <div className="text-left max-w-[50%]">
          <h3 className="text-xl font-bold">Social triangle.</h3>
          <p className="text-sm opacity-80 mt-1">
            {leader
              ? `${PLATFORM_META[leader.signal.platform].label} posted ${formatAge(
                  leader.signal.timestamp,
                )} — ${leader.tieBreaker === "engagement" ? "engagement winner" : "freshest signal"}.`
              : "Waiting for first cross-platform scan."}
          </p>
        </div>
      </div>

      {/* Triangle — three social cells + one maps cell */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {(["instagram", "tiktok", "facebook"] as TrianglePlatform[]).map((platform) => {
          const s = socials.find((x) => x.platform === platform)
          const meta = PLATFORM_META[platform]
          const isFresh = freshestPlatform === platform
          const isViral = viral?.signal.platform === platform
          return (
            <motion.div
              key={platform}
              layout
              className={`relative rounded-[18px] bg-white/45 p-3 flex flex-col gap-2 min-h-[160px] ${
                isViral
                  ? "ring-2 ring-[#FF4D4D]"
                  : isFresh
                  ? "ring-2 ring-[#2AE855]"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full ${meta.tint} ${meta.textOn} flex items-center justify-center shrink-0`}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{meta.label}</p>
                  <p className="text-[10px] font-mono opacity-60 truncate">
                    {s?.handle ? `@${s.handle}` : "not connected"}
                  </p>
                </div>
                {isViral ? (
                  <span
                    className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-full bg-[#FF4D4D] text-white font-semibold shrink-0"
                    title={`${viral!.multiplier}× platform baseline`}
                  >
                    <Flame className="w-2.5 h-2.5" />
                    {viral!.multiplier}×
                  </span>
                ) : isFresh ? (
                  <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full bg-[#2AE855] text-black font-semibold shrink-0">
                    fresh
                  </span>
                ) : null}
              </div>

              {s?.latestPost ? (
                <>
                  <div className="flex gap-2">
                    {s.latestPost.image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={proxiedSocialImageUrl(s.latestPost.image)}
                        alt={`${meta.label} latest`}
                        className="w-12 h-12 rounded-[10px] object-cover shrink-0 bg-black/5"
                      />
                    )}
                    <p className="text-[11px] leading-snug line-clamp-3 flex-1 opacity-85">
                      &quot;{s.latestPost.caption}&quot;
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <span className="text-[10px] font-mono opacity-70">
                      {formatAge(s.latestPost.postedAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSyndicate(platform)}
                      disabled={syncing === platform}
                      className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-[var(--card-fg)] text-[var(--card-bg)] hover:brightness-110 transition-all btn-squish disabled:opacity-60 flex items-center gap-1"
                    >
                      {syncing === platform ? (
                        <Spinner className="w-3 h-3" />
                      ) : (
                        <ExternalLink className="w-3 h-3" />
                      )}
                      {syncing === platform ? "syncing" : "→ google"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[11px] opacity-60 italic">
                  {loading ? "scanning…" : "no recent post"}
                </div>
              )}
            </motion.div>
          )
        })}

        {/* Maps cell — the geographical anchor */}
        <motion.div
          layout
          className="relative rounded-[18px] bg-white/45 p-3 flex flex-col gap-2 min-h-[160px]"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2AE855] text-black flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">Google Maps</p>
              <p className="text-[10px] font-mono opacity-60 truncate">
                {postcode}
              </p>
            </div>
            {mapsPin?.isLive && (
              <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full bg-[#2AE855] text-black font-semibold shrink-0">
                live
              </span>
            )}
          </div>

          {mapsPin ? (
            <>
              <div className="flex-1">
                <p className="text-[11px] font-semibold leading-snug line-clamp-1">
                  {mapsPin.topResultName || "Unknown"}
                </p>
                <p className="text-[10px] opacity-75 leading-snug line-clamp-2 mt-0.5">
                  {mapsPin.topResultAddress || "—"}
                </p>
                {mapsPin.lat && mapsPin.lng && (
                  <p className="text-[9px] font-mono opacity-60 mt-1">
                    {mapsPin.lat.toFixed(4)}, {mapsPin.lng.toFixed(4)}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-auto">
                <span className="text-[10px] font-mono opacity-70">
                  {mapsPin.nearbyCount} nearby
                </span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[11px] opacity-60 italic">
              {loading ? "locating…" : "no pin"}
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer — live chip + re-scan */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-1 rounded-full ${
              isAnyLive
                ? "bg-[#2AE855] text-black font-semibold"
                : "bg-white/50 opacity-70"
            }`}
            title={
              isAnyLive
                ? "Live SearchAPI.io triangle feed"
                : "Demo — set SEARCHAPI_API_KEY to light up all channels"
            }
          >
            {isAnyLive ? "live · triangle" : "demo data"}
          </span>
          {leader && (
            <p className="text-xs font-mono opacity-70">
              lead signal · {PLATFORM_META[leader.signal.platform].label.toLowerCase()}
              {viral ? ` · ${viral.multiplier}× baseline` : ""}
            </p>
          )}
        </div>
        <Button
          onClick={rescan}
          disabled={loading}
          className="h-12 px-6 rounded-full font-semibold btn-squish bg-[var(--card-fg)] text-[var(--card-bg)] hover:brightness-110"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner className="w-4 h-4" />
              Re-scanning triangle...
            </span>
          ) : (
            "Re-scan triangle"
          )}
        </Button>
      </div>
    </div>
  )
}

async function fetchJSON<T>(
  url: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function fetchSocial(
  url: string,
  body: Record<string, unknown>,
  platform: TrianglePlatform,
): Promise<TriangleSocial | null> {
  const data = await fetchJSON<{
    username?: string
    handle?: string
    full_name?: string
    display_name?: string
    page_name?: string
    followers?: number
    likes?: number
    post?: {
      image_url?: string
      thumbnail_url?: string
      link?: string
      caption?: string
      likes?: number
      comments?: number
      posted_at?: string
      permalink?: string
    }
    isLive?: boolean
  }>(url, body)
  if (!data || !data.post) return null
  return {
    platform,
    handle: data.username || data.handle || String(body.username || body.page || ""),
    displayName: data.full_name || data.display_name || data.page_name,
    followers: data.followers || data.likes,
    latestPost: {
      image:
        data.post.image_url ||
        data.post.thumbnail_url ||
        data.post.link,
      caption: (data.post.caption || "").toString(),
      likes: data.post.likes,
      comments: data.post.comments,
      postedAt: data.post.posted_at || new Date().toISOString(),
      permalink: data.post.permalink,
    },
    isLive: Boolean(data.isLive),
  }
}
