# CODE_MAP: Haraya Agent Navigation Map

Generated 2026-09-28 : commit 48a8744 : fingerprint 81ba2c947812bc74

Regenerate with `npm run map:code`; verify staleness with `npm run map:code:check`.
Never hand-edit: the generator owns this file.

All Davao Region content: cafes, roasteries, bean lots, drop batches, trails, and Cup Check posts.

## root/

- `index.html` (31 lines) : . module: index.html
- `scripts/generate-code-map.mjs` (212 lines) : One-line purpose per file, inferred from its path and leading doc comment.
- `scripts/seed-supabase.ts` (130 lines) : scripts module: seed-supabase
- `src/App.tsx` (786 lines) : Storage can throw in private windows or with blocked site data; the welcome sheet is a convenience.
  - L54 : SharedList
  - L80 : App
- `src/index.css` (643 lines) : src entry point
- `src/main.tsx` (11 lines) : src entry point
- `vite.config.ts` (15 lines) : . module: vite.config

## src/components/admin/

- `src/components/admin/AdminDashboard.tsx` (243 lines) : Control Room: verification queue, venue verification toggles, catalog pulse.

## src/components/auth/

- `src/components/auth/ApplicationStatusView.tsx` (85 lines) : One label and value row inside the grouped application list.
- `src/components/auth/AuthView.tsx` (335 lines) : Roaster Suite entry: sign in, or a three-step verified roaster registration.
  - L12 : AuthMode
  - L14 : AuthViewProps
  - L24 : AuthView

## src/components/cafe/

- `src/components/cafe/BeanDetailModal.tsx` (201 lines) : Grouped list on the white sheet: the linen canvas tone lets the inset group read as a group.
- `src/components/cafe/CafeDetailModal.tsx` (338 lines) : Grouped list on the white sheet: the linen canvas tone lets the inset group read as a group.
  - L52 : AmenityBadges
  - L74 : MenuSheet
  - L102 : CafeDetailModalProps
  - L116 : CafeDetailModal
- `src/components/cafe/RateCafeModal.tsx` (134 lines) : src/components/cafe module: RateCafeModal

## src/components/common/

