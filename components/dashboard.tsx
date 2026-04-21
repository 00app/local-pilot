"use client"

import { useCallback, useMemo, useState } from "react"
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
import type { OvenStatus } from "@/lib/types"

interface ScrapedCompetitor {
  name: string
  rating: number
  reviews: number
  type: string
  address: string
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
}

const FALLBACK_COMPETITORS: ScrapedCompetitor[] = [
  { name: "Flint Owl Bakery", rating: 4.8, reviews: 412, type: "Bakery", address: "North St, Brighton" },
  { name: "Real Patisserie", rating: 4.7, reviews: 389, type: "Bakery", address: "Trafalgar St, Brighton" },
  { name: "Baked Brighton", rating: 4.6, reviews: 271, type: "Bakery", address: "Gloucester Rd, Brighton" },
  { name: "The Bread Oven", rating: 4.5, reviews: 198, type: "Bakery", address: "Western Rd, Brighton" },
]

// Dampened spring — matches spec cubic-bezier(0.34, 1.56, 0.64, 1)
const springTransition = {
  type: "spring" as const,
  stiffness: 180,
  damping: 18,
}

export function Dashboard() {
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [showCockpit, setShowCockpit] = useState(false)
  const [freshnessScore] = useState(92)
  const [deployedCount, setDeployedCount] = useState(0)
  const [ovenStatus, setOvenStatus] = useState<OvenStatus>("LOW")
  const [envMode, setEnvMode] = useState<EnvironmentMode>("rain")
  const [vitality, setVitality] = useState<VitalitySignals>({
    social_pulse: "active",
    review_velocity: "high",
    technical_seo: "stale",
  })

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
    console.log("Deployed post:", post, stagedImage ? `(with image: ${stagedImage})` : "")
    bumpDeploys()
    fireConfetti("move")
    toast.success("Surgical move deployed.", {
      description: stagedImage
        ? "Post + image live on your Google profile."
        : "Post is live on your Google profile.",
    })
  }

  const handlePublishReview = (response: string) => {
    console.log("Published review response:", response)
    bumpDeploys()
    fireConfetti("move")
    toast.success("Surgical move deployed.", {
      description: "Review response published to Google.",
    })
  }

  const handleShipDeepDive = (draft: string) => {
    console.log("Shipped deep dive:", draft)
    bumpDeploys()
    fireConfetti("move")
    toast.success("Surgical move deployed.", {
      description: "Deep-dive shipped to your Google profile.",
    })
  }

  const handleMasterLaunch = async () => {
    // Three moves deploy in rapid sequence
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
    setVitality((v) => ({ ...v, technical_seo: "fresh" }))
    toast.success("Technical SEO → fresh.", {
      description: "Digital vitality restored. Rank forecast: +2 within 72h.",
      duration: 5000,
    })
  }

  const TECHNICAL_TWEAKS: TechnicalTweak[] = [
    {
      id: "photo",
      category: "photo",
      title: "Upload a new storefront photo.",
      reason:
        "Google's Local Pack just updated its preference for store photos. Yours is 2 years old; neighbours with fresh photos are ranking 2 spots higher.",
      cta: "Upload new photo",
      lift: "+2 rank",
    },
    {
      id: "schema",
      category: "schema",
      title: "Add Menu schema to your listing.",
      reason:
        "Two of your top 3 rivals ship LocalBusiness + Menu schema on their site. Adding Menu schema unlocks rich menu results for bakery queries.",
      cta: "Generate schema",
      lift: "+1 rank",
    },
    {
      id: "category",
      category: "category",
      title: "Switch GBP category → Artisan bakery.",
      reason:
        "Search volume for 'artisan bakery' is up 31% in BN1 this quarter. Your category is still the generic 'Bakery'. Match the intent spike.",
      cta: "Update category",
      lift: "+31% intent match",
    },
  ]

  const businessName = useMemo(() => {
    if (!onboardingData?.url) return "Your Business"
    return onboardingData.url.toLowerCase().includes("flourpot")
      ? "The Flour Pot Bakery"
      : "Your Business"
  }, [onboardingData])

  const competitors = useMemo(() => {
    return onboardingData?.competitors?.length
      ? onboardingData.competitors
      : FALLBACK_COMPETITORS
  }, [onboardingData])

  // Show onboarding if not completed
  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  const postcode = onboardingData?.postcode || "BN1 4EN"
  const postcodeArea = postcode.split(" ")[0] || postcode

  // Pulse post: environment + oven first, fall back to IG-caption strategy.
  // Passing envMode/ovenStatus into generateStrategy means the 4-layer
  // pipeline folds environment context into the optimized output directly;
  // we still prefer the wedge's hand-tuned override when it has one.
  const baseStrategy = generateStrategy({
    caption: "New sourdough out of the oven!",
    postcode,
    street: "Sydney Street",
    envMode,
    ovenStatus,
  })
  const envOverride = environmentPulseOverride(envMode, ovenStatus, postcodeArea)
  const pulsePost = envOverride ?? baseStrategy.optimized_post

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

          {/* Strip 2 — Pilot status · oven · business · deploys */}
          <div className="flex items-center justify-between gap-4 py-2.5 border-t border-[var(--hairline)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-chip)] border border-[var(--surface-chip-border)] shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2AE855] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2AE855]" />
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  pilot: <span className="font-semibold text-[#2AE855]">active</span>
                </span>
              </div>
              <OvenStatusToggle status={ovenStatus} onStatusChange={setOvenStatus} />
            </div>

            <div className="flex items-center gap-4 min-w-0">
              <p className="hidden md:block text-sm text-muted-foreground truncate">
                {businessName} ·{" "}
                <span className="font-medium text-foreground">{postcode}</span>
              </p>
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
            rank={3}
            totalRivals={competitors.length + 2}
            postcode={postcode}
            lastSync="24h"
            activeEvents={3}
            vitality={vitality}
          />
        </motion.div>

        {/* Environment Pilot Wedge — contextual atmospheric sensor */}
        <EnvironmentWedge mode={envMode} onCycle={cycleEnvironment} ovenStatus={ovenStatus} />

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
              lastSync="24h"
              suggestedPost={pulsePost}
              onDeploy={handleDeploy}
              instagramHandle={onboardingData?.instagram || "flourpot"}
              postcode={postcode}
              street="Sydney Street"
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
              rating={4.9}
              latestReview={{
                author: "Sarah M.",
                text: "Absolutely the best sourdough in Brighton!",
                stars: 5,
              }}
              suggestedResponse={`Thank you Sarah! We're thrilled you loved our sourdough. The best croissants in Brighton are waiting for your next visit.`}
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
              eventCount={3}
              featuredEvent={{
                name: "Brighton Pride",
                daysAway: 10,
                spike: "40%",
              }}
              suggestedPost={`Pre-order your Pride brunch boxes now for collection on Sydney Street, ${postcodeArea}.`}
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
              growth={15}
              topic="artisan sourdough"
              wordCount={500}
              location={postcode.toUpperCase().startsWith("BN") ? "Brighton, UK" : `${postcodeArea}, UK`}
              draftPreview="A true artisan sourdough starts 36 hours before it ever reaches the counter. Our starter is fed twice daily, and the slow bulk ferment is what gives our loaves their signature open crumb and tangy depth. Every loaf is hand-shaped in our Sydney St bakery by bakers who know the dough by feel, not by the clock."
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
              rank={3}
              totalRivals={competitors.length + 2}
              rivals={competitors}
              businessType="bakery"
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
            street="Sydney Street"
            instagramHandle={onboardingData?.instagram || "flourpot"}
            tiktokHandle={onboardingData?.tiktok}
            facebookPage={onboardingData?.facebook}
            initialSocials={onboardingData?.socials || []}
            initialMapsPin={onboardingData?.mapsPin}
            envMode={envMode}
            ovenStatus={ovenStatus}
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
            targetRank={1}
            targetKeyword={`sourdough ${postcodeArea.toLowerCase().startsWith("bn") ? "brighton" : postcodeArea}`}
            rankDelta={-1}
            tweaks={TECHNICAL_TWEAKS}
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
