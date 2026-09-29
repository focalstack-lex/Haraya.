# Haraya minimalist UI cleanup: implementation plan

## Context

The main dev asked for a more minimalist UI and theme. Review found that Haraya's design contract
(`DESIGN.md`) is already minimalist; the clutter comes from drift and repetition, not from the theme:

- Code audit: 1,190 raw hex literals (869 in live files), three overlapping token layers in `src/index.css`
  of which almost nothing is read, 27 unused helper classes, 19 shadow recipes, off-scale radii.
- Browser pass at 375px: sheet header lets buttons bleed through, a website footer sits under every app
  screen, translucent low-contrast dock, five control rows above the first Discover card, an almost empty
  action row on cafe cards, one box per menu category, loud map tiles, oversized mascot card, and a tab
  called "Saved Spots" that opens "Your Passport".

Outcome: the same app and brand, with less chrome per screen and one token layer so later theme changes
are one-line edits. No features are removed.

Skills used: `impeccable` (distill and quieter playbooks), `design-system` (token layering),
`writing-plans` (task structure). On approval, copy this plan to
`docs/superpowers/plans/2026-09-29-minimalist-cleanup.md` so it lives with the other plans.

## Decisions already made

| Topic | Decision |
| --- | --- |
| Navigation | Visual only. Dock, hamburger and drawer keep their behavior. |
| Hidden code | Untouched: `src/components/drops/`, `roaster/`, `community/` (except `LocationPicker.tsx`), `views/CommunityView.tsx`, `views/SavedView.tsx`, `cafe/BeanDetailModal.tsx`. They must still compile. |
| Map | Keep OpenStreetMap tiles, mute with a CSS filter. No new host, no CSP or privacy text change. |
| Naming | "Passport" for the tab label and the page title. |
| Filters | Extend the existing inline panel (`VibeFilterBar`), no new sheet. |
| Tokens | Plain Tailwind v4 `@theme` (real CSS variables), so the theme stays editable in one place. |

## Global constraints

- No emoji, no en or em dashes in `src/**`, `index.html` or copy. Sentence case headers, no uppercase eyebrows.
- 44px touch targets. No horizontal overflow at 320, 375 and 1280.
- Keep every `data-tour` target: `search`, `city`, `mood`, `save`, `tab-profile`, `tab-map`, `tab-submit`.
- Keep prop contracts used by hidden files: `CafeGrid` `onDirections` (make optional, do not remove),
  `MenuSheet` props, `Modal`, `ModalHeader`, and `moodCardState` / `isLateEvening` exports of `MoodCard.tsx`.
- Dock height stays 58px so `.focus-banner-slot` and `.focus-toast-slot-raised` offsets remain valid.
- Each commit passes `npm run build`, `npm test`, `npm run lint`.

## Branch and commit order

Branch `ui/minimal-cleanup` off `dev/xyjor`. One commit per row.

| # | Commit | Visual change |
| --- | --- | --- |
| C1 | Add token layer (additive only) | None |
| A1 | Opaque sheet header | Yes |
| A2 | Footer out of the phone app shell, legal rows in Passport | Yes |
| A3 | Dock restyle | Yes |
| A4 | Passport rename | Copy |
| B1 | Discover controls collapse | Yes |
| B2 | Cafe card action row removed | Yes |
| B3 | Spot sheet menu as one grouped list | Yes |
| B4 | Smaller mood card | Yes |
| B5 | Muted map tiles | Yes |
| C2 | Codemod: hex utilities to token utilities, live files only | None (verified) |
| C3 | Delete unused classes and variable layers | None |
| C4 | Snap radii, shadows, tiny text | Small, intended |
| D | Docs, journal, code map, landing captures | |

C1 goes first so A and B are written with token names. C2 goes after A and B so it runs on less code.
C2 is never rebased: if the base moves, drop it and re-run the script.

## Phase C1: token layer

File: `src/index.css`. Add after `@import "tailwindcss";`:

