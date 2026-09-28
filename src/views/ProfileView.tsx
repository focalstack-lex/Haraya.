import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Navigation, Edit3, ChevronRight, LogOut, LogIn, Compass, Store, ShieldCheck } from 'lucide-react';
import {
  WaxStampSealIcon,
  CuppingSpoonIcon,
  CoffeeBagIcon,
  TopoTrailIcon,
  AddSpotIcon,
} from '../components/common/CustomIcons';
import type { Cafe } from '../types/coffee';
import { userPrefsService } from '../services/userPrefsService';
import { catalogService } from '../services/catalogService';
import { sessionService } from '../services/sessionService';
import { useCatalogVersion, usePrefsVersion, useSessionVersion } from '../hooks/useServiceVersions';
import { directionsUrl } from '../utils/geo';
import { isOpenNow, hoursTodayLabel, hasListedHours } from '../utils/calendar';
import { RateCafeModal } from '../components/cafe/RateCafeModal';
import { LargeTitle } from '../components/common/LargeTitle';
import { PrimaryButton } from '../components/common/FormControls';
import { AyaMascot } from '../components/common/AyaMascot';

export type ProfileSection = 'overview' | 'visited' | 'saved';

interface ProfileViewProps {
  onSelectCafe: (cafeId: string) => void;
  onSelectRoastery?: (cafeId: string) => void;
  onExploreFeed: () => void;
  onOpenMap?: () => void;
  onOpenAuth?: () => void;
  onOpenLogin: () => void;
  onOpenPortal: () => void;
  onOpenAdmin: () => void;
  onSignOut: () => void;
  /** Replays the first-visit guided tour on Discover. */
  onStartTour?: () => void;
}

/** Leading icon of a grouped row: a 30px tinted rounded square. */
const RowIcon: React.FC<{ children: React.ReactNode; tone?: 'tint' | 'red' }> = ({ children, tone = 'tint' }) => (
  <span
    className={`h-7.5 w-7.5 shrink-0 rounded-[8px] flex items-center justify-center ${
      tone === 'red' ? 'bg-[#8C3A2E]/12 text-[#8C3A2E]' : 'bg-[#906D4B]/15 text-[#7D5C3D]'
    }`}
  >
    {children}
  </span>
);

/** Centered empty state: title, one line of body, one primary action. */
const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body: string; onAction: () => void }> = ({
  icon,
  title,
  body,
  onAction,
}) => (
  <div className="py-12 px-6 text-center flex flex-col items-center gap-2">
    <span className="text-[#906D4B] mb-1">{icon}</span>
    <h3 className="ios-title text-[19px] text-[#13191F]">{title}</h3>
    <p className="text-[14px] text-[#594C3D] max-w-xs">{body}</p>
    <PrimaryButton onClick={onAction} className="mt-3 w-full sm:w-auto">
      Discover cafes
    </PrimaryButton>
  </div>
);

const actionClass =
  'flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 text-[14px] font-medium ios-press';

