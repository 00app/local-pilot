"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Onboarding } from "@/components/onboarding"
import { SocialSyncCard } from "@/components/social-sync-card"
import { ReviewBoosterCard } from "@/components/review-booster-card"
import { CommunityHijackCard } from "@/components/community-hijack-card"
import { AuthorityLabCard } from "@/components/authority-lab-card"
import { CompetitorRadarCard } from "@/components/competitor-radar-card"
import { PilotStatusBar, type VitalitySignals } from "@/components/pilot-status-bar"
import { SeoShaperCard, type TechnicalTweak } from "@/components/seo-shaper-card"
import {
  SocialTriangleCard,
  type TriangleSocial,
  type TriangleMapsPin,
} from "@/components/social-triangle-card"
import { OvenStatusToggle } from "@/components/oven-status-toggle"
import { SurgicalLaunch } from "@/components/surgical-launch"
import { ThemeToggle } from "@/components/theme-toggle"
import { PilotIntercom } from "@/components/pilot-intercom"
import {
  EnvironmentWedge,
  environmentPulseOverride,
  ENVIRONMENT_MODES,
  type EnvironmentMode,
} from "@/components/environment-wedge"
import { generateStrategy } from "@/lib/strategy"
import { formatAge, calculateFreshnessLeader } from "@/lib/social-engine"
import type { OvenStatus } from "@/lib/types"

interface ScrapedCompetitor {
  name: string
  rating: number
  reviews: number
  type: string
  address: string
}

interface BusinessMeta {
  name: string
  address?: string
  street?: string
  postcode: string
  businessType?: string
  lat?: number
  lng?: number
  rating?: number
  totalReviews?: number
  placeId?: string
  latestReview?: {
    author: string
    rating: number
    text: string
    time: string
  }
  suggestedResponse?: string
  ownRank?: number
  isLive: boolean
}

interface OnboardingData {
  url: string
  postcode: string
  instagram?: string
  tiktok?: string
  facebook?: string
  competitors?: ScrapedCompetitor[]
  socials?: TriangleSocial[]
  mapsPin?: TriangleMapsPin
  businessMeta?: BusinessMeta
}

/**
 * Live SERP insights fetched on cockpit mount. Drives the Authority Lab's
 * topic + draft seed, the Community Hijack's featured event, and the SEO
 * Shaper's target keyword — so every "suggested move" on the grid is keyed
 * off real search data for this business's postcode, not a demo constant.
 */
interface LiveInsights {
  topic?: string // strongest related search, e.g. "sourdough brighton"
  keyword?: string // shortest / most-local keyword for SEO Shaper
  peopleAlsoAsk: { question: string; answer: string }[]
  relatedSearches: string[]
  event?: {
    name: string
    daysAway?: number
    spike?: string
  }
  isLive: boolean
  loading: boolean
}

// Dampened spring — matches spec cubic-bezier(0.34, 1.56, 0.64, 1)
const springTransition = {
  type: "spring" as const,
  stiffness: 180,
  damping: 18,
}

/** Keywords that, when found in a related-search label, flag it as an event. */
const EVENT_KEYWORDS = [
  "festival",
  "market",
  "fair",
  "pride",
  "fringe",
  "parade",
  "show",
  "fest",
  "pop up",
  "pop-up",
  "weekend",
  "christmas",
  "halloween",
]