```css
@theme {
  --color-canvas: #FAF5EB;
  --color-surface: #FFFDF9;
  --color-sunken: #F2EAE0;
  --color-hairline: #E4D9C8;
  --color-ink: #13191F;
  --color-ink-2: #594C3D;
  --color-ink-3: #6E6150;
  --color-tint: #906D4B;
  --color-tint-ink: #7D5C3D;
  --color-shade: #766046;   /* only with an opacity modifier: bg-shade/20 */
  --color-ok: #3E5C48;
  --color-danger: #8C3A2E;
  --color-star: #CA9C68;    /* rating stars only, never text */
  --color-steam: #E7AC67;
  --radius-control: 10px;
  --radius-row: 14px;
  --radius-card: 20px;
  --radius-sheet: 28px;
  --shadow-card: 0 0.5px 1px rgba(19, 25, 31, 0.06), 0 6px 20px -6px rgba(19, 25, 31, 0.14);
  --shadow-float: 0 4px 24px -4px rgba(19, 25, 31, 0.12), 0 1px 3px rgba(19, 25, 31, 0.04);
  --shadow-sheet: 0 -8px 40px rgba(19, 25, 31, 0.18);
}
```

Also add a `focus-ring` utility (`box-shadow: 0 0 0 2px var(--color-tint)`). Do not reset the default
color or radius namespaces; hidden files rely on them. First step of this commit: build once and confirm
`bg-shade/20` and `bg-shade/[0.07]` compile.

## Phase A: quick fixes

**A1. Sheet header** (`src/components/common/FormControls.tsx` L125)
- Replace `ios-material-bar` with `bg-surface`; keep `ios-hairline-b`.
- New `src/components/common/sheetStyles.ts` exporting `GROUP` and `SECTION_LABEL`; import them in
  `CafeDetailModal.tsx` (L47-48) and `CafeRecentVisitors.tsx` (L67, L70) instead of inline copies.

**A2. Footer** (`src/App.tsx` L671, L810-812; `FooterSection.tsx`; `ProfileView.tsx`)
- App shell: render `FooterSection` at `lg` and up only. Landing page render (L631-637) stays.
- Delete the 92px spacer (L812). Main bottom padding becomes one px-based value that clears the dock plus
  safe area on phones and a smaller one at `lg`. Keep the `h-14` focus spacer (L813).
- `FooterSection.tsx`: remove the phone-only "Know a hidden spot?" card and uppercase "Browse by City"
  block (the landing already has city buttons and a closing card); `pb-24` to `pb-8`.
- `ProfileView.tsx`: add an "About" `ios-group` after the account rows with two `ios-group-row` links,
  `#/tab/privacy` and `#/tab/terms`, so legal pages stay reachable on phones.

**A3. Dock** (`src/components/layout/BottomTabBar.tsx`, `.dock*` rules in `src/index.css` L322-347)
- Remove the indicator span and `dockVars`; delete `.dock-indicator` and the `.dock` custom properties.
- `.dock-bar`: solid `--color-surface`, no backdrop filter, no border, `--shadow-float`.
- Inactive icon and label `text-ink-3` (5.9:1); label 11px; badge 11px. Active stays tint.
- Check "Map & Spots" does not truncate at 320px.

**A4. Rename**
- `NavigationHeader.tsx` L22 label `'Passport'`; `ProfileView.tsx` L270 title `Passport`.
- `src/components/tour/tourSteps.ts` L44: "Your saves, stamps and diary live in Passport."
- Update `docs/superpowers/specs/2026-09-28-guided-tour-design.md` (L24, L71) and
  `2026-09-28-aya-assistant-design.md` (L124). Past journal entries stay as written.

## Phase B: distill screens

**B1. Discover controls** (`FeedControls.tsx`, `VibeFilterBar.tsx`, `App.tsx` L441-495, L546-560)
- `FeedControls`: keep the segmented control, the count and the filter button; remove the sort and price pills.
- `VibeFilterBar`: when open, show Sort and Price (reuse the existing `label` + `select.select-overlay`
  blocks and `SORT_LABELS`, `PRICE_RANGES`) above the chip rail. When closed, show only active choices as
  removable chips, including a non-default sort or price, so nothing is hidden.
- `App.tsx`: `resetFilters` also resets `sortKey` to `'newest'`; badge count = vibes + price set + sort changed.
  `handleViewAllPicks` then surfaces as a "Most saved" chip.

**B2. Cafe card** (`src/components/feed/CafeGrid.tsx` L95-113)
- Delete the action row and its hairline. Move the read-only personal rating star to the end of the
  open or closed line. Directions remains the primary button in the spot sheet.
- `onDirections` becomes optional; `App.tsx` and `SharedListView.tsx` stop passing it.

**B3. Spot sheet menu** (`CafeDetailModal.tsx` `MenuSheet` L74-100)
- One `GROUP` for the whole menu; each category is a subhead row followed by its item rows as direct
  children so `.ios-group > * + *` separators apply. Props unchanged.

