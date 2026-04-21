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

### generateStrategy()
Pure function in `lib/strategy.ts`. Converts a raw social caption into a postcode-anchored Google Post:

```ts
generateStrategy({
  caption: "New sourdough out of the oven!",
  postcode: "BN1 4EN",
  street: "Sydney Street",
})
// → { optimized_post: "Fresh artisan sourdough available today on Sydney Street, BN1.", ... }
```

Uses intent hooks (sourdough / croissant / coffee / cake / brunch), stopword filtering, and postcode-area normalisation.

---

## 7. API Routes — three live engines

All routes fall back to curated demo data when `SEARCHAPI_API_KEY` is unset. When the key is present, every live/demo chip across the cockpit flips green simultaneously.

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
    ├── instagram/route.ts    # instagram_profile → The Pulse
    └── reviews/route.ts      # google_maps + google_maps_reviews → The Battle expansion

components/
├── dashboard.tsx             # Full cockpit (v1.2.1 — moved from app/page.tsx)
├── onboarding.tsx            # 5-step calibration + scrape animation
├── pilot-status-bar.tsx      # 01 · col 12
├── environment-wedge.tsx     # Contextual atmosphere sensor
├── oven-status-toggle.tsx    # Header oven toggle
├── social-sync-card.tsx      # 02 · The Pulse (mint)
├── review-booster-card.tsx   # 03 · The Booster (lemon)
├── community-hijack-card.tsx # 04 · The Hijack (sky)
├── authority-lab-card.tsx    # 05 · The Lab (lavender)
├── competitor-radar-card.tsx # 06 · The Battle (coral)
├── seo-shaper-card.tsx       # 07 · The Shaper (coral, col-12)
├── pilot-info.tsx            # Reusable "intelligence" popover (every card)
├── surgical-launch.tsx       # Master col-12 CTA
└── ui/                       # shadcn primitives (button, spinner, sonner…)

lib/
├── strategy.ts               # generateStrategy()
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
- **v1.2.1 — Dev-overlay noise fix (sync-dynamic-apis):**
    - Next.js 16's dev indicator (`<nextjs-portal>`) was reporting a growing error count (1,943 and climbing) driven by `params are being enumerated. params is a Promise…` and `The keys of searchParams were accessed directly…` warnings every time the Cursor IDE element inspector mouseover-enumerated React page props. The proxies originated from Next.js 16's async dynamic APIs injected at the page boundary of our `"use client"` root page.
    - Refactored `app/page.tsx` into a thin **server-component wrapper** that consumes both proxies at the boundary (`await params; await searchParams`) before rendering the client dashboard. Moved the full cockpit implementation into `components/dashboard.tsx` (still `"use client"`, exports named `Dashboard`). When inspectors now walk the page props they walk resolved plain objects rather than the Promise proxy's `ownKeys` trap, so the warning stream stops.
    - Verified: a fresh `GET /` after the refactor produces **zero** new `sync-dynamic-apis` warnings (previously one-to-many per mousemove). No runtime behaviour change — the dashboard renders identically, but the dev-tools overlay no longer shows a spurious error count.

---

## 13. Backlog / candidate next drops

- Business-type picker in onboarding so the Pilot scrapes any vertical (currently hardcoded `bakery`).
- TikTok + Facebook engines alongside Instagram when SearchAPI adds coverage.
- Persist deployment history so the header counter isn't lost on refresh.
- Real weather via `/api/environment` (Open-Meteo or similar) instead of the 3-scenario cycle.
- Event calendar scrape for The Hijack (currently hardcoded Brighton Pride).
- `Vercel Analytics` wired in prod.
- Export the cockpit as a PDF "Pilot report" for owner hand-off.