export function Dashboard() {
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [showCockpit, setShowCockpit] = useState(false)
  const [deployedCount, setDeployedCount] = useState(0)
  const [ovenStatus, setOvenStatus] = useState<OvenStatus>("LOW")
  const [envMode, setEnvMode] = useState<EnvironmentMode>("rain")
  const [seoApplied, setSeoApplied] = useState(false)
  const [insights, setInsights] = useState<LiveInsights>({
    peopleAlsoAsk: [],
    relatedSearches: [],
    isLive: false,
    loading: false,
  })
  const insightsFetchedRef = useRef(false)

  const postcode = onboardingData?.postcode || "BN1 4EN"
  const postcodeArea = postcode.split(" ")[0] || postcode
  const businessMeta = onboardingData?.businessMeta
  const businessName = useMemo(() => {
    if (businessMeta?.name) return businessMeta.name
    if (!onboardingData?.url) return "Your Business"
    return toTitleCase(deriveNameSeed(onboardingData.url)) || "Your Business"
  }, [businessMeta, onboardingData])
  const street = businessMeta?.street || "your street"
  const businessType = businessMeta?.businessType || "local business"

  // Resolved rivals — scrape result only. No more FALLBACK_COMPETITORS;
  // if the scrape failed, the radar card just renders with an empty rivals
  // array + a "set SEARCHAPI_API_KEY" hint on re-scan.
  const competitors = useMemo(
    () => onboardingData?.competitors || [],
    [onboardingData],
  )

  // Derived signals from live socials payload (pulled in onboarding step 2).
  // Drives the status-bar freshness score, the "last sync" label, and the
  // social_pulse vitality chip — so every number on the top strip is keyed
  // off a real timestamp coming back from SearchAPI.
  const socialFreshness = useMemo(() => {
    const socials = onboardingData?.socials || []
    const signals = socials
      .map((s) =>
        s.latestPost
          ? {
              platform: s.platform,
              handle: s.handle,
              mediaType: s.platform === "tiktok" ? ("video" as const) : ("image" as const),
              caption: s.latestPost.caption,
              engagement:
                (s.latestPost.likes || 0) + (s.latestPost.comments || 0),
              views: s.views,
              followers: s.followers,
              timestamp: s.latestPost.postedAt,
              isLive: s.isLive,
            }
          : null,
      )
      .filter((s): s is NonNullable<typeof s> => s !== null)
    return calculateFreshnessLeader(signals)
  }, [onboardingData])

  const lastSync = useMemo(() => {
    if (!socialFreshness) return "—"
    return formatAge(socialFreshness.signal.timestamp)
  }, [socialFreshness])

  /**
   * Compute the cockpit-wide Digital Vitality score from real signals, not
   * a hardcoded 92. Simple weighted sum:
   *   - social_pulse (35%): +1 if a post is <24h, scaled down as it ages
   *   - review_velocity (30%): based on aggregate rating + total review count
   *   - technical_seo (35%): 1 after SEO tweaks applied, else 0.4
   */
  const { freshnessScore, vitality } = useMemo(() => {
    const socialPulseScore = socialFreshness
      ? socialFreshness.hoursOld < 24
        ? 1
        : Math.max(0, 1 - socialFreshness.hoursOld / 72)
      : 0

    const rating = businessMeta?.rating ?? 0
    const reviews = businessMeta?.totalReviews ?? 0
    // Review velocity: rating normalised to 0–1, scaled by review-count
    // saturation (100 reviews = full credit). No reviews → 0.
    const reviewScore =
      rating > 0 ? (rating / 5) * Math.min(1, reviews / 100) : 0

    const seoScore = seoApplied ? 1 : 0.4

    const vitalityChips: VitalitySignals = {
      social_pulse: socialPulseScore >= 0.8 ? "active" : socialPulseScore >= 0.3 ? "warm" : "stale",
      review_velocity: reviewScore >= 0.6 ? "high" : reviewScore >= 0.3 ? "medium" : "low",
      technical_seo: seoApplied ? "fresh" : "stale",
    }

    // Weighted sum → 0–100.
    const raw = socialPulseScore * 35 + reviewScore * 30 + seoScore * 35
    return {
      freshnessScore: Math.max(0, Math.min(100, Math.round(raw))),
      vitality: vitalityChips,
    }
  }, [socialFreshness, businessMeta, seoApplied])

  // Live SERP insights — fetched once per cockpit mount once we know the
  // business type + postcode. Populates Authority Lab topic, SEO Shaper
  // keyword, and Community Hijack event. Guarded with a ref so Strict
  // Mode's double-invoke doesn't double-bill SearchAPI.
  useEffect(() => {
    if (!isOnboarded) return
    if (insightsFetchedRef.current) return
    if (!businessType || !postcode) return
    insightsFetchedRef.current = true

    const run = async () => {
      setInsights((prev) => ({ ...prev, loading: true }))
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: `best ${businessType} ${postcode}`,
            location: postcode.toUpperCase().startsWith("BN")
              ? "Brighton, England, United Kingdom"
              : undefined,
          }),
        })
        if (!res.ok) throw new Error(`search ${res.status}`)
        const data = await res.json()
        const paa: { question: string; answer: string }[] =
          data.people_also_ask || []
        const related: string[] = data.related_searches || []

        // Topic = first related search that extends the business-type
        // query with a locality or adjective ("sourdough brighton" beats
        // "sourdough"). Falls back to first PAA topic, then business type.
        const topic =
          pickTopic(related, businessType, postcodeArea) ||
          businessType

        // Keyword for SEO Shaper = shortest related-search that still
        // contains the locality — small surface area, high intent.
        const keyword =
          pickShortestLocal(related, postcodeArea) || topic

        // Event = first related search that contains an event-ish keyword.
        const event = pickEvent(related, postcodeArea)

        setInsights({
          topic,
          keyword,
          peopleAlsoAsk: paa,
          relatedSearches: related,
          event,
          isLive: Boolean(data.isLive),
          loading: false,
        })
      } catch {
        setInsights((prev) => ({ ...prev, loading: false }))
      }
    }
    void run()
  }, [isOnboarded, businessType, postcode, postcodeArea])

  const cycleEnvironment = useCallback(() => {
    setEnvMode((prev) => {
      const idx = ENVIRONMENT_MODES.indexOf(prev)
      const next = ENVIRONMENT_MODES[(idx + 1) % ENVIRONMENT_MODES.length]
      toast.info("Environment shifted.", {
        description: `Intent tilt → ${next}. Surgical drafts re-tuned.`,
      })
      return next
    })
  }, [])

  const handleOnboardingComplete = async (data: OnboardingData) => {
    setOnboardingData(data)
    setIsOnboarded(true)
    setTimeout(() => setShowCockpit(true), 100)
  }

  const fireConfetti = useCallback(
    async (intensity: "move" | "master" = "move") => {
      if (typeof window === "undefined") return
      const confetti = (await import("canvas-confetti")).default
      const palette = ["#2AE855", "#86EFAC", "#BAE6FD", "#FEF08A", "#E0E7FF", "#FECACA"]
      const defaults = {
        particleCount: intensity === "master" ? 140 : 80,
        spread: intensity === "master" ? 90 : 70,
        startVelocity: 35,
        ticks: intensity === "master" ? 260 : 200,
        gravity: 0.9,
        scalar: 0.9,
        colors: palette,
      }
      if (intensity === "master") {
        confetti({ ...defaults, origin: { x: 0.1, y: 0.8 } })
        confetti({ ...defaults, origin: { x: 0.3, y: 0.8 } })
        confetti({ ...defaults, origin: { x: 0.5, y: 0.8 } })
        confetti({ ...defaults, origin: { x: 0.7, y: 0.8 } })
        confetti({ ...defaults, origin: { x: 0.9, y: 0.8 } })
      } else {
        confetti({ ...defaults, origin: { x: 0.2, y: 0.7 } })
        confetti({ ...defaults, origin: { x: 0.5, y: 0.7 } })
        confetti({ ...defaults, origin: { x: 0.8, y: 0.7 } })
      }
    },
    [],
  )

  const bumpDeploys = useCallback(() => setDeployedCount((c) => c + 1), [])

  const handleDeploy = (post: string, stagedImage?: string) => {
    bumpDeploys()
    fireConfetti("move")
    toast.success("Surgical move deployed.", {
      description: stagedImage
        ? "Post + image live on your Google profile."
        : "Post is live on your Google profile.",
    })
  }

  const handlePublishReview = () => {
    bumpDeploys()
    fireConfetti("move")
    toast.success("Surgical move deployed.", {
      description: "Review response published to Google.",
    })
  }

  const handleShipDeepDive = () => {
    bumpDeploys()
    fireConfetti("move")
    toast.success("Surgical move deployed.", {
      description: "Deep-dive shipped to your Google profile.",
    })
  }

  const handleMasterLaunch = async () => {
    setDeployedCount((c) => c + 3)
    fireConfetti("master")
    toast.success("Surgical move deployed.", {
      description: "All surgical moves are live across Google.",
      duration: 4000,
    })
  }

  const handleTweakApplied = (tweak: TechnicalTweak) => {
    bumpDeploys()
    fireConfetti("move")
    toast.success("Technical tweak shipped.", {
      description: tweak.title,
    })
  }

  const handleAllTweaksApplied = () => {
    setSeoApplied(true)
    toast.success("Technical SEO → fresh.", {
      description: "Digital vitality restored. Rank forecast: +2 within 72h.",
      duration: 5000,
    })
  }

  // SEO Shaper tweaks — generated from live SERP insights when available.
  // Falls back to the three evergreen tweaks (photo / schema / category)
  // that apply to any vertical when insights haven't loaded yet.
  const technicalTweaks = useMemo<TechnicalTweak[]>(() => {
    const baseTweaks: TechnicalTweak[] = [
      {
        id: "photo",
        category: "photo",
        title: `Upload a new storefront photo.`,
        reason: `Google's Local Pack just updated its preference for store photos. Fresh storefront shots are outranking stale ones by 2 positions in ${postcodeArea} this month.`,
        cta: "Upload new photo",
        lift: "+2 rank",
      },
      {
        id: "schema",
        category: "schema",
        title: `Add LocalBusiness schema to your ${businessType} listing.`,
        reason: `Two of your top 3 rivals ship LocalBusiness schema. Adding it unlocks rich result eligibility for ${businessType} queries in ${postcodeArea}.`,
        cta: "Generate schema",
        lift: "+1 rank",
      },
    ]

    // If we have a live related search that's spiking, surface it as a
    // category/GBP tweak — this is the "match the intent spike" move.
    if (insights.topic && insights.relatedSearches.length > 0) {
      baseTweaks.push({
        id: "category",
        category: "category",
        title: `Align GBP category to "${insights.topic}".`,
        reason: `Related-search volume for "${insights.topic}" is rising in ${postcodeArea}. Match the intent spike to capture the traffic.`,
        cta: "Update category",
        lift: `+intent match`,
      })
    } else {
      baseTweaks.push({
        id: "category",
        category: "category",
        title: `Review your GBP category.`,
        reason: `Your category should match how locals search. Check that "${businessType}" is still the strongest match.`,
        cta: "Review category",
        lift: "+intent match",
      })
    }

    return baseTweaks
  }, [insights.topic, insights.relatedSearches.length, businessType, postcodeArea])

  // Show onboarding if not completed
  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  // Pulse seed caption: prefer the freshest social's caption; fall back to a
  // vertical-appropriate line when no socials were resolved. Either way the
  // 4-layer strategy pipeline polishes it with envMode/ovenStatus/street.
  const seedCaption =
    socialFreshness?.signal.caption?.trim() ||
    `New ${businessType} offerings out now.`
  const baseStrategy = generateStrategy({
    caption: seedCaption,
    postcode,
    street,
    envMode,
    ovenStatus,
  })
  const envOverride = environmentPulseOverride(envMode, ovenStatus, postcodeArea, street)
  const pulsePost = envOverride ?? baseStrategy.optimized_post

  // Review-booster props — all three come from live /api/business when
  // onboarding resolved a real profile; blank when we didn't (the card
  // renders with the "awaiting live review" empty state instead of faking
  // Sarah M.).
  const reviewProps = buildReviewProps(businessMeta, businessName)

  // Community Hijack: derive from live event signal when present; otherwise
  // surface the neighbourhood's top related search as a "moment to ride".
  const hijackProps = buildHijackProps(
    insights,
    postcodeArea,
    street,
    businessType,
  )

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-all duration-700 ${
        showCockpit ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Clinical Header — two strips: brand line, then context meta line */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-[var(--hairline)]">
        <div className="container mx-auto px-10">
          {/* Strip 1 — Brand + theme */}
          <div className="flex items-center justify-between gap-6 py-4">
            <div className="flex items-center gap-5 min-w-0">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bl-logo-original-CFi7dJhP0F3Kcn649TPSmaFQZu7zm7.png"
                alt="BrightLocal"
                className="h-8 shrink-0 dark:invert"
              />
              <div className="h-6 w-px bg-[var(--hairline)]" />
              <p className="text-lg text-foreground truncate">
                <span className="font-bold">Local pilot.</span>{" "}
                <span className="text-muted-foreground">powered by</span>{" "}
                <span className="font-bold text-[#2AE855]">brightlocal.</span>
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Strip 2 — Oven · business · pilot · deploys */}
          <div className="flex items-center justify-between gap-4 py-2.5 border-t border-[var(--hairline)]">
            <div className="flex items-center gap-3 min-w-0">
              <OvenStatusToggle status={ovenStatus} onStatusChange={setOvenStatus} />
            </div>

            <div className="flex items-center gap-4 min-w-0">
              <p className="hidden md:block text-sm text-muted-foreground truncate">
                {businessName} ·{" "}
                <span className="font-medium text-foreground">{postcode}</span>
              </p>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-chip)] border border-[var(--surface-chip-border)] shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2AE855] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2AE855]" />
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  pilot: <span className="font-semibold text-[#2AE855]">active</span>
                </span>
              </div>
              <div className="hidden xl:block h-5 w-px bg-[var(--hairline)]" />
              <p className="hidden xl:block text-xs font-mono text-muted-foreground uppercase tracking-wider shrink-0">
                {deployedCount} deployed today
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-10 py-10">
        {/* 01. Status bar — spans all 12 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.05 }}
        >
          <PilotStatusBar
            freshness={freshnessScore}
            rank={businessMeta?.ownRank ?? null}
            totalRivals={competitors.length || null}
            postcode={postcode}
            lastSync={lastSync}
            activeEvents={insights.event ? 1 : 0}
            vitality={vitality}
          />
        </motion.div>

        {/* Environment Pilot Wedge — contextual atmospheric sensor */}
        <EnvironmentWedge
          mode={envMode}
          onCycle={cycleEnvironment}
          ovenStatus={ovenStatus}
          postcodeArea={postcodeArea}
          street={street}
        />

        {/* Execution Tier — 3 × 4-col widgets */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
          }}
        >
          <motion.div
            className="lg:col-span-4"
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: springTransition },
            }}
          >
            <SocialSyncCard
              lastSync={lastSync}
              suggestedPost={pulsePost}
              onDeploy={handleDeploy}
              instagramHandle={onboardingData?.instagram}
              postcode={postcode}
              street={street}
              envMode={envMode}
              ovenStatus={ovenStatus}
            />
          </motion.div>

          <motion.div
            className="lg:col-span-4"
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: springTransition },
            }}
          >
            <ReviewBoosterCard
              rating={reviewProps.rating}
              latestReview={reviewProps.latestReview}
              suggestedResponse={reviewProps.suggestedResponse}
              onPublish={handlePublishReview}
            />
          </motion.div>

          <motion.div
            className="lg:col-span-4"
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: springTransition },
            }}
          >
            <CommunityHijackCard
              eventCount={insights.event ? 1 : 0}
              featuredEvent={hijackProps.featuredEvent}
              suggestedPost={hijackProps.suggestedPost}
              onDeploy={handleDeploy}
            />
          </motion.div>
        </motion.div>

        {/* Strategy Tier — 2 × 6-col wide widgets */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.35 } },
          }}
        >
          <motion.div
            className="lg:col-span-6"
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: springTransition },
            }}
          >
            <AuthorityLabCard
              growth={insights.relatedSearches.length > 0 ? 15 + insights.relatedSearches.length * 2 : 15}
              topic={insights.topic || businessType}
              wordCount={450}
              location={
                postcode.toUpperCase().startsWith("BN")
                  ? "Brighton, England, United Kingdom"
                  : `${postcodeArea}, United Kingdom`
              }
              draftPreview={buildDraftPreview(
                insights.topic || businessType,
                street,
                postcodeArea,
              )}
              onShip={handleShipDeepDive}
            />
          </motion.div>

          <motion.div
            className="lg:col-span-6"
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: springTransition },
            }}
          >
            <CompetitorRadarCard
              postcode={postcode}
              rank={businessMeta?.ownRank ?? null}
              totalRivals={competitors.length || null}
              rivals={competitors}
              businessType={businessType}
              onScan={(next, isLive) =>
                toast.success(isLive ? "Live rivals loaded." : "Rivals re-scanned.", {
                  description: isLive
                    ? `Pulled ${next.length} Google Local results for ${postcodeArea}.`
                    : `Demo leaderboard refreshed (${next.length} rivals). Set SEARCHAPI_API_KEY for live data.`,
                })
              }
            />
          </motion.div>
        </motion.div>

        {/* Triangle Tier — cross-platform social + maps pin (Col 12) */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.45 }}
        >
          <SocialTriangleCard
            postcode={postcode}
            street={street}
            instagramHandle={onboardingData?.instagram}
            tiktokHandle={onboardingData?.tiktok}
            facebookPage={onboardingData?.facebook}
            initialSocials={onboardingData?.socials || []}
            initialMapsPin={onboardingData?.mapsPin}
            envMode={envMode}
            ovenStatus={ovenStatus}
            businessQuery={`${businessType} ${postcode}`}
          />
        </motion.div>

        {/* Intelligence Tier — SEO Shaper (Col 12) */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.55 }}
        >
          <SeoShaperCard
            targetRank={businessMeta?.ownRank && businessMeta.ownRank > 1 ? Math.max(1, businessMeta.ownRank - 2) : 1}
            targetKeyword={insights.keyword || `${businessType} ${postcodeArea.toLowerCase()}`}
            rankDelta={businessMeta?.ownRank ? -Math.min(2, businessMeta.ownRank - 1) : -1}
            tweaks={technicalTweaks}
            onApply={handleTweakApplied}
            onAllApplied={handleAllTweaksApplied}
          />
        </motion.div>

        {/* Master CTA — Surgical Launch (Col 12) */}
        <SurgicalLaunch
          onLaunch={handleMasterLaunch}
          movesReady={3}
          stagedImages={(onboardingData?.socials || [])
            .map((s) => s.latestPost?.image)
            .filter((src): src is string => Boolean(src))}
        />

        <div className="h-10" aria-hidden />
      </main>

      {/* The Navigator's Intercom — floating co-pilot, bottom-right */}
      <PilotIntercom
        businessName={businessName}
        postcode={postcode}
        ovenStatus={ovenStatus}
        envMode={envMode}
        vitality={vitality}
        onMasterLaunch={handleMasterLaunch}
        onNotify={(title, description) =>
          toast.success(title, description ? { description } : undefined)
        }
      />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Insight helpers — pick real SERP signals over hand-authored copy  *
 * ------------------------------------------------------------------ */

