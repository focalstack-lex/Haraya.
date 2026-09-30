import React from 'react';
import { ArrowUpRight, ChevronRight, LogIn, TriangleAlert, UserRoundPen } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { AyaMascot } from '../components/common/AyaMascot';
import { inboxFor } from '../utils/inbox';
import { suggestEmail } from '../utils/emailTypos';

/**
 * The only screen an unconfirmed sign-up sees: it replaces the whole app (every tab, the portal included) until
 * the confirmation link is opened. Reading order: what to do, which address, the way into the inbox, then the way
 * out for someone who already confirmed on another device. Changing the address is offered only when the address
 * looks mistyped (see suggestEmail), because that is the one case where the email cannot have arrived; there is
 * no "send again" (a resend just sends one more email to the same inbox). This is a guide, not the lock: the lock
 * is Supabase refusing a session to an unconfirmed address.
 */

interface ConfirmEmailViewProps {
  email: string;
  /** Opens the sign-in form for someone who confirmed on another device. */
  onSignIn: () => void;
  /** Forgets this sign-up and opens the create-account form. Offered only for a mistyped address. */
  onChangeEmail: () => void;
}

const RowIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="h-7.5 w-7.5 shrink-0 rounded-[8px] bg-tint/15 text-tint-ink flex items-center justify-center">
    {children}
  </span>
);

export const ConfirmEmailView: React.FC<ConfirmEmailViewProps> = ({ email, onSignIn, onChangeEmail }) => {
  const inbox = inboxFor(email);
  // A mistyped domain (gmial.com) means the email went nowhere: say so, and only then offer to change the address
  const suggestion = suggestEmail(email);

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

          {suggestion ? (
            <div className="mt-6 rounded-row bg-danger/10 px-4 py-3 flex gap-3" role="alert">
              <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5 text-danger" strokeWidth={2.2} aria-hidden="true" />
              <p className="text-[15px] leading-[1.45] text-ink">
                That address looks mistyped, so the email may never arrive. Did you mean{' '}
                <span className="font-semibold [overflow-wrap:anywhere]">{suggestion}</span>?
              </p>
            </div>
          ) : inbox ? (
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
            <p className="mt-6 rounded-row ios-fill px-4 py-3 text-[15px] leading-[1.45] text-ink">
              Open your email app or webmail and look for the message from Haraya.
            </p>
          )}

          <p className="mt-3 ios-footnote text-ink-2">
            Use this device and this browser, so the link brings you back signed in. It can land in spam.
          </p>

          <div className="mt-6 ios-group ios-card-shadow">
            <button type="button" onClick={onSignIn} className="ios-group-row ios-press">
              <RowIcon>
                <LogIn className="w-4 h-4" strokeWidth={2.2} />
              </RowIcon>
              <span className="flex-1 text-[15px]">I confirmed it, sign me in</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-ink-3/60" strokeWidth={2.5} />
            </button>
            {suggestion && (
              <button type="button" onClick={onChangeEmail} className="ios-group-row ios-press">
                <RowIcon>
                  <UserRoundPen className="w-4 h-4" strokeWidth={2.2} />
                </RowIcon>
                <span className="flex-1 text-[15px]">Wrong address, use another email</span>
                <ChevronRight className="w-4 h-4 shrink-0 text-ink-3/60" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
