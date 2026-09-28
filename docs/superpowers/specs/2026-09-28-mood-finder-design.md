# Mood finder

Date: 2026-09-28. Status: design approved by Lex in conversation; this spec awaits review.
First of three sub-projects (then drop reminders with a Drops tab, then share and install), each with its own spec.

## Goal

A visitor says how they feel and what they need; Haraya suggests the best nearby cafes that fit, explains each pick
with real catalog facts, and takes them there on the Coffee Map. Built as a deterministic matcher now, with one
seam where a hosted AI model can later replace the text understanding without touching the UI or the ranking.

## Entry

- A "How are you feeling?" card on Discover, directly under the large title and search field, above the featured
  carousel. It shows the first four mood chips in a scrolling row plus "More".
- Tapping a chip opens the mood finder sheet with that mood selected and results already computed. "More" opens it
  with nothing selected.
- The sheet uses the shared `Modal` (bottom sheet on phones, card on desktop, `sm:max-w-2xl`).

## Inputs

### Moods (single choice)

| Id | Label | Favors |
| --- | --- | --- |
| `focused` | Focused | `quietFocus`, `workFriendly`, `plugs`, Wi-Fi 25 Mbps or more, at least 2 hours open left |
| `cozy` | Cozy | `quietFocus`, heritage or ancestral vibe tags, not `outdoor` |
| `social` | Social | `outdoor`, `lateNight`, price level 1 or 2 |
| `treat` | Treat myself | price level 3, `pourOverBar`, verified roasteries |
| `quick` | Quick cup | open now, shortest distance, price level 1 |
| `explore` | Explore | roasteries and verified cafes not in recent views |

### Must-haves (any number, strict filters)

| Id | Label | Rule |
| --- | --- | --- |
| `pets` | Pets | amenity `petFriendly` |
| `wifi` | Wi-Fi | `wifiMbps >= 25` |
| `quiet` | Quiet | amenity `quietFocus` |
| `plugs` | Plugs | amenity `plugs` |
| `aircon` | Air-con | amenity `aircon` |
| `outdoor` | Outdoor | amenity `outdoor` |
| `openNow` | Open now | `isOpenNow(cafe.hours)` |
| `pourOver` | Pour-over | amenity `pourOverBar` |
| `oatMilk` | Oat milk | amenity `oatMilk` |

The last used must-haves are remembered in localStorage (`haraya_mood_prefs`, guarded read and write).

### Free text

`parseQuery(text)` maps phrases to a mood, must-haves, a price ceiling and a district. Examples: "study", "work",
"thesis" to `focused`; "date", "chill", "rainy" to `cozy`; "friends", "barkada", "hang out" to `social`;
"quick", "on the way" to `quick`; "dog", "cat", "pet" to `pets`; "wifi", "internet" to `wifi`; "quiet" to `quiet`;
"cheap", "budget", "not too pricey" to price ceiling 1 or 2; any `DAVAO_DISTRICTS` name to that district.
Matching is case-insensitive on word boundaries. The chips update to show what was understood; the visitor can
change them. Unrecognized text changes nothing and shows "Tap a mood or must-have to refine."

### Location

- "Near me" requests `navigator.geolocation` only when tapped (`enableHighAccuracy: false`, 10 s timeout,
  5 min maximum age).
- Without permission or on error, distances are measured from the selected city's centroid (existing logic in
  App), and results say "Distances from {city} center".
- The position lives in component state only; it is never stored or sent anywhere.

### Weather

- One GET to Open-Meteo current weather for fixed Davao coordinates (7.07, 125.61), cached in memory for 30 minutes.
- Rain (weather codes 51 to 99) favors `cozy` and indoor; temperature 31 C or above favors `aircon`.
- Failure or offline: weather is omitted, one `console.warn`, no UI error.

## Ranking (`scoreCafes`, pure)

Input: cafes, request (mood, must-haves, price ceiling, district), origin (lat, lng), now, weather, saved ids,
recent view ids. Output: ranked matches with score, distance, minutes open left, reasons, and a suggested drink.

