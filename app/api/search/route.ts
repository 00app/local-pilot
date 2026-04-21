import { NextRequest, NextResponse } from "next/server"

/**
 * General Google search via SearchAPI.io.
 *
 * Mirror of:
 *   curl --get https://www.searchapi.io/api/v1/search \
 *     -d engine="google" \
 *     -d q="chatgpt"
 *
 * Returns normalised SEO-intent signals: related searches, People Also Ask,
 * answer box / knowledge graph snippet. Falls back to curated mock data
 * when SEARCHAPI_API_KEY is not set.
 */

interface RelatedSearch { query: string }
interface PeopleAlsoAsk { question: string; answer?: string; source?: { title?: string } }
interface AnswerBox { answer?: string; snippet?: string; title?: string }
interface OrganicResult { title: string; link: string; snippet?: string }

interface NormalisedIntent {
  query: string
  location?: string
  related_searches: string[]
  people_also_ask: { question: string; answer: string }[]
  answer_snippet: string | null
  top_results: { title: string; link: string; snippet: string }[]
  isLive: boolean
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || "best artisan sourdough process"
  const location = searchParams.get("location") || undefined
  return respond(q, location)
}

export async function POST(req: NextRequest) {
  try {
    const { q, location } = await req.json()
    return respond(q ?? "best artisan sourdough process", location)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

async function respond(q: string, location?: string) {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) return NextResponse.json(mockIntent(q, location))

  const params = new URLSearchParams({
    engine: "google",
    q,
    api_key: apiKey,
  })
  if (location) params.set("location", location)

  try {
    const res = await fetch(`https://www.searchapi.io/api/v1/search?${params}`)
    if (!res.ok) {
      console.error("[search] SearchAPI error:", res.status)
      return NextResponse.json(mockIntent(q, location))
    }
    const data = await res.json()

    const related: string[] = (data.related_searches || [])
      .slice(0, 8)
      .map((r: RelatedSearch) => r.query)

    // SearchAPI.io returns this array as `related_questions` (their canonical
    // name), not `people_also_ask` (SerpApi's name). Fall back to the
    // latter if SearchAPI ever aliases it, but in practice only the first
    // branch fires. We keep the outward-facing `people_also_ask` field name
    // on our own response so the Authority Lab card's markup stays stable.
    const rawQuestions = data.related_questions || data.people_also_ask || []
    const paa: { question: string; answer: string }[] = rawQuestions
      .slice(0, 4)
      .map((p: PeopleAlsoAsk) => ({
        question: p.question,
        answer: (p.answer || p.source?.title || "").toString(),
      }))

    const answer_snippet =
      (data.answer_box as AnswerBox | undefined)?.answer ||
      (data.answer_box as AnswerBox | undefined)?.snippet ||
      null

    const top_results: { title: string; link: string; snippet: string }[] = (data.organic_results || [])
      .slice(0, 3)
      .map((o: OrganicResult) => ({
        title: o.title,
        link: o.link,
        snippet: o.snippet || "",
      }))

    const payload: NormalisedIntent = {
      query: q,
      location,
      related_searches: related,
      people_also_ask: paa,
      answer_snippet,
      top_results,
      isLive: true,
    }
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[search] fetch failed:", err)
    return NextResponse.json(mockIntent(q, location))
  }
}

function mockIntent(q: string, location?: string): NormalisedIntent {
  const isBread = /sourdough|bread|bake/i.test(q)
  return {
    query: q,
    location,
    related_searches: isBread
      ? [
          "best artisan sourdough process",
          "how long to ferment sourdough",
          "sourdough starter recipe",
          "brighton bakery near me",
          "artisan bread brighton",
          "sourdough open crumb technique",
        ]
      : [
          `${q} near me`,
          `${q} reviews`,
          `best ${q}`,
          `${q} recipe`,
        ],
    people_also_ask: isBread
      ? [
          { question: "What makes a sourdough truly artisan?", answer: "Long fermentation, hand-shaping and a wild starter." },
          { question: "How long should sourdough ferment?", answer: "24–36 hours including cold retard." },
          { question: "Which flour is best for artisan sourdough?", answer: "Stoneground bread flour or a high-extraction white." },
          { question: "Why is Brighton sourdough different?", answer: "Soft water and locally-milled Sussex flour." },
        ]
      : [
          { question: `What is ${q}?`, answer: "A short definition snippet from Google." },
          { question: `How does ${q} work?`, answer: "A mechanism answer." },
        ],
    answer_snippet: null,
    top_results: [
      { title: "Demo result — add SEARCHAPI_API_KEY to go live", link: "#", snippet: "Showing fallback intent data." },
    ],
    isLive: false,
  }
}
