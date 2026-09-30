# Haraya audit: first-time user journey plus system health

Date: 2026-09-30. Commit be3caca. Read-only: no source changed.
Method: drove the dev build (port 5174) as a new, signed-out phone user (375x812), plus
build, lint, tests, dependency audit and a code/SQL security review.

## Health checks (real output)

- `npm run build`: passes. One warning: main JS chunk 1,071 kB (308 kB gzip), no code splitting.
- `npm run lint` (oxlint): clean.
- `npm test`: 415 passed.
- `npm audit`: 0 vulnerabilities.
- `npm run map:code:check`: CODE_MAP.md is current.
- Console errors during the whole drive: none.

## P0: blocks trust or safety

1. **Live database may still run the unsafe first schema.** `20260930000000_profile_on_signup.sql:3-4`
   notes earlier migrations were not applied to production. If `20260928230000_fix_rls_privilege_escalation.sql`
   is missing live, `20260928000000_init_haraya_schema.sql:143` lets any user set their own
   `role='admin'`, and `:151-152` lets any roaster edit any cafe. Confirm with `supabase migration list`.
2. **The promise does not match the content.** The landing page sells "Davao Region" and lists six
   cities; every one of the 10 listed spots is in Digos City. Choosing Davao City in Discover gives
   "0 spots". Tagum, Panabo, Mati and Samal are the same. A Davao City visitor bounces on first try.

## P1: breaks a journey

3. **Sheets survive navigation.** Open a spot, tap Check in, then switch tab (tab bar or URL): the
   spot closes but the Mood sheet and Check-in sheet stay stacked over Map and Add a Spot. Only a
   reload clears them.
4. **Fake distances without location.** With location off, the mood picker ranks by distance from a
   "Davao Region center" and labels picks "Closest", "697 m, about 15 min walk". The number is
   meaningless to the user and reads as real (`MoodFinderSheet.tsx:107`, `:157`).
5. **Check-in "verified" distance is client-supplied.** `sanctuary_visits.sql:230-232` lets the client
   write `verified_distance_meters`; the trigger (`:74-89`) never recomputes it from coordinates. Anyone
   can stamp any cafe from home (6 per day).
6. **Empty results have no way forward.** "No spots match" suggests "clear a filter" even when no filter is on
   and offers no "Add this spot" action, although adding spots is the growth loop.

## P2: friction and polish

7. Search is literal: "Davao City wifi" returns nothing; area plus amenity terms are not combined.
8. Mood result card prints an empty "Try:" when a spot has no signature drink (`MoodResultCard.tsx:62`).
9. Two of ten spots show "Hours not listed" and only one shows a price level, so the "Open now,
   honestly" and price filters work on thin data.
10. Map opens centered on Davao City while all pins sit at the bottom-left edge (Digos); it should fit
    the visible pins.
11. The first-visit tour is 7 steps and covers the search bar the user just came to use.
12. `#/tab/passport` does not route; the Passport tab is `#/tab/profile`. Shared links will guess wrong.
13. 1 MB single JS bundle; Leaflet and the admin and portal surfaces could load on demand for phone data plans.
14. No rate limit on `cup_clinks` (clink/unclink loop), and `user_id` of clinks is readable by anon
    (`sanctuary_visits.sql:236`).
15. Cached spots and places are `JSON.parse`d without shape checks (`spotService.ts:41`,
    `placeService.ts:42`); image uploads store up to 3 MB dataURLs in localStorage (`ImageUploadField.tsx:27`).

## P3

16. Silent catches in `sessionService.ts:28, :57, :119, :150`.
17. Auth redirect trusts any `*.vercel.app` origin (`sessionService.ts:147`); relies on the Supabase allowlist.
18. HSTS has no `preload`.

## What works well

Landing copy is concrete and honest in tone; spot detail is rich (gallery, live hours, address,
directions); location-denied states explain the fix per device; security definer functions all pin
`search_path`; strict CSP and headers in `vercel.json`; no secrets tracked.

## Suggested fix order

P0.1 verify migrations, P0.2 content (seed Davao City or scope the copy and city list to what exists),
then P1.3 sheet reset on route change, P1.4 honest distance labels, P1.6 empty-state CTA, P1.5 server-side
distance check.

## Fix status (2026-09-30, 17:05)

Fixed in code: 3, 4, 6, 7, 8, 10, 12, 13 (partly: 1,071 kB to 838 kB), 15 (cache shape checks only).
Written but not applied: 5 and 14, in `supabase/migrations/20260930010000_verify_visit_distance.sql`.
Softened, not solved: 2. Cities now show their spot counts and an empty city offers Add a Spot; real spots outside Digos still have to be added.
Open: 1 (needs the linked Supabase CLI or the dashboard), 9, 11, 16, 17, 18, and the 3 MB image limit in 15.