1. **Filter:** drop cafes failing any must-have, above the price ceiling, or outside the district when one is set.
   For `focused`, also drop cafes with under 2 hours open left today.
2. **Score (0 to 100):**
   - mood fit 45: share of the mood's favored traits the cafe has;
   - distance 25: full at 0.5 km or less, linear down to 0 at 15 km;
   - hours left 10: full at 4 hours or more;
   - weather 10: rain plus indoor or quiet, or heat plus air-con;
   - similarity 10: shares two or more amenities with a saved cafe.
   Ties break by `saveCount`.
3. **Picks:** Best match (top score), Closest (nearest among the rest), Wildcard (highest scorer not in recent
   views and not already picked). Fewer matches means fewer cards, never duplicates.
4. **Reasons:** the 2 or 3 facts that contributed most, written from data, for example "85 Mbps Wi-Fi",
   "Pet-friendly", "Open until 22:00", "1.2 km, about 20 min walk" (walk time: the existing `walkMinutes` helper on straight-line km x 1.3).
5. **What to order:** a menu item whose category fits the mood (`focused` Espresso Bar or Filter, `treat`
   Signature or Filter, `cozy` Signature, `quick` Espresso Bar, others Signature); otherwise `cafe.signature`.
6. **No results:** find the single must-have whose removal yields the most matches and return it as a relax
   suggestion: "Nothing matches Pets and Quiet. 2 cafes match without Quiet."

## Results UI

- Up to three cards labelled Best match, Closest, Wildcard: photo, name, walk time and distance, "Open until",
  reason chips, "Try: {drink}", and buttons Take me there (primary), Details, Save (bookmark with `aria-pressed`).
- Below: "Surprise me" (random match not shown) and "Show all {n} matches", which expands a compact ranked list of
  every match inside the sheet (Discover's filters cannot express Wi-Fi speed, hours left or district, so the full
  list stays in the finder).
- Weather line when known, for example "Rainy in Davao, leaning cozy and indoor."
- Empty state with the one-tap relax button.

## Take me there

- Switches to the Coffee Map tab with `routeCafe` and an optional `origin`. The map fits both points, marks the
  origin with a "You" dot, draws a dashed straight line, and shows "About 15 min walk (straight-line estimate)".
- "Open in Google Maps" uses the existing `directionsUrl` helper for turn-by-turn directions.
- `DavaoCoffeeMap` gains the optional props `routeCafe`, `origin` and `onClearRoute`; existing behavior is unchanged when absent.

## AI seam

`interpretRequest(text): Promise<Partial<MoodRequest>>` wraps `parseQuery` today. A later hosted model (Claude via a
server function that holds the key, with rate limits) implements the same signature. Ranking and reasons stay
data-driven, so a model can never add a cafe that is not in the catalog.

## Units

`src/components/moodFinder/`: `moods.ts`, `parseQuery.ts`, `scoreCafes.ts`, `useLocation.ts`, `weather.ts`,
`moodStorage.ts`, `MoodCard.tsx`, `MoodFinderSheet.tsx`, `MoodResultCard.tsx`. App owns sheet state and the
"Take me there" and "Show all" handlers.

## Testing

- Add Vitest (dev dependency only) with `npm test`. Unit tests for `parseQuery` and `scoreCafes`: phrase mapping,
  strict must-haves, Wi-Fi threshold, focused hours rule, picks never duplicate, closest is nearest, relax
  suggestion, district filter, drink fallback.
- Playwright drive at 375 px and 1440 px: chip opens sheet with results; typed query lights the right chips; granted
  and denied geolocation; weather request blocked; Take me there shows the route on the map; empty state relax.
- Gates: `tsc -b`, `oxlint`, `vite build`, `impeccable detect`, dash scan.

## Out of scope

Hosted AI model, turn-by-turn navigation inside Haraya, real road routing, and push notifications.
