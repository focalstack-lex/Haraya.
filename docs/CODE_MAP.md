# CODE_MAP: Haraya Agent Navigation Map

Generated 2026-09-28 : commit aa8ac17 : fingerprint 36135dda16ca205a

Regenerate with `npm run map:code`; verify staleness with `npm run map:code:check`.
Never hand-edit: the generator owns this file.

All Davao Region content: cafes, roasteries, bean lots, drop batches, trails, and Cup Check posts.

## root/

- `index.html` (31 lines) : . module: index.html
- `scripts/generate-code-map.mjs` (212 lines) : One-line purpose per file, inferred from its path and leading doc comment.
- `src/App.tsx` (720 lines) : Storage can throw in private windows or with blocked site data; the welcome sheet is a convenience.
  - L49 : SharedList
  - L75 : App
- `src/index.css` (577 lines) : src entry point
- `src/main.tsx` (11 lines) : src entry point
- `vite.config.ts` (15 lines) : . module: vite.config

## src/components/admin/

- `src/components/admin/AdminDashboard.tsx` (249 lines) : Control Room: verification queue, venue verification toggles, catalog pulse.

## src/components/auth/

- `src/components/auth/ApplicationStatusView.tsx` (91 lines) : One label and value row inside the grouped application list.
- `src/components/auth/AuthView.tsx` (337 lines) : Roaster Suite entry: sign in, or a three-step verified roaster registration.
  - L13 : AuthMode
  - L15 : AuthViewProps
  - L25 : AuthView

## src/components/cafe/

- `src/components/cafe/BeanDetailModal.tsx` (201 lines) : Grouped list on the white sheet: the linen canvas tone lets the inset group read as a group.
- `src/components/cafe/CafeDetailModal.tsx` (324 lines) : Grouped list on the white sheet: the linen canvas tone lets the inset group read as a group.
  - L52 : AmenityBadges
  - L74 : MenuSheet
  - L102 : CafeDetailModalProps
  - L116 : CafeDetailModal
- `src/components/cafe/RateCafeModal.tsx` (134 lines) : src/components/cafe module: RateCafeModal

## src/components/common/

