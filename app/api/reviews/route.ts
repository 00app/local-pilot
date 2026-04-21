import { NextRequest, NextResponse } from "next/server"

/**
 * Pull recent Google reviews for a rival business via SearchAPI.io's
 * `google_maps_reviews` engine.
 *
 * Mirror of:
 *   curl --get https://www.searchapi.io/api/v1/search \
 *     -d engine="google_maps_reviews" \
 *     -d place_id="..."
 *
 * We don't usually have a place_id up front, so the client-facing contract is:
 *   POST { name, postcode } → { reviews: Review[], isLive: boolean }
 *
 * Strategy when `SEARCHAPI_API_KEY` is present:
 *   1. Resolve `name + postcode` to a `place_id` via the `google_maps` engine.
 *   2. Fetch reviews for that `place_id` via `google_maps_reviews`.
 *
 * Falls back to deterministic curated mock reviews when no key is set or any
 * step fails, so the cockpit never looks broken in demo mode.
 */

export interface RivalReview {
  author: string
  rating: number
  text: string
  time: string
  isOwner?: boolean
}

interface ReviewsPayload {
  rival: string
  reviews: RivalReview[]
  isLive: boolean
}

interface MapsPlaceResult {
  place_id?: string
  data_id?: string
  title?: string
  name?: string
}

interface MapsReviewsResult {
  user?: { name?: string }
  author?: string
  rating?: number
  snippet?: string
  text?: string
  review?: string
  date?: string
  iso_date?: string
  time_description?: string
}

export async function POST(req: NextRequest) {
  try {
    const { name, postcode } = await req.json()
    if (!name) {
      return NextResponse.json({ error: "Missing rival name" }, { status: 400 })
    }
    return respond(String(name), postcode ? String(postcode) : undefined)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

async function respond(name: string, postcode?: string) {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) return NextResponse.json(mockPayload(name))

  try {
    // Step 1 — resolve the rival to a Google Maps place_id.
    const mapsParams = new URLSearchParams({
      engine: "google_maps",
      q: postcode ? `${name} ${postcode}` : name,
      api_key: apiKey,
    })
    const mapsRes = await fetch(
      `https://www.searchapi.io/api/v1/search?${mapsParams}`,
    )
    if (!mapsRes.ok) throw new Error(`google_maps ${mapsRes.status}`)
    const mapsData = await mapsRes.json()
    const top: MapsPlaceResult | undefined =
      mapsData.local_results?.[0] || mapsData.place_results

    const placeId = top?.place_id || top?.data_id
    if (!placeId) return NextResponse.json(mockPayload(name))

    // Step 2 — fetch reviews for that place_id.
    const reviewsParams = new URLSearchParams({
      engine: "google_maps_reviews",
      place_id: placeId,
      api_key: apiKey,
    })
    const reviewsRes = await fetch(
      `https://www.searchapi.io/api/v1/search?${reviewsParams}`,
    )
    if (!reviewsRes.ok) throw new Error(`reviews ${reviewsRes.status}`)
    const reviewsData = await reviewsRes.json()

    const reviews: RivalReview[] = (reviewsData.reviews || [])
      .slice(0, 4)
      .map((r: MapsReviewsResult) => ({
        author: r.user?.name || r.author || "Anonymous",
        rating: typeof r.rating === "number" ? r.rating : 0,
        text: (r.snippet || r.text || r.review || "").toString().trim(),
        time: r.time_description || r.date || r.iso_date || "",
      }))
      .filter((r: RivalReview) => r.text.length > 0)

    if (reviews.length === 0) return NextResponse.json(mockPayload(name))

    const payload: ReviewsPayload = {
      rival: name,
      reviews,
      isLive: true,
    }
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[reviews] fetch failed:", err)
    return NextResponse.json(mockPayload(name))
  }
}

/**
 * Deterministic mock reviews — seeded off the rival's name so the same rival
 * always gets the same three quotes, but different rivals feel distinct.
 */
function mockPayload(name: string): ReviewsPayload {
  const seed = name
    .toLowerCase()
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const pool: RivalReview[] = [
    {
      author: "James P.",
      rating: 5,
      text: `Genuinely the best sourdough I've had outside London. ${name} never disappoints — the crust is perfect.`,
      time: "2 days ago",
    },
    {
      author: "Priya K.",
      rating: 5,
      text: `Brilliant little bakery. Staff remember your order, croissants are flaky and buttery. A proper neighbourhood spot.`,
      time: "6 days ago",
    },
    {
      author: "Oliver R.",
      rating: 4,
      text: `Solid pastries, great coffee. Queue can get long on weekends but it moves fast.`,
      time: "1 week ago",
    },
    {
      author: "Hana M.",
      rating: 5,
      text: `Their loaves are on another level. Fermentation is spot-on and you can taste the care that goes in.`,
      time: "2 weeks ago",
    },
    {
      author: "Tom C.",
      rating: 4,
      text: `Consistently high quality. The seasonal specials are always worth coming back for.`,
      time: "3 weeks ago",
    },
    {
      author: "Rachel D.",
      rating: 5,
      text: `Hidden gem near the North Laine. Pain au chocolat is outstanding — arrive early before they sell out.`,
      time: "1 month ago",
    },
  ]
  // Rotate the pool so each rival gets a different slice
  const offset = seed % pool.length
  const ordered = [...pool.slice(offset), ...pool.slice(0, offset)]
  return {
    rival: name,
    reviews: ordered.slice(0, 3),
    isLive: false,
  }
}