**B4. Mood card** (`src/components/moodFinder/MoodCard.tsx` L72-103)
- Aya 176 to 120px, frame 160 to 112px, top offset 42 to 28px, section `mt` 46 to 30px, `min-h` 136 to 104px,
  text `pr` 148 to 108px. About 48px returned to content. Test the focus-session title at 320px.

**B5. Map tiles**
- New `src/components/map/tiles.ts`: URL, one attribution string (the linked form), options with
  `className: 'haraya-tiles'`. Use in `DavaoCoffeeMap.tsx` L93-96 and `community/LocationPicker.tsx` L29-32.
- `src/index.css`: `.haraya-tiles { filter: grayscale(0.35) sepia(0.12) saturate(0.8); }`, tuned by eye.
  Pins, routes and the blue "You" dot are in other panes and keep their color.

## Phase C2 to C4: consolidation

**C2. Codemod.** One-off `codemod-tokens.mjs` in the scratchpad (not committed):
- Walks `src/**/*.tsx`, skipping the hidden-code list above.
- Rewrites only utility forms: `(text|bg|border|ring|ring-offset|fill|stroke|from|via|to|accent)-[#HEX]`
  with optional variants, `!`, and `/NN` or `/[0.NN]` suffix, to the token name from C1.
  `#8C7E70` is already gone after A3. Unmapped colors are left alone and reported.
- Leaves hex in `shadow-[...]`, SVG attributes, Leaflet HTML, Aya and Google brand colors.
- Supports `--dry`, preserves line endings, writes a JSON log of each replacement.

**C3. Delete dead CSS** (`src/index.css`)
- Remove the zinc, amber, emerald and red remap lines (keep `--color-white`, used by a hidden file), the
  whole `--color-brand-*` block, and unread `--ios-*` variables; the four that are read become aliases
  of the new tokens.
- Remove the 27 unused classes. Where an unused class shares a selector list with a used one
  (`.font-cooper`, `.font-sans`, `.ios-material-bar`), trim the list and keep the rule.
- Replace literal hex in base rules (html, body, caret, selection, scrollbar, focus outline) with variables.

**C4. Snap scales** (live files only)
- Radii: `[12px]`, `[16px]`, `2xl` to `rounded-row`; `xl` to `rounded-control`; `[24px]` to `rounded-sheet`.
  Keep the 8px segmented thumb (concentric in a 10px track).
- Shadows: ad hoc card, floating and sheet recipes to `shadow-card`, `shadow-float`, `shadow-sheet`; the nine
  `focus:shadow-[0_0_0_2px_#906D4B]` to `focus-ring`.
- Text: remaining sub-11px (`NavigationHeader.tsx` L60, filter badge) to 11px.
- LandingView's three Amber Autumn uses move to `tint`.

## Phase D: docs

- `DESIGN.md`: rewrite the dock paragraph, color table (new token names), card shadow value, sheet header
  material, mascot and mood card sizes, filter panel, map tile note.
- Append `## [2026-09-29] Minimalist cleanup` to `journal/2026-09-29.md` with bullets and a `Verified:` line.
- `npm run map:code` (never hand-edit `docs/CODE_MAP.md`).
- Re-capture `public/landing/discover.jpg`, `mood.jpg`, `spot.jpg`, `map.jpg`, `passport.jpg`
  (375x812 at 2x, JPEG 78).

## Verification

Per commit:
```bash
npm run build
npm test
npm run lint
npm run map:code:check
```

Visual, using the browser preview (`haraya-preview` in `.claude/launch.json`, rebuild first):
- After each A and B commit: screenshot the touched screen at 375px and check the specific fix
  (scroll the spot sheet and confirm nothing shows through the header; confirm no footer under phone tabs
  and that Passport shows Privacy and Terms rows; dock labels readable over scrolled content; filters
  still change the grid and the map; tour replays end to end from Passport).
- C2 proof of no visual change: screenshots before and after at 375 and 1280 for each tab, the spot sheet,
  the mood finder and the drawer; expect no difference. Then grep live files for leftover `-[#` and
  compare with the expected exceptions.
- Final pass at 320, 375 and 1280: zero horizontal overflow, zero console errors, emoji and dash scan clean.
  Save evidence under `reports/ui-verification/2026-09-29-minimal-cleanup/`.

## Out of scope

Dark mode, navigation behavior changes, new tile provider, hidden feature screens, signed-in dashboards
beyond what the codemod touches, and any copy changes other than the Passport rename.
