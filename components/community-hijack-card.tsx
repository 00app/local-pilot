"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PilotInfo, PILOT_TINT } from "@/components/pilot-info"

interface LocalEvent {
  name: string
  daysAway: number
  spike: string
}

interface CommunityHijackCardProps {
  eventCount: number
  featuredEvent: LocalEvent
  suggestedPost: string
  onDeploy: (post: string) => void
}

export function CommunityHijackCard({
  eventCount,
  featuredEvent,
  suggestedPost,
  onDeploy,
}: CommunityHijackCardProps) {
  const [postText, setPostText] = useState(suggestedPost)
  const [isEditing, setIsEditing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isDeployed, setIsDeployed] = useState(false)

  const alternativePosts = [
    `${featuredEvent.name} crowds are heading our way. Reserve your collection slot on Sydney St now.`,
    `Planning your ${featuredEvent.name} day? Grab a pre-ordered box and skip the queue.`,
    `${featuredEvent.name} weekend calls for something special. Try our limited festival edition.`,
  ]

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    await new Promise((r) => setTimeout(r, 800))
    const randomPost = alternativePosts[Math.floor(Math.random() * alternativePosts.length)]
    setPostText(randomPost)
    setIsRegenerating(false)
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    await new Promise((r) => setTimeout(r, 1500))
    onDeploy(postText)
    setIsDeploying(false)
    setIsDeployed(true)
    setTimeout(() => setIsDeployed(false), 3000)
  }

  return (
    <div className="strategy-card card-sky h-full">
      <PilotInfo
        tint={PILOT_TINT.sky}
        title="intent hijacking"
        explanation="we scrape upcoming neighborhood events to draft posts that intercept traffic from visitors searching for things to do in brighton."
      />
      {/* Big Number */}
      <div className="mb-4">
        <p className="stat-number">
          {String(eventCount).padStart(2, "0")}
        </p>
        <p className="pilot-label">local events incoming.</p>
      </div>

      {/* Strategy Label */}
      <div className="mb-4">
        <p className="widget-index mb-2">04 · The hijack</p>
        <h3 className="text-xl font-bold">Community hijack.</h3>
        <p className="text-sm opacity-80 mt-1 line-clamp-2">
          {featuredEvent.name} is {featuredEvent.daysAway} days away. {featuredEvent.spike} spike in &quot;bakery near me&quot; expected.
        </p>
      </div>

      {/* Editable Post Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium opacity-70">
            {isEditing ? "Editing post:" : "Suggested post:"}
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
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          readOnly={!isEditing}
          rows={3}
        />
      </div>

      {/* Deploy Button */}
      <Button
        onClick={handleDeploy}
        disabled={isDeploying || isDeployed}
        className={`mt-4 h-12 w-full rounded-full font-semibold btn-squish transition-all ${
          isDeployed
            ? "bg-[#2AE855] text-black"
            : "bg-[var(--card-fg)] text-[var(--card-bg)] hover:brightness-110"
        }`}
      >
        {isDeploying ? (
          <span className="flex items-center gap-2">
            <Spinner className="w-4 h-4" />
            Hijacking...
          </span>
        ) : isDeployed ? (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Scheduled for {featuredEvent.name}
          </span>
        ) : (
          "Hijack the event"
        )}
      </Button>
    </div>
  )
}
