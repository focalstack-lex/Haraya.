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

Haraya is a Davao coffee and study spot guide (discovery pivot, 2026-09-29). There is no
bundled dataset. Places come from Add a Spot: signed-in visitors submit spots to the Supabase
table `spot_submissions` (`supabase/migrations/20260929000000_spot_submissions.sql`), an admin
approves them, and approved spots appear for everyone (`src/services/spotService.ts`). Saves,
ratings and lists stay in `localStorage`. Roast drops, beans, the Roaster Suite and Cup Check are
hidden from navigation; their code is kept. Curated trails are defined in `src/data/trails.ts`
(empty until real ones are added).

Before Add a Spot works in production: apply the migrations (`supabase db push`), add the
site's URL to Supabase Auth redirect URLs, and grant the first admin role in the SQL editor
(see the comment at the end of `20260928230000_fix_rls_privilege_escalation.sql`).

## Ecosystem bridge

The header switcher links between Haraya (coffee) and Habi (fashion). The Habi target URL is
a single constant in `src/config/ecosystem.ts`; update it there when Habi's production URL is
final. Supabase settings live in `.env.local` (gitignored; copy `.env.example`). Server-only
secrets such as the Aya DeepSeek key belong in Vercel environment variables, never in `VITE_*`.

## Structure

See `docs/CODE_MAP.md` for the generated, per-file navigation map. High level:

```
src/
  components/   feed, cafe, map (live navigation), community, layout, common; drops, roaster, auth, admin kept
  data/         trails.ts (curated trails, empty until real ones are added)
  services/     catalogService, spotService + spotMapping (Add a Spot), userPrefsService, authService, others kept
  types/        coffee.ts, auth.ts
  utils/        router.ts (hash routes), calendar.ts (.ics + open hours), geo.ts (distances)
```
