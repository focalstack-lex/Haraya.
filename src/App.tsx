import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavigationHeader, ADMIN_TAB_ID, LOGIN_TAB_ID, PORTAL_TAB_ID, SUBMIT_TAB_ID } from './components/layout/NavigationHeader';
import { NavigationDrawer } from './components/layout/NavigationDrawer';
import { BottomTabBar } from './components/layout/BottomTabBar';
import { FooterSection } from './components/layout/FooterSection';

import { EditorialHero } from './components/feed/EditorialHero';
import { FeedControls, type FeedMode, type SortKey } from './components/feed/FeedControls';
import { VibeFilterBar, type VibeFilterId } from './components/feed/VibeFilterBar';
import { PopularPicksSection } from './components/feed/PopularPicksSection';
import { FeedSearchBar } from './components/feed/FeedSearchBar';
import { CafeGrid } from './components/feed/CafeGrid';
import { isStudySpot, matchesCategory } from './components/feed/spotCategories';

import { CafeDetailModal } from './components/cafe/CafeDetailModal';
import { DavaoCoffeeMap } from './components/map/DavaoCoffeeMap';
import { DirectionsActionSheet } from './components/map/DirectionsActionSheet';

import { AdminDashboard } from './components/admin/AdminDashboard';

import { AddSpotView } from './views/AddSpotView';
import { LoginView, type LoginMode } from './views/LoginView';
import { PlacePortalView } from './views/PlacePortalView';
import { ProfileView, type ProfileSection } from './views/ProfileView';
import { SharedListView } from './views/SharedListView';
import { LegalView } from './views/LegalView';
import { RateCafeModal } from './components/cafe/RateCafeModal';
import { WelcomeModal } from './components/common/WelcomeModal';
import { AccountSetupModal } from './components/common/AccountSetupModal';
import { LandingView } from './views/LandingView';
import { ConfirmEmailView } from './views/ConfirmEmailView';
import { LargeTitle, CityMenu } from './components/common/LargeTitle';
import { GuidedTour } from './components/tour/GuidedTour';
import { isTourDone, markTourDone } from './components/tour/tourStorage';
import type { TourOutcome } from './components/tour/tourSteps';
import { useInstallPrompt } from './components/install/useInstallPrompt';
import { shouldOfferAfterTour, type InstallMode } from './components/install/installPlatform';
import { hasOfferedInstall, markInstallOffered } from './components/install/installStorage';
import { InstallSheet } from './components/install/InstallSheet';
import { OfflineNotice } from './components/install/OfflineNotice';
import { MoodCard } from './components/moodFinder/MoodCard';
import { MoodFinderSheet } from './components/moodFinder/MoodFinderSheet';
import type { MoodId } from './components/moodFinder/moods';
import { CheckInModal } from './components/session/CheckInModal';
import { EndSessionModal } from './components/session/EndSessionModal';
import { FloatingFocusBanner, SessionToast, type ToastMessage } from './components/session/FloatingFocusBanner';
import { useActiveFocusSession, useFocusBoundaryWatch } from './hooks/useFocusSession';

import { catalogService } from './services/catalogService';
import { userPrefsService } from './services/userPrefsService';
import { communityService } from './services/communityService';
import { sessionService, RESET_RETURN_TAB } from './services/sessionService';
import { spotService } from './services/spotService';
import { placeService } from './services/placeService';
import { visitService } from './services/visitService';
import { useCatalogVersion, usePrefsVersion, useCommunityVersion, useSessionVersion, useSpotVersion, usePlaceVersion, useVisitVersion } from './hooks/useServiceVersions';
import { buildHash, isLandingEntry, parseHash, setHash } from './utils/router';
import { distanceKm } from './utils/geo';
import { PRICE_RANGES } from './types/coffee';
import type { Cafe } from './types/coffee';

