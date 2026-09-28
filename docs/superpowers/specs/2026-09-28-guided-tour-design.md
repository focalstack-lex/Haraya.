# Guided tour for new visitors

Date: 2026-09-28. Status: approved by Lex in conversation (approach A, steps, look and behavior, guide arrow).

## Goal

A first-visit walkthrough that shows new visitors where to tap on Discover and has them do the core action once:
save a cafe. They finish with something in Profile.

## Trigger

- Starts after the welcome sheet's **Get started**. "Continue as guest" and "Log in" do not start it.
- Finishing or skipping stores `haraya_tour_done` in localStorage (guarded, never throws); it does not auto-run again.
- Profile has a **Take the tour again** row that replays it from Discover.

## Steps

| # | Target (`data-tour`) | Callout | Advances by |
| --- | --- | --- | --- |
| 1 | `search` | Search anything: a cafe, a bean, an origin like Mt. Apo, or a note like chocolate. | Next |
| 2 | `city` | Pick your city. Discover, the map and Most saved all follow it. | Next |
| 3 | `categories` | Shortcuts. Work finds laptop-friendly cafes, Pour-Over finds hand-brew bars. | Next |
| 4 | `save` (first cafe card bookmark) | Save a cafe you would try. Tap the bookmark. | Tapping the real bookmark |
| 5 | `tab-profile` | Everything you save lives in Profile. | Next |
| 6 | `tab-map` | See every cafe on the map, plus walking trails between them. | Done |

When several elements share a `data-tour` value (the bottom tab bar on phones, the top bar tabs on desktop), the
tour uses the one that is rendered and visible. A step whose target is missing is skipped.

## Look and motion

- Dim layer at 55% ink with a rounded cutout (8px padding) around the target.
- Callout: white card, 20px radius, soft shadow, step text 15px, "n of 6" in tabular figures, tint Next or Done,
  plain Skip. Below the target, or above when there is no room. Phones: full width minus 16px; desktop max 320px.
- Guide arrow: drawn brown arrow in the logo's line style. It flies between targets with a spring (about 0.6s)
  while the cutout glides, then nudges toward the target every 1.4s. It is the only repeating animation.
- Reduced motion: fades only; the arrow appears in place without flying or nudging.

## Behavior

- Taps outside the callout are blocked on every step. On step 4 the cutout lets taps through to the bookmark only.
- Focus moves to the callout; Enter advances, Escape skips; step text is announced (`aria-live`).
- The cutout, arrow and callout follow the target on scroll, resize and rotation. Off-screen targets are scrolled
  into view before the step shows.

## Units

- `src/components/tour/tourSteps.ts`: step list (target, text, advance mode).
- `src/components/tour/tourStorage.ts`: guarded read and write of the done flag.
- `src/components/tour/GuidedTour.tsx`: overlay, cutout, blockers, arrow, callout; props `isOpen`, `onFinish`.
- Tags: `data-tour` on FeedSearchBar, CityMenu, CategoryIconRow, the first CafeGrid bookmark, and tab buttons in
  BottomTabBar and NavigationHeader.
- App: `isTourOpen` state, started from welcome Get started and from Profile's replay row.

## Verification

No unit test runner exists in the project, so the tour is proven by a Playwright drive at 375px and 1440px:
start from a fresh profile, tap Get started, walk all six steps (tapping the real bookmark on step 4), confirm the
saved count rises, the flag is stored, the tour does not reappear on reload, Skip works, and no page or console
errors occur. Plus `tsc -b`, `oxlint`, `vite build`, `impeccable detect`.
