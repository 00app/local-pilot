# BrightLocal — Autonomous Local Pilot

Interview PoC for BrightLocal. A clinical 12-column command centre that turns a URL + postcode into an autonomous local-SEO co-pilot for a local hero business (reference: The Flour Pot Bakery, Sydney Street, BN1).

Positioning: **not a dashboard — an Autonomous Execution Grid.** Reads the business's real-world pulse, translates it into Google-ready moves, and ships them with one tap.

---

## 1. Stack

- **Next.js 16.2** (App Router, Turbopack) · **React 19**
- **TypeScript 5.7** · **Tailwind CSS 4**
- **Framer Motion 12** (spring physics)
- **Sonner** (toasts) · **canvas-confetti** (celebration)
- **Radix UI** primitives · **lucide-react** icons
- Package manager: **pnpm**

---

## 2. Design System

### Aesthetic
Clinical Flat. No borders, no shadows, no gradients. White base. Sentence case only.

### Colour palette

| Token | Hex | Use |
| :--- | :--- | :--- |
| `--bl-mint` | `#86EFAC` | The Pulse |
| `--bl-sky` | `#BAE6FD` | The Hijack |
| `--bl-lemon` | `#FEF08A` | The Booster |
| `--bl-lavender` | `#E0E7FF` | The Lab |
| `--bl-coral` | `#FECACA` | The Battle |
| `--bl-grey` | `#F9FAFB` | Surface fills |
| `--bl-green` | `#2AE855` | Primary CTA / live indicators |

### Geometry
- Card radius: **30px** (`--radius-surgical`)
- Input radius: **9999px** (pill)
- Editor radius: **16px**

### Physics
- Spring: `cubic-bezier(0.34, 1.56, 0.64, 1)` (`--spring`)
- Framer Motion spring: `stiffness: 180, damping: 18`

### Typography
- **Inter** (UI, 700 bold for headings, sentence case only)
- **IBM Plex Mono** (data labels, `.text-data`, 10px, 0.18em tracking, uppercase)

### Key utility classes
`.stat-massive` (110px / 800 / -5px / 0.85) · `.stat-number` · `.editor-field` (18px, rgba(255,255,255,0.5)) · `.post-editor` · `.card-{mint,sky,lemon,lavender,coral}` · `.strategy-card` · `.strategy-card-wide` · `.widget-index` · `.pilot-label` · `.status-bar` / `.status-cell` · `.status-pulse-dot` · `.btn-squish` · `.text-data`.

Dashboard grid is implemented directly with Tailwind (`grid grid-cols-12 gap-10`). Unused utility classes (`.big-num`, `.stat-number-xl`, `.dashboard-grid`, `.bg-{mint,sky,lemon,lavender,coral}`) removed in v1.3.

---

## 3. User Flow

1. **Welcome** — Wings crest. "Take the Pilot's seat."
2. **Calibration** — 3 pill inputs: URL → Postcode → Social handles (Instagram / TikTok / Facebook).
3. **Discovery animation** — 4 scrape steps with live API call to `/api/scrape`.
4. **Cockpit unfolds** — staggered Framer Motion spring entrance.

Implemented in `components/onboarding.tsx`.

---

## 4. The 12-Column Grid

| Position | Section | Col span | Palette | Component |
| :--- | :--- | :--- | :--- | :--- |
| Header | Logo · `pilot: active` · Oven toggle · Business · Theme | 12 | white | `app/page.tsx` + `components/oven-status-toggle.tsx` |
| 01 | Status bar (freshness, rank, last sync, events) | 12 | grey | `components/pilot-status-bar.tsx` |
| Wedge | Environment pilot (weather + time + footfall → intent tilt) | 12 | dynamic | `components/environment-wedge.tsx` |
| 02 | **The Pulse** — Social sync | 4 | mint | `components/social-sync-card.tsx` |
| 03 | **The Booster** — Review velocity | 4 | lemon | `components/review-booster-card.tsx` |
| 04 | **The Hijack** — Community events | 4 | sky | `components/community-hijack-card.tsx` |
| 05 | **The Lab** — Authority / long-term SEO | 6 | lavender | `components/authority-lab-card.tsx` |
| 06 | **The Battle** — Competitor radar | 6 | coral | `components/competitor-radar-card.tsx` |
| 08 | **The Triangle** — Cross-platform social + Maps pin | 12 | mint | `components/social-triangle-card.tsx` |
| 07 | **The Shaper** — SEO mechanic / technical tweaks | 12 | coral | `components/seo-shaper-card.tsx` |
| Master | **Surgical launch** (master CTA) | 12 | `#1a1a1a` | `components/surgical-launch.tsx` |

Footer closer: *"Stop managing yesterday's data. Start leading tomorrow's neighbourhood."*

---

## 5. Widgets

### 02 · The Pulse (mint, col 4)
- **Data engine:** `/api/instagram` → SearchAPI `instagram_profile`
- **Hero stat:** `{N}m ago` since last Instagram post
- **Preview:** 1:1 image thumbnail · `@handle` · live/demo chip · caption quote · ♥ likes · 💬 comments
- **Draft:** real IG caption → `generateStrategy()` → Local-SEO post anchored to `{street}, {postcodeArea}`
- **Action:** "Deploy to Google"

### 03 · The Booster (lemon, col 4)
- **Hero stat:** aggregate rating (`4.9`)
- **Preview:** latest 5-star review
- **Draft:** AI response with local keywords
- **Action:** "Publish to Google"

### 04 · The Hijack (sky, col 4)
- **Hero stat:** `03` active local events
- **Move:** "Brighton Pride is 10 days away. 40% spike in 'bakery near me' expected."
- **Draft:** Pride brunch pre-order post
- **Action:** "Hijack the event"

### 05 · The Lab (lavender, col 6)
- **Data engine:** `/api/search` → SearchAPI `google` engine
- **Hero stat:** `+15%` authority growth
- **Intent panel:** live People Also Ask + related-search pills, live/demo chip, manual refresh
- **Draft:** 500-word deep dive; Regenerate folds the top PAA question into the draft
- **Action:** "Review & ship"

### 06 · The Battle (coral, col 6)
- **Data engine:** `/api/scrape` → SearchAPI `google_local` engine
- **Hero stat:** `#{rank} / {totalRivals}` in the postcode
- **Leaderboard:** top 3 rivals by review volume, review-count bar widths
- **Click any rival row** → expands in place with their 3 latest Google reviews, fetched live via `/api/reviews` (SearchAPI `google_maps` → `google_maps_reviews`). Per-rival cache so re-opening is instant. Chevron rotates, row surface lightens on hover, live/demo chip inside the expansion mirrors the card-level chip.
- **Footer:** last-scan timestamp + live/demo chip + "Re-scan postcode" (live re-fetch; collapses any open expansion).

### 08 · The Triangle (mint, col 12)
- **Data engines (four-in-one):** `/api/instagram` (`instagram_profile`), `/api/tiktok` (`tiktok_profile`), `/api/facebook` (`facebook_business_page`), `/api/maps` (`google_maps`)
- **Hero stat:** `{liveChannels} / {totalChannels}` social channels live
- **Layout:** 4-cell grid — Instagram, TikTok, Facebook, and a Google Maps pin. Each cell shows brand glyph + handle + latest post thumbnail + caption quote + time-since, or a "not connected" state if the handle was skipped in onboarding.
- **Freshest highlight:** the platform with the most recent post is ringed in `#2AE855` and tagged `fresh`; ties break on engagement (`likes + comments`).
- **Syndicate button per platform:** re-runs `generateStrategy()` against the source caption and surfaces the optimised Google Business Post in a toast, framed as "Syndicated `{platform}` → Google."
- **Maps cell:** renders the top `google_maps` local-pack hit — name, address, lat/lng, and a `{nearbyCount} nearby` summary. Anchors the Pilot to a real coordinate pair so the demo can show "we know exactly which pin you are on the map."
- **Footer:** live/demo chip + lead-signal mono line + "Re-scan triangle" (parallel refresh of all four engines)