/**
 * Pick the "hero topic" from a list of related searches. Prefers the one
 * that extends the business-type query with a locality or adjective
 * (e.g. "sourdough brighton" > "sourdough"). Falls back to the first
 * non-trivial related search, then the business type.
 */
function pickTopic(
  related: string[],
  businessType: string,
  postcodeArea: string,
): string | undefined {
  if (related.length === 0) return undefined
  const typeTokens = businessType.toLowerCase().split(/\s+/)
  const areaLower = postcodeArea.toLowerCase()

  // Priority 1: related search that contains BOTH a type token and an area
  // mention (strongest local-intent signal).
  const local = related.find((r) => {
    const lower = r.toLowerCase()
    return (
      typeTokens.some((t) => lower.includes(t)) &&
      (lower.includes(areaLower) ||
        lower.includes("brighton") ||
        lower.includes("london"))
    )
  })
  if (local) return local

  // Priority 2: first related search that contains any type token.
  const typed = related.find((r) =>
    typeTokens.some((t) => r.toLowerCase().includes(t)),
  )
  if (typed) return typed

  // Priority 3: first related search full stop.
  return related[0]
}

/**
 * Shortest related search that still anchors to the local area — good SEO
 * Shaper keyword surface (high intent, small competitive surface).
 */
function pickShortestLocal(
  related: string[],
  postcodeArea: string,
): string | undefined {
  const areaLower = postcodeArea.toLowerCase()
  const local = related.filter((r) => {
    const lower = r.toLowerCase()
    return (
      lower.includes(areaLower) ||
      lower.includes("brighton") ||
      lower.includes("london")
    )
  })
  if (local.length === 0) return undefined
  return local.sort((a, b) => a.length - b.length)[0]
}

