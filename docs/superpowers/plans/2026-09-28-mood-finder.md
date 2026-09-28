# Mood Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a visitor pick a mood and must-haves (or type them), get three explained cafe picks ranked by fit and distance, and open a route to one on the Coffee Map.

**Architecture:** Pure logic (`moods.ts`, `parseQuery.ts`, `scoreCafes.ts`) is unit-tested with Vitest and knows nothing about React. Thin adapters (`useLocation.ts`, `weather.ts`, `moodStorage.ts`) wrap browser APIs with safe fallbacks. UI (`MoodCard`, `MoodFinderSheet`, `MoodResultCard`) renders results; App owns sheet state and the map hand-off; `DavaoCoffeeMap` gains optional `focusCafeId` and `origin`.

**Tech Stack:** React 19, TypeScript 6, Tailwind v4, framer-motion, Leaflet, Vitest (new, dev only), Playwright (existing outside the repo, for the drive).

Spec: `docs/superpowers/specs/2026-09-28-mood-finder-design.md`.

## Global Constraints

- Ranking uses only catalog data; nothing may produce a cafe that is not in `catalogService.getCafes()`.
- Wi-Fi must-have means `wifiMbps >= 25`. Focused drops cafes with under 120 minutes open left.
- Score weights: mood 45, distance 25 (full at 0.5 km or less, 0 at 15 km), hours 10 (full at 240 min), weather 10, similarity 10.
- Walk time: existing `walkMinutes(km * 1.3)` from `src/utils/geo.ts`.
- Location is requested only on tap, never persisted or sent. Weather uses fixed Davao coordinates (7.07, 125.61).
- Storage keys `haraya_mood_prefs`; every localStorage access in try/catch.
- House style: no emoji, no em or en dashes, sentence-case copy, 44px touch targets, DESIGN.md tokens.
- Vitest is a dev dependency only; `npm test` runs `vitest run`.

---

### Task 1: Test runner and hours helper

**Files:**
- Modify: `package.json` (devDependency `vitest`, script `"test": "vitest run"`)
- Modify: `src/utils/calendar.ts` (add `minutesUntilClose`)
- Test: `src/utils/calendar.test.ts`

**Interfaces:**
- Produces: `minutesUntilClose(hours: WeeklyHours, now?: Date): number` returns minutes until today's close, counting overnight windows; 0 when closed.

- [ ] Step 1: `npm i -D vitest`, add the `test` script.
- [ ] Step 2: Write failing tests: open 07:00-22:00 at 20:30 gives 90; closed day gives 0; 18:00-01:00 at 23:00 gives 120; at 00:30 (next day, previous window) gives 30; before opening gives 0.
- [ ] Step 3: `npm test` fails (function missing). Implement using the existing private `toMinutes` and `WEEKDAYS`.
- [ ] Step 4: `npm test` passes.

### Task 2: Mood data and query parser

**Files:**
- Create: `src/components/moodFinder/moods.ts`, `src/components/moodFinder/parseQuery.ts`
- Test: `src/components/moodFinder/parseQuery.test.ts`

**Interfaces:**
- Produces:
  - `type MoodId = 'focused' | 'cozy' | 'social' | 'treat' | 'quick' | 'explore'`
  - `type MustHaveId = 'pets' | 'wifi' | 'quiet' | 'plugs' | 'aircon' | 'outdoor' | 'openNow' | 'pourOver' | 'oatMilk'`
  - `interface MoodRequest { mood: MoodId | null; mustHaves: MustHaveId[]; maxPrice: 1 | 2 | 3 | null; district: District | null }`
  - `MOODS: { id: MoodId; label: string }[]`, `MUST_HAVES: { id: MustHaveId; label: string }[]`
  - `parseQuery(text: string): Partial<MoodRequest>` and `interpretRequest(text: string): Promise<Partial<MoodRequest>>` (the AI seam; wraps `parseQuery` today)

- [ ] Step 1: Failing tests: "quiet place to study with wifi" gives mood focused, must-haves quiet and wifi; "coffee with my dog near Matina" gives pets and district Matina; "cheap cup with the barkada" gives social and maxPrice 1; "not too pricey" gives maxPrice 2; "Quick coffee" is case-insensitive; "studying" does not match inside other words but "study" in "study session" does; empty and unrelated text gives `{}`.
- [ ] Step 2: Run, see failures. Implement phrase tables with word-boundary regexes; district names from `DAVAO_DISTRICTS`.
- [ ] Step 3: Tests pass.

### Task 3: Ranking

