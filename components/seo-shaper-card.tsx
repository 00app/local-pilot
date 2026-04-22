"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PilotInfo, PILOT_TINT } from "@/components/pilot-info"

export type TweakCategory = "photo" | "schema" | "category" | "keyword"

export interface TechnicalTweak {
  id: string
  category: TweakCategory
  title: string
  reason: string
  cta: string
  lift: string
}

interface SeoShaperCardProps {
  targetRank: number
  targetKeyword: string
  rankDelta?: number // positive = moved up, negative = slipping
  tweaks: TechnicalTweak[]
  onApply: (tweak: TechnicalTweak) => void
  onAllApplied?: () => void
}

const CATEGORY_META: Record<
  TweakCategory,
  { label: string; accent: string; icon: React.ReactNode }
> = {
  photo: {
    label: "media",
    accent: "bg-white/60 dark:bg-white/15",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M7 5l2-2h6l2 2" />
      </svg>
    ),
  },
  schema: {
    label: "schema",
    accent: "bg-white/60 dark:bg-white/15",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  category: {
    label: "category",
    accent: "bg-white/60 dark:bg-white/15",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 12l9 4 9-4" />
        <path d="M3 17l9 4 9-4" />
      </svg>
    ),
  },
  keyword: {
    label: "keyword",
    accent: "bg-white/60 dark:bg-white/15",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    ),
  },
}

