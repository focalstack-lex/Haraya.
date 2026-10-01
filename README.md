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

## Installable app

Haraya is an installable PWA (manifest plus an app-shell service worker via `vite-plugin-pwa`). The service worker
only exists in builds, so test it with `npm run build && npm run preview`; `npm run dev` registers no service
worker. Aya offers the install after the first finished tour on phones and tablets, and Profile has an "Add Haraya
to your home screen" row.

## Scripts

- `npm run map:code` regenerates `docs/CODE_MAP.md` (the agent navigation map; never hand-edit).
- `npm run map:code:check` exits non-zero when the committed map no longer matches the source.
- `npm run lint` runs oxlint across `src/`.

## Data

Haraya is a Davao coffee and study spot guide (discovery pivot, 2026-09-29). There is no
bundled dataset. Places come from two sources:

- **Add a Spot**: signed-in visitors submit spots to the Supabase table `spot_submissions`
  (`supabase/migrations/20260929000000_spot_submissions.sql`), an admin approves them, and
  approved spots appear for everyone (`src/services/spotService.ts`).
- **Place Portal** (`#/tab/portal`): a cafe or study-spot owner applies with a permit number
  (`place_applications`); an admin approves it, which creates the public `cafes` row, marks it
  verified and makes the applicant its owner, who then edits hours, amenities, menu and the
  rest from the portal (`src/services/placeService.ts`, migration
  `20260929020000_accounts_and_place_portal.sql`).

Saves, ratings and lists stay in `localStorage`. Roast drops, beans, the Roaster Suite and Cup
Check are hidden from navigation; their code is kept. Curated trails are defined in
`src/data/trails.ts` (empty until real ones are added).

## Accounts

Sign-in is Supabase Auth (`src/services/sessionService.ts`): email and password, a one-time
email link, or a password reset link. Every user gets a row in `profiles` with a role: `guest`
(any member), `roaster` (approved place owner) or `admin`. The role is never writable from the
app; the first admin is granted in the SQL editor (see the comment at the end of
`20260928230000_fix_rls_privilege_escalation.sql`), and admins can then change other roles from
the Control Room (`#/tab/admin`), which also holds the spot and place review queues, the listed
places with their verified badge, and the account list. Row Level Security and
`security definer` functions in the migrations enforce all of this server side.

Before any of this works in production: apply the migrations (`supabase db push`), add the
site's URL to Supabase Auth redirect URLs (email links land on `/` with `?code=`), and decide
whether new password sign-ups must confirm their email (Supabase Auth setting; the app handles
both).

## Control Room, moderation and account tools

Added 2026-09-30 by `supabase/migrations/20260930020000_admin_tools_moderation_accounts.sql`. Until that
migration is applied the app keeps working as before and these tools say they are waiting for it.

- **Places** (`#/tab/admin`, Places): add a place, import many from a CSV sheet (`src/services/placeImport.ts`),
  edit any listing with the owner's editor, verify it, hide it or mark it closed for good.
- **Reports**: visitors report a spot, a check-in or a review from the spot page; admins resolve or dismiss, and
  can remove a check-in or review. Restricting an account (Users) stops it from posting anywhere.
- **Health**: error reports from visitors' browsers, anonymous usage counts (searches with no results, empty
  cities, pages opened) and the audit log of admin actions. All kept in Haraya's own database
  (`src/services/telemetry.ts`); no outside tracker.
- **Accounts**: saved spots follow the account, reviews are public, the Passport shows updates (a reviewed spot,
  a closed report, a Cup Clink), and Your data offers a download and account deletion.
- **Place owners**: photos (Supabase Storage bucket `place-photos`), an announcement, and listing numbers.

`.github/workflows/ci.yml` runs lint, the code map check, tests, the dependency audit and the build on every push
and pull request.

## Soft launch (pre-registration)

Until launch the app is closed: every visitor except admins sees the pre-registration page
(`src/views/PreRegistrationView.tsx`), can create an account, and sees the early coffee offer: 3 of the first 30
confirmed accounts will have the opportunity of a coffee at a selected coffee shop, to be announced. The order comes
from `early_registration_status()` in `supabase/migrations/20261001020000_early_registration_30_slots.sql`. To open the app, set `VITE_LAUNCH_MODE=open`
in the Vercel environment and redeploy.

## Ecosystem bridge

The header switcher links between Haraya (coffee) and Habi (fashion). The Habi target URL is
a single constant in `src/config/ecosystem.ts`; update it there when Habi's production URL is
final. Supabase settings live in `.env.local` (gitignored; copy `.env.example`). Server-only
secrets such as the Aya DeepSeek key belong in Vercel environment variables, never in `VITE_*`.

## Structure

See `docs/CODE_MAP.md` for the generated, per-file navigation map. High level:

```
src/
  components/   feed, cafe, map (live navigation), community, layout, common, admin (Control Room); drops, roaster kept
  data/         trails.ts (curated trails, empty until real ones are added)
  services/     sessionService (accounts), spotService + spotMapping (Add a Spot), placeService + placeMapping
                (Place Portal, listings), adminService (roles), catalogService, userPrefsService, others kept
  views/        LoginView, PlacePortalView, AddSpotView, ProfileView, LegalView, SharedListView
  types/        coffee.ts, auth.ts
  utils/        router.ts (hash routes), calendar.ts (.ics + open hours), geo.ts (distances)
```
