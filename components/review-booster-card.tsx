"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PilotInfo, PILOT_TINT } from "@/components/pilot-info"

interface ReviewBoosterCardProps {
  rating: number
  latestReview: {
    author: string
    text: string
    stars: number
  }
  suggestedResponse: string
  onPublish: (response: string) => void
}

export function ReviewBoosterCard({ rating, latestReview, suggestedResponse, onPublish }: ReviewBoosterCardProps) {
  const [responseText, setResponseText] = useState(suggestedResponse)
  const [isEditing, setIsEditing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  // Pull in an updated `suggestedResponse` when the parent swaps in a live
  // response draft (e.g. after `/api/business` resolves the owner's actual
  // latest Google review). We only sync while the owner isn't actively
  // editing, so in-flight edits are never clobbered.
  useEffect(() => {
    if (isEditing) return
    setResponseText(suggestedResponse)
  }, [suggestedResponse, isEditing])

  const alternativeResponses = [
    `Thanks so much, ${latestReview.author}! We're delighted you enjoyed it. See you again soon!`,
    `${latestReview.author}, you've made our day! Can't wait to serve you again.`,
    `We appreciate the kind words, ${latestReview.author}! Fresh pastries are waiting for your next visit.`,
  ]

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    await new Promise(r => setTimeout(r, 800))
    const randomResponse = alternativeResponses[Math.floor(Math.random() * alternativeResponses.length)]
    setResponseText(randomResponse)
    setIsRegenerating(false)
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    await new Promise(r => setTimeout(r, 1500))
    onPublish(responseText)
    setIsPublishing(false)
    setIsPublished(true)
    setTimeout(() => setIsPublished(false), 3000)
  }

  return (
    <div className="strategy-card card-yellow h-full">
      <PilotInfo
        tint={PILOT_TINT.lemon}
        title="sentiment velocity"
        explanation="responding to reviews with hyper-local keywords increases your authority in the bn1 postcode. we use resident-speak to build trust."
      />
      {/* Big Number */}
      <div className="mb-4">
        <p className="stat-number">{rating}</p>
        <p className="pilot-label">aggregate rating.</p>
      </div>

      {/* Strategy Label */}
      <div className="mb-4">
        <p className="text-sm font-medium opacity-70 mb-1">03</p>
        <h3 className="text-xl font-bold">Review booster.</h3>
        <p className="text-sm opacity-80 mt-1 line-clamp-2">
          Responds to reviews and amplifies 5-star sentiment.
        </p>
      </div>

      {/* Latest Review */}
      <div className="bg-white/40 rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold truncate">{latestReview.author}</span>
          <span className="text-yellow-600 dark:text-yellow-300 shrink-0">
            {"★".repeat(latestReview.stars)}
          </span>
        </div>
        <p className="text-sm opacity-80 line-clamp-2">&quot;{latestReview.text}&quot;</p>
      </div>

      {/* Editable Response Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium opacity-70">
            {isEditing ? "Editing response:" : "Suggested response:"}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-medium px-2 py-1 rounded-lg bg-white/30 hover:bg-white/50 transition-colors"
            >
              {isEditing ? "Done" : "Edit"}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="text-xs font-medium px-2 py-1 rounded-lg bg-white/30 hover:bg-white/50 transition-colors flex items-center gap-1"
            >
              {isRegenerating && <Spinner className="w-3 h-3" />}
              Regenerate
            </button>
          </div>
        </div>
        <textarea
          className="post-editor flex-1 resize-none"
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          readOnly={!isEditing}
          rows={2}
        />
      </div>

      {/* Publish Button */}
      <Button
        onClick={handlePublish}
        disabled={isPublishing || isPublished}
        className={`mt-4 h-12 w-full rounded-full font-semibold btn-squish transition-all ${
          isPublished
            ? "bg-[#2AE855] text-black"
            : "bg-[var(--card-fg)] text-[var(--card-bg)] hover:brightness-110"
        }`}
      >
        {isPublishing ? (
          <span className="flex items-center gap-2">
            <Spinner className="w-4 h-4" />
            Publishing...
          </span>
        ) : isPublished ? (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Published to Google
          </span>
        ) : (
          "Publish to Google"
        )}
      </Button>
    </div>
  )
}
