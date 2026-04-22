/** Shared types for `/api/events` (google_events) and Community Hijack. */

export interface HijackEvent {
  title: string
  daysAway: number
  venue?: string
  address?: string
  link?: string
  thumbnail?: string
  description?: string
  scope: "local" | "big"
}

export interface EventsPayload {
  local: HijackEvent[]
  big: HijackEvent[]
  featured: HijackEvent | null
  totalCount: number
  isLive: boolean
}