- `src/components/common/AddToListSheet.tsx` (105 lines) : List picker used by the cafe and bean modals and the saved view.
- `src/components/common/BrandLogo.tsx` (36 lines) : Haraya logo cut from the brand master (Haraya Files/LOGO.webp) with the background keyed out,
- `src/components/common/CustomIcons.tsx` (185 lines) : Haraya Custom Icon Set: high-precision vector icons tailored for the Davao
- `src/components/common/FormControls.tsx` (254 lines) : Shared form primitives for Haraya: an iOS-style sheet (bottom sheet with a
- `src/components/common/ImageUploadField.tsx` (81 lines) : File input that stores the image as a dataURL with type and size validation.
- `src/components/common/LargeTitle.tsx` (46 lines) : iOS large title: the first thing on every primary page, left aligned.
- `src/components/common/WelcomeModal.tsx` (166 lines) : What the app does, stated plainly: one row per real surface.

## src/components/community/

- `src/components/community/CommentsSheet.tsx` (75 lines) : Comments for a cup post; seed posts are read-only, browser posts are live.
- `src/components/community/CupCheckCard.tsx` (114 lines) : Community cup post: photo with floating tasting-tag pins, brew method, likes.
- `src/components/community/FlavorPinPlacer.tsx` (132 lines) : Tap the uploaded photo to drop tasting-tag pins, then name each pin. Pins
- `src/components/community/NewPostSheet.tsx` (143 lines) : Compose a Cup Check: photo, caption, cafe tag, brew method, and flavor pins.

## src/components/drops/

- `src/components/drops/BeanDropCard.tsx` (142 lines) : Vault card for one roast batch: countdown, calendar sync, reminders, reserve.
- `src/components/drops/BeanReservationModal.tsx` (132 lines) : Direct reservation: pre-order whole bean bags or drip packs from the roaster.
- `src/components/drops/DropCalendarStrip.tsx` (79 lines) : 14-day horizontal calendar of roast batches. Each cell shows the weekday,
- `src/components/drops/DropCountdownTimer.tsx` (44 lines) : Live countdown digits (DD:HH:MM:SS) that tick once per second.
- `src/components/drops/DropsView.tsx` (93 lines) : Bean Drops: 14-day roast calendar on top, micro-lot vault under it.

## src/components/feed/

- `src/components/feed/BeanGrid.tsx` (111 lines) : src/components/feed module: BeanGrid
- `src/components/feed/CafeGrid.tsx` (172 lines) : src/components/feed module: CafeGrid
- `src/components/feed/CategoryIconRow.tsx` (61 lines) : Shortcut categories: 'beans' switches the catalog to the bean vault, the rest toggle a cafe filter.
- `src/components/feed/EditorialHero.tsx` (136 lines) : Featured shelf built from the live catalog: the next open roast drops first, then verified
- `src/components/feed/FeedControls.tsx` (151 lines) : src/components/feed module: FeedControls
- `src/components/feed/FeedSearchBar.tsx` (38 lines) : iOS search field: filled, borderless, with the round clear button once text is entered.
- `src/components/feed/PopularPicksSection.tsx` (72 lines) : "Most saved" shelf: the venues Haraya users bookmark most, from real save counts.
- `src/components/feed/VibeFilterBar.tsx` (68 lines) : Collapsible amenity and vibe chip rail: expands when toggled or active.

## src/components/layout/

- `src/components/layout/BottomTabBar.tsx` (49 lines) : Persistent mobile bottom navigation (hidden while a detail modal is open).
- `src/components/layout/FooterSection.tsx` (95 lines) : Global footer: light canvas with a hairline top, the city directory and roaster links.
- `src/components/layout/NavigationDrawer.tsx` (184 lines) : Leading icon of a grouped row: a 30px tinted rounded square.
- `src/components/layout/NavigationHeader.tsx` (207 lines) : The portal tab is shared by the sign-in view, roaster dashboard, and admin panel.

## src/components/map/

- `src/components/map/DavaoCoffeeMap.tsx` (340 lines) : Escapes catalog text before it is placed into Leaflet tooltip HTML.
  - L28 : DavaoCoffeeMapProps
  - L39 : DavaoCoffeeMap

## src/components/roaster/

- `src/components/roaster/BeanForm.tsx` (238 lines) : Inventory form for roaster-owned bean lots. Seeded records stay read-only.
- `src/components/roaster/RoasterDashboard.tsx` (403 lines) : Roaster Suite: overview analytics, bean inventory, roast schedule, menu, inbox.
  - L12 : RoasterDashboardProps
  - L18 : DashboardTab
  - L23 : RoasterDashboard
- `src/components/roaster/RoasteryStorefront.tsx` (194 lines) : Public roastery storefront: brand header, bean shelf, drop schedule, menu, hours.
- `src/components/roaster/RoastScheduleTab.tsx` (199 lines) : Roast scheduling: create batches, watch countdowns, mark sold out.

## src/components/tour/

- `src/components/tour/GuidedTour.tsx` (290 lines) : Space the sticky nav bar and the bottom tab bar cover, so targets are scrolled clear of them.
- `src/components/tour/tourSteps.ts` (43 lines) : First-visit guided tour steps. Each step highlights the element tagged with the matching
- `src/components/tour/tourStorage.ts` (20 lines) : Remembers that the first-visit tour was finished or skipped. Storage can throw in private

## src/config/

- `src/config/ecosystem.ts` (14 lines) : Sister ecosystem bridge between Haraya (coffee) and Habi (fashion).

## src/data/

- `src/data/mockBeans.ts` (297 lines) : src/data module: mockBeans
- `src/data/mockCafes.ts` (463 lines) : Standard 07:00 to 22:00 week used by most city cafes.
  - L35 : standardHours
  - L40 : lateNightHours
  - L53 : highlandHours
  - L84 : mockCafes
- `src/data/mockDrops.ts` (138 lines) : Roast batch drops over the next 14 days. Timestamps are generated relative to
- `src/data/mockPosts.ts` (122 lines) : Cup Check community posts with tasting tag pins placed on each photo.
- `src/data/mockTrails.ts` (37 lines) : src/data module: mockTrails

## src/hooks/

- `src/hooks/useServiceVersions.ts` (28 lines) : Subscriber-version hooks: each service exposes a monotonically increasing

## src/services/

- `src/services/authService.ts` (255 lines) : Browser-mock account layer for the Roaster Suite. Accounts, applications, and
- `src/services/catalogService.ts` (353 lines) : Catalog layer that merges the bundled mock dataset with roaster-created and
  - L30 : CafeMetrics
  - L38 : MetricsStore
  - L43 : readJson
  - L52 : writeJson
  - L56 : notify
  - L61 : hashSeed
  - L67 : makeCatalogId
  - L75 : deriveStatus
  - L80 : catalogService
- `src/services/communityService.ts` (141 lines) : Cup Check community layer: seed posts merged with browser-created posts,
- `src/services/roasterService.ts` (115 lines) : Roaster-facing facade over the catalog: everything an approved roaster or
- `src/services/userPrefsService.ts` (321 lines) : Buyer-side preferences kept per browser: saved cafes and beans, custom coffee
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

- `src/utils/calendar.ts` (128 lines) : Calendar and clock helpers shared by roast drops, cafe hours, and the
- `src/utils/geo.ts` (54 lines) : Distance and directions helpers for the coffee map and trails.
- `src/utils/router.ts` (68 lines) : Hash routes so cafes, beans, roasteries, drops, and shared lists have shareable
- `src/utils/weekdays.ts` (13 lines) : Canonical weekday iteration order for hours tables.

## src/views/

- `src/views/CommunityView.tsx` (74 lines) : Cup Check community feed: one-to-three column masonry of today's brews.
- `src/views/ProfileView.tsx` (433 lines) : Leading icon of a grouped row: a 30px tinted rounded square.
  - L23 : ProfileSection
  - L25 : ProfileViewProps
  - L66 : ProfileView
- `src/views/SavedView.tsx` (320 lines) : Tasting journal: bookmarked cafes and beans, drop alerts, custom shareable lists.
  - L13 : SavedTab
  - L15 : SavedViewProps
  - L25 : SavedView
- `src/views/SharedListView.tsx` (122 lines) : Read-only view of a shared custom list. Items ride in the URL, so the link

