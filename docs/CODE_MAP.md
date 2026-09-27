# CODE_MAP: Haraya Agent Navigation Map

Generated 2026-09-27 : commit uncommitted : fingerprint b679ba20e82d1c30

Regenerate with `npm run map:code`; verify staleness with `npm run map:code:check`.
Never hand-edit: the generator owns this file.

All Davao Region content: cafes, roasteries, bean lots, drop batches, trails, and Cup Check posts.

## root/

- `index.html` (30 lines) : . module: index.html
- `scripts/generate-code-map.mjs` (212 lines) : One-line purpose per file, inferred from its path and leading doc comment.
- `src/App.tsx` (579 lines) : src module: App
  - L41 : SharedList
  - L49 : App
- `src/index.css` (300 lines) : src entry point
- `src/main.tsx` (11 lines) : src entry point
- `vite.config.ts` (15 lines) : . module: vite.config

## src/components/admin/

- `src/components/admin/AdminDashboard.tsx` (249 lines) : Control Room: verification queue, venue verification toggles, catalog pulse.

## src/components/auth/

- `src/components/auth/ApplicationStatusView.tsx` (77 lines) : Pending or rejected state shown between sign-up and admin approval.
- `src/components/auth/AuthView.tsx` (298 lines) : Roaster Suite entry: sign in, or a three-step verified roaster registration.

## src/components/cafe/

- `src/components/cafe/BeanDetailModal.tsx` (161 lines) : Micro-lot detail: roast profile meters, tasting notes, and reservation CTA.
- `src/components/cafe/CafeDetailModal.tsx` (285 lines) : Full cafe detail: snap gallery, live open status, amenity grid, menu sheet,

## src/components/common/

- `src/components/common/AddToListSheet.tsx` (93 lines) : List picker used by the cafe and bean modals and the saved view.
- `src/components/common/CustomIcons.tsx` (82 lines) : Haraya Custom Icon Set: high-precision vector icons tailored for the Davao
- `src/components/common/FormControls.tsx` (194 lines) : Shared form primitives for Haraya: a mobile-first modal shell (bottom sheet
- `src/components/common/ImageUploadField.tsx` (73 lines) : File input that stores the image as a dataURL with type and size validation.

## src/components/community/

- `src/components/community/CommentsSheet.tsx` (67 lines) : Comments for a cup post; seed posts are read-only, browser posts are live.
- `src/components/community/CupCheckCard.tsx` (110 lines) : Community cup post: photo with floating tasting-tag pins, brew method, likes.
- `src/components/community/FlavorPinPlacer.tsx` (127 lines) : Tap the uploaded photo to drop tasting-tag pins, then name each pin. Pins
- `src/components/community/NewPostSheet.tsx` (125 lines) : Compose a Cup Check: photo, caption, cafe tag, brew method, and flavor pins.

## src/components/drops/

- `src/components/drops/BeanDropCard.tsx` (148 lines) : Vault card for one roast batch: countdown, calendar sync, reminders, reserve.
- `src/components/drops/BeanReservationModal.tsx` (129 lines) : Direct reservation: pre-order whole bean bags or drip packs from the roaster.
- `src/components/drops/DropCalendarStrip.tsx` (66 lines) : 14-day horizontal calendar of roast batches. Each cell shows the weekday,
- `src/components/drops/DropCountdownTimer.tsx` (43 lines) : Live countdown digits (DD:HH:MM:SS) that tick once per second.
- `src/components/drops/DropsView.tsx` (102 lines) : Bean Drops: 14-day roast calendar on top, micro-lot vault under it.

## src/components/feed/

- `src/components/feed/BeanGrid.tsx` (106 lines) : src/components/feed module: BeanGrid
- `src/components/feed/CafeGrid.tsx` (144 lines) : src/components/feed module: CafeGrid
- `src/components/feed/EditorialHero.tsx` (142 lines) : Editorial hero banner: full-bleed photography of the featured roaster with a
- `src/components/feed/FeedControls.tsx` (93 lines) : Distilled Row 1 control bar: mode switcher on the left, quick filters on the
- `src/components/feed/VibeFilterBar.tsx` (62 lines) : Distilled Row 2 chip rail: one horizontally scrollable line of vibe and

## src/components/layout/

- `src/components/layout/BottomTabBar.tsx` (51 lines) : Persistent mobile bottom navigation (hidden while a detail modal is open).
- `src/components/layout/FooterSection.tsx` (100 lines) : Global footer: obsidian slab with the ecosystem bridge and city directory.
- `src/components/layout/NavigationDrawer.tsx` (133 lines) : Mobile slide-over navigation with the district filter and account controls.
- `src/components/layout/NavigationHeader.tsx` (195 lines) : The portal tab is shared by the sign-in view, roaster dashboard, and admin panel.

## src/components/map/

- `src/components/map/DavaoCoffeeMap.tsx` (267 lines) : Interactive Davao coffee map: pins for every venue, curated trail overlays,

## src/components/roaster/

- `src/components/roaster/BeanForm.tsx` (238 lines) : Inventory form for roaster-owned bean lots. Seeded records stay read-only.
- `src/components/roaster/RoasterDashboard.tsx` (403 lines) : Roaster Suite: overview analytics, bean inventory, roast schedule, menu, inbox.
  - L12 : RoasterDashboardProps
  - L18 : DashboardTab
  - L23 : RoasterDashboard
- `src/components/roaster/RoasteryStorefront.tsx` (191 lines) : Public roastery storefront: brand header, bean shelf, drop schedule, menu, hours.
- `src/components/roaster/RoastScheduleTab.tsx` (199 lines) : Roast scheduling: create batches, watch countdowns, mark sold out.

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
- `src/services/userPrefsService.ts` (274 lines) : Buyer-side preferences kept per browser: saved cafes and beans, custom coffee

## src/types/

- `src/types/auth.ts` (36 lines) : Roaster, cafe owner, and admin accounts for the Haraya Roaster Suite.
- `src/types/coffee.ts` (251 lines) : Haraya domain model: Davao Region specialty cafes, micro-roasteries, single-origin

## src/utils/

- `src/utils/calendar.ts` (128 lines) : Calendar and clock helpers shared by roast drops, cafe hours, and the
- `src/utils/geo.ts` (54 lines) : Distance and directions helpers for the coffee map and trails.
- `src/utils/router.ts` (68 lines) : Hash routes so cafes, beans, roasteries, drops, and shared lists have shareable
- `src/utils/weekdays.ts` (13 lines) : Canonical weekday iteration order for hours tables.

## src/views/

- `src/views/CommunityView.tsx` (65 lines) : Cup Check community feed: two-to-three column masonry of today's brews.
- `src/views/SavedView.tsx` (320 lines) : Tasting journal: bookmarked cafes and beans, drop alerts, custom shareable lists.
  - L13 : SavedTab
  - L15 : SavedViewProps
  - L25 : SavedView
- `src/views/SharedListView.tsx` (110 lines) : Read-only view of a shared custom list. Items ride in the URL, so the link

