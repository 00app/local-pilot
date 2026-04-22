import { NextRequest, NextResponse } from "next/server"
import type { EventsPayload, HijackEvent } from "@/lib/events-payload"

/**
 * Google Events via SearchAPI.io — local neighbourhood signal + broader
 * regional/national events in one payload for Community Hijack.
 *
 * Mirrors:
 *   curl --get https://www.searchapi.io/api/v1/search \
 *     -d engine="google_events" \
 *     -d q="Tech Meetups" \
 *     -d location="London"
 */

const postcodeToLocation: Record<string, string> = {
  BN1: "Brighton, England, United Kingdom",
  BN2: "Brighton, England, United Kingdom",
  BN3: "Hove, England, United Kingdom",
  E1: "London, England, United Kingdom",
  SW1: "London, England, United Kingdom",
  M1: "Manchester, England, United Kingdom",
  B1: "Birmingham, England, United Kingdom",
  BS1: "Bristol, England, United Kingdom",
  EH1: "Edinburgh, Scotland, United Kingdom",
  G1: "Glasgow, Scotland, United Kingdom",
}

interface RawEvent {
  title?: string
  link?: string
  date?: { day?: string; month?: string }
  duration?: string
  address?: string
  location?: string
  thumbnail?: string
  description?: string
  venue?: { name?: string }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postcode = searchParams.get("postcode") || "BN1 4EN"
  const businessType = searchParams.get("businessType") || "local business"
  return respond(postcode, businessType)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const postcode = String(body.postcode || "").trim() || "BN1 4EN"
    const businessType = String(body.businessType || "local business").trim()
    return respond(postcode, businessType)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

function locationFromPostcode(postcode: string): string {
  const cleaned = postcode.replace(/\s+/g, "").toUpperCase()
  const p3 = cleaned.slice(0, 3)
  const p2 = cleaned.slice(0, 2)
  return postcodeToLocation[p3] || postcodeToLocation[p2] || "England, United Kingdom"
}

function daysAwayFromRaw(ev: RawEvent): number {
  const monthStr = ev.date?.month
  const dayStr = ev.date?.day
  if (!monthStr || !dayStr) return 14
  const day = Number.parseInt(dayStr, 10)
  if (!Number.isFinite(day) || day < 1 || day > 31) return 14
  const now = new Date()
  const year = now.getFullYear()
  const t = Date.parse(`${monthStr} ${day}, ${year}`)
  if (Number.isNaN(t)) return 14
  let target = new Date(t)
  if (target < now) {
    const t2 = Date.parse(`${monthStr} ${day}, ${year + 1}`)
    if (!Number.isNaN(t2)) target = new Date(t2)
  }
  return Math.max(
    0,
    Math.min(365, Math.ceil((target.getTime() - now.getTime()) / 86_400_000)),
  )
}

function mapRaw(
  raw: RawEvent,
  scope: "local" | "big",
): HijackEvent | null {
  const title = (raw.title || "").trim()
  if (!title) return null
  return {
    title,
    daysAway: daysAwayFromRaw(raw),
    venue: raw.venue?.name || raw.location,
    address: raw.address,
    link: raw.link,
    thumbnail: raw.thumbnail,
    description: raw.description?.slice(0, 280),
    scope,
  }
}

function dedupeByTitle(events: HijackEvent[]): HijackEvent[] {
  const seen = new Set<string>()
  const out: HijackEvent[] = []
  for (const e of events) {
    const k = e.title.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(e)
  }
  return out
}

async function fetchEvents(
  apiKey: string,
  q: string,
  location: string,
  scope: "local" | "big",
  chips?: string,
): Promise<HijackEvent[]> {
  const params = new URLSearchParams({
    engine: "google_events",
    q,
    location,
    api_key: apiKey,
    hl: "en",
    gl: "gb",
  })
  if (chips) params.set("chips", chips)

  const res = await fetch(`https://www.searchapi.io/api/v1/search?${params}`)
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error("[events] SearchAPI error:", res.status, body.slice(0, 300))
    return []
  }
  const data = await res.json()
  const list: RawEvent[] = data.events || []
  return list
    .map((r) => mapRaw(r, scope))
    .filter((e): e is HijackEvent => e !== null)
}

async function respond(
  postcode: string,
  businessType: string,
): Promise<NextResponse> {
  const location = locationFromPostcode(postcode)
  const apiKey = process.env.SEARCHAPI_API_KEY

  if (!apiKey) {
    return NextResponse.json(mockPayload(postcode, businessType, location))
  }

  try {
    // Local: neighbourhood + vertical-relevant happenings near the business.
    const localQ = `events markets festivals ${businessType}`.slice(0, 120)
    // Big: major draws — hub on London so UK-wide festivals/gigs surface;
    // local query above still captures what's on in the owner's town.
    const bigQ = "concerts festivals major events arena tour this month"
    const bigLocation = "London, England, United Kingdom"

    const [local, big] = await Promise.all([
      fetchEvents(apiKey, localQ, location, "local", "date:month").then((e) =>
        dedupeByTitle(e).slice(0, 8),
      ),
      fetchEvents(apiKey, bigQ, bigLocation, "big").then((e) =>
        dedupeByTitle(e).slice(0, 8),
      ),
    ])

    // Prefer a local headliner for Hijack; else the first “big” draw.
    const featured = local[0] || big[0] || null

    const totalCount = local.length + big.length
    return NextResponse.json({
      local,
      big,
      featured,
      totalCount,
      isLive: true,
    } satisfies EventsPayload)
  } catch (err) {
    console.error("[events] fetch failed:", err)
    return NextResponse.json(
      mockPayload(postcode, businessType, location),
    )
  }
}

function mockPayload(
  postcode: string,
  businessType: string,
  location: string,
): EventsPayload {
  void location
  const area = postcode.split(" ")[0] || postcode
  return {
    local: [
      {
        title: `${area} neighbourhood night market`,
        daysAway: 9,
        venue: "Town centre",
        scope: "local",
      },
      {
        title: `weekend food & makers fair`,
        daysAway: 16,
        venue: "Seafront",
        scope: "local",
      },
    ],
    big: [
      {
        title: "All Points East",
        daysAway: 42,
        venue: "London",
        scope: "big",
      },
      {
        title: "BBC Radio 6 Music Festival",
        daysAway: 55,
        venue: "Greater Manchester",
        scope: "big",
      },
    ],
    featured: {
      title: `${area} neighbourhood night market`,
      daysAway: 9,
      venue: "Town centre",
      scope: "local",
    },
    totalCount: 4,
    isLive: false,
  }
}
