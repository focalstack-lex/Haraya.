import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Navigation, Edit3, ChevronRight, LogOut, LogIn, Compass, Store, ShieldCheck, Globe2, Lock, Smartphone, SquarePlus } from 'lucide-react';
import {
  TopoTrailIcon,
  AddSpotIcon,
  CupClinkIcon,
  FocusTimerIcon,
  RubberStampIcon,
} from '../components/common/CustomIcons';
import type { Cafe } from '../types/coffee';
import { DAVAO_CITIES } from '../types/coffee';
import { userPrefsService } from '../services/userPrefsService';
import { catalogService } from '../services/catalogService';
import { sessionService } from '../services/sessionService';
import { visitService } from '../services/visitService';
import { formatDuration, formatHours, NOISE_LEVELS, OUTLET_STATUSES, timeAgo, type Visit } from '../services/visitMapping';
import { useCatalogVersion, usePrefsVersion, useSessionVersion, useVisitVersion } from '../hooks/useServiceVersions';
import { PassportStamp } from '../components/passport/PassportStamp';
import { directionsUrl } from '../utils/geo';
import { isOpenNow, hoursTodayLabel, hasListedHours } from '../utils/calendar';
import { RateCafeModal } from '../components/cafe/RateCafeModal';
import { LargeTitle } from '../components/common/LargeTitle';
import { PrimaryButton } from '../components/common/FormControls';
import { AyaMascot } from '../components/common/AyaMascot';

export type ProfileSection = 'diary' | 'passport' | 'saved';

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
  onInstallApp?: () => void;
  /** Opens a given tab, for example the passport after a Quick Stamp. `at` makes repeat requests distinct. */
  sectionRequest?: { section: ProfileSection; at: number } | null;
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
const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body: string; onAction: () => void; actionLabel?: string }> = ({
  icon,
  title,
  body,
  onAction,
  actionLabel = 'Discover cafes',
}) => (
  <div className="py-12 px-6 text-center flex flex-col items-center gap-2">
    <span className="text-[#906D4B] mb-1">{icon}</span>
    <h3 className="ios-title text-[19px] text-[#13191F]">{title}</h3>
    <p className="text-[14px] text-[#594C3D] max-w-xs">{body}</p>
    <PrimaryButton onClick={onAction} className="mt-3 w-full sm:w-auto">
      {actionLabel}
    </PrimaryButton>
  </div>
);


const NOISE_LABEL = Object.fromEntries(NOISE_LEVELS.map((level) => [level.id, level.label]));
const OUTLET_LABEL = Object.fromEntries(OUTLET_STATUSES.map((status) => [status.id, status.label]));

