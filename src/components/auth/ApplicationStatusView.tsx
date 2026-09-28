import React from 'react';
import { Clock, XCircle } from 'lucide-react';
import type { Account } from '../../types/auth';
import { authService } from '../../services/authService';
import { useAuthVersion } from '../../hooks/useServiceVersions';
import { PrimaryButton, SecondaryButton } from '../common/FormControls';
import { LargeTitle } from '../common/LargeTitle';

interface ApplicationStatusViewProps {
  account: Account;
  onSignOut: () => void;
  onBrowseFeed: () => void;
}

/** One label and value row inside the grouped application list. */
const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="ios-group-row justify-between">
    <dt className="text-[15px] text-[#13191F] shrink-0">{label}</dt>
    <dd className="text-[15px] text-[#594C3D] text-right min-w-0 truncate">{children}</dd>
  </div>
);

/** Pending or rejected state shown between sign-up and admin approval. */
export const ApplicationStatusView: React.FC<ApplicationStatusViewProps> = ({ account, onSignOut, onBrowseFeed }) => {
  useAuthVersion();
  const application = authService.getApplicationForAccount(account.id);
  const rejected = account.status === 'rejected';

  return (
    <div className="max-w-md mx-auto px-4 pt-1 pb-8 sm:pt-4 space-y-5">
      <LargeTitle title={rejected ? 'Needs changes' : 'Under review'} subtitle={account.businessName} />

      {/* Status row: semantic color carries the state, the icon repeats it for non-color readers */}
      <div className="ios-group ios-card-shadow">
        <div className="ios-group-row items-start py-3">
          <span
            className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
              rejected ? 'bg-[#8C3A2E]/12 text-[#8C3A2E]' : 'bg-[#906D4B]/14 text-[#7D5C3D]'
            }`}
          >
            {rejected ? <XCircle className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />}
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className={`ios-headline ${rejected ? 'text-[#8C3A2E]' : 'text-[#7D5C3D]'}`}>
              {rejected ? 'Application needs changes' : 'Verification in progress'}
            </p>
            <p className="text-[14px] leading-[1.45] text-[#594C3D]">
              {rejected
                ? account.reviewNote || 'Haraya could not verify the permit number. Review the note and apply again.'
                : `${account.businessName} is waiting for verification. Haraya checks the permit number before a listing goes live.`}
            </p>
          </div>
        </div>
      </div>

      {application && (
        <section className="space-y-1.5" aria-labelledby="application-details-title">
          <h2 id="application-details-title" className="px-4 text-[13px] text-[#594C3D]">
            Application
          </h2>
          <dl className="ios-group ios-card-shadow">
            <DetailRow label="Business">{application.businessName}</DetailRow>
            <DetailRow label="Location">
              {application.district}, {application.city}
            </DetailRow>
            <DetailRow label="Type">{application.isRoastery ? 'Micro-roastery' : 'Specialty cafe'}</DetailRow>
            <DetailRow label="Permit">
              <span className="font-mono">{application.permitNumber || 'Not provided'}</span>
            </DetailRow>
          </dl>
        </section>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <PrimaryButton onClick={onBrowseFeed} className="w-full sm:w-auto">
          Browse the Feed
        </PrimaryButton>
        <SecondaryButton onClick={onSignOut} className="w-full sm:w-auto !text-[#8C3A2E]">
          Sign Out
        </SecondaryButton>
      </div>
    </div>
  );
};
