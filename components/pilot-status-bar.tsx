"use client"

export type VitalityLevel = "fresh" | "active" | "high" | "stale" | "low"

export interface VitalitySignals {
  social_pulse: VitalityLevel
  review_velocity: VitalityLevel
  technical_seo: VitalityLevel
}

interface PilotStatusBarProps {
  freshness: number
  rank: number
  totalRivals: number
  postcode: string
  lastSync: string
  activeEvents: number
  vitality: VitalitySignals
}

const LEVEL_DOT: Record<VitalityLevel, string> = {
  fresh: "bg-[#2AE855]",
  active: "bg-[#2AE855]",
  high: "bg-[#2AE855]",
  stale: "bg-amber-500 animate-pulse",
  low: "bg-amber-400",
}

const LEVEL_TEXT: Record<VitalityLevel, string> = {
  fresh: "text-emerald-600 dark:text-emerald-400",
  active: "text-emerald-600 dark:text-emerald-400",
  high: "text-emerald-600 dark:text-emerald-400",
  stale: "text-amber-600 dark:text-amber-400",
  low: "text-amber-500 dark:text-amber-300",
}

function VitalityChip({ label, level }: { label: string; level: VitalityLevel }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono">
      <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[level]}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${LEVEL_TEXT[level]}`}>{level}</span>
    </span>
  )
}

export function PilotStatusBar({
  freshness,
  rank,
  totalRivals,
  postcode,
  lastSync,
  activeEvents,
  vitality,
}: PilotStatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-cell">
        <div className="flex items-center gap-2">
          <span className="status-pulse-dot" />
          <p className="status-cell-label">Digital vitality</p>
        </div>
        <p className="status-cell-value">
          {freshness}
          <span className="text-xl font-bold text-muted-foreground">/100</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          <VitalityChip label="social_pulse" level={vitality.social_pulse} />
          <VitalityChip label="review_velocity" level={vitality.review_velocity} />
          <VitalityChip label="technical_seo" level={vitality.technical_seo} />
        </div>
      </div>

      <div className="status-cell">
        <p className="status-cell-label">Postcode rank</p>
        <p className="status-cell-value">
          #{rank}
          <span className="text-base font-semibold text-muted-foreground ml-1">
            / {totalRivals}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">live in {postcode}.</p>
      </div>

      <div className="status-cell">
        <p className="status-cell-label">Last sync</p>
        <p className="status-cell-value">{lastSync}</p>
        <p className="text-xs text-muted-foreground">social → Google profile.</p>
      </div>

      <div className="status-cell">
        <p className="status-cell-label">Events incoming</p>
        <p className="status-cell-value">
          {String(activeEvents).padStart(2, "0")}
        </p>
        <p className="text-xs text-muted-foreground">local hijacks available.</p>
      </div>
    </div>
  )
}
