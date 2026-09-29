# Installable Haraya (PWA + Aya install card) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use the subagent-driven-development skill (recommended) or the executing-plans skill to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Context

The main dev wants Haraya installable on phones like an app without building a native app: a Progressive Web App. Visitors should be able to put Haraya on their home screen and open it from an icon instead of searching for the site. The ask is for Aya, the mascot who runs the first-visit guided tour (`src/components/tour/`), to offer installation when the tour ends.

Decisions confirmed with the user:
- Aya offers once, the **first time a visitor finishes** the tour (Done). Skip never triggers it, and replaying from Profile does not ask again.
- Aya asks on **phones and tablets only** (Android, iOS/iPadOS, in-app browsers). Desktop gets no card, but the Profile row appears there when the browser supports installing.
- Offline means **an offline notice only**. No cafe data is cached, and neither is anything from Supabase, auth, map tiles, routing or weather.
- Icons are **generated from `public/brand/icon-512.png`** with the standard PWA assets generator, then committed.
- A **Profile row, "Add Haraya to your home screen"**, is always available next to "Take the tour again" unless the app is already installed.

**Goal:** Make Haraya installable (manifest, icons, a conservative service worker), and have Aya offer a platform-aware install card at the end of the first completed tour, plus a Profile entry point.

**Architecture:** `vite-plugin-pwa` generates the manifest and a Workbox service worker that precaches only the built app shell, with no runtime caching. Registration goes through `virtual:pwa-register` from `main.tsx`, not an inline script, because the CSP is `script-src 'self'`. Platform and install-mode decisions are pure functions, unit-tested in Vitest's node environment. A small store captures `beforeinstallprompt`. `GuidedTour` reports `'done' | 'skipped'`, and App opens `InstallSheet`, built on the shared `Modal`, when `shouldOfferAfterTour` says so.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind v4, framer-motion, `vite-plugin-pwa@^1.3` (dev dependency, peer range includes Vite 8), Workbox (via the plugin), Vitest 5 (node environment), Playwright (existing dev dependency, for the drive).

**Spec:** `docs/superpowers/specs/2026-09-29-installable-pwa-design.md`, written in Task 0 from this plan's Context and Global Constraints.

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

---

### Task 0: Spec and plan into the repo

**Files:**
- Create: `docs/superpowers/specs/2026-09-29-installable-pwa-design.md`, containing the Context, decisions, platform matrix (below) and copy.
- Create: `docs/superpowers/plans/2026-09-29-installable-pwa.md`, a copy of this plan.

Platform matrix (goes in the spec):

| Environment | Mode | Aya card shows |
|---|---|---|
| Already standalone / installed | `installed` | Nothing, and the Profile row is hidden |
| Messenger / Facebook / Instagram / TikTok / LINE webview | `open-in-browser` | "Open me in your browser" plus Copy link |
| iPhone / iPad (Safari, Chrome, Edge, Firefox on iOS) | `ios-steps` | Share, then Add to Home Screen, then Add |
| Android with `beforeinstallprompt` captured | `native-prompt` | **Add Haraya** button opens the system dialog |
| Android without the event (Firefox, not yet fired) | `android-menu` | Browser menu, then Install app / Add to Home screen |
| Desktop with the event | `native-prompt` | Profile row only (no card after the tour) |
| Desktop without the event | `unavailable` | Nothing |

- [ ] Write both files, then commit: `docs: spec and plan for installable Haraya`.

### Task 1: Manifest, icons, service worker

