"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { generateStrategy, type PostTone, type EnvMode, type OvenHeat } from "@/lib/strategy"
import { proxiedSocialImageUrl } from "@/lib/social-image-url"
import { PilotInfo, PILOT_TINT } from "@/components/pilot-info"

interface SocialSyncCardProps {
  lastSync: string
  suggestedPost: string
  onDeploy: (post: string, stagedImage?: string) => void
  // Optional: when provided, The Pulse pulls the latest IG post and translates its caption.
  instagramHandle?: string
  postcode?: string
  street?: string
  envMode?: EnvMode
  ovenStatus?: OvenHeat
}

interface InstagramLatest {
  username: string
  full_name?: string
  post: {
    image_url: string
    caption: string
    likes: number
    comments: number
    posted_at: string
  } | null
  isLive: boolean
}

const TONES: Array<{ id: PostTone; label: string; hint: string }> = [
  { id: "direct", label: "Direct", hint: "Available now on {street}." },
  { id: "story", label: "Story", hint: "Our bakers started at 4am…" },
  { id: "offer", label: "Offer", hint: "10% off today. Mention this post." },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.max(1, Math.round(diff / 60000))
  if (min < 60) return `${min}m`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h`
  const d = Math.round(hr / 24)
  return `${d}d`
}

export function SocialSyncCard({
  lastSync,
  suggestedPost,
  onDeploy,
  instagramHandle,
  postcode,
  street = "Sydney Street",
  envMode,
  ovenStatus,
}: SocialSyncCardProps) {
  const [postText, setPostText] = useState(suggestedPost)
  const [isEditing, setIsEditing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isDeployed, setIsDeployed] = useState(false)
  const [ig, setIg] = useState<InstagramLatest | null>(null)
  const [tone, setTone] = useState<PostTone>("direct")
  const [userEdited, setUserEdited] = useState(false)

  // Sync `suggestedPost` when the parent recomputes it (e.g. after async
  // socials/businessMeta arrive and the dashboard's strategy pipeline
  // generates a fresher pulse). Don't stomp on in-flight edits or on the
  // IG-driven translation below.
  useEffect(() => {
    if (userEdited || isEditing) return
    if (ig?.post?.caption) return
    setPostText(suggestedPost)
  }, [suggestedPost, userEdited, isEditing, ig])

  // Fetch the latest IG post when a handle is provided.
  useEffect(() => {
    if (!instagramHandle) return
    let cancelled = false
    fetch("/api/instagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: instagramHandle }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: InstagramLatest | null) => {
        if (cancelled || !data?.post) return
        setIg(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [instagramHandle])

  // Re-translate whenever any strategy input changes (IG caption, tone, env,
  // oven), but don't stomp on a caption the owner is actively editing.
  useEffect(() => {
    if (userEdited || isEditing) return
    const caption = ig?.post?.caption
    if (!caption || !postcode) return
    const move = generateStrategy({
      caption,
      postcode,
      street,
      envMode,
      ovenStatus,
      tone,
    })
    setPostText(move.optimized_post)
  }, [ig, postcode, street, envMode, ovenStatus, tone, userEdited, isEditing])

  const alternativePosts = useMemo(() => {
    if (ig?.post?.caption && postcode) {
      // Different tone + keyword seed for each variant.
      const base = { caption: ig.post.caption, postcode, street, envMode, ovenStatus }
      return [
        generateStrategy({ ...base, tone: "direct" }).optimized_post,
        generateStrategy({ ...base, tone: "story" }).optimized_post,
        generateStrategy({ ...base, tone: "offer" }).optimized_post,
      ]
    }
    return [
      "Fresh from the oven this morning. Come taste the difference in Brighton.",
      "Artisan bread made with love, ready for your table today.",
      "The smell of fresh sourdough is calling. Visit us on Sydney St.",
    ]
  }, [ig, postcode, street, envMode, ovenStatus])

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    await new Promise((r) => setTimeout(r, 800))
    const randomPost = alternativePosts[Math.floor(Math.random() * alternativePosts.length)]
    setPostText(randomPost)
    setUserEdited(false)
    setIsRegenerating(false)
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    await new Promise((r) => setTimeout(r, 1500))
    onDeploy(postText, ig?.post?.image_url)
    setIsDeploying(false)
    setIsDeployed(true)
    setTimeout(() => setIsDeployed(false), 3000)
  }

  const detectedLabel = ig?.post ? timeAgo(ig.post.posted_at) : lastSync
  const isLive = Boolean(ig?.isLive)

  return (
    <div className="strategy-card card-mint h-full">
      <PilotInfo
        tint={PILOT_TINT.mint}
        title="signal-to-seo bridging"
        explanation="instagram is for aspiration (pretty pictures); google is for intent (where is the bread?). we strip hashtags + emoji, tilt to product intent, inject the environment, and anchor the post to your postcode so google's map algorithm treats the content as local."
      />
      {/* Big Number */}
      <div className="mb-4">
        <p className="stat-number">{detectedLabel}</p>
        <p className="pilot-label">
          {ig?.post ? "since latest instagram post." : "since last sync."}
        </p>
      </div>

      {/* Strategy Label */}
      <div className="mb-4">
        <p className="widget-index mb-2">02 · The pulse</p>
        <h3 className="text-xl font-bold">Social sync.</h3>
        <p className="text-sm opacity-80 mt-1 line-clamp-2">
          Translates Instagram activity into Google posts.
        </p>
      </div>

      {/* 1:1 Instagram preview (only when we have a post) */}
      {ig?.post && (
        <div className="mb-3 flex items-start gap-3 rounded-[16px] bg-white/40 p-2.5">
          <div className="w-16 h-16 rounded-[12px] overflow-hidden shrink-0 bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proxiedSocialImageUrl(ig.post.image_url)}
              alt={`@${ig.username} latest post`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-xs font-semibold truncate">@{ig.username}</p>
              <span
                className={`text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full shrink-0 ${
                  isLive ? "bg-[#2AE855] text-black font-semibold" : "bg-white/70 opacity-70"
                }`}
                title={isLive ? "Live Instagram via SearchAPI.io" : "Demo — set SEARCHAPI_API_KEY"}
              >
                {isLive ? "live" : "demo"}
              </span>
            </div>
            <p className="text-xs opacity-80 line-clamp-2 leading-snug">
              &quot;{ig.post.caption}&quot;
            </p>
            <p className="text-[10px] font-mono opacity-60 mt-1">
              ♥ {ig.post.likes.toLocaleString()} · 💬 {ig.post.comments.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Tone pills — Syndicate & Spin */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] opacity-60 shrink-0">
          tone
        </span>
        {TONES.map((t) => {
          const active = tone === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTone(t.id)
                setUserEdited(false)
              }}
              title={t.hint}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all btn-squish ${
                active
                  ? "bg-[var(--card-fg)] text-[var(--card-bg)]"
                  : "bg-white/40 hover:bg-white/60 opacity-80"
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Editable Post Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium opacity-70">
            {isEditing ? "Editing post:" : "Translated post:"}
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
          onChange={(e) => {
            setPostText(e.target.value)
            setUserEdited(true)
          }}
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
            Deploying...
          </span>
        ) : isDeployed ? (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Deployed to Google
          </span>
        ) : (
          "Deploy to Google"
        )}
      </Button>
    </div>
  )
}
