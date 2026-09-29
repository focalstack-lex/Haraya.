# Haraya design system: iOS mechanics, Haraya brand

Haraya is a mobile-first web app for Davao Region specialty coffee: cafes, micro-roasteries,
single-origin beans and roast drops. The interface should feel like a native iOS app used
one-handed in a cafe, while keeping Haraya's warm linen and roasted-brown identity.
The tokens live in `src/index.css`; this file is the contract behind them.

## Principles

1. **Native mechanics, own palette.** Translucent bars, large titles, inset grouped lists,
   bottom sheets with a grabber, segmented controls and spring motion come from iOS. The
   colors come from Haraya: linen canvas, River Styx ink and Tanned Wood tint.
2. **Content first.** Photography and real catalog data carry the page. Chrome recedes
   into materials and hairlines, not borders and shadows.
3. **No invented facts.** Every badge, count and rating comes from the catalog or the
   user's own data. No "Bestseller", no review counts that do not exist, and no calls to
   action for features the app does not have (there is no ordering).

## Type

| Role | Class | Size / leading | Weight | Use |
| --- | --- | --- | --- | --- |
| Large title | `ios-large-title` | 30px / 1.1 (34px from `sm`) | 700 | One per page, top left |
| Title | `ios-title` | 21px / 1.2 | 700 | Section headers |
| Headline | `ios-headline` | 15px / 1.3 | 600 | Card and row titles |
| Body | Tailwind `text-sm` | 13-14px / 1.45 | 400 | Descriptions |
| Footnote | `ios-footnote` | 12px / 1.35 | 400 | Metadata rows |
| Caption | `ios-caption` | 11px / 1.3 | 500 | Tab labels, counts |

- UI face: the system stack (`-apple-system`, SF Pro on Apple devices). Plus Jakarta Sans is
  the fallback everywhere else. The class `font-cooper` now resolves to this display stack.
- Brand: the Haraya logo (mountain, steam and name, cut from `Haraya Files/LOGO.webp`) renders through
  `BrandLogo` from `public/brand/`. The wordmark is never retyped in a font. In the app use the default
  `wordmark` variant (mountain and name). The `full` variant carries "Find your daily cup.", which only stays
  legible at 160px tall or more, so it is reserved for large brand placements.
  App icons use the mountain mark on the logo's own peach (#FFE9CA).