**Files:**
- Modify: `package.json` (devDependency `vite-plugin-pwa`)
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json` (`"types": ["vite/client", "vite-plugin-pwa/client"]`)
- Modify: `src/main.tsx` (registration)
- Modify: `vercel.json` (no-cache headers for `/sw.js` and `/manifest.webmanifest`)
- Create: `public/brand/pwa-192x192.png`, `public/brand/maskable-icon-512x512.png`

**Interfaces:** Produces `/manifest.webmanifest` and `/sw.js` in `dist/`, and a `<link rel="manifest">` injected by the plugin into the built `index.html`.

- [ ] **Step 1: Icons.** `icon-512.png` is an opaque peach square whose mountain reaches about 10% from the edges, which is outside the maskable safe circle (radius 40%), so the maskable version needs about 30% padding on peach. Create a temporary `pwa-assets.config.mjs` at the repo root:

```js
// Plain object on purpose: the generator runs from the npx cache, so importing its defineConfig would not resolve
export default {
  preset: {
    transparent: { sizes: [192], padding: 0 },
    maskable: { sizes: [512], padding: 0.3, resizeOptions: { background: '#FFE9CA' } },
    apple: { sizes: [180], padding: 0.3, resizeOptions: { background: '#FFE9CA' } },
  },
  images: ['public/brand/icon-512.png'],
}
```

Run `npx --yes @vite-pwa/assets-generator@1`, then keep `public/brand/pwa-192x192.png` and `public/brand/maskable-icon-512x512.png`. Delete the generated apple and any other extras, since the existing `apple-touch-icon.png` stays, and delete the temporary config. Open `maskable-icon-512x512.png` and confirm the whole mountain and steam fit inside a centered circle of 80% diameter. Fallback if the CLI misbehaves: produce the same two files with PowerShell `System.Drawing`. For the 192 icon, resize icon-512 to 192. For the maskable icon, draw icon-512 scaled to 70% and centered on a 512 canvas filled `#FFE9CA`.

- [ ] **Step 2: Plugin.** `npm i -D vite-plugin-pwa`. In `vite.config.ts`:

```ts
import { VitePWA } from 'vite-plugin-pwa'
// plugins: [react(), tailwindcss(), VitePWA({ ... })]
VitePWA({
  registerType: 'prompt',
  injectRegister: null, // CSP is script-src 'self': register from main.tsx, never inline
  manifest: {
    id: '/',
    name: 'Haraya: Davao Coffee and Study Spots',
    short_name: 'Haraya',
    description: 'Find great coffee, study spots with plugs and Wi-Fi, and hidden gems across the Davao Region.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF5EB',
    theme_color: '#FAF5EB',
    icons: [
      { src: '/brand/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html}'],
    navigateFallback: 'index.html',
    cleanupOutdatedCaches: true,
    runtimeCaching: [], // app shell only; Supabase, tiles, routing and weather always go to the network
  },
})
```

- [ ] **Step 3: Registration** in `src/main.tsx`, before `createRoot`. Updates apply when the app is backgrounded, so nobody is reloaded mid-task:

```ts
import { registerSW } from 'virtual:pwa-register'

// A new version waits until the visitor leaves the app, then activates; the next open is fresh
let updateQueued = false
const updateSW = registerSW({
  onNeedRefresh() {
    if (updateQueued) return
    updateQueued = true
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void updateSW(true)
    })
  },
})
```

- [ ] **Step 4: `vercel.json` headers.** Add two entries *before* the catch-all header block:

```json
{ "source": "/sw.js", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
{ "source": "/manifest.webmanifest", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }, { "key": "Content-Type", "value": "application/manifest+json" }] }
```

- [ ] **Step 5: Verify.**
  - `npm run build` shows `dist/sw.js`, `dist/manifest.webmanifest` and the manifest link in `dist/index.html`, with no precache size warnings. If the main chunk exceeds 2 MB, raise `maximumFileSizeToCacheInBytes` and note it in the journal.
  - `npm run preview`, then in Chrome DevTools > Application: the manifest has no errors, the SW is activated, and the page is "Installable".
  - In the Network tab, `?code=abc` navigation returns `index.html` from the SW, and Supabase requests are not served from the SW.
- [ ] **Step 6:** `npm run map:code`, then commit `feat(pwa): web app manifest, icons and app-shell service worker`.

### Task 2: Platform and install-mode logic (TDD)

**Files:**
- Create: `src/components/install/installPlatform.ts`
- Test: `src/components/install/installPlatform.test.ts`
- Modify: `src/components/tour/tourSteps.ts` (add `TourOutcome` type)
- Modify: `src/utils/router.ts` (extract `isStandaloneDisplay`)

