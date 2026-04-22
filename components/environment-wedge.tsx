"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { OvenStatus } from "@/lib/types"

export type EnvironmentMode = "rain" | "sun" | "commuter"

interface EnvScenario {
  label: string
  temp: string
  bg: string
  text: string
  dot: string
  iconBg: string
  message: string
  intentMetric: string
  icon: React.ReactNode
}

const SCENARIOS: Record<EnvironmentMode, EnvScenario> = {
  rain: {
    label: "light rain",
    temp: "14°C",
    bg: "bg-sky-100 dark:bg-sky-950",
    text: "text-sky-950 dark:text-sky-100",
    dot: "bg-sky-600 dark:bg-sky-300",
    iconBg: "bg-sky-200 dark:bg-sky-900",
    message: "it's raining in bn1. shifting strategy to 'indoor comfort' intent.",
    intentMetric: "+22% coffee search",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" />
        <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
      </svg>
    ),
  },
  sun: {
    label: "warm sun",
    temp: "24°C",
    bg: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-950 dark:text-amber-100",
    dot: "bg-amber-500 dark:bg-amber-300",
    iconBg: "bg-amber-200 dark:bg-amber-900",
    message: "temperature spike detected. tilting to 'iced drinks & garden seating' intent.",
    intentMetric: "+31% iced coffee search",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
  commuter: {
    label: "monday 08:04",
    temp: "commuter peak",
    bg: "bg-indigo-100 dark:bg-indigo-950",
    text: "text-indigo-950 dark:text-indigo-100",
    dot: "bg-indigo-500 dark:bg-indigo-300",
    iconBg: "bg-indigo-200 dark:bg-indigo-900",
    message: "commuter peak detected. drafting a 'quick grab & go' angle for the morning rush.",
    intentMetric: "+18% breakfast search",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
}

interface EnvironmentWedgeProps {
  mode: EnvironmentMode
  onCycle: () => void
  ovenStatus?: OvenStatus
  weather?: {
    condition: string
    tempC: number
    isLive: boolean
  } | null
  /** Short postcode area (e.g. `BN1`) — anchors the compound line. */
  postcodeArea?: string
  /** Live street from the business's Maps address — replaces "Sydney St". */
  street?: string
}

export function EnvironmentWedge({
  mode,
  onCycle,
  ovenStatus,
  weather,
  postcodeArea,
  street,
}: EnvironmentWedgeProps) {
  const s = SCENARIOS[mode]
  const weatherLabel = weather?.condition?.toLowerCase() || s.label
  const weatherTemp = typeof weather?.tempC === "number" ? `${Math.round(weather.tempC)}°C` : s.temp
  const areaLower = postcodeArea ? postcodeArea.toLowerCase() : "bn1"
  const liveMessage =
    mode === "rain"
      ? `it's ${weatherLabel} in ${areaLower}. shifting strategy to 'indoor comfort' intent.`
      : mode === "sun"
        ? `it's ${weatherLabel} in ${areaLower}. tilting to 'iced drinks & garden seating' intent.`
        : `it's ${weatherLabel} in ${areaLower}. drafting a 'quick grab & go' angle for the morning rush.`

  // Mic-drop: Hot oven + Rain = compound suggestion, anchored to the live
  // street + area when we have them (falls back to the Sydney St seed copy
  // when the cockpit is still pre-onboarding or /api/business didn't
  // resolve the pin).
  const streetLabel = street && street !== "your street" ? street.toLowerCase() : "sydney st."
  const compound =
    ovenStatus === "HOT" && mode === "rain"
      ? `warm bread and a dry seat. the perfect rain-refuge on ${streetLabel}${postcodeArea ? `, ${postcodeArea.toLowerCase()}` : ""}.`
      : null

  return (
    <motion.button
      type="button"
      onClick={onCycle}
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className={`w-full rounded-full ${s.bg} ${s.text} px-6 md:px-8 py-3.5 mb-6 flex items-center gap-4 md:gap-6 transition-colors duration-500 cursor-pointer hover:brightness-[0.98] btn-squish text-left`}
      aria-label="Cycle environment scenario"
    >
      {/* Left: Env status + icon */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`w-9 h-9 rounded-full ${s.iconBg} flex items-center justify-center`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {s.icon}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="hidden md:flex flex-col leading-tight">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-60">
            environment pilot · active
          </span>
          <span className="text-xs font-semibold">
            {weatherLabel} · {weatherTemp}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block h-8 w-px bg-black/10 dark:bg-white/15 shrink-0" />

      {/* Centre: surgical adjustment message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`${mode}-${ovenStatus ?? "none"}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="flex-1 text-sm md:text-base font-medium truncate"
        >
          {compound ? (
            <>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70 mr-2">
                oven hot + rain →
              </span>
              {compound}
            </>
          ) : (
            weather ? liveMessage : s.message
          )}
        </motion.p>
      </AnimatePresence>

      {/* Right: intent delta + cycle hint */}
      <div className="hidden lg:flex items-center gap-3 shrink-0">
        <div className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-70">
          {s.intentMetric}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-40">
          · tap to cycle
        </span>
      </div>
    </motion.button>
  )
}

/** Helper to fetch the current Pulse draft + combined-move suggestion based on env + oven. */
export function environmentPulseOverride(
  mode: EnvironmentMode,
  ovenStatus: OvenStatus,
  postcodeArea: string,
  street = "Sydney Street",
): string | null {
  if (ovenStatus === "HOT" && mode === "rain") {
    return `Warm bread and a dry seat. The perfect rain-refuge on ${street}, ${postcodeArea}.`
  }
  if (mode === "rain") {
    return `Cosy indoor seating, hot soup, and fresh bread. Duck out of the rain on ${street}, ${postcodeArea}.`
  }
  if (mode === "sun") {
    return `Iced coffee, pastries, and a sun-drenched terrace. Today's specials on ${street}, ${postcodeArea}.`
  }
  if (mode === "commuter") {
    return `Hot coffee and fresh pastries, boxed and ready. Grab & go on ${street}, ${postcodeArea}.`
  }
  return null
}

export const ENVIRONMENT_MODES: EnvironmentMode[] = ["rain", "sun", "commuter"]
