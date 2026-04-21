"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, ArrowUpRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { OvenStatus } from "@/lib/types"
import type { EnvironmentMode } from "@/components/environment-wedge"
import type { VitalitySignals } from "@/components/pilot-status-bar"

interface PilotIntercomProps {
  businessName: string
  postcode: string
  ovenStatus: OvenStatus
  envMode: EnvironmentMode
  vitality: VitalitySignals
  onMasterLaunch: () => void | Promise<void>
  onNotify: (title: string, description?: string) => void
}

type ChatRole = "pilot" | "user"

interface ChatLine {
  id: string
  role: ChatRole
  text: string
  meta?: string
}

/**
 * The Navigator's Intercom — a context-aware co-pilot, not a chatbot.
 * Opens with a proactive "flight path" update that it derives from the current
 * grid state (environment, oven, vitality), and accepts surgical slash
 * commands like `/rescan`, `/draft-blog`, `/deploy-all`, `/help`.
 */
export function PilotIntercom({
  businessName,
  postcode,
  ovenStatus,
  envMode,
  vitality,
  onMasterLaunch,
  onNotify,
}: PilotIntercomProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Derive the current flight path from live grid state. This is the sentence
  // the intercom leads with on open — it's never a generic greeting.
  const flightPath = useMemo(() => {
    const postcodeArea = postcode.split(" ")[0] || postcode
    if (ovenStatus === "HOT" && envMode === "rain") {
      return `oven is hot and it's raining in ${postcodeArea}. i'm drafting a 'rain refuge' pulse and holding the blog deep-dive for tomorrow.`
    }
    if (envMode === "commuter") {
      return `commuter peak in ${postcodeArea}. i'm steering pulse toward 'grab & go' and chasing the 'fresh pastries' query.`
    }
    if (vitality.technical_seo === "stale") {
      return `top 3 ${postcodeArea} rivals are shipping menu schema you're missing. i've queued three surgical tweaks on the shaper.`
    }
    return `reclaiming your 'sourdough ${postcodeArea.toLowerCase().startsWith("bn") ? "brighton" : postcodeArea}' rank. pulse is primed, review velocity holding.`
  }, [envMode, ovenStatus, postcode, vitality.technical_seo])

  const [history, setHistory] = useState<ChatLine[]>([])

  // Seed the opener on first open + refresh it whenever the flight path
  // changes while the intercom is closed, so the owner sees a current briefing.
  useEffect(() => {
    setHistory([
      {
        id: "flight-path",
        role: "pilot",
        text: flightPath,
        meta: `${businessName} · ${postcode}`,
      },
    ])
  }, [flightPath, businessName, postcode])

  // Autoscroll to the latest message whenever history grows or intercom opens.
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [history, open])

  const pushPilot = (text: string, meta?: string) => {
    setHistory((h) => [
      ...h,
      { id: `p-${Date.now()}`, role: "pilot", text, meta },
    ])
  }
  const pushUser = (text: string) => {
    setHistory((h) => [
      ...h,
      { id: `u-${Date.now()}`, role: "user", text },
    ])
  }

  const runCommand = async (raw: string) => {
    const cmd = raw.trim().toLowerCase()
    if (!cmd) return

    pushUser(raw.trim())
    setInput("")

    if (cmd === "/help" || cmd === "help") {
      pushPilot(
        "four surgical commands: /rescan · /draft-blog · /deploy-all · /why. type anything else to ask the pilot.",
      )
      return
    }
    if (cmd === "/rescan") {
      pushPilot("re-scanning competitor radar for your postcode...", "command · /rescan")
      onNotify(
        "Competitor radar re-scanning.",
        "Pulling fresh Google Local data for rivals in your postcode.",
      )
      return
    }
    if (cmd === "/draft-blog") {
      pushPilot(
        "drafting a long-form deep-dive from today's 'people also ask' intent cluster.",
        "command · /draft-blog",
      )
      onNotify(
        "Deep-dive draft queued.",
        "Authority Lab is composing from today's PAA data.",
      )
      return
    }
    if (cmd === "/deploy-all") {
      pushPilot(
        "deploying all ready surgical moves to google in one tap.",
        "command · /deploy-all",
      )
      await onMasterLaunch()
      return
    }
    if (cmd === "/why") {
      pushPilot(
        `flight path reasoning: env=${envMode} · oven=${ovenStatus.toLowerCase()} · technical=${vitality.technical_seo}. the pilot prioritises moves where live signals and technical gaps compound.`,
        "command · /why",
      )
      return
    }
    if (cmd.startsWith("/")) {
      pushPilot(`unknown command: ${cmd}. try /help.`)
      return
    }

    // Natural language — mirror intent back with a surgical framing.
    if (cmd.includes("rank") || cmd.includes("seo")) {
      pushPilot(
        "ranking lift is compounding on the shaper card: photo + schema + category. ship all three and the 72-hour forecast is +2 positions on 'sourdough brighton'.",
      )
      return
    }
    if (cmd.includes("review")) {
      pushPilot(
        "latest 5-star review is from sarah m. i've drafted a hyper-local response seeded with 'bn1' and 'sydney street' — publish it from the booster card to convert the sentiment into rank signal.",
      )
      return
    }
    if (cmd.includes("blog") || cmd.includes("content")) {
      pushPilot(
        "try /draft-blog. i'll turn the top 'people also ask' question into a long-form explainer with schema.org/Article markup ready to paste.",
      )
      return
    }
    pushPilot(
      "i'll route that to the relevant module. for a surgical move, try /rescan, /draft-blog, or /deploy-all.",
    )
  }

  const suggestions = [
    { label: "why prioritise this?", cmd: "/why" },
    { label: "re-scan rivals", cmd: "/rescan" },
    { label: "draft a blog", cmd: "/draft-blog" },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-[500]">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <motion.button
            type="button"
            aria-label={open ? "Close pilot intercom" : "Open pilot intercom"}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="group relative h-14 w-14 rounded-full bg-[#1a1a1a] text-white dark:bg-white dark:text-black flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2AE855] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {/* Status ping — green pulse confirming the intercom is online */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2AE855] opacity-70" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2AE855] border-2 border-[#1a1a1a] dark:border-white" />
            </span>
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={22} strokeWidth={2} />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <MessageSquare size={22} strokeWidth={2} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="end"
          sideOffset={16}
          className="w-[22rem] md:w-[24rem] p-0 rounded-[28px] overflow-hidden border border-[var(--hairline)] shadow-none bg-background text-foreground"
        >
          {/* Strip 1 — identity */}
          <div className="px-5 pt-5 pb-3 border-b border-[var(--hairline)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2AE855] opacity-70" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2AE855]" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  pilot intercom · online
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                v1.5
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {businessName} · <span className="text-foreground">{postcode}</span>
            </p>
          </div>

          {/* Strip 2 — chat stream */}
          <div
            ref={scrollRef}
            className="px-5 py-4 max-h-72 overflow-y-auto flex flex-col gap-3"
          >
            {history.map((line) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className={line.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[90%]"}
              >
                {line.meta && (
                  <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1">
                    {line.meta}
                  </p>
                )}
                <div
                  className={
                    line.role === "user"
                      ? "rounded-2xl rounded-br-md px-3.5 py-2 text-sm bg-[#2AE855] text-black"
                      : "rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm bg-[var(--surface-alt)] text-foreground border border-[var(--hairline)]"
                  }
                >
                  {line.text}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Strip 3 — suggestion chips */}
          <div className="px-5 pb-3 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.cmd}
                type="button"
                onClick={() => runCommand(s.cmd)}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--surface-chip)] border border-[var(--surface-chip-border)] text-muted-foreground hover:text-foreground hover:border-[#2AE855] transition-colors"
              >
                {s.label}
                <ArrowUpRight size={11} strokeWidth={2} />
              </button>
            ))}
          </div>

          {/* Strip 4 — surgical command input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              runCommand(input)
            }}
            className="px-3 pb-3"
          >
            <div className="flex items-center gap-2 rounded-full bg-[var(--surface-alt)] border border-[var(--hairline)] pl-4 pr-1.5 py-1.5 focus-within:border-[#2AE855] transition-colors">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="type a command (e.g. /rescan)…"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/70"
                aria-label="Surgical command"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="h-8 w-8 rounded-full bg-[#1a1a1a] text-white dark:bg-white dark:text-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2AE855] hover:text-black dark:hover:bg-[#2AE855] transition-colors"
              >
                <Send size={13} strokeWidth={2.2} />
              </button>
            </div>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/80 text-center">
              /rescan · /draft-blog · /deploy-all · /why · /help
            </p>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  )
}
