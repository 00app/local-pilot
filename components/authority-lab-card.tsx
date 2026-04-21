"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PilotInfo, PILOT_TINT } from "@/components/pilot-info"

interface AuthorityLabCardProps {
  growth: number
  topic: string
  draftPreview: string
  wordCount: number
  location?: string
  onShip: (draft: string) => void
}

interface IntentPayload {
  query: string
  related_searches: string[]
  people_also_ask: { question: string; answer: string }[]
  isLive: boolean
}

export function AuthorityLabCard({
  growth,
  topic,
  draftPreview,
  wordCount,
  location,
  onShip,
}: AuthorityLabCardProps) {
  const [draft, setDraft] = useState(draftPreview)
  const [isEditing, setIsEditing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isShipping, setIsShipping] = useState(false)
  const [isShipped, setIsShipped] = useState(false)
  const [intent, setIntent] = useState<IntentPayload | null>(null)
  const [intentLoading, setIntentLoading] = useState(true)

  const fetchIntent = async () => {
    setIntentLoading(true)
    try {
      const q = `best ${topic} process`
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, location }),
      })
      if (res.ok) {
        const data: IntentPayload = await res.json()
        setIntent(data)
      }
    } catch (err) {
      console.warn("intent fetch failed:", err)
    } finally {
      setIntentLoading(false)
    }
  }

  useEffect(() => {
    fetchIntent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, location])

  const alternativeDrafts = [
    `A true ${topic} starts 36 hours before it ever reaches the counter. Our starter is fed twice daily, and the slow bulk ferment is what gives our loaves their signature open crumb and tangy depth. Every loaf is hand-shaped in our Sydney St bakery by bakers who know the dough by feel, not by the clock.`,
    `The secret to a standout ${topic} is time, not tricks. We cold-retard every loaf overnight to develop flavour, then bake on a stone deck for that crackling, blistered crust. Brighton's soft water and our locally-milled Sussex flour give our bread a character you simply can't buy off a shelf.`,
    `Why does our ${topic} taste different? Because we treat flour, water, salt and starter like they matter. A 24-hour fermentation window builds structure and flavour. Small-batch baking on Sydney St means every loaf leaves the oven within minutes of being sold.`,
  ]

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    // Mix a live PAA answer into the draft if we have one
    await new Promise((r) => setTimeout(r, 1200))
    const paa = intent?.people_also_ask?.[0]
    const base = alternativeDrafts[Math.floor(Math.random() * alternativeDrafts.length)]
    const next = paa
      ? `${base} ${paa.question} ${paa.answer ? paa.answer : ""}`.trim()
      : base
    setDraft(next)
    setIsRegenerating(false)
  }

  const handleShip = async () => {
    setIsShipping(true)
    await new Promise((r) => setTimeout(r, 1800))
    onShip(draft)
    setIsShipping(false)
    setIsShipped(true)
    setTimeout(() => setIsShipped(false), 3000)
  }

  const topQuestions = intent?.people_also_ask?.slice(0, 2) || []
  const topRelated = intent?.related_searches?.slice(0, 4) || []
  const isLive = Boolean(intent?.isLive)

  return (
    <div className="strategy-card-wide card-lavender h-full">
      <PilotInfo
        tint={PILOT_TINT.lavender}
        title="authority compounding"
        explanation="long-form deep dives answer the exact questions locals type into google. every published article compounds topical authority, pulling rank for dozens of adjacent queries."
      />
      <div className="flex items-start justify-between gap-8 mb-6">
        {/* Big Number */}
        <div>
          <p className="stat-massive">
            +{growth}<span className="text-5xl font-bold align-top relative -top-8">%</span>
          </p>
          <p className="pilot-label">authority growth this month.</p>
        </div>

        {/* Strategy Label — pr-8 reserves clearance for the absolute info icon */}
        <div className="text-right max-w-[50%] pr-8 pt-1">
          <p className="widget-index mb-2">05 · The lab</p>
          <h3 className="text-xl font-bold">Authority lab.</h3>
          <p className="text-sm opacity-80 mt-1">
            Deep-dive drafted on &quot;{topic}&quot; · {wordCount} words.
          </p>
        </div>
      </div>

      {/* Live Google intent signals (People Also Ask + related searches) */}
      <div className="mb-4 rounded-[16px] bg-white/40 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="widget-index">google intent signals</span>
            <span
              className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${
                isLive
                  ? "bg-[#2AE855] text-black font-semibold"
                  : "bg-white/60 opacity-70"
              }`}
              title={isLive ? "Live Google search via SearchAPI.io" : "Demo data — set SEARCHAPI_API_KEY"}
            >
              {intentLoading ? "loading" : isLive ? "live" : "demo"}
            </span>
          </div>
          <button
            onClick={fetchIntent}
            disabled={intentLoading}
            className="text-xs font-medium px-2 py-1 rounded-lg bg-white/50 hover:bg-white/80 transition-colors flex items-center gap-1"
          >
            {intentLoading && <Spinner className="w-3 h-3" />}
            Refresh
          </button>
        </div>

        {/* People Also Ask */}
        <div className="space-y-1.5 mb-3">
          {topQuestions.length === 0 && !intentLoading ? (
            <p className="text-xs opacity-60 italic">No People Also Ask results.</p>
          ) : (
            topQuestions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[10px] font-mono opacity-50 mt-1">PAA</span>
                <p className="flex-1 font-medium">{q.question}</p>
              </div>
            ))
          )}
        </div>

        {/* Related searches as pills */}
        {topRelated.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topRelated.map((r, i) => (
              <span
                key={i}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white/70 font-medium"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Editable Deep-Dive Draft */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium opacity-70">
              {isEditing ? "Editing deep dive:" : "Drafted deep dive:"}
            </label>
            <span className="text-xs font-mono opacity-60">~{wordCount} words</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/40 hover:bg-white/60 transition-colors"
            >
              {isEditing ? "Done" : "Edit"}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/40 hover:bg-white/60 transition-colors flex items-center gap-1"
            >
              {isRegenerating && <Spinner className="w-3 h-3" />}
              Regenerate
            </button>
          </div>
        </div>
        <textarea
          className="editor-field flex-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          readOnly={!isEditing}
          rows={5}
        />
      </div>

      {/* Ship Button */}
      <Button
        onClick={handleShip}
        disabled={isShipping || isShipped}
        className={`mt-5 h-12 w-full rounded-full font-semibold btn-squish transition-all ${
          isShipped
            ? "bg-[#2AE855] text-black"
            : "bg-[var(--card-fg)] text-[var(--card-bg)] hover:brightness-110"
        }`}
      >
        {isShipping ? (
          <span className="flex items-center gap-2">
            <Spinner className="w-4 h-4" />
            Publishing deep dive...
          </span>
        ) : isShipped ? (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Shipped to Google profile
          </span>
        ) : (
          "Review & ship"
        )}
      </Button>
    </div>
  )
}
