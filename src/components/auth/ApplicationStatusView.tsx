import React from 'react';
import { ArrowLeft, Clock, ShieldCheck, Store, XCircle } from 'lucide-react';
import type { Account } from '../../types/auth';
import { authService } from '../../services/authService';
import { useAuthVersion } from '../../hooks/useServiceVersions';
import { PrimaryButton } from '../common/FormControls';

interface ApplicationStatusViewProps {
  account: Account;
  onSignOut: () => void;
  onBrowseFeed: () => void;
}

/** Pending or rejected state shown between sign-up and admin approval. */
export const ApplicationStatusView: React.FC<ApplicationStatusViewProps> = ({ account, onSignOut, onBrowseFeed }) => {
  useAuthVersion();
  const application = authService.getApplicationForAccount(account.id);
  const rejected = account.status === 'rejected';

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      <div className="rounded-3xl bg-[#FFF9E9] border border-[#E6DCC0] p-6 sm:p-8 space-y-4 shadow-sm text-center">
        <span
          className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center border ${
            rejected ? 'bg-[#8C3A2E]/10 border-[#8C3A2E]/30' : 'bg-[#C86428]/10 border-[#C86428]/30'
          }`}
        >
          {rejected ? <XCircle className="w-7 h-7 text-[#8C3A2E]" /> : <Clock className="w-7 h-7 text-[#C86428]" />}
        </span>

        <div className="space-y-1.5">
          <h1 className="font-cooper text-xl font-bold text-[#1A2225]">
            {rejected ? 'Application needs changes' : 'Verification in progress'}
          </h1>
          <p className="text-xs font-sans text-[#55615D] leading-relaxed">
            {rejected
              ? account.reviewNote || 'The Control Room could not verify the documents. Review the note and apply again.'
              : `${account.businessName} is queued for Control Room verification. This is a browser demo, so ask the operator to sign in as admin@haraya.ph and approve it.`}
          </p>
        </div>

        {application && (
          <div className="rounded-2xl bg-[#F3ECD8] border border-[#E6DCC0] p-4 text-left space-y-1.5">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">Application</span>
            <p className="text-xs font-sans text-[#1A2225]">
              <Store className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              {application.businessName} : {application.district}, {application.city}
            </p>
            <p className="text-[11px] font-sans text-[#55615D]">
              {application.isRoastery ? 'Micro-roastery' : 'Specialty cafe'} : permit {application.permitNumber}
            </p>
            <p className="text-[10px] font-sans text-[#55615D] inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              ID document {application.idDoc ? 'attached' : 'missing'} : permit photo {application.permitDoc ? 'attached' : 'not provided'}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <PrimaryButton onClick={onBrowseFeed}>
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Browse the Feed
            </span>
          </PrimaryButton>
          <button
            onClick={onSignOut}
            className="h-10 px-5 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] text-xs font-bold font-sans text-[#1A2225] hover:bg-[#E6DCC0] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
