import React, { useState } from 'react';
import { ArrowUpRight, ChevronRight, LogIn, MailPlus, UserRoundPen } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { AyaMascot } from '../components/common/AyaMascot';
import { ErrorNote } from '../components/common/FormControls';
import { sessionService } from '../services/sessionService';
import { inboxFor } from '../utils/inbox';

/**
 * The only screen an unconfirmed sign-up sees: it replaces the whole app (every tab, the portal included) until
 * the confirmation link is opened. Reading order: what to do, which address, the way into the inbox, then the
 * three ways out (send again, already confirmed, wrong address). This is a guide, not the lock: the lock is
 * Supabase refusing a session to an unconfirmed address.
 */

interface ConfirmEmailViewProps {
  email: string;
  /** Opens the sign-in form for someone who confirmed on another device. */
  onSignIn: () => void;
  /** Forgets this sign-up and opens the create-account form. */
  onChangeEmail: () => void;
}

const RowIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="h-7.5 w-7.5 shrink-0 rounded-[8px] bg-tint/15 text-tint-ink flex items-center justify-center">
    {children}
  </span>
);

export const ConfirmEmailView: React.FC<ConfirmEmailViewProps> = ({ email, onSignIn, onChangeEmail }) => {
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const inbox = inboxFor(email);

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await sessionService.resendConfirmation(email);
      setResent(true);
    } catch (cause) {
      setResent(false);
      setError(cause instanceof Error ? cause.message : 'Could not resend the confirmation email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink font-sans">
      <header className="px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        <BrandLogo className="h-10" eager />
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 pt-4 pb-12 sm:pt-0">
        <div className="w-full max-w-md">
          <AyaMascot pose="holding-cup" size={112} alt="" className="-ml-2" />

          <h1 className="mt-2 font-cooper text-[30px] sm:text-[34px] font-bold leading-[1.1] tracking-[-0.025em]">
            Confirm your email
          </h1>
          <p className="mt-3 text-[16px] leading-[1.5] text-ink-2">
            We sent a link to <span className="font-semibold text-ink [overflow-wrap:anywhere]">{email}</span>. Open it to finish
            creating your account. Haraya opens once your email is confirmed.
          </p>

          {inbox ? (
            <a
              href={inbox.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-tint text-surface text-[16px] font-semibold hover:bg-tint-ink ios-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tint focus-visible:ring-offset-2 focus-visible:ring-offset-canvas transition-colors"
            >
              Open {inbox.name}
              <ArrowUpRight className="w-4.5 h-4.5" strokeWidth={2.4} />
            </a>
          ) : (
            <p className="mt-6 rounded-[14px] ios-fill px-4 py-3 text-[15px] leading-[1.45] text-ink">
              Open your email app or webmail and look for the message from Haraya.
            </p>
          )}

          <p className="mt-3 ios-footnote text-ink-2">
            Use this device and this browser, so the link brings you back signed in. It can land in spam.
          </p>

          <div className="mt-6 space-y-2" aria-live="polite">
            {error && <ErrorNote message={error} />}
            {resent && !error && (
              <p role="status" className="ios-footnote text-ok bg-ok/10 rounded-[12px] px-3.5 py-2.5">
                Sent again to {email}.
              </p>
            )}
          </div>

          <div className="mt-2 ios-group ios-card-shadow">
            <button type="button" onClick={() => void resend()} disabled={busy} className="ios-group-row ios-press disabled:opacity-50">
              <RowIcon>
                <MailPlus className="w-4 h-4" strokeWidth={2.2} />
              </RowIcon>
              <span className="flex-1 text-[15px]">{busy ? 'Sending' : 'Send the link again'}</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-ink-3/60" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={onSignIn} className="ios-group-row ios-press">
              <RowIcon>
                <LogIn className="w-4 h-4" strokeWidth={2.2} />
              </RowIcon>
              <span className="flex-1 text-[15px]">I confirmed it, sign me in</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-ink-3/60" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={onChangeEmail} className="ios-group-row ios-press">
              <RowIcon>
                <UserRoundPen className="w-4 h-4" strokeWidth={2.2} />
              </RowIcon>
              <span className="flex-1 text-[15px]">Wrong address, use another email</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-ink-3/60" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
