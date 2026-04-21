import { NextRequest, NextResponse } from "next/server"

/**
 * Facebook business-page scrape via SearchAPI.io's
 * `facebook_business_page` engine.
 *
 * Mirror of:
 *   curl --get https://www.searchapi.io/api/v1/search \
 *     -d engine="facebook_business_page" \
 *     -d page_id="100089525329756"
 *
 * Accepts either a raw `page_id`, a page URL, or a page handle. When given
 * a URL/handle we try to extract an id-like token — the engine itself
 * tolerates both numeric ids and vanity handles. Falls back to curated
 * mock data when no API key is present or the engine fails.
 */

interface FacebookPostNode {
  message?: string
  text?: string
  story?: string
  image?: string
  image_url?: string
  picture?: string
  likes?: number
  reactions?: number
  comments?: number
  shares?: number
  timestamp?: string
  created_time?: string
  permalink_url?: string
  url?: string
}

export interface FacebookLatest {
  page_id: string
  page_name?: string
  likes?: number
  followers?: number
  post: {
    image_url: string
    caption: string
    likes: number
    comments: number
    shares?: number
    posted_at: string
    permalink?: string
  } | null
  isLive: boolean
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page =
    searchParams.get("page_id") ||
    searchParams.get("page") ||
    searchParams.get("url") ||
    ""
  const pageId = extractPageId(page)
  if (!pageId) return NextResponse.json({ error: "page required" }, { status: 400 })
  return respond(pageId)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const raw =
      body.page_id || body.page || body.url || body.handle || body.username || ""
    const pageId = extractPageId(String(raw))
    if (!pageId) return NextResponse.json({ error: "page required" }, { status: 400 })
    return respond(pageId)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

/**
 * Accepts `facebook.com/yourpage`, `https://www.facebook.com/pages/X/12345`,
 * `@yourpage`, or a bare id and returns the best token we can hand to the
 * `facebook_business_page` engine.
 */
function extractPageId(raw: string): string {
  const trimmed = raw.trim().replace(/^@/, "")
  if (!trimmed) return ""
  // Already a numeric id
  if (/^\d{6,}$/.test(trimmed)) return trimmed
  // Full URL — pull the last non-empty path segment
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
    const last = u.pathname.split("/").filter(Boolean).pop()
    if (last) return last
  } catch {
    /* fallthrough */
  }
  // Bare handle
  return trimmed.split("/").filter(Boolean).pop() || ""
}

async function respond(pageId: string) {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) return NextResponse.json(mockLatest(pageId))

  const params = new URLSearchParams({
    engine: "facebook_business_page",
    page_id: pageId,
    api_key: apiKey,
  })

  try {
    const res = await fetch(`https://www.searchapi.io/api/v1/search?${params}`)
    if (!res.ok) {
      console.error("[facebook] SearchAPI error:", res.status)
      return NextResponse.json(mockLatest(pageId))
    }
    const data = await res.json()

    const page = data.page || data.business || {}
    const posts: FacebookPostNode[] =
      data.posts || data.feed || data.items || page.posts || []
    const latest = posts[0]

    const payload: FacebookLatest = {
      page_id: pageId,
      page_name: page.name || page.page_name || page.title,
      likes: page.likes || page.like_count,
      followers: page.followers || page.follower_count,
      post: latest
        ? {
            image_url:
              latest.image_url ||
              latest.image ||
              latest.picture ||
              page.cover_photo ||
              "",
            caption:
              (latest.message || latest.text || latest.story || "")
                .toString()
                .slice(0, 600),
            likes: latest.likes || latest.reactions || 0,
            comments: latest.comments || 0,
            shares: latest.shares,
            posted_at:
              latest.created_time ||
              latest.timestamp ||
              new Date().toISOString(),
            permalink: latest.permalink_url || latest.url,
          }
        : null,
      isLive: true,
    }
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[facebook] fetch failed:", err)
    return NextResponse.json(mockLatest(pageId))
  }
}

function mockLatest(pageId: string): FacebookLatest {
  const now = Date.now()
  const isFlourPot = /flour|pot|bak/i.test(pageId)
  return {
    page_id: pageId,
    page_name: isFlourPot ? "The Flour Pot Bakery" : pageId,
    likes: isFlourPot ? 6800 : 1400,
    followers: isFlourPot ? 7200 : 1600,
    post: {
      image_url:
        "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800&h=800&fit=crop",
      caption: isFlourPot
        ? "We're open until 5pm today on Sydney Street. Rainy-day tip: our cinnamon swirls pair beautifully with an americano."
        : "We're open today — come say hi!",
      likes: isFlourPot ? 186 : 42,
      comments: isFlourPot ? 23 : 4,
      shares: isFlourPot ? 11 : 2,
      posted_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
      permalink: `https://facebook.com/${pageId}`,
    },
    isLive: false,
  }
}
