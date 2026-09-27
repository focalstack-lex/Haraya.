import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavigationHeader, PORTAL_TAB_ID } from './components/layout/NavigationHeader';
import { NavigationDrawer } from './components/layout/NavigationDrawer';
import { BottomTabBar } from './components/layout/BottomTabBar';
import { FooterSection } from './components/layout/FooterSection';

import { EditorialHero } from './components/feed/EditorialHero';
import { FeedControls, type FeedMode, type SortKey } from './components/feed/FeedControls';
import { VibeFilterBar, type VibeFilterId } from './components/feed/VibeFilterBar';
import { CafeGrid } from './components/feed/CafeGrid';
import { BeanGrid } from './components/feed/BeanGrid';

import { CafeDetailModal } from './components/cafe/CafeDetailModal';
import { BeanDetailModal } from './components/cafe/BeanDetailModal';
import { DropsView } from './components/drops/DropsView';
import { BeanReservationModal } from './components/drops/BeanReservationModal';
import { DavaoCoffeeMap } from './components/map/DavaoCoffeeMap';
import { RoasteryStorefront } from './components/roaster/RoasteryStorefront';

import { AuthView, type AuthMode } from './components/auth/AuthView';
import { ApplicationStatusView } from './components/auth/ApplicationStatusView';
import { RoasterDashboard } from './components/roaster/RoasterDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

import { CommunityView } from './views/CommunityView';
import { SavedView, type SavedTab } from './views/SavedView';
import { SharedListView } from './views/SharedListView';

import { catalogService } from './services/catalogService';
import { userPrefsService } from './services/userPrefsService';
import { authService } from './services/authService';
import { useCatalogVersion, usePrefsVersion, useCommunityVersion, useAuthVersion } from './hooks/useServiceVersions';
import { buildHash, parseHash, setHash } from './utils/router';
import { distanceKm } from './utils/geo';
import { PRICE_RANGES } from './types/coffee';
import type { Account } from './types/auth';
import type { Bean, Cafe } from './types/coffee';

const TAB_IDS = new Set(['feed', 'drops', 'map', 'community', 'saved', PORTAL_TAB_ID]);

interface SharedList {
  name: string;
  cafeIds: string[];
  beanIds: string[];
}

const DAVAO_CENTER = { lat: 7.07, lng: 125.61 };