### Master CTA — Surgical launch
- Full-width dark `#1a1a1a` slab, 30px radius, framer-motion spring entrance
- Fires 5-origin confetti barrage + toast: *"Surgical move deployed."*
- Increments global deployment counter by 3

---

## 6. Cross-widget intelligence

### Environment Pilot Wedge
Clickable col-12 atmospheric sensor between the status bar and execution tier. Three scenarios cycle on tap:

| Mode | Palette | Message | Intent tilt |
| :--- | :--- | :--- | :--- |
| `rain` | Sky | "it's raining in bn1. shifting strategy to 'indoor comfort' intent." | `+22% coffee search` |
| `sun` | Amber | "temperature spike detected. tilting to 'iced drinks & garden seating' intent." | `+31% iced coffee search` |
| `commuter` | Indigo | "commuter peak detected. drafting a 'quick grab & go' angle for the morning rush." | `+18% breakfast search` |

**Compound logic** — `environmentPulseOverride(mode, ovenStatus, postcodeArea)` in `components/environment-wedge.tsx`:
- `oven = HOT` + `mode = rain` → *"Warm bread and a dry seat. The perfect rain-refuge on Sydney Street, BN1."*
- The wedge itself morphs to display the compound line with an `oven hot + rain →` prefix badge
- The Pulse card re-keys (`key={`${envMode}-${ovenStatus}`}`) so the draft regenerates in real time

### Oven Status Toggle
Compact 3-state pill in the header (`Hot` / `Low` / `Out`). Feeds the environment wedge's compound brain. Component: `components/oven-status-toggle.tsx`.

### generateStrategy() — the Signal-to-SEO pipeline
Pure function in `lib/strategy.ts`. Converts a raw social caption into a postcode-anchored Google Post via an explicit 4-layer pipeline: **(1)** strip social fluff (hashtags, emoji, "link in bio"), **(2)** tilt to the matching GBP intent category (`product | event | vibe`), **(3)** inject the current environment + oven context, **(4)** close with a tone-aware proximity CTA.

```ts
generateStrategy({
  caption: "New sourdough out of the oven! 🍞 Link in bio #brighton",
  postcode: "BN1 4EN",
  street: "Sydney Street",
  envMode: "rain",      // optional
  ovenStatus: "HOT",    // optional
  tone: "direct",       // "direct" | "story" | "offer" (default "direct")
})
// → {
//   optimized_post: "Fresh artisan sourdough available today. Perfect for a rainy-day refuge — the oven's still on. Available now on Sydney Street, BN1.",
//   surgical_reason: "Signal-to-SEO: stripped 2 social-only tokens → tilted to product-intent lead → injected environment context → anchored to Sydney Street, BN1 → direct tone.",
//   keywords_hit: ["sourdough", "sydney street", "bn1"],
//   tone: "direct",
//   layers: { stripped: [...], heroKeyword: "sourdough", intentCategory: "product", ... },
// }
```

### Social engine — `lib/social-engine.ts`
The normalization layer between the three SearchAPI payload shapes and every widget that reads social. Exports:
- `normalizeSocialData(platform, raw)` — raw IG/TikTok/FB payload → unified `SocialSignal`.
- `calculateFreshnessLeader(signals)` — recency-first with engagement tie-break (<24h bucket).
- `detectViral(signal)` — 5× baseline thresholds (TikTok: views/followers; IG: engagement/3%; FB: engagement/1%).
- `formatAge(iso)` — the `5m / 2h / 3d` cadence used across the grid.

---

## 7. API Routes — six live engines

All routes fall back to curated demo data when `SEARCHAPI_API_KEY` is unset. When the key is present, every live/demo chip across the cockpit flips green simultaneously.

The full engine matrix — one `SEARCHAPI_API_KEY` unlocks all six:

| Route | SearchAPI engine | Drives |
| :--- | :--- | :--- |
| `/api/scrape` | `google_local` | The Battle leaderboard |
| `/api/reviews` | `google_maps` + `google_maps_reviews` | The Battle click-to-expand reviews |
| `/api/search` | `google` | The Lab (PAA + related searches) |
| `/api/instagram` | `instagram_profile` | The Pulse + The Triangle (IG cell) |
| `/api/tiktok` | `tiktok_profile` | The Triangle (TikTok cell) |
| `/api/facebook` | `facebook_business_page` | The Triangle (Facebook cell) |
| `/api/maps` | `google_maps` | The Triangle (Maps pin) + onboarding step 1 |

### `POST /api/scrape`
SearchAPI `google_local` — rivals in the postcode.
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"postcode":"BN1 4EN","businessType":"bakery"}'
```
Returns `{ competitors: ScrapedCompetitor[], postcode, businessType, totalFound }`.

### `GET|POST /api/search`
SearchAPI `google` — general SERP + intent signals.
```bash
curl "http://localhost:3000/api/search?q=best+artisan+sourdough+process&location=Brighton%2C+UK"
```
Returns `{ query, related_searches, people_also_ask, answer_snippet, top_results, isLive }`.

### `GET|POST /api/instagram`
SearchAPI `instagram_profile` — latest post.
```bash
curl "http://localhost:3000/api/instagram?username=flourpot"
```
Returns `{ username, full_name, followers, profile_pic_url, post: { image_url, caption, likes, comments, posted_at, permalink }, isLive }`.

### `POST /api/reviews`
SearchAPI `google_maps` → `google_maps_reviews` — latest Google reviews for a named rival. Two-step: resolve `name + postcode` to a `place_id` via `google_maps`, then pull reviews via `google_maps_reviews`.
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"name":"GAIL'\''s Bakery","postcode":"BN1 4EN"}'
```
Returns `{ rival, reviews: [{ author, rating, text, time }], isLive }`. Falls back to a seeded curated mock pool (rotated by name hash) when the key is unset, so every rival reads a different set even offline.

### `GET|POST /api/tiktok`
SearchAPI `tiktok_profile` — latest video + profile stats.
```bash
curl "http://localhost:3000/api/tiktok?username=therock"
```
Returns `{ username, display_name, followers, likes, post: { image_url, caption, likes, comments, views, posted_at, permalink }, isLive }`. Powers The Triangle's TikTok cell.

### `GET|POST /api/facebook`
SearchAPI `facebook_business_page` — latest post from a business page. Accepts a raw numeric `page_id`, a full page URL, or a bare handle (`/yourpage`, `https://facebook.com/pages/X/12345`, `@yourpage`) — server resolves to whatever token the engine needs.
```bash
curl "http://localhost:3000/api/facebook?page_id=100089525329756"
```
Returns `{ page_id, page_name, likes, followers, post: { image_url, caption, likes, comments, shares, posted_at, permalink }, isLive }`.

### `GET|POST /api/maps`
SearchAPI `google_maps` — Google Maps local-pack lookup. Accepts either `ll` (`@lat,lng,zoom`) or `location` / `postcode` (the route promotes `BN*` postcodes to `Brighton, UK` for the engine).
```bash
curl "http://localhost:3000/api/maps?q=Hotels&ll=%4040.7409208%2C-73.984625%2C13.87z"
```
Returns `{ query, lat, lng, topResultName, topResultAddress, nearbyCount, isLive }`. Powers The Triangle's Maps cell and the onboarding Discovery Scraper step 1.

---

## 8. Environment

`.env.local.example` in the repo. Copy to `.env.local` and fill:

