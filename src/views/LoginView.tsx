import React, { useEffect, useState } from 'react';
import { KeyRound, LogOut, Mail, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { LargeTitle } from '../components/common/LargeTitle';
import { AyaMascot } from '../components/common/AyaMascot';
import { GoogleIcon } from '../components/common/CustomIcons';
import { ErrorNote, Field, PrimaryButton, SecondaryButton, TextInput } from '../components/common/FormControls';
import { PASSWORD_MIN_LENGTH, sessionService } from '../services/sessionService';
import { useSessionVersion } from '../hooks/useServiceVersions';

/** What the page is doing: the two account modes, the two email-link flows, and the new-password form. */
export type LoginMode = 'signin' | 'signup' | 'magic' | 'forgot' | 'reset';

interface LoginViewProps {
  /** Opened from a reset link: the new-password form. Otherwise sign in. */
  initialMode: LoginMode;
  onSignedIn: () => void;
  onBrowse: () => void;
}

const CARD = 'rounded-[20px] bg-[#FFFDF9] ios-card-shadow p-4 sm:p-5';
const LINK = 'min-h-11 inline-flex items-center px-1 text-[14px] font-semibold text-[#7D5C3D] ios-press';

const TITLES: Record<LoginMode, { title: string; subtitle: string }> = {
  signin: { title: 'Sign in', subtitle: 'Add spots, keep your place listing current, or run the Control Room.' },
  signup: { title: 'Create account', subtitle: 'Free. Your email is used only to sign you in.' },
  magic: { title: 'Sign in by email', subtitle: 'No password. We email you a one-time link.' },
  forgot: { title: 'Reset password', subtitle: 'We email you a link to choose a new one.' },
  reset: { title: 'New password', subtitle: 'Choose a password you will remember.' },
};

/** Sent-email confirmation shown after a magic link, a reset link or an unconfirmed sign-up. */
const SentCard: React.FC<{ email: string; body: string; onSignIn?: () => void }> = ({ email, body, onSignIn }) => (
  <div className={`${CARD} space-y-4`} role="status">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-[#906D4B]/10 flex items-center justify-center shrink-0">
        <Mail className="w-5 h-5 text-[#906D4B]" />
      </div>
      <div className="space-y-1">
        <h2 className="ios-headline text-[#13191F]">Check your email</h2>
        <p className="text-[14px] text-[#594C3D] leading-relaxed">
          We sent a verification link to <span className="font-semibold text-[#13191F]">{email}</span>. {body}
        </p>
      </div>
    </div>
    {onSignIn && (
      <PrimaryButton onClick={onSignIn} className="w-full">
        Return to sign in
      </PrimaryButton>
    )}
  </div>
);

const TermsNote: React.FC = () => (
  <p className="ios-footnote text-[#594C3D]">
    By continuing you agree to the{' '}
    <a href="#/tab/terms" className="font-semibold text-[#7D5C3D] underline underline-offset-2">Terms</a> and{' '}
    <a href="#/tab/privacy" className="font-semibold text-[#7D5C3D] underline underline-offset-2">Privacy Notice</a>.
  </p>
);

/** Account entry for everyone: email and password, or a one-time link; password reset; new password. */
export const LoginView: React.FC<LoginViewProps> = ({ initialMode, onSignedIn, onBrowse }) => {
  useSessionVersion();
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<{ email: string; body: string } | null>(null);

  const user = sessionService.getUser();
  const recovering = sessionService.isRecovering();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // A reset link that lands after the page loaded also switches to the new-password form
  useEffect(() => {
    if (recovering) setMode('reset');
  }, [recovering]);

  const switchMode = (next: LoginMode) => {
    setMode(next);
    setError('');
    setSent(null);
    setConfirmPassword('');
  };

  const run = async (action: () => Promise<void>, failure: string) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : failure);
    } finally {
      setBusy(false);
    }
  };

  const signIn = () =>
    run(async () => {
      await sessionService.signInWithPassword(email, password);
      onSignedIn();
    }, 'Could not sign in.');

  const signInWithGoogle = () =>
    run(async () => {
      await sessionService.signInWithGoogle('profile');
    }, 'Could not start Google sign in.');

  const signUp = () =>
    run(async () => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Please enter your name.');
      }
      if (password.length < PASSWORD_MIN_LENGTH) {
        throw new Error(`Use a password of at least ${PASSWORD_MIN_LENGTH} characters.`);
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }
      const { needsConfirmation } = await sessionService.signUpWithPassword(email, password, trimmedName);
      if (needsConfirmation) {
        setSent({
          email: email.trim(),
          body: 'Open the confirmation link in your Gmail, then come back and sign in.',
        });
        return;
      }
      onSignedIn();
    }, 'Could not create the account.');

  const sendMagic = () =>
    run(async () => {
      await sessionService.sendMagicLink(email, 'profile');
      setSent({ email: email.trim(), body: 'Open the link on this device to come back signed in.' });
    }, 'Could not send the sign-in link.');

  const sendReset = () =>
    run(async () => {
      await sessionService.sendPasswordReset(email);
      setSent({ email: email.trim(), body: 'Open the link on this device to choose a new password.' });
    }, 'Could not send the reset email.');

  const savePassword = () =>
    run(async () => {
      await sessionService.updatePassword(password);
      setPassword('');
      onSignedIn();
    }, 'Could not save the new password.');

  const heading = TITLES[mode];

  if (!sessionService.isAvailable()) {
    return (
      <div className="max-w-md mx-auto px-4 pt-1 pb-8 sm:pt-4 space-y-5">
        <LargeTitle title="Sign in" />
        <div className={CARD}>
          <p className="text-[15px] text-[#594C3D]">Accounts are not available right now. Please check back soon.</p>
        </div>
      </div>
    );
  }

  // Already signed in (and not in the middle of a reset): offer to continue or switch accounts
  if (user && mode !== 'reset') {
    return (
      <div className="max-w-md mx-auto px-4 pt-1 pb-8 sm:pt-4 space-y-5">
        <LargeTitle title="Signed in" trailing={<AyaMascot pose="welcome" size={72} alt="" />} />
        <div className={`${CARD} space-y-3`}>
          <p className="text-[15px] text-[#13191F]">
            You are signed in as <span className="font-medium">{user.email}</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <PrimaryButton onClick={onSignedIn} className="w-full sm:w-auto">
              Continue
            </PrimaryButton>
            <SecondaryButton onClick={() => void sessionService.signOut()} className="w-full sm:w-auto !text-[#8C3A2E]">
              <span className="inline-flex items-center gap-1.5">
                <LogOut className="w-4 h-4" />
                Sign out
              </span>
            </SecondaryButton>
          </div>
        </div>
      </div>
    );
  }

  const modes: { id: LoginMode; label: string }[] = [
    { id: 'signin', label: 'Sign in' },
    { id: 'signup', label: 'Create account' },
  ];
  const showSegments = mode === 'signin' || mode === 'signup';

  return (
    <div className="max-w-md mx-auto px-4 pt-1 pb-8 sm:pt-4 space-y-5">
      <LargeTitle title={heading.title} subtitle={heading.subtitle} />

      {showSegments && (
        <div className="flex p-0.5 rounded-[10px] ios-fill" role="tablist" aria-label="Account">
          {modes.map((entry) => {
            const active = mode === entry.id;
            return (
              <button
                key={entry.id}
                role="tab"
                aria-selected={active}
                onClick={() => switchMode(entry.id)}
                className="relative flex-1 h-8 px-4 rounded-[8px] text-[13px] font-semibold font-sans"
              >
                {active && (
                  <motion.span
                    layoutId="login-mode-thumb"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    className="absolute inset-0 rounded-[8px] bg-[#FFFDF9] shadow-[0_1px_4px_rgba(19,25,31,0.14),0_0_0_0.5px_rgba(19,25,31,0.04)]"
                  />
                )}
                <span className={`relative ${active ? 'text-[#13191F]' : 'text-[#594C3D]'}`}>{entry.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {sent ? (
        <SentCard
          email={sent.email}
          body={sent.body}
          onSignIn={() => switchMode('signin')}
        />
      ) : (
        <form
          className={`${CARD} space-y-3`}
          onSubmit={(event) => {
            event.preventDefault();
            if (mode === 'signin') void signIn();
            else if (mode === 'signup') void signUp();
            else if (mode === 'magic') void sendMagic();
            else if (mode === 'forgot') void sendReset();
            else void savePassword();
          }}
        >
          {showSegments && (
            <div className="space-y-3 pb-1">
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                disabled={busy}
                className="w-full h-11 px-4 rounded-[12px] bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#E6DEC9] text-[#13191F] text-[15px] font-semibold font-sans flex items-center justify-center gap-3 shadow-[0_1px_2px_rgba(19,25,31,0.05)] ios-press transition-colors disabled:opacity-50"
              >
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center pt-1 pb-0.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E6DEC9]" />
                </div>
                <span className="relative bg-[#FFFDF9] px-2.5 text-[12px] font-medium text-[#7D7060]">
                  or with email
                </span>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <Field label="Your name">
              <TextInput value={name} onChange={setName} placeholder="How Haraya greets you" />
            </Field>
          )}

          {mode !== 'reset' && (
            <Field label="Email">
              <TextInput value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
            </Field>
          )}

          {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
            <Field
              label={mode === 'reset' ? 'New password' : 'Password'}
              hint={mode === 'signin' ? undefined : `At least ${PASSWORD_MIN_LENGTH} characters`}
            >
              <TextInput
                value={password}
                onChange={setPassword}
                type="password"
                placeholder={mode === 'signin' ? 'Your password' : 'Create a password'}
              />
            </Field>
          )}

          {mode === 'signup' && (
            <Field label="Confirm password">
              <TextInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                placeholder="Repeat your password"
              />
            </Field>
          )}

          {error && <ErrorNote message={error} />}

          <PrimaryButton type="submit" disabled={busy} className="w-full">
            {busy
              ? 'One moment'
              : mode === 'signin'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : mode === 'magic'
                    ? 'Email me a sign-in link'
                    : mode === 'forgot'
                      ? 'Email me a reset link'
                      : 'Save password'}
          </PrimaryButton>

          {mode === 'signin' && (
            <div className="flex flex-wrap items-center justify-between gap-x-3">
              <button type="button" onClick={() => switchMode('forgot')} className={LINK}>
                Forgot password?
              </button>
              <button type="button" onClick={() => switchMode('magic')} className={LINK}>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  Email me a link instead
                </span>
              </button>
            </div>
          )}

          {(mode === 'magic' || mode === 'forgot') && (
            <button type="button" onClick={() => switchMode('signin')} className={LINK}>
              <span className="inline-flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                Use a password instead
              </span>
            </button>
          )}

          {mode !== 'reset' && <TermsNote />}
        </form>
      )}

      <button
        onClick={onBrowse}
        className="h-11 flex items-center justify-center gap-1.5 mx-auto px-3 text-[15px] font-medium font-sans text-[#7D5C3D] ios-press"
      >
        <Store className="w-4 h-4" />
        Keep browsing
      </button>
    </div>
  );
};
