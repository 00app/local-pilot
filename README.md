# Local Pilot

Interview PoC for BrightLocal. A clinical 12-column command centre that turns a URL + postcode into an autonomous local-SEO co-pilot for a local hero business.

Reference persona: The Flour Pot Bakery, Sydney Street, Brighton (BN1).

## What it is

Not a dashboard — an **Autonomous Execution Grid**. Reads a business's real-world pulse (weather, oven state, social signals, SERP rivals), translates it into Google-ready moves through a 4-layer Signal-to-SEO pipeline, and ships them with one tap.

## Stack

- **Next.js 16.2** (App Router, Turbopack) · **React 19**
- **TypeScript 5.7** · **Tailwind CSS 4**
- **Framer Motion 12** · **Sonner** · **canvas-confetti**
- **Radix UI** primitives · **lucide-react**
- **SearchAPI.io** for the six live engines (`google_local`, `google`, `google_maps`, `google_maps_reviews`, `instagram_profile`, `tiktok_profile`, `facebook_business_page`)
- Package manager: **pnpm**

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Live data (optional)

Create `.env.local`:

```bash
SEARCHAPI_API_KEY=your_key_here
```

Without a key, every route falls back to curated demo data so the offline story still runs end-to-end. With a key, every `live/demo` chip across the cockpit flips green.

## Full spec

See [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) — the single source of truth for design tokens, grid structure, widget catalogue, API routes, onboarding flow, and the v0.1 → v1.5 changelog.

## Grid at a glance

| # | Widget | Col | Tint | Engine |
| :--- | :--- | :--- | :--- | :--- |
| 01 | Pilot status bar | 12 | — | derived |
| — | Environment wedge | 12 | weather-tinted | manual/mock |
| 02 | The Pulse · Social sync | 4 | mint | `instagram_profile` |
| 03 | The Booster · Review booster | 4 | lemon | mock |
| 04 | The Hijack · Community hijack | 4 | sky | mock |
| 05 | The Lab · Authority lab | 6 | lavender | `google` |
| 06 | The Battle · Competitor radar | 6 | coral | `google_local` + `google_maps_reviews` |
| 08 | The Triangle · Social triangle | 12 | mint | IG + TikTok + FB + `google_maps` |
| 07 | The Shaper · SEO shaper | 12 | coral | derived |
| — | Surgical launch | 12 | ink | master CTA |

## Signal-to-SEO engine

Every optimised post runs through four explicit layers (see `lib/strategy.ts`):

1. **Fluff strip** — remove hashtags, emoji, "link in bio", "check stories".
2. **Intent tilt** — classify as `product | event | vibe` and lead with the matching GBP-category phrase.
3. **Environment injection** — fold in `weather + oven` (rain + HOT → "Perfect for a rainy-day refuge — the oven's still on").
4. **Proximity CTA** — tone-aware street + postcode close (`direct` / `story` / `offer`).

`lib/social-engine.ts` normalises the three SearchAPI social payload shapes into a single `SocialSignal`, picks the freshness leader (recency-first, engagement breaks ties), and flags viral posts running 5× baseline.
