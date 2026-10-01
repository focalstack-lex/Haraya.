# Haraya Promo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a silent 75 s, 1920x1080, 60 fps Haraya promo video plus an SFX cue sheet, per
`docs/superpowers/specs/2026-09-30-promo-video-design.md`.

**Architecture:** A self-contained Remotion project in `promo-video/`. `src/timeline.ts` owns every scene start,
length and in-scene beat; scenes animate from those beats and the cue sheet is generated from the same beats, so
sound cues can never drift from the picture. Phone screens are captures of the running app; Aya and the passport
stamp are the app's own components imported through a webpack alias.

**Tech Stack:** Remotion 4.0.530 (React 19, TypeScript), `@remotion/google-fonts` (Plus Jakarta Sans),
`@remotion/paths` (route drawing), `lucide-react` (the app's icon set), Playwright from the root project for captures,
Node 24 built-in test runner for the timeline tests.

## Global Constraints

- Output: 1920x1080, 60 fps, H.264 MP4, no audio stream, about 75 s.
- Palette: only the app tokens from `src/index.css` and Aya's master palette; no violet, pink or blue except the
  blue "You" dot on maps.
- Copy: only text that exists in the app or on the landing page, plus the generic "Your Cafe" demo listing.
- No emoji and no en or em dash anywhere (on screen, code, comments, docs).
- The wordmark is always the brand image, never typed, and only on light stages.
- Nothing under the app's `src/`, `public/` or root config changes. `promo-video/` has its own `package.json`.
- Every dependency has a stated reason in `promo-video/README.md`.

## File Structure

```
promo-video/
  package.json, package-lock.json, tsconfig.json, remotion.config.ts, .gitignore, README.md
  public/brand/            logo and wordmark copied from the app
  public/screens/          captures written by scripts/capture-screens.mjs
  public/spots/            spot photos used by recreated cards
  scripts/capture-screens.mjs   drives the dev server with Playwright and an emulated GPS position
  scripts/cue-sheet.ts          writes out/SFX_CUES.md and out/SFX_CUES.csv from the timeline
  scripts/check-timeline.ts     node --test: scenes cover every frame, cues in range and sorted
                                (not *.test.ts: the app's root Vitest run would collect it and fail)
  src/index.ts             registerRoot
  src/Root.tsx             the HarayaPromo composition
  src/Video.tsx            stacks the scenes as Sequences from the timeline
  src/timeline.ts          FPS, size, scene table, beats, cue list (no imports)
  src/theme.ts             color tokens, radii, shadows, gradients
  src/fonts.ts             Plus Jakarta Sans loading
  src/lib/motion.ts        easings, springs, progress helpers
  src/components/          Stage, Words, Typewriter, GlassCard, Chip, Cursor, Phone, Aya, Ripples, icons
  src/scenes/              one file per scene
```

### Task 1: Scaffold and install

**Files:** Create `promo-video/package.json`, `tsconfig.json`, `remotion.config.ts`, `.gitignore`, `src/index.ts`,
`src/Root.tsx`.

- [ ] `package.json` pins `remotion`, `@remotion/cli`, `@remotion/google-fonts`, `@remotion/paths` at 4.0.530,
  `react` and `react-dom` at the app's 19.2.x, `lucide-react` at the app's major, and `typescript` 6 with
  `@types/react`.
- [ ] `remotion.config.ts` aliases `@haraya` to `../src` and resolves `react`, `react-dom` and
  `react/jsx-runtime` to the video's own copies, so the imported app components share one React.
- [ ] Run `npm install`, then `npx remotion versions` (all 4.0.530) and `npx tsc --noEmit` (0 errors).

### Task 2: Timeline and cue sheet

**Files:** Create `src/timeline.ts`, `scripts/cue-sheet.ts`, `scripts/check-timeline.ts`.

**Interfaces (produces):**
- `FPS = 60`, `WIDTH = 1920`, `HEIGHT = 1080`, `TOTAL_FRAMES`.
- `SCENES: Record<SceneId, { from: number; duration: number; beats: Record<string, number> }>`, beats relative to
  the scene's `from`.
- `CUES: { frame: number; kind: CueKind; note: string; length?: number }[]` built from scene beats.
- `toTimecode(frame: number): string` as `MM:SS:FF` and `toSeconds(frame)`.

- [ ] Write `scripts/check-timeline.ts` first: every frame from 0 to `TOTAL_FRAMES - 1` is inside at least one scene,
  scenes are sorted by `from`, the last scene ends exactly at `TOTAL_FRAMES`, every beat is inside its scene,
  cues are sorted and inside `[0, TOTAL_FRAMES)`, `toTimecode(61) === '00:01:01'`.
- [ ] Run `node --test scripts/check-timeline.ts` and see it fail (module missing).
- [ ] Write `src/timeline.ts`, run the test again, expect all pass.
- [ ] Write `scripts/cue-sheet.ts`; run `node scripts/cue-sheet.ts`; check both files list every cue with timecode.

### Task 3: Capture real screens

**Files:** Create `scripts/capture-screens.mjs`; output `public/screens/*.jpg`.

- [ ] Start the dev server (`haraya-dev`, port 5173). The script opens `#/tab/...` routes at 390x844, device scale 3,
  with `haraya_welcomed`, `haraya_tour_done` and `haraya_install_offered` set so no first-run sheet covers the
  screen, and a GPS position emulated in Digos near Green Coffee.
- [ ] Capture: Discover, the mood finder before and after a mood is chosen, the map, the walking navigation, the
  check-in sheet, the running focus banner, and the Passport with a real Quick Stamp collected through the UI.
- [ ] Look at every capture. Anything that shows an error, a spinner or an empty state that was not intended is
  re-captured, never masked.

### Task 4: Foundations

**Files:** Create `src/theme.ts`, `src/fonts.ts`, `src/lib/motion.ts`, `src/components/*`.

**Interfaces (produces):**
- `DarkStage`, `LinenStage` (full-frame backgrounds, drift driven by frame).
- `Words({ text, at, stagger?, size, weight?, color?, accent?: string[], align? })`: word-by-word rise out of blur.
- `Typewriter({ text, at, perChar?, caret? , style })`.
- `GlassCard({ style, children })`, `Chip({ label, icon?, on?: number, tone?: 'light' | 'dark' })`.
- `Cursor({ keys: { at: number; x: number; y: number }[], taps: number[] })`: eased path, press squish, tint ripple.
- `Phone({ src?, width, children })`: the brand line-art frame around a 390x844 screen.
- `Aya({ pose, size, at, bob? })`: the app's `AyaMascot` with a frame-driven pop-in and bob.

- [ ] Build a `Sandbox` composition that shows each component, render a still, review it.

### Tasks 5 to 11: Scenes

One task per scene file under `src/scenes/`, each reading its beats from `SCENES`. Acceptance for each: a still at
every beat renders with no error, copy matches the spec, no dash or emoji, text stays inside a 96 px safe margin.

- [ ] 5. `Hook.tsx` and `Reveal.tsx` (0:00 to 0:12).
- [ ] 6. `Promise.tsx` (0:12 to 0:20).
- [ ] 7. `Mood.tsx` (0:20 to 0:31).
- [ ] 8. `Walk.tsx` (0:31 to 0:40).
- [ ] 9. `Focus.tsx` and `Passport.tsx` (0:40 to 0:54).
- [ ] 10. `Owners.tsx` (0:54 to 1:05).
- [ ] 11. `Community.tsx` and `EndCard.tsx` (1:05 to the end).

### Task 12: Assemble, render, verify

- [ ] `src/Video.tsx` stacks every scene as a `Sequence` at its `from`; later scenes draw over earlier ones during
  their entrance.
- [ ] Render stills at every scene boundary, then the full video:
  `npx remotion render HarayaPromo out/haraya-promo.mp4 --codec h264 --crf 16`.
- [ ] `npx remotion ffprobe out/haraya-promo.mp4`: 1920x1080, 60 fps, duration equals `TOTAL_FRAMES / 60`, no audio.
- [ ] Extract one frame per scene from the MP4 and review them.
- [ ] `node scripts/cue-sheet.ts` for the final cue sheet.

### Task 13: Repo gates and records

- [ ] Root: `npm run map:code` then `npm run map:code:check`, `npm run lint`, `npm test`, `npm run build`.
- [ ] `promo-video/README.md`: how to preview, render and re-capture, and why each dependency is there.
- [ ] Journal entry in `journal/2026-09-30.md` with the verification output.
