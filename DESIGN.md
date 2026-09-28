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
  sticker: `welcome` (WelcomeModal, first tour step), `mood` (Discover mood card, where she rises out of the
  card's top edge, and Mood Finder idle), `empty` (cafe, bean, saved, visited and mood
  no-match empty states, Add a Spot title), `welcome` again on the live navigation arrival card; `drops` belongs to the
  hidden Roast Drops view. Idle motion (bob, blink, steam, wave) rests under reduced
  motion. Beside text that already carries the message, pass `alt=""` so she stays decorative.
- Numbers (prices, counts, timers) use tabular figures (`font-mono` maps to the UI face with
  `tabular-nums`). No monospace costume.
- Section headers are sentence case. No uppercase tracked eyebrows above headings.

## Color

| Token | Value | Role |
| --- | --- | --- |
| `--ios-bg` | `#FAF5EB` | Canvas (grouped background) |
| `--ios-surface` | `#FFFDF9` | Cards, grouped rows, sheets |
| `--ios-fill` | `rgba(118, 96, 70, 0.12)` | Search fields, segmented track, chips |
| `--ios-separator` | `rgba(89, 76, 61, 0.2)` | 0.5px hairlines |
| `--ios-label` | `#13191F` | Primary text |
| `--ios-label-2` | `#594C3D` | Secondary text (7.6:1 on canvas) |
| `--ios-label-3` | `#6E6150` | Placeholder and tertiary text (at least 4.5:1) |
| `--ios-tint` | `#906D4B` | Filled controls, active icons |
| `--ios-tint-text` | `#7D5C3D` | Tinted text and links (5.6:1 on canvas) |
| `--ios-green` | `#3E5C48` | Open now, success |
| `--ios-red` | `#8C3A2E` | Closed, destructive |

Color is information. The tint marks the one active or primary thing in a region.

## Shape and depth

- Radii: 10px controls, 14px grouped rows and inputs, 20px cards and hero, 28px sheets (top).
- Cards have no border. They sit on `--ios-surface` with `ios-card-shadow` (a soft 1px
  plus 8px offset shadow).
- Materials: `ios-material-bar` for nav and tab bars (78% linen, blur 20px, saturate 180%);
  `ios-material-dark` for controls over photos (black 35%, blur 12px).
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
- **Tab bar (dock):** a floating bar, 64px tall with a 22px radius, inset 12px from the screen edges
  above the safe area, on `--ios-surface` with a soft lifted shadow. The active tab sits on a tint arch
  (`--ios-tint`, up to 68px wide): a semicircular top that rises 14px above the bar's top edge, straight
  sides, and a base resting on the bar's bottom edge (8px corners so it stays inside the bar's radius on
  narrow phones). It slides between tabs on `--ios-ease` (0.5s); its icon and label turn cream (#FFFDF9,
  4.6:1 on the tint) and lift 5px to center in the arch. Inactive tabs use `--ios-label-3` (5.9:1 on the surface). Every tab
  keeps its 24px icon and 10px label. Geometry is in px, not Tailwind spacing units, because the project
  scales its spacing. No indicator lines.
- **Segmented control:** fill track, white thumb that slides between segments.
- **Search field:** 36-40px tall, 10px radius, fill background, no border.
- **Grouped list:** inset rows on `--ios-surface`, 14px radius container, hairline separators
  inset from the leading edge, chevron on navigable rows.
- **Sheet:** grabber on phones, 28px top radius, header with a centered title and a round
  close button.
- **Mood finder** (`src/components/moodFinder/`): entry card on Discover, sheet with mood and must-have chips,
  describe field, location and weather group rows, result cards with the pick label as a dark-material pill on
  the photo. Map routes draw a dotted tint line from a blue "You" dot (iOS location convention, the only blue in
  the app: it means "your position").

## Touch and responsiveness

- Minimum 44x44px touch targets (icon buttons may draw smaller but pad to 44px).
- Phone first at 320-480px; two-column card grid on phones, three at `md`, four at `lg`.
- Safe areas respected on the tab bar, sheets and the nav bar.
- No horizontal page overflow; horizontal shelves scroll inside their own container with
  scroll snapping.
