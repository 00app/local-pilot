"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Info } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Card palette hex values — mirrored from `--pilot-*` CSS tokens. Pass one of
 * these as `tint` on <PilotInfo /> so the popover inherits its host card's
 * colour (then brightness(0.9) is applied for the 10% darker legibility tint).
 */
export const PILOT_TINT = {
  mint: "#86EFAC",
  sky: "#BAE6FD",
  lemon: "#FEF08A",
  lavender: "#E0E7FF",
  coral: "#FECACA",
} as const

export type PilotTint = keyof typeof PILOT_TINT

export interface PilotInfoProps {
  title: string
  explanation: string
  /** Hex colour of the host card — popover renders as this colour, 10% darker. */
  tint: string
  /** Optional logic source footer override. */
  source?: string
  /** Override the default `absolute top-4 right-4` positioning on the trigger. */
  triggerClassName?: string
  /** Popover alignment relative to the trigger. */
  align?: "start" | "center" | "end"
}

/**
 * "Pilot Intelligence" popover — the navigation light of the cockpit.
 * Triggers on hover (desktop) + click/tap (mobile). Spring-loaded scale-in via
 * the existing `zoom-in-95` animation tokens. Match the host card's secondary
 * colour with a subtle brightness(0.9) tint for legibility against the card.
 */
export function PilotInfo({
  title,
  explanation,
  tint,
  source = "brightlocal brain v1.5",
  triggerClassName,
  align = "end",
}: PilotInfoProps) {
  const baseTrigger =
    "absolute top-4 right-4 z-10 opacity-60 hover:opacity-100 focus-visible:opacity-100 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-full p-1"
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    clearClose()
    // 180ms grace period — long enough for the cursor to travel across the
    // 8px sideOffset gap between trigger and popover without the popover
    // closing mid-hop. Without this, Radix portals the content into a sibling
    // node, so the mouse briefly leaves both surfaces and the popover flickers.
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }, [clearClose])

  // Cleanup any dangling timer on unmount to avoid setState on unmounted node.
  useEffect(() => () => clearClose(), [clearClose])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`pilot intelligence — ${title}`}
        onPointerEnter={(e) => {
          // Only hover-open on real mice. Touch devices fire pointerenter with
          // pointerType 'touch' and then immediately fire the click — opening
          // on enter would race the click and toggle it back off.
          if (e.pointerType !== "mouse") return
          clearClose()
          setOpen(true)
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return
          scheduleClose()
        }}
        onFocus={() => {
          clearClose()
          setOpen(true)
        }}
        onBlur={scheduleClose}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className={triggerClassName ?? baseTrigger}
      >
        <Info size={20} strokeWidth={1.75} className="text-current" />
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        onPointerEnter={clearClose}
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return
          scheduleClose()
        }}
        className="w-64 p-4 border-none rounded-2xl shadow-none text-black"
        style={{
          backgroundColor: tint,
          filter: "brightness(0.9)",
        }}
      >
        <p className="text-sm font-bold mb-1 lowercase tracking-tight">{title}</p>
        <p className="text-xs opacity-80 leading-relaxed">{explanation}</p>
        <div className="mt-3 pt-2 border-t border-black/10 text-[10px] font-mono uppercase tracking-[0.15em] opacity-60">
          logic source: {source}
        </div>
      </PopoverContent>
    </Popover>
  )
}