- Mascot: Aya, drawn from the official master art (`Haraya Files/MASCOT/FULL BODY.png`) as flat SVG in
  `AyaMascot`, using only the master palette (roast #574835, tan #997247, cream #FFF6EE, steam #E7AC67, coffee
  #FFC183, ink #1D1203). No outlines, gradients or mouth. One pose per surface so she reads as a character, not a
  sticker: `welcome` (WelcomeModal, first tour step), `mood` (Discover mood card, a profile-style card on `--ios-surface`: title, one line and a single tint pill
  that opens the finder, no mood chips; Aya stands at the right like a portrait at 124px, clipped by the card's bottom
  edge with her ears breaking out 28px above its top, no glow, and she keeps this one pose in every card state while the copy and
  button follow real state: focus session in progress (Finish session), late evening, empty passport; tapping her
  opens the finder too; also Mood Finder idle), `empty` (cafe, bean, saved, visited and mood
  no-match empty states, Add a Spot title), `welcome` again on the live navigation arrival card; `drops` belongs to the
  hidden Roast Drops view. The sanctuary passport adds six poses, one emotion each: `focus` (calm, half-lidded
  over an open book; peeks over the floating focus banner), `arrive` (delight, both paws up with steam sparkles;
  check-in within range), `wander` (wistful, gazing up at a map pin with one ear drooped and a dotted trail;
  check-in too far away, location off), `content` (happy closed eyes and blush, cup held to her chest; finishing a
  session), `stamp` (proud, rubber stamp raised over a stamped passport page; Passport tab) and `clink` (cheerful,
  cup raised in a toast; empty Diary). Idle motion (bob, blink, steam, wave) rests under reduced
  motion. Beside text that already carries the message, pass `alt=""` so she stays decorative.
- Numbers (prices, counts, timers) use tabular figures (`font-mono` maps to the UI face with
  `tabular-nums`). No monospace costume.
- Section headers are sentence case. No uppercase tracked eyebrows above headings.

## Color

| Token | Utility | Value | Role |
| --- | --- | --- | --- |
| `--color-canvas` | `bg-canvas` | `#FAF5EB` | Canvas (grouped background) |
| `--color-surface` | `bg-surface` | `#FFFDF9` | Cards, grouped rows, sheets, the dock, text on tint |
| `--color-sunken` | `bg-sunken` | `#F2EAE0` | Pressed or recessed surface |
| `--color-hairline` | `border-hairline` | `#E4D9C8` | Solid hairline where a 0.5px separator cannot be used |
| `--color-ink` | `text-ink` | `#13191F` | Primary text |
| `--color-ink-2` | `text-ink-2` | `#594C3D` | Secondary text (7.6:1 on canvas) |
| `--color-ink-3` | `text-ink-3` | `#6E6150` | Placeholder, tertiary text, inactive tabs (at least 4.5:1) |
| `--color-tint` | `bg-tint` | `#906D4B` | Filled controls, active icons |
| `--color-tint-ink` | `text-tint-ink` | `#7D5C3D` | Tinted text and links (5.6:1 on canvas) |
| `--color-shade` | `bg-shade/20` | `#766046` | Hover and pressed fills, only with an opacity modifier |
| `--color-ok` | `text-ok` | `#3E5C48` | Open now, success |
| `--color-danger` | `text-danger` | `#8C3A2E` | Closed, destructive |
| `--color-star` | `fill-star` | `#CA9C68` | Rating stars; dots and focus rings on dark bands. Never text on light |
| `--color-steam` | `text-steam` | `#E7AC67` | Steam accent on the dark focus banner |

The tokens are one `@theme` block at the top of `src/index.css`. Components use the utilities, never raw hex.
Raw hex remains only where a class cannot reach: the Aya and logo SVG art, Leaflet pin HTML, the Google button
brand colors and the blue "You" dot. `--ios-fill` (12% shade) and `--ios-separator` stay as the resting fill
and the 0.5px separator.

Color is information. The tint marks the one active or primary thing in a region.

## Shape and depth

- Radii: `rounded-control` 10px, `rounded-row` 14px (grouped rows, inputs, notices), `rounded-card` 20px (cards and
  hero), `rounded-sheet` 28px (sheets). The segmented thumb is 8px, concentric inside its 10px track.
- Cards have no border. They sit on `--color-surface` with `ios-card-shadow` (`--shadow-card`: 0.5px contact line
  plus a soft 6px offset, 20px blur). Floating bars use `--shadow-float`, sheets `--shadow-sheet`.
- Focus on fields is `focus:focus-ring`, a 2px tint ring.
- Materials: `ios-material-bar` for the nav bar once content scrolls under it and for map overlays (78% linen, blur
  20px, saturate 180%); `ios-material-dark` for controls over photos (black 35%, blur 12px). Sheet headers and the
  tab dock are solid surface: translucent headers let tinted buttons show through while scrolling.
- Hairlines are 0.5px (`ios-hairline-b`, `ios-hairline-t`), never 1px solid borders on chrome.

## Motion

- Curve: `--ios-ease` `cubic-bezier(0.32, 0.72, 0, 1)` for sheets, bars and segmented thumbs.
- Press feedback: `ios-press` scales to 0.97 and dims slightly on `:active`. Tappable cards,
  rows and buttons all carry it. Images never animate on hover.
- Sheets rise from the bottom with a spring and can be dragged down to dismiss on phones.
- `prefers-reduced-motion` disables transforms and keeps opacity fades only.

## Components

- **Nav bar:** sticky, transparent at the top of the page, gains the bar material and a
  hairline once content scrolls under it.
- **Large title:** each primary page opens with a left-aligned large title and one line of
  context (city picker on Discover).
- **Tab bar (dock):** a floating pill, 58px tall, inset 16px from the screen edges above the safe area, on solid
  `--color-surface` with `--shadow-float`. No border, no blur and no indicator line: the tint alone marks the
  active tab (icon `--color-tint`, label `--color-tint-ink`, semibold). Inactive tabs use `--color-ink-3` (5.9:1).
  Every tab keeps its 22px icon and 11px label; all four labels fit at 320px. The focus banner and toast offsets
  in `index.css` assume the 58px height. Phones have no footer inside the app; the footer renders on the landing
  page and from `lg` up, and Passport carries the Privacy Notice and Terms of Use rows.
- **Segmented control:** fill track, white thumb that slides between segments.
- **Filter panel** (`src/components/feed/VibeFilterBar.tsx`): Discover shows the segmented control, the spot count
  and one filter button. The button opens an inline panel with Sort and Price menus and the must-have chips. Closed,
  the panel shows only the choices in effect as chips that remove themselves, so nothing filters unseen. The badge
  counts chips, a set price and a changed sort; Reset returns the sort to Newest too.
- **Cafe card:** photo with the save button, name, area, price, open state and the viewer's own rating. No action
  row: the whole card opens the spot sheet, where Directions is the one primary.
- **Search field:** 36-40px tall, 10px radius, fill background, no border.
- **Grouped list:** inset rows on `--ios-surface`, 14px radius container, hairline separators
  inset from the leading edge, chevron on navigable rows.
- **Sheet:** grabber on phones, 28px top radius, solid surface header with the title and a round close button.
  A menu is one grouped list with category subheads, not a box per category. Shared group classes live in
  `src/components/common/sheetStyles.ts`.
- **Sanctuary passport** (spec `docs/superpowers/specs/2026-09-29-sanctuary-passport-and-focus-logs.md`):
  - Check-in sheet (`src/components/session/CheckInModal.tsx`): one fresh GPS fix, 120 m geofence. In range, two
    large rows: Start Focus Session (tint, the one primary) and Quick Stamp (fill). Out of range, the distance in
    tabular figures and Get directions.
  - Focus banner (`FloatingFocusBanner.tsx`): 44px River Styx pill 12px above the tab dock (bottom 24px on
    desktop), Aya `focus` peeking over its left edge, spot name, steam pulse dot, live `HH:MM:SS`, tint Finish.
    Session toasts sit above it with a green (saved) or red (error) dot and dismiss after six seconds.
  - Passport stamp (`src/components/passport/PassportStamp.tsx`): double ring, spot name on the top arc, city on the
    bottom arc, cup mark and date. Stamped in `--ios-tint` (#906D4B) with an SVG turbulence filter for a worn
    woodblock edge and a small stable tilt; unvisited as a dotted ghost (#594C3D at 20%, lettering at 42%).
  - Profile (tab and page both named `Passport`): three metrics (focus hours, sanctuaries, clinks) in tabular figures, a privacy
    switch (green when public), then Diary, Passport and Saved tabs. Account rows sit below the tabs.
  - Cup Clink (`CupClinkIcon`): two tipped cups; a filled tint wash marks a clink you sent.
- **Mood finder** (`src/components/moodFinder/`): entry card on Discover, sheet with mood and must-have chips,
  describe field, location and weather group rows, result cards with the pick label as a dark-material pill on
  the photo. Map tiles are OpenStreetMap, muted by the `haraya-tiles` filter (one tile layer in `src/components/map/tiles.ts`)
  so pins carry the color. Map routes draw a dotted tint line from a blue "You" dot (iOS location convention, the only blue in
  the app: it means "your position").

## Touch and responsiveness

- Minimum 44x44px touch targets (icon buttons may draw smaller but pad to 44px).
- Phone first at 320-480px; two-column card grid on phones, three at `md`, four at `lg`.
- Safe areas respected on the tab bar, sheets and the nav bar.
- No horizontal page overflow; horizontal shelves scroll inside their own container with
  scroll snapping.

## Landing page

- `src/views/LandingView.tsx`, shown only at the bare URL (`isLandingEntry` in `src/utils/router.ts`). Deep links,
  Supabase sign-in returns (`?code=`, `#access_token=`) and the home-screen app skip it. Every call to action enters
  the app through `enterApp` in `App.tsx`, which pushes a history entry so browser Back returns to the landing; a
  first visit skips the welcome sheet (the landing already explains the app) and starts the guided tour.
- Structure follows a classic app showcase in Haraya's own world: large centered headline, Open Haraya and See the
  map, three phones on a tint (#906D4B) arch, a River Styx band of what the app filters for (a slow marquee that
  stands still under reduced motion), four benefits around the mood finder phone, three numbered steps (numbers
  because the order matters), six city buttons that open Discover scoped to that city, a River Styx closing card
  with Aya `clink`, then the shared footer. Aya poses: `welcome` beside the hero arch (lg and up), `stamp` by the
  passport phone, `clink` in the closing card.
- Phone frame: the brand's line-art iPhone (`Haraya Files/Haraya Coffee Spots/Green Coffee Digos/iphone mockup.png`),
  redrawn as SVG in its own 147x293 units (5-unit River Styx stroke, 19-unit corners, 41x11 Dynamic Island) because
  the 504x360 source blurs when scaled; a soft drop shadow lifts it off the arch.
- Phone screens are real captures from the running app (`public/landing/*.jpg`, 375x812 at 2x, JPEG 78). Re-capture
  them when those screens change. No store badges (there is no native app), no eyebrow labels, no counts, no
  testimonials. In-page links scroll with buttons, never `#anchors`, because the hash is the app's router.

## Confirm email screen

- `src/views/ConfirmEmailView.tsx`. The only screen an unconfirmed sign-up sees: `App.tsx` returns it before the
  landing page and before every tab (the Place Portal and Control Room included) while
  `sessionService.getPendingConfirmation()` holds an address and nobody is signed in. The pending state is set when
  sign-up returns no session or when Supabase answers a sign-in with "Email not confirmed", is kept in
  `localStorage` for 24 hours, and ends when a session arrives.
- Reading order: Aya `holding-cup`, the title, the address in primary ink, one tint button into the inbox
  (`inboxFor` in `src/utils/inbox.ts`: Gmail, Outlook, Yahoo Mail, iCloud Mail; any other address gets a fill note
  instead of a link, since `mailto:` opens a new message), a footnote about using the same device, then a grouped
  list of the three ways out: send the link again, already confirmed (opens the sign-in form), wrong address (drops
  the pending state and opens Create account). No nav bar, tab dock or footer.
- It is a guide, not the lock. The lock is Supabase refusing a session to an unconfirmed address; clearing site
  data or choosing "wrong address" returns the visitor to guest browsing, which has no account powers.
