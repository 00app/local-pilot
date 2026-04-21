/**
 * Surgical strategy engine.
 *
 * Converts raw social captions into Local-SEO-tuned Google Business Posts
 * anchored to a specific postcode and street.
 *
 * Example:
 *   generateStrategy({ caption: "New sourdough out!", postcode: "BN1 4EN", street: "Sydney Street" })
 *   → "Fresh artisan sourdough available today on Sydney Street, BN1."
 */

export interface StrategyInput {
  caption: string
  postcode: string
  street?: string
  keywords?: string[]
}

export interface SurgicalMove {
  optimized_post: string
  surgical_reason: string
  keywords_hit: string[]
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
  "of", "to", "in", "on", "at", "for", "with", "our", "we", "you",
  "your", "this", "that", "new", "out", "just", "so",
])

const INTENT_HOOKS: Array<[RegExp, string]> = [
  [/sourdough|loaf|loaves/i, "Fresh artisan {keyword} available today"],
  [/croissant|pastry|pastries/i, "Hand-laminated {keyword} just out of the oven"],
  [/coffee|espresso|flat white/i, "Perfectly pulled {keyword} ready to pour"],
  [/cake|brownie|cookie/i, "Small-batch {keyword} fresh on the counter"],
  [/brunch|lunch|breakfast/i, "Locally-sourced {keyword} served all morning"],
]

export function generateStrategy(input: StrategyInput): SurgicalMove {
  const caption = input.caption.trim()
  const postcodeArea = (input.postcode.split(" ")[0] || input.postcode).toUpperCase()
  const street = input.street || "Sydney Street"

  // Pull the most distinctive noun from the caption as the pivot keyword.
  const tokens = caption
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))

  const pivot = tokens[0] || "product"

  // Find an intent hook that matches the caption.
  const hook = INTENT_HOOKS.find(([re]) => re.test(caption))?.[1]

  const lead = hook
    ? hook.replace("{keyword}", pivot)
    : `Fresh ${pivot} ready today`

  const optimized_post = `${lead} on ${street}, ${postcodeArea}.`

  const hits = [pivot, street.toLowerCase(), postcodeArea.toLowerCase()]
  if (input.keywords) hits.push(...input.keywords)

  return {
    optimized_post,
    surgical_reason: `Translated a ${caption.length}-char social caption into a postcode-anchored Google Post with local-intent keywords.`,
    keywords_hit: hits.filter((k, i, arr) => arr.indexOf(k) === i),
  }
}
