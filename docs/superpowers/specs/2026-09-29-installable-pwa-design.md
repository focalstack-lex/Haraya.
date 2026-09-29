# Installable Haraya design

## Context

The main dev wants Haraya installable on phones like an app without building a native app: a Progressive Web App. Visitors should be able to put Haraya on their home screen and open it from an icon instead of searching for the site. The ask is for Aya, the mascot who runs the first-visit guided tour (`src/components/tour/`), to offer installation when the tour ends.

Decisions confirmed with the user:
- Aya offers once, the **first time a visitor finishes** the tour (Done). Skip never triggers it, and replaying from Profile does not ask again.
- Aya asks on **phones and tablets only** (Android, iOS/iPadOS, in-app browsers). Desktop gets no card, but the Profile row appears there when the browser supports installing.
- Offline means **an offline notice only**. No cafe data is cached, and neither is anything from Supabase, auth, map tiles, routing or weather.
- Icons are **generated from `public/brand/icon-512.png`** with the standard PWA assets generator, then committed.
- A **Profile row, "Add Haraya to your home screen"**, is always available next to "Take the tour again" unless the app is already installed.


## Global Constraints

- Branch `dev/xyjor`. Commit per task with conventional messages (`feat(pwa): ...`, `chore: sync code map ...`). **Do not push**: the user wants to push only when there is work to share.
- CSP in `vercel.json` stays unchanged. No inline scripts: `injectRegister: null`, and register via `virtual:pwa-register`.
- The service worker precaches only the built shell (`**/*.{js,css,html}` plus manifest icons). `runtimeCaching` is empty. It never caches `*.supabase.co`, OSM tiles, routing.openstreetmap.de, open-meteo or Google Fonts.
- Auth redirects all land on `/` with `?code=` (PKCE). The navigate fallback must serve `index.html` for them unchanged. There are no paths besides `/`, because routing is hash-only (`src/utils/router.ts`).
- Storage keys use the `haraya_` prefix, and every localStorage access is wrapped in try/catch with `console.warn('Haraya: could not persist ...')`, mirroring `src/components/tour/tourStorage.ts`.
- House style (DESIGN.md and earlier specs): no emoji, no em or en dashes, sentence-case copy, 44px touch targets, DESIGN.md color tokens (`#FAF5EB` bg, `#FFFDF9` surface, `#13191F` ink, `#594C3D` muted, `#906D4B` tint, `#7D5C3D` tint text). Aya is decorative (`alt=""`) with one pose per surface. App icons use the peach `#FFE9CA`.
- Tests are pure functions in co-located `*.test.ts` files, node environment. No jsdom and no testing-library.
- After any file add or edit, run `npm run map:code` so `docs/CODE_MAP.md` stays current. `map:code:check` must pass at the end.
- Every change is logged as a section in `journal/2026-09-29.md` (or that day's file) using the repo's format: what changed, Verification, Not verified.

## Platform matrix

| Environment | Mode | Aya card shows |
|---|---|---|
| Already standalone / installed | `installed` | Nothing, and the Profile row is hidden |
| Messenger / Facebook / Instagram / TikTok / LINE webview | `open-in-browser` | "Open me in your browser" plus Copy link |
| iPhone / iPad (Safari, Chrome, Edge, Firefox on iOS) | `ios-steps` | Share, then Add to Home Screen, then Add |
| Android with `beforeinstallprompt` captured | `native-prompt` | **Add Haraya** button opens the system dialog |
| Android without the event (Firefox, not yet fired) | `android-menu` | Browser menu, then Install app / Add to Home screen |
| Desktop with the event | `native-prompt` | Profile row only (no card after the tour) |
| Desktop without the event | `unavailable` | Nothing |

## Copy

- `native-prompt`:
  - Title: "One more thing"
  - Body: "Keep me on your home screen. Next time, just tap my icon. No app store, and I stay up to date on my own."
  - Primary: "Add Haraya". It awaits `onInstall()`. On `accepted` it switches to the done state; on `dismissed` or `unavailable` it calls `onClose()`.
  - Secondary: "Maybe later"
- `ios-steps`:
  - Title: "One more thing"
  - Body: "Keep me on your home screen so I'm one tap away."
  - Steps: "1. Tap Share" (Share icon), "2. Choose Add to Home Screen" (SquarePlus icon), "3. Tap Add"
  - Primary: "Got it"
- `android-menu`:
  - Same title and body as `ios-steps`
  - Steps: "1. Open your browser menu" (EllipsisVertical icon), "2. Tap Install app or Add to Home screen"
  - Primary: "Got it"
- `open-in-browser`:
  - Title: "Open me in your browser"
  - Body: "Messenger and Facebook can't add me to your home screen. Open this page in Chrome or Safari, then I'll show you how."
  - Steps: "1. Tap the menu" (Ellipsis icon), "2. Choose Open in browser"
  - Primary: "Copy link". It calls `navigator.clipboard.writeText(window.location.origin + '/')`, and on success the label reads "Link copied". The call is wrapped in try/catch and silently does nothing on failure.
  - Secondary: "Maybe later"
- Done state, after `accepted`:
  - Title: "All set"
  - Body: "Find me on your home screen. See you at the next cup."
  - Primary: "Done"
- `null`, `installed` or `unavailable` snapshot, with `done` false: the Modal is closed and renders nothing.