**Interfaces (produces):**
```ts
export type InstallPlatform = 'android' | 'ios' | 'in-app' | 'desktop';
export type InstallMode = 'installed' | 'native-prompt' | 'ios-steps' | 'android-menu' | 'open-in-browser' | 'unavailable';
export function detectInstallPlatform(userAgent: string, maxTouchPoints: number): InstallPlatform;
export function resolveInstallMode(platform: InstallPlatform, state: { standalone: boolean; hasDeferredPrompt: boolean }): InstallMode;
export function shouldOfferAfterTour(input: { outcome: TourOutcome; alreadyOffered: boolean; platform: InstallPlatform; mode: InstallMode }): boolean;
```
Also produced in this task (so dependencies point from install to tour/utils, never back):
- `src/components/tour/tourSteps.ts`: `export type TourOutcome = 'done' | 'skipped';` (installPlatform uses `import type`)
- `src/utils/router.ts`: `export function isStandaloneDisplay(): boolean`, extracted from `isLandingEntry` (L78-80), which now calls it. It's a browser wrapper with no unit test.

- [ ] **Step 1: Write failing tests** as tables with literal UAs:
  - `detectInstallPlatform`:
    - iPhone Safari UA gives `ios`.
    - iPad desktop-mode UA (`Macintosh; Intel Mac OS X`) with `maxTouchPoints` 5 gives `ios`. The same UA with 0 gives `desktop`, which catches the iPadOS break.
    - Chrome on iOS (`CriOS`) gives `ios`.
    - Pixel Chrome UA gives `android`.
    - Samsung Internet UA gives `android`.
    - Android UA with `FB_IAB/FB4A;FBAV/` gives `in-app`. In-app must win over android.
    - iPhone UA with `FBAN/MessengerForiOS` gives `in-app`.
    - UA with `Instagram 300.0` gives `in-app`.
    - UA with `musical_ly` (TikTok) gives `in-app`.
    - Windows Chrome gives `desktop`.
  - `resolveInstallMode`:
    - standalone is true gives `installed` for every platform.
    - in-app gives `open-in-browser`.
    - ios gives `ios-steps`, even with `hasDeferredPrompt` true.
    - android with the prompt gives `native-prompt`; android without it gives `android-menu`.
    - desktop with the prompt gives `native-prompt`; desktop without it gives `unavailable`.
  - `shouldOfferAfterTour`:
    - done, not offered, android, `native-prompt` gives true.
    - `skipped` gives false.
    - `alreadyOffered` gives false.
    - `desktop` gives false.
    - `installed` gives false.
    - ios with `ios-steps` gives true.
    - in-app with `open-in-browser` gives true.
- [ ] **Step 2:** `npm test` fails because the module is missing.
- [ ] **Step 3: Implement**:

```ts
const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|musical_ly|BytedanceWebview|\bLine\//i;

export function detectInstallPlatform(userAgent: string, maxTouchPoints: number): InstallPlatform {
  if (IN_APP.test(userAgent)) return 'in-app';
  // iPadOS reports a Mac UA; a touch screen gives it away
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

export function resolveInstallMode(platform: InstallPlatform, { standalone, hasDeferredPrompt }: { standalone: boolean; hasDeferredPrompt: boolean }): InstallMode {
  if (standalone) return 'installed';
  if (platform === 'in-app') return 'open-in-browser';
  if (platform === 'ios') return 'ios-steps';
  if (hasDeferredPrompt) return 'native-prompt';
  return platform === 'android' ? 'android-menu' : 'unavailable';
}

export function shouldOfferAfterTour({ outcome, alreadyOffered, platform, mode }: { outcome: TourOutcome; alreadyOffered: boolean; platform: InstallPlatform; mode: InstallMode }): boolean {
  return outcome === 'done' && !alreadyOffered && platform !== 'desktop' && mode !== 'installed' && mode !== 'unavailable';
}
```

In `src/utils/router.ts`:
```ts
/** Running as the home-screen app (Android/desktop display-mode, or iOS's navigator.standalone). */
export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
// isLandingEntry: `return !isStandaloneDisplay();` replaces the inline check
```

- [ ] **Step 4:** `npm test` passes, including the existing suites after the router refactor.
- [ ] **Step 5:** `npm run map:code`, then commit `feat(pwa): platform and install-mode detection`.

### Task 3: Install prompt store and offered flag (TDD)

