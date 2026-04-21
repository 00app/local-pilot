/**
 * Surgical strategy engine — The "SEO Shifter."
 *
 * Converts a raw social caption (casual, emoji-heavy, Instagram-first) into a
 * Local-SEO-tuned Google Business Post. The "Signal-to-SEO" translation
 * applies four layers in order:
 *
 *   1. **Fluff strip** — remove social-only tics ("link in bio", "check my
 *      story", trailing hashtags/emoji runs). Google rewards substance.
 *   2. **Intent tilt** — classify the post as a *product*, *event*, or *vibe*
 *      and lead with the matching GBP-category-aligned phrase. This is what
 *      makes a post rank for "best sourdough BN1" instead of just getting
 *      indexed.
 *   3. **Environment injection** — if the EnvironmentWedge is tilted (rain /
 *      sun / commuter) + the oven is HOT, fold that context in. This is how
 *      a generic post becomes "the perfect rain-refuge on Sydney Street."
 *   4. **Proximity CTA** — close with a street-anchored, postcode-stamped
 *      call-to-action. Google's Map algorithm weights proximity heavily and
 *      explicit street mentions amplify that.
 *
 * Callers also pick a tone (direct / story / offer) which shapes the voice
 * without changing the SEO layers — so the owner can match the moment
 * (quiet Tuesday → direct, launch day → story, school-run rush → offer).
 *
 * Backwards-compatible: the original 3-arg signature (`{ caption, postcode,
 * street }`) still works; `envMode`, `ovenStatus`, `tone` are all optional.
 */

export type PostTone = "direct" | "story" | "offer"
export type EnvMode = "rain" | "sun" | "commuter" | "baseline"
export type OvenHeat = "HOT" | "LOW" | "OUT"

export interface StrategyInput {
  caption: string
  postcode: string
  street?: string
  envMode?: EnvMode
  ovenStatus?: OvenHeat
  tone?: PostTone
  keywords?: string[]
}

export type IntentCategory = "product" | "event" | "vibe"

export interface StrategyLayers {
  stripped: string[]          // social fluff we removed
  heroKeyword: string         // pivot noun we anchored around
  intentCategory: IntentCategory
  intentTilt?: string         // phrase we led with
  environmentContext?: string // sentence we injected when relevant
  proximityCTA: string        // closing CTA we appended
  toneApplied: PostTone
}

export interface SurgicalMove {
  optimized_post: string
  surgical_reason: string
  keywords_hit: string[]
  tone: PostTone
  layers: StrategyLayers
}

// ---------- config ----------

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
  "of", "to", "in", "on", "at", "for", "with", "our", "we", "you",
  "your", "this", "that", "new", "out", "just", "so",
])

/** Lines / phrases that help on social but kill SEO clarity. */
const SOCIAL_FLUFF: RegExp[] = [
  /link in bio\.?/gi,
  /check (?:my |our )?stor(?:y|ies)\.?/gi,
  /swipe up\.?/gi,
  /dm (?:us |me )?(?:for )?details?\.?/gi,
  /tag (?:a|your) (?:friend|mate|partner)\.?/gi,
  /follow (?:us|me) (?:for more)?\.?/gi,
  /#\w+/g,                // strip hashtags
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, // strip unicode emoji
  /\s{2,}/g,              // collapse whitespace
]

/**
 * Product hooks — lead phrases tuned to GBP "What's new" best practice
 * (Google's own guidance: start with the product, end with proximity).
 */
const PRODUCT_HOOKS: Array<[RegExp, string, string]> = [
  [/sourdough|loaf|loaves/i, "Fresh artisan {keyword} available today", "sourdough"],
  [/croissant|pastry|pastries/i, "Hand-laminated {keyword} just out of the oven", "pastries"],
  [/coffee|espresso|flat white|latte/i, "Perfectly pulled {keyword} ready to pour", "coffee"],
  [/cake|brownie|cookie/i, "Small-batch {keyword} fresh on the counter", "bakes"],
  [/brunch|lunch|breakfast/i, "Locally-sourced {keyword} served all morning", "brunch"],
  [/cinnamon|bun|danish/i, "Warm {keyword} straight from the oven", "pastries"],
]

const EVENT_HOOKS: Array<[RegExp, string]> = [
  [/pride|festival|carnival|parade/i, "Pre-order your {keyword} now for collection"],
  [/market|fair|pop[- ]?up/i, "Find us at {keyword} this weekend"],
  [/workshop|class|tasting/i, "Book your seat at our next {keyword}"],
]

const VIBE_HOOKS: Array<[RegExp, string]> = [
  [/garden|terrace|outdoor/i, "Enjoy our {keyword} this afternoon"],
  [/cozy|cosy|fireplace|candle/i, "A {keyword} corner is waiting for you"],
]

// ---------- main ----------

