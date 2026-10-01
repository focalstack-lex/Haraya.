# CODE_MAP: Haraya Agent Navigation Map

Generated 2026-10-01 : commit a29b792 : fingerprint 28b5f8fdcb869ff6

Regenerate with `npm run map:code`; verify staleness with `npm run map:code:check`.
Never hand-edit: the generator owns this file.

All Davao Region content: cafes, roasteries, bean lots, drop batches, trails, and Cup Check posts.

## promo-video/scripts/

- `promo-video/scripts/capture-screens.mjs` (142 lines) : Captures the phone screens the video shows, from the running app, into public/screens/.
- `promo-video/scripts/check-timeline.ts` (60 lines) : promo-video/scripts module: check-timeline
- `promo-video/scripts/cue-sheet.ts` (93 lines) : Writes the SFX cue sheet for the editor: out/SFX_CUES.md (to read) and out/SFX_CUES.csv (to import or sort).
- `promo-video/scripts/stills.mjs` (40 lines) : Renders review stills of HarayaPromo from one bundle: out/stills/<frame>.jpg for every frame given.

## promo-video/src/

- `promo-video/src/fonts.ts` (11 lines) : Plus Jakarta Sans, the face the app falls back to off Apple devices (`--font-ui` in the app's index.css).
- `promo-video/src/index.ts` (5 lines) : promo-video/src entry point
- `promo-video/src/Root.tsx` (9 lines) : promo-video/src module: Root
- `promo-video/src/theme.ts` (49 lines) : Haraya's tokens, copied from the app's `src/index.css` @theme block, plus Aya's master palette
- `promo-video/src/timeline.ts` (220 lines) : The one source of timing for the video. Scenes animate from these beats and the SFX cue sheet is generated from
- `promo-video/src/Video.tsx` (58 lines) : The first frames come up out of black, like a cut from the edit before.

## promo-video/src/components/

- `promo-video/src/components/Aya.tsx` (48 lines) : Aya from the app's own component, so the video always shows the real character. The app animates her idle
- `promo-video/src/components/Backdrop.tsx` (132 lines) : A fine static grain tile. It breaks up the banding a soft gradient gets in H.264.
- `promo-video/src/components/CafeIllustration.tsx` (58 lines) : A flat drawing of a cafe corner for the owner demo's "Your Cafe" listing. It stands in for the photo an owner
- `promo-video/src/components/Cursor.tsx` (117 lines) : Fingertip position at a frame: rests on a key, glides between consecutive keys.
- `promo-video/src/components/Logo.tsx` (42 lines) : The brand logo image, never retyped, as `BrandLogo` in the app. A light band can sweep across it, masked to the
- `promo-video/src/components/Phone.tsx` (81 lines) : Captures are 390 by 844 app pixels (public/screens, written by scripts/capture-screens.mjs).
- `promo-video/src/components/Ripples.tsx` (49 lines) : Concentric rounded rings spreading from a pill, the reference's "10x better" backdrop, in the stage's own tones.
- `promo-video/src/components/Typewriter.tsx` (67 lines) : Characters appear one by one with a caret. The untyped rest is laid out but transparent, so centered text
- `promo-video/src/components/ui.tsx` (167 lines) : Puts children with their center at (x, y) in video pixels, scaled and rotated about that center. Recreated app
- `promo-video/src/components/Words.tsx` (118 lines) : "*word*" gets the keyword fill, "~word~" is set light. Markers can span several words:

## promo-video/src/lib/

- `promo-video/src/lib/motion.ts` (24 lines) : The app's --ios-ease: sheets, bars and segmented thumbs.

## promo-video/src/scenes/

- `promo-video/src/scenes/Community.tsx` (106 lines) : Where the new spot lands on the map card, in card pixels.
- `promo-video/src/scenes/EndCard.tsx` (80 lines) : Open Haraya and the web address share one centered row; the button is about 364 wide, the address 250.
- `promo-video/src/scenes/Focus.tsx` (195 lines) : The check-in sheet is built at app pixels (390 wide) and scaled, anchored at its top left.
- `promo-video/src/scenes/Hook.tsx` (59 lines) : What a visitor actually picks a cafe for, from the landing page: a free plug, a quiet table, a door still open.
- `promo-video/src/scenes/Mood.tsx` (159 lines) : The mood finder's own lists (src/components/moodFinder/moods.ts).
- `promo-video/src/scenes/Owners.tsx` (248 lines) : The owner editor, built at app pixels (390 wide) and scaled; anchored by its center.
- `promo-video/src/scenes/Passport.tsx` (133 lines) : The ten listed Digos spots, stamped one first, as the Passport tab orders them (the capture shows this order).
- `promo-video/src/scenes/PromiseScene.tsx` (184 lines) : The landing page's band: what Haraya filters for (LandingView BAND_ITEMS).
- `promo-video/src/scenes/Reveal.tsx` (58 lines) : 0:07 A caret types "Introducing", the linen iris opens, the logo comes into focus and Aya waves.
- `promo-video/src/scenes/Walk.tsx` (195 lines) : The map plane, in its own pixels. It is tilted back like a navigation view.

## root/

- `index.html` (30 lines) : . module: index.html
- `promo-video/remotion.config.ts` (8 lines) : promo-video module: remotion.config
- `promo-video/webpack-override.ts` (28 lines) : Shared by remotion.config.ts (studio and render) and scripts/stills.mjs (review stills), so every bundle
- `scripts/generate-cafes-seed.mjs` (60 lines) : Writes the SQL that stores the catalog spots in the database: Green Coffee and the Digos City shops, with their
- `scripts/generate-code-map.mjs` (215 lines) : One-line purpose per file, inferred from its path and leading doc comment.
- `scripts/make-email-logo.mjs` (30 lines) : Builds public/brand/haraya-email-logo.png: the wordmark on its own linen tile with rounded corners.
- `scripts/verify-google-auth.mjs` (109 lines) : scripts module: verify-google-auth
- `src/App.tsx` (962 lines) : Older links: the roaster portal is now the Place Portal. The Passport tab also answers to its own name.
  - L84 : SharedList
  - L110 : App
- `src/index.css` (747 lines) : src entry point
- `src/main.tsx` (47 lines) : src entry point
- `vite.config.ts` (43 lines) : . module: vite.config

## src/components/account/

- `src/components/account/AccountPanels.tsx` (171 lines) : Updates for the signed-in visitor: a spot or application was reviewed, a report was closed, someone

## src/components/admin/

- `src/components/admin/AdminDashboard.tsx` (444 lines) : A public listing from the cafes table (not a curated, community or legacy browser-only cafe).
  - L18 : AdminDashboardProps
  - L23 : AdminTab
  - L292 : AdminDashboard
- `src/components/admin/AdminPanels.tsx` (637 lines) : Shown once where a tool depends on the newest migration and the database does not have it yet.
  - L25 : NeedsUpdateNote
  - L177 : PlacesPanel
  - L400 : ReportsPanel
  - L518 : HealthPanel
- `src/components/admin/SpotReviewQueue.tsx` (86 lines) : Admin review of community spot submissions: approve to publish, reject with a note to the contributor.

## src/components/cafe/

- `src/components/cafe/BeanDetailModal.tsx` (201 lines) : Grouped list on the white sheet: the linen canvas tone lets the inset group read as a group.
- `src/components/cafe/CafeDetailModal.tsx` (402 lines) : Full cafe detail: snap gallery, live open status, actions (directions, save, rate,
  - L55 : AmenityBadges
  - L77 : MenuSheet
  - L104 : CafeDetailModalProps
  - L126 : CafeDetailModal
- `src/components/cafe/CafeRecentVisitors.tsx` (155 lines) : "Focused 2h 15m, Americano, quiet" or "Quick stamp"
- `src/components/cafe/CafeReviews.tsx` (74 lines) : Public reviews on a spot page: the average, then the newest few with their words. Shows nothing until
- `src/components/cafe/RateCafeModal.tsx` (161 lines) : src/components/cafe module: RateCafeModal
- `src/components/cafe/ReportSheet.tsx` (95 lines) : Reasons that fit each kind of thing; a check-in or a review cannot be "closed for good".

## src/components/common/

- `src/components/common/AccountSetupModal.tsx` (105 lines) : src/components/common module: AccountSetupModal
- `src/components/common/AddToListSheet.tsx` (105 lines) : List picker used by the cafe and bean modals and the saved view.
- `src/components/common/AyaMascot.tsx` (478 lines) : One pose per surface, so Aya reads as a character rather than a repeated sticker:
  - L19 : AyaPose
  - L33 : AyaMascotProps
  - L93 : Gaze
  - L103 : Lids
  - L244 : AyaMascot
- `src/components/common/BrandLogo.tsx` (36 lines) : Haraya logo cut from the brand master (Haraya Files/LOGO.webp) with the background keyed out,
- `src/components/common/CustomIcons.tsx` (242 lines) : Haraya Custom Icon Set: high-precision vector icons tailored for the Davao
- `src/components/common/EarlyCoffeeOffer.tsx` (60 lines) : The soft-launch coffee offer, shared by the pre-registration page and the landing page while pre-registration is
- `src/components/common/ErrorBoundary.tsx` (53 lines) : Catches a crash while drawing the app, reports it, and offers a way back instead of a blank page.
- `src/components/common/FormControls.tsx` (272 lines) : Shared form primitives for Haraya: an iOS-style sheet (bottom sheet with a
- `src/components/common/ImageUploadField.tsx` (83 lines) : File input that stores the image as a dataURL with type and size validation.
- `src/components/common/LargeTitle.tsx` (46 lines) : iOS large title: the first thing on every primary page, left aligned.
- `src/components/common/locationFix.test.ts` (37 lines) : src/components/common module: locationFix.test
- `src/components/common/locationFix.ts` (46 lines) : Which set of steps fits the visitor's device.
- `src/components/common/LocationHelp.tsx` (34 lines) : Why Haraya cannot see the visitor's location, with the steps for their device to turn it on.
- `src/components/common/sheetStyles.ts` (8 lines) : Class strings shared by sheets, so every grouped list and section label inside a sheet matches.
- `src/components/common/WelcomeModal.tsx` (160 lines) : What the app does, stated plainly: one row per real surface.

## src/components/community/

- `src/components/community/CommentsSheet.tsx` (75 lines) : Comments for a cup post; seed posts are read-only, browser posts are live.
- `src/components/community/CupCheckCard.tsx` (114 lines) : Community cup post: photo with floating tasting-tag pins, brew method, likes.
- `src/components/community/FlavorPinPlacer.tsx` (132 lines) : Tap the uploaded photo to drop tasting-tag pins, then name each pin. Pins
- `src/components/community/LocationPicker.tsx` (113 lines) : Pin placement for Add a Spot: tap the map, or use the device location. The location is read once on
- `src/components/community/NewPostSheet.tsx` (143 lines) : Compose a Cup Check: photo, caption, cafe tag, brew method, and flavor pins.

## src/components/drops/

- `src/components/drops/BeanDropCard.tsx` (159 lines) : Vault card for one roast batch: one primary action (reserve), one Remind me disclosure that holds
- `src/components/drops/BeanReservationModal.tsx` (139 lines) : Direct reservation: pre-order whole bean bags or drip packs from the roaster.
- `src/components/drops/DropCalendarStrip.tsx` (79 lines) : 14-day horizontal calendar of roast batches. Each cell shows the weekday,
- `src/components/drops/DropCountdownTimer.tsx` (52 lines) : Live countdown digits (DD:HH:MM:SS) that tick once per second. `onDark` swaps to cream text for photo overlays.
- `src/components/drops/DropsView.tsx` (98 lines) : Bean Drops: 14-day roast calendar on top, micro-lot vault under it.

## src/components/feed/

- `src/components/feed/BeanGrid.tsx` (113 lines) : src/components/feed module: BeanGrid
- `src/components/feed/CafeGrid.tsx` (160 lines) : src/components/feed module: CafeGrid
- `src/components/feed/EditorialHero.tsx` (126 lines) : Spotlight shelf built only from real listings: the top study spots, then the newest hidden gems added
- `src/components/feed/FeedControls.tsx` (103 lines) : src/components/feed module: FeedControls
- `src/components/feed/FeedSearchBar.tsx` (38 lines) : iOS search field: filled, borderless, with the round clear button once text is entered.
- `src/components/feed/PopularPicksSection.tsx` (73 lines) : "Most saved" shelf: the venues Haraya users bookmark most, from real save counts.
- `src/components/feed/searchSpots.test.ts` (40 lines) : src/components/feed module: searchSpots.test
- `src/components/feed/searchSpots.ts` (35 lines) : Lowercase, and "Wi-Fi" reads the same as "wifi".
- `src/components/feed/spotCategories.test.ts` (79 lines) : src/components/feed module: spotCategories.test
- `src/components/feed/spotCategories.ts` (51 lines) : What a visitor is looking for; replaces the old Cafes / Beans / Following modes.
- `src/components/feed/VibeFilterBar.tsx` (152 lines) : The filter panel under the feed controls. Open: sort and price menus, then the must-have chip rail.

## src/components/install/

- `src/components/install/installPlatform.test.ts` (213 lines) : src/components/install module: installPlatform.test
- `src/components/install/installPlatform.ts` (27 lines) : src/components/install module: installPlatform
- `src/components/install/installPromptStore.test.ts` (91 lines) : src/components/install module: installPromptStore.test
- `src/components/install/installPromptStore.ts` (62 lines) : Captures the browser's install prompt so Aya can offer it at the right moment. The event can
- `src/components/install/InstallSheet.tsx` (150 lines) : Aya offers to put Haraya on the home screen. The variant follows the platform mode snapshot: a real
- `src/components/install/installStorage.ts` (20 lines) : Remembers that Aya already offered to install Haraya. Storage can throw in private
- `src/components/install/OfflineNotice.tsx` (20 lines) : src/components/install module: OfflineNotice
- `src/components/install/useInstallPrompt.ts` (19 lines) : src/components/install module: useInstallPrompt

## src/components/layout/

- `src/components/layout/BottomTabBar.tsx` (66 lines) : Persistent mobile bottom navigation (hidden while a detail modal is open).
- `src/components/layout/FooterSection.tsx` (111 lines) : Footer for the landing page and the desktop app shell. Phones see the brand line and the legal row
- `src/components/layout/NavigationDrawer.tsx` (223 lines) : Leading icon of a grouped row: a 30px tinted rounded square.
- `src/components/layout/NavigationHeader.tsx` (217 lines) : Tab ids reachable by hash route but not shown in the primary navigation.

## src/components/map/

- `src/components/map/DavaoCoffeeMap.tsx` (989 lines) : Floating map control: a round bar-material button inside a 44px hit area.
  - L58 : RowHandlers
  - L131 : DavaoCoffeeMapProps
  - L149 : DavaoCoffeeMap
- `src/components/map/DirectionsActionSheet.tsx` (58 lines) : External map apps. Apple Maps uses its https form so the link also works outside Apple devices.
- `src/components/map/liveNavMath.test.ts` (71 lines) : src/components/map module: liveNavMath.test
- `src/components/map/liveNavMath.ts` (63 lines) : Pure math for in-app walking navigation. These straight-line figures are the fallback when no street route
- `src/components/map/mapFilters.test.ts` (70 lines) : src/components/map module: mapFilters.test
- `src/components/map/mapFilters.ts` (33 lines) : True when the spot passes every active map filter; no filters means every spot.
- `src/components/map/mapPins.test.ts` (72 lines) : src/components/map module: mapPins.test
- `src/components/map/mapPins.ts` (95 lines) : Whether a spot is open right now, for the list and the preview card.
- `src/components/map/MapPreviewCard.tsx` (123 lines) : Inside the last hour the card counts down, so a visitor does not walk to a door that is about to shut.
- `src/components/map/nearby.test.ts` (31 lines) : src/components/map module: nearby.test
- `src/components/map/nearby.ts` (21 lines) : Spots this close to the visitor show up on their own when the map opens.
- `src/components/map/RouteLoader.tsx` (177 lines) : Holds a loading phase on screen for at least MIN_LOADER_MS after it first appears, so a quick answer does not
- `src/components/map/routeLoadPhase.test.ts` (34 lines) : src/components/map module: routeLoadPhase.test
- `src/components/map/routeLoadPhase.ts` (22 lines) : What the walk is still waiting for before the first route can be drawn; null once there is nothing to wait for.
- `src/components/map/routeMath.test.ts` (53 lines) : src/components/map module: routeMath.test
- `src/components/map/routeMath.ts` (63 lines) : Pure math for following a street route: snap the visitor onto the nearest route segment, measure what is
- `src/components/map/tiles.ts` (11 lines) : The one map tile layer, shared by the coffee map and the location picker.
- `src/components/map/useLiveNavigation.ts` (129 lines) : Walking navigation driven by navigator.geolocation.watchPosition with high accuracy. Positions stay in
- `src/components/map/walkingRoute.ts` (110 lines) : Street-following walking routes from the FOSSGIS OSRM server (OpenStreetMap data, foot profile, no key).

## src/components/moodFinder/

- `src/components/moodFinder/MoodCard.tsx` (106 lines) : Late evening, when "open late" matters: 8 PM to 4 AM on the device clock.
- `src/components/moodFinder/moodCardState.test.ts` (34 lines) : src/components/moodFinder module: moodCardState.test
- `src/components/moodFinder/MoodFinderSheet.tsx` (364 lines) : The mood finder: say how you feel and what you need, get three explained picks and a route.
  - L17 : MoodFinderSheetProps
  - L39 : MoodFinderSheet
- `src/components/moodFinder/MoodResultCard.tsx` (93 lines) : One suggestion: why it fits (real catalog facts), how far, how long it stays open, what to order.
- `src/components/moodFinder/moods.ts` (44 lines) : Moods rank cafes softly; must-haves filter strictly. See docs/superpowers/specs/2026-09-28-mood-finder-design.md.
- `src/components/moodFinder/moodStorage.ts` (25 lines) : Remembers the last chosen must-haves. Storage can throw or hold stale values, so reads validate.
- `src/components/moodFinder/parseQuery.test.ts` (50 lines) : src/components/moodFinder module: parseQuery.test
- `src/components/moodFinder/parseQuery.ts` (85 lines) : Deterministic reading of a typed request ("quiet place to study, not too pricey, near Matina").
- `src/components/moodFinder/scoreCafes.test.ts` (167 lines) : src/components/moodFinder module: scoreCafes.test
- `src/components/moodFinder/scoreCafes.ts` (243 lines) : The mood finder's matcher. Pure: the same catalog, request and context always give the same
- `src/components/moodFinder/useLocation.ts` (70 lines) : insecure: the page is not https (or localhost), so the browser refuses location before asking anyone.
- `src/components/moodFinder/weather.ts` (63 lines) : Current Davao weather from Open-Meteo (free, no key). Fixed city coordinates, never the

## src/components/passport/

- `src/components/passport/PassportStamp.tsx` (108 lines) : Ghost outline: #594C3D at 20% for the ring, a little stronger for the lettering so it still reads.

## src/components/roaster/

- `src/components/roaster/BeanForm.tsx` (238 lines) : Neutral placeholder until the roaster uploads a real bag photo.
- `src/components/roaster/RoasterDashboard.tsx` (403 lines) : Roaster Suite: overview analytics, bean inventory, roast schedule, menu, inbox.
  - L12 : RoasterDashboardProps
  - L18 : DashboardTab
  - L23 : RoasterDashboard
- `src/components/roaster/RoasteryStorefront.tsx` (194 lines) : Public roastery storefront: brand header, bean shelf, drop schedule, menu, hours.
- `src/components/roaster/RoastScheduleTab.tsx` (199 lines) : Roast scheduling: create batches, watch countdowns, mark sold out.

## src/components/session/

- `src/components/session/CheckInModal.tsx` (238 lines) : Check in at a spot. The device position is read once, in memory, and compared with the spot: within
- `src/components/session/EndSessionModal.tsx` (214 lines) : A small segmented control: one choice, or none until tapped.
- `src/components/session/FloatingFocusBanner.tsx` (112 lines) : The running Deep Focus Session, floating just above the tab dock on phones (bottom of the screen on

## src/components/tour/

- `src/components/tour/GuidedTour.tsx` (294 lines) : Space the sticky nav bar and the bottom tab bar cover, so targets are scrolled clear of them.
- `src/components/tour/tourSteps.ts` (61 lines) : First-visit guided tour steps. Each step highlights the element tagged with the matching
- `src/components/tour/tourStorage.ts` (20 lines) : Remembers that the first-visit tour was finished or skipped. Storage can throw in private

## src/config/

- `src/config/ecosystem.ts` (14 lines) : Sister ecosystem bridge between Haraya (coffee) and Habi (fashion).
- `src/config/launch.ts` (13 lines) : Launch phase. During the soft launch the app is closed: visitors see the pre-registration page and can create an
- `src/config/supabase.ts` (19 lines) : Haraya Supabase Client.

## src/data/

- `src/data/digosCafes.test.ts` (78 lines) : src/data module: digosCafes.test
- `src/data/digosCafes.ts` (134 lines) : Digos City coffee shops chosen by Lex from Google Maps on 2026-09-29 (names and streets as that listing shows
- `src/data/spots.ts` (61 lines) : Curated spots listed by the Haraya team, shown ahead of roaster and community listings. Every field comes
- `src/data/trails.ts` (8 lines) : Curated coffee trails. Empty until real trails are set up: each entry lists at least two cafe ids that

## src/hooks/

- `src/hooks/useFocusSession.test.ts` (76 lines) : src/hooks module: useFocusSession.test
- `src/hooks/useFocusSession.ts` (237 lines) : The running Deep Focus Session. It lives in localStorage (haraya_active_focus) so a refresh, a tab change or
- `src/hooks/useOnline.ts` (19 lines) : True while the browser reports a network connection; re-renders when it drops or comes back.
- `src/hooks/useServiceVersions.ts` (63 lines) : Subscriber-version hooks: each service exposes a monotonically increasing

## src/services/

- `src/services/accountService.ts` (127 lines) : The account's own data: keeping saved spots on the account so they follow the visitor to another
- `src/services/adminService.ts` (77 lines) : Control Room account management: the list of profiles (readable by admins only, per Row Level
- `src/services/catalogService.test.ts` (37 lines) : src/services module: catalogService.test
- `src/services/catalogService.ts` (372 lines) : Catalog layer over roaster-created and admin-moderated records kept in
  - L31 : CafeMetrics
  - L38 : MetricsStore
  - L55 : readJson
  - L64 : writeJson
  - L73 : notify
  - L78 : makeCatalogId
  - L86 : deriveStatus
  - L91 : catalogService
- `src/services/communityService.ts` (154 lines) : Cup Check community layer: browser-created posts, likes, and comments. Likes are stored per browser (no accounts needed to
- `src/services/earlyRegistrationService.test.ts` (26 lines) : src/services module: earlyRegistrationService.test
- `src/services/earlyRegistrationService.ts` (41 lines) : The soft-launch promo count (20261001020000_early_registration_30_slots.sql): how many of the early slots are
- `src/services/moderationService.ts` (280 lines) : Reports from visitors and the Control Room's moderation data: the report queue, recent check-ins,
- `src/services/notificationService.ts` (99 lines) : In-app notifications (table notifications, 20260930020000): written by database triggers when a spot or
- `src/services/placeImport.test.ts` (76 lines) : src/services module: placeImport.test
- `src/services/placeImport.ts` (163 lines) : Bulk import for the Control Room: a sheet saved as CSV becomes a list of listings to review before they
- `src/services/placeMapping.test.ts` (159 lines) : src/services module: placeMapping.test
- `src/services/placeMapping.ts` (443 lines) : Place Portal data: the application a place owner sends (place_applications), the public listing row
  - L12 : PLACE_TYPES
  - L17 : PlaceType
  - L20 : REGION_BOUNDS
  - L22 : APPLICATION_LIMITS
  - L31 : LISTING_LIMITS
  - L46 : LISTING_AMENITIES
  - L48 : City
  - L50 : PlaceApplicationInput
  - L65 : PlaceApplicationRow
  - L87 : CafeRow
  - L119 : ListingInput
  - L143 : PLACEHOLDER_PHOTO
  - L158 : placeTypeLabel
  - L162 : emptyHours
  - L171 : validatePlaceApplication
  - L196 : toApplicationInsertRow
  - L215 : parseHours
  - L230 : parseMenu
  - L250 : cafeRowToCafe
  - L285 : activeNotice
  - L292 : emptyListing
  - L317 : listingFromCafe
  - L343 : validateListing
  - L387 : toCafeUpdateRow
  - ... 2 more anchors
- `src/services/placeService.ts` (335 lines) : Public listings (table cafes) and Place Portal applications (table place_applications). Listings are
  - L36 : notify
  - L41 : readCache
  - L53 : writeCache
  - L61 : publishToCatalog
  - L69 : ListingStatus
  - L71 : ListingStats
  - L84 : shrinkPhoto
  - L99 : placeService
- `src/services/reviewService.ts` (115 lines) : Public reviews of a spot (table spot_reviews, 20260930020000): a star rating with optional words, one per
- `src/services/roasterService.ts` (115 lines) : Roaster-facing facade over the catalog: everything an approved roaster or
- `src/services/sessionService.test.ts` (35 lines) : src/services module: sessionService.test
- `src/services/sessionService.ts` (590 lines) : The signed-in account: Supabase Auth session plus the caller's row in public.profiles (role, status,
  - L15 : RESET_RETURN_TAB
  - L38 : PASSWORD_MIN_LENGTH
  - L41 : PendingConfirmation
  - L51 : loadPendingConfirmation
  - L75 : notify
  - L80 : setPendingConfirmation
  - L89 : clearPendingConfirmation
  - L103 : rememberReturnTab
  - L112 : readReturnTab
  - L134 : getAuthRedirectUrl
  - L176 : ConfirmationLinkType
  - L178 : isConfirmationLinkType
  - L183 : cleanAuthParams
  - L198 : describeAuthError
  - L228 : loadProfile
  - L250 : setUser
  - L258 : sessionService
- `src/services/spotMapping.test.ts` (116 lines) : src/services module: spotMapping.test
- `src/services/spotMapping.ts` (178 lines) : Community spot submissions: the row shape stored in Supabase (spot_submissions), the form input, the
- `src/services/spotService.ts` (172 lines) : Add a Spot backed by Supabase (table spot_submissions). Row Level Security decides what each caller can
- `src/services/telemetry.ts` (73 lines) : Error reports and anonymous usage events, kept in Haraya's own database and read in the Control Room
- `src/services/userPrefsService.ts` (381 lines) : Buyer-side preferences kept per browser: saved cafes and beans, custom coffee
  - L20 : CafeRating
  - L27 : CustomList
  - L35 : SharedList
  - L45 : readJson
  - L54 : writeJson
  - L63 : notify
  - L68 : makeListId
  - L72 : userPrefsService
- `src/services/visitMapping.ts` (292 lines) : Sanctuary visits (focus sessions and Quick Stamps): the row shape stored in Supabase (sanctuary_visits),
- `src/services/visitService.test.ts` (253 lines) : Records every builder call so the query shape can be asserted without a network. The chain's last call
- `src/services/visitService.ts` (333 lines) : The sanctuary ledger. Local first: every visit is written to this device (localStorage) so the diary and
  - L45 : notify
  - L50 : isVisit
  - L56 : readLocal
  - L67 : writeLocal
  - L75 : makeLocalId
  - L81 : fetchOwnVisits
  - L90 : fetchCafeVisits
  - L100 : insertVisitRow
  - L107 : localForCurrentUser
  - L112 : loadOwnRemote
  - L128 : RecordResult
  - L134 : visitService

## src/types/

- `src/types/auth.ts` (67 lines) : Accounts. Real sign-in is Supabase Auth; the row in public.profiles carries the role. The legacy
- `src/types/coffee.ts` (265 lines) : Haraya domain model: Davao Region cafes and study spots (listed or added by the community), plus the

## src/utils/

- `src/utils/backgroundUpdate.test.ts` (68 lines) : src/utils module: backgroundUpdate.test
- `src/utils/backgroundUpdate.ts` (30 lines) : Applies a waiting service worker update only after the page has been hidden for a while, so a quick
- `src/utils/calendar.test.ts` (57 lines) : src/utils module: calendar.test
- `src/utils/calendar.ts` (161 lines) : Calendar and clock helpers shared by roast drops, cafe hours, and the
- `src/utils/emailTypos.test.ts` (39 lines) : src/utils module: emailTypos.test
- `src/utils/emailTypos.ts` (38 lines) : Spots an address whose domain is a near miss of a popular mail provider (gmial.com, gmail.con, hotmial.com).
- `src/utils/geo.test.ts` (53 lines) : Meters per degree of latitude on the 6,371 km sphere.
- `src/utils/geo.ts` (74 lines) : Distance and directions helpers for the coffee map and trails.
- `src/utils/gmailOnly.test.ts` (23 lines) : src/utils module: gmailOnly.test
- `src/utils/gmailOnly.ts` (15 lines) : New accounts are Gmail only. The form checks it so the visitor hears it before anything is sent, and the database
- `src/utils/inbox.test.ts` (21 lines) : src/utils module: inbox.test
- `src/utils/inbox.ts` (25 lines) : Where a visitor reads their mail, from the address they signed up with. Only providers with a stable web
- `src/utils/router.ts` (90 lines) : Hash routes so cafes, beans, roasteries, drops, and shared lists have shareable
- `src/utils/weekdays.ts` (13 lines) : Canonical weekday iteration order for hours tables.

## src/views/

- `src/views/AddSpotView.tsx` (369 lines) : Email sign-in with a one-time link; Supabase creates the account on first use.
  - L21 : AddSpotViewProps
  - L305 : AddSpotView
- `src/views/CommunityView.tsx` (74 lines) : Cup Check community feed: one-to-three column masonry of today's brews.
- `src/views/ConfirmEmailView.tsx` (107 lines) : The only screen an unconfirmed sign-up sees: it replaces the whole app (every tab, the portal included) until
- `src/views/LandingView.tsx` (370 lines) : Landing page shown at the bare URL (see `isLandingEntry` in utils/router.ts). It showcases the app with real
  - L18 : LandingViewProps
  - L34 : Phone
  - L112 : LandingView
- `src/views/LegalView.tsx` (234 lines) : Privacy Notice and Terms. Statements of fact describe what the code does today; anything that needs a
- `src/views/LoginView.tsx` (346 lines) : What the page is doing: the two account modes, the two email-link flows, and the new-password form.
  - L11 : LoginMode
  - L13 : LoginViewProps
  - L64 : LoginView
- `src/views/PlacePortalView.tsx` (826 lines) : What the portal offers, for visitors who are not signed in or have not applied.
  - L28 : PlacePortalViewProps
  - L488 : ListingEditorProps
  - L497 : ListingEditor
  - L729 : PlacePortalView
- `src/views/PreRegistrationView.tsx` (129 lines) : The soft-launch page: while PRE_REGISTRATION is on it replaces the landing page and every tab for everyone but
- `src/views/ProfileView.tsx` (755 lines) : Leading icon of a grouped row: a 30px tinted rounded square.
  - L28 : ProfileSection
  - L30 : ProfileViewProps
  - L141 : StampEntry
  - L152 : ProfileView
- `src/views/SavedView.tsx` (319 lines) : Tasting journal: bookmarked cafes and beans, drop alerts, custom shareable lists.
  - L13 : SavedTab
  - L15 : SavedViewProps
  - L25 : SavedView
- `src/views/SharedListView.tsx` (123 lines) : Read-only view of a shared custom list. Items ride in the URL, so the link

## supabase/templates/

- `supabase/templates/confirm-signup.html` (49 lines) : supabase/templates module: confirm-signup.html