export const ProfileView: React.FC<ProfileViewProps> = ({
  onSelectCafe,
  onSelectRoastery: _onSelectRoastery,
  onExploreFeed,
  onOpenMap,
  onOpenAuth,
  onOpenLogin,
  onOpenPortal,
  onOpenAdmin,
  onSignOut,
  onStartTour,
}) => {
  useCatalogVersion();
  usePrefsVersion();
  useSessionVersion();

  const [section, setSection] = useState<ProfileSection>('overview');
  const [ratingCafe, setRatingCafe] = useState<Cafe | null>(null);

  const user = sessionService.getUser();
  const portalRole = sessionService.getPortalRole();
  const ratings = userPrefsService.getRatings();
  const savedCafeIds = userPrefsService.getSavedCafes();

  const ratedCafeIds = Object.keys(ratings);
  const ratedCafes = useMemo(() => {
    return ratedCafeIds
      .map((id) => catalogService.getCafeById(id))
      .filter((cafe): cafe is Cafe => Boolean(cafe))
      .sort((a, b) => {
        const timeA = new Date(ratings[a.id]?.ratedAt ?? 0).getTime();
        const timeB = new Date(ratings[b.id]?.ratedAt ?? 0).getTime();
        return timeB - timeA;
      });
  }, [ratedCafeIds.join(',')]);

  const savedCafes = useMemo(() => {
    return savedCafeIds
      .map((id) => catalogService.getCafeById(id))
      .filter((cafe): cafe is Cafe => Boolean(cafe));
  }, [savedCafeIds.join(',')]);

  const allCafesCount = catalogService.getCafes().length;
  const exploredPercent = Math.round((ratedCafes.length / Math.max(allCafesCount, 1)) * 100);
  const points = ratedCafes.length * 50 + savedCafes.length * 10;

  const displayName = user ? sessionService.getDisplayName() || 'Signed in' : 'Guest';
  const displayEmail = user ? user.email ?? '' : 'Saves and ratings stay on this device';
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'H';

  const segments: { id: ProfileSection; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'visited', label: 'Visited', count: ratedCafes.length },
    { id: 'saved', label: 'Saved', count: savedCafes.length },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4 sm:py-6 space-y-6">
      <LargeTitle title="Saved Spots" />

      {/* Account card and explorer pass */}
      <div className="ios-group ios-card-shadow">
        <div className="ios-group-row py-3.5">
          <span
            className="h-14 w-14 shrink-0 rounded-full bg-[#906D4B] text-[#FFFDF9] flex items-center justify-center text-[20px] font-semibold"
            aria-hidden="true"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[19px] font-semibold leading-tight text-[#13191F] truncate">{displayName}</h2>
              {portalRole === 'admin' && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#906D4B]/15 text-[#7D5C3D] text-[11px] font-semibold">
                  Admin
                </span>
              )}
              {portalRole === 'roaster' && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#3E5C48]/12 text-[#3E5C48] text-[11px] font-semibold">
                  Place owner
                </span>
              )}
            </div>
            <p className="ios-footnote text-[#594C3D] truncate mt-0.5">{displayEmail}</p>
          </div>
        </div>

        {!user && (
          <button onClick={onOpenLogin} className="ios-group-row ios-press">
            <RowIcon>
              <LogIn className="w-4 h-4" strokeWidth={2.2} />
            </RowIcon>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] text-[#13191F]">Sign in or create an account</span>
              <span className="block ios-footnote text-[#594C3D] truncate">Add spots and list your own place</span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
          </button>
        )}

        <div className="ios-group-row">
          <RowIcon>
            <WaxStampSealIcon className="w-4.5 h-4.5" />
          </RowIcon>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] text-[#13191F]">Coffee Explorer Pass</p>
            <p className="ios-footnote text-[#594C3D]">
              <span className="font-mono">{exploredPercent}%</span> of Davao spots explored,{' '}
              <span className="font-mono">{ratedCafes.length}</span> visited
            </p>
          </div>
          <span className="shrink-0 text-[15px] font-semibold font-mono text-[#7D5C3D]">{points} pts</span>
        </div>
      </div>

      {/* Segmented control */}
      <div className="flex p-0.5 rounded-[10px] ios-fill" role="tablist" aria-label="Profile sections">
        {segments.map((entry) => {
          const active = section === entry.id;
          return (
            <button
              key={entry.id}
              role="tab"
              aria-selected={active}
              onClick={() => setSection(entry.id)}
              className="relative flex-1 h-8 px-2 rounded-[8px] text-[13px] font-semibold font-sans whitespace-nowrap"
            >
              {active && (
                <motion.span
                  layoutId="profile-section-thumb"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-[8px] bg-[#FFFDF9] shadow-[0_1px_4px_rgba(19,25,31,0.14),0_0_0_0.5px_rgba(19,25,31,0.04)]"
                />
              )}
              <span className={`relative ${active ? 'text-[#13191F]' : 'text-[#594C3D]'}`}>
                {entry.label}
                {entry.count !== undefined && <span className="font-mono"> ({entry.count})</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Overview: Settings-style grouped rows */}
      {section === 'overview' && (
        <div className="space-y-6">
          <section className="space-y-1.5">
            <h3 className="px-4 text-[13px] text-[#594C3D]">Your coffee</h3>
            <div className="ios-group">
              <button onClick={() => setSection('visited')} className="ios-group-row ios-press">
                <RowIcon>
                  <CuppingSpoonIcon className="w-4.5 h-4.5" />
                </RowIcon>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-[#13191F]">Visited and rated cafes</span>
                  <span className="block ios-footnote text-[#594C3D] truncate">Places reviewed with tasting notes</span>
                </span>
                <span className="shrink-0 text-[15px] font-mono text-[#6E6150]">{ratedCafes.length}</span>
                <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
              </button>

              <button onClick={() => setSection('saved')} className="ios-group-row ios-press">
                <RowIcon>
                  <CoffeeBagIcon className="w-4.5 h-4.5" />
                </RowIcon>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-[#13191F]">Saved wishlist</span>
                  <span className="block ios-footnote text-[#594C3D] truncate">Bookmarked spots to visit</span>
                </span>
                <span className="shrink-0 text-[15px] font-mono text-[#6E6150]">{savedCafes.length}</span>
                <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
              </button>
            </div>
          </section>

          <section className="space-y-1.5">
            <h3 className="px-4 text-[13px] text-[#594C3D]">Explore</h3>
            <div className="ios-group">
              <button onClick={onOpenMap ?? onExploreFeed} className="ios-group-row ios-press">
                <RowIcon>
                  <TopoTrailIcon className="w-4.5 h-4.5" />
                </RowIcon>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-[#13191F]">Map and spots</span>
                  <span className="block ios-footnote text-[#594C3D] truncate">
                    Curated regional walking and tasting routes
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
              </button>

              <button onClick={onOpenAuth ?? onExploreFeed} className="ios-group-row ios-press">
                <RowIcon>
                  <AddSpotIcon className="w-4.5 h-4.5" />
                </RowIcon>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-[#13191F]">Add a hidden spot</span>
                  <span className="block ios-footnote text-[#594C3D] truncate">
                    Share a quiet corner that is not on the map yet
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
              </button>

              {onStartTour && (
                <button onClick={onStartTour} className="ios-group-row ios-press">
                  <RowIcon>
                    <Compass className="w-4 h-4" strokeWidth={2} />
                  </RowIcon>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] text-[#13191F]">Take the tour again</span>
                    <span className="block ios-footnote text-[#594C3D] truncate">A quick walk through Discover</span>
                  </span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </section>

          <section className="space-y-1.5">
            <h3 className="px-4 text-[13px] text-[#594C3D]">Your place</h3>
            <div className="ios-group">
              <button onClick={onOpenPortal} className="ios-group-row ios-press">
                <RowIcon>
                  <Store className="w-4 h-4" strokeWidth={2.2} />
                </RowIcon>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-[#13191F]">
                    {portalRole === 'roaster' ? 'Manage your listing' : 'List your cafe or study spot'}
                  </span>
                  <span className="block ios-footnote text-[#594C3D] truncate">
                    {portalRole === 'roaster' ? 'Hours, amenities, menu and more' : 'Own a place? Get a verified listing'}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
              </button>

              {portalRole === 'admin' && (
                <button onClick={onOpenAdmin} className="ios-group-row ios-press">
                  <RowIcon>
                    <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
                  </RowIcon>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] text-[#13191F]">Control Room</span>
                    <span className="block ios-footnote text-[#594C3D] truncate">Review spots, applications and accounts</span>
                  </span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </section>

          {user && (
            <div className="ios-group">
              <button onClick={onSignOut} className="ios-group-row ios-press">
                <RowIcon tone="red">
                  <LogOut className="w-4 h-4" strokeWidth={2.2} />
                </RowIcon>
                <span className="flex-1 min-w-0 text-[15px] text-[#8C3A2E]">Sign out</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Visited and rated cafes */}
      {section === 'visited' &&
        (ratedCafes.length === 0 ? (
          <EmptyState
            icon={<AyaMascot pose="empty" size={112} alt="" />}
            title="No visited cafes yet"
            body="Rate your cup at a Davao cafe and keep your tasting notes here."
            onAction={onExploreFeed}
          />
        ) : (
          <div className="space-y-3">
            {ratedCafes.map((cafe) => {
              const userRating = ratings[cafe.id];
              const openNow = isOpenNow(cafe.hours);
              const hoursKnown = hasListedHours(cafe.hours);
              return (
                <article key={cafe.id} className="bg-[#FFFDF9] rounded-[20px] ios-card-shadow overflow-hidden">
                  <button
                    onClick={() => onSelectCafe(cafe.id)}
                    className="w-full flex items-center gap-3 p-3 text-left ios-press active:scale-[0.99]"
                  >
                    <img
                      src={cafe.images[0]}
                      alt=""
                      loading="lazy"
                      className="h-16 w-16 rounded-[12px] object-cover shrink-0 bg-[#13191F]"
                    />
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="flex items-center gap-2">
                        <span className="ios-headline text-[#13191F] truncate">{cafe.name}</span>
                        <span className="ml-auto inline-flex items-center gap-1 shrink-0 text-[#13191F]">
                          <Star className="w-3.5 h-3.5 fill-[#CA9C68] text-[#CA9C68]" />
                          <span className="font-mono text-[13px] font-semibold">{userRating?.rating}.0</span>
                        </span>
                      </span>
                      <span className="block ios-footnote text-[#594C3D] truncate">
                        {cafe.district}, {cafe.city} ·{' '}
                        <span className={!hoursKnown ? 'text-[#594C3D]' : openNow ? 'text-[#3E5C48] font-medium' : 'text-[#8C3A2E]'}>
                          {!hoursKnown ? 'Hours not listed' : openNow ? 'Open' : 'Closed'}
                        </span>
                      </span>
                      {userRating?.note ? (
                        <span className="block ios-footnote text-[#13191F] italic truncate">"{userRating.note}"</span>
                      ) : cafe.signature ? (
                        <span className="block ios-footnote text-[#594C3D] truncate">Signature: {cafe.signature}</span>
                      ) : null}
                    </span>
                  </button>

                  <div className="flex ios-hairline-t">
                    <a
                      href={directionsUrl([{ lat: cafe.lat, lng: cafe.lng }])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${actionClass} text-[#7D5C3D]`}
                    >
                      <Navigation className="w-4 h-4" />
                      Directions
                    </a>
                    <button
                      onClick={() => setRatingCafe(cafe)}
                      className={`${actionClass} text-[#7D5C3D] shadow-[inset_0.5px_0_0_rgba(89,76,61,0.2)]`}
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit note
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ))}

      {/* Saved wishlist */}
      {section === 'saved' &&
        (savedCafes.length === 0 ? (
          <EmptyState
            icon={<AyaMascot pose="empty" size={112} alt="" />}
            title="No saved places yet"
            body="Bookmark cafes around Davao Region to keep them on your wishlist."
            onAction={onExploreFeed}
          />
        ) : (
          <div className="space-y-3">
            {savedCafes.map((cafe) => {
              const openNow = isOpenNow(cafe.hours);
              const hoursKnown = hasListedHours(cafe.hours);
              return (
                <article key={cafe.id} className="bg-[#FFFDF9] rounded-[20px] ios-card-shadow overflow-hidden">
                  <button
                    onClick={() => onSelectCafe(cafe.id)}
                    className="w-full flex items-center gap-3 p-3 text-left ios-press active:scale-[0.99]"
                  >
                    <img
                      src={cafe.images[0]}
                      alt=""
                      loading="lazy"
                      className="h-16 w-16 rounded-[12px] object-cover shrink-0 bg-[#13191F]"
                    />
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block ios-headline text-[#13191F] truncate">{cafe.name}</span>
                      <span className="block ios-footnote text-[#594C3D] truncate">
                        {cafe.district}, {cafe.city} ·{' '}
                        <span className={!hoursKnown ? 'text-[#594C3D]' : openNow ? 'text-[#3E5C48] font-medium' : 'text-[#8C3A2E]'}>
                          {!hoursKnown ? 'Hours not listed' : openNow ? `Open · ${hoursTodayLabel(cafe.hours)}` : 'Closed'}
                        </span>
                      </span>
                      {cafe.signature && (
                        <span className="block ios-footnote text-[#594C3D] truncate">
                          Signature: <span className="text-[#13191F] font-medium">{cafe.signature}</span>
                        </span>
                      )}
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
                  </button>

                  <div className="flex ios-hairline-t">
                    <a
                      href={directionsUrl([{ lat: cafe.lat, lng: cafe.lng }])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${actionClass} text-[#7D5C3D]`}
                    >
                      <Navigation className="w-4 h-4" />
                      Directions
                    </a>
                    <button
                      onClick={() => setRatingCafe(cafe)}
                      className={`${actionClass} text-[#7D5C3D] shadow-[inset_0.5px_0_0_rgba(89,76,61,0.2)]`}
                    >
                      <Star className="w-4 h-4" />
                      Rate
                    </button>
                    <button
                      onClick={() => userPrefsService.toggleSavedCafe(cafe)}
                      className={`${actionClass} text-[#8C3A2E] shadow-[inset_0.5px_0_0_rgba(89,76,61,0.2)]`}
                      title="Remove from saved"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ))}

      {/* Rate Modal */}
      <RateCafeModal
        cafe={ratingCafe}
        isOpen={Boolean(ratingCafe)}
        onClose={() => setRatingCafe(null)}
      />
    </div>
  );
};
