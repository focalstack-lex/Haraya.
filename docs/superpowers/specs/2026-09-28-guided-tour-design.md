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
| 1 | `search` | Hi, I'm Aya. Let me show you around. Search for a cafe, an area like Poblacion, or something like quiet or Wi-Fi. | Next |
| 2 | `city` | Pick your city. Discover, the map and Most saved all follow it. | Next |
| 3 | `mood` (mood finder card) | Not sure where to go? Tap how you feel and Haraya suggests a cafe that fits, near you. | Next |
| 4 | `save` (first cafe card bookmark) | Save a spot you would try. Tap the bookmark. | Tapping the real bookmark |
| 5 | `tab-profile` | Your saves, stamps and diary live in Passport. | Next |
| 6 | `tab-map` | See every spot on the map. Tap Directions on any spot and Haraya can walk you there. | Next |
| 7 | `tab-submit` | Know a quiet corner that is not on Google Maps? Add it here. Enjoy your next cup. | Done |

The `categories` step was removed on 2026-09-29 together with the amenity shortcut row on Discover.

When several elements share a `data-tour` value (the bottom tab bar on phones, the top bar tabs on desktop), the
tour uses the one that is rendered and visible. A step whose target is missing is skipped.

## Look and motion

- Dim layer at 55% ink with a rounded cutout (8px padding) around the target.
- Callout: white card, 20px radius, soft shadow, step text 15px, "n of 7" in tabular figures, tint Next or Done,
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
- Tags: `data-tour` on FeedSearchBar, CityMenu, MoodCard, the first CafeGrid bookmark, and tab buttons in
  BottomTabBar and NavigationHeader.
- App: `isTourOpen` state, started from welcome Get started, from Profile's replay row, and on the first
  sign-in on a device when the done flag is not yet set (`handleAuthenticated`).
- Aya: every step carries an `aya` pose shown at 60px beside the callout text. She introduces herself on step 1
  (`welcome`), uses `mood` on the mood step, `drops` on the save step, waves goodbye (`welcome`) on the last, and
  holds her cup elsewhere.

## Verification

No unit test runner exists in the project, so the tour is proven by a Playwright drive at 375px and 1440px:
start from a fresh profile, tap Get started, walk all seven steps (tapping the real bookmark on step 4), confirm the
saved count rises, the flag is stored, the tour does not reappear on reload, Skip works, and no page or console
errors occur. Plus `tsc -b`, `oxlint`, `vite build`, `impeccable detect`.

## Update 2026-09-29: discovery pivot

The tour now has 8 steps. Copy follows the new vocabulary (spots, Passport, study shortcuts), the save step uses
Aya's `holding-cup` pose, the map step mentions in-app directions, and a final step targets the Add a Spot tab
(`data-tour="tab-submit"`) with Aya waving goodbye.
