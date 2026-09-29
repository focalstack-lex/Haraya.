import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Check, ClipboardList, ExternalLink, LogIn, MapPin, ShieldCheck, Store, Users, X } from 'lucide-react';
import { LargeTitle } from '../common/LargeTitle';
import { ErrorNote, PrimaryButton } from '../common/FormControls';
import { SpotReviewQueue } from './SpotReviewQueue';
import { sessionService } from '../../services/sessionService';
import { spotService } from '../../services/spotService';
import { placeService } from '../../services/placeService';
import { adminService } from '../../services/adminService';
import { catalogService } from '../../services/catalogService';
import { placeTypeLabel, type PlaceApplicationRow } from '../../services/placeMapping';
import { useAdminVersion, useCatalogVersion, usePlaceVersion, useSessionVersion, useSpotVersion } from '../../hooks/useServiceVersions';
import type { Profile, ProfileRole } from '../../types/auth';

interface AdminDashboardProps {
  onViewCafe: (cafeId: string) => void;
  onOpenLogin: () => void;
}

type AdminTab = 'overview' | 'spots' | 'places' | 'users';

const CARD = 'rounded-[20px] bg-surface ios-card-shadow p-4 sm:p-5';

/** A public listing from the cafes table (not a curated, community or legacy browser-only cafe). */
const isListedPlace = (cafe: { id: string }) => placeService.isListed(cafe.id);

const ROLE_LABELS: Record<ProfileRole, string> = {
  guest: 'Member',
  roaster: 'Place owner',
  admin: 'Admin',
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ComponentType<{ className?: string }>; onClick?: () => void }> = ({
  label,
  value,
  icon: Icon,
  onClick,
}) => {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-[13px] text-ink-2">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      <span className="block font-mono text-[28px] font-bold leading-tight text-ink">{value.toLocaleString()}</span>
    </>
  );
  return onClick ? (
    <button onClick={onClick} className={`${CARD} text-left space-y-1 ios-press`}>
      {body}
    </button>
  ) : (
    <div className={`${CARD} space-y-1`}>{body}</div>
  );
};

