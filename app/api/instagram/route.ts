import { NextRequest, NextResponse } from "next/server"

/**
 * Instagram profile scrape via SearchAPI.io.
 *
 * Mirror of:
 *   curl --get https://www.searchapi.io/api/v1/search \
 *     -d engine="instagram_profile" \
 *     -d username="cristiano"
 *
 * Returns the latest 1:1 post (image, caption, likes, timestamp) for use
 * by The Pulse widget. Falls back to a curated demo post if no API key.
 */

interface InstagramMediaNode {
  image_url?: string
  thumbnail_url?: string
  caption?: string
  likes?: number
  comments?: number
  taken_at?: string | number
  timestamp?: string
  permalink?: string
}

export interface InstagramLatest {
  username: string
  full_name?: string
  profile_pic_url?: string
  followers?: number
  post: {
    image_url: string
    caption: string
    likes: number
    comments: number
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
    engine: "instagram_profile",
    username,
    api_key: apiKey,
  })

  try {
    const res = await fetch(`https://www.searchapi.io/api/v1/search?${params}`)
    if (!res.ok) {
      console.error("[instagram] SearchAPI error:", res.status)
      return NextResponse.json(mockLatest(username))
    }
    const data = await res.json()

    // SearchAPI shape varies slightly; pick the most recent media node defensively.
    const profile = data.profile || data.user || {}
    const mediaList: InstagramMediaNode[] =
      data.media || data.posts || data.items || profile?.media || []

    const latest = mediaList[0]
    const payload: InstagramLatest = {
      username,
      full_name: profile.full_name || profile.name,
      profile_pic_url: profile.profile_pic_url || profile.profile_pic,
      followers: profile.followers || profile.followers_count,
      post: latest
        ? {
            image_url:
              latest.image_url ||
              latest.thumbnail_url ||
              profile.profile_pic_url ||
              "",
            caption: (latest.caption || "").toString().slice(0, 600),
            likes: latest.likes || 0,
            comments: latest.comments || 0,
            posted_at:
              typeof latest.taken_at === "number"
                ? new Date(latest.taken_at * 1000).toISOString()
                : (latest.taken_at as string) || latest.timestamp || new Date().toISOString(),
            permalink: latest.permalink,
          }
        : null,
      isLive: true,
    }
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[instagram] fetch failed:", err)
    return NextResponse.json(mockLatest(username))
  }
}

function mockLatest(username: string): InstagramLatest {
  const now = Date.now()
  // Curated demo for the Flour Pot pitch; generic otherwise.
  const isFlourPot = /flour|pot|bak/i.test(username)
  return {
    username,
    full_name: isFlourPot ? "The Flour Pot Bakery" : username,
    followers: isFlourPot ? 12400 : 2100,
    profile_pic_url:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop",
    post: {
      image_url: isFlourPot
        ? "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=800&fit=crop"
        : "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=800&fit=crop",
      caption: isFlourPot
        ? "New sourdough out of the oven! 36-hour ferment, stone-baked this morning on Sydney St. Come grab a warm loaf 🍞"
        : "Latest post from our shop — come visit us today!",
      likes: isFlourPot ? 284 : 64,
      comments: isFlourPot ? 31 : 7,
      posted_at: new Date(now - 5 * 60 * 1000).toISOString(), // 5m ago
      permalink: `https://instagram.com/${username}`,
    },
    isLive: false,
  }
}
