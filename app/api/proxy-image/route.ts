import { NextRequest, NextResponse } from "next/server"

/**
 * Server-side fetch for Instagram / Meta CDN images so `<img>` isn't blocked
 * by referrer / hotlink rules in the browser.
 */

const MAX_URL_LEN = 4096

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return (
    h.endsWith(".cdninstagram.com") ||
    h === "instagram.com" ||
    h.endsWith(".instagram.com") ||
    h.includes("fbcdn.net") ||
    h.includes("fbsbx.com") ||
    h.includes("tiktokcdn.com") ||
    h.endsWith(".tiktok.com")
  )
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url")
  if (!raw || raw.length > MAX_URL_LEN) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: "malformed url" }, { status: 400 })
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ error: "unsupported scheme" }, { status: 400 })
  }

  if (!isAllowedHost(target.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 })
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; LocalPilot/1.0; +https://brightlocal.com)",
      },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream failed", status: upstream.status },
        { status: 502 },
      )
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream"
    const ctBase = contentType.split(";")[0].trim().toLowerCase()
    if (
      !ctBase.startsWith("image/") &&
      ctBase !== "application/octet-stream" &&
      ctBase !== "binary/octet-stream"
    ) {
      return NextResponse.json({ error: "not an image" }, { status: 502 })
    }

    const buf = await upstream.arrayBuffer()
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType.split(";")[0].trim(),
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (e) {
    console.error("[proxy-image]", e)
    return NextResponse.json({ error: "fetch failed" }, { status: 502 })
  }
}
