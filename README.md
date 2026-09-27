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

All content is a rich mock dataset centered on authentic Davao Region geography
(`src/data/`): cafes and roasteries across Poblacion, Bajada, Juna Subd, Lanang, Matina,
Toril, Tagum, Digos, Panabo, Mati, and the Mt. Apo highlands. Roaster-created records are
merged from `localStorage` on top of the seed, so the Roaster Suite works end to end in the
browser without a server.

## Ecosystem bridge

The header switcher links between Haraya (coffee) and Habi (fashion). The Habi target URL is
a single constant in `src/config/ecosystem.ts`; update it there when Habi's production URL is
final. No credentials or secrets exist in this project, so there is no `.env`.

## Structure

See `docs/CODE_MAP.md` for the generated, per-file navigation map. High level:

```
src/
  components/   feed, cafe, drops, map, community, saved, roaster, auth, admin, layout, common
  data/         mockCafes, mockBeans, mockDrops, mockTrails, mockPosts
  services/     catalogService, userPrefsService, roasterService, communityService, authService
  types/        coffee.ts, auth.ts
  utils/        router.ts (hash routes), calendar.ts (.ics + open hours), geo.ts (distances)
```