**Files:**
- Create: `src/components/install/installPromptStore.ts`
- Test: `src/components/install/installPromptStore.test.ts`
- Create: `src/components/install/installStorage.ts`, a copy of the `tourStorage.ts` pattern with key `haraya_install_offered` and exports `hasOfferedInstall()` / `markInstallOffered()`
- Create: `src/components/install/useInstallPrompt.ts`
- Modify: `src/main.tsx` (call `installPrompt.listen(window)` before render, because `beforeinstallprompt` can fire before React mounts)

**Interfaces (produces):**
```ts
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export type PromptResult = 'accepted' | 'dismissed' | 'unavailable';
export function createInstallPromptStore(): {
  listen(target: EventTarget): () => void; // captures beforeinstallprompt (preventDefault) and appinstalled
  hasDeferredPrompt(): boolean;
  isInstalled(): boolean;                  // true after appinstalled
  promptInstall(): Promise<PromptResult>;  // uses the event once, then clears it
  subscribe(listener: () => void): () => void;
  getSnapshot(): number;                   // version counter for useSyncExternalStore
};
export const installPrompt: ReturnType<typeof createInstallPromptStore>;
// useInstallPrompt.ts
export function useInstallPrompt(): { platform: InstallPlatform; mode: InstallMode; promptInstall: () => Promise<PromptResult> };
```

- [ ] **Step 1: Write failing tests** using Node's global `EventTarget` and a hand-built event (`Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: async () => { prompted++ }, userChoice: Promise.resolve({ outcome: 'accepted' }) })`):
  - Before any event, `hasDeferredPrompt()` is false and `promptInstall()` resolves `'unavailable'`.
  - After dispatch, `hasDeferredPrompt()` is true and `event.defaultPrevented` is true, so the browser's mini-infobar is suppressed and Aya decides when to ask.
  - `promptInstall()` calls `prompt()` once, resolves `'accepted'`, and afterwards `hasDeferredPrompt()` is false. A second call resolves `'unavailable'`.
  - With a `userChoice` of dismissed, it resolves `'dismissed'`.
  - Dispatching `appinstalled` makes `isInstalled()` true and clears the deferred prompt.
  - A subscriber is called on each capture and on `appinstalled`, and not after unsubscribe.
  - The function returned by `listen()` removes both listeners, so a later dispatch changes nothing.
- [ ] **Step 2:** `npm test` fails.
- [ ] **Step 3: Implement** the store with closure state (`deferred: BeforeInstallPromptEvent | null`, `installed`, `version`, a `Set` of listeners). Then write `useInstallPrompt`:
  - `useSyncExternalStore(installPrompt.subscribe, installPrompt.getSnapshot)`
  - `platform = detectInstallPlatform(navigator.userAgent, navigator.maxTouchPoints ?? 0)`
  - `mode = resolveInstallMode(platform, { standalone: isStandaloneDisplay() || installPrompt.isInstalled(), hasDeferredPrompt: installPrompt.hasDeferredPrompt() })`

  The hook is a thin wrapper and gets no unit test.
- [ ] **Step 4:** `npm test` passes.
- [ ] **Step 5:** `npm run map:code`, then commit `feat(pwa): capture the install prompt and remember when Aya offered`.

### Task 4: Tour reports how it ended

**Files:**
- Modify: `src/components/tour/GuidedTour.tsx` (`onFinish: (outcome: TourOutcome) => void`, doc comment updated)
- `src/App.tsx` stays untouched here: the existing `finishTour = () => {...}` is still assignable to `(outcome) => void`. It gains the parameter in Task 6, where it's used, so `noUnusedParameters` never trips.

- [ ] **Step 1:** In `GuidedTour.tsx`, `finish` becomes `useCallback((outcome: TourOutcome) => { if (finishedRef.current) return; finishedRef.current = true; onFinishRef.current(outcome); }, [])`. Route the exits as follows:
  - The Skip button (L275) becomes `onClick={() => finish('skipped')}`. It must not be passed as `onClick={finish}`, which would hand over the click event. The Escape handler (L164) calls `finish('skipped')`.
  - `next()` at the last step (L91) calls `finish('done')`. This also covers the missing-target auto-advance on the last step (L108-109), for example when `tab-submit` is hidden: the visitor did not skip, the control just wasn't there.
