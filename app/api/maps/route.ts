import { NextRequest, NextResponse } from "next/server"

/**
 * Google Maps profile lookup via SearchAPI.io's `google_maps` engine.
 *
 * Mirror of:
 *   curl --get https://www.searchapi.io/api/v1/search \
 *     -d engine="google_maps" \
 *     -d ll="@40.7409208,-73.984625,13.87z" \
 *     -d q="Hotels"
 *
 * Unlike `google_local` (which only returns the compact local-pack), this
 * engine returns full Maps results including the target business's own pin.
 * Used by the onboarding Discovery Scraper (step 1) and The Triangle's
 * location tile to plant the Pilot on a real lat/lng.
 *
 * POST body:  { q, postcode?, ll?, location? }
 * GET query:  ?q=...&postcode=...&ll=...&location=...
 *
 * If `ll` isn't supplied, we pass `location` (or `postcode`) straight
 * through so Google infers the centroid from the text.
 */

interface MapsLocalResult {
  position?: number
  title?: string
  name?: string
  place_id?: string
  data_id?: string
  rating?: number
  reviews?: number
  type?: string
  address?: string
  gps_coordinates?: { latitude?: number; longitude?: number }
  latitude?: number
  longitude?: number
}

export interface MapsPinPayload {
  query: string
  lat?: number
  lng?: number
  topResultName?: string
  topResultAddress?: string
  nearbyCount: number
  isLive: boolean
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  return respond({
    q: searchParams.get("q") || "bakery",
    postcode: searchParams.get("postcode") || undefined,
    ll: searchParams.get("ll") || undefined,
    location: searchParams.get("location") || undefined,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return respond({
      q: String(body.q || "bakery"),
      postcode: body.postcode ? String(body.postcode) : undefined,
      ll: body.ll ? String(body.ll) : undefined,
      location: body.location ? String(body.location) : undefined,
    })
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

interface RespondArgs {
  q: string
  postcode?: string
  ll?: string
  location?: string
}

async function respond({ q, postcode, ll, location }: RespondArgs) {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) return NextResponse.json(mockPin(q, postcode))

  const params = new URLSearchParams({
    engine: "google_maps",
    q,
    api_key: apiKey,
  })
  if (ll) params.set("ll", ll)
  else if (location) params.set("location", location)
  else if (postcode)
    params.set("location", postcode.toUpperCase().startsWith("BN") ? "Brighton, UK" : postcode)

  try {
    const res = await fetch(`https://www.searchapi.io/api/v1/search?${params}`)
    if (!res.ok) {
      console.error("[maps] SearchAPI error:", res.status)
      return NextResponse.json(mockPin(q, postcode))
    }
    const data = await res.json()
    const local: MapsLocalResult[] =
      data.local_results || data.places || data.results || []
    const top = local[0]

    const payload: MapsPinPayload = {
      query: q,
      lat: top?.gps_coordinates?.latitude ?? top?.latitude,
      lng: top?.gps_coordinates?.longitude ?? top?.longitude,
      topResultName: top?.title || top?.name,
      topResultAddress: top?.address,
      nearbyCount: local.length,
      isLive: true,
    }
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[maps] fetch failed:", err)
    return NextResponse.json(mockPin(q, postcode))
  }
}

function mockPin(q: string, postcode?: string): MapsPinPayload {
  const isBrighton = !postcode || postcode.toUpperCase().startsWith("BN")
  return {
    query: q,
    lat: isBrighton ? 50.8286 : 51.5074,
    lng: isBrighton ? -0.139 : -0.1278,
    topResultName: isBrighton ? "The Flour Pot Bakery" : "Demo Business",
    topResultAddress: isBrighton
      ? "Sydney Street, Brighton BN1 4EN"
      : `${postcode || "London"}`,
    nearbyCount: 7,
    isLive: false,
  }
}
