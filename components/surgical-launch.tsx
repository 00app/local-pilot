"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Spinner } from "@/components/ui/spinner"

interface SurgicalLaunchProps {
  onLaunch: () => void | Promise<void>
  movesReady: number
  /**
   * Optional stack of images pulled from the live social signals (top of the
   * stack = The Pulse, then the Triangle leader). Rendered as a 40px 1:1
   * thumbnail row in the CTA to show exactly what's about to ship — Google
   * Business Posts with images get ~2× the click-rate of text-only.
   */
  stagedImages?: string[]
}

export function SurgicalLaunch({
  onLaunch,
  movesReady,
  stagedImages = [],
}: SurgicalLaunchProps) {
  const [isLaunching, setIsLaunching] = useState(false)
  const [hasLaunched, setHasLaunched] = useState(false)

  const handleClick = async () => {
    setIsLaunching(true)
    await onLaunch()
    await new Promise((r) => setTimeout(r, 600))
    setIsLaunching(false)
    setHasLaunched(true)
    setTimeout(() => setHasLaunched(false), 3000)
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.2 }}
      whileTap={{ scale: 0.985 }}
      onClick={handleClick}
      disabled={isLaunching}
      className="w-full rounded-[30px] bg-[#1a1a1a] text-white dark:bg-white dark:text-black px-10 py-8 flex items-center justify-between gap-6 btn-squish hover:bg-black dark:hover:bg-white/90 transition-colors disabled:opacity-90 disabled:cursor-wait"
    >
      <div className="text-left">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/50 dark:text-black/50 mb-1">
          master launch
        </p>
        <p className="text-3xl md:text-4xl font-bold leading-tight">
          {hasLaunched
            ? "Surgical move deployed."
            : isLaunching
            ? "Launching the Pilot..."
            : "Launch the surgical playbook."}
        </p>
        <p className="text-sm text-white/60 dark:text-black/60 mt-1">
          Deploy all {movesReady} moves to Google in one tap.
        </p>

        {stagedImages.length > 0 && !isLaunching && !hasLaunched && (
          <AnimatePresence>
            <motion.div
              key="staged"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-3 flex items-center gap-2"
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 dark:text-black/50">
                staging
              </span>
              <div className="flex -space-x-1.5">
                {stagedImages.slice(0, 3).map((src, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={`${src}-${i}`}
                    src={src}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover ring-2 ring-[#1a1a1a] dark:ring-white bg-white/10"
                  />
                ))}
              </div>
              <span className="text-[11px] text-white/70 dark:text-black/70">
                {stagedImages.length} image{stagedImages.length > 1 ? "s" : ""} attached
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="shrink-0">
        {isLaunching ? (
          <div className="w-14 h-14 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center">
            <Spinner className="w-6 h-6 text-white dark:text-black" />
          </div>
        ) : hasLaunched ? (
          <div className="w-14 h-14 rounded-full bg-[#2AE855] flex items-center justify-center text-black">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#2AE855] flex items-center justify-center text-black">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}
      </div>
    </motion.button>
  )
}