export const App: React.FC = () => {
  const catalogVersion = useCatalogVersion();
  usePrefsVersion();
  useCommunityVersion();
  useAuthVersion();

  // Navigation state
  const [activeTab, setActiveTabState] = useState('feed');
  const [selectedCity, setSelectedCity] = useState('All Davao Region');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [roasteryId, setRoasteryId] = useState<string | null>(null);
  const [savedInitialTab] = useState<SavedTab>('cafes');  const [sharedList, setSharedList] = useState<SharedList | null>(null);

  // Feed filter state
  const [feedMode, setFeedMode] = useState<FeedMode>('cafes');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [priceRangeId, setPriceRangeId] = useState<(typeof PRICE_RANGES)[number]['id']>('any');
  const [vibeFilters, setVibeFilters] = useState<Set<VibeFilterId>>(() => new Set());

  // Detail modal state
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null);
  const [reserveBeanId, setReserveBeanId] = useState<string | null>(null);

  // Auth state
  const [account, setAccount] = useState<Account | null>(() => authService.getCurrentAccount());
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  const baseHashRef = useRef(buildHash('/tab/feed'));

  useEffect(() => {
    const refresh = () => setAccount(authService.getCurrentAccount());
    const unsubscribe = authService.subscribe(refresh);
    window.addEventListener('storage', refresh);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Hash routes: deep links on load, back and forward navigation
  useEffect(() => {
    const apply = () => {
      const route = parseHash();
      switch (route.kind) {
        case 'tab': {
          if (TAB_IDS.has(route.id)) {
            setActiveTabState(route.id);
            setRoasteryId(null);
            baseHashRef.current = buildHash(`/tab/${route.id}`);
          }
          setSelectedCafeId(null);
          setSelectedBeanId(null);
          break;
        }
        case 'cafe': {
          const cafe = catalogService.getCafeById(route.id);
          if (cafe) {
            setSelectedCafeId(cafe.id);
            catalogService.recordView(cafe.id);
            userPrefsService.pushRecentView(cafe.id);
          }
          break;
        }
        case 'bean': {
          const bean = catalogService.getBeanById(route.id);
          if (bean) {
            setSelectedBeanId(bean.id);
            catalogService.recordView(bean.id);
            userPrefsService.pushRecentView(bean.id);
          }
          break;
        }
        case 'roastery': {
          const cafe = catalogService.getCafeByHandle(route.id) ?? catalogService.getCafeById(route.id);
          if (cafe) {
            setRoasteryId(cafe.id);
            setActiveTabState('feed');
            baseHashRef.current = buildHash(`/roastery/${cafe.handle}`);
          }
          setSelectedCafeId(null);
          setSelectedBeanId(null);
          break;
        }
        case 'drop': {
          setActiveTabState('drops');
          baseHashRef.current = buildHash('/tab/drops');
          setSelectedCafeId(null);
          setSelectedBeanId(null);
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
          setSelectedBeanId(null);
          break;
        }
        default:
          break;
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    setRoasteryId(null);
    if (TAB_IDS.has(tab)) {
      baseHashRef.current = buildHash(`/tab/${tab}`);
      setHash(baseHashRef.current);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const openBean = useCallback((beanId: string) => {
    const bean = catalogService.getBeanById(beanId);
    if (!bean) return;
    setSelectedBeanId(bean.id);
    setSelectedCafeId(null);
    catalogService.recordView(bean.id);
    userPrefsService.pushRecentView(bean.id);
    setHash(buildHash(`/bean/${bean.id}`), 'push');
  }, []);

  const closeBean = () => {
    setSelectedBeanId(null);
    setReserveBeanId(null);
    setHash(baseHashRef.current);
  };

  const openRoastery = useCallback((cafeId: string) => {
    const cafe = catalogService.getCafeById(cafeId);
    if (!cafe) return;
    setRoasteryId(cafe.id);
    setActiveTabState('feed');
    setSelectedCafeId(null);
    setSelectedBeanId(null);
    baseHashRef.current = buildHash(`/roastery/${cafe.handle}`);
    setHash(baseHashRef.current);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleSaveCafe = (cafe: Cafe) => {
    const saved = userPrefsService.toggleSavedCafe(cafe);
    if (saved) catalogService.recordSave(cafe.id);
  };

  const toggleSaveBean = (bean: Bean) => {
    const saved = userPrefsService.toggleSavedBean(bean);
    if (saved) catalogService.recordSave(bean.id);
  };

  const toggleVibe = (id: VibeFilterId) => {
    setVibeFilters((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAuthenticated = (nextAccount: Account) => {
    setAccount(nextAccount);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = () => {
    authService.signOut();
    setAccount(null);
    setAuthMode('signin');
    setActiveTab('feed');
  };

  const handleJoinRoaster = () => {
    if (!account) setAuthMode('signup');
    setActiveTab(PORTAL_TAB_ID);
  };

  // Catalog queries -----------------------------------------------------------

  const allCafes = useMemo(() => catalogService.getCafes(), [catalogVersion]);
  const allBeans = useMemo(() => catalogService.getBeans(), [catalogVersion]);
  const drops = useMemo(() => catalogService.getDrops(), [catalogVersion]);

  const cityCentroid = useMemo(() => {
    const scoped = selectedCity === 'All Davao Region' ? allCafes : allCafes.filter((cafe) => cafe.city === selectedCity);
    if (scoped.length === 0) return DAVAO_CENTER;
    const lat = scoped.reduce((sum, cafe) => sum + cafe.lat, 0) / scoped.length;
    const lng = scoped.reduce((sum, cafe) => sum + cafe.lng, 0) / scoped.length;
    return { lat, lng };
  }, [allCafes, selectedCity]);

  const savedCafeIds = userPrefsService.getSavedCafes();
  const savedBeanIds = userPrefsService.getSavedBeans();
  const following = userPrefsService.getFollowing();

  const priceRange = PRICE_RANGES.find((range) => range.id === priceRangeId) ?? PRICE_RANGES[0];

  const cafes = useMemo(() => {
    let list = allCafes;
    if (selectedCity !== 'All Davao Region') list = list.filter((cafe) => cafe.city === selectedCity);
    if (feedMode === 'following') list = list.filter((cafe) => following.includes(cafe.id));
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (cafe) =>
          cafe.name.toLowerCase().includes(query) ||
          cafe.district.toLowerCase().includes(query) ||
          cafe.city.toLowerCase().includes(query) ||
          cafe.signature.toLowerCase().includes(query) ||
          cafe.vibeTags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    for (const filter of vibeFilters) {
      if (filter === 'heritage') {
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
  }, [allCafes, selectedCity, feedMode, following.join(','), searchQuery, vibeFilters, priceRangeId, sortKey, cityCentroid]);

  const beans = useMemo(() => {
    let list = allBeans;
    if (selectedCity !== 'All Davao Region') {
      const cityCafeIds = new Set(allCafes.filter((cafe) => cafe.city === selectedCity).map((cafe) => cafe.id));
      list = list.filter((bean) => cityCafeIds.has(bean.roasterId));
    }
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (bean) =>
          bean.name.toLowerCase().includes(query) ||
          bean.roasterName.toLowerCase().includes(query) ||
          bean.origin.toLowerCase().includes(query) ||
          bean.tastingNotes.some((note) => note.toLowerCase().includes(query))
      );
    }
    for (const filter of vibeFilters) {
      if (filter === 'singleOrigin') list = list.filter((bean) => bean.singleOrigin);
      else if (filter.startsWith('process:')) list = list.filter((bean) => bean.process === filter.slice(8));
      else if (filter.startsWith('roast:')) list = list.filter((bean) => bean.roastProfile.roastLevel === filter.slice(6));
    }
    list = list.filter((bean) => bean.price >= priceRange.min && bean.price <= priceRange.max);

    const sorted = [...list];
    if (sortKey === 'newest') sorted.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    if (sortKey === 'mostSaved') {
      sorted.sort((a, b) => catalogService.getMetrics(b.id).totalSaves - catalogService.getMetrics(a.id).totalSaves);
    }
    return sorted;
  }, [allBeans, allCafes, selectedCity, searchQuery, vibeFilters, priceRange, sortKey]);

  const selectedCafe = selectedCafeId ? catalogService.getCafeById(selectedCafeId) ?? null : null;
  const selectedBean = selectedBeanId ? catalogService.getBeanById(selectedBeanId) ?? null : null;
  const reserveBean = reserveBeanId ? catalogService.getBeanById(reserveBeanId) ?? null : null;
  const roastery = roasteryId ? catalogService.getCafeById(roasteryId) ?? null : null;

  const featuredRoasteries = useMemo(
    () => allCafes.filter((cafe) => cafe.isRoastery && cafe.verified).slice(0, 4),
    [allCafes]
  );

  const hasActiveFilters =
    vibeFilters.size > 0 || Boolean(searchQuery) || priceRangeId !== 'any' || selectedCity !== 'All Davao Region';

  const resetFilters = () => {
    setSelectedCity('All Davao Region');
    setSearchQuery('');
    setPriceRangeId('any');
    setVibeFilters(new Set());
  };

  const savedCount = savedCafeIds.length + savedBeanIds.length;
  const portalRole: 'guest' | Account['role'] = !account ? 'guest' : account.role;
  const accountName = account ? (account.role === 'admin' ? account.name : account.businessName) : null;

  const renderPortal = () => {
    if (!account) {
      return (
        <AuthView
          mode={authMode}
          onModeChange={setAuthMode}
          onAuthenticated={handleAuthenticated}
          onBrowseFeed={() => setActiveTab('feed')}
        />
      );
    }
    if (account.role === 'admin') {
      return <AdminDashboard admin={account} onSignOut={handleSignOut} onViewCafe={openCafe} />;
    }
    if (account.status !== 'approved') {
      return <ApplicationStatusView account={account} onSignOut={handleSignOut} onBrowseFeed={() => setActiveTab('feed')} />;
    }
    try {
      return <RoasterDashboard key={account.id} account={account} onSignOut={handleSignOut} onViewStorefront={openRoastery} />;
    } catch {
      return (
        <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-3">
          <h2 className="font-cooper text-xl font-bold text-[#1A2225]">Roastery profile missing</h2>
          <p className="text-sm font-sans text-[#55615D]">
            The approved account has no cafe record in this browser. Ask an admin to re-approve the application.
          </p>
          <button onClick={handleSignOut} className="h-10 px-5 rounded-full bg-[#1A2225] text-[#FFF9E9] text-xs font-bold font-sans">
            Sign Out
          </button>
        </div>
      );
    }
  };

  const renderFeed = () => {
    if (sharedList) {
      return (
        <SharedListView
          name={sharedList.name}
          cafeIds={sharedList.cafeIds}
          beanIds={sharedList.beanIds}
          onBack={() => {
            setSharedList(null);
            setHash(baseHashRef.current);
          }}
          onSelectCafe={openCafe}
          onSelectBean={openBean}
          onSelectRoastery={openRoastery}
        />
      );
    }

    if (roastery) {
      return (
        <RoasteryStorefront
          cafe={roastery}
          onBack={() => setActiveTab('feed')}
          onSelectBean={openBean}
          onToggleSave={toggleSaveCafe}
          saved={savedCafeIds.includes(roastery.id)}
        />
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        <EditorialHero cafes={featuredRoasteries} onSelectCafe={openCafe} />

        <FeedControls
          mode={feedMode}
          onModeChange={setFeedMode}
          followingCount={following.length}
          sortKey={sortKey}
          onSortChange={setSortKey}
          priceRange={priceRangeId}
          onPriceRangeChange={setPriceRangeId}
        />

        <VibeFilterBar mode={feedMode === 'beans' ? 'beans' : 'cafes'} active={vibeFilters} onToggle={toggleVibe} />

        <div className="flex items-center justify-between gap-3 py-2 text-xs font-sans text-[#55615D]">
          <span className="font-semibold">{feedMode === 'beans' ? `${beans.length} bean lots` : `${cafes.length} venues`}</span>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="font-bold text-[#1A2225] underline hover:opacity-80 shrink-0">
              Clear filters
            </button>
          )}
        </div>

        {feedMode === 'following' && following.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <h3 className="font-cooper text-xl font-bold text-[#1A2225]">Not following any roasters yet</h3>
            <p className="text-sm font-sans text-[#55615D] max-w-sm mx-auto">
              Follow a micro-roastery from its storefront and their fresh lots surface here.
            </p>
            <button onClick={() => setFeedMode('cafes')} className="h-10 px-5 rounded-full bg-[#1A2225] text-[#FFF9E9] text-xs font-bold font-sans">
              Explore Cafes
            </button>
          </div>
        ) : feedMode === 'beans' ? (
          <BeanGrid beans={beans} savedBeanIds={savedBeanIds} onToggleSave={toggleSaveBean} onSelectBean={openBean} />
        ) : (
          <CafeGrid
            cafes={cafes}
            savedCafeIds={savedCafeIds}
            onToggleSave={toggleSaveCafe}
            onSelectCafe={openCafe}
            onSelectRoastery={openRoastery}
            emptyTitle={feedMode === 'following' ? 'Nothing new from your roasters' : 'No cafes match this pour'}
            emptyBody={
              feedMode === 'following'
                ? 'Your followed roasteries have no venues in this city yet. Widen the city filter.'
                : 'Try clearing a vibe filter or widening the city.'
            }
            emptyAction={hasActiveFilters ? { label: 'Clear Filters', onClick: resetFilters } : undefined}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF4E4] text-[#1A2225] font-sans">
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
      />

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
      />

      <main className="flex-1 pb-28 sm:pb-32">
        {activeTab === 'feed' && renderFeed()}

        {activeTab === 'drops' && <DropsView drops={drops} onInspectBean={openBean} />}

        {activeTab === 'map' && <DavaoCoffeeMap cafes={cafes} onSelectCafe={openCafe} selectedCity={selectedCity} />}

        {activeTab === 'community' && (
          <CommunityView
            cafes={allCafes.map((cafe) => ({ id: cafe.id, name: cafe.name }))}
            authorName="You"
            authorHandle="davaocupper"
            onOpenCafe={openCafe}
          />
        )}

        {activeTab === 'saved' && (
          <SavedView
            key={savedInitialTab}
            initialTab={savedInitialTab}
            onSelectCafe={openCafe}
            onSelectBean={openBean}
            onSelectRoastery={openRoastery}
            onExploreDrops={() => setActiveTab('drops')}
            onExploreFeed={() => setActiveTab('feed')}
          />
        )}

        {activeTab === PORTAL_TAB_ID && renderPortal()}
      </main>

      <CafeDetailModal
        cafe={selectedCafe}
        onClose={closeCafe}
        saved={selectedCafe ? savedCafeIds.includes(selectedCafe.id) : false}
        onToggleSave={toggleSaveCafe}
        onSelectRoastery={openRoastery}
        onViewBean={openBean}
      />

      <BeanDetailModal
        bean={selectedBean}
        onClose={closeBean}
        saved={selectedBean ? savedBeanIds.includes(selectedBean.id) : false}
        onToggleSave={toggleSaveBean}
        onReserve={(bean) => setReserveBeanId(bean.id)}
        onSelectRoastery={openRoastery}
      />

      <BeanReservationModal
        bean={reserveBean}
        onClose={() => setReserveBeanId(null)}
        onReserved={() => setReserveBeanId(null)}
      />

      <FooterSection setActiveTab={setActiveTab} setSelectedCity={setSelectedCity} onJoinRoaster={handleJoinRoaster} />

      <div className="h-16 lg:hidden" aria-hidden="true" />

      <BottomTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedCount}
        isHidden={Boolean(selectedCafe || selectedBean)}
      />
    </div>
  );
};

export default App;
