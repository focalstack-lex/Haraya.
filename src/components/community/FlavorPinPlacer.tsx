import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { FlavorPin } from '../../types/coffee';

const SUGGESTED_NOTES = [
  'Jasmine',
  'Wild Honey',
  'Dark Cacao',
  'Citrus Bergamot',
  'Muscovado',
  'Caramel',
  'Jackfruit',
  'Calamansi',
  'White Peach',
  'Toasted Cashew',
];

interface FlavorPinPlacerProps {
  image: string | null;
  pins: FlavorPin[];
  onChange: (pins: FlavorPin[]) => void;
}

/**
 * Tap the uploaded photo to drop tasting-tag pins, then name each pin. Pins
 * store percentage coordinates so they float over the photo at any size.
 */
export const FlavorPinPlacer: React.FC<FlavorPinPlacerProps> = ({ image, pins, onChange }) => {
  const [namingPinId, setNamingPinId] = useState<string | null>(null);

  const placePin = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!image) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const pin: FlavorPin = {
      id: `pin-${Date.now().toString(36)}`,
      label: SUGGESTED_NOTES[pins.length % SUGGESTED_NOTES.length],
      x: Math.round(x),
      y: Math.round(y),
    };
    onChange([...pins, pin]);
    setNamingPinId(pin.id);
  };

  return (
    <div className="space-y-2">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">
        Tasting Tag Pins
      </span>

      <div
        onClick={placePin}
        role="button"
        aria-label="Tap the photo to add a tasting pin"
        className={`relative w-full aspect-[4/5] rounded-2xl overflow-hidden border-2 border-dashed ${
          image ? 'border-[#E6DCC0] cursor-crosshair' : 'border-[#E6DCC0] bg-[#F3ECD8] cursor-default'
        }`}
      >
        {image ? (
          <>
            <img src={image} alt="Upload preview" className="w-full h-full object-cover" />
            {pins.map((pin) => (
              <span
                key={pin.id}
                className={`flavor-pin absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[10px] font-bold font-sans whitespace-nowrap ${
                  namingPinId === pin.id
                    ? 'bg-[#C86428] border-[#C86428] text-[#FFF9E9]'
                    : 'bg-[#1A2225]/85 border-[#FFF9E9]/30 text-[#FFF9E9]'
                }`}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFF9E9]" />
                {pin.label}
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange(pins.filter((candidate) => candidate.id !== pin.id));
                  }}
                  aria-label={`Remove pin ${pin.label}`}
                  className="ml-0.5 opacity-70 hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {pins.length === 0 && (
              <span className="absolute inset-x-0 bottom-3 mx-auto w-max px-3 py-1.5 rounded-full bg-[#1A2225]/75 text-[#FFF9E9] text-[10px] font-bold font-sans">
                Tap the photo to pin a flavor note
              </span>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-sans text-[#55615D]">
            Attach a cup photo first
          </div>
        )}
      </div>

      {pins.length > 0 && (
        <div className="space-y-1.5">
          {pins.map((pin) => (
            <div key={pin.id} className="flex items-center gap-2">
              <span className="text-[10px] font-sans text-[#55615D] w-14 tabular-nums">
                {pin.x}% : {pin.y}%
              </span>
              <input
                value={pin.label}
                onChange={(event) =>
                  onChange(pins.map((candidate) => (candidate.id === pin.id ? { ...candidate, label: event.target.value } : candidate)))
                }
                onFocus={() => setNamingPinId(pin.id)}
                aria-label={`Name pin at ${pin.x}%, ${pin.y}%`}
                className="flex-1 h-9 bg-[#F3ECD8] border border-[#E6DCC0] rounded-xl px-3 text-xs font-sans text-[#1A2225] focus:outline-none focus:border-[#55615D]"
              />
            </div>
          ))}
          <p className="text-[10px] font-sans text-[#55615D] inline-flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Suggestions: {SUGGESTED_NOTES.slice(0, 4).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};