export function SeoShaperCard({
  targetRank,
  targetKeyword,
  rankDelta = -1,
  tweaks,
  onApply,
  onAllApplied,
}: SeoShaperCardProps) {
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const remaining = tweaks.filter((t) => !applied.has(t.id))
  const allApplied = applied.size === tweaks.length
  const primary = remaining[0]

  const isSlipping = rankDelta < 0

  const handleApply = async (tweak: TechnicalTweak) => {
    if (applied.has(tweak.id) || applyingId) return
    setApplyingId(tweak.id)
    await new Promise((r) => setTimeout(r, 1200))
    onApply(tweak)
    setApplied((prev) => {
      const next = new Set(prev)
      next.add(tweak.id)
      if (next.size === tweaks.length) onAllApplied?.()
      return next
    })
    setApplyingId(null)
  }

  const status = useMemo(() => {
    if (allApplied) return { label: "technical freshness: fresh", tone: "bg-[#2AE855] text-black" }
    if (isSlipping)
      return {
        label: "technical freshness: stale",
        tone: "bg-[var(--card-fg)] text-[var(--card-bg)]",
      }
    return { label: "technical freshness: monitoring", tone: "bg-white/60 dark:bg-white/15" }
  }, [allApplied, isSlipping])

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: allApplied
          ? "0 0 0 0 rgba(127, 29, 29, 0)"
          : isSlipping
          ? ["0 0 0 0 rgba(127, 29, 29, 0.5)", "0 0 0 10px rgba(127, 29, 29, 0)", "0 0 0 0 rgba(127, 29, 29, 0)"]
          : "0 0 0 0 rgba(127, 29, 29, 0)",
      }}
      transition={{
        opacity: { type: "spring", stiffness: 200, damping: 22 },
        y: { type: "spring", stiffness: 200, damping: 22 },
        boxShadow: { duration: 2.4, repeat: Infinity, repeatDelay: 0.4 },
      }}
      className="strategy-card-wide card-coral w-full"
      style={{ minHeight: "auto" }}
    >
      <p className="widget-index mb-2">07 · The shaper</p>
      <div className="flex items-start justify-between gap-8 mb-6">
        {/* Big Number */}
        <div>
          <div className="flex items-baseline gap-3">
            <p className="stat-massive">
              #{String(targetRank).padStart(2, "0")}
            </p>
            <span
              className={`text-sm font-mono font-semibold ${
                rankDelta > 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : rankDelta < 0
                  ? "text-[var(--card-fg)] dark:brightness-125"
                  : "opacity-60"
              }`}
            >
              {rankDelta > 0 ? `▲ +${rankDelta}` : rankDelta < 0 ? `▼ ${rankDelta}` : "—"}
            </span>
          </div>
          <p className="pilot-label">
            target rank for &quot;{targetKeyword}&quot;.
          </p>
        </div>

        {/* Strategy Label + status badge */}
        <div className="text-left max-w-[55%] relative">
          <div className="flex items-center gap-2 mb-2">
            <PilotInfo
              tint={PILOT_TINT.coral}
              title="technical audit"
              explanation="this identifies 'silent' ranking killers, like outdated categories or missing schema, comparing your listing to the top 3 rivals in your street."
              triggerClassName="opacity-60 hover:opacity-100 focus-visible:opacity-100 transition-opacity outline-none rounded-full p-1"
              align="end"
            />
          </div>
          <h3 className="text-xl font-bold">SEO shaper.</h3>
          <p className="text-sm opacity-80 mt-1">
            {remaining.length} freshness gap{remaining.length === 1 ? "" : "s"} vs top 3 rivals.
          </p>
          <span
            className={`inline-block mt-2 text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-full ${status.tone}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Primary tweak alert */}
      <AnimatePresence mode="wait">
        {primary && (
          <motion.div
            key={primary.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="mb-4 rounded-[16px] bg-white/45 dark:bg-white/10 p-4 flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--card-fg)] text-[var(--card-bg)] flex items-center justify-center shrink-0">
              {CATEGORY_META[primary.category].icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="widget-index mb-1">Technical freshness alert</p>
              <p className="text-base font-semibold leading-snug">{primary.title}</p>
              <p className="text-sm opacity-80 mt-0.5">{primary.reason}</p>
            </div>
            <span className="shrink-0 text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-1 rounded-full bg-white/60 dark:bg-white/15">
              {primary.lift}
            </span>
          </motion.div>
        )}

        {allApplied && (
          <motion.div
            key="all-applied"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-[16px] bg-[#2AE855]/20 p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-[#2AE855] text-black flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold">All technical tweaks shipped.</p>
              <p className="text-sm opacity-80">
                Rank on &quot;{targetKeyword}&quot; projected to move up 2 positions within 72 hours.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tweak grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tweaks.map((tweak) => {
          const isApplied = applied.has(tweak.id)
          const isApplying = applyingId === tweak.id
          const meta = CATEGORY_META[tweak.category]
          if (tweak.category === "photo") {
            return (
              <PhotoTweakCell
                key={tweak.id}
                tweak={tweak}
                meta={meta}
                isApplied={isApplied}
                isApplying={isApplying}
                onApply={handleApply}
              />
            )
          }
          return (
            <div
              key={tweak.id}
              className={`rounded-[16px] p-4 flex flex-col gap-3 transition-all ${
                isApplied
                  ? "bg-[#2AE855]/30 opacity-90"
                  : "bg-white/45 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${meta.accent}`}>
                  {meta.label}
                </span>
                {isApplied ? (
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-[#2AE855] text-black font-semibold">
                    applied
                  </span>
                ) : (
                  <span className="text-[10px] font-mono opacity-60">
                    {tweak.lift}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-snug">{tweak.title}</p>
                <p className="text-xs opacity-75 mt-1 line-clamp-2">{tweak.reason}</p>
              </div>
              <Button
                onClick={() => handleApply(tweak)}
                disabled={isApplied || isApplying}
                className={`h-10 w-full rounded-full font-semibold btn-squish transition-all text-sm ${
                  isApplied
                    ? "bg-[#2AE855] text-black"
                    : "bg-[var(--card-fg)] text-[var(--card-bg)] hover:brightness-110"
                }`}
              >
                {isApplying ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    Applying...
                  </span>
                ) : isApplied ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Tweak shipped
                  </span>
                ) : (
                  tweak.cta
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ---------- PhotoTweakCell ----------

/** Max file size before we reject — GBP itself caps storefront photos around
 *  5MB, so we match that without pretending to be lenient. */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

interface PhotoTweakCellProps {
  tweak: TechnicalTweak
  meta: { label: string; accent: string; icon: React.ReactNode }
  isApplied: boolean
  isApplying: boolean
  onApply: (tweak: TechnicalTweak) => void | Promise<void>
}

/**
 * Photo-category tweak cell. Drop an image onto the card or click the
 * dashed picker to open the native file chooser. On selection we render a
 * 4:3 preview, surface filename + size, and the primary CTA swaps from
 * "Upload new photo" → "Deploy photo" → (after apply) "Photo shipped".
 *
 * Ring-dashed drag-over state uses the card's `--card-fg` ink so it stays
 * on-brand in both light + dark modes.
 */
function PhotoTweakCell({
  tweak,
  meta,
  isApplied,
  isApplying,
  onApply,
}: PhotoTweakCellProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  // Revoke the object URL when it changes or the cell unmounts — without
  // this the blob hangs around in memory for every re-pick.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const acceptFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Not an image — drop a JPG, PNG, or WebP.")
      return
    }
    if (f.size > MAX_PHOTO_BYTES) {
      setError(`Too big (${formatBytes(f.size)}). Max 5 MB.`)
      return
    }
    setError(null)
    setFile(f)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(f)
    })
  }

  const clearFile = () => {
    setFile(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleDeploy = async () => {
    if (!file || isApplied || isApplying) return
    await onApply(tweak)
    toast.success("Storefront photo shipped to Google.", {
      description: `${file.name} is live on your business profile.`,
    })
  }

  const onPickClick = () => {
    if (isApplied || isApplying) return
    inputRef.current?.click()
  }

  // DataTransfer fires dragenter/dragleave for every nested child, so we
  // count depth to avoid the drop zone flickering when the cursor crosses
  // a child element. Drop + dragend both zero the counter.
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (isApplied || isApplying) return
    dragDepth.current += 1
    setIsDragging(true)
  }
  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setIsDragging(false)
  }
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepth.current = 0
    setIsDragging(false)
    if (isApplied || isApplying) return
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) acceptFile(dropped)
  }

  const ctaLabel = isApplied
    ? "Photo shipped"
    : isApplying
    ? "Uploading..."
    : file
    ? "Deploy photo"
    : tweak.cta

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-[16px] p-4 flex flex-col gap-3 transition-all ${
        isApplied
          ? "bg-[#2AE855]/30 opacity-90"
          : isDragging
          ? "bg-white/80 dark:bg-white/20 ring-2 ring-dashed ring-[var(--card-fg)]"
          : "bg-white/45 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${meta.accent}`}
        >
          {meta.label}
        </span>
        {isApplied ? (
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-[#2AE855] text-black font-semibold">
            applied
          </span>
        ) : (
          <span className="text-[10px] font-mono opacity-60">{tweak.lift}</span>
        )}
      </div>

      {/* Drop zone / preview */}
      {previewUrl ? (
        <div className="relative aspect-[4/3] rounded-[12px] overflow-hidden bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={file?.name || "Storefront preview"}
            className="w-full h-full object-cover"
          />
          {!isApplied && !isApplying && (
            <button
              type="button"
              onClick={clearFile}
              aria-label="Remove photo"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {isApplied && (
            <div className="absolute inset-0 bg-[#2AE855]/30 flex items-end p-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-[#2AE855] text-black font-semibold">
                live on google
              </span>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onPickClick}
          className={`aspect-[4/3] rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 px-2 text-center transition-colors ${
            isDragging
              ? "border-[var(--card-fg)] bg-[var(--card-fg)]/5"
              : "border-[var(--card-fg)]/25 hover:border-[var(--card-fg)]/55"
          }`}
        >
          <Upload className="w-5 h-5 opacity-70" aria-hidden />
          <p className="text-xs font-medium leading-tight">
            {isDragging ? "Drop to stage" : "Drop image or click to pick"}
          </p>
          <p className="text-[10px] font-mono opacity-55 leading-tight">
            jpg · png · webp · 5 mb max
          </p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) acceptFile(f)
        }}
      />

      {/* Body */}
      <div className="flex-1">
        <p className="text-sm font-semibold leading-snug">{tweak.title}</p>
        <p className="text-xs opacity-75 mt-1 line-clamp-2">
          {file
            ? `${file.name} · ${formatBytes(file.size)}`
            : tweak.reason}
        </p>
        {error && (
          <p className="text-[11px] font-mono text-red-700 dark:text-red-300 mt-1">
            {error}
          </p>
        )}
      </div>

      {/* Primary CTA */}
      <Button
        onClick={file ? handleDeploy : onPickClick}
        disabled={isApplied || isApplying}
        className={`h-10 w-full rounded-full font-semibold btn-squish transition-all text-sm ${
          isApplied
            ? "bg-[#2AE855] text-black"
            : "bg-[var(--card-fg)] text-[var(--card-bg)] hover:brightness-110"
        }`}
      >
        {isApplying ? (
          <span className="flex items-center gap-2">
            <Spinner className="w-4 h-4" />
            Uploading...
          </span>
        ) : isApplied ? (
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {ctaLabel}
          </span>
        ) : (
          ctaLabel
        )}
      </Button>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