- [ ] **Step 2:** `tsc -b` (via `npm run build`) passes. The tour text in `tourSteps.ts` stays as it is, because the card opens with "One more thing", which follows the farewell naturally.
- [ ] **Step 3:** Commit `refactor(tour): report done or skipped to the caller`. This commit and Task 6 can be squashed if a reviewer prefers.

### Task 5: Aya's install sheet

**Files:**
- Create: `src/components/install/InstallSheet.tsx`
- Modify: `src/components/common/FormControls.tsx`. `PrimaryButton` gains `ref?: React.Ref<HTMLButtonElement>` (React 19 ref-as-prop) and passes it to its `<button>`. Existing callers are unaffected.

**Interfaces:**
- Consumes: `Modal`, `PrimaryButton`, `SecondaryButton` from `src/components/common/FormControls.tsx` (no `ModalHeader`; the body carries the title); `AyaMascot` (pose `'welcome'`, size 112, `alt=""`); `InstallMode` and `PromptResult`
- Produces: `InstallSheet: React.FC<{ mode: InstallMode | null; onInstall: () => Promise<PromptResult>; onClose: () => void }>`. The sheet is open while `mode` is non-null. **`mode` is the snapshot taken when App opened it**, not the live mode, so `appinstalled` flipping the live mode to `installed` can't unmount the sheet before the done state shows. The sheet keeps a local `done` flag, reset when `mode` changes from null to a value, and `done` takes priority over `mode` when rendering.

**Layout.** Use the `CheckInModal` body pattern: `<Modal isOpen={mode !== null} onClose maxWidth="sm:max-w-md" labelledBy="install-title">`, then `py-4 px-5 flex flex-col items-center gap-3 text-center`, then Aya, then `h3#install-title.ios-title text-[19px]`, then `p.text-[14px] text-[#594C3D] max-w-xs`, then a steps list if needed, then buttons in `w-full flex flex-col gap-2`. Focus the primary button when the sheet opens and when it enters the done state, via the new `PrimaryButton` ref and an effect (`focus({ preventScroll: true })`), the same way `GuidedTour` does. Step icons come from lucide (`Share`, `SquarePlus`, `EllipsisVertical`, `Ellipsis`, `Link`) at `w-5 h-5`, with an `aria-hidden` tile styled like Profile's `RowIcon` (`bg-[#906D4B]/15 text-[#7D5C3D] rounded-[8px]`). Every button is at least 44px tall.

**Copy by mode** (exact, and checked for dashes and emoji):
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

- [ ] **Step 1:** Build the component. There is no DOM test infrastructure, so it's verified in Task 7's drive.
- [ ] **Step 2:** `npm run build` and `npm run lint` are clean.
- [ ] **Step 3:** `npm run map:code`, then commit `feat(pwa): Aya install sheet`.

### Task 6: Wire it into App and Profile, plus the offline notice

**Files:**
- Modify: `src/App.tsx` (install sheet state, `finishTour(outcome)`, `BottomTabBar` hiding, Profile prop, offline notice)
- Modify: `src/views/ProfileView.tsx` (optional `onInstallApp?: () => void` prop and a row after "Take the tour again", L623-665)
- Create: `src/components/install/OfflineNotice.tsx`

- [ ] **Step 1: App.**
  - Add `const install = useInstallPrompt();` and `const [installSheetMode, setInstallSheetMode] = useState<InstallMode | null>(null);`. The mode is snapshotted at open time; see Task 5.
  - Change `finishTour`:
    ```ts
    const finishTour = (outcome: TourOutcome) => {
      setIsTourOpen(false);
      markTourDone();
      if (shouldOfferAfterTour({ outcome, alreadyOffered: hasOfferedInstall(), platform: install.platform, mode: install.mode })) {
        markInstallOffered();
        const mode = install.mode;
        // Let the tour's dim layer clear before Aya's card slides up
        window.setTimeout(() => setInstallSheetMode(mode), 400);
      }
    };
    ```
  - Render `<InstallSheet mode={installSheetMode} onInstall={install.promptInstall} onClose={() => setInstallSheetMode(null)} />` right after `<GuidedTour ... />` (L789).
  - Add `installSheetMode !== null` to the `BottomTabBar` `isHidden` list (L803).
  - There is no auto-close on `appinstalled`: the snapshot keeps the sheet showing "All set" until the visitor taps Done.
