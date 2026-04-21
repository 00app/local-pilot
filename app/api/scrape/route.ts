import { NextRequest, NextResponse } from "next/server"

// UK Postcode to location name mapping for better search results.
// SearchAPI requires fully-qualified `City, Region, Country` strings (it
// uses Google's UULE location encoding under the hood) — bare "Brighton, UK"
// returns HTTP 400. Always include the region (England / Scotland / etc.)
// and "United Kingdom" spelled out.
const postcodeToLocation: Record<string, string> = {
  "BN1": "Brighton, England, United Kingdom",
  "BN2": "Brighton, England, United Kingdom",
  "BN3": "Hove, England, United Kingdom",
  "E1": "London, England, United Kingdom",
  "SW1": "London, England, United Kingdom",
  "M1": "Manchester, England, United Kingdom",
  "B1": "Birmingham, England, United Kingdom",
  "BS1": "Bristol, England, United Kingdom",
  "EH1": "Edinburgh, Scotland, United Kingdom",
  "G1": "Glasgow, Scotland, United Kingdom",
}

interface SearchResult {
  title: string
  rating?: number
  reviews?: number
  type?: string
  address?: string
  thumbnail?: string
}

interface ScrapedCompetitor {
  name: string
  rating: number
  reviews: number
  type: string
  address: string
  thumbnail?: string
}

interface ScrapeResponse {
  competitors: ScrapedCompetitor[]
  postcode: string
  businessType: string
  totalFound: number
  isLive: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { postcode, businessType = "bakery" } = await req.json()

    if (!postcode) {
      return NextResponse.json({ error: "Postcode required" }, { status: 400 })
    }

    const apiKey = process.env.SEARCHAPI_API_KEY

    // If no API key, return mock data for demo
    if (!apiKey) {
      return NextResponse.json(getMockData(postcode, businessType))
    }

    // Extract postcode prefix for location lookup
    const postcodePrefix = postcode.replace(/\s+/g, "").slice(0, 3).toUpperCase()
    const shortPrefix = postcode.replace(/\s+/g, "").slice(0, 2).toUpperCase()
    // Fallback is a fully-qualified string so SearchAPI's UULE encoder accepts it.
    const location = postcodeToLocation[postcodePrefix] || postcodeToLocation[shortPrefix] || "England, United Kingdom"

    // Build SearchAPI.io request using google_local engine
    const params = new URLSearchParams({
      engine: "google_local",
      q: businessType,
      location: location,
      api_key: apiKey,
    })

    const response = await fetch(`https://www.searchapi.io/api/v1/search?${params}`)

    if (!response.ok) {
      // Pull the SearchAPI error body so the dev server log tells us *why* —
      // status alone hides the real cause (e.g. bad location, quota exhausted,
      // invalid engine). Falling back to mock keeps the UI functional.
      const body = await response.text().catch(() => "")
      console.error("[scrape] SearchAPI error:", response.status, body.slice(0, 300))
      return NextResponse.json(getMockData(postcode, businessType))
    }

    const data = await response.json()

    // Transform SearchAPI response to our format
    const competitors: ScrapedCompetitor[] = (data.local_results || [])
      .slice(0, 10)
      .map((result: SearchResult) => ({
        name: result.title,
        rating: result.rating || 0,
        reviews: result.reviews || 0,
        type: result.type || businessType,
        address: result.address || "",
        thumbnail: result.thumbnail,
      }))

    return NextResponse.json({
      competitors,
      postcode,
      businessType,
      totalFound: data.local_results?.length || 0,
      isLive: true,
    } as ScrapeResponse)

  } catch (error) {
    console.error("[v0] Scrape error:", error)
    return NextResponse.json(
      { error: "Failed to scrape competitors" },
      { status: 500 }
    )
  }
}

// Mock data for demo without API key
function getMockData(postcode: string, businessType: string): ScrapeResponse {
  const isBrighton = postcode.toUpperCase().startsWith("BN")

  const competitors: ScrapedCompetitor[] = isBrighton
    ? [
        { name: "The Flour Pot Bakery", rating: 4.8, reviews: 412, type: "Artisan Bakery", address: "40 Sydney St, Brighton BN1 4EP" },
        { name: "GAIL's Bakery", rating: 4.5, reviews: 287, type: "Bakery & Cafe", address: "44 The Lanes, Brighton BN1 1HB" },
        { name: "Real Patisserie", rating: 4.7, reviews: 198, type: "French Bakery", address: "48 Trafalgar St, Brighton BN1 4ED" },
        { name: "Sugardough", rating: 4.6, reviews: 156, type: "Bakery", address: "52 Dyke Rd, Brighton BN1 3JD" },
        { name: "Cloud 9 Bakery", rating: 4.4, reviews: 89, type: "Bakery", address: "18 Preston St, Brighton BN1 2HN" },
      ]
    : [
        { name: "Local Bakery Co", rating: 4.5, reviews: 234, type: "Bakery", address: `Near ${postcode}` },
        { name: "Artisan Breads", rating: 4.3, reviews: 156, type: "Artisan Bakery", address: `Near ${postcode}` },
        { name: "The Corner Bakehouse", rating: 4.6, reviews: 198, type: "Bakery & Cafe", address: `Near ${postcode}` },
        { name: "Fresh Bakes Daily", rating: 4.2, reviews: 87, type: "Bakery", address: `Near ${postcode}` },
      ]

  return {
    competitors,
    postcode,
    businessType,
    totalFound: competitors.length,
    isLive: false,
  }
}
