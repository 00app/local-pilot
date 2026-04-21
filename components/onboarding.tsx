"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Competitor {
  name: string
  rating: number
  reviews: number
  type: string
  address: string
}

export interface SocialSnapshot {
  platform: "instagram" | "tiktok" | "facebook"
  handle: string
  displayName?: string
  followers?: number
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

export interface MapsPinSnapshot {
  query: string
  lat?: number
  lng?: number
  topResultName?: string
  topResultAddress?: string
  nearbyCount: number
  isLive: boolean
}

interface OnboardingProps {
  onComplete: (data: {
    url: string
    postcode: string
    instagram?: string
    tiktok?: string
    facebook?: string
    competitors?: Competitor[]
    socials?: SocialSnapshot[]
    mapsPin?: MapsPinSnapshot
  }) => void
}

type Step = 1 | 2 | 3 | 4 | 5

interface ScrapeStep {
  id: string
  label: string
  status: "pending" | "loading" | "success"
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
  platform: SocialSnapshot["platform"],
): Promise<SocialSnapshot | null> {
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
      caption?: string
      likes?: number
      comments?: number
      posted_at?: string
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
      image: data.post.image_url || data.post.thumbnail_url,
      caption: (data.post.caption || "").toString(),
      likes: data.post.likes,
      comments: data.post.comments,
      postedAt: data.post.posted_at || new Date().toISOString(),
    },
    isLive: Boolean(data.isLive),
  }
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>(1)
  const [url, setUrl] = useState("")
  const [postcode, setPostcode] = useState("")
  const [instagram, setInstagram] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [facebook, setFacebook] = useState("")
  
  // Scrape animation state. Each row maps 1:1 to a real SearchAPI.io engine.
  const [scrapeSteps, setScrapeSteps] = useState<ScrapeStep[]>([
    { id: "maps", label: "Locating Google profile", status: "pending" },
    { id: "socials", label: "Syncing social channels", status: "pending" },
    { id: "gap", label: "Calculating postcode gap", status: "pending" },
    { id: "ai", label: "Generating surgical strategy", status: "pending" },
  ])
  const [showCelebration, setShowCelebration] = useState(false)

  // Strict-mode + stale-dep safe: gate the whole async sequence behind a ref
  // so React 19 Strict Mode's double-mount doesn't kick the scrape twice,
  // and so the dep array can stay narrow (just `step`) without the effect
  // re-firing every time we set a piece of scraped state mid-flight.
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (step !== 5) return
    if (hasRunRef.current) return
    hasRunRef.current = true

    const setStatus = (id: string, status: ScrapeStep["status"]) =>
      setScrapeSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))

    const runScrapeSequence = async () => {
      // Snapshot user inputs to pass through to onComplete at the end. State
      // writes inside the effect no longer retrigger it, so we read these
      // once at the top for clarity.
      const inputs = { url, postcode, instagram, tiktok, facebook }

      let competitors: Competitor[] = []
      let socials: SocialSnapshot[] = []
      let mapsPin: MapsPinSnapshot | undefined

      // Step 1 — Google Maps profile (google_maps engine). Minimum 1.2s so
      // the checkmark doesn't snap before the user registers the label.
      setStatus("maps", "loading")
      const [mapsResult] = await Promise.all([
        fetchJSON<MapsPinSnapshot>("/api/maps", { postcode, q: `bakery ${postcode}` }),
        new Promise((r) => setTimeout(r, 1200)),
      ])
      if (mapsResult) mapsPin = mapsResult
      setStatus("maps", "success")

      // Step 2 — Socials in parallel (IG + TikTok + FB). Only fire the
      // engines we have handles for; skip the rest and still pass the row.
      await new Promise((r) => setTimeout(r, 300))
      setStatus("socials", "loading")
      const socialPromises: Promise<SocialSnapshot | null>[] = []
      if (instagram.trim())
        socialPromises.push(
          fetchSocial("/api/instagram", { username: instagram }, "instagram"),
        )
      if (tiktok.trim())
        socialPromises.push(
          fetchSocial("/api/tiktok", { username: tiktok }, "tiktok"),
        )
      if (facebook.trim())
        socialPromises.push(
          fetchSocial("/api/facebook", { page: facebook }, "facebook"),
        )
      const [socialResults] = await Promise.all([
        Promise.all(socialPromises),
        new Promise((r) => setTimeout(r, 1400)),
      ])
      socials = socialResults.filter((s): s is SocialSnapshot => s !== null)
      setStatus("socials", "success")

      // Step 3 — Postcode gap (google_local).
      await new Promise((r) => setTimeout(r, 300))
      setStatus("gap", "loading")
      try {
        const res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postcode, businessType: "bakery" }),
        })
        if (res.ok) {
          const data = await res.json()
          competitors = data.competitors || []
        }
      } catch {
        /* fallback handled downstream */
      }
      await new Promise((r) => setTimeout(r, 600))
      setStatus("gap", "success")

      // Step 4 — SERP intent warm-up (google). Fire-and-forget so the Lab
      // widget's own fetch can read a warm cache; we don't block on it.
      await new Promise((r) => setTimeout(r, 300))
      setStatus("ai", "loading")
      fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: `best artisan sourdough ${postcode}`,
          location: postcode.toUpperCase().startsWith("BN") ? "Brighton, UK" : undefined,
        }),
      }).catch(() => {})
      await new Promise((r) => setTimeout(r, 1500))
      setStatus("ai", "success")

      // Celebration
      await new Promise((r) => setTimeout(r, 500))
      setShowCelebration(true)
      await new Promise((r) => setTimeout(r, 1500))

      onComplete({
        ...inputs,
        competitors,
        socials,
        mapsPin,
      })
    }

    runScrapeSequence()
    // Deps deliberately narrow — the sequence reads inputs at the top and
    // onComplete is called exactly once at the tail. Adding user-input
    // deps here is what caused the original double-scrape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const handleFinish = () => {
    setStep(5) // Go to scrape animation
  }

  const nextStep = () => {
    if (step < 4) setStep((step + 1) as Step)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-xl">
        {/* Step 1: The Pilot's Welcome */}
        {step === 1 && (
          <div className="text-center">
            {/* Pilot Crest with Winged Logo */}
            <div className="pilot-crest mb-12 logo-fade">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bl-logo-original-CFi7dJhP0F3Kcn649TPSmaFQZu7zm7.png"
                alt="BrightLocal"
                className="h-12 logo-wings"
              />
            </div>

            {/* Content with staggered fade */}
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-foreground mb-4 text-balance stagger-1">
                Take the Pilot&apos;s Seat.
              </h1>
              <h2 className="text-xl text-muted-foreground mb-3 stagger-2">
                Stop managing your data. Start leading your neighbourhood.
              </h2>
              <p className="text-lg text-muted-foreground stagger-2">
                Let&apos;s calibrate your Local Pilot.
              </p>
            </div>

            {/* Pilot Tagline */}
            <div className="mb-10 stagger-3">
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                LOCAL PILOT. POWERED BY{" "}
                <span className="font-bold text-[#2AE855]">BRIGHTLOCAL.</span>
              </p>
            </div>

            <div className="stagger-4">
              <Button
                onClick={() => setStep(2)}
                className="h-14 px-10 text-lg font-semibold rounded-full bg-[#2AE855] text-black hover:bg-[#2AE855]/90 btn-squish"
              >
                Start Calibration
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Brand Identity (URL) */}
        {step === 2 && (
          <div>
            {/* Logo */}
            <div className="text-center mb-10 logo-fade">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bl-logo-original-CFi7dJhP0F3Kcn649TPSmaFQZu7zm7.png"
                alt="BrightLocal"
                className="h-8 mx-auto"
              />
            </div>

            <div className="text-center mb-8">
              <p className="text-sm font-mono text-[#2AE855] uppercase tracking-wider mb-2 stagger-1">Calibrating Brand DNA</p>
              <h1 className="text-3xl font-bold text-foreground mb-3 stagger-2">
                Where do you live on the web?
              </h1>
              <p className="text-muted-foreground stagger-2">
                Enter your business URL so we can learn your brand.
              </p>
            </div>

            <div className="mb-8 stagger-3">
              <Input
                type="text"
                placeholder="e.g. flourpot.co.uk"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-16 text-lg rounded-full px-6 bg-card text-foreground placeholder:text-muted-foreground text-center focus:bg-[#2AE855]/20 outline-none transition-colors"
              />
            </div>

            <div className="flex justify-center mt-10 stagger-4">
              <Button
                onClick={nextStep}
                disabled={!url}
                className="h-14 px-10 text-lg font-semibold rounded-full bg-[#2AE855] text-black hover:bg-[#2AE855]/90 btn-squish disabled:opacity-50"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: The Battleground (Postcode) */}
        {step === 3 && (
          <div>
            {/* Logo */}
            <div className="text-center mb-10 logo-fade">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bl-logo-original-CFi7dJhP0F3Kcn649TPSmaFQZu7zm7.png"
                alt="BrightLocal"
                className="h-8 mx-auto"
              />
            </div>

            <div className="text-center mb-8">
              <p className="text-sm font-mono text-[#2AE855] uppercase tracking-wider mb-2 stagger-1">Setting Flight Coordinates</p>
              <h1 className="text-3xl font-bold text-foreground mb-3 stagger-2">
                Which street are we winning today?
              </h1>
              <p className="text-muted-foreground stagger-2">
                Enter your target postcode to anchor your AI to a specific battleground.
              </p>
            </div>

            <div className="mb-8 stagger-3">
              <Input
                type="text"
                placeholder="e.g. BN1 4EN"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                className="h-16 text-lg rounded-full px-6 bg-card text-foreground placeholder:text-muted-foreground text-center uppercase focus:bg-[#2AE855]/20 outline-none transition-colors"
              />
            </div>

            <div className="flex justify-center stagger-4">
              <Button
                onClick={nextStep}
                disabled={!postcode}
                className="h-14 px-10 text-lg font-semibold rounded-full bg-[#2AE855] text-black hover:bg-[#2AE855]/90 btn-squish disabled:opacity-50"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Social Sync */}
        {step === 4 && (
          <div>
            {/* Logo */}
            <div className="text-center mb-10 logo-fade">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bl-logo-original-CFi7dJhP0F3Kcn649TPSmaFQZu7zm7.png"
                alt="BrightLocal"
                className="h-8 mx-auto"
              />
            </div>

            <div className="text-center mb-8">
              <p className="text-sm font-mono text-[#2AE855] uppercase tracking-wider mb-2 stagger-1">Syncing Engine Fuel</p>
              <h1 className="text-3xl font-bold text-foreground mb-3 stagger-2">
                Connect your Social Fuel.
              </h1>
              <p className="text-muted-foreground stagger-2">
                Link your social channels to power the Google algorithm with fresh content.
              </p>
            </div>

            <div className="space-y-4 mb-8 stagger-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="@instagram_handle"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="h-14 text-base rounded-full px-5 bg-card text-foreground placeholder:text-muted-foreground flex-1 focus:bg-[#2AE855]/20 outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="@tiktok_handle"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="h-14 text-base rounded-full px-5 bg-card text-foreground placeholder:text-muted-foreground flex-1 focus:bg-[#2AE855]/20 outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="facebook.com/yourpage"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="h-14 text-base rounded-full px-5 bg-card text-foreground placeholder:text-muted-foreground flex-1 focus:bg-[#2AE855]/20 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 stagger-4">
              <Button
                onClick={handleFinish}
                className="h-14 px-10 text-lg font-semibold rounded-full bg-[#2AE855] text-black hover:bg-[#2AE855]/90 btn-squish w-full max-w-xs"
              >
                Launch Discovery Scraper
              </Button>
              
              <button
                onClick={handleFinish}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now - I&apos;ll sync later
              </button>
            </div>
          </div>
        )}

        {/* Step 5: The Scrape Animation */}
        {step === 5 && (
          <div className={`${showCelebration ? 'celebration-glow' : ''}`}>
            {/* Logo */}
            <div className="text-center mb-10 logo-fade">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bl-logo-original-CFi7dJhP0F3Kcn649TPSmaFQZu7zm7.png"
                alt="BrightLocal"
                className="h-8 mx-auto"
              />
            </div>

            <div className="text-center mb-10 stagger-1">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#2AE855]/10 flex items-center justify-center">
                {showCelebration ? (
                  <svg className="w-8 h-8 text-[#2AE855]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-[#2AE855] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              <p className="text-sm font-mono text-[#2AE855] uppercase tracking-wider mb-3">
                {showCelebration ? "TAKEOFF" : "Pre-Flight Check"}
              </p>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {showCelebration ? "Cockpit Ready!" : "Building Your Surgical Map"}
              </h1>
              <p className="text-muted-foreground">
                {showCelebration 
                  ? "Your AI Local Pilot is online." 
                  : "Our Discovery Scraper is analyzing your digital presence..."
                }
              </p>
            </div>

            {/* Scrape Steps */}
            <div className="space-y-4 max-w-sm mx-auto">
              {scrapeSteps.map((scrapeStep, index) => (
                <div
                  key={scrapeStep.id}
                  className={`flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300 ${
                    scrapeStep.status === "success" 
                      ? "bg-[#2AE855]/10" 
                      : scrapeStep.status === "loading"
                      ? "bg-card"
                      : "bg-card opacity-50"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    scrapeStep.status === "success"
                      ? "bg-[#2AE855]"
                      : scrapeStep.status === "loading"
                      ? "bg-[#2AE855]"
                      : "bg-muted"
                  }`}>
                    {scrapeStep.status === "success" ? (
                      <svg className="w-5 h-5 text-white check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : scrapeStep.status === "loading" ? (
                      <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      scrapeStep.status === "success" 
                        ? "text-[#2AE855]" 
                        : scrapeStep.status === "loading"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}>
                      {scrapeStep.label}
                    </p>
                    {scrapeStep.status === "loading" && (
                      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#2AE855] progress-fill rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Success badge */}
                  {scrapeStep.status === "success" && (
                    <span className="text-xs font-mono text-[#2AE855] uppercase">Success</span>
                  )}
                </div>
              ))}
            </div>

            {/* Success Message */}
            {showCelebration && (
              <div className="mt-8 text-center fade-up">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2AE855]/10 border border-[#2AE855]/20">
                  <svg className="w-5 h-5 text-[#2AE855]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-[#2AE855] font-medium">Surgical Map Complete</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Dots */}
        {step > 1 && step < 5 && (
          <div className="flex justify-center gap-2 mt-12 stagger-5">
            {[2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step >= s ? 'bg-[#2AE855]' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
