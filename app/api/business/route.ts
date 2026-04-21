import { NextRequest, NextResponse } from "next/server"

/**
 * Resolve the owner's own Google Business Profile from `name + postcode`.
 *
 * The cockpit needs one consolidated payload for the business the owner is
 * signed in as — their aggregate rating, latest review (with a suggested
 * response draft), street address, and coordinates — all keyed off
 * `place_id`. This route does the 2-step SearchAPI dance:
 *
 *   1. `google_maps` with `q = "{name} {postcode}"` → top result's `place_id`,
 *      aggregate `rating`, `reviews` count, `address`, `gps_coordinates`.
 *   2. `google_maps_reviews` with that `place_id` → the freshest review row
 *      (author, rating, text, time).
 *
 * The review-response draft is generated server-side from the review text so
 * the Review Booster card lands populated without a second round-trip.
 *
 * Falls back to a deterministic mock payload when no key is set or any step
 * fails — same contract in both modes, so the cockpit always renders.
 */

interface MapsLocalResult {
  position?: number
  title?: string
  name?: string
  place_id?: string
  data_id?: string
  rating?: number
  reviews?: number
  address?: string
  type?: string
  gps_coordinates?: { latitude?: number; longitude?: number }
  latitude?: number
  longitude?: number
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

export interface BusinessReview {
  author: string
  rating: number
  text: string
  time: string
}

export interface BusinessPayload {
  name: string
  address?: string
  street?: string
  postcode: string
  lat?: number
  lng?: number
  rating?: number
  totalReviews?: number
  placeId?: string
  latestReview?: BusinessReview
  suggestedResponse?: string
  isLive: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { name, postcode } = await req.json()
    if (!name || !postcode) {
      return NextResponse.json(
        { error: "Missing name or postcode" },
        { status: 400 },
      )
    }
    return respond(String(name), String(postcode))
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get("name")
  const postcode = searchParams.get("postcode")
  if (!name || !postcode) {
    return NextResponse.json(
      { error: "Missing name or postcode" },
      { status: 400 },
    )
  }
  return respond(name, postcode)
}

async function respond(name: string, postcode: string): Promise<NextResponse> {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) return NextResponse.json(mockBusiness(name, postcode))

  try {
    // Step 1: resolve business → place_id + aggregate rating + address.
    const mapsParams = new URLSearchParams({
      engine: "google_maps",
      q: `${name} ${postcode}`,
      api_key: apiKey,
    })
    const mapsRes = await fetch(
      `https://www.searchapi.io/api/v1/search?${mapsParams}`,
    )
    if (!mapsRes.ok) {
      const body = await mapsRes.text().catch(() => "")
      console.error(
        "[business] google_maps error:",
        mapsRes.status,
        body.slice(0, 200),
      )
      return NextResponse.json(mockBusiness(name, postcode))
    }
    const mapsData = await mapsRes.json()
    const top: MapsLocalResult | undefined =
      mapsData.local_results?.[0] || mapsData.place_results
    if (!top) return NextResponse.json(mockBusiness(name, postcode))

    const placeId = top.place_id || top.data_id
    const address = top.address
    const street = extractStreet(address)
    const base: BusinessPayload = {
      name: top.title || top.name || name,
      address,
      street,
      postcode,
      lat: top.gps_coordinates?.latitude ?? top.latitude,
      lng: top.gps_coordinates?.longitude ?? top.longitude,
      rating: top.rating,
      totalReviews: top.reviews,
      placeId,
      isLive: true,
    }

    // Step 2: latest review (best-effort — missing is fine, card still shows
    // the aggregate rating).
    if (placeId) {
      try {
        const reviewsParams = new URLSearchParams({
          engine: "google_maps_reviews",
          place_id: placeId,
          api_key: apiKey,
        })
        const reviewsRes = await fetch(
          `https://www.searchapi.io/api/v1/search?${reviewsParams}`,
        )
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json()
          const raw: MapsReviewsResult | undefined = (reviewsData.reviews ||
            [])[0]
          if (raw) {
            const text = (raw.snippet || raw.text || raw.review || "")
              .toString()
              .trim()
            if (text) {
              const latestReview: BusinessReview = {
                author: raw.user?.name || raw.author || "Anonymous",
                rating: typeof raw.rating === "number" ? raw.rating : 5,
                text,
                time: raw.time_description || raw.date || raw.iso_date || "",
              }
              base.latestReview = latestReview
              base.suggestedResponse = draftResponse(latestReview, base.name)
            }
          }
        } else {
          console.error("[business] reviews error:", reviewsRes.status)
        }
      } catch (err) {
        console.error("[business] reviews fetch failed:", err)
      }
    }