// Drops, beans and Cup Check are hidden since the discovery pivot (their code is kept).
const TAB_IDS = new Set(['feed', 'map', SUBMIT_TAB_ID, 'profile', 'saved', 'privacy', 'terms', LOGIN_TAB_ID, PORTAL_TAB_ID, ADMIN_TAB_ID]);
/** Older links: the roaster portal is now the Place Portal. */
const TAB_ALIASES: Record<string, string> = { roaster: PORTAL_TAB_ID };
/** #/tab/saved opens the passport on its Saved section rather than the Diary. */
const SAVED_SECTION_REQUEST = { section: 'saved', at: 0 } as const;

interface SharedList {
  name: string;
  cafeIds: string[];
  beanIds: string[];
}

const DAVAO_CENTER = { lat: 7.07, lng: 125.61 };
const WELCOMED_KEY = 'haraya_welcomed';

/** Storage can throw in private windows or with blocked site data; the welcome sheet is a convenience. */
const readWelcomed = () => {
  try {
    return localStorage.getItem(WELCOMED_KEY) === 'true';
  } catch {
    return false;
  }
};

const markWelcomed = () => {
  try {
    localStorage.setItem(WELCOMED_KEY, 'true');
  } catch (error) {
    console.warn('Haraya: could not persist the welcome flag', error);
  }
};