export function generateStrategy(input: StrategyInput): SurgicalMove {
  const caption = input.caption.trim()
  const postcodeArea = (input.postcode.split(" ")[0] || input.postcode).toUpperCase()
  const street = input.street || "Sydney Street"
  const tone: PostTone = input.tone || "direct"

  // --- Layer 1: fluff strip ---
  const stripped: string[] = []
  let clean = caption
  for (const re of SOCIAL_FLUFF) {
    const before = clean
    clean = clean.replace(re, " ")
    if (before !== clean) stripped.push(re.source)
  }
  clean = clean.replace(/\s{2,}/g, " ").trim()

  // --- Layer 2: intent tilt ---
  const tokens = clean
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  const fallbackPivot = tokens[0] || "treat"

  const { intentCategory, intentLead, heroKeyword } = classifyIntent(
    clean,
    fallbackPivot,
  )

  // --- Layer 3: environment injection ---
  const environmentContext = buildEnvironmentContext(
    input.envMode,
    input.ovenStatus,
    heroKeyword,
  )

  // --- Layer 4: proximity CTA (tone-aware) ---
  const proximityCTA = buildProximityCTA(tone, heroKeyword, street, postcodeArea)

  // --- Assembly ---
  // Structure: [Intent lead]. [Environment context?]. [Proximity CTA].
  const parts = [
    `${intentLead}.`,
    environmentContext ? `${environmentContext}.` : "",
    proximityCTA,
  ].filter(Boolean)
  const optimized_post = parts.join(" ").replace(/\s+/g, " ").trim()

  // --- Reasoning + keyword ledger ---
  const hits = Array.from(
    new Set([
      heroKeyword.toLowerCase(),
      street.toLowerCase(),
      postcodeArea.toLowerCase(),
      ...(input.keywords || []),
    ]),
  )

  const surgical_reason = buildSurgicalReason({
    strippedCount: stripped.length,
    intentCategory,
    hasEnv: Boolean(environmentContext),
    tone,
    postcodeArea,
    street,
  })

  return {
    optimized_post,
    surgical_reason,
    keywords_hit: hits,
    tone,
    layers: {
      stripped,
      heroKeyword,
      intentCategory,
      intentTilt: intentLead,
      environmentContext,
      proximityCTA,
      toneApplied: tone,
    },
  }
}

// ---------- helpers ----------

function classifyIntent(
  clean: string,
  fallbackPivot: string,
): { intentCategory: IntentCategory; intentLead: string; heroKeyword: string } {
  for (const [re, phrase, canonical] of PRODUCT_HOOKS) {
    if (re.test(clean)) {
      return {
        intentCategory: "product",
        intentLead: phrase.replace("{keyword}", canonical),
        heroKeyword: canonical,
      }
    }
  }
  for (const [re, phrase] of EVENT_HOOKS) {
    const match = clean.match(re)
    if (match) {
      const keyword = match[0].toLowerCase()
      return {
        intentCategory: "event",
        intentLead: phrase.replace("{keyword}", keyword),
        heroKeyword: keyword,
      }
    }
  }
  for (const [re, phrase] of VIBE_HOOKS) {
    const match = clean.match(re)
    if (match) {
      const keyword = match[0].toLowerCase()
      return {
        intentCategory: "vibe",
        intentLead: phrase.replace("{keyword}", keyword),
        heroKeyword: keyword,
      }
    }
  }
  // Fallback — use the pivot noun as a generic "Fresh {X} ready today."
  return {
    intentCategory: "product",
    intentLead: `Fresh ${fallbackPivot} ready today`,
    heroKeyword: fallbackPivot,
  }
}

function buildEnvironmentContext(
  envMode: EnvMode | undefined,
  ovenStatus: OvenHeat | undefined,
  heroKeyword: string,
): string | undefined {
  // Oven + weather compounds land the highest-signal line.
  if (ovenStatus === "HOT" && envMode === "rain")
    return "Perfect for a rainy-day refuge — the oven's still on"
  if (ovenStatus === "HOT" && envMode === "sun")
    return "Grab one warm before the sun pulls the queue out the door"
  if (ovenStatus === "HOT" && envMode === "commuter")
    return "Fresh out of the oven — perfect for your morning dash"

  // Environment alone.
  if (envMode === "rain") return "A proper rain-refuge pairing"
  if (envMode === "sun") return `Cold brew pairs beautifully with ${heroKeyword}`
  if (envMode === "commuter") return "Ready to grab on the way past"
  return undefined
}

function buildProximityCTA(
  tone: PostTone,
  heroKeyword: string,
  street: string,
  postcodeArea: string,
): string {
  switch (tone) {
    case "offer":
      return `Mention this post for 10% off your ${heroKeyword} today at our ${postcodeArea} shop.`
    case "story":
      return `Our bakers started at 4am so you could have this on ${street}, ${postcodeArea}.`
    case "direct":
    default:
      return `Available now on ${street}, ${postcodeArea}.`
  }
}

function buildSurgicalReason(args: {
  strippedCount: number
  intentCategory: IntentCategory
  hasEnv: boolean
  tone: PostTone
  postcodeArea: string
  street: string
}): string {
  const steps: string[] = []
  if (args.strippedCount > 0)
    steps.push(`stripped ${args.strippedCount} social-only token${args.strippedCount > 1 ? "s" : ""}`)
  steps.push(`tilted to ${args.intentCategory}-intent lead`)
  if (args.hasEnv) steps.push("injected environment context")
  steps.push(`anchored to ${args.street}, ${args.postcodeArea}`)
  steps.push(`${args.tone} tone`)
  return `Signal-to-SEO: ${steps.join(" → ")}.`
}
