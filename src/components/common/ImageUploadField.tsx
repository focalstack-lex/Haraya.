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
    // Clear the input so choosing the same file again (after Remove or an error) still fires change
    event.target.value = '';
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
      <span className="block px-1 text-[13px] font-medium text-ink-2 font-sans">{label}</span>
      <input ref={inputRef} type="file" accept="image/*" onChange={pick} className="hidden" />

      {value ? (
        <div className={`relative rounded-row overflow-hidden bg-ink ${aspect === 'square' ? 'aspect-square w-32' : 'aspect-video w-full'}`}>
          <img src={value} alt={`${label} preview`} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Remove ${label}`}
            className="absolute top-0 right-0 h-11 w-11 flex items-center justify-center ios-press"
          >
            <span className="h-7.5 w-7.5 rounded-full ios-material-dark text-surface flex items-center justify-center">
              <X className="w-4 h-4" strokeWidth={2.5} />
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full rounded-row ios-fill hover:bg-shade/20 text-tint-ink font-sans flex flex-col items-center justify-center gap-1.5 ios-press ${
            aspect === 'wide' ? 'h-28' : 'h-24'
          }`}
        >
          <ImagePlus className="w-5.5 h-5.5 text-tint" />
          <span className="text-[15px] font-semibold">Attach photo</span>
        </button>
      )}

      {hint && !error && <span className="block px-1 ios-footnote text-ink-2">{hint}</span>}
      {error && (
        <span role="alert" className="block px-1 ios-footnote text-danger">
          {error}
        </span>
      )}
    </div>
  );
};