- [ ] **Step 2: Profile row.** Pass `onInstallApp={install.mode === 'installed' || install.mode === 'unavailable' ? undefined : () => setInstallSheetMode(install.mode)}`. In `ProfileView`, render `{onInstallApp && (...)}` with the exact markup of the "Take the tour again" row. Use the lucide `SquarePlus` icon in `RowIcon`, the title "Add Haraya to your home screen" and the footnote "Open me like an app, no app store".
- [ ] **Step 3: Offline notice.**
  - `OfflineNotice` uses `useSyncExternalStore` on the `online`/`offline` window events, with `navigator.onLine` as the snapshot.
  - When offline it renders a `role="status"` surface card below the navigation header. Styling: `bg-[#FFFDF9] rounded-[16px]`, Aya pose `'empty'` at size 48 with `alt=""`, and 14px `#594C3D` text reading "You're offline. I'll bring the spots back once you're connected."
  - Online, it renders nothing.
  - Place it in App directly under `NavigationHeader`.
- [ ] **Step 4:** `npm test`, `npm run build` and `npm run lint` are green. Run `npm run map:code`, then commit `feat(pwa): Aya offers install after the first finished tour`.

### Task 7: Verification, journal, docs

**Files:**
- Modify: `journal/2026-09-29.md` (new `## [2026-09-29] Installable Haraya` section), plus `JOURNAL.md` if the index needs a line
- Modify: `README.md` (short "Installable app" note: `npm run build && npm run preview` to test the SW, and dev mode has no SW)
- Evidence: `reports/ui-verification/2026-09-29-installable-pwa/` (gitignored)

- [ ] **Step 1: Automated checks.** `npm test` (report counts), `npm run build`, `npm run lint`, `npm run map:code:check`, and an emoji and dash scan of the new files.
- [ ] **Step 2: Playwright drive** against `npm run preview`, at 320, 375 and 1280 px, with screenshots into the evidence folder:
  1. Fresh context with an Android Chrome UA. Finish the tour with Done, and the sheet appears in `android-menu` mode (Playwright's Chromium does not fire `beforeinstallprompt`). Reload, replay the tour from Profile and finish it: no sheet. The Profile row opens the sheet.
  2. Fresh context. Tap Skip: no sheet.
  3. iPhone UA: `ios-steps` copy. Messenger UA: `open-in-browser` copy, and Copy link works.
  4. Desktop UA, 1280 px: no sheet after Done. The Profile row is hidden because Playwright's Chromium has no prompt event.
  5. With the SW activated, `context.setOffline(true)` and reload: the app shell loads, and the offline notice with Aya shows.
  6. `/?code=fake` loads the app (the SW serves `index.html`) and doesn't crash.
- [ ] **Step 3: Desktop Chrome check.** In real desktop Chrome on `npm run preview`, the DevTools Application tab shows the page as installable, and the Profile row opens the sheet in `native-prompt` mode. Tapping **Add Haraya** opens Chrome's install dialog.
- [ ] **Step 4:** Write the journal section in the repo format. List as **Not verified** the real-device checks, which need an HTTPS deploy (Vercel preview after the user chooses to push):
  - Android Chrome one-tap install
  - iPhone Add to Home Screen, and the icon and splash colors
  - **Google sign-in inside the installed iPhone app**, where storage is separate from Safari and the OAuth hop may land in Safari
  - Supabase redirect allowlist for the preview origin
- [ ] **Step 5:** Run `npm run map:code`, then commit `docs: journal and readme for installable Haraya`.

## Verification (end to end)

1. `npm test` passes, including the new `installPlatform` and `installPromptStore` suites.
2. `npm run build` shows `dist/sw.js` and `dist/manifest.webmanifest`, and `dist/index.html` has the manifest link. `npm run lint` is clean. `npm run map:code:check` is current.
3. On `npm run preview` in Chrome, the manifest is valid, the SW is active, the page is installable, Supabase and tile requests bypass the SW, and offline reload shows the Aya offline notice.
4. The Playwright drive (Task 7, Step 2) passes all six scenarios, with screenshots saved.
5. After the user decides to push, check on real devices using the Vercel preview: Android install, iPhone Add to Home Screen, the installed app skips the landing page, and Google sign-in works in the installed iPhone app.
