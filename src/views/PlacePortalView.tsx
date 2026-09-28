import React, { useEffect, useState } from 'react';
import { BadgeCheck, Clock, ExternalLink, LogIn, Plus, ShieldCheck, Store, Trash2, XCircle } from 'lucide-react';
import { LargeTitle } from '../components/common/LargeTitle';
import { AyaMascot } from '../components/common/AyaMascot';
import { Chip, ErrorNote, Field, PrimaryButton, SecondaryButton, SelectInput, TextArea, TextInput } from '../components/common/FormControls';
import { LocationPicker } from '../components/community/LocationPicker';
import { placeService } from '../services/placeService';
import { sessionService } from '../services/sessionService';
import { usePlaceVersion, useSessionVersion, useCatalogVersion } from '../hooks/useServiceVersions';
import {
  APPLICATION_LIMITS,
  LISTING_AMENITIES,
  LISTING_LIMITS,
  PLACE_TYPES,
  listingFromCafe,
  placeTypeLabel,
  validateListing,
  validatePlaceApplication,
  type ListingInput,
  type PlaceApplicationInput,
  type PlaceApplicationRow,
  type PlaceType,
} from '../services/placeMapping';
import { AMENITY_LABELS, BREW_METHODS, DAVAO_CITIES, DAVAO_DISTRICTS, type AmenityKey, type BrewMethod, type District, type MenuItem } from '../types/coffee';
import { WEEKDAY_ORDER } from '../utils/weekdays';

interface PlacePortalViewProps {
  onOpenLogin: () => void;
  onViewPlace: (cafeId: string) => void;
  onBrowse: () => void;
}

const CARD = 'rounded-[20px] bg-[#FFFDF9] ios-card-shadow p-4 sm:p-5';
const GROUP_LABEL = 'px-1 text-[13px] font-medium text-[#594C3D]';
const MENU_CATEGORIES: MenuItem['category'][] = ['Espresso Bar', 'Filter', 'Signature', 'Pastry'];
const PRICE_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: 'Budget' },
  { value: 2, label: 'Mid' },
  { value: 3, label: 'Premium' },
];

const EMPTY_APPLICATION: PlaceApplicationInput = {
  businessName: '',
  placeType: 'cafe',
  city: 'Davao City',
  district: 'Poblacion',
  address: '',
  lat: null,
  lng: null,
  permitNumber: '',
  contactName: '',
  contactPhone: '',
  description: '',
  ownerConfirmed: false,
};

const toggle = <T,>(list: T[], item: T): T[] => (list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]);

/** What the portal offers, for visitors who are not signed in or have not applied. */
const Pitch: React.FC = () => (
  <ul className="space-y-3">
    {[
      { icon: Store, title: 'A verified listing', body: 'Your place on Discover and the map with a verified badge.' },
      { icon: Clock, title: 'Hours and amenities you control', body: 'Update opening hours, Wi-Fi, plugs and your signature drink any time.' },
      { icon: ShieldCheck, title: 'Reviewed by Haraya', body: 'We check the permit number before a listing goes live.' },
    ].map((item) => (
      <li key={item.title} className="flex items-start gap-3">
        <span className="h-9 w-9 shrink-0 rounded-[10px] bg-[#906D4B]/12 flex items-center justify-center text-[#906D4B]">
          <item.icon className="w-4.5 h-4.5" />
        </span>
        <span className="min-w-0">
          <span className="block ios-headline text-[#13191F]">{item.title}</span>
          <span className="block text-[14px] text-[#594C3D] leading-snug">{item.body}</span>
        </span>
      </li>
    ))}
  </ul>
);