```
SEARCHAPI_API_KEY=
```

One key unlocks all three engines. Restart the dev server after setting.

---

## 9. Running

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build
pnpm start
pnpm lint
```

---

## 10. File Map

```
app/
├── page.tsx                  # Dashboard orchestrator + spring entrance
├── layout.tsx                # Toaster, fonts, analytics
├── globals.css               # Design tokens, grid, typography, utilities
└── api/
    ├── scrape/route.ts       # google_local → The Battle
    ├── search/route.ts       # google → The Lab
    ├── instagram/route.ts    # instagram_profile → The Pulse + The Triangle
    ├── tiktok/route.ts       # tiktok_profile → The Triangle
    ├── facebook/route.ts     # facebook_business_page → The Triangle
    ├── maps/route.ts         # google_maps → The Triangle + onboarding step 1
    └── reviews/route.ts      # google_maps + google_maps_reviews → The Battle expansion

components/
├── dashboard.tsx             # Full cockpit (v1.2.1 — moved from app/page.tsx)
├── onboarding.tsx            # 5-step calibration + parallel discovery scrape
├── pilot-status-bar.tsx      # 01 · col 12
├── environment-wedge.tsx     # Contextual atmosphere sensor
├── oven-status-toggle.tsx    # Header oven toggle
├── social-sync-card.tsx      # 02 · The Pulse (mint)
├── review-booster-card.tsx   # 03 · The Booster (lemon)
├── community-hijack-card.tsx # 04 · The Hijack (sky)
├── authority-lab-card.tsx    # 05 · The Lab (lavender)
├── competitor-radar-card.tsx # 06 · The Battle (coral)
├── social-triangle-card.tsx  # 08 · The Triangle (mint, col-12) — IG + TikTok + FB + Maps
├── seo-shaper-card.tsx       # 07 · The Shaper (coral, col-12)
├── pilot-info.tsx            # Reusable "intelligence" popover (every card)
├── surgical-launch.tsx       # Master col-12 CTA
└── ui/                       # shadcn primitives (button, spinner, sonner…)

lib/
├── strategy.ts               # generateStrategy() — 4-layer Signal-to-SEO pipeline
├── social-engine.ts          # SocialSignal + normalize / freshness / viral detection
├── types.ts                  # OvenStatus, Competitor, BusinessData
└── utils.ts                  # cn()
```

---

## 11. Thursday Demo Script

1. **Hook** — "We don't manage data. We navigate neighbourhoods."
2. **Onboarding** — enter `flourpot.co.uk` + `BN1 4EN` + `@flourpot`. Scrape animation runs, cockpit unfolds.
3. **The Pulse** — point at the 1:1 IG image, `5m ago`. *"This post was live on Instagram five minutes ago. The Pilot already translated it into a Google post anchored to Sydney Street."*
4. **Environment wedge** — tap it. Weather flips, the Pulse draft re-generates. *"Local SEO isn't static — it's atmospheric."*
5. **Oven: Hot + Rain combo** — flip oven to Hot. The wedge morphs to the compound line. *"Warm bread and a dry seat. The perfect rain-refuge."*
6. **The Lab** — point at People Also Ask. *"Someone in Brighton typed this into Google 20 minutes ago. The Pilot read it and answered it in a 500-word deep-dive."*
7. **The Battle** — tap Re-scan. Rival list refreshes live from `google_local`.
8. **The Shaper** — point at the pulsing coral ring + `technical_seo: stale` chip in the status bar. *"Most tools tell you how you're ranking. The Pilot tells you why you're sliding."* Ship each of the 3 technical tweaks. When the third applies, the ring dies and the chip flips to `fresh` in real time. *"We just closed three schema gaps our rivals were exploiting. Ranking forecast: +2 positions in 72 hours."*
9. **Pilot Intelligence (transparent autonomy)** — hover the `(i)` icon on the Pulse card. Popover blooms in card colour. *"We never want the Pilot to feel like a black box. Every surgical move has a reason. Tap the info icon and the owner can see the exact SEO physics we're applying. It's not just automation — it's education."*
10. **Surgical Launch** — master confetti, toast, deployment counter jumps by 3.
11. **Close** — *"Three live data engines, one SEO mechanic, full transparency. We don't just fly the plane — we maintain the engine mid-air and teach the owner how it works."*

---

## 12. Changelog

Maintained chronologically; every feature drop below ships as a discrete atomic commit scope.

### 2026-04-20

- **v0.1** — Initial cockpit: status header, freshness banner, 3 × col-4 cards (Social Sync / Keyword Intercept / Review Booster). Mint + sky + lemon palette.
- **v0.2 — Command Centre expansion:** added The Hijack (sky, col 4), The Lab (lavender, col 6), The Battle (coral, col 6), 4-cell Pilot Status Bar (col 12). Replaced Keyword Intercept with Community Hijack. Added lavender + coral CSS tokens. Rebalanced to full 12-col grid with 32px gap.
- **v0.3 — Brand Compiler parity:** added `--bl-*` tokens, `--radius-surgical`, `--spring`. Installed `canvas-confetti`. Wired confetti + Sonner toasts ("surgical move deployed.") to every widget action. `stat-massive` locked to 110px / 800 / -5px; `editor-field` to 18px.
- **v0.4 — Surgical launch + oven + strategy engine:** added `components/surgical-launch.tsx` master col-12 CTA with framer-motion spring entrance and 5-origin master confetti. Added `components/oven-status-toggle.tsx` in the header. Added `lib/strategy.ts` with `generateStrategy()` (IG caption → Local SEO post). Installed framer-motion. Sonner mounted globally.
- **v0.5 — Environment Pilot Wedge:** added `components/environment-wedge.tsx` (rain / sun / commuter) between status bar and execution tier. Compound `oven: HOT + rain` logic. Pulse card re-keys on env/oven change and re-generates draft. Added `environmentPulseOverride()` helper.
- **v0.6 — SearchAPI triangle:**
    - `/api/scrape` already wired to `google_local`; upgraded Competitor Radar's "Re-scan postcode" button to actually call the endpoint and update rivals in place. Added live/demo chip.
    - Added `/api/search` wrapping the `google` engine; Authority Lab now fetches live People Also Ask + related searches on mount with a manual refresh, and Regenerate folds the top PAA into the draft.
    - Added `/api/instagram` wrapping the `instagram_profile` engine; Social Sync now shows 1:1 image preview + `@handle` + caption quote + likes/comments + time-since-post; real caption flows through `generateStrategy()` for the translated Google post.
- **v0.7 — Project spec:** this document. Maintained going forward.
- **v0.8 — SEO Shaper + Digital Vitality:**
    - Added `components/seo-shaper-card.tsx` (widget 07, col-12, coral) — "The Shaper". Big `#01` target-rank stat with ▲/▼ delta, primary "technical freshness alert" banner, and a 3-column grid of technical tweaks (storefront photo, Menu schema, GBP category). Each tweak has its own "Apply" flow with 1.2s spinner → applied state. When all three are applied, the card shows an all-clear banner and calls `onAllApplied`.
    - Added coral pulse ring (framer-motion `boxShadow` keyframe loop) that only runs while `rankDelta < 0` and not all tweaks are applied — visual "technical_seo: stale" signal.
    - Upgraded `components/pilot-status-bar.tsx` first cell from "Pilot health" → "Digital vitality". Still renders the 92/100 score, now with a breakdown strip below (`social_pulse`, `review_velocity`, `technical_seo`) with pulsing amber dot on stale signals. `vitality: VitalitySignals` prop required.
    - Introduced `VitalitySignals` type (`social_pulse | review_velocity | technical_seo` → `active | high | stale | fresh | low`). Initial state `{ social_pulse: active, review_velocity: high, technical_seo: stale }`.
    - `app/page.tsx` holds the vitality state; `handleAllTweaksApplied()` flips `technical_seo → fresh` and fires a "Digital vitality restored. Rank forecast: +2 within 72h." toast. Each individual tweak apply bumps the deploy counter, fires move-confetti, and toasts the tweak title. Causality is visible in the demo: pulse stops the moment the 3rd tweak ships.
