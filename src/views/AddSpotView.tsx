import React, { useState } from 'react';
import { Check, Clock, LogOut, Mail, MapPin, X } from 'lucide-react';
import { LargeTitle } from '../components/common/LargeTitle';
import { AyaMascot } from '../components/common/AyaMascot';
import { Chip, ErrorNote, Field, PrimaryButton, SelectInput, TextArea, TextInput } from '../components/common/FormControls';
import { LocationPicker } from '../components/community/LocationPicker';
import { spotService } from '../services/spotService';
import { useSpotVersion } from '../hooks/useServiceVersions';
import { DAVAO_CITIES, DAVAO_DISTRICTS, AMENITY_LABELS, type District } from '../types/coffee';
import {
  SPOT_AMENITIES,
  SPOT_LIMITS,
  SPOT_VIBES,
  validateSpotInput,
  type SpotAmenity,
  type SpotInput,
  type SpotRow,
  type SpotVibe,
} from '../services/spotMapping';

interface AddSpotViewProps {
  onViewSpot: (cafeId: string) => void;
}

const EMPTY: SpotInput = {
  name: '',
  city: 'Davao City',
  district: 'Poblacion',
  address: '',
  lat: null,
  lng: null,
  amenities: [],
  vibes: [],
  priceLevel: null,
  opensAt: '',
  closesAt: '',
  tip: '',
  publicPlaceConfirmed: false,
};

const PRICE_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: 'Budget' },
  { value: 2, label: 'Mid' },
  { value: 3, label: 'Premium' },
];

const CARD = 'rounded-[20px] bg-[#FFFDF9] ios-card-shadow p-4 sm:p-5';
const GROUP_LABEL = 'px-1 text-[13px] font-medium text-[#594C3D]';

const statusText: Record<SpotRow['status'], { label: string; tone: string }> = {
  pending: { label: 'Waiting for review', tone: 'text-[#7D5C3D]' },
  approved: { label: 'Live on the map', tone: 'text-[#3E5C48]' },
  rejected: { label: 'Not approved', tone: 'text-[#8C3A2E]' },
};

const toggle = <T,>(list: T[], item: T): T[] => (list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]);