- `src/components/common/AddToListSheet.tsx` (105 lines) : List picker used by the cafe and bean modals and the saved view.
- `src/components/common/AyaMascot.tsx` (292 lines) : One pose per surface, so Aya reads as a character rather than a repeated sticker:
- `src/components/common/BrandLogo.tsx` (36 lines) : Haraya logo cut from the brand master (Haraya Files/LOGO.webp) with the background keyed out,
- `src/components/common/CustomIcons.tsx` (185 lines) : Haraya Custom Icon Set: high-precision vector icons tailored for the Davao
- `src/components/common/FormControls.tsx` (254 lines) : Shared form primitives for Haraya: an iOS-style sheet (bottom sheet with a
- `src/components/common/ImageUploadField.tsx` (81 lines) : File input that stores the image as a dataURL with type and size validation.
- `src/components/common/LargeTitle.tsx` (46 lines) : iOS large title: the first thing on every primary page, left aligned.
- `src/components/common/WelcomeModal.tsx` (161 lines) : What the app does, stated plainly: one row per real surface.

## src/components/community/

- `src/components/community/CommentsSheet.tsx` (75 lines) : Comments for a cup post; seed posts are read-only, browser posts are live.
- `src/components/community/CupCheckCard.tsx` (114 lines) : Community cup post: photo with floating tasting-tag pins, brew method, likes.
- `src/components/community/FlavorPinPlacer.tsx` (132 lines) : Tap the uploaded photo to drop tasting-tag pins, then name each pin. Pins
- `src/components/community/NewPostSheet.tsx` (143 lines) : Compose a Cup Check: photo, caption, cafe tag, brew method, and flavor pins.

## src/components/drops/

- `src/components/drops/BeanDropCard.tsx` (159 lines) : Vault card for one roast batch: one primary action (reserve), one Remind me disclosure that holds
- `src/components/drops/BeanReservationModal.tsx` (139 lines) : Direct reservation: pre-order whole bean bags or drip packs from the roaster.
- `src/components/drops/DropCalendarStrip.tsx` (79 lines) : 14-day horizontal calendar of roast batches. Each cell shows the weekday,
- `src/components/drops/DropCountdownTimer.tsx` (52 lines) : Live countdown digits (DD:HH:MM:SS) that tick once per second. `onDark` swaps to cream text for photo overlays.
- `src/components/drops/DropsView.tsx` (98 lines) : Bean Drops: 14-day roast calendar on top, micro-lot vault under it.

## src/components/feed/

- `src/components/feed/BeanGrid.tsx` (113 lines) : src/components/feed module: BeanGrid
- `src/components/feed/CafeGrid.tsx` (163 lines) : src/components/feed module: CafeGrid
- `src/components/feed/CategoryIconRow.tsx` (61 lines) : Shortcut categories: 'beans' switches the catalog to the bean vault, the rest toggle a cafe filter.
- `src/components/feed/EditorialHero.tsx` (162 lines) : Featured shelf built from the live catalog: the next open roast drops first, then verified
- `src/components/feed/FeedControls.tsx` (151 lines) : src/components/feed module: FeedControls
- `src/components/feed/FeedSearchBar.tsx` (38 lines) : iOS search field: filled, borderless, with the round clear button once text is entered.
- `src/components/feed/PopularPicksSection.tsx` (72 lines) : "Most saved" shelf: the venues Haraya users bookmark most, from real save counts.
- `src/components/feed/VibeFilterBar.tsx` (68 lines) : Collapsible amenity and vibe chip rail: expands when toggled or active.

## src/components/layout/

- `src/components/layout/BottomTabBar.tsx` (49 lines) : Persistent mobile bottom navigation (hidden while a detail modal is open).
- `src/components/layout/FooterSection.tsx` (103 lines) : Global footer: light canvas with a hairline top, the city directory and roaster links.
- `src/components/layout/NavigationDrawer.tsx` (184 lines) : Leading icon of a grouped row: a 30px tinted rounded square.
- `src/components/layout/NavigationHeader.tsx` (207 lines) : The portal tab is shared by the sign-in view, roaster dashboard, and admin panel.

## src/components/map/

- `src/components/map/DavaoCoffeeMap.tsx` (436 lines) : Escapes catalog text before it is placed into Leaflet tooltip HTML.
  - L28 : DavaoCoffeeMapProps
  - L43 : DavaoCoffeeMap

## src/components/moodFinder/

- `src/components/moodFinder/MoodCard.tsx` (53 lines) : Discover entry point for the mood finder: one question and the four most common moods.
- `src/components/moodFinder/MoodFinderSheet.tsx` (352 lines) : The mood finder: say how you feel and what you need, get three explained picks and a route.
  - L16 : MoodFinderSheetProps
  - L39 : MoodFinderSheet
- `src/components/moodFinder/MoodResultCard.tsx` (83 lines) : One suggestion: why it fits (real catalog facts), how far, how long it stays open, what to order.
- `src/components/moodFinder/moods.ts` (44 lines) : Moods rank cafes softly; must-haves filter strictly. See docs/superpowers/specs/2026-09-28-mood-finder-design.md.
- `src/components/moodFinder/moodStorage.ts` (25 lines) : Remembers the last chosen must-haves. Storage can throw or hold stale values, so reads validate.
- `src/components/moodFinder/parseQuery.test.ts` (50 lines) : src/components/moodFinder module: parseQuery.test
- `src/components/moodFinder/parseQuery.ts` (85 lines) : Deterministic reading of a typed request ("quiet place to study, not too pricey, near Matina").
- `src/components/moodFinder/scoreCafes.test.ts` (160 lines) : src/components/moodFinder module: scoreCafes.test
- `src/components/moodFinder/scoreCafes.ts` (233 lines) : The mood finder's matcher. Pure: the same catalog, request and context always give the same
- `src/components/moodFinder/useLocation.ts` (35 lines) : Asks for the visitor's position only when request() is called (the "Near me" tap).
- `src/components/moodFinder/weather.ts` (63 lines) : Current Davao weather from Open-Meteo (free, no key). Fixed city coordinates, never the

## src/components/roaster/

- `src/components/roaster/BeanForm.tsx` (238 lines) : Neutral placeholder until the roaster uploads a real bag photo.
- `src/components/roaster/RoasterDashboard.tsx` (403 lines) : Roaster Suite: overview analytics, bean inventory, roast schedule, menu, inbox.
  - L12 : RoasterDashboardProps
  - L18 : DashboardTab
  - L23 : RoasterDashboard
- `src/components/roaster/RoasteryStorefront.tsx` (194 lines) : Public roastery storefront: brand header, bean shelf, drop schedule, menu, hours.
- `src/components/roaster/RoastScheduleTab.tsx` (199 lines) : Roast scheduling: create batches, watch countdowns, mark sold out.

## src/components/tour/

- `src/components/tour/GuidedTour.tsx` (294 lines) : Space the sticky nav bar and the bottom tab bar cover, so targets are scrolled clear of them.
- `src/components/tour/tourSteps.ts` (59 lines) : First-visit guided tour steps. Each step highlights the element tagged with the matching
- `src/components/tour/tourStorage.ts` (20 lines) : Remembers that the first-visit tour was finished or skipped. Storage can throw in private

## src/config/

- `src/config/ecosystem.ts` (14 lines) : Sister ecosystem bridge between Haraya (coffee) and Habi (fashion).
- `src/config/supabase.ts` (16 lines) : Haraya Supabase Client.

## src/data/

- `src/data/trails.ts` (8 lines) : Curated coffee trails. Empty until real trails are set up: each entry lists at least two cafe ids that

## src/hooks/

- `src/hooks/useServiceVersions.ts` (28 lines) : Subscriber-version hooks: each service exposes a monotonically increasing

## src/services/

- `src/services/authService.ts` (345 lines) : Browser account layer for the Roaster Suite. Accounts, applications, and the
  - L25 : StoredApplication
  - L32 : SignUpInput
  - L40 : StoredCredential
  - L45 : CredentialStore
  - L54 : derive
  - L60 : hashPassword
  - L65 : verifyPassword
  - L78 : readJson
  - L87 : writeJson
  - L91 : notify
  - L96 : makeAccountId
  - L105 : ensureSeedAdmin
  - L126 : authService
- `src/services/catalogService.ts` (339 lines) : Catalog layer over roaster-created and admin-moderated records kept in
  - L28 : CafeMetrics
  - L35 : MetricsStore
  - L45 : readJson
  - L54 : writeJson
  - L58 : notify
  - L63 : makeCatalogId
  - L71 : deriveStatus
  - L76 : catalogService
- `src/services/communityService.ts` (149 lines) : Cup Check community layer: browser-created posts, likes, and comments. Likes are stored per browser (no accounts needed to
- `src/services/roasterService.ts` (115 lines) : Roaster-facing facade over the catalog: everything an approved roaster or
- `src/services/userPrefsService.ts` (367 lines) : Buyer-side preferences kept per browser: saved cafes and beans, custom coffee
  - L20 : CafeRating
  - L27 : CustomList
  - L35 : SharedList
  - L45 : readJson
  - L54 : writeJson
  - L58 : notify
  - L63 : makeListId
  - L67 : userPrefsService

## src/types/

- `src/types/auth.ts` (36 lines) : Roaster, cafe owner, and admin accounts for the Haraya Roaster Suite.
- `src/types/coffee.ts` (251 lines) : Haraya domain model: Davao Region specialty cafes, micro-roasteries, single-origin

## src/utils/

- `src/utils/calendar.test.ts` (40 lines) : src/utils module: calendar.test
- `src/utils/calendar.ts` (151 lines) : Calendar and clock helpers shared by roast drops, cafe hours, and the
- `src/utils/geo.ts` (54 lines) : Distance and directions helpers for the coffee map and trails.
- `src/utils/router.ts` (68 lines) : Hash routes so cafes, beans, roasteries, drops, and shared lists have shareable
- `src/utils/weekdays.ts` (13 lines) : Canonical weekday iteration order for hours tables.

## src/views/

- `src/views/CommunityView.tsx` (74 lines) : Cup Check community feed: one-to-three column masonry of today's brews.
- `src/views/LegalView.tsx` (181 lines) : Privacy Notice and Terms. Statements of fact describe what the code does today; anything that needs a
- `src/views/ProfileView.tsx` (435 lines) : Leading icon of a grouped row: a 30px tinted rounded square.
  - L23 : ProfileSection
  - L25 : ProfileViewProps
  - L66 : ProfileView
- `src/views/SavedView.tsx` (320 lines) : Tasting journal: bookmarked cafes and beans, drop alerts, custom shareable lists.
  - L13 : SavedTab
  - L15 : SavedViewProps
  - L25 : SavedView
- `src/views/SharedListView.tsx` (122 lines) : Read-only view of a shared custom list. Items ride in the URL, so the link