/** Who can see a diary entry: this device only, only the author, or everyone. */
const Visibility: React.FC<{ visit: Visit }> = ({ visit }) => {
  const [Icon, label] = !visit.synced
    ? [Smartphone, 'On this device']
    : visit.isPublic
      ? [Globe2, 'Public']
      : [Lock, 'Only me'];
  return (
    <span className="ios-footnote text-[#594C3D] inline-flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};

/** One diary entry: a Strava-style card for a focus session or a Quick Stamp. */
const DiaryEntry: React.FC<{ visit: Visit; now: Date; onOpen?: () => void }> = ({ visit, now, onOpen }) => {
  const details = [
    visit.drinkOrdered,
    visit.noiseLevel ? `${NOISE_LABEL[visit.noiseLevel]} room` : null,
    visit.outletsStatus ? `Outlets: ${OUTLET_LABEL[visit.outletsStatus].toLowerCase()}` : null,
  ].filter((value): value is string => Boolean(value));
  return (
    <article className="bg-[#FFFDF9] rounded-[20px] ios-card-shadow overflow-hidden">
      <button onClick={onOpen} disabled={!onOpen} className="w-full p-4 pb-3 flex items-start gap-3 text-left ios-press disabled:active:scale-100">
        <span className="h-10 w-10 shrink-0 rounded-full bg-[#906D4B]/15 text-[#7D5C3D] flex items-center justify-center">
          {visit.sessionType === 'focus' ? <FocusTimerIcon className="w-5 h-5" /> : <RubberStampIcon className="w-5 h-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block ios-headline text-[#13191F] truncate">{visit.cafeName}</span>
          <span className="block ios-footnote text-[#594C3D] truncate">
            {visit.sessionType === 'focus' ? 'Focus session' : 'Quick stamp'} · {timeAgo(visit.createdAt, now)}
          </span>
        </span>
        <span className="shrink-0 font-mono text-[17px] font-semibold text-[#13191F]">{formatDuration(visit.durationMinutes)}</span>
      </button>
      {(details.length > 0 || visit.notes) && (
        <div className="px-4 pb-3 space-y-2">
          {details.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {details.map((detail) => (
                <span key={detail} className="h-7 inline-flex items-center px-2.5 rounded-full ios-fill text-[12px] font-medium text-[#13191F]">
                  {detail}
                </span>
              ))}
            </div>
          )}
          {visit.notes && <p className="text-[14px] text-[#13191F] leading-relaxed break-words">{visit.notes}</p>}
        </div>
      )}
      <div className="px-4 py-2.5 ios-hairline-t flex items-center justify-between gap-3">
        <Visibility visit={visit} />
        <span className="inline-flex items-center gap-1 text-[#594C3D]" aria-label={`${visit.clinksCount} Cup Clinks received`}>
          <CupClinkIcon className="w-4.5 h-4.5" />
          <span className="font-mono text-[14px] font-semibold">{visit.clinksCount}</span>
        </span>
      </div>
    </article>
  );
};

interface StampEntry {
  id: string;
  name: string;
  city: string;
  stampedAt: string | null;
  inCatalog: boolean;
}

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
  onInstallApp,
  sectionRequest,
}) => {
  useCatalogVersion();
  usePrefsVersion();
  useSessionVersion();
  useVisitVersion();

  const [section, setSection] = useState<ProfileSection>('diary');
  const [ratingCafe, setRatingCafe] = useState<Cafe | null>(null);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  useEffect(() => {
    if (sectionRequest) setSection(sectionRequest.section);
  }, [sectionRequest]);

  const user = sessionService.getUser();
  const portalRole = sessionService.getPortalRole();
  const ratings = userPrefsService.getRatings();
  const savedCafeIds = userPrefsService.getSavedCafes();
  const visits = visitService.getUserVisits();
  const stats = visitService.getPassportStats();
  const passportPublic = visitService.isPassportPublic();
  const now = new Date();

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

  // Passport pages: every listed spot per city (ink when visited, ghost when not), plus visited spots that
  // have since left the catalog, so a stamp is never lost.
  const allCafes = catalogService.getCafes();
  const passportCities = useMemo(() => {
    const cities = DAVAO_CITIES.filter((city) => city !== 'All Davao Region');
    const entries = new Map<string, StampEntry[]>(cities.map((city) => [city, []]));
    for (const cafe of allCafes) {
      entries.get(cafe.city)?.push({
        id: cafe.id,
        name: cafe.name,
        city: cafe.city,
        stampedAt: stats.stamps.get(cafe.id) ?? null,
        inCatalog: true,
      });
    }
    const listed = new Set(allCafes.map((cafe) => cafe.id));
    for (const [cafeId, stampedAt] of stats.stamps) {
      if (listed.has(cafeId)) continue;
      const visit = visits.find((entry) => entry.cafeId === cafeId);
      if (!visit) continue;
      const list = entries.get(visit.city) ?? [];
      list.push({ id: cafeId, name: visit.cafeName, city: visit.city, stampedAt, inCatalog: false });
      entries.set(visit.city, list);
    }
    return [...entries].map(([city, list]) => ({
      city,
      stamps: list.sort((a, b) => Number(Boolean(b.stampedAt)) - Number(Boolean(a.stampedAt)) || a.name.localeCompare(b.name)),
    }));
  }, [allCafes, stats.stamps, visits]);
  const totalSpots = passportCities.reduce((sum, entry) => sum + entry.stamps.length, 0);
  const unchartedCities = passportCities.filter((entry) => entry.stamps.length === 0).map((entry) => entry.city);

  const displayName = user ? sessionService.getDisplayName() || 'Signed in' : 'Guest';
  const displayEmail = user ? user.email ?? '' : 'Your passport stays on this device';
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'H';

  const togglePrivacy = async () => {
    setPrivacyError(null);
    try {
      await visitService.setPassportPublic(!passportPublic);
    } catch (error) {
      setPrivacyError(error instanceof Error ? error.message : 'Could not change passport privacy.');
    }
  };

  const segments: { id: ProfileSection; label: string; count: number }[] = [
    { id: 'diary', label: 'Diary', count: visits.length },
    { id: 'passport', label: 'Passport', count: stats.stamps.size },
    { id: 'saved', label: 'Saved', count: savedCafes.length },
  ];

  const metrics = [
    { label: 'Focus hours', value: formatHours(stats.focusMinutes) },
    { label: 'Sanctuaries visited', value: String(stats.stamps.size) },
    { label: 'Cup Clinks received', value: String(stats.clinksReceived) },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4 sm:py-6 space-y-6">
      <LargeTitle title="Passport" />

      {/* Account, ledger totals and privacy */}
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

        <dl className="grid grid-cols-3 ios-hairline-t">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`px-2 py-3 text-center flex flex-col-reverse justify-end gap-0.5 ${index > 0 ? 'shadow-[inset_0.5px_0_0_rgba(89,76,61,0.2)]' : ''}`}
            >
              <dt className="text-[11px] leading-tight text-[#594C3D]">{metric.label}</dt>
              <dd className="font-mono text-[20px] font-semibold leading-tight text-[#13191F]">{metric.value}</dd>
            </div>
          ))}
        </dl>

        {user ? (
          <div className="ios-group-row">
            <RowIcon>{passportPublic ? <Globe2 className="w-4 h-4" strokeWidth={2.2} /> : <Lock className="w-4 h-4" strokeWidth={2.2} />}</RowIcon>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] text-[#13191F]">{passportPublic ? 'Public profile' : 'Private profile'}</span>
              <span className="block ios-footnote text-[#594C3D]">
                {passportPublic ? 'Public sessions show on spot pages and can get Cup Clinks' : 'Only you see your sessions'}
              </span>
            </span>
            <button
              role="switch"
              aria-checked={passportPublic}
              aria-label="Public profile"
              onClick={togglePrivacy}
              className="h-11 w-14 -mr-1 shrink-0 flex items-center justify-center"
            >
              <span className={`relative h-[31px] w-[51px] rounded-full transition-colors ${passportPublic ? 'bg-[#3E5C48]' : 'bg-[#766046]/25'}`}>
                <span
                  className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-[#FFFDF9] shadow-[0_2px_6px_rgba(19,25,31,0.2)] transition-[left] duration-200 ${
                    passportPublic ? 'left-[22px]' : 'left-[2px]'
                  }`}
                />
              </span>
            </button>
          </div>
        ) : (
          <button onClick={onOpenLogin} className="ios-group-row ios-press">
            <RowIcon>
              <LogIn className="w-4 h-4" strokeWidth={2.2} />
            </RowIcon>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] text-[#13191F]">Sign in or create an account</span>
              <span className="block ios-footnote text-[#594C3D] truncate">Keep your passport, share sessions, list your place</span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" strokeWidth={2.5} />
          </button>
        )}
      </div>
      {privacyError && (
        <p role="alert" className="-mt-4 px-4 ios-footnote text-[#8C3A2E]">
          {privacyError}
        </p>
      )}

      {/* Segmented control */}
      <div className="flex p-0.5 rounded-[10px] ios-fill" role="tablist" aria-label="Passport sections">
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
                <span className="font-mono"> ({entry.count})</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Diary: every focus session and stamp, newest first */}
      {section === 'diary' &&
        (visits.length === 0 ? (
          <EmptyState
            icon={<AyaMascot pose="clink" size={120} alt="" />}
            title="Your diary is empty"
            body="Check in at a spot to log a focus session or collect a Quick Stamp. Every visit lands here."
            onAction={onExploreFeed}
            actionLabel="Find a spot"
          />
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => (
              <DiaryEntry
                key={visit.id}
                visit={visit}
                now={now}
                onOpen={catalogService.getCafeById(visit.cafeId) ? () => onSelectCafe(visit.cafeId) : undefined}
              />
            ))}
          </div>
        ))}

      {/* Passport: stamps grouped by city */}
      {section === 'passport' && (
        <div className="space-y-6">
          <div className="bg-[#FFFDF9] rounded-[20px] ios-card-shadow p-4 flex items-center gap-3">
            <AyaMascot pose="stamp" size={92} alt="" className="-my-2" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="ios-headline text-[#13191F]">
                <span className="font-mono">{stats.stamps.size}</span> of <span className="font-mono">{totalSpots}</span> spots stamped
              </p>
              <div className="h-1.5 rounded-full ios-fill overflow-hidden" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-[#906D4B]"
                  style={{ width: `${totalSpots ? Math.round((stats.stamps.size / totalSpots) * 100) : 0}%` }}
                />
              </div>
              <p className="ios-footnote text-[#594C3D]">A stamp inks in when you check in within 120 m of the spot.</p>
            </div>
          </div>

          {passportCities
            .filter((entry) => entry.stamps.length > 0)
            .map((entry) => {
              const stamped = entry.stamps.filter((stamp) => stamp.stampedAt).length;
              return (
                <section key={entry.city} className="space-y-2" aria-labelledby={`passport-${entry.city}`}>
                  <div className="px-4 flex items-baseline justify-between gap-3">
                    <h3 id={`passport-${entry.city}`} className="ios-headline text-[#13191F]">
                      {entry.city}
                    </h3>
                    <span className="ios-footnote text-[#594C3D]">
                      <span className="font-mono">{stamped}</span> of <span className="font-mono">{entry.stamps.length}</span>
                    </span>
                  </div>
                  <ul className="grid grid-cols-3 sm:grid-cols-4 gap-x-2 gap-y-4 bg-[#FFFDF9] rounded-[20px] ios-card-shadow px-2 py-4">
                    {entry.stamps.map((stamp) => (
                      <li key={stamp.id} className="min-w-0">
                        <button
                          onClick={stamp.inCatalog ? () => onSelectCafe(stamp.id) : undefined}
                          disabled={!stamp.inCatalog}
                          className="w-full flex flex-col items-center gap-1.5 text-center ios-press disabled:active:scale-100"
                        >
                          <PassportStamp
                            cafeName={stamp.name}
                            city={stamp.city}
                            stampedAt={stamp.stampedAt}
                            seed={stamp.id}
                            className="w-full h-auto max-w-[96px]"
                          />
                          <span className="block w-full px-0.5 text-[12px] font-medium leading-tight text-[#13191F] truncate">{stamp.name}</span>
                          <span className="block text-[11px] leading-tight text-[#594C3D]">
                            {stamp.stampedAt
                              ? new Date(stamp.stampedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
                              : 'Not yet'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

          {unchartedCities.length > 0 && (
            <p className="px-4 ios-footnote text-[#594C3D]">
              No spots listed yet in {unchartedCities.join(', ')}. Know one?{' '}
              <button onClick={onOpenAuth ?? onExploreFeed} className="font-semibold text-[#7D5C3D] underline underline-offset-2">
                Add a spot
              </button>
            </p>
          )}
        </div>
      )}

      {/* Saved wishlist, then cafes rated with tasting notes */}
      {section === 'saved' && (
        <div className="space-y-6">
          {savedCafes.length === 0 ? (
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
          )}

          {ratedCafes.length > 0 && (
            <section className="space-y-1.5">
              <h3 className="px-4 text-[13px] text-[#594C3D]">Rated cafes</h3>
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
            </section>
          )}
        </div>
      )}

      {/* Account and places: always below the tabs */}
      <div className="space-y-6">
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

            {onInstallApp && (
              <button onClick={onInstallApp} className="ios-group-row ios-press">
                <RowIcon>
                  <SquarePlus className="w-4 h-4" strokeWidth={2} />
                </RowIcon>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-[#13191F]">Add Haraya to your home screen</span>
                  <span className="block ios-footnote text-[#594C3D] truncate">Open me like an app, no app store</span>
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

        <section className="space-y-1.5">
          <h3 className="px-4 text-[13px] text-ink-2">About</h3>
          <div className="ios-group">
            <a href="#/tab/privacy" className="ios-group-row ios-press">
              <span className="flex-1 min-w-0 text-[15px] text-ink">Privacy Notice</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-ink-3/60" strokeWidth={2.5} />
            </a>
            <a href="#/tab/terms" className="ios-group-row ios-press">
              <span className="flex-1 min-w-0 text-[15px] text-ink">Terms of Use</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-ink-3/60" strokeWidth={2.5} />
            </a>
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

      {/* Rate Modal */}
      <RateCafeModal
        cafe={ratingCafe}
        isOpen={Boolean(ratingCafe)}
        onClose={() => setRatingCafe(null)}
      />
    </div>
  );
};