    return NextResponse.json(base)
  } catch (err) {
    console.error("[business] fetch failed:", err)
    return NextResponse.json(mockBusiness(name, postcode))
  }
}

/**
 * Pull the street segment out of a Google-format address like:
 *   "40 Sydney Street, Brighton and Hove, Brighton BN1 4EN, United Kingdom"
 * We want just "Sydney Street" — used as a proximity anchor in the strategy
 * pipeline ("Available now on Sydney Street, BN1.").
 */
function extractStreet(address?: string): string | undefined {
  if (!address) return undefined
  const firstSegment = address.split(",")[0].trim()
  if (!firstSegment) return undefined
  // Strip leading house number ("40 Sydney Street" → "Sydney Street").
  return firstSegment.replace(/^\d+\s*[A-Za-z]?\s+/, "").trim()
}

/**
 * Author a Sentence Case reply that thanks the reviewer by first name,
 * echoes the strongest token from their review (e.g. "sourdough", "service"),
 * and signs off with the business name. The Review Booster card displays
 * this as the editable draft — the owner can still edit/regenerate.
 */
function draftResponse(review: BusinessReview, businessName: string): string {
  const firstName = review.author.split(/[\s.]/)[0] || "there"
  // Try to echo a salient keyword from the review — nouns like "sourdough",
  // "pastry", "coffee", "service" read well in a reply.
  const keyword = pickKeyword(review.text)
  const opener = review.rating >= 4 ? "Thank you" : "Really appreciate this"
  const keywordBeat = keyword
    ? ` — hearing the ${keyword} landed is exactly what we aim for.`
    : "."
  return `${opener}, ${firstName}${keywordBeat} The team at ${businessName} will be buzzing. Hope to see you again soon.`
}

const KEYWORDS = [
  "sourdough",
  "bread",
  "croissant",
  "pastry",
  "pastries",
  "coffee",
  "cake",
  "brunch",
  "service",
  "staff",
  "atmosphere",
  "vibe",
  "quality",
  "fresh",
  "friendly",
]

function pickKeyword(text: string): string | undefined {
  const lower = text.toLowerCase()
  return KEYWORDS.find((k) => lower.includes(k))
}

function mockBusiness(name: string, postcode: string): BusinessPayload {
  const isBrighton = postcode.toUpperCase().startsWith("BN")
  return {
    name,
    address: isBrighton
      ? `Sydney Street, Brighton ${postcode}, United Kingdom`
      : `${postcode}, United Kingdom`,
    street: isBrighton ? "Sydney Street" : undefined,
    postcode,
    lat: isBrighton ? 50.8286 : 51.5074,
    lng: isBrighton ? -0.139 : -0.1278,
    rating: 4.7,
    totalReviews: 312,
    latestReview: {
      author: "Priya K.",
      rating: 5,
      text: "Honestly the best sourdough I've had in Brighton — the crust is perfect and the staff are lovely.",
      time: "2 days ago",
    },
    suggestedResponse: `Thank you, Priya — hearing the sourdough landed is exactly what we aim for. The team at ${name} will be buzzing. Hope to see you again soon.`,
    isLive: false,
  }
}
