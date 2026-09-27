import React, { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  /** Square crops read better for IDs and permits. */
  aspect?: 'square' | 'wide';
}

/** File input that stores the image as a dataURL with type and size validation. */
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ label, hint, value, onChange, aspect = 'square' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState('');

  const pick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files (JPG, PNG) are accepted.');
      return;
    }
    if (file.size > 3_000_000) {
      setError('Keep documents under 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
        setError('');
      }
    };
    reader.onerror = () => setError('Could not read that file. Try again.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#55615D] font-sans">{label}</span>
      <input ref={inputRef} type="file" accept="image/*" onChange={pick} className="hidden" />

      {value ? (
        <div className={`relative rounded-xl overflow-hidden border border-[#E6DCC0] ${aspect === 'square' ? 'aspect-square w-32' : 'aspect-video w-full'}`}>
          <img src={value} alt={`${label} preview`} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Remove ${label}`}
            className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-[#1A2225]/80 text-[#FFF9E9] flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-11 rounded-xl bg-[#F3ECD8] border border-dashed border-[#E6DCC0] text-xs font-bold font-sans text-[#1A2225] inline-flex items-center justify-center gap-2 hover:bg-[#E6DCC0] transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          Attach Photo
        </button>
      )}

      {hint && !error && <span className="block text-[10px] font-sans text-[#55615D]">{hint}</span>}
      {error && <span className="block text-[10px] font-sans text-[#8C3A2E]">{error}</span>}
    </div>
  );
};
