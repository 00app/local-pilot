/**
 * Instagram / Meta CDNs often block hotlinked `<img>` requests from our origin.
 * Route eligible URLs through `/api/proxy-image` so the server fetches bytes.
 */

function isMetaCdnHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return (
    h.endsWith(".cdninstagram.com") ||
    h === "instagram.com" ||
    h.endsWith(".instagram.com") ||
    h.includes("fbcdn.net") ||
    h.includes("fbsbx.com") ||
    h.includes("tiktokcdn.com") ||
    h.includes("tiktok.com")
  )
}

/** Returns a same-origin URL for proxied social images, or the original URL. */
export function proxiedSocialImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return url || ""
  try {
    const u = new URL(url)
    if (isMetaCdnHost(u.hostname)) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`
    }
  } catch {
    /* invalid URL */
  }
  return url
}