- **v0.9 — Pilot Intelligence popovers ("transparent autonomy"):**
    - Added `components/pilot-info.tsx` — reusable Radix Popover wrapper. 14px outlined `(i)` icon in the top-right of each card, 40% opacity fading to 100% on hover/focus. Opens on both hover (desktop, with a 120ms close grace period) and click (mobile/keyboard). `PopoverContent` bg matches the host card tint at `filter: brightness(0.9)` for the spec'd 10% darker legibility separation. No border, no shadow — clinical flat. Spring-loaded `zoom-in-95` mount animation via shadcn's existing Radix data-attribute tokens. Exports a `PILOT_TINT` constant map mirroring the 5 card hexes (`mint`, `sky`, `lemon`, `lavender`, `coral`) and optional `triggerClassName`/`align` overrides.
    - Added `position: relative` to `.strategy-card` and `.strategy-card-wide` so the absolute-positioned info trigger anchors to the card.
    - Wired intelligence copy into every widget (sentence case, lowercase titles per the clinical system):
      - **The Pulse** (mint) — "social-to-search bridging" · *search engines reward consistency with a freshness ranking boost*.
      - **The Booster** (lemon) — "sentiment velocity" · *hyper-local keywords in responses build BN1 postcode authority*.
      - **The Hijack** (sky) — "intent hijacking" · *scrape upcoming neighbourhood events, intercept visitor traffic*.
      - **The Lab** (lavender) — "authority compounding" · *long-form deep-dives answer google queries, compound topical authority*.
      - **The Battle** (coral) — "proximity competition" · *proximity is a top-3 ranking signal; track whose move is pulling attention away from your door*.
      - **The Shaper** (coral) — "technical audit" · *identifies silent ranking killers — outdated categories, missing schema — against the top 3 street rivals*. Icon placed inline next to the `07 · The shaper` widget-index to avoid collision with the right-hand header block.
    - Every popover carries a mono footer: `logic source: brightlocal brain v1.5`.
- **v1.0 — Dark-mode parity + dead-code cull:**
    - Added dark-mode chrome tokens: `--surface-alt`, `--surface-line`, `--surface-chip`, `--surface-chip-border`, `--hairline`, `--stat-ink`. Light defaults match the previous hard-coded `#fafafa` / `#f0f0f0` / `#f9fafb`; dark flips to `#0f1114` / `#1f2937` / `#111827`.
    - `.status-bar`, `.status-cell`, `.status-cell-value`, `.status-cell-label` all migrated from hard-coded greys to the new tokens + `var(--foreground)` / `var(--muted-foreground)`.
    - `.stat-massive` colour changed from `#1a1a1a` to `inherit` so the pastel cards keep their deep tinted ink (coral → `#7F1D1D`, lavender → `#312E81`) and the value reads correctly in both themes.
    - Removed unused `.freshness-banner` utility from `globals.css`.
    - `app/page.tsx` chrome migrated to `bg-background`/`text-foreground`/`text-muted-foreground`. Header bar uses `bg-background/90` + `border-[var(--hairline)]` dividers; logo gets `dark:invert` so the white BrightLocal mark reads on dark. Pilot-active chip and all hairlines now theme-aware.
    - `components/pilot-status-bar.tsx` — every `text-gray-*` replaced with `text-muted-foreground` / `text-foreground`; vitality chips use `emerald-600 dark:emerald-400` / `amber-600 dark:amber-400` so stale/fresh states pop in both modes.
    - `components/oven-status-toggle.tsx` — pill uses `bg-[var(--surface-chip)]` + `border-[var(--surface-chip-border)]`; unselected segment buttons use `bg-background` + bordered outline. Legible in both themes.
    - **Copy cleanup** — removed the drifted marketing footer ("Stop managing yesterday's data..."), trimmed the Shaper's "24/7 technical mechanic. Scrapes rivals' schema, meta, and GBP..." line (redundant with its popover + status badge), replaced `master cta · col 12` internal dev label with `master launch`, and shortened Authority Lab + Competitor Radar sub-descriptions to one-liners (the stats and popovers carry the weight now).
    - **Dead-code cull** — deleted six stale components no longer imported anywhere: `ai-strategy.tsx`, `deploy-button.tsx`, `oven-status-dial.tsx`, `neighborhood-battle.tsx`, `social-feed.tsx`, `keyword-intercept-card.tsx` (~20KB). The dashboard now compiles with only the 11 components it actually renders.
- **v1.0.1 — Page scroll hygiene:**
    - `globals.css` base layer: promoted `html`/`body` to the canonical scroll container — both now carry `bg-background`/`text-foreground`/`min-height: 100%` (body also `100dvh`), so the page grows with content and the scroll always lives on the document itself rather than a nested element.
    - `html { scroll-behavior: smooth; scroll-padding-top: 8rem; }` — keeps anchored + programmatic scroll from landing underneath the 2-strip sticky header (~128px tall).
    - `overscroll-behavior-y: none` + `overflow-x: hidden` on `html` — kills the macOS rubber-band white flash in dark mode and prevents any runaway horizontal overflow from a widget pushing the page sideways on narrow viewports.
- **v1.1 — Full dark-mode parity across every module + 20px pilot-intelligence icons:**
    - **Card-level theme tokens.** Every `.card-*` class now exposes two custom properties: `--card-bg` (surface) and `--card-fg` (ink). In light mode the bright pastel is the surface and the deep-tint hex is the ink; in dark mode the pair swaps (deep-tint surface, bright pastel ink) so the clinical hue language reads naturally against the dark chrome instead of screaming off it. All five palettes flip consistently (`card-mint`/`card-sky`/`card-blue`/`card-lemon`/`card-yellow`/`card-lavender`/`card-coral`).
    - **CTA buttons auto-invert.** Every card's primary CTA (publish/deploy/launch/re-scan/apply/etc.) was rewritten from hard-coded `bg-[#064E3B] text-white` style hexes to `bg-[var(--card-fg)] text-[var(--card-bg)] hover:brightness-110`, so it now renders as the card's ink on the card's surface in both themes automatically. Covers `social-sync-card`, `review-booster-card`, `community-hijack-card`, `authority-lab-card`, `competitor-radar-card` (CTA, rank pill, progress bar fill), and `seo-shaper-card` (tweak cards, alert avatar, rank-delta arrow, stale status pill).
    - **Frosted inlays dim cleanly.** Added a single global `.dark .strategy-card [class*="bg-white/"]` rule (and its `hover:` sibling) that drops the 30–70% white-frost inlays used inside cards to `rgba(255,255,255,0.10)` (hover: `0.18`) in dark mode. No per-file `dark:` churn, and buttons / review callouts / event callouts / instagram preview / rival rows / tweak cards all pick it up for free.
    - **Editor surfaces flip.** `.editor-field` and `.post-editor` dropped their hard-coded `color: #000000` and white-translucent backgrounds in favour of `color: inherit` + a dark-mode variant that uses a black frosted inlay (`rgba(0,0,0,0.22)` / focus `0.35`). They now inherit the card's `--card-fg` ink in both themes.
    - **Environment wedge now theme-aware.** `rain`/`sun`/`commuter` scenarios gained matched `dark:` variants for `bg`/`text`/`dot`/`iconBg` (e.g. `bg-sky-100 dark:bg-sky-950`, `text-sky-950 dark:text-sky-100`). The vertical divider flips from `bg-black/10` to `bg-white/15`.
    - **Surgical launch CTA** swaps from near-black `#1a1a1a`/white to white/black in dark mode, including its label, subtitle, and loading-state spinner halo.
    - **Pilot Intelligence popover — icon + hover fixes.**
        - Icon size bumped **14px → 20px** with a `p-1` tap target around it. Default opacity lifted from 40 → 60 for legibility on pastels.
        - Replaced `mouseenter`/`mouseleave` with `pointerenter`/`pointerleave` + `pointerType === "mouse"` gating so touch devices no longer race the click (which caused the popover to toggle back off on tap). Click still works everywhere, focus still opens.
        - Extended the close grace period from 120ms → 180ms so the cursor can safely cross the 8px `sideOffset` between trigger and portaled content without the popover flickering shut mid-hop.
        - Added an unmount-time cleanup for the pending close timer (no more `setState` on an unmounted node when a card re-keys on env/oven changes).
        - `seo-shaper-card` inline trigger className aligned with the new baseline (`opacity-60`, `p-1`) so the inline position variant stays visually consistent with the absolute default.

