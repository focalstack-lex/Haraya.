# Haraya promo video: design

Approved by Lex on 2026-09-30. A short product video for coffee lovers and cafe owners, in the motion style of
the Zelios "Best SaaS Product Demo Video | Teamble" reference (youtu.be/xNUx-rMGvvw), dressed in Haraya's brand.
Lex adds the sound effects, so the video ships silent with a cue sheet.

## Decisions

| Question | Decision |
| --- | --- |
| Palette | Haraya warm brand: linen, peach, caramel, espresso. Not the reference's violet and pink |
| Audience | Coffee lovers first, then a short segment for cafe and study spot owners (Place Portal) |
| Format | 1920x1080, 60 fps, about 75 s, H.264 MP4, no audio track |
| Tool | Remotion (React rendered to MP4 locally) in a self-contained `promo-video/` folder |

## Style translation

What the reference does, and the Haraya version of it:

| Reference | Haraya |
| --- | --- |
| Near-black navy stage with a violet radial glow | River Styx `#13191F` stage with a warm roast and steam glow |
| Off-white stage with pink, violet and blue blurred blobs | Linen `#FAF5EB` stage with peach `#FFE9CA`, coffee `#FFC183`, steam `#E7AC67` and tan blobs |
| Keywords filled with a pink to violet gradient | Keywords filled steam to tint (`#E7AC67` to `#906D4B`) on dark, tint to roast on linen |
| Word-by-word reveals, a typing caret, light plus bold weight mixes | Same, in Plus Jakarta Sans (the app's font), 300 to 800 |
| Glass UI cards recreated in vector | Surface `#FFFDF9` cards with the app's radii (14, 20, 28) and `--shadow-card` |
| Purple hand cursor with click squish | Ink hand cursor with a tint ripple on each tap |
| Large product panels tilting up in 3D, push-in zooms | The brand's line-art phone tilting up in 3D, push-ins on the detail that matters |
| Logo and tagline end card | The real logo (never retyped), haraya.space, Aya raising her cup |

## Storyboard

| Time | Scene | Content |
| --- | --- | --- |
| 0:00 | Hook, dark | "Not just the closest cafe." Glass chips: a free plug, a quiet table, a door that is still open |
| 0:07 | Reveal | Caret types "Introducing", iris wipe to linen, the logo resolves out of blur, Aya waves (`welcome`) |
| 0:12 | Promise | "Find your daily cup in Davao." Scrolling line of what it finds, an "Open now" pill in concentric ripples |
| 0:20 | Mood finder | "Tell Aya how you feel." Mood chips, the cursor taps one, Aya (`mood`), the phone rises with the app's real picks |
| 0:31 | Walk there, dark | A dotted route draws from the blue "You" dot to the cafe, then the real in-app walking navigation |
| 0:40 | Check in and focus | "You are at Green Coffee", tap Start Focus Session, the button morphs into the focus banner, the timer races |
| 0:48 | Passport | A stamp slams onto a page of ghost stamps for the real Digos spots, then the Passport screen |
| 0:54 | Owners, dark | "Own a cafe or study spot?" Verified listing, owner editor (hours, Wi-Fi and plug chips, cover photo, listing numbers), "We check the permit number before a listing goes live." |
| 1:05 | Community | "Know a hidden spot? Add it for everyone." A pin drops |
| 1:09 | End card, linen | Logo, "Your next cup is close.", "Free, and nothing to install.", haraya.space, the cursor clicks Open Haraya, Aya (`clink`) |

## Honesty rules

- Every feature and every line of on-screen copy exists in the app or on the landing page today.
- Phone screens are captures of the running app, driven by a script with an emulated GPS position.
- No invented stats, results, ratings or testimonials. The owner scene uses a generic "Your Cafe" listing with
  sample numbers, so it reads as a demo and never as a real business's figures.
- The wordmark is the brand image, placed only on light stages, as `BrandLogo` does.

## Architecture

- `promo-video/` is its own npm project (own `package.json`, lockfile, `tsconfig.json`, `.gitignore`). Nothing in the
  app changes; the root code map is regenerated so its CI check stays current.
- `src/timeline.ts` is the single source of scene timing and sound cues. It has no imports, so the cue sheet
  script and the video read the same numbers.
- Scenes are one file each under `src/scenes/`; shared pieces (stages, kinetic text, typewriter, glass card,
  chip, cursor, phone frame) live under `src/components/`.
- Aya and the passport stamp are imported from the app (`../src/components/...`) through a webpack alias, with React
  pinned to the video's copy so there is one React at runtime. Idle motion is driven by the frame, not CSS.
- `scripts/capture-screens.mjs` drives the dev server with the root Playwright and writes `public/screens/`.
- `scripts/cue-sheet.ts` writes `out/SFX_CUES.md` and `out/SFX_CUES.csv` (timecode, frame, cue, note).
- Renders go to `out/` (gitignored).

## Verification

- `tsc --noEmit` clean in `promo-video/`.
- A still of every scene reviewed before the full render.
- Full render, then `remotion ffprobe`: 1920x1080, 60 fps, expected duration, no audio stream.
- Frames sampled from the MP4 at every scene and checked by eye.
- Repo gates unchanged: `npm run lint`, `npm run map:code:check`, `npm test`, `npm run build`.
- No emoji and no en or em dash in any on-screen text or file.

## Out of scope

Audio of any kind, voiceover, a vertical 9:16 cut, localization. Each can follow from the same timeline.