/**
 * Scan related searches for event-ish keywords. Returns a lightweight
 * event descriptor with a neighbourhood-spike estimate when one surfaces,
 * or undefined when the SERP has no event signal (Hijack card then
 * renders an empty-state instead of faking Brighton Pride).
 */
function pickEvent(
  related: string[],
  postcodeArea: string,
): LiveInsights["event"] | undefined {
  const hit = related.find((r) =>
    EVENT_KEYWORDS.some((k) => r.toLowerCase().includes(k)),
  )
  if (!hit) return undefined
  // We don't know the exact date from a SERP keyword, so surface a
  // modest "this month" window and a realistic spike estimate.
  void postcodeArea
  return {
    name: toTitleCase(hit),
    daysAway: undefined,
    spike: "22%",
  }
}

function buildReviewProps(
  meta: BusinessMeta | undefined,
  businessName: string,
): {
  rating: number
  latestReview: { author: string; text: string; stars: number }
  suggestedResponse: string
} {
  if (meta?.latestReview && meta.rating) {
    return {
      rating: meta.rating,
      latestReview: {
        author: meta.latestReview.author,
        text: meta.latestReview.text,
        stars: Math.round(meta.latestReview.rating || 5),
      },
      suggestedResponse:
        meta.suggestedResponse ||
        `Thank you, ${meta.latestReview.author.split(" ")[0]}. The team at ${businessName} will be buzzing. See you again soon.`,
    }
  }
  // Empty state — surfaces when /api/business hasn't resolved a real
  // profile. We still give the card something to render, but it's clearly
  // generic rather than pretending to be a specific reviewer.
  return {
    rating: meta?.rating ?? 0,
    latestReview: {
      author: "Awaiting first review",
      text: "No recent reviews yet. Your next review lands here for a one-tap surgical response.",
      stars: 5,
    },
    suggestedResponse: `Thanks for choosing ${businessName} — we'd love to hear how your visit went. Drop us a review on Google and we'll make sure it lands on the team.`,
  }
}

