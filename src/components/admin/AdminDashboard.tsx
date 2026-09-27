import React, { useMemo, useState } from 'react';
import { ShieldCheck, Store, LogOut, Check, X, Users, Package, Flame, ExternalLink, ClipboardList } from 'lucide-react';
import type { Account } from '../../types/auth';
import { authService } from '../../services/authService';
import { catalogService } from '../../services/catalogService';
import { communityService } from '../../services/communityService';
import { useCatalogVersion, useAuthVersion } from '../../hooks/useServiceVersions';
import { ErrorNote } from '../common/FormControls';

interface AdminDashboardProps {
  admin: Account;
  onSignOut: () => void;
  onViewCafe: (cafeId: string) => void;
}

/** Control Room: verification queue, venue verification toggles, catalog pulse. */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, onSignOut, onViewCafe }) => {
  useCatalogVersion();
  useAuthVersion();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const accounts = useMemo(() => authService.getAllAccounts(), []);
  const applications = useMemo(() => authService.getApplications(), []);
  const cafes = useMemo(() => catalogService.getCafes(), []);
  const beans = useMemo(() => catalogService.getBeans(), []);
  const drops = useMemo(() => catalogService.getDrops(), []);
  const posts = useMemo(() => communityService.getPosts(), []);

  const pending = accounts.filter((account) => account.status === 'pending' && account.role === 'roaster');

  const approve = (accountId: string) => {
    try {
      authService.approveAccount(accountId);
      setNote('');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Approval failed.');
    }
  };

  const reject = (accountId: string) => {
    try {
      authService.rejectAccount(accountId, note.trim() || 'Documents could not be verified in this demo review.');
      setNote('');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Rejection failed.');
    }
  };

  const toggleVerified = (cafeId: string, current: boolean) => {
    catalogService.setCafeVerified(cafeId, !current);
  };

  const statCard = (label: string, value: number, Icon: typeof Store) => (
    <div className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] p-4 space-y-1">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="block font-cooper text-2xl font-bold text-[#1A2225]">{value.toLocaleString()}</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden bg-[#1A2225] text-[#FFF9E9] p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="font-cooper text-2xl sm:text-3xl font-bold tracking-tight">Control Room</h1>
            <p className="text-xs font-sans text-[#FFF9E9]/70">
              Verification queue, venue badges, and catalog pulse : {admin.email}
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="h-10 px-5 rounded-full border border-[#FFF9E9]/25 text-xs font-bold font-sans inline-flex items-center gap-2 hover:bg-[#FFF9E9]/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Pulse */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {statCard('Venues', cafes.length, Store)}
        {statCard('Roasteries', cafes.filter((cafe) => cafe.isRoastery).length, Flame)}
        {statCard('Bean Lots', beans.length, Package)}
        {statCard('Batches', drops.length, Package)}
        {statCard('Cup Posts', posts.length, ClipboardList)}
        {statCard('Accounts', accounts.length, Users)}
      </div>

      {error && <ErrorNote message={error} />}

      {/* Verification queue */}
      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 font-cooper text-lg font-bold text-[#1A2225]">
          <ShieldCheck className="w-5 h-5 text-[#C86428]" />
          Verification Queue
          {pending.length > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#C86428] text-[#FFF9E9] text-[10px] font-bold flex items-center justify-center">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <p className="text-xs font-sans text-[#55615D]">Queue is clear. New roaster applications land here.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((account) => {
              const application = authService.getApplicationForAccount(account.id);
              return (
                <article key={account.id} className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-sans font-bold text-[#1A2225] truncate">{account.businessName}</p>
                      <p className="text-[11px] font-sans text-[#55615D]">
                        {application ? `${application.district}, ${application.city} : ${application.isRoastery ? 'roastery' : 'cafe'}` : account.email}
                      </p>
                      <p className="text-[10px] font-sans text-[#55615D]">
                        Contact {account.name} : {account.email}
                        {application ? ` : permit ${application.permitNumber}` : ''}
                      </p>
                    </div>
                    {application?.idDoc && (
                      <img
                        src={application.idDoc}
                        alt={`${account.businessName} ID document`}
                        className="h-16 w-16 rounded-xl object-cover border border-[#E6DCC0]"
                      />
                    )}
                  </div>
                  {application?.description && (
                    <p className="text-xs font-sans text-[#1A2225]/85 line-clamp-2">{application.description}</p>
                  )}
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Rejection note (used only when rejecting)"
                    className="w-full h-9 bg-[#F3ECD8] border border-[#E6DCC0] rounded-xl px-3 text-xs font-sans text-[#1A2225] placeholder:text-[#55615D] focus:outline-none focus:border-[#55615D]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve(account.id)}
                      className="h-9 px-4 rounded-full bg-[#3E5C48] text-[#FFF9E9] text-[11px] font-bold font-sans inline-flex items-center gap-1.5 hover:bg-[#334D3B] transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve and Create Storefront
                    </button>
                    <button
                      onClick={() => reject(account.id)}
                      className="h-9 px-4 rounded-full border border-[#8C3A2E]/40 text-[#8C3A2E] text-[11px] font-bold font-sans inline-flex items-center gap-1.5 hover:bg-[#8C3A2E]/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Venue verification */}
      <section className="space-y-3">
        <h2 className="font-cooper text-lg font-bold text-[#1A2225]">Venue Verification</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cafes.map((cafe) => (
            <article key={cafe.id} className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] p-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <img src={cafe.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover border border-[#E6DCC0]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-sans font-bold text-[#1A2225] truncate">{cafe.name}</p>
                  <p className="text-[10px] font-sans text-[#55615D] truncate">
                    {cafe.district}, {cafe.city}
                  </p>
                </div>
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cafe.verified ? 'bg-[#3E5C48]' : 'bg-[#E6DCC0]'}`} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleVerified(cafe.id, cafe.verified)}
                  className={`h-9 px-3.5 rounded-full text-[11px] font-bold font-sans inline-flex items-center gap-1.5 transition-colors ${
                    cafe.verified
                      ? 'bg-[#3E5C48] text-[#FFF9E9] hover:bg-[#334D3B]'
                      : 'border border-[#E6DCC0] text-[#1A2225] hover:bg-[#F3ECD8]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {cafe.verified ? 'Verified' : 'Unverified'}
                </button>
                <button
                  onClick={() => onViewCafe(cafe.id)}
                  className="h-9 px-3.5 rounded-full border border-[#E6DCC0] text-[11px] font-bold font-sans text-[#1A2225] inline-flex items-center gap-1.5 hover:bg-[#F3ECD8] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Review history */}
      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 font-cooper text-lg font-bold text-[#1A2225]">
          <ClipboardList className="w-5 h-5 text-[#55615D]" />
          Review History
        </h2>
        {applications.length === 0 ? (
          <p className="text-xs font-sans text-[#55615D]">No applications submitted yet.</p>
        ) : (
          <div className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] divide-y divide-[#E6DCC0]">
            {applications.map((application) => {
              const account = accounts.find((candidate) => candidate.id === application.accountId);
              return (
                <div key={application.accountId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-sans font-bold text-[#1A2225] truncate">{application.businessName}</p>
                    <p className="text-[10px] font-sans text-[#55615D]">
                      {new Date(application.submittedAt).toLocaleDateString()} : {account?.status ?? 'unknown'}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-full font-sans ${
                    account?.status === 'approved'
                      ? 'bg-[#3E5C48] text-[#FFF9E9]'
                      : account?.status === 'rejected'
                        ? 'bg-[#8C3A2E]/15 text-[#8C3A2E] border border-[#8C3A2E]/30'
                        : 'bg-[#C86428]/15 text-[#A34F1E] border border-[#C86428]/40'
                  }`}>
                    {account?.status ?? 'unknown'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
