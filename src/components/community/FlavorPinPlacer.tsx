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

  const removePin = (pinId: string) => onChange(pins.filter((candidate) => candidate.id !== pinId));

  return (
    <div className="space-y-2">
      <span className="block px-1 text-[13px] font-medium text-[#594C3D] font-sans">Tasting pins</span>

      {image ? (
        <div
          onClick={placePin}
          role="button"
          aria-label="Tap the photo to add a tasting pin"
          className="relative w-full aspect-[4/5] rounded-[20px] overflow-hidden bg-[#13191F] cursor-crosshair"
        >
          <img src={image} alt="Upload preview" className="w-full h-full object-cover" />
          {pins.map((pin) => (
            <span
              key={pin.id}
              className={`flavor-pin absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 h-7 pl-2.5 rounded-full text-[11px] font-semibold font-sans text-[#FFFDF9] whitespace-nowrap ${
                namingPinId === pin.id ? 'bg-[#906D4B]' : 'ios-material-dark'
              }`}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFFDF9]" aria-hidden="true" />
              {pin.label}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removePin(pin.id);
                }}
                aria-label={`Remove pin ${pin.label}`}
                className="h-7 w-7 flex items-center justify-center opacity-80 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {pins.length === 0 && (
            <span className="absolute inset-x-0 bottom-3 mx-auto w-max max-w-[90%] px-3 py-1.5 rounded-full ios-material-dark text-[#FFFDF9] ios-footnote font-medium">
              Tap the photo to pin a flavor note
            </span>
          )}
        </div>
      ) : (
        <p className="px-1 ios-footnote text-[#594C3D]">Attach a cup photo first, then tap it to pin flavor notes.</p>
      )}

      {pins.length > 0 && (
        <div className="space-y-1.5">
          <ul className="ios-group !bg-[#766046]/[0.07]">
            {pins.map((pin) => (
              <li key={pin.id} className="flex items-center gap-2 pl-3.5 pr-0.5 min-h-11">
                <span className="shrink-0 w-16 ios-footnote font-mono text-[#594C3D]">
                  {pin.x}%, {pin.y}%
                </span>
                <input
                  value={pin.label}
                  onChange={(event) =>
                    onChange(pins.map((candidate) => (candidate.id === pin.id ? { ...candidate, label: event.target.value } : candidate)))
                  }
                  onFocus={() => setNamingPinId(pin.id)}
                  aria-label={`Name pin at ${pin.x}%, ${pin.y}%`}
                  className="flex-1 min-w-0 h-11 bg-transparent text-[15px] font-sans text-[#13191F] placeholder:text-[#6E6150] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removePin(pin.id)}
                  aria-label={`Remove pin ${pin.label}`}
                  className="h-11 w-11 shrink-0 flex items-center justify-center ios-press"
                >
                  <span className="h-6 w-6 rounded-full bg-[#766046]/15 flex items-center justify-center text-[#594C3D]">
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="px-1 ios-footnote text-[#594C3D] inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 shrink-0" />
            Suggestions: {SUGGESTED_NOTES.slice(0, 4).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};
