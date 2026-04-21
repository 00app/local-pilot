"use client"

import type { OvenStatus } from "@/lib/types"

interface OvenStatusToggleProps {
  status: OvenStatus
  onStatusChange: (status: OvenStatus) => void
}

const config: Record<
  OvenStatus,
  { label: string; temp: string; dot: string; text: string }
> = {
  HOT: {
    label: "oven hot",
    temp: "220°C",
    dot: "bg-[#2AE855]",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  LOW: {
    label: "running low",
    temp: "180°C",
    dot: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  },
  OUT: {
    label: "sold out",
    temp: "off",
    dot: "bg-gray-400",
    text: "text-muted-foreground",
  },
}

export function OvenStatusToggle({ status, onStatusChange }: OvenStatusToggleProps) {
  const statuses: OvenStatus[] = ["HOT", "LOW", "OUT"]
  const c = config[status]

  return (
    <div className="flex items-center gap-3 rounded-full bg-[var(--surface-chip)] border border-[var(--surface-chip-border)] pl-4 pr-1.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
        <span className="text-xs text-muted-foreground">oven status:</span>
        <span className={`text-xs font-mono font-semibold ${c.text}`}>{c.temp}</span>
      </div>
      <div className="flex gap-1">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={`w-7 h-7 rounded-full text-[10px] font-semibold transition-all btn-squish ${
              status === s
                ? `${config[s].dot} text-black`
                : "bg-background text-muted-foreground hover:text-foreground border border-[var(--surface-chip-border)]"
            }`}
            aria-label={`Set oven ${s.toLowerCase()}`}
            title={config[s].label}
          >
            {s[0]}
          </button>
        ))}
      </div>
    </div>
  )
}