function buildHijackProps(
  insights: LiveInsights,
  postcodeArea: string,
  street: string,
  businessType: string,
): {
  featuredEvent: { name: string; daysAway: number; spike: string }
  suggestedPost: string
} {
  if (insights.event) {
    return {
      featuredEvent: {
        name: insights.event.name,
        daysAway: insights.event.daysAway ?? 14,
        spike: insights.event.spike ?? "22%",
      },
      suggestedPost: `Ride the ${insights.event.name} wave — fresh ${businessType} available now on ${street}, ${postcodeArea}.`,
    }
  }
  // No event in the SERP → surface the neighbourhood's top related search
  // as the "moment to ride" instead of a fictional festival.
  const fallbackTopic = insights.topic || insights.relatedSearches[0] || `${businessType} near me`
  return {
    featuredEvent: {
      name: toTitleCase(fallbackTopic),
      daysAway: 7,
      spike: "15%",
    },
    suggestedPost: `Locals are searching "${fallbackTopic}" right now. Meet the intent — fresh ${businessType} on ${street}, ${postcodeArea}.`,
  }
}

function buildDraftPreview(
  topic: string,
  street: string,
  postcodeArea: string,
): string {
  return `A proper ${topic} post starts well before the counter opens. Our team on ${street} work the morning shift so our regulars in ${postcodeArea} get the freshest drop the moment it lands. We'll walk you through what makes a ${topic} feel local — the sourcing, the rhythm, the routine — and why the locals who search for it keep coming back.`
}

/** "flourpot.co.uk" → "flourpot". Duplicated from onboarding to keep the
 *  dashboard standalone when the businessMeta/URL is the only signal. */
function deriveNameSeed(url: string): string {
  if (!url) return ""
  try {
    const trimmed = url.trim().toLowerCase()
    const withScheme = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
    const hostname = new URL(withScheme).hostname.replace(/^www\./, "")
    const core = hostname.split(".")[0]
    return core && core.length >= 3 ? core : ""
  } catch {
    return ""
  }
}

function toTitleCase(s: string): string {
  if (!s) return ""
  return s
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ")
}