const ApplicationForm: React.FC<{ onSubmitted: () => void }> = ({ onSubmitted }) => {
  const [input, setInput] = useState<PlaceApplicationInput>(() => ({
    ...EMPTY_APPLICATION,
    contactName: sessionService.getDisplayName(),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof PlaceApplicationInput>(key: K, value: PlaceApplicationInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const problem = validatePlaceApplication(input);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await placeService.submitApplication(input);
      onSubmitted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send your application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${CARD} space-y-5`}>
      <div className="space-y-3">
        <Field label="Name of the place">
          <TextInput value={input.businessName} onChange={(value) => set('businessName', value)} placeholder="e.g. Matina Micro Roasters" />
        </Field>
        <fieldset className="space-y-2">
          <legend className={GROUP_LABEL}>What kind of place</legend>
          <div className="grid sm:grid-cols-3 gap-2">
            {PLACE_TYPES.map((type) => {
              const active = input.placeType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set('placeType', type.id as PlaceType)}
                  className={`text-left rounded-[14px] px-3.5 py-2.5 ios-press ${active ? 'bg-[#13191F] text-[#FFFDF9]' : 'ios-fill text-[#13191F]'}`}
                >
                  <span className="block text-[15px] font-semibold">{type.label}</span>
                  <span className={`block ios-footnote ${active ? 'text-[#FFFDF9]/80' : 'text-[#594C3D]'}`}>{type.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
          <Field label="City">
            <SelectInput
              value={input.city}
              onChange={(value) => set('city', value as PlaceApplicationInput['city'])}
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
        <Field label="Street address">
          <TextInput value={input.address} onChange={(value) => set('address', value)} placeholder="e.g. 12 Jacinto Extension" />
        </Field>
      </div>

      <div className="space-y-2">
        <p className={GROUP_LABEL}>Location</p>
        <LocationPicker lat={input.lat} lng={input.lng} onChange={(point) => setInput((current) => ({ ...current, ...point }))} />
      </div>

      <div className="space-y-3">
        <Field label="DTI or Mayor's permit number" hint="We verify the business with this number. Haraya never asks for ID photos.">
          <TextInput value={input.permitNumber} onChange={(value) => set('permitNumber', value)} placeholder="e.g. DN-2026-1234567" />
        </Field>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
          <Field label="Contact person">
            <TextInput value={input.contactName} onChange={(value) => set('contactName', value)} placeholder="Your name" />
          </Field>
          <Field label="Phone (optional)">
            <TextInput value={input.contactPhone} onChange={(value) => set('contactPhone', value)} type="tel" placeholder="0917 000 0000" />
          </Field>
        </div>
        <Field label="About the place (optional)" hint={`${input.description.length} of ${APPLICATION_LIMITS.description}`}>
          <TextArea
            value={input.description}
            onChange={(value) => set('description', value)}
            rows={3}
            maxLength={APPLICATION_LIMITS.description}
            placeholder="What do you serve, and what makes it worth the trip?"
          />
        </Field>
      </div>

      <label className="flex items-start gap-3 rounded-[14px] ios-fill px-3.5 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={input.ownerConfirmed}
          onChange={(event) => set('ownerConfirmed', event.target.checked)}
          className="accent-[#906D4B] h-5 w-5 mt-0.5 shrink-0"
        />
        <span className="text-[14px] text-[#13191F]">
          I own or manage this place, it is open to the public, and the details are true to my knowledge.
        </span>
      </label>

      {error && <ErrorNote message={error} />}
      <PrimaryButton onClick={() => void submit()} disabled={busy} className="w-full">
        {busy ? 'Sending' : 'Send application'}
      </PrimaryButton>
      <p className="ios-footnote text-[#594C3D]">
        Haraya checks the permit number before the listing goes live. By applying you agree to the{' '}
        <a href="#/tab/terms" className="font-semibold text-[#7D5C3D] underline underline-offset-2">Terms</a> and{' '}
        <a href="#/tab/privacy" className="font-semibold text-[#7D5C3D] underline underline-offset-2">Privacy Notice</a>.
      </p>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="ios-group-row justify-between">
    <dt className="text-[15px] text-[#13191F] shrink-0">{label}</dt>
    <dd className="text-[15px] text-[#594C3D] text-right min-w-0 truncate">{children}</dd>
  </div>
);

/** Pending or rejected application. */
const ApplicationStatus: React.FC<{ application: PlaceApplicationRow; onApplyAgain: () => void }> = ({ application, onApplyAgain }) => {
  const rejected = application.status === 'rejected';
  return (
    <div className="space-y-5">
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
              {rejected ? 'Application needs changes' : 'Under review'}
            </p>
            <p className="text-[14px] leading-[1.45] text-[#594C3D]">
              {rejected
                ? application.review_note || 'Haraya could not verify the permit number. Check the details and apply again.'
                : `${application.business_name} is waiting for verification. Haraya checks the permit number before a listing goes live.`}
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-1.5" aria-labelledby="application-details-title">
        <h2 id="application-details-title" className="px-4 text-[13px] text-[#594C3D]">
          Application
        </h2>
        <dl className="ios-group ios-card-shadow">
          <DetailRow label="Place">{application.business_name}</DetailRow>
          <DetailRow label="Type">{placeTypeLabel(application.place_type)}</DetailRow>
          <DetailRow label="Location">
            {application.district}, {application.city}
          </DetailRow>
          <DetailRow label="Permit">
            <span className="font-mono">{application.permit_number}</span>
          </DetailRow>
          <DetailRow label="Sent">{new Date(application.created_at).toLocaleDateString()}</DetailRow>
        </dl>
      </section>

      {rejected && (
        <PrimaryButton onClick={onApplyAgain} className="w-full sm:w-auto">
          Apply again
        </PrimaryButton>
      )}
    </div>
  );
};

const HoursEditor: React.FC<{ value: ListingInput['hours']; onChange: (hours: ListingInput['hours']) => void }> = ({ value, onChange }) => (
  <div className="ios-group">
    {WEEKDAY_ORDER.map((day) => {
      const entry = value[day];
      const open = entry.open !== null;
      return (
        <div key={day} className="ios-group-row flex-wrap gap-y-2">
          <label className="flex items-center gap-2.5 min-w-[7.5rem] cursor-pointer">
            <input
              type="checkbox"
              checked={open}
              onChange={(event) =>
                onChange({ ...value, [day]: event.target.checked ? { open: '08:00', close: '20:00' } : { open: null, close: null } })
              }
              className="accent-[#906D4B] h-5 w-5 shrink-0"
              aria-label={`${day} open`}
            />
            <span className="text-[15px] text-[#13191F]">{day}</span>
          </label>
          {open ? (
            <span className="flex items-center gap-2 ml-auto">
              <input
                type="time"
                value={entry.open ?? ''}
                onChange={(event) => onChange({ ...value, [day]: { ...entry, open: event.target.value || null } })}
                aria-label={`${day} opens`}
                className="h-9 w-[6.5rem] ios-fill rounded-[10px] px-2.5 text-[14px] text-[#13191F] focus:outline-none focus:shadow-[0_0_0_2px_#906D4B]"
              />
              <span className="ios-footnote text-[#594C3D]">to</span>
              <input
                type="time"
                value={entry.close ?? ''}
                onChange={(event) => onChange({ ...value, [day]: { ...entry, close: event.target.value || null } })}
                aria-label={`${day} closes`}
                className="h-9 w-[6.5rem] ios-fill rounded-[10px] px-2.5 text-[14px] text-[#13191F] focus:outline-none focus:shadow-[0_0_0_2px_#906D4B]"
              />
            </span>
          ) : (
            <span className="ml-auto ios-footnote text-[#594C3D]">Closed</span>
          )}
        </div>
      );
    })}
  </div>
);

const MenuEditor: React.FC<{ value: MenuItem[]; onChange: (menu: MenuItem[]) => void }> = ({ value, onChange }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<MenuItem['category']>('Espresso Bar');
  const [problem, setProblem] = useState('');

  const add = () => {
    const amount = Number(price);
    if (!name.trim() || !Number.isFinite(amount) || amount < 0) {
      setProblem('A menu item needs a name and a price of 0 or more.');
      return;
    }
    if (value.length >= LISTING_LIMITS.menu) {
      setProblem(`Keep the menu under ${LISTING_LIMITS.menu} items.`);
      return;
    }
    onChange([...value, { name: name.trim(), price: Math.round(amount), category }]);
    setName('');
    setPrice('');
    setProblem('');
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="ios-group">
          {value.map((item, index) => (
            <li key={`${item.name}-${index}`} className="ios-group-row">
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] text-[#13191F] truncate">{item.name}</span>
                <span className="block ios-footnote text-[#594C3D]">{item.category}</span>
              </span>
              <span className="font-mono text-[15px] text-[#13191F]">{item.price}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Remove ${item.name}`}
                className="h-11 w-11 -mr-2 flex items-center justify-center text-[#8C3A2E] ios-press"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-[1fr_5.5rem_auto] gap-2 items-end">
        <Field label="Item">
          <TextInput value={name} onChange={setName} placeholder="e.g. Flat white" />
        </Field>
        <Field label="Price">
          <TextInput value={price} onChange={setPrice} type="number" min={0} placeholder="150" />
        </Field>
        <Field label="Category">
          <SelectInput
            value={category}
            onChange={(next) => setCategory(next as MenuItem['category'])}
            options={MENU_CATEGORIES.map((entry) => ({ value: entry, label: entry }))}
          />
        </Field>
      </div>
      {problem && <ErrorNote message={problem} />}
      <SecondaryButton onClick={add} className="w-full sm:w-auto">
        <span className="inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Add item
        </span>
      </SecondaryButton>
    </div>
  );
};

/** The approved owner's dashboard: the live listing and everything they can change on it. */
const ListingEditor: React.FC<{ onViewPlace: (cafeId: string) => void }> = ({ onViewPlace }) => {
  useCatalogVersion();
  const cafe = placeService.getMyCafe();
  const [input, setInput] = useState<ListingInput | null>(() => (cafe ? listingFromCafe(cafe) : null));
  const [loadedId, setLoadedId] = useState<string | null>(cafe?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // A listing that arrives after the first render (or a different one) replaces the draft
  useEffect(() => {
    if (cafe && cafe.id !== loadedId) {
      setInput(listingFromCafe(cafe));
      setLoadedId(cafe.id);
    }
  }, [cafe, loadedId]);

  if (!cafe || !input) {
    return (
      <div className={CARD}>
        <p className="text-[15px] text-[#594C3D]">Your listing is loading. If this stays, refresh the page.</p>
      </div>
    );
  }

  const set = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) =>
    setInput((current) => (current ? { ...current, [key]: value } : current));

  const save = async () => {
    const problem = validateListing(input);
    if (problem) {
      setError(problem);
      setSaved(false);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await placeService.updateMyListing(input);
      setSaved(true);
    } catch (cause) {
      setSaved(false);
      setError(cause instanceof Error ? cause.message : 'Could not save the listing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Listing header */}
      <div className="ios-group ios-card-shadow">
        <div className="ios-group-row py-3.5">
          <img src={cafe.logoUrl} alt="" className="h-12 w-12 rounded-[12px] object-cover shrink-0 bg-[#F2EAE0]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="ios-headline text-[#13191F] truncate">{cafe.name}</h2>
              {cafe.verified && <BadgeCheck className="w-4 h-4 shrink-0 text-[#3E5C48]" aria-label="Verified" />}
            </div>
            <p className="ios-footnote text-[#594C3D] truncate">
              {cafe.district}, {cafe.city}
              {' · '}
              <span className="font-mono">{cafe.saveCount}</span> saves
            </p>
          </div>
          <button
            onClick={() => onViewPlace(cafe.id)}
            className="min-h-11 inline-flex items-center gap-1 text-[14px] font-semibold text-[#7D5C3D] ios-press"
          >
            <ExternalLink className="w-4 h-4" />
            View
          </button>
        </div>
      </div>

      <div className={`${CARD} space-y-5`}>
        <div className="space-y-3">
          <Field label="Name">
            <TextInput value={input.name} onChange={(value) => set('name', value)} />
          </Field>
          <Field label="Signature drink" hint="Shown on cards: the one thing to order.">
            <TextInput value={input.signature} onChange={(value) => set('signature', value)} placeholder="e.g. Mt. Apo pour over" />
          </Field>
          <Field label="About" hint={`${input.description.length} of ${LISTING_LIMITS.description}`}>
            <TextArea value={input.description} onChange={(value) => set('description', value)} rows={4} maxLength={LISTING_LIMITS.description} />
          </Field>
          <label className="flex items-center gap-3 rounded-[14px] ios-fill px-3.5 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={input.isRoastery}
              onChange={(event) => set('isRoastery', event.target.checked)}
              className="accent-[#906D4B] h-5 w-5 shrink-0"
            />
            <span className="text-[14px] text-[#13191F]">We roast our own beans</span>
          </label>
        </div>

        <div className="space-y-3">
          <p className={GROUP_LABEL}>Where</p>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
            <Field label="City">
              <SelectInput
                value={input.city}
                onChange={(value) => set('city', value as ListingInput['city'])}
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
          <Field label="Street address">
            <TextInput value={input.address} onChange={(value) => set('address', value)} />
          </Field>
          <LocationPicker lat={input.lat} lng={input.lng} onChange={(point) => setInput((current) => (current ? { ...current, ...point } : current))} />
        </div>

        <fieldset className="space-y-2">
          <legend className={GROUP_LABEL}>Hours</legend>
          <HoursEditor value={input.hours} onChange={(hours) => set('hours', hours)} />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className={GROUP_LABEL}>Amenities</legend>
          <div className="flex flex-wrap gap-2">
            {LISTING_AMENITIES.map((amenity) => (
              <Chip
                key={amenity}
                label={AMENITY_LABELS[amenity]}
                active={input.amenities.includes(amenity)}
                onClick={() => set('amenities', toggle<AmenityKey>(input.amenities, amenity))}
              />
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
          <Field label="Wi-Fi speed (Mbps)" hint="0 when unknown">
            <TextInput
              value={String(input.wifiMbps)}
              onChange={(value) => set('wifiMbps', Math.max(0, Math.floor(Number(value) || 0)))}
              type="number"
              min={0}
              max={LISTING_LIMITS.wifiMbps}
            />
          </Field>
          <fieldset className="space-y-1.5">
            <legend className={GROUP_LABEL}>Price range</legend>
            <div className="flex flex-wrap gap-2 pt-1" role="radiogroup" aria-label="Price range">
              {PRICE_OPTIONS.map((option) => (
                <Chip key={option.value} label={option.label} active={input.priceLevel === option.value} onClick={() => set('priceLevel', option.value)} />
              ))}
            </div>
          </fieldset>
        </div>

        <fieldset className="space-y-2">
          <legend className={GROUP_LABEL}>Brew methods</legend>
          <div className="flex flex-wrap gap-2">
            {BREW_METHODS.map((method) => (
              <Chip
                key={method}
                label={method}
                active={input.brewMethods.includes(method)}
                onClick={() => set('brewMethods', toggle<BrewMethod>(input.brewMethods, method))}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className={GROUP_LABEL}>Menu</legend>
          <MenuEditor value={input.menu} onChange={(menu) => set('menu', menu)} />
        </fieldset>

        {error && <ErrorNote message={error} />}
        {saved && !error && (
          <p role="status" className="ios-footnote text-[#3E5C48] bg-[#3E5C48]/10 rounded-[12px] px-3.5 py-2.5">
            Saved. Your listing is updated for everyone.
          </p>
        )}
        <PrimaryButton onClick={() => void save()} disabled={busy} className="w-full">
          {busy ? 'Saving' : 'Save listing'}
        </PrimaryButton>
        <p className="ios-footnote text-[#594C3D]">
          Photos are not collected yet; your listing shows a placeholder until photo uploads are added.
        </p>
      </div>
    </div>
  );
};

/** Place Portal: apply to list a cafe or study spot, follow the review, then manage the live listing. */
export const PlacePortalView: React.FC<PlacePortalViewProps> = ({ onOpenLogin, onViewPlace, onBrowse }) => {
  useSessionVersion();
  usePlaceVersion();
  const [justSent, setJustSent] = useState(false);
  const [reapplying, setReapplying] = useState(false);

  const user = sessionService.getUser();
  const owner = sessionService.isPlaceOwner();
  const application = placeService.getMyApplication();

  // Approval happens on another device; pick it up when the portal opens
  useEffect(() => {
    if (!user) return;
    void sessionService.refreshProfile();
    void placeService.refresh();
  }, [user?.id]);

  const body = () => {
    if (!placeService.isAvailable()) {
      return (
        <div className={CARD}>
          <p className="text-[15px] text-[#594C3D]">The Place Portal is not available right now. Please check back soon.</p>
        </div>
      );
    }
    if (!user) {
      return (
        <div className={`${CARD} space-y-4`}>
          <Pitch />
          <PrimaryButton onClick={onOpenLogin} className="w-full">
            <span className="inline-flex items-center gap-1.5">
              <LogIn className="w-4 h-4" />
              Sign in to apply
            </span>
          </PrimaryButton>
        </div>
      );
    }
    if (owner) return <ListingEditor onViewPlace={onViewPlace} />;
    if (justSent) {
      return (
        <div className={`${CARD} flex items-center gap-3`} role="status">
          <AyaMascot pose="welcome" size={64} alt="" />
          <p className="text-[15px] text-[#13191F]">Thank you. Haraya will check the permit number and email you once the listing is live.</p>
        </div>
      );
    }
    if (application && application.status !== 'approved' && !reapplying) {
      return <ApplicationStatus application={application} onApplyAgain={() => setReapplying(true)} />;
    }
    return (
      <>
        {!application && (
          <div className={CARD}>
            <Pitch />
          </div>
        )}
        <ApplicationForm
          onSubmitted={() => {
            setJustSent(true);
            setReapplying(false);
          }}
        />
      </>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-8 sm:pt-4 space-y-5">
      <LargeTitle
        title="Place Portal"
        subtitle={owner ? 'Keep your listing current.' : 'List your cafe, roastery or study spot on Haraya.'}
        trailing={<AyaMascot pose="holding-cup" size={72} alt="" />}
      />

      {user && (
        <p className="ios-footnote text-[#594C3D] px-1 truncate">
          Signed in as <span className="text-[#13191F] font-medium">{user.email}</span>
        </p>
      )}

      {placeService.getLoadError() && <ErrorNote message={placeService.getLoadError() ?? ''} />}

      {body()}

      {!owner && (
        <button
          onClick={onBrowse}
          className="h-11 flex items-center justify-center gap-1.5 mx-auto px-3 text-[15px] font-medium font-sans text-[#7D5C3D] ios-press"
        >
          <Store className="w-4 h-4" />
          Keep browsing
        </button>
      )}
    </div>
  );
};
