# Haraya promo video

A 75 second product video for Haraya, for coffee lovers and cafe owners: 1920x1080, 60 fps, H.264, no audio
track. It follows the motion style of the Zelios "Best SaaS Product Demo Video | Teamble" reference (kinetic type,
glass UI cards, a tapping cursor, 3D phones, push-ins, dark and light stages) in Haraya's own brand. Sound effects
are added in the edit, so the render ships silent with a cue sheet.

Design: `docs/superpowers/specs/2026-09-30-promo-video-design.md`. Plan: `docs/superpowers/plans/2026-09-30-promo-video.md`.

## Outputs

Rendered into `out/` (gitignored, re-create with the commands below):

- `out/haraya-promo.mp4`: the video.
- `out/SFX_CUES.md` and `out/SFX_CUES.csv`: every sound cue with its time, 60 fps timecode, frame, scene, kind,
  length and what happens on screen, plus a suggested sound per cue kind.

## Commands

Run from this folder.

```bash
npm install
npm run studio      # preview and scrub in the browser
npm run render      # out/haraya-promo.mp4 (about 10 minutes on 16 threads: lossless frames, CRF 12)
npm run cues        # out/SFX_CUES.md and .csv
npm test            # timeline checks: every frame covered, beats inside scenes, cues in range
npm run typecheck
npm run stills -- 600 1200          # review stills at those frames, into out/stills
npm run stills -- --scene mood      # a still at every beat of one scene
npm run capture     # re-capture the app screens from the running app (see below)
```

`npm run capture` expects the app's dev server at `http://localhost:5175`: in the app folder run
`npm run dev -- --port 5175`, or point it elsewhere with the `HARAYA_URL` environment variable.

For an edit suite that prefers ProRes: `npx remotion render HarayaPromo out/haraya-promo.mov --codec prores --prores-profile hq`.

## How it fits together

- `src/timeline.ts` is the one source of timing: scene starts and lengths, the beats inside each scene, the
  background stage changes, and the sound cues built from those beats. Change a beat, render, run `npm run cues`,
  and the sheet still lines up with the picture.
- `src/components/Backdrop.tsx` draws the River Styx or linen stage under every scene and runs the iris, wipe and
  sheet-rise changes. Scenes are transparent and may overlap.
- `src/scenes/` holds one file per scene. Recreated app UI is built at app pixel sizes and scaled, so its type,
  radii and shadows keep the app's proportions.
- Aya, the passport stamp and the custom icons are the app's own components, imported from `../src` through the
  `@haraya` alias in `webpack-override.ts` (React is pinned to this project's copy so there is one React).
- `public/screens/` are captures of the running app made by `scripts/capture-screens.mjs`: a signed-out phone at
  3x, Manila time pinned to an afternoon, and an emulated GPS position in Digos. Signed out, visits stay in the
  throwaway browser and nothing is written to the database. Re-capture when those app screens change.

## Rules the video keeps

- Every feature and line of copy exists in the app or on the landing page. No invented stats, results or reviews.
- The owner segment uses a generic "Your Cafe" listing with sample numbers, and a drawn cafe instead of a photo,
  so no real shop's figures or pictures are shown as someone else's listing.
- The wordmark is always the brand image, never retyped. No emoji and no en or em dash anywhere.

## Dependencies

| Package | Why |
| --- | --- |
| `remotion`, `@remotion/cli` | Renders the React scenes to video, frame by frame |
| `@remotion/google-fonts` | Loads Plus Jakarta Sans, the app's own face, before any frame renders |
| `@remotion/paths` | Draws the walking route along its path |
| `@remotion/bundler`, `@remotion/renderer` | Used by `scripts/stills.mjs` to render review stills from one bundle |
| `lucide-react` | The app's icon set, same version as the app |
| `react`, `react-dom` | Same version as the app, so the imported app components behave the same |
| `typescript`, `@types/react`, `@types/node` | Type checking, same versions as the app |

Playwright for `npm run capture` comes from the app's own dev dependencies.

## Rights to check before publishing

- Remotion (see `node_modules/remotion/LICENSE.md`) is free, commercial use included, for individuals, non-profits
  and for-profit companies with up to 3 employees; a larger for-profit company needs a Remotion Company License.
- The spot photos (in the captures and the map pins) come from the spots' listings. Get the owners' permission
  before using the video in paid ads.
- The map captures carry their OpenStreetMap attribution on screen; keep it visible or credit
  "© OpenStreetMap contributors" in the description.
- Plus Jakarta Sans is under the SIL Open Font License and Lucide under ISC; both allow use in a video.
