# Haraya: Davao Specialty Coffee and Bean Archive

Local Roasts. Your Cup. Haraya is the coffee sibling of [Habi](../Habi) (Davao Local Fashion
Archive): a discovery platform for Davao Region micro-roasteries, specialty cafes, fresh
single-origin bean drops, curated coffee crawls, and a Cup Check community. The two platforms
share the same cream-obsidian design DNA and are bridged by an ecosystem switcher in the
navigation header.

## Stack

React 19 + TypeScript + Vite, Tailwind CSS v4 (via `@tailwindcss/vite`), Leaflet for the
coffee map, lucide-react for icons. State uses a reactive subscriber service pattern
(`catalogService`, `userPrefsService`, `roasterService`) consumed through `useSyncExternalStore`
hooks. The blueprint's React 18 baseline is delivered on React 19, the same runtime the Habi
sibling ships on, for identical API surface and behavior parity.

## Run

```bash
npm install
npm run dev        # http://127.0.0.1:5174
npm run build      # typecheck + production build
npm run lint       # oxlint
npm run preview    # serve the production build
```

## Scripts

- `npm run map:code` regenerates `docs/CODE_MAP.md` (the agent navigation map; never hand-edit).
- `npm run map:code:check` exits non-zero when the committed map no longer matches the source.
- `npm run lint` runs oxlint across `src/`.

## Data

There is no bundled dataset. The demo cafes, beans, drops, trails and Cup Check posts were
removed on 2026-09-28, so the catalog holds only listings created through the Roaster Suite.
Those records, saves, ratings and posts are currently stored in `localStorage`, which means
they live in one browser only; moving the catalog to Supabase is what makes listings visible
to every visitor. Curated trails are defined in `src/data/trails.ts` (empty until real ones
are added).

## Ecosystem bridge

The header switcher links between Haraya (coffee) and Habi (fashion). The Habi target URL is
a single constant in `src/config/ecosystem.ts`; update it there when Habi's production URL is
final. Supabase settings live in `.env.local` (gitignored; copy `.env.example`). Server-only
secrets such as the Aya DeepSeek key belong in Vercel environment variables, never in `VITE_*`.

## Structure

See `docs/CODE_MAP.md` for the generated, per-file navigation map. High level:

```
src/
  components/   feed, cafe, drops, map, community, saved, roaster, auth, admin, layout, common
  data/         trails.ts (curated trails, empty until real ones are added)
  services/     catalogService, userPrefsService, roasterService, communityService, authService
  types/        coffee.ts, auth.ts
  utils/        router.ts (hash routes), calendar.ts (.ics + open hours), geo.ts (distances)
```
