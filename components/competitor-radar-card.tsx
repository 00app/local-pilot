"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PilotInfo, PILOT_TINT } from "@/components/pilot-info"

interface Competitor {
  name: string
  rating: number
  reviews: number
  type: string
  address: string
}

interface RivalReview {
  author: string
  rating: number
  text: string
  time: string
}

interface CompetitorRadarCardProps {
  postcode: string
  rank: number
  totalRivals: number
  rivals: Competitor[]
  businessType?: string
  onScan?: (nextRivals: Competitor[], isLive: boolean) => void
}

export function CompetitorRadarCard({
  postcode,
  rank,
  totalRivals,
  rivals,
  businessType = "bakery",
  onScan,
}: CompetitorRadarCardProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedAt, setScannedAt] = useState<Date | null>(new Date())
  const [liveRivals, setLiveRivals] = useState<Competitor[]>(rivals)
  const [isLive, setIsLive] = useState(false)

  // Per-rival review expansion state. `expandedRival` holds the name of the
  // currently open rival (only one open at a time to keep the card compact).
  const [expandedRival, setExpandedRival] = useState<string | null>(null)
  const [reviewCache, setReviewCache] = useState<
    Record<string, { reviews: RivalReview[]; isLive: boolean }>
  >({})
  const [reviewLoading, setReviewLoading] = useState<string | null>(null)

  useEffect(() => {
    setLiveRivals(rivals)
  }, [rivals])

  const topRivals = useMemo(() => {
    return [...liveRivals]
      .sort((a, b) => b.reviews - a.reviews || b.rating - a.rating)
      .slice(0, 3)
  }, [liveRivals])

  const maxReviews = Math.max(1, ...topRivals.map((r) => r.reviews))

  const handleScan = async () => {
    setIsScanning(true)
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode, businessType }),
      })
      if (!res.ok) throw new Error(`scrape ${res.status}`)
      const data: { competitors: Competitor[]; totalFound: number } = await res.json()

      const next = data.competitors?.length ? data.competitors : liveRivals
      const nowLive = (data.totalFound ?? next.length) > 5
      setLiveRivals(next)
      setIsLive(nowLive)
      setScannedAt(new Date())
      setExpandedRival(null) // collapse any open row on re-scan
      onScan?.(next, nowLive)
    } catch (err) {
      console.warn("radar re-scan failed:", err)
    } finally {
      setIsScanning(false)
    }
  }

  const handleRivalClick = async (rival: Competitor) => {
    // Toggle — click the same rival twice to close.
    if (expandedRival === rival.name) {
      setExpandedRival(null)
      return
    }
    setExpandedRival(rival.name)

    // If we've already fetched this rival's reviews, don't refetch.
    if (reviewCache[rival.name]) return

    setReviewLoading(rival.name)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rival.name, postcode }),
      })
      if (!res.ok) throw new Error(`reviews ${res.status}`)
      const data: { reviews: RivalReview[]; isLive: boolean } = await res.json()
      setReviewCache((prev) => ({
        ...prev,
        [rival.name]: { reviews: data.reviews ?? [], isLive: Boolean(data.isLive) },
      }))
    } catch (err) {
      console.warn("rival reviews fetch failed:", err)
      setReviewCache((prev) => ({
        ...prev,
        [rival.name]: { reviews: [], isLive: false },
      }))
    } finally {
      setReviewLoading(null)
    }
  }

  return (
    <div className="strategy-card-wide card-coral h-full">
      <PilotInfo
        tint={PILOT_TINT.coral}
        title="proximity competition"
        explanation="we rank your listing against the nearest rivals returned by google's local pack. proximity is one of the top three ranking signals — we track whose move is pulling attention away from your door. click any rival to see their latest reviews."
      />
      <div className="flex items-start justify-between gap-8 mb-6">
        <div>
          <p className="stat-massive">
            #{rank}
            <span className="text-4xl font-bold opacity-60 ml-2">/ {totalRivals}</span>
          </p>
          <p className="pilot-label">your rank in {postcode.split(" ")[0] || postcode}.</p>
        </div>

        {/* Strategy Label — pr-8 reserves clearance for the absolute info icon */}
        <div className="text-right max-w-[50%] pr-8 pt-1">
          <p className="widget-index mb-2">06 · The battle</p>
          <h3 className="text-xl font-bold">Competitor radar.</h3>
          <p className="text-sm opacity-80 mt-1">
            {totalRivals} rivals tracked in {postcode}.
          </p>
        </div>
      </div>

      {/* Rival list — each row is a click-to-expand review surface */}
      <div className="flex-1 min-h-0 flex flex-col gap-2.5">
        {topRivals.length === 0 ? (
          <div className="flex-1 rounded-[16px] bg-white/40 flex items-center justify-center text-sm opacity-70">
            Scanning the postcode for rivals...
          </div>
        ) : (
          topRivals.map((rival, i) => {
            const barWidth = Math.max(8, (rival.reviews / maxReviews) * 100)
            const isOpen = expandedRival === rival.name
            const cached = reviewCache[rival.name]
            const isLoading = reviewLoading === rival.name
            return (
              <div
                key={`${rival.name}-${i}`}
                className="rounded-[16px] bg-white/45 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => handleRivalClick(rival)}
                  aria-expanded={isOpen}
                  aria-controls={`rival-reviews-${i}`}
                  className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--card-fg)] focus-visible:ring-inset"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--card-fg)] text-[var(--card-bg)] text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <p className="text-sm font-semibold truncate">{rival.name}</p>
                      <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
                        <span>★ {rival.rating.toFixed(1)}</span>
                        <span className="opacity-60">·</span>
                        <span>{rival.reviews.toLocaleString()} reviews</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--card-fg)] rounded-full transition-all duration-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 opacity-60 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`rival-reviews-${i}`}
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.24, ease: [0.34, 1.56, 0.64, 1] },
                        opacity: { duration: 0.18 },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pt-0.5 border-t border-white/50">
                        {isLoading ? (
                          <div className="flex items-center gap-2 py-3 text-xs font-mono opacity-70">
                            <Spinner className="w-3.5 h-3.5" />
                            pulling latest reviews…
                          </div>
                        ) : cached && cached.reviews.length > 0 ? (
                          <>
                            <div className="flex items-center justify-between mt-2.5 mb-2">
                              <p className="text-[10px] font-mono uppercase tracking-[0.15em] opacity-65">
                                latest reviews
                              </p>
                              <span
                                className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${
                                  cached.isLive
                                    ? "bg-[#2AE855] text-black font-semibold"
                                    : "bg-white/60 opacity-75"
                                }`}
                                title={
                                  cached.isLive
                                    ? "Live Google reviews via SearchAPI.io"
                                    : "Demo reviews — set SEARCHAPI_API_KEY to pull live"
                                }
                              >
                                {cached.isLive ? "live" : "demo"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-2">
                              {cached.reviews.slice(0, 3).map((r, rIdx) => (
                                <div
                                  key={`${r.author}-${rIdx}`}
                                  className="rounded-[12px] bg-white/55 px-3 py-2"
                                >
                                  <div className="flex items-center justify-between gap-3 mb-0.5">
                                    <p className="text-xs font-semibold truncate">{r.author}</p>
                                    <span className="text-[11px] font-mono opacity-75 shrink-0">
                                      {"★".repeat(Math.max(1, Math.round(r.rating)))}
                                      <span className="opacity-50 ml-1.5 font-normal">
                                        {r.time}
                                      </span>
                                    </span>
                                  </div>
                                  <p className="text-xs leading-snug opacity-85 line-clamp-3">
                                    &quot;{r.text}&quot;
                                  </p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="py-3 text-xs opacity-70 italic">
                            No recent reviews available.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })
        )}
      </div>

      {/* Footer: Scan button + last scan timestamp */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-xs font-mono opacity-70">
            {scannedAt
              ? `last scan · ${scannedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "awaiting first scan"}
          </p>
          <span
            className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-1 rounded-full ${
              isLive
                ? "bg-[#2AE855] text-black font-semibold"
                : "bg-white/50 opacity-70"
            }`}
            title={
              isLive
                ? "Live Google Local data via SearchAPI.io"
                : "Demo data — set SEARCHAPI_API_KEY in .env.local to go live"
            }
          >
            {isLive ? "live · google local" : "demo data"}
          </span>
        </div>
        <Button
          onClick={handleScan}
          disabled={isScanning}
          className="h-12 px-6 rounded-full font-semibold btn-squish bg-[var(--card-fg)] text-[var(--card-bg)] hover:brightness-110"
        >
          {isScanning ? (
            <span className="flex items-center gap-2">
              <Spinner className="w-4 h-4" />
              Re-scanning rivals...
            </span>
          ) : (
            "Re-scan postcode"
          )}
        </Button>
      </div>
    </div>
  )
}