/** Email sign-in with a one-time link; Supabase creates the account on first use. */
const SignInCard: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      await spotService.sendSignInLink(email);
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send the sign-in link.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className={`${CARD} flex items-start gap-3`}>
        <Mail className="w-5 h-5 text-[#906D4B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="ios-headline text-[#13191F]">Check your email</h2>
          <p className="text-[14px] text-[#594C3D]">
            We sent a sign-in link to <span className="font-medium text-[#13191F]">{email.trim()}</span>. Open it on this
            device to come back here signed in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${CARD} space-y-3`}>
      <div className="space-y-1">
        <h2 className="ios-headline text-[#13191F]">Sign in to add a spot</h2>
        <p className="text-[14px] text-[#594C3D]">No password. We email you a one-time link.</p>
      </div>
      <Field label="Email">
        <TextInput value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
      </Field>
      {error && <ErrorNote message={error} />}
      <PrimaryButton onClick={() => void send()} disabled={busy || !email.trim()} className="w-full sm:w-auto">
        {busy ? 'Sending' : 'Email me a sign-in link'}
      </PrimaryButton>
      <p className="ios-footnote text-[#594C3D]">
        By signing in you agree to the{' '}
        <a href="#/tab/terms" className="font-semibold text-[#7D5C3D] underline underline-offset-2">Terms</a> and{' '}
        <a href="#/tab/privacy" className="font-semibold text-[#7D5C3D] underline underline-offset-2">Privacy Notice</a>.
      </p>
    </div>
  );
};

const SpotForm: React.FC<{ onSubmitted: () => void }> = ({ onSubmitted }) => {
  const [input, setInput] = useState<SpotInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof SpotInput>(key: K, value: SpotInput[K]) => setInput((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const problem = validateSpotInput(input);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await spotService.submit(input);
      setInput(EMPTY);
      onSubmitted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send your spot.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${CARD} space-y-5`}>
      <div className="space-y-3">
        <Field label="Place name">
          <TextInput value={input.name} onChange={(value) => set('name', value)} placeholder="e.g. Lot 38 Study Cafe" />
        </Field>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
          <Field label="City">
            <SelectInput
              value={input.city}
              onChange={(value) => set('city', value as SpotInput['city'])}
              options={DAVAO_CITIES.filter((city) => city !== 'All Davao Region').map((city) => ({ value: city, label: city }))}
            />
          </Field>
          <Field label="Area">
            <SelectInput
              value={input.district}
              onChange={(value) => set('district', value as District)}
              options={DAVAO_DISTRICTS.map((district) => ({ value: district, label: district }))}
            />
          </Field>
        </div>
        <Field label="Landmark or street" hint="How would you tell a friend to find it?">
          <TextInput value={input.address} onChange={(value) => set('address', value)} placeholder="e.g. Jacinto Extension, beside the chapel" />
        </Field>
      </div>

      <div className="space-y-2">
        <p className={GROUP_LABEL}>Location</p>
        <LocationPicker lat={input.lat} lng={input.lng} onChange={(point) => setInput((current) => ({ ...current, ...point }))} />
      </div>

      <fieldset className="space-y-2">
        <legend className={GROUP_LABEL}>Why it is great</legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {SPOT_VIBES.map((vibe) => {
            const active = input.vibes.includes(vibe.id);
            return (
              <button
                key={vibe.id}
                type="button"
                aria-pressed={active}
                onClick={() => set('vibes', toggle<SpotVibe>(input.vibes, vibe.id))}
                className={`text-left rounded-[14px] px-3.5 py-2.5 ios-press ${active ? 'bg-[#13191F] text-[#FFFDF9]' : 'ios-fill text-[#13191F]'}`}
              >
                <span className="block text-[15px] font-semibold">{vibe.label}</span>
                <span className={`block ios-footnote ${active ? 'text-[#FFFDF9]/80' : 'text-[#594C3D]'}`}>{vibe.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={GROUP_LABEL}>What it has</legend>
        <div className="flex flex-wrap gap-2">
          {SPOT_AMENITIES.map((amenity) => (
            <Chip
              key={amenity}
              label={AMENITY_LABELS[amenity]}
              active={input.amenities.includes(amenity)}
              onClick={() => set('amenities', toggle<SpotAmenity>(input.amenities, amenity))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={GROUP_LABEL}>Price range</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Price range">
          {PRICE_OPTIONS.map((option) => (
            <Chip key={option.value} label={option.label} active={input.priceLevel === option.value} onClick={() => set('priceLevel', option.value)} />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={GROUP_LABEL}>Hours (optional, same every day)</legend>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opens">
            <TextInput type="time" value={input.opensAt} onChange={(value) => set('opensAt', value)} />
          </Field>
          <Field label="Closes">
            <TextInput type="time" value={input.closesAt} onChange={(value) => set('closesAt', value)} />
          </Field>
        </div>
      </fieldset>

      <Field label="Local tip (optional)" hint={`${input.tip.length} of ${SPOT_LIMITS.tip}`}>
        <TextArea
          value={input.tip}
          onChange={(value) => set('tip', value)}
          rows={3}
          maxLength={SPOT_LIMITS.tip}
          placeholder="e.g. Sockets are behind the couch on the second floor."
        />
      </Field>

      <label className="flex items-start gap-3 rounded-[14px] ios-fill px-3.5 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={input.publicPlaceConfirmed}
          onChange={(event) => set('publicPlaceConfirmed', event.target.checked)}
          className="accent-[#906D4B] h-5 w-5 mt-0.5 shrink-0"
        />
        <span className="text-[14px] text-[#13191F]">
          This is a business open to the public, not a private home, and the details are true to my knowledge.
        </span>
      </label>

      {error && <ErrorNote message={error} />}
      <PrimaryButton onClick={() => void submit()} disabled={busy} className="w-full">
        {busy ? 'Sending' : 'Send for review'}
      </PrimaryButton>
      <p className="ios-footnote text-[#594C3D]">
        Haraya reviews every spot before it goes public. Until then only you see it, marked Pending.
      </p>
    </div>
  );
};

const MySpots: React.FC<{ rows: SpotRow[]; onViewSpot: (cafeId: string) => void }> = ({ rows, onViewSpot }) => {
  if (rows.length === 0) return null;
  return (
    <section className="space-y-1.5" aria-labelledby="my-spots-title">
      <h2 id="my-spots-title" className="px-4 text-[13px] text-[#594C3D]">
        Your spots
      </h2>
      <ul className="ios-group ios-card-shadow">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              onClick={() => row.status !== 'rejected' && onViewSpot(`spot-${row.id}`)}
              disabled={row.status === 'rejected'}
              className="ios-group-row ios-press text-left w-full disabled:cursor-default"
            >
              <MapPin className="w-4.5 h-4.5 shrink-0 text-[#906D4B]" />
              <span className="flex-1 min-w-0">
                <span className="block ios-headline text-[#13191F] truncate">{row.name}</span>
                <span className={`block ios-footnote ${statusText[row.status].tone}`}>
                  {statusText[row.status].label}
                  {row.status === 'rejected' && row.review_note ? `: ${row.review_note}` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

const ReviewQueue: React.FC<{ rows: SpotRow[]; onViewSpot: (cafeId: string) => void }> = ({ rows, onViewSpot }) => {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const review = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setError('');
    try {
      await spotService.review(id, status, notes[id] ?? '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the review.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-2" aria-labelledby="review-title">
      <h2 id="review-title" className="ios-title px-1">
        Review queue <span className="font-mono text-[#594C3D]">({rows.length})</span>
      </h2>
      {error && <ErrorNote message={error} />}
      {rows.length === 0 ? (
        <p className="px-1 text-[14px] text-[#594C3D]">Nothing waiting for review.</p>
      ) : (
        rows.map((row) => (
          <article key={row.id} className={`${CARD} space-y-2.5`}>
            <div>
              <h3 className="ios-headline text-[#13191F]">{row.name}</h3>
              <p className="ios-footnote text-[#594C3D]">
                {row.address}, {row.district}, {row.city}
              </p>
              {row.tip && <p className="text-[14px] text-[#13191F]/85 mt-1">"{row.tip}"</p>}
              <p className="ios-footnote text-[#594C3D] mt-1">
                <span className="font-mono">{row.lat.toFixed(5)}, {row.lng.toFixed(5)}</span>
                {row.opens_at && row.closes_at && (
                  <span className="inline-flex items-center gap-1 ml-2">
                    <Clock className="w-3.5 h-3.5" /> {row.opens_at.slice(0, 5)} to {row.closes_at.slice(0, 5)}
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => onViewSpot(`spot-${row.id}`)} className="ios-footnote font-semibold text-[#7D5C3D] ios-press min-h-9">
              See it on the map
            </button>
            <input
              value={notes[row.id] ?? ''}
              onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))}
              maxLength={280}
              placeholder="Note to the contributor (shown if rejected)"
              aria-label={`Review note for ${row.name}`}
              className="w-full h-11 ios-fill rounded-[12px] px-3.5 text-[14px] text-[#13191F] placeholder:text-[#6E6150] focus:outline-none focus:shadow-[0_0_0_2px_#906D4B]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => void review(row.id, 'approved')}
                disabled={busyId === row.id}
                className="h-11 flex-1 rounded-full bg-[#3E5C48] text-[#FFFDF9] text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ios-press"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => void review(row.id, 'rejected')}
                disabled={busyId === row.id}
                className="h-11 flex-1 rounded-full ios-fill text-[#8C3A2E] text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ios-press"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
};

/** Add a Spot: community submissions of cafes and study spots, reviewed before they go public. */
export const AddSpotView: React.FC<AddSpotViewProps> = ({ onViewSpot }) => {
  useSpotVersion();
  const [justSent, setJustSent] = useState(false);
  const user = spotService.getUser();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-8 sm:pt-4 space-y-5">
      <LargeTitle
        title="Add a Spot"
        subtitle="Know a quiet corner or study cafe that is not on Google Maps? Share it."
        trailing={<AyaMascot pose="mood" size={72} alt="" />}
      />

      {!spotService.isAvailable() ? (
        <div className={CARD}>
          <p className="text-[15px] text-[#594C3D]">Adding spots is not available right now. Please check back soon.</p>
        </div>
      ) : !user ? (
        <SignInCard />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="ios-footnote text-[#594C3D] truncate">
              Signed in as <span className="text-[#13191F] font-medium">{user.email}</span>
            </p>
            <button
              onClick={() => void spotService.signOut()}
              className="min-h-11 inline-flex items-center gap-1 text-[14px] font-medium text-[#7D5C3D] ios-press"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>

          {justSent && (
            <div className={`${CARD} flex items-center gap-3`} role="status">
              <AyaMascot pose="welcome" size={64} alt="" />
              <p className="text-[15px] text-[#13191F]">
                Thank you. Your spot shows on your map as Pending until Haraya reviews it.
              </p>
            </div>
          )}

          {spotService.getLoadError() && <ErrorNote message={spotService.getLoadError() ?? ''} />}

          <SpotForm onSubmitted={() => setJustSent(true)} />
          <MySpots rows={spotService.getMySubmissions()} onViewSpot={onViewSpot} />
          {spotService.isAdmin() && <ReviewQueue rows={spotService.getReviewQueue()} onViewSpot={onViewSpot} />}
        </>
      )}
    </div>
  );
};
