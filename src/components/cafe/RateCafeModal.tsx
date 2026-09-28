import React, { useState, useEffect } from 'react';
import { Star, Trash2 } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import { Modal, ModalHeader, Field, TextArea, PrimaryButton, SecondaryButton } from '../common/FormControls';
import { userPrefsService } from '../../services/userPrefsService';

interface RateCafeModalProps {
  cafe: Cafe | null;
  isOpen: boolean;
  onClose: () => void;
  onRated?: () => void;
}

const RATING_LABELS = [
  'Select a rating',
  'Fair cup',
  'Good pour',
  'Very good brew',
  'Excellent specialty',
  'Exceptional, world-class',
];

export const RateCafeModal: React.FC<RateCafeModalProps> = ({ cafe, isOpen, onClose, onRated }) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (cafe && isOpen) {
      const existing = userPrefsService.getRating(cafe.id);
      if (existing) {
        setRating(existing.rating);
        setNote(existing.note ?? '');
      } else {
        setRating(5);
        setNote('');
      }
    }
  }, [cafe, isOpen]);

  if (!cafe) return null;

  const handleSave = () => {
    userPrefsService.setRating(cafe.id, rating, note);
    onRated?.();
    onClose();
  };

  const handleRemove = () => {
    userPrefsService.removeRating(cafe.id);
    onRated?.();
    onClose();
  };

  const currentDisplayRating = hoverRating ?? rating;
  const isExisting = Boolean(userPrefsService.getRating(cafe.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm:max-w-md" labelledBy="rate-cafe-title">
      <ModalHeader
        title={`Rate ${cafe.name}`}
        subtitle={`${cafe.district}, ${cafe.city}`}
        onClose={onClose}
      />

      <div className="px-4 sm:px-6 py-4 space-y-5">
        {/* Rating stars: 44px targets */}
        <div className="text-center space-y-1 py-1">
          <div className="flex items-center justify-center" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= currentDisplayRating;
              return (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={star === rating}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  aria-label={`Rate ${star} of 5`}
                  className="h-11 w-11 flex items-center justify-center rounded-full ios-press"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      active ? 'text-[#CA9C68] fill-[#CA9C68]' : 'text-[#6E6150]/50'
                    }`}
                    strokeWidth={1.75}
                  />
                </button>
              );
            })}
          </div>
          <p className="text-[15px] font-sans font-semibold text-[#13191F]" aria-live="polite">
            {RATING_LABELS[currentDisplayRating]}
          </p>
        </div>

        {/* Tasting note */}
        <Field label="Personal tasting note (optional)">
          <TextArea
            value={note}
            onChange={setNote}
            rows={3}
            placeholder="e.g. Excellent Mt. Apo V60 pour over. Quiet atmosphere with great natural light."
          />
        </Field>

        {/* Actions */}
        <div className="space-y-2">
          <PrimaryButton onClick={handleSave} className="w-full">
            Save rating
          </PrimaryButton>
          <div className={`grid gap-2 ${isExisting ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {isExisting && (
              <button
                type="button"
                onClick={handleRemove}
                className="h-11 px-3 rounded-full ios-fill text-[15px] font-semibold font-sans text-[#8C3A2E] hover:bg-[#766046]/20 inline-flex items-center justify-center gap-2 ios-press"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
            <SecondaryButton onClick={onClose} className="px-3">
              Cancel
            </SecondaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
};
