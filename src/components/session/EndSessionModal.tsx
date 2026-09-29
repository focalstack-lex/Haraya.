import React, { useEffect, useState } from 'react';
import { Globe2, Lock } from 'lucide-react';
import { Modal, ModalHeader, Field, TextInput, TextArea, PrimaryButton, Chip, ErrorNote } from '../common/FormControls';
import { AyaMascot } from '../common/AyaMascot';
import {
  elapsedMinutes,
  focusSessionStore,
  sessionToVisitInput,
  useActiveFocusSession,
} from '../../hooks/useFocusSession';
import { visitService } from '../../services/visitService';
import { sessionService } from '../../services/sessionService';
import {
  formatDuration,
  NOISE_LEVELS,
  OUTLET_STATUSES,
  VISIT_LIMITS,
  type NoiseLevel,
  type OutletsStatus,
} from '../../services/visitMapping';

interface EndSessionModalProps {
  isOpen: boolean;
  /** Closes the sheet; the session keeps running. */
  onClose: () => void;
  /** Toast text once the session is saved or discarded. */
  onDone: (message: string) => void;
}

const DRINK_SHORTCUTS = ['Latte', 'Americano', 'Pour-over', 'Cold Brew'];

/** A small segmented control: one choice, or none until tapped. */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block px-1 text-[13px] font-medium text-ink-2" id={`seg-${label}`}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={`seg-${label}`} className="flex p-0.5 rounded-[10px] ios-fill">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`flex-1 min-h-10 px-2 rounded-[8px] text-[14px] font-semibold transition-colors ${
                selected ? 'bg-surface text-ink shadow-[0_1px_4px_rgba(19,25,31,0.14)]' : 'text-ink-2'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Finishing a Deep Focus Session: the time is frozen when the sheet opens, then the visitor adds the drink,
 * a noise check, the outlet situation, an optional note and who can see it, and saves it to the passport.
 * Aya is content here: the work is done. Sessions under 5 minutes can only be ended, not logged.
 */
export const EndSessionModal: React.FC<EndSessionModalProps> = ({ isOpen, onClose, onDone }) => {
  const session = useActiveFocusSession();
  const [minutes, setMinutes] = useState(0);
  const [drink, setDrink] = useState('');
  const [noise, setNoise] = useState<NoiseLevel | null>(null);
  const [outlets, setOutlets] = useState<OutletsStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const signedIn = Boolean(sessionService.getUser());

  useEffect(() => {
    if (!isOpen || !session) return;
    setMinutes(elapsedMinutes(session.startedAt));
    setDrink('');
    setNoise(null);
    setOutlets(null);
    setNotes('');
    setIsPublic(signedIn && visitService.isPassportPublic());
    setError(null);
    setConfirmDiscard(false);
  }, [isOpen, session, signedIn]);

  if (!session) return null;
  const tooShort = minutes < VISIT_LIMITS.minMinutes;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { synced } = await visitService.recordVisit(
        sessionToVisitInput(session, minutes, { drinkOrdered: drink, noiseLevel: noise, outletsStatus: outlets, notes, isPublic })
      );
      focusSessionStore.clear();
      onDone(`Saved to your passport: ${formatDuration(minutes)} at ${session.cafeName}${synced ? '' : ' (on this device)'}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the session.');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    focusSessionStore.clear();
    onDone(`Session at ${session.cafeName} ended without saving.`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm:max-w-md" labelledBy="end-session-title">
      <ModalHeader title="Finish session" subtitle={session.cafeName} onClose={onClose} />
      <div className="px-4 sm:px-6 pb-4 pt-3 space-y-5">
        <div className="flex items-center gap-3">
          <AyaMascot pose="content" size={96} alt="" className="-my-2" />
          <div className="min-w-0">
            <p className="ios-footnote text-ink-2">You focused for</p>
            <p className="font-mono text-[30px] font-bold leading-tight text-ink">{formatDuration(minutes)}</p>
            {tooShort && (
              <p className="ios-footnote text-danger">Sessions under {VISIT_LIMITS.minMinutes} minutes are not logged.</p>
            )}
          </div>
        </div>

        {!tooShort && (
          <>
            <div className="space-y-2">
              <Field label="What did you order?">
                <TextInput value={drink} onChange={(value) => setDrink(value.slice(0, VISIT_LIMITS.drink))} placeholder="Optional" />
              </Field>
              <div className="flex flex-wrap gap-1.5" aria-label="Drink shortcuts">
                {DRINK_SHORTCUTS.map((name) => (
                  <Chip key={name} label={name} active={drink === name} onClick={() => setDrink(drink === name ? '' : name)} />
                ))}
              </div>
            </div>

            <Segmented label="Noise check" options={NOISE_LEVELS} value={noise} onChange={setNoise} />
            <Segmented label="Power outlets" options={OUTLET_STATUSES} value={outlets} onChange={setOutlets} />

            <Field label="Notes" hint={`${notes.length} of ${VISIT_LIMITS.notes}`}>
              <TextArea value={notes} onChange={setNotes} maxLength={VISIT_LIMITS.notes} placeholder="Where the good seat is, what you worked on" />
            </Field>

            {signedIn ? (
              <Segmented
                label="Who can see this session"
                options={[
                  { id: 'public', label: 'Public session' },
                  { id: 'private', label: 'Only me' },
                ]}
                value={isPublic ? 'public' : 'private'}
                onChange={(value) => setIsPublic(value === 'public')}
              />
            ) : (
              <p className="ios-footnote text-ink-2">Signed out, this session stays on this device.</p>
            )}
            {signedIn && (
              <p className="ios-footnote text-ink-2 inline-flex items-start gap-1.5">
                {isPublic ? <Globe2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                {isPublic
                  ? visitService.isPassportPublic()
                    ? 'Shown on the spot page, where others can send a Cup Clink.'
                    : 'Your passport is private, so this stays hidden until you make it public.'
                  : 'Only you will see it in your diary.'}
              </p>
            )}
          </>
        )}

        {error && <ErrorNote message={error} />}

        <div className="flex flex-col gap-2">
          {!tooShort && (
            <PrimaryButton onClick={save} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save to Passport'}
            </PrimaryButton>
          )}
          <button
            type="button"
            onClick={discard}
            className={`h-11 px-5 rounded-full text-[15px] font-semibold ios-press ${
              confirmDiscard ? 'bg-danger text-surface' : 'text-danger hover:bg-danger/10'
            }`}
          >
            {confirmDiscard ? 'Tap again to end without saving' : tooShort ? 'End session' : 'End without saving'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
