import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ShieldCheck, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Account } from '../../types/auth';
import type { DavaoCity, District } from '../../types/coffee';
import { DAVAO_CITIES, DAVAO_DISTRICTS } from '../../types/coffee';
import { authService } from '../../services/authService';
import { useAuthVersion } from '../../hooks/useServiceVersions';
import { Field, TextInput, TextArea, SelectInput, PrimaryButton, SecondaryButton, ErrorNote } from '../common/FormControls';
import { LargeTitle } from '../common/LargeTitle';

export type AuthMode = 'signin' | 'signup';

interface AuthViewProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (account: Account) => void;
  onBrowseFeed: () => void;
}

const STEP_LABELS = ['Business', 'Permit', 'Account'];

/** Roaster Suite entry: sign in, or a three-step verified roaster registration. */
export const AuthView: React.FC<AuthViewProps> = ({ mode, onModeChange, onAuthenticated, onBrowseFeed }) => {
  useAuthVersion();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  // Sign in
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign up: step 0 business
  const [businessName, setBusinessName] = useState('');
  const [handle, setHandle] = useState('');
  const [isRoastery, setIsRoastery] = useState<'roastery' | 'cafe'>('roastery');
  const [city, setCity] = useState<DavaoCity>('Davao City');
  const [district, setDistrict] = useState<District>('Poblacion');
  const [description, setDescription] = useState('');
  // Step 1 permit (no document uploads until a secure server-side intake exists)
  const [permitNumber, setPermitNumber] = useState('');
  // Step 2 account
  const [contactName, setContactName] = useState('');

  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const account = await authService.signIn(email, password);
      setError('');
      onAuthenticated(account);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const nextFromStep = () => {
    setError('');
    if (step === 0) {
      if (!businessName.trim()) {
        setError('Business name is required.');
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!permitNumber.trim()) {
        setError('A DTI or Mayor permit number is required for verification.');
        return;
      }
      setStep(2);
      return;
    }
    void submit();
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const account = await authService.signUpRoaster({
        email,
        password,
        contactName,
        application: {
          businessName,
          handle: handle.trim(),
          district,
          city,
          isRoastery: isRoastery === 'roastery',
          description,
          permitNumber,
          permitDoc: null,
          idDoc: null,
        },
      });
      setError('');
      onAuthenticated(account);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    if (next === mode) return;
    setError('');
    setStep(0);
    onModeChange(next);
  };

  const stepRail = (
    <ol className="flex items-center gap-2" aria-label="Application steps">
      {STEP_LABELS.map((label, index) => (
        <React.Fragment key={label}>
          <li className="flex items-center gap-1.5 shrink-0" aria-current={index === step ? 'step' : undefined}>
            <span
              className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[12px] font-semibold font-mono ${
                index < step
                  ? 'bg-[#3E5C48] text-[#FFFDF9]'
                  : index === step
                    ? 'bg-[#906D4B] text-[#FFFDF9]'
                    : 'ios-fill text-[#594C3D]'
              }`}
            >
              {index < step ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : index + 1}
            </span>
            {/* On narrow phones only the current step keeps its label */}
            <span className={`text-[13px] ${index === step ? 'font-semibold text-[#13191F]' : 'hidden min-[400px]:inline text-[#594C3D]'}`}>
              {label}
            </span>
          </li>
          {index < STEP_LABELS.length - 1 && <span aria-hidden="true" className="flex-1 min-w-2 h-px ios-hairline-t" />}
        </React.Fragment>
      ))}
    </ol>
  );

  const modes: { id: AuthMode; label: string }[] = [
    { id: 'signin', label: 'Sign In' },
    { id: 'signup', label: 'Apply' },
  ];

  return (
    <div className="max-w-md mx-auto px-4 pt-1 pb-8 sm:pt-4 space-y-5">
      <LargeTitle
        title={mode === 'signin' ? 'Roaster sign in' : 'Join as a roaster'}
        subtitle={
          mode === 'signin'
            ? 'Inventory, roast schedule, menu and reservations.'
            : 'List your roastery or cafe and schedule bean drops.'
        }
      />

      {/* Segmented control: sign in or apply */}
      <div className="flex p-0.5 rounded-[10px] ios-fill" role="tablist" aria-label="Roaster access">
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
                  layoutId="auth-mode-thumb"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-[8px] bg-[#FFFDF9] shadow-[0_1px_4px_rgba(19,25,31,0.14),0_0_0_0.5px_rgba(19,25,31,0.04)]"
                />
              )}
              <span className={`relative ${active ? 'text-[#13191F]' : 'text-[#594C3D]'}`}>{entry.label}</span>
            </button>
          );
        })}
      </div>

      {mode === 'signin' ? (
        <>
          <div className="rounded-[20px] bg-[#FFFDF9] ios-card-shadow p-4 sm:p-5 space-y-3">
            <Field label="Email">
              <TextInput value={email} onChange={setEmail} type="email" placeholder="you@roastery.ph" />
            </Field>
            <Field label="Password">
              <TextInput value={password} onChange={setPassword} type="password" placeholder="Your password" />
            </Field>
            {error && <ErrorNote message={error} />}
            <PrimaryButton onClick={() => void signIn()} disabled={busy} className="w-full sm:w-auto sm:min-w-40">
              {busy ? 'Signing in' : 'Sign In'}
            </PrimaryButton>
          </div>

          {/* Local development only: the seeded admin does not exist in production builds */}
          {import.meta.env.DEV && (
          <section className="space-y-1.5" aria-labelledby="auth-demo-title">
            <h2 id="auth-demo-title" className="px-4 text-[13px] text-[#594C3D]">
              Demo access
            </h2>
            <dl className="ios-group ios-card-shadow">
              <div className="ios-group-row justify-between">
                <dt className="text-[15px] text-[#13191F]">Email</dt>
                <dd className="font-mono text-[15px] text-[#594C3D] truncate">admin@haraya.ph</dd>
              </div>
              <div className="ios-group-row justify-between">
                <dt className="text-[15px] text-[#13191F]">Password</dt>
                <dd className="font-mono text-[15px] text-[#594C3D] truncate">haraya-admin</dd>
              </div>
            </dl>
            <p className="px-4 ios-footnote text-[#594C3D]">Roasters can also apply for verification in three steps.</p>
          </section>
          )}
        </>
      ) : (
        <div className="rounded-[20px] bg-[#FFFDF9] ios-card-shadow p-4 sm:p-5 space-y-4">
          {stepRail}

          {step === 0 && (
            <div className="space-y-3">
              <Field label="Business name">
                <TextInput value={businessName} onChange={setBusinessName} placeholder="e.g. Matina Micro Roasters" />
              </Field>
              <Field label="Handle" hint="Your storefront link: haraya.ph/#/roastery/your-handle">
                <TextInput value={handle} onChange={setHandle} placeholder="matinacroasters" />
              </Field>
              <Field label="Venue type">
                <SelectInput
                  value={isRoastery}
                  onChange={(value) => setIsRoastery(value as 'roastery' | 'cafe')}
                  options={[
                    { value: 'roastery', label: 'Micro-Roastery (roasts own beans)' },
                    { value: 'cafe', label: 'Specialty Cafe' },
                  ]}
                />
              </Field>
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
                <Field label="City">
                  <SelectInput
                    value={city}
                    onChange={(value) => setCity(value as DavaoCity)}
                    options={DAVAO_CITIES.filter((entry) => entry !== 'All Davao Region').map((entry) => ({ value: entry, label: entry }))}
                  />
                </Field>
                <Field label="District">
                  <SelectInput
                    value={district}
                    onChange={(value) => setDistrict(value as District)}
                    options={DAVAO_DISTRICTS.map((entry) => ({ value: entry, label: entry }))}
                  />
                </Field>
              </div>
              <Field label="Short description">
                <TextArea
                  value={description}
                  onChange={setDescription}
                  rows={3}
                  maxLength={300}
                  placeholder="What do you roast, and what makes your bar worth the trip?"
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field
                label="DTI or Mayor's permit number"
                hint="We verify your business with this number. Haraya never asks for ID photos in this form."
              >
                <TextInput value={permitNumber} onChange={setPermitNumber} placeholder="e.g. DN-2026-1234567" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Field label="Contact person">
                <TextInput value={contactName} onChange={setContactName} placeholder="Your name" />
              </Field>
              <Field label="Email">
                <TextInput value={email} onChange={setEmail} type="email" placeholder="you@roastery.ph" />
              </Field>
              <Field label="Password" hint="At least 8 characters">
                <TextInput value={password} onChange={setPassword} type="password" placeholder="Create a password" />
              </Field>
              <div className="rounded-[14px] ios-fill px-3.5 py-3 flex gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#906D4B] shrink-0 mt-0.5" />
                <p className="ios-footnote text-[#594C3D]">
                  Your application stays pending until Haraya verifies your permit. By applying you agree to the{' '}
                  <a href="#/tab/terms" className="font-semibold text-[#7D5C3D] underline underline-offset-2">Terms</a> and{' '}
                  <a href="#/tab/privacy" className="font-semibold text-[#7D5C3D] underline underline-offset-2">Privacy Notice</a>.
                </p>
              </div>
            </div>
          )}

          {error && <ErrorNote message={error} />}

          <div className="flex gap-2">
            {step > 0 && (
              <SecondaryButton onClick={() => setStep(step - 1)} className="shrink-0 !pl-3.5">
                <span className="inline-flex items-center gap-0.5">
                  <ChevronLeft className="w-4.5 h-4.5" strokeWidth={2.5} />
                  Back
                </span>
              </SecondaryButton>
            )}
            <PrimaryButton onClick={nextFromStep} disabled={busy} className="flex-1">
              <span className="inline-flex items-center justify-center gap-0.5">
                {step === 2 ? 'Submit Application' : 'Continue'}
                {step < 2 && <ChevronRight className="w-4.5 h-4.5" strokeWidth={2.5} />}
              </span>
            </PrimaryButton>
          </div>
        </div>
      )}

      <button
        onClick={onBrowseFeed}
        className="h-11 flex items-center justify-center gap-1.5 mx-auto px-3 text-[15px] font-medium font-sans text-[#7D5C3D] ios-press"
      >
        <Store className="w-4 h-4" />
        Keep browsing the feed
      </button>
    </div>
  );
};