/** Place applications: approve creates the listing and makes the applicant its owner. */
const ApplicationQueue: React.FC<{ rows: PlaceApplicationRow[]; onViewCafe: (cafeId: string) => void }> = ({ rows, onViewCafe }) => {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const review = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setError('');
    try {
      await placeService.reviewApplication(id, status, notes[id] ?? '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the review.');
    } finally {
      setBusyId(null);
    }
  };

  const pending = rows.filter((row) => row.status === 'pending');
  const reviewed = rows.filter((row) => row.status !== 'pending');

  return (
    <div className="space-y-6">
      <section className="space-y-2" aria-labelledby="place-queue-title">
        <h2 id="place-queue-title" className="ios-title px-1">
          Place applications <span className="font-mono text-ink-2">({pending.length})</span>
        </h2>
        {error && <ErrorNote message={error} />}
        {pending.length === 0 ? (
          <p className="px-1 text-[14px] text-ink-2">No applications waiting.</p>
        ) : (
          pending.map((row) => (
            <article key={row.id} className={`${CARD} space-y-2.5`}>
              <div>
                <h3 className="ios-headline text-ink">{row.business_name}</h3>
                <p className="ios-footnote text-ink-2">
                  {placeTypeLabel(row.place_type)}
                  {' · '}
                  {row.address}, {row.district}, {row.city}
                </p>
                <p className="ios-footnote text-ink-2 mt-1">
                  Permit <span className="font-mono text-ink">{row.permit_number}</span>
                  {' · '}
                  {row.contact_name}
                  {row.contact_phone ? ` · ${row.contact_phone}` : ''}
                </p>
                {row.description && <p className="text-[14px] text-ink/85 mt-1">{row.description}</p>}
                <p className="ios-footnote text-ink-2 mt-1">
                  <span className="font-mono">{row.lat.toFixed(5)}, {row.lng.toFixed(5)}</span>
                  {' · '}
                  sent {new Date(row.created_at).toLocaleDateString()}
                </p>
              </div>
              <input
                value={notes[row.id] ?? ''}
                onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))}
                maxLength={280}
                placeholder="Note to the applicant (shown if rejected)"
                aria-label={`Review note for ${row.business_name}`}
                className="w-full h-11 ios-fill rounded-[12px] px-3.5 text-[14px] text-ink placeholder:text-ink-3 focus:outline-none focus:shadow-[0_0_0_2px_#906D4B]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => void review(row.id, 'approved')}
                  disabled={busyId === row.id}
                  className="h-11 flex-1 rounded-full bg-ok text-surface text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ios-press"
                >
                  <Check className="w-4 h-4" /> Approve and list
                </button>
                <button
                  onClick={() => void review(row.id, 'rejected')}
                  disabled={busyId === row.id}
                  className="h-11 flex-1 rounded-full ios-fill text-danger text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ios-press"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="space-y-1.5" aria-labelledby="place-history-title">
          <h2 id="place-history-title" className="px-4 text-[13px] text-ink-2">
            Reviewed
          </h2>
          <ul className="ios-group ios-card-shadow">
            {reviewed.map((row) => (
              <li key={row.id} className="ios-group-row">
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-ink truncate">{row.business_name}</span>
                  <span className="block ios-footnote text-ink-2 truncate">
                    {row.reviewed_at ? new Date(row.reviewed_at).toLocaleDateString() : ''}
                    {row.review_note ? ` · ${row.review_note}` : ''}
                  </span>
                </span>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    row.status === 'approved' ? 'bg-ok/12 text-ok' : 'bg-danger/12 text-danger'
                  }`}
                >
                  {row.status === 'approved' ? 'Listed' : 'Rejected'}
                </span>
                {row.status === 'approved' && row.cafe_id && (
                  <button onClick={() => onViewCafe(row.cafe_id ?? '')} aria-label={`View ${row.business_name}`} className="h-11 w-11 -mr-2 flex items-center justify-center text-tint-ink ios-press">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

/** Every public listing with its verified badge toggle. */
const ListingsPanel: React.FC<{ onViewCafe: (cafeId: string) => void }> = ({ onViewCafe }) => {
  useCatalogVersion();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const listed = catalogService.getCafes().filter(isListedPlace);

  const toggleVerified = async (cafeId: string, verified: boolean) => {
    setBusyId(cafeId);
    setError('');
    try {
      await placeService.setVerified(cafeId, !verified);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update verification.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-2" aria-labelledby="listings-title">
      <h2 id="listings-title" className="ios-title px-1">
        Listed places <span className="font-mono text-ink-2">({listed.length})</span>
      </h2>
      {error && <ErrorNote message={error} />}
      {listed.length === 0 ? (
        <p className="px-1 text-[14px] text-ink-2">No listings yet. Approved place applications appear here.</p>
      ) : (
        <ul className="ios-group ios-card-shadow">
          {listed.map((cafe) => (
            <li key={cafe.id} className="ios-group-row">
              <img src={cafe.logoUrl} alt="" className="h-10 w-10 rounded-[10px] object-cover shrink-0 bg-sunken" />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] text-ink truncate">{cafe.name}</span>
                <span className="block ios-footnote text-ink-2 truncate">
                  {cafe.district}, {cafe.city}
                </span>
              </span>
              <button
                onClick={() => void toggleVerified(cafe.id, cafe.verified)}
                disabled={busyId === cafe.id}
                aria-pressed={cafe.verified}
                className={`h-9 px-3 rounded-full text-[13px] font-semibold inline-flex items-center gap-1 disabled:opacity-50 ios-press ${
                  cafe.verified ? 'bg-ok text-surface' : 'ios-fill text-ink'
                }`}
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                {cafe.verified ? 'Verified' : 'Unverified'}
              </button>
              <button onClick={() => onViewCafe(cafe.id)} aria-label={`View ${cafe.name}`} className="h-11 w-11 -mr-2 flex items-center justify-center text-tint-ink ios-press">
                <ExternalLink className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

/** Accounts and roles. The database refuses a change to the caller's own role. */
const UsersPanel: React.FC<{ profiles: Profile[] }> = ({ profiles }) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const me = sessionService.getUser()?.id;

  const changeRole = async (profileId: string, role: ProfileRole) => {
    setBusyId(profileId);
    setError('');
    try {
      await adminService.setRole(profileId, role);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not change the role.');
    } finally {
      setBusyId(null);
    }
  };

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? profiles.filter((profile) => profile.email.toLowerCase().includes(needle) || profile.name.toLowerCase().includes(needle))
    : profiles;

  return (
    <section className="space-y-3" aria-labelledby="users-title">
      <h2 id="users-title" className="ios-title px-1">
        Accounts <span className="font-mono text-ink-2">({profiles.length})</span>
      </h2>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by email or name"
        aria-label="Search accounts"
        className="w-full h-11 ios-fill rounded-[12px] px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:shadow-[0_0_0_2px_#906D4B]"
      />
      {error && <ErrorNote message={error} />}
      {adminService.getLoadError() && <ErrorNote message={adminService.getLoadError() ?? ''} />}
      {shown.length === 0 ? (
        <p className="px-1 text-[14px] text-ink-2">No accounts match.</p>
      ) : (
        <ul className="ios-group ios-card-shadow">
          {shown.map((profile) => {
            const self = profile.id === me;
            return (
              <li key={profile.id} className="ios-group-row">
                <span className="h-9 w-9 shrink-0 rounded-full bg-tint/15 text-tint-ink flex items-center justify-center text-[14px] font-semibold" aria-hidden="true">
                  {(profile.name || profile.email)[0]?.toUpperCase() ?? '?'}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-ink truncate">
                    {profile.name || profile.email}
                    {self ? ' (you)' : ''}
                  </span>
                  <span className="block ios-footnote text-ink-2 truncate">
                    {profile.email}
                    {profile.business_name ? ` · ${profile.business_name}` : ''}
                    {' · joined '}
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </span>
                <label className="shrink-0">
                  <span className="sr-only">Role for {profile.email}</span>
                  <select
                    value={profile.role}
                    disabled={self || busyId === profile.id}
                    onChange={(event) => void changeRole(profile.id, event.target.value as ProfileRole)}
                    className="h-9 ios-fill rounded-[10px] px-2.5 text-[13px] font-semibold text-ink focus:outline-none focus:shadow-[0_0_0_2px_#906D4B] disabled:opacity-60"
                  >
                    {(Object.keys(ROLE_LABELS) as ProfileRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <p className="px-1 ios-footnote text-ink-2">
        Place owner is granted automatically when a place application is approved. Setting it here does not create a listing.
      </p>
    </section>
  );
};

/** Control Room: spot and place review queues, listings, accounts. Admin role comes from the database. */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewCafe, onOpenLogin }) => {
  useSessionVersion();
  useSpotVersion();
  usePlaceVersion();
  useAdminVersion();
  const [tab, setTab] = useState<AdminTab>('overview');

  const user = sessionService.getUser();
  const admin = sessionService.isAdmin();

  useEffect(() => {
    if (!admin) return;
    void adminService.refresh();
    void placeService.refresh();
    void spotService.refresh();
  }, [admin]);

  if (!sessionService.isAvailable()) {
    return (
      <div className="max-w-md mx-auto px-4 pt-1 pb-8 sm:pt-4 space-y-5">
        <LargeTitle title="Control Room" />
        <div className={CARD}>
          <p className="text-[15px] text-ink-2">The Control Room is not available right now.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 pt-1 pb-8 sm:pt-4 space-y-5">
        <LargeTitle title="Control Room" subtitle="Sign in with an admin account." />
        <div className={`${CARD} space-y-3`}>
          <PrimaryButton onClick={onOpenLogin} className="w-full">
            <span className="inline-flex items-center gap-1.5">
              <LogIn className="w-4 h-4" />
              Sign in
            </span>
          </PrimaryButton>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="max-w-md mx-auto px-4 pt-1 pb-8 sm:pt-4 space-y-5">
        <LargeTitle title="Control Room" />
        <div className={`${CARD} space-y-2`}>
          <p className="text-[15px] text-ink">This account has no admin access.</p>
          <p className="text-[14px] text-ink-2">
            Signed in as {user.email}. Admin roles are granted in the database, never from the app.
          </p>
        </div>
      </div>
    );
  }

  const spotQueue = spotService.getReviewQueue();
  const applications = placeService.getApplications();
  const pendingApplications = applications.filter((row) => row.status === 'pending');
  const profiles = adminService.getProfiles();
  const listed = catalogService.getCafes().filter(isListedPlace);
  const communityLive = catalogService.getCafes().filter((cafe) => cafe.community?.status === 'approved');

  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'spots', label: 'Spots', count: spotQueue.length },
    { id: 'places', label: 'Places', count: pendingApplications.length },
    { id: 'users', label: 'Users' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-8 sm:pt-4 space-y-5">
      <LargeTitle
        title="Control Room"
        subtitle={`Signed in as ${user.email}`}
        trailing={
          <span className="h-9 w-9 rounded-full bg-tint/15 text-tint-ink flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5" />
          </span>
        }
      />

      <div className="flex p-0.5 rounded-[10px] ios-fill" role="tablist" aria-label="Control Room sections">
        {tabs.map((entry) => {
          const active = tab === entry.id;
          return (
            <button
              key={entry.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(entry.id)}
              className="relative flex-1 h-8 px-2 rounded-[8px] text-[13px] font-semibold font-sans whitespace-nowrap"
            >
              {active && (
                <motion.span
                  layoutId="admin-tab-thumb"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-[8px] bg-surface shadow-[0_1px_4px_rgba(19,25,31,0.14),0_0_0_0.5px_rgba(19,25,31,0.04)]"
                />
              )}
              <span className={`relative ${active ? 'text-ink' : 'text-ink-2'}`}>
                {entry.label}
                {entry.count !== undefined && entry.count > 0 && <span className="font-mono"> ({entry.count})</span>}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Spots to review" value={spotQueue.length} icon={MapPin} onClick={() => setTab('spots')} />
            <StatCard label="Place applications" value={pendingApplications.length} icon={ClipboardList} onClick={() => setTab('places')} />
            <StatCard label="Listed places" value={listed.length} icon={Store} onClick={() => setTab('places')} />
            <StatCard label="Community spots live" value={communityLive.length} icon={BadgeCheck} />
            <StatCard label="Accounts" value={profiles.length} icon={Users} onClick={() => setTab('users')} />
            <StatCard label="Admins" value={profiles.filter((profile) => profile.role === 'admin').length} icon={ShieldCheck} />
          </div>
          {(spotService.getLoadError() || placeService.getLoadError()) && (
            <ErrorNote message={spotService.getLoadError() ?? placeService.getLoadError() ?? ''} />
          )}
        </div>
      )}

      {tab === 'spots' && <SpotReviewQueue rows={spotQueue} onViewSpot={onViewCafe} />}

      {tab === 'places' && (
        <div className="space-y-6">
          <ApplicationQueue rows={applications} onViewCafe={onViewCafe} />
          <ListingsPanel onViewCafe={onViewCafe} />
        </div>
      )}

      {tab === 'users' && <UsersPanel profiles={profiles} />}
    </div>
  );
};
