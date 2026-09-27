import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Store, Flame } from 'lucide-react';
import type { Account } from '../../types/auth';
import type { DavaoCity, District } from '../../types/coffee';
import { DAVAO_CITIES, DAVAO_DISTRICTS } from '../../types/coffee';
import { authService } from '../../services/authService';
import { useAuthVersion } from '../../hooks/useServiceVersions';
import { Field, TextInput, TextArea, SelectInput, PrimaryButton, SecondaryButton, ErrorNote } from '../common/FormControls';
import { ImageUploadField } from '../common/ImageUploadField';

export type AuthMode = 'signin' | 'signup';

interface AuthViewProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (account: Account) => void;
  onBrowseFeed: () => void;
}

const STEP_LABELS = ['Business', 'Documents', 'Account'];

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
  // Step 1 documents
  const [permitNumber, setPermitNumber] = useState('');
  const [permitDoc, setPermitDoc] = useState<string | null>(null);
  const [idDoc, setIdDoc] = useState<string | null>(null);
  // Step 2 account
  const [contactName, setContactName] = useState('');

  const signIn = () => {
    try {
      const account = authService.signIn(email, password);
      setError('');
      onAuthenticated(account);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed.');
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
      if (!idDoc) {
        setError('One government ID photo is required for verification.');
        return;
      }
      setStep(2);
      return;
    }
    submit();
  };

  const submit = () => {
    try {
      const account = authService.signUpRoaster({
        email,
        password,
        contactName,
        permitDoc,
        idDoc,
        application: {
          businessName,
          handle: handle.trim(),
          district,
          city,
          isRoastery: isRoastery === 'roastery',
          description,
          permitNumber,
          permitDoc,
          idDoc,
        },
      });
      setError('');
      onAuthenticated(account);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Registration failed.');
    }
  };

  const stepRail = (
    <div className="flex items-center gap-2">
      {STEP_LABELS.map((label, index) => (
        <React.Fragment key={label}>
          <span
            className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold font-sans border ${
              index < step
                ? 'bg-[#3E5C48] border-[#3E5C48] text-[#FFF9E9]'
                : index === step
                  ? 'bg-[#1A2225] border-[#1A2225] text-[#FFF9E9]'
                  : 'bg-[#F3ECD8] border-[#E6DCC0] text-[#55615D]'
            }`}
          >
            {index < step ? <Check className="w-3.5 h-3.5" /> : index + 1}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest font-sans ${index === step ? 'text-[#1A2225]' : 'text-[#55615D]'}`}>
            {label}
          </span>
          {index < STEP_LABELS.length - 1 && <span className="flex-1 h-px bg-[#E6DCC0]" />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      <div className="text-center space-y-2 mb-6">
        <span className="mx-auto h-12 w-12 rounded-full bg-[#1A2225] flex items-center justify-center">
          <Flame className="w-6 h-6 text-[#C86428]" />
        </span>
        <h1 className="font-cooper text-2xl font-bold text-[#1A2225]">
          {mode === 'signin' ? 'Roaster Sign In' : 'Join Haraya as a Roaster'}
        </h1>
        <p className="text-xs font-sans text-[#55615D] leading-relaxed">
          {mode === 'signin'
            ? 'Access your Roaster Suite: inventory, roast schedule, menu, and the reservation inbox.'
            : 'List your roastery or cafe, schedule bean drops, and reach Davao cuppers. Verification keeps the archive authentic.'}
        </p>
      </div>

      <div className="rounded-3xl bg-[#FFF9E9] border border-[#E6DCC0] p-5 sm:p-6 space-y-4 shadow-sm">
        {mode === 'signin' ? (
          <>
            <Field label="Email">
              <TextInput value={email} onChange={setEmail} type="email" placeholder="you@roastery.ph" />
            </Field>
            <Field label="Password">
              <TextInput value={password} onChange={setPassword} type="password" placeholder="Your password" />
            </Field>
            {error && <ErrorNote message={error} />}
            <PrimaryButton onClick={signIn} className="w-full">
              Sign In
            </PrimaryButton>
            <div className="rounded-xl bg-[#F3ECD8] border border-[#E6DCC0] px-3 py-2.5 text-[10px] font-sans text-[#55615D] leading-relaxed">
              Demo access: admin@haraya.ph : haraya-admin. Roaster accounts are created through the three-step
              sign-up and approved in the Control Room.
            </div>
          </>
        ) : (
          <>
            {stepRail}

            {step === 0 && (
              <div className="space-y-3">
                <Field label="Business Name">
                  <TextInput value={businessName} onChange={setBusinessName} placeholder="e.g. Matina Micro Roasters" />
                </Field>
                <Field label="Handle" hint="Your storefront link: haraya.ph/#/roastery/your-handle">
                  <TextInput value={handle} onChange={setHandle} placeholder="matinacroasters" />
                </Field>
                <Field label="Venue Type">
                  <SelectInput
                    value={isRoastery}
                    onChange={(value) => setIsRoastery(value as 'roastery' | 'cafe')}
                    options={[
                      { value: 'roastery', label: 'Micro-Roastery (roasts own beans)' },
                      { value: 'cafe', label: 'Specialty Cafe' },
                    ]}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
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
                <Field label="Short Description">
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
                <Field label="DTI or Mayor's Permit Number">
                  <TextInput value={permitNumber} onChange={setPermitNumber} placeholder="e.g. DN-2026-1234567" />
                </Field>
                <ImageUploadField
                  label="Permit Document Photo (optional)"
                  hint="Speeds up verification, but the permit number alone can be reviewed."
                  value={permitDoc}
                  onChange={setPermitDoc}
                  aspect="wide"
                />
                <ImageUploadField
                  label="One Government ID (required)"
                  hint="Stored in this browser demo only. Production uses secure document intake."
                  value={idDoc}
                  onChange={setIdDoc}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <Field label="Contact Person">
                  <TextInput value={contactName} onChange={setContactName} placeholder="Your name" />
                </Field>
                <Field label="Email">
                  <TextInput value={email} onChange={setEmail} type="email" placeholder="you@roastery.ph" />
                </Field>
                <Field label="Password" hint="At least 8 characters">
                  <TextInput value={password} onChange={setPassword} type="password" placeholder="Create a password" />
                </Field>
                <div className="rounded-xl bg-[#C86428]/10 border border-[#C86428]/30 px-3 py-2.5 flex gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#A34F1E] shrink-0 mt-0.5" />
                  <p className="text-[10px] font-sans text-[#A34F1E] leading-relaxed">
                    Your application goes to the Haraya Control Room. Status stays pending until an admin verifies
                    your permit and ID.
                  </p>
                </div>
              </div>
            )}

            {error && <ErrorNote message={error} />}

            <div className="flex gap-2">
              {step > 0 && (
                <SecondaryButton onClick={() => setStep(step - 1)} className="shrink-0">
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </span>
                </SecondaryButton>
              )}
              <PrimaryButton onClick={nextFromStep} className="flex-1">
                <span className="inline-flex items-center justify-center gap-1.5">
                  {step === 2 ? 'Submit Application' : 'Continue'}
                  {step < 2 && <ArrowRight className="w-3.5 h-3.5" />}
                </span>
              </PrimaryButton>
            </div>
          </>
        )}

        <div className="pt-3 border-t border-[#E6DCC0] text-center space-y-2">
          <button
            onClick={() => {
              setError('');
              setStep(0);
              onModeChange(mode === 'signin' ? 'signup' : 'signin');
            }}
            className="text-xs font-bold font-sans text-[#C86428] hover:underline"
          >
            {mode === 'signin' ? 'New roastery? Apply for verification' : 'Already verified? Sign in'}
          </button>
          <button
            onClick={onBrowseFeed}
            className="flex items-center justify-center gap-1.5 mx-auto text-[11px] font-sans text-[#55615D] hover:text-[#1A2225] transition-colors"
          >
            <Store className="w-3 h-3" />
            Keep browsing the feed instead
          </button>
        </div>
      </div>
    </div>
  );
};