export const App: React.FC = () => {
  const catalogVersion = useCatalogVersion();
  usePrefsVersion();
  useCommunityVersion();
  const sessionVersion = useSessionVersion();
  useSpotVersion();
  usePlaceVersion();
  useVisitVersion();

  // Navigation state
  const [activeTab, setActiveTabState] = useState('feed');
  const [selectedCity, setSelectedCity] = useState('All Davao Region');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sharedList, setSharedList] = useState<SharedList | null>(null);

  // Feed filter state
  const [feedMode, setFeedMode] = useState<FeedMode>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [priceRangeId, setPriceRangeId] = useState<(typeof PRICE_RANGES)[number]['id']>('any');
  const [vibeFilters, setVibeFilters] = useState<Set<VibeFilterId>>(() => new Set());

  // Detail modal state
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [ratingCafe, setRatingCafe] = useState<Cafe | null>(null);

  // Welcome modal state for new visitors
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(() => !readWelcomed());
  // The bare URL opens on the landing page; deep links and sign-in returns go straight into the app
  const [isLanding, setIsLanding] = useState<boolean>(() => isLandingEntry());
  // Which pending sign-up was let through to the sign-in form (its `at` stamp), if any
  const [gateBypassAt, setGateBypassAt] = useState<number | null>(null);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const install = useInstallPrompt();
  const [installSheetMode, setInstallSheetMode] = useState<InstallMode | null>(null);

  // Mood finder sheet, the directions picker, and live walking navigation on the map
  const [moodSheet, setMoodSheet] = useState<{ open: boolean; mood: MoodId | null }>({ open: false, mood: null });
  const [directionsFor, setDirectionsFor] = useState<Cafe | null>(null);
  const [navTarget, setNavTarget] = useState<Cafe | null>(null);

  // Sign-in page: how it opens and where it returns to afterwards
  const [loginIntent, setLoginIntent] = useState<{ mode: LoginMode; returnTab: string }>({ mode: 'signin', returnTab: 'profile' });

  // Sanctuary check-ins: the geofenced check-in sheet, the end-of-session sheet, and one toast line
  const [checkInCafe, setCheckInCafe] = useState<Cafe | null>(null);
  const [isEndSessionOpen, setIsEndSessionOpen] = useState(false);
  const [sessionToast, setSessionToast] = useState<ToastMessage | null>(null);
  const [profileRequest, setProfileRequest] = useState<{ section: ProfileSection; at: number } | null>(null);
  const activeFocus = useActiveFocusSession();
  const dismissToast = useCallback(() => setSessionToast(null), []);
  useFocusBoundaryWatch((outcome) => setSessionToast({ text: outcome.message, tone: outcome.kind === 'failed' ? 'error' : 'success' }));

  const baseHashRef = useRef(buildHash('/tab/feed'));
  /** A #/cafe/ link that arrived before community spots and listings loaded; opened once they have. */
  const pendingCafeIdRef = useRef<string | null>(null);

  const setActiveTab = useCallback((tab: string) => {
    const resolved = TAB_ALIASES[tab] ?? tab;
    // Leaving through the tab bar also leaves a shared list, so Discover shows the catalog again
    setSharedList(null);
    setIsLanding(false);
    setActiveTabState(resolved);
    if (TAB_IDS.has(resolved)) {
      baseHashRef.current = buildHash(`/tab/${resolved}`);
      setHash(baseHashRef.current);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Once per load: restore the session, load listings and community spots, then forget saves, ratings,
  // reminders and likes that point at records no longer in the catalog (the retired demo dataset included)
  useEffect(() => {
    const prune = () => {
      try {
        userPrefsService.pruneMissing({
          cafeIds: new Set(catalogService.getCafes().map((cafe) => cafe.id)),
          beanIds: new Set(catalogService.getBeans().map((bean) => bean.id)),
          dropIds: new Set(catalogService.getDrops().map((drop) => drop.id)),
        });
        communityService.pruneLikes();
      } catch (error) {
        console.warn('Haraya: could not clean up stale saved records', error);
      }
    };
    sessionService
      .start()
      .then(() => Promise.all([spotService.start(), placeService.start(), visitService.start()]))
      .then(() => {
        // A failed load skips pruning rather than deleting saves on a flaky connection
        if (!spotService.getLoadError() && !placeService.getLoadError()) prune();
        // A shared link to a community spot or listed place can resolve now that those records are loaded
        const pendingId = pendingCafeIdRef.current;
        pendingCafeIdRef.current = null;
        const pendingCafe = pendingId ? catalogService.getCafeById(pendingId) : undefined;
        if (pendingCafe && parseHash().kind === 'cafe') {
          setSelectedCafeId(pendingCafe.id);
          catalogService.recordView(pendingCafe.id);
          userPrefsService.pushRecentView(pendingCafe.id);
        }
        // Back from an email link or OAuth sign-in: a reset link opens the new-password form, a sign-in link its origin tab
        const returnTab = sessionService.peekReturnTab();
        if (returnTab === RESET_RETURN_TAB) {
          sessionService.takeReturnTab();
          setLoginIntent({ mode: 'reset', returnTab: 'profile' });
          setActiveTab(LOGIN_TAB_ID);
        } else if (returnTab && sessionService.getUser()) {
          sessionService.takeReturnTab();
          setActiveTab(returnTab);
        }
      })
      .catch((error) => console.warn('Haraya: could not start the session', error));
  }, [setActiveTab]);

  // Handle return tab from Google OAuth or email link once user is loaded
  useEffect(() => {
    const returnTab = sessionService.peekReturnTab();
    if (returnTab && sessionService.getUser()) {
      sessionService.takeReturnTab();
      if (returnTab === RESET_RETURN_TAB) {
        setLoginIntent({ mode: 'reset', returnTab: 'profile' });
        setActiveTab(LOGIN_TAB_ID);
      } else {
        setActiveTab(returnTab);
      }
    }
  }, [sessionVersion, setActiveTab]);

  // Hash routes: deep links on load, back and forward navigation
  useEffect(() => {
    const apply = () => {
      const route = parseHash();
      switch (route.kind) {
        case 'tab': {
          const id = TAB_ALIASES[route.id] ?? route.id;
          if (TAB_IDS.has(id)) {
            setActiveTabState(id);
            baseHashRef.current = buildHash(`/tab/${id}`);
          }
          setSharedList(null);
          setSelectedCafeId(null);
          break;
        }
        case 'cafe': {
          const cafe = catalogService.getCafeById(route.id);
          if (cafe) {
            setSelectedCafeId(cafe.id);
            catalogService.recordView(cafe.id);
            userPrefsService.pushRecentView(cafe.id);
          } else {
            pendingCafeIdRef.current = route.id;
          }
          break;
        }
        case 'roastery': {
          // Old storefront links open the place itself
          const cafe = catalogService.getCafeByHandle(route.id) ?? catalogService.getCafeById(route.id);
          setActiveTabState('feed');
          baseHashRef.current = buildHash('/tab/feed');
          setSelectedCafeId(cafe ? cafe.id : null);
          break;
        }
        case 'bean':
        case 'drop': {
          // Bean and drop pages are retired; their links land on Discover
          setActiveTabState('feed');
          baseHashRef.current = buildHash('/tab/feed');
          setSelectedCafeId(null);
          break;
        }
        case 'list': {
          setSharedList({
            name: route.query.get('name') || route.id.replace(/-/g, ' '),
            cafeIds: (route.query.get('cafes') ?? '').split(',').filter(Boolean),
            beanIds: (route.query.get('beans') ?? '').split(',').filter(Boolean),
          });
          setActiveTabState('feed');
          baseHashRef.current = window.location.hash;
          setSelectedCafeId(null);
          break;
        }
        default:
          // Back from the app to the bare URL returns to the landing page
          if (isLandingEntry()) setIsLanding(true);
          break;
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    // Traversing back to the bare URL does not always fire hashchange
    const onPop = () => {
      if (isLandingEntry()) setIsLanding(true);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('hashchange', apply);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  const openCafe = useCallback((cafeId: string) => {
    const cafe = catalogService.getCafeById(cafeId);
    if (!cafe) return;
    setSelectedCafeId(cafe.id);
    catalogService.recordView(cafe.id);
    userPrefsService.pushRecentView(cafe.id);
    setHash(buildHash(`/cafe/${cafe.id}`), 'push');
  }, []);

  const closeCafe = () => {
    setSelectedCafeId(null);
    setHash(baseHashRef.current);
  };

  const toggleSaveCafe = (cafe: Cafe) => {
    const saved = userPrefsService.toggleSavedCafe(cafe);
    if (saved) catalogService.recordSave(cafe.id);
  };

  const toggleVibe = (id: VibeFilterId) => {
    setVibeFilters((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Accounts ------------------------------------------------------------------

  /** Opens the sign-in page; after sign-in the app returns to `returnTab`. */
  const openLogin = (returnTab: string = 'profile') => {
    setLoginIntent({ mode: 'signin', returnTab });
    setActiveTab(LOGIN_TAB_ID);
  };

  const handleSignedIn = () => {
    const target = loginIntent.returnTab;
    setLoginIntent({ mode: 'signin', returnTab: 'profile' });
    // First sign-in on this device: Aya walks them through Discover once, same as Get started
    if (!isTourDone()) {
      startTour();
      return;
    }
    setActiveTab(target);
  };

  const handleSignOut = () => {
    void sessionService.signOut();
    setActiveTab('feed');
  };

  const openPortal = () => setActiveTab(PORTAL_TAB_ID);
  const openAdmin = () => setActiveTab(ADMIN_TAB_ID);

  // Guided tour runs on Discover's cafe catalog; wait for the tab switch and scroll-to-top to settle
  const startTour = () => {
    setSharedList(null);
    setFeedMode('all');
    setActiveTab('feed');
    window.setTimeout(() => setIsTourOpen(true), 500);
  };

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

  // Directions: the picker offers Haraya live navigation or a maps app
  const openDirections = (cafe: Cafe) => {
    setMoodSheet((current) => ({ ...current, open: false }));
    setDirectionsFor(cafe);
  };

  const navigateInApp = (cafe: Cafe) => {
    setDirectionsFor(null);
    setSelectedCafeId(null);
    setNavTarget(cafe);
    setActiveTab('map');
  };

  const openAddSpot = () => setActiveTab(SUBMIT_TAB_ID);

  // Check-ins and focus sessions ------------------------------------------------

  const openCheckIn = (cafe: Cafe) => setCheckInCafe(cafe);

  const openPassport = () => {
    setCheckInCafe(null);
    setSelectedCafeId(null);
    setProfileRequest({ section: 'passport', at: Date.now() });
    setActiveTab('profile');
  };

  // Catalog queries -----------------------------------------------------------

  const allCafes = useMemo(() => catalogService.getCafes(), [catalogVersion]);

  const cityCentroid = useMemo(() => {
    const scoped = selectedCity === 'All Davao Region' ? allCafes : allCafes.filter((cafe) => cafe.city === selectedCity);
    if (scoped.length === 0) return DAVAO_CENTER;
    const lat = scoped.reduce((sum, cafe) => sum + cafe.lat, 0) / scoped.length;
    const lng = scoped.reduce((sum, cafe) => sum + cafe.lng, 0) / scoped.length;
    return { lat, lng };
  }, [allCafes, selectedCity]);

  const savedCafeIds = userPrefsService.getSavedCafes();


  const cafes = useMemo(() => {
    let list = allCafes;
    if (selectedCity !== 'All Davao Region') list = list.filter((cafe) => cafe.city === selectedCity);
    list = list.filter((cafe) => matchesCategory(cafe, feedMode));
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (cafe) =>
          cafe.name.toLowerCase().includes(query) ||
          cafe.district.toLowerCase().includes(query) ||
          cafe.city.toLowerCase().includes(query) ||
          cafe.signature.toLowerCase().includes(query) ||
          cafe.address.toLowerCase().includes(query) ||
          (cafe.community?.tip ?? '').toLowerCase().includes(query) ||
          cafe.vibeTags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    for (const filter of vibeFilters) {
      if (filter === 'roastery') {
        list = list.filter((cafe) => cafe.isRoastery);
      } else if (filter === 'heritage') {
        list = list.filter((cafe) =>
          cafe.vibeTags.some((tag) => tag.toLowerCase().includes('heritage') || tag.toLowerCase().includes('ancestral'))
        );
      } else {
        list = list.filter((cafe) => cafe.amenities.includes(filter as Cafe['amenities'][number]));
      }
    }
    if (priceRangeId === 'budget') list = list.filter((cafe) => cafe.priceLevel === 1);
    if (priceRangeId === 'mid') list = list.filter((cafe) => cafe.priceLevel === 2);
    if (priceRangeId === 'premium') list = list.filter((cafe) => cafe.priceLevel === 3);

    const sorted = [...list];
    if (sortKey === 'newest') sorted.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    if (sortKey === 'mostSaved') sorted.sort((a, b) => b.saveCount - a.saveCount);
    if (sortKey === 'nearest') sorted.sort((a, b) => distanceKm(a, cityCentroid) - distanceKm(b, cityCentroid));
    return sorted;
  }, [allCafes, selectedCity, feedMode, searchQuery, vibeFilters, priceRangeId, sortKey, cityCentroid]);

  const selectedCafe = selectedCafeId ? catalogService.getCafeById(selectedCafeId) ?? null : null;

  // Spotlight shelves from real data only: study spots ranked by recorded saves, and approved community gems
  const studySpots = useMemo(
    () =>
      allCafes
        .filter((cafe) => isStudySpot(cafe) && cafe.community?.status !== 'pending')
        .sort((a, b) => catalogService.getMetrics(b.id).totalSaves - catalogService.getMetrics(a.id).totalSaves),
    [allCafes]
  );
  const hiddenGems = useMemo(
    () =>
      allCafes
        .filter((cafe) => cafe.community?.status === 'approved')
        .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)),
    [allCafes]
  );

  // "Most saved" shelf: real save counts within the chosen city
  const mostSavedCafes = useMemo(() => {
    const scoped = selectedCity === 'All Davao Region' ? allCafes : allCafes.filter((cafe) => cafe.city === selectedCity);
    // A spot nobody has saved is not "most saved"; the shelf hides itself when none qualify
    return scoped.filter((cafe) => cafe.saveCount > 0).sort((a, b) => b.saveCount - a.saveCount).slice(0, 6);
  }, [allCafes, selectedCity]);

  const hasActiveFilters =
    vibeFilters.size > 0 || Boolean(searchQuery) || priceRangeId !== 'any' || selectedCity !== 'All Davao Region';

  const scrollToCatalog = () => {
    document.getElementById('full-catalog-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetFilters = () => {
    setSelectedCity('All Davao Region');
    setSearchQuery('');
    setPriceRangeId('any');
    setVibeFilters(new Set());
  };

  const handleViewAllPicks = () => {
    setFeedMode('all');
    setSortKey('mostSaved');
    scrollToCatalog();
  };

  const savedCount = savedCafeIds.length;
  const portalRole = sessionService.getPortalRole();
  const accountName = sessionService.getUser() ? sessionService.getDisplayName() : null;

  const renderFeed = () => {
    if (sharedList) {
      return (
        <SharedListView
          name={sharedList.name}
          cafeIds={sharedList.cafeIds}
          beanIds={sharedList.beanIds}
          onBack={() => {
            setSharedList(null);
            // The list route stored its own hash as the base; Back returns to Discover so a refresh stays there
            baseHashRef.current = buildHash('/tab/feed');
            setHash(baseHashRef.current);
          }}
          onSelectCafe={openCafe}
          onDirections={openDirections}
        />
      );
    }

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-6 sm:pt-4 space-y-6 sm:space-y-8">
        <div className="space-y-3">
          <LargeTitle title="Discover" trailing={<CityMenu value={selectedCity} onChange={setSelectedCity} />} />
          <FeedSearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>

        {/* Mood finder entry */}
        <MoodCard
          onOpen={(mood) => setMoodSheet({ open: true, mood })}
          focusSession={activeFocus}
          onFinishFocus={() => setIsEndSessionOpen(true)}
          passportEmpty={allCafes.length > 0 && visitService.getUserVisits().length === 0}
        />

        {/* Spotlight: top study spots and hidden gems, only when real ones exist */}
        <EditorialHero studySpots={studySpots} hiddenGems={hiddenGems} onSelectCafe={openCafe} />

        {/* Most saved shelf: real cafes reach the first screen on phones */}
        <PopularPicksSection cafes={mostSavedCafes} onSelectCafe={openCafe} onViewAll={handleViewAllPicks} />

        {/* Every spot */}
        <section id="full-catalog-section" aria-labelledby="catalog-title" className="space-y-3 scroll-mt-20">
          <h2 id="catalog-title" className="ios-title">
            All spots
          </h2>
          <FeedControls
            mode={feedMode}
            onModeChange={setFeedMode}
            sortKey={sortKey}
            onSortChange={setSortKey}
            priceRange={priceRangeId}
            onPriceRangeChange={setPriceRangeId}
            itemCount={cafes.length}
            isFiltersOpen={isFiltersOpen}
            onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
            activeFilterCount={vibeFilters.size}
            onClearFilters={hasActiveFilters ? resetFilters : undefined}
          />

          <VibeFilterBar mode="cafes" active={vibeFilters} onToggle={toggleVibe} isOpen={isFiltersOpen} />

          <CafeGrid
            cafes={cafes}
            savedCafeIds={savedCafeIds}
            onToggleSave={toggleSaveCafe}
            onSelectCafe={openCafe}
            onDirections={openDirections}
            emptyTitle={allCafes.length === 0 ? 'No spots yet' : 'No spots match'}
            emptyBody={
              allCafes.length === 0
                ? 'Know a good cafe or a quiet study corner? Add it and help others find it.'
                : 'Try another category, clear a filter, or widen the city.'
            }
            emptyAction={
              allCafes.length === 0
                ? { label: 'Add a Spot', onClick: openAddSpot }
                : hasActiveFilters || feedMode !== 'all'
                  ? {
                      label: 'Clear Filters',
                      onClick: () => {
                        resetFilters();
                        setFeedMode('all');
                      },
                    }
                  : undefined
            }
          />
        </section>
      </div>
    );
  };

  /**
   * From the landing page into the app. The entry is pushed, so browser Back returns to the landing. The landing
   * already says what the app does, so a first visit skips the welcome sheet and goes to the guided tour.
   */
  const enterApp = (tab: string, city?: string) => {
    if (city) setSelectedCity(city);
    setHash(buildHash(`/tab/${tab}`), 'push');
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
    if (!readWelcomed()) {
      setIsWelcomeOpen(false);
      markWelcomed();
      if (tab === 'feed' && !isTourDone()) startTour();
    }
  };

  // An unconfirmed sign-up sees only the confirm-email screen, on every route, the landing page and the portal
  // included. The one way past it is the sign-in form, for someone who confirmed on another device; a fresh
  // "not confirmed" answer from Supabase re-stamps the pending state and closes that again.
  const pendingConfirmation = sessionService.isAwaitingAuthReturn() ? null : sessionService.getPendingConfirmation();
  const onGateSignIn = activeTab === LOGIN_TAB_ID && gateBypassAt === pendingConfirmation?.at;
  if (pendingConfirmation && !onGateSignIn) {
    return (
      <ConfirmEmailView
        email={pendingConfirmation.email}
        onSignIn={() => {
          setGateBypassAt(pendingConfirmation.at);
          openLogin('profile');
        }}
        onChangeEmail={() => {
          sessionService.cancelPendingConfirmation();
          setLoginIntent({ mode: 'signup', returnTab: 'profile' });
          setActiveTab(LOGIN_TAB_ID);
        }}
      />
    );
  }

  if (isLanding) {
    return (
      <>
        <LandingView onEnter={enterApp} />
        <FooterSection setActiveTab={enterApp} setSelectedCity={setSelectedCity} onAddSpot={() => enterApp(SUBMIT_TAB_ID)} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF5EB] text-[#13191F] font-sans">
      <NavigationHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        savedCount={savedCount}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        portalRole={portalRole}
        accountName={accountName}
        onOpenWelcome={() => setIsWelcomeOpen(true)}
        onOpenLogin={() => openLogin('profile')}
      />

      <OfflineNotice />

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        savedCount={savedCount}
        portalRole={portalRole}
        accountName={accountName}
        onSignOut={handleSignOut}
        onOpenLogin={() => openLogin('profile')}
      />

      <main className="flex-1 pb-28 sm:pb-32">
        {activeTab === 'feed' && renderFeed()}

        {activeTab === 'map' && (
          <DavaoCoffeeMap
            cafes={cafes}
            onSelectCafe={openCafe}
            selectedCity={selectedCity}
            navTarget={navTarget}
            onEndNavigation={() => setNavTarget(null)}
            onCheckIn={openCheckIn}
          />
        )}

        {(activeTab === 'profile' || activeTab === 'saved') && (
          <ProfileView
            onSelectCafe={openCafe}
            onSelectRoastery={openCafe}
            onExploreFeed={() => setActiveTab('feed')}
            onOpenMap={() => setActiveTab('map')}
            onOpenAuth={openAddSpot}
            onOpenLogin={() => openLogin('profile')}
            onOpenPortal={openPortal}
            onOpenAdmin={openAdmin}
            onSignOut={handleSignOut}
            onStartTour={startTour}
            onInstallApp={install.mode === 'installed' || install.mode === 'unavailable' ? undefined : () => setInstallSheetMode(install.mode)}
            sectionRequest={activeTab === 'saved' ? SAVED_SECTION_REQUEST : profileRequest}
          />
        )}

        {activeTab === SUBMIT_TAB_ID && <AddSpotView onViewSpot={openCafe} onOpenLogin={() => openLogin(SUBMIT_TAB_ID)} onOpenAdmin={openAdmin} />}

        {activeTab === LOGIN_TAB_ID && (
          <LoginView initialMode={loginIntent.mode} onSignedIn={handleSignedIn} onBrowse={() => setActiveTab('feed')} />
        )}

        {activeTab === PORTAL_TAB_ID && (
          <PlacePortalView onOpenLogin={() => openLogin(PORTAL_TAB_ID)} onViewPlace={openCafe} onBrowse={() => setActiveTab('feed')} />
        )}

        {activeTab === ADMIN_TAB_ID && <AdminDashboard onViewCafe={openCafe} onOpenLogin={() => openLogin(ADMIN_TAB_ID)} />}

        {(activeTab === 'privacy' || activeTab === 'terms') && <LegalView page={activeTab} />}
      </main>

      <MoodFinderSheet
        isOpen={moodSheet.open}
        initialMood={moodSheet.mood}
        cafes={allCafes}
        cityOrigin={cityCentroid}
        cityLabel={selectedCity === 'All Davao Region' ? 'Davao Region' : selectedCity}
        savedIds={savedCafeIds}
        recentIds={userPrefsService.getRecentViews()}
        onClose={() => setMoodSheet((current) => ({ ...current, open: false }))}
        onOpenCafe={openCafe}
        onToggleSave={toggleSaveCafe}
        onRoute={(cafe) => openDirections(cafe)}
      />

      <CafeDetailModal
        cafe={selectedCafe}
        onClose={closeCafe}
        saved={selectedCafe ? savedCafeIds.includes(selectedCafe.id) : false}
        onToggleSave={toggleSaveCafe}
        onDirections={openDirections}
        onRateCafe={setRatingCafe}
        onCheckIn={openCheckIn}
        focusingHere={Boolean(activeFocus && selectedCafe && activeFocus.cafeId === selectedCafe.id)}
        onFinishSession={() => setIsEndSessionOpen(true)}
      />

      <CheckInModal
        cafe={checkInCafe}
        onClose={() => setCheckInCafe(null)}
        onDirections={(cafe) => {
          setCheckInCafe(null);
          openDirections(cafe);
        }}
        onFocusStarted={() => {
          const name = checkInCafe?.name ?? 'the spot';
          setCheckInCafe(null);
          closeCafe();
          setSessionToast({ text: `Focus session started at ${name}. It saves itself if you leave.`, tone: 'success' });
        }}
        onFinishActive={() => {
          setCheckInCafe(null);
          setIsEndSessionOpen(true);
        }}
        onOpenPassport={openPassport}
      />

      <EndSessionModal
        isOpen={isEndSessionOpen && Boolean(activeFocus)}
        onClose={() => setIsEndSessionOpen(false)}
        onDone={(message) => {
          setIsEndSessionOpen(false);
          setSessionToast({ text: message, tone: 'success' });
        }}
      />

      <DirectionsActionSheet cafe={directionsFor} onClose={() => setDirectionsFor(null)} onNavigateInApp={navigateInApp} />

      <RateCafeModal
        cafe={ratingCafe}
        isOpen={Boolean(ratingCafe)}
        onClose={() => setRatingCafe(null)}
      />

      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => {
          setIsWelcomeOpen(false);
          markWelcomed();
        }}
        onGetStarted={() => {
          setIsWelcomeOpen(false);
          markWelcomed();
          if (isTourDone()) setActiveTab('feed');
          else startTour();
        }}
        onLogIn={() => {
          setIsWelcomeOpen(false);
          markWelcomed();
          openLogin('profile');
        }}
      />

      <AccountSetupModal
        isOpen={sessionService.needsAccountSetup()}
        onCompleted={() => {}}
      />

      <GuidedTour isOpen={isTourOpen} onFinish={finishTour} />
      <InstallSheet mode={installSheetMode} onInstall={install.promptInstall} onClose={() => setInstallSheetMode(null)} />

      <FooterSection setActiveTab={setActiveTab} setSelectedCity={setSelectedCity} onAddSpot={openAddSpot} />

      <div className="h-[92px] lg:hidden" aria-hidden="true" />
      {activeFocus && <div className="h-14" aria-hidden="true" />}

      <FloatingFocusBanner onFinish={() => setIsEndSessionOpen(true)} isHidden={isWelcomeOpen} />
      <SessionToast message={sessionToast} onDismiss={dismissToast} aboveBanner={Boolean(activeFocus)} />

      <BottomTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedCount}
        isHidden={Boolean(installSheetMode !== null || selectedCafe || directionsFor || ratingCafe || isWelcomeOpen || moodSheet.open || checkInCafe || isEndSessionOpen)}
      />
    </div>
  );
};

export default App;