- **v1.2 — Navigator's Intercom + theme-toggle affordance + final legibility sweep:**
    - **Navigator's Intercom** (`components/pilot-intercom.tsx`) — a floating co-pilot in the bottom-right, not a chatbot. 56px pill (black in light / white in dark) with a green `#2AE855` status ping. On open it leads with a *context-aware flight path* derived live from `envMode` + `ovenStatus` + `vitality.technical_seo` (e.g. *"oven is hot and it's raining in bn1. i'm drafting a 'rain refuge' pulse and holding the blog deep-dive for tomorrow."*) — never a generic greeting. Supports four surgical slash commands: `/rescan`, `/draft-blog`, `/deploy-all` (runs `onMasterLaunch`, master-confetti + toast), `/why` (reasoning trace), plus `/help`. Natural-language fallbacks mirror intent (`rank`/`seo`/`review`/`content`) back as surgical framings. UI: 22rem rounded popover with four strips — identity (`pilot intercom · online`), chat stream (spring-mounted bubbles, green user pills + frosted pilot cards), quick-command chips, and a pill-shaped `/command` input with a green-hover send button. Radix Popover, no border, no shadow — clinical flat.
    - **Theme toggle** became a circular pill with a green hover — `rounded-full` + `border-[var(--hairline)]` + `bg-[var(--surface-chip)]` baseline, `hover:bg-[#2AE855] hover:text-black hover:border-[#2AE855]`, green focus-visible ring. Proper `aria-label` ("Switch to light mode" / "Switch to dark mode") replaces the visual-only "Toggle theme" sr-only.
    - **Legibility sweep across both themes:**
        - Onboarding inputs (`bg-card text-black`) → `bg-card text-foreground` across all 5 occurrences (URL, postcode, Instagram, TikTok, Facebook) — previously invisible in dark mode.
        - TikTok icon circle added `dark:bg-white dark:text-black` so the brand glyph stays visible against dark chrome.
        - Inlined `.pilot-tagline` usage on the welcome screen (`font-mono text-[10px] text-muted-foreground` + green `BRIGHTLOCAL.` span) and **removed** the now-orphaned `.pilot-tagline` CSS class from `globals.css`.
        - Review card stars lifted from `text-yellow-600` to `text-yellow-600 dark:text-yellow-300` so they still pop against the dark amber card surface in dark mode.
    - **Footer cull** — the dashboard's `AUTONOMOUS EXECUTION GRID · SURGICAL CERTAINTY.` tagline strip was removed. The grid now ends with the master launch CTA and 40px breathing room before the intercom, keeping the cockpit weight on the widgets themselves.
- **v1.3 — Overlap fix, inter-module gutter, click-to-expand rival reviews, CSS cull:**
    - **Fixed top-right overlap in wide cards.** The absolute `PilotInfo` trigger at `top-4 right-4` (28px footprint with its `p-1` tap padding) was biting into the `text-right max-w-[50%]` widget-index label on `AuthorityLabCard` and `CompetitorRadarCard` — visible as the info `(i)` icon sitting on top of `05 · THE LAB` / `06 · THE BATTLE`. Added `pr-8 pt-1` to the right-label block in both widgets so the icon gets its own clear 32px gutter and the widget index still right-aligns against that invisible edge instead of the card's actual padding edge.
    - **Inter-module gutter bumped 32px → 40px.** The three dashboard grids (execution tier, strategy tier, intelligence tier) now use `gap-10 mb-10` instead of `gap-8 mb-8`, giving each widget more breathing room and letting the pastel cards read as individual modules rather than a connected wall.
    - **Click-to-expand rival reviews (The Battle).** Each row in the Competitor Radar leaderboard is now a keyboard-accessible `<button>` that toggles an inline expansion revealing the rival's 3 latest Google reviews (author, star rating, quote, time-since). Uses an `AnimatePresence` height/opacity spring (same `--spring` curve), a chevron rotates 180° when open, and the row surface lightens on hover / focus ring traces the card-fg. Per-rival result cache so re-opening a rival is instant; `handleScan` collapses any open row on re-scan. Only one rival open at a time to keep the card compact.
    - **New `/api/reviews` route.** Two-step SearchAPI pull: `google_maps` (resolve `name + postcode` → `place_id`) → `google_maps_reviews` (latest reviews). Falls back to a 6-entry curated review pool rotated by a cheap name-hash so every mock rival reads differently. Live/demo chip inside the expansion mirrors the card-level chip state, using the same green `#2AE855` token.
    - **CSS cull.** Removed unused utility classes from `globals.css`: `.big-num`, `.stat-number-xl`, `.dashboard-grid`, and the `.bg-{mint,sky,lemon,lavender,coral}` aliases (confirmed zero source references). Corresponding media-query override for `.stat-number-xl` also dropped. Spec-parity list in §2 trimmed to match.
- **v1.4 — The Triangle + TikTok/Facebook/Maps engines + double-scrape fix:**
    - **Double-scrape bug fixed** (`components/onboarding.tsx`). The discovery `useEffect` had `scrapedCompetitors` (and every user-input field) in its dep array, so `setScrapedCompetitors()` mid-sequence retriggered the whole async pipeline and fired every API call twice — plus React 19 Strict Mode's double-mount was a third trigger in dev. Replaced the setter-driven closure with a `hasRunRef` gate, trimmed the deps to just `[step]`, and lifted all scraped results into local variables that flow straight into `onComplete()` at the tail. The scrape now fires exactly once per calibration.
    - **Three new SearchAPI engines wired end-to-end:**
        - `/api/tiktok` wraps `tiktok_profile` — latest video cover + caption + play-count + like/comment counts. Accepts `@handle`, URL, or bare username; normalises all three.
        - `/api/facebook` wraps `facebook_business_page` — latest post + page likes/followers. Accepts numeric `page_id`, full page URL, or bare handle; server extracts the token the engine needs (`/pages/X/12345` → `12345`, `facebook.com/yourpage` → `yourpage`, etc.).
        - `/api/maps` wraps `google_maps` — top local-pack pin with lat/lng + address + nearby count. Accepts `ll` (`@lat,lng,zoom`), `location`, or a UK postcode (promotes `BN*` to `Brighton, UK` automatically).
        - Every new route ships parity mock data for the Flour Pot demo so the offline story still shines when `SEARCHAPI_API_KEY` is unset.
    - **The Triangle (widget 08, col-12, mint)** — new `components/social-triangle-card.tsx`. A 4-cell cross-platform surface showing Instagram, TikTok, Facebook, and a Google Maps pin side-by-side. Each cell: brand glyph + handle + latest-post thumbnail + caption line + time-since. The freshest post across all three socials gets a green `#2AE855` ring and `fresh` chip (ties broken on `likes + comments` engagement). A per-cell "→ google" syndicate button re-runs `generateStrategy()` against that platform's caption and surfaces the optimised Google Business Post in a toast ("Syndicated Instagram → Google"), closing the loop between the three social fires and the one SEO surface they all need to feed. Bottom strip: live/demo chip, lead-signal mono line, "Re-scan triangle" (parallel refresh of all four engines). Same `PilotInfo` intelligence popover pattern as the rest of the grid.
    - **Onboarding discovery expanded.** Scrape sequence rebranded from four hand-waved animations into four real engine phases: (1) `/api/maps` to plant the Google profile pin, (2) `/api/instagram` + `/api/tiktok` + `/api/facebook` in parallel (only fires engines we have handles for), (3) `/api/scrape` for the postcode gap, (4) `/api/search` fire-and-forget to warm the Lab's SERP cache. The parallel social fan-out means three social pulls add ~0ms to the critical path.
    - **Scraped signals thread into the cockpit.** `Onboarding` now returns `{ socials, mapsPin }` alongside the existing `{ url, postcode, competitors }`. `Dashboard` passes both into `SocialTriangleCard` as `initialSocials` + `initialMapsPin`, so the grid lands fully populated without a second round-trip — tapping "Re-scan triangle" on the card is a refresh, not a cold start.
    - Grid order after v1.4: Status bar → Environment wedge → Execution tier (Pulse / Booster / Hijack) → Strategy tier (Lab / Battle) → **The Triangle (Col 12)** → The Shaper (Col 12) → Surgical launch.

