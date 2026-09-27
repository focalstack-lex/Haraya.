import React, { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import type { BrewMethod, CupPost, FlavorPin } from '../../types/coffee';
import { BREW_METHODS } from '../../types/coffee';
import { communityService } from '../../services/communityService';
import { Modal, ModalHeader, Field, TextArea, SelectInput, PrimaryButton, ErrorNote } from '../common/FormControls';
import { FlavorPinPlacer } from './FlavorPinPlacer';

interface NewPostSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cafes: { id: string; name: string }[];
  onPosted: (post: CupPost) => void;
  author: string;
  authorHandle: string;
}

/** Compose a Cup Check: photo, caption, cafe tag, brew method, and flavor pins. */
export const NewPostSheet: React.FC<NewPostSheetProps> = ({ isOpen, onClose, cafes, onPosted, author, authorHandle }) => {
  const [caption, setCaption] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [cafeId, setCafeId] = useState('');
  const [brewMethod, setBrewMethod] = useState('');
  const [pins, setPins] = useState<FlavorPin[]>([]);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setCaption('');
    setImageData(null);
    setCafeId('');
    setBrewMethod('');
    setPins([]);
    setError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const pickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image. Attach a JPG or PNG photo of your cup.');
      return;
    }
    if (file.size > 2_500_000) {
      setError('Keep the photo under 2.5 MB so the post loads fast on mobile data.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageData(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => setError('Could not read that file. Try another photo.');
    reader.readAsDataURL(file);
    setError('');
  };

  const submit = () => {
    try {
      const post = communityService.createPost({
        author,
        authorHandle,
        cafeId: cafeId || null,
        caption,
        image: imageData ?? '',
        pins,
        brewMethod: (brewMethod || null) as BrewMethod | null,
      });
      reset();
      onPosted(post);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not post. Check the fields and try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} maxWidth="sm:max-w-lg" labelledBy="new-post-title">
      <ModalHeader title="New Cup Check" subtitle="Post today's brew and pin what it tastes like" onClose={close} />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full h-11 rounded-xl bg-[#F3ECD8] border border-[#E6DCC0] text-xs font-bold font-sans text-[#1A2225] inline-flex items-center justify-center gap-2 hover:bg-[#E6DCC0] transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          {imageData ? 'Replace Cup Photo' : 'Attach Cup Photo'}
        </button>

        <FlavorPinPlacer image={imageData} pins={pins} onChange={setPins} />

        <Field label="Caption">
          <TextArea value={caption} onChange={setCaption} rows={3} maxLength={280} placeholder="Cup Check: what are you drinking and where?" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cafe (optional)">
            <SelectInput
              value={cafeId}
              onChange={setCafeId}
              options={[{ value: '', label: 'Home brew' }, ...cafes.map((cafe) => ({ value: cafe.id, label: cafe.name }))]}
            />
          </Field>
          <Field label="Brew Method (optional)">
            <SelectInput
              value={brewMethod}
              onChange={setBrewMethod}
              options={[{ value: '', label: 'Not tagged' }, ...BREW_METHODS.map((method) => ({ value: method, label: method }))]}
            />
          </Field>
        </div>

        {error && <ErrorNote message={error} />}

        <PrimaryButton onClick={submit} className="w-full">
          Post Cup Check
        </PrimaryButton>
      </div>
    </Modal>
  );
};
