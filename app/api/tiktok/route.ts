import { NextRequest, NextResponse } from "next/server"

/**
 * TikTok profile scrape via SearchAPI.io's `tiktok_profile` engine.
 *
 * Mirror of:
 *   curl --get https://www.searchapi.io/api/v1/search \
 *     -d engine="tiktok_profile" \
 *     -d username="therock"
 *
 * Returns the latest video's thumbnail + caption + engagement so The
 * Triangle can cross-platform syndicate. Falls back to curated mock.
 */

interface TikTokVideoNode {
  cover?: string
  cover_url?: string
  thumbnail?: string
  description?: string
  caption?: string
  like_count?: number
  likes?: number
  comment_count?: number
  comments?: number
  play_count?: number
  views?: number
  create_time?: number
  created_at?: string
  share_url?: string
  url?: string
}

export interface TikTokLatest {
  username: string
  display_name?: string
  followers?: number
  likes?: number
  post: {
    image_url: string
    caption: string
    likes: number
    comments: number
    views?: number
    posted_at: string
    permalink?: string
  } | null
  isLive: boolean
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = normaliseHandle(searchParams.get("username") || "")
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })
  return respond(username)
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    const handle = normaliseHandle(username || "")
    if (!handle) return NextResponse.json({ error: "username required" }, { status: 400 })
    return respond(handle)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

function normaliseHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").split("/").filter(Boolean).pop() || ""
}

async function respond(username: string) {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) return NextResponse.json(mockLatest(username))

  const params = new URLSearchParams({
    engine: "tiktok_profile",
    username,
    api_key: apiKey,
  })

  try {
    const res = await fetch(`https://www.searchapi.io/api/v1/search?${params}`)
    if (!res.ok) {
      console.error("[tiktok] SearchAPI error:", res.status)
      return NextResponse.json(mockLatest(username))
    }
    const data = await res.json()

    const profile = data.profile || data.user || {}
    // SearchAPI's `tiktok_profile` engine returns only a `profile` object —
    // no `videos` array. We still check the secondary keys in case the
    // schema grows, but in practice `latest` will be undefined and we
    // surface profile-only metadata (followers, display name, total hearts)
    // so The Triangle's TikTok cell can still render "live" with a handle
    // + follower count, even without a latest-video preview.
    const videos: TikTokVideoNode[] =
      data.videos || data.posts || data.items || profile.videos || []
    const latest = videos[0]

    const payload: TikTokLatest = {
      username,
      display_name: profile.display_name || profile.nickname || profile.name,
      followers: profile.followers || profile.follower_count,
      likes: profile.likes || profile.heart_count || profile.hearts,
      post: latest
        ? {
            image_url:
              latest.cover_url || latest.cover || latest.thumbnail || "",
            caption: (latest.description || latest.caption || "").toString().slice(0, 600),
            likes: latest.like_count || latest.likes || 0,
            comments: latest.comment_count || latest.comments || 0,
            views: latest.play_count || latest.views,
            posted_at:
              typeof latest.create_time === "number"
                ? new Date(latest.create_time * 1000).toISOString()
                : latest.created_at || new Date().toISOString(),
            permalink: latest.share_url || latest.url,
          }
        : null,
      isLive: true,
    }
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[tiktok] fetch failed:", err)
    return NextResponse.json(mockLatest(username))
  }
}

function mockLatest(username: string): TikTokLatest {
  const now = Date.now()
  const isFlourPot = /flour|pot|bak/i.test(username)
  return {
    username,
    display_name: isFlourPot ? "The Flour Pot Bakery" : username,
    followers: isFlourPot ? 8400 : 1200,
    likes: isFlourPot ? 46200 : 3800,
    post: {
      image_url:
        "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=800&fit=crop",
      caption: isFlourPot
        ? "POV: 4am in the Sydney St bakery. Watch a 36-hour sourdough crack open. #brighton #sourdough"
        : "Behind the scenes today 🎬",
      likes: isFlourPot ? 1284 : 96,
      comments: isFlourPot ? 74 : 12,
      views: isFlourPot ? 24100 : 2400,
      posted_at: new Date(now - 45 * 60 * 1000).toISOString(), // 45m ago
      permalink: `https://tiktok.com/@${username}`,
    },
    isLive: false,
  }
}