- **v1.6 — live SearchAPI parsers, editor clipping, header restripe, cleanup:**
    - **Every scrape route flipped to real SearchAPI data** (`.env.local.SEARCHAPI_API_KEY` required). Verified against `@gailsbakery` / `BN1 4EN` / "The Flour Pot Bakery — Sydney Street": `/api/scrape` now returns the 20 real Brighton bakeries (Flour Pot #1 at 4.5★ / 726 reviews, not the demo's 412), `/api/maps` plants the Pilot on `50.8272, -0.1378`, `/api/instagram` surfaces 179k followers + a real thumbnail + accurate `posted_at`, `/api/search` returns 8 related searches + 4 real PAAs ("is sourdough actually healthier than regular bread?"), `/api/reviews` pulls Vikki Horton / Konrad Chapman Google reviews by name. Key fixes: **(1)** `/api/scrape` + `/api/maps` were sending `location=Brighton, UK` which SearchAPI's UULE encoder rejects with HTTP 400 → promoted BN* postcodes to the fully-qualified `Brighton, England, United Kingdom`, added a generic `England, United Kingdom` fallback. **(2)** `/api/search` was reading `data.people_also_ask` (SerpApi's field name); SearchAPI ships the same array as `related_questions` → prefer the canonical name, keep the old as fallback. **(3)** `/api/instagram` was looking for `image_url` + `taken_at`; SearchAPI's canonical post fields are `thumbnail` + `iso_date`, and profile metadata lives under `profile.name` / `profile.avatar_hd` — now mapped correctly. **(4)** `/api/tiktok` — documented that the `tiktok_profile` engine returns profile-only metadata (no `videos[]` array); we surface handle + follower count + `hearts` → `likes` and the Triangle cell renders cleanly in profile-only mode when no latest-post is available. **(5)** Error logs upgraded everywhere — we print the SearchAPI error body (first 300 chars) instead of a bare status code so future failures are debuggable without re-runs. All five routes gained `isLive: true/false` flags on their responses for the UI's live/demo chip.
    - **Editor clipping fix (`app/globals.css`).** `.strategy-card` + `.strategy-card-wide` have `overflow: hidden` for radius clipping; paired with `.post-editor { max-height: 120px }` this was capping the editor at 120px regardless of card height — in the Pulse card (with IG preview + tone pills + footers above the editor) the deploy CTA and reasoning footer were being pushed past the card's bottom edge and clipped. Dropped the `max-height`, kept the 80px `min-height` floor, added explicit `overflow-y: auto` + `min-height: 0` to `.editor-field` (wide cards). Shipped a shared thin 6px translucent scrollbar spec (WebKit + Firefox, both themes) so long drafts scroll inside the box with a subtle affordance instead of bleeding past the clinical radius.
    - **Header strip 2 re-striped (`components/dashboard.tsx`).** Moved the `pilot: active` chip out of the left group (was `[pilot chip] [oven toggle]`) and into the right cluster after the business name (`[oven toggle] … [business · postcode] [pilot chip] | [deployed today]`). Keeps capacity signal left-anchored to the logo column and groups live-status + deployment metrics on the right.
    - **Stray content removed from the Pulse (`components/social-sync-card.tsx`).** Pulled the mono `Signal-to-SEO: stripped N social-only tokens → …` reasoning footer and the `Image auto-staged for the Google post. 2× click-rate vs text-only.` hint. The reasoning is already conveyed in the `PilotInfo` popover (`signal-to-seo bridging`), and the image staging is already visible in the Surgical Launch thumbnail strip — the extra mono lines were repeating the narrative inside the card. Pruned the `lastReason` state, `setLastReason` call, `stagedHint` variable, and the now-unused `framer-motion` import.
    - **Env setup.** `.env.local` is git-ignored via the existing `.env*.local` rule. `.env.local.example` documents the single key required. `README.md` explains how to go from `cp .env.local.example .env.local` to live data in one command.

- **v1.5 — Signal-to-SEO engine: normalization, 4-layer strategy, tone pills, viral detection:**
    - **New `lib/social-engine.ts` — the normalization layer.** Exports the single `SocialSignal` shape every widget now speaks (`platform, handle, mediaUrl, mediaType, caption, engagement, views?, followers?, timestamp, permalink?, isLive`), plus `normalizeSocialData(platform, raw)` that folds the three very different SearchAPI payload shapes (`instagram_profile`, `tiktok_profile`, `facebook_business_page`) into it. Also ships `calculateFreshnessLeader(signals)` (recency-first sort with engagement breaking ties inside the <24h bucket — returns `{signal, hoursOld, isRecent, tieBreaker}` so the UI can explain *why* this platform won the ring), `detectViral(signal)` (TikTok: `views ≥ 5× followers`; IG: `engagement ≥ 5 × 3% × followers`; FB: `5 × 1%` — returns multiplier + baseline or null), and `formatAge(iso)` (the `5m / 2h / 3d` cadence, consistent across every card).
    - **Strategy engine rebuilt as an explicit 4-layer pipeline (`lib/strategy.ts`).** Every optimised post now flows through: **(1) Fluff strip** — regex-remove "link in bio", "check stories", "swipe up", "dm for details", "tag a friend", "follow us", all hashtags, all Unicode emoji (`U+1F300–U+1FAFF` + `U+2600–U+27BF`), then collapse whitespace. **(2) Intent tilt** — classify the caption as `product | event | vibe` and lead with the matching GBP-category-aligned phrase (product gets six hook families — sourdough, croissants, coffee, cakes, brunch, cinnamon — each with its canonical keyword; events cover Pride/markets/workshops; vibes cover outdoor/cosy). **(3) Environment injection** — `envMode + ovenStatus` pairs produce hand-tuned compound lines ("Perfect for a rainy-day refuge — the oven's still on", "Grab one warm before the sun pulls the queue out the door", "Fresh out of the oven — perfect for your morning dash"); environment-alone and oven-alone fall back to softer one-liners. **(4) Proximity CTA** — tone-aware street + postcode close (`direct` → "Available now on Sydney Street, BN1.", `story` → "Our bakers started at 4am so you could have this on Sydney Street, BN1.", `offer` → "Mention this post for 10% off your sourdough today at our BN1 shop."). The move returns a rich `{optimized_post, surgical_reason, keywords_hit, tone, layers}` — `layers` exposes what each stage did so the UI can tell the owner *why* the post changed (e.g. `Signal-to-SEO: stripped 2 social-only tokens → tilted to product-intent lead → injected environment context → anchored to Sydney Street, BN1 → direct tone.`). Fully backwards-compatible — the original `{caption, postcode, street}` callers keep working; `envMode`, `ovenStatus`, `tone` are optional.
    - **The Pulse — tone pills + live SEO reasoning + image staging (`components/social-sync-card.tsx`).** Added three **Tone** pills (`Direct` / `Story` / `Offer`) between the IG preview and the editor — each re-runs `generateStrategy` with the chosen tone and swaps the draft in place; a `userEdited` flag prevents re-translation from stomping on owner edits (resets when the owner regenerates or re-picks a tone). New `envMode` + `ovenStatus` props flow into the strategy call, so changing the EnvironmentWedge or OvenStatusToggle now re-translates the post on the fly (e.g. rain + HOT → "Perfect for a rainy-day refuge"). A mono `Signal-to-SEO: …` footer fades in under the editor showing the exact four-step reasoning. A second mono hint surfaces when the IG image will auto-attach ("Image auto-staged for the Google post. 2× click-rate vs text-only."). PilotInfo copy upgraded from "social-to-search bridging" to "signal-to-seo bridging" with the new four-layer narrative. `onDeploy` signature extended to `(post, stagedImage?)` so the dashboard knows whether the image hitched a ride.
    - **The Triangle — viral detection + tone-aware syndicate (`components/social-triangle-card.tsx`).** Refactored to consume `SocialSignal` directly via a small `toSignal(triangleSocial)` mapper. The freshest-platform ring is now driven by `calculateFreshnessLeader()` — the header sub-copy differentiates "freshest signal" vs "engagement winner" when the top two are tied on recency. `detectViral()` runs on every signal set; the first time a viral post appears (keyed by `platform · timestamp`, held in a `useRef<Set>` so toasts never re-fire on re-render) a priority toast ships with "Your TikTok is trending. Running 8× baseline. Deploying as a 'what's new' Google post while the signal is hot." The viral cell also swaps its green `fresh` ring for a **red `#FF4D4D` ring + 🔥 chip with the multiplier** (e.g. `🔥 8×`) so the owner can read the wave at a glance. Viral-sourced syndicate calls auto-upgrade to `tone: "direct"` to ride the wave without dilution; non-viral cells use the `defaultTone` prop (falls back to `direct`). `envMode` + `ovenStatus` + `defaultTone` are now first-class props — every generated Google post folds in live environment context. PilotInfo copy rewritten: "instagram is for aspiration, tiktok is for discovery, facebook is for community. google is for intent…".
    - **Surgical Launch staging strip (`components/surgical-launch.tsx`).** The master CTA now accepts a `stagedImages: string[]` prop and renders a 36px circular thumbnail stack under its subtitle (max 3 images, ring-overlapped), with a `n images attached` caption. Dashboard passes every social `latestPost.image` through so the owner sees exactly what's shipping before they tap launch.
    - **Dashboard rewiring (`components/dashboard.tsx`).** Dropped the re-mounting `key={${envMode}-${ovenStatus}}` on the SocialSyncCard (previously wiped owner edits on env changes — now unnecessary because the card reacts internally). `envMode` + `ovenStatus` passed to both SocialSyncCard and SocialTriangleCard. `pulsePost` now calls `generateStrategy` with env/oven so the fallback draft reflects the cockpit's current real-world pulse. `handleDeploy` extended to `(post, stagedImage?)` — the confirmation toast says "Post + image live on your Google profile" when the image hitched. `SurgicalLaunch` gets the image stack.
    - **Why it matters for the demo:** the "Pulse" and "Triangle" used to show raw social content and call the output a "Google post" — they were *rehosting*, not *re-contextualising*. v1.5 turns the translation into a narratable pipeline the owner can see ("we stripped 3 social-only tokens, tilted to product intent, injected the rain signal, anchored to BN1"), adds a tone they can twist in real time (Direct / Story / Offer), and catches the single moment where social→SEO syndication matters most: a viral post's first 24h. That's the "Signal-to-SEO" arc: three noisy social channels → one clean Google surface, with a live reason for every character.

- **v1.7 — End-to-end live data: real business, real rank, real review, real topic:**
    - **New `/api/business` route.** Consolidated the owner's own Google Business Profile lookup into a single round-trip: `POST { name, postcode }` → SearchAPI `google_maps` (resolves `place_id`, canonical name, aggregate `rating`, `reviews` count, street address, coordinates) → `google_maps_reviews` (latest review row) → authored suggested-response draft that echoes a salient keyword from the review text (e.g. carrot cake, service, sourdough). Verified end-to-end against "The Flour Pot Bakery — Sydney Street" in BN1 4EN: returned canonical name, `4.5★ / 726 reviews`, lat/lng `50.8272 / -0.1378`, `place_id: ChIJ91ilgXWFdUgRrrxXiQFb70w`, a real 5-star review from Kat about carrot cake + coffee, and a Sentence Case response that picks up "cake" as the echo token. Mock fallback mirrors the contract for offline / demo mode.
    - **`/api/maps` now surfaces the full profile envelope.** The top local result's `type` (Google category label, e.g. `"Bakery"`), `place_id`, aggregate `rating`, and `reviews` count are now part of the response payload — drives business-type inference downstream so the cockpit stops hardcoding `bakery` in every scrape query.
    - **Onboarding resolves the business in parallel with the Maps pin.** A URL-derived name-seed (`flourpot.co.uk` → `flourpot`) plus the user's postcode goes into `/api/business` alongside the existing `/api/maps` call — both fire in parallel so discovery step 1 stays <1.2s. Also computes the owner's **own rank** by matching the canonical business name against the scraped local pack (punctuation + casing tolerant, bi-directional substring match), so the cockpit lands with a real `#3 / 20` instead of a constant `#3 / 6`. Adds three small helpers local to onboarding (`deriveNameSeed`, `extractStreet`, `inferBusinessType`, `findOwnRank`) — documented inline.
    - **Business-type now drives every downstream query.** The `bakery` hardcode is dead: `/api/scrape` uses `businessType: mapsResult.topResultType ?? nameSeed ?? "local business"`, `/api/search` uses `"best {businessType} {postcode}"`, and `SocialTriangleCard`'s rescan accepts a new `businessQuery` prop that replaces the legacy `bakery ${postcode}` seed. Closes the v1.5 backlog item "business-type picker so the Pilot scrapes any vertical".
    - **Dashboard rebuilt around real signals.** Killed `FALLBACK_COMPETITORS`, the literal `92`, `rank={3}`, `totalRivals={competitors.length + 2}`, `activeEvents={3}`, `rating={4.9}`, `Sarah M.`, `Brighton Pride`, `artisan sourdough`, and the `flourpot`-URL special case. Every one of those is now computed:
        - `businessName`, `street`, `rating`, `totalReviews`, `latestReview`, `suggestedResponse`, `ownRank` — from `businessMeta` returned by onboarding.
        - `freshnessScore` (the `/100`) + `vitality` chips — computed from a weighted real-signals sum: `social_pulse` (35%) from `calculateFreshnessLeader()` on the onboarded socials, `review_velocity` (30%) from rating × `min(1, reviews/100)`, `technical_seo` (35%) from the SEO Shaper applied-state. Maps to `active / warm / stale`, `high / medium / low`, `fresh / stale`.
        - `lastSync` — `formatAge()` on the freshest social's timestamp.
        - `activeEvents` — `1` if the SERP surfaced an event signal, else `0`.
        - Authority Lab `topic` + `draftPreview` — picked from `/api/search` related-searches with a three-tier fallback (local+typed → typed → first related). Draft is a generic vertical-aware template (no more Sydney Street sourdough copy for a coffee shop).
        - SEO Shaper `targetKeyword` — shortest related-search that mentions the locality. Tweaks are generated per session: the "category" tweak rewords to reference the live spiking topic when available ("Align GBP category to \"{topic}\"") and falls back to a generic category review otherwise.
        - Community Hijack `featuredEvent` — extracted from SERP related-searches via an event-keyword scan (`festival`, `market`, `pride`, `fringe`, `parade`, etc.). When no event signal surfaces, the card falls back to the neighbourhood's top related search framed as "Locals are searching '{x}' right now" — real intent, not a fictional festival.
        - Community Hijack / Authority Lab / SEO Shaper copy — interpolated with `businessType` + live `street` so a coffee shop in BN2 doesn't read like a bakery in BN1.
    - **New live SERP insights fetch.** `Dashboard` runs one `/api/search` request on cockpit mount (guarded by a `useRef` so Strict Mode doesn't double-bill the engine) with `"best {businessType} {postcode}"`; populates `insights.topic`, `insights.keyword`, `insights.peopleAlsoAsk`, `insights.relatedSearches`, `insights.event`, and `insights.isLive`. Feeds Authority Lab / SEO Shaper / Community Hijack simultaneously — one call replaces three separate mock constants.
    - **`PilotStatusBar` + `CompetitorRadarCard` now accept `rank: number | null` and `totalRivals: number | null`.** Nullable means "scrape hasn't resolved yet" — both cells render `—` with a `resolving rank in BN1…` sub-copy instead of faking a position. Also added `warm` + `medium` to `VitalityLevel` so the new signal gradations (social_pulse ∈ {active, warm, stale}, review_velocity ∈ {high, medium, low}) have distinct dot colours.
    - **`CompetitorRadarCard` `isLive` check fixed.** Was inferring live mode from `data.totalFound > 5`, which stamped every demo session "live" because the mock fallback returned exactly 5 rivals. Now trusts the route's explicit `isLive: boolean` flag, with the old heuristic kept as a fallback only for cached responses predating v1.4.
    - **`EnvironmentWedge` anchors to the real street + postcode area.** Gained `postcodeArea` + `street` props; the compound `oven hot + rain` line interpolates the live values ("warm bread and a dry seat on 40 sydney st, bn1.") instead of the Sydney Street seed. Falls back to the seed copy only when businessMeta hasn't resolved yet.
    - **Async prop sync on `SocialSyncCard` + `ReviewBoosterCard`.** Both cards captured their seed into local state on mount and never updated when the parent prop changed. Added guarded `useEffect` sync: Sync the prop into state whenever the owner isn't actively editing (and, on the Pulse, whenever a live IG caption isn't already driving the strategy pipeline). So when `/api/business` resolves the owner's actual latest Google review 1.5s into the session, the Booster card swaps in the real review + response draft without a remount.
    - **Why it matters for the demo:** Pre-v1.7 the cockpit showed a mix of live social data and hardcoded `4.9 / Sarah M. / Brighton Pride / 92` demo fodder — enough to fake it, but every seasoned eye spotted the literals. v1.7 closes that gap: the business name, rating, review, rank, keyword, topic, event, and the `/100` score itself all compute from real SearchAPI responses. The Pilot's narrative is now provably grounded — when you point at a number on the grid, there's an engine behind it.

- **v1.2.1 — Dev-overlay noise fix (sync-dynamic-apis):**
    - Next.js 16's dev indicator (`<nextjs-portal>`) was reporting a growing error count (1,943 and climbing) driven by `params are being enumerated. params is a Promise…` and `The keys of searchParams were accessed directly…` warnings every time the Cursor IDE element inspector mouseover-enumerated React page props. The proxies originated from Next.js 16's async dynamic APIs injected at the page boundary of our `"use client"` root page.
    - Refactored `app/page.tsx` into a thin **server-component wrapper** that consumes both proxies at the boundary (`await params; await searchParams`) before rendering the client dashboard. Moved the full cockpit implementation into `components/dashboard.tsx` (still `"use client"`, exports named `Dashboard`). When inspectors now walk the page props they walk resolved plain objects rather than the Promise proxy's `ownKeys` trap, so the warning stream stops.
    - Verified: a fresh `GET /` after the refactor produces **zero** new `sync-dynamic-apis` warnings (previously one-to-many per mousemove). No runtime behaviour change — the dashboard renders identically, but the dev-tools overlay no longer shows a spurious error count.

- **v1.8 — Live weather feed for Environment Pilot + settings panel:**
    - **New `/api/weather` route** (`app/api/weather/route.ts`) wired to WeatherAPI current conditions. `POST { postcode }` returns `{ condition, tempC, mode, isLive }`, where `mode` is derived from condition text (`rain/drizzle/shower/thunder` → `rain`, else `sun`). Route falls back to a deterministic demo payload when `WEATHERAPI_API_KEY` is unset, preserving the offline demo story.
    - **EnvironmentWedge now consumes live weather state.** The wedge no longer relies solely on static scenario labels for condition/temp; it renders WeatherAPI `condition + tempC` and builds postcode-aware messaging (`it's {condition} in {postcodeArea}...`) while keeping the existing tap-to-cycle behavior and the `oven HOT + rain` compound override.
    - **Dashboard weather orchestration.** Added a one-shot weather fetch on cockpit mount keyed by onboarded postcode. The returned mode seeds initial environment intent, then owners can still cycle scenarios manually.
    - **Settings UX shipped.** Header now has a circular icon-only settings button beside theme toggle. Settings panel includes editable onboarding inputs (URL, postcode, IG, TikTok, Facebook), save/cancel behavior, a deep-link into the full onboarding questionnaire, and a destructive app reset action that clears persisted pilot session + form inputs.
    - **WeatherAPI env docs added** in `.env.local.example` via `WEATHERAPI_API_KEY`.
    - **Ref:** [WeatherAPI](https://www.weatherapi.com/my/)

---

## 13. Backlog / candidate next drops

- Per-vertical intent-hook tables in `lib/strategy.ts` — the 4-layer strategy still leans on bakery-flavoured hooks (`sourdough`, `croissants`, `cinnamon`). Split `PRODUCT_HOOKS` / `EVENT_HOOKS` / `VIBE_HOOKS` by business-type family (food & drink, beauty, retail, service) and pick the right table from `businessMeta.businessType` resolved in v1.7.
- Real per-handle viral baselines (currently a platform-wide heuristic in `detectViral()`): cache a 14-day rolling engagement average per handle so the 5× trigger reflects *this* business's normal, not the platform median.
- Render the Triangle's Maps pin as an actual embedded mini-map (static image or interactive `leaflet`/`mapbox` tile) instead of the current coordinate-only summary.
- Persist deployment history so the header counter isn't lost on refresh.
- Expand weather handling beyond current conditions: hourly forecasts, precipitation probability bands, and business-type-specific intent heuristics layered over the new WeatherAPI feed.
- Dedicated event calendar scrape for The Hijack — v1.7 extracts event signals from SERP related-searches (keyword scan for `festival`/`market`/`pride`/`fringe`), but a dedicated engine (Eventbrite, Facebook Events, or ticketmaster) would give us real dates + days-away rather than the "~14 days" placeholder.
- `Vercel Analytics` wired in prod.
- Export the cockpit as a PDF "Pilot report" for owner hand-off.