**Files:**
- Create: `src/components/moodFinder/scoreCafes.ts`
- Test: `src/components/moodFinder/scoreCafes.test.ts`

**Interfaces:**
- Consumes: `MoodRequest`, `minutesUntilClose`, `isOpenNow`, `distanceKm`, `walkMinutes`.
- Produces:
  - `interface Weather { rainy: boolean; hot: boolean; summary: string }`
  - `interface ScoreContext { origin: GeoPoint; now: Date; weather: Weather | null; savedIds: string[]; recentIds: string[] }`
  - `interface Match { cafe: Cafe; score: number; km: number; walkMin: number; minutesLeft: number; closesAt: string | null; reasons: string[]; drink: string }`
  - `interface MoodResult { matches: Match[]; picks: { label: 'Best match' | 'Closest' | 'Wildcard'; match: Match }[]; relax: { mustHave: MustHaveId; count: number } | null }`
  - `scoreCafes(cafes: Cafe[], request: MoodRequest, ctx: ScoreContext): MoodResult`

- [ ] Step 1: Failing tests with a small fixture of cafes: a must-have excludes cafes lacking it; Wi-Fi threshold 25 excludes 22 Mbps; focused excludes a cafe closing in 90 minutes; picks never repeat a cafe; Closest is the nearest non-best match; Wildcard avoids recent ids; maxPrice and district filter; reasons contain "Wi-Fi" text with the Mbps figure; drink falls back to `cafe.signature`; empty result returns the must-have whose removal yields the most matches.
- [ ] Step 2: Run, see failures. Implement per the spec ranking section.
- [ ] Step 3: Tests pass.

### Task 4: Browser adapters

**Files:**
- Create: `src/components/moodFinder/useLocation.ts`, `src/components/moodFinder/weather.ts`, `src/components/moodFinder/moodStorage.ts`

**Interfaces:**
- Produces:
  - `useLocation(): { position: GeoPoint | null; status: 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable'; request: () => void }`
  - `fetchWeather(): Promise<Weather | null>` (30 minute in-memory cache; `console.warn` once on failure)
  - `loadMoodPrefs(): MustHaveId[]`, `saveMoodPrefs(ids: MustHaveId[]): void`

- [ ] Step 1: Implement; verified in Task 6 by the browser drive (geolocation granted and denied, weather blocked).

### Task 5: Sheet, card, results and App wiring

**Files:**
- Create: `src/components/moodFinder/MoodCard.tsx`, `src/components/moodFinder/MoodFinderSheet.tsx`, `src/components/moodFinder/MoodResultCard.tsx`
- Modify: `src/App.tsx` (sheet state, render `MoodCard` under the Discover search field, `openRoute(cafeId, origin)`), `src/components/map/DavaoCoffeeMap.tsx` (optional `focusCafeId`, `origin`, route layer), `src/components/layout/BottomTabBar.tsx` (hidden while the sheet is open is handled by App's `isHidden`)

**Interfaces:**
- Consumes: everything above; `Modal`, `ModalHeader`, `Chip`, `PrimaryButton` from FormControls.
- Produces: `MoodFinderSheet` props `{ isOpen; initialMood: MoodId | null; cafes: Cafe[]; cityOrigin: GeoPoint; cityLabel: string; savedIds: string[]; recentIds: string[]; onClose; onOpenCafe(id); onToggleSave(cafe); onRoute(cafe: Cafe, origin: GeoPoint | null) }`; `DavaoCoffeeMap` props gain `routeCafe?: Cafe | null; origin?: GeoPoint | null; onClearRoute?: () => void` (the cafe object rather than an id, so a route works even when the map's city filter hides that cafe).

- [ ] Step 1: Build the UI per the spec (entry card, mood chips, must-have chips, text box with interpreted chips, Near me, weather line, three pick cards, Surprise me, Show all, relax empty state).
- [ ] Step 2: Map route layer: "You" dot, dashed line, fit bounds, a route card with walk estimate and "Open in Google Maps".
- [ ] Step 3: `tsc -b`, `oxlint`.

### Task 6: Verification and records

- [ ] Step 1: Playwright drive at 375 px and 1440 px (chip opens results; typed query lights chips; granted and denied geolocation; weather blocked; Take me there shows the route; relax empty state; no page or console errors; no overflow).
- [ ] Step 2: `npm test`, `npm run build`, `impeccable detect`, dash scan, `npm run map:code`.
- [ ] Step 3: Evidence to `reports/ui-verification/2026-09-28-mood-finder/`, journal entry, update DESIGN.md component list.
