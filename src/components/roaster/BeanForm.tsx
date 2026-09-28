import React, { useEffect, useState } from 'react';
import type { Bean, Cafe, Process, RoastLevel } from '../../types/coffee';
import { catalogService } from '../../services/catalogService';
import { Modal, ModalHeader, Field, TextInput, TextArea, SelectInput, PrimaryButton, ErrorNote } from '../common/FormControls';
import { ImageUploadField } from '../common/ImageUploadField';

const PROCESSES: Process[] = ['Washed', 'Natural', 'Honey', 'Anaerobic Natural', 'Wet-Hulled'];
const ROAST_LEVELS: RoastLevel[] = ['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'];
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1000&q=80';

interface BeanFormProps {
  isOpen: boolean;
  roaster: Cafe;
  /** Existing bean to edit; null creates a new lot. */
  bean: Bean | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Inventory form for roaster-owned bean lots. Seeded records stay read-only. */
export const BeanForm: React.FC<BeanFormProps> = ({ isOpen, roaster, bean, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [farm, setFarm] = useState('');
  const [varietal, setVarietal] = useState('');
  const [process, setProcess] = useState<Process>('Washed');
  const [altitude, setAltitude] = useState('1200');
  const [tastingNotes, setTastingNotes] = useState('');
  const [roastLevel, setRoastLevel] = useState<RoastLevel>('Medium');
  const [acidity, setAcidity] = useState('3');
  const [body, setBody] = useState('3');
  const [sweetness, setSweetness] = useState('3');
  const [suggestedBrew, setSuggestedBrew] = useState(`V60, 1:16, 92C`);
  const [price, setPrice] = useState('420');
  const [dripPackPrice, setDripPackPrice] = useState('');
  const [bagsInStock, setBagsInStock] = useState('30');
  const [isLimited, setIsLimited] = useState(false);
  const [singleOrigin, setSingleOrigin] = useState(true);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(bean?.name ?? '');
    setOrigin(bean?.origin ?? `${roaster.district}, ${roaster.city}`);
    setFarm(bean?.farm ?? '');
    setVarietal(bean?.varietal ?? '');
    setProcess(bean?.process ?? 'Washed');
    setAltitude(String(bean?.altitudeMasl ?? 1200));
    setTastingNotes(bean?.tastingNotes.join(', ') ?? '');
    setRoastLevel(bean?.roastProfile.roastLevel ?? 'Medium');
    setAcidity(String(bean?.roastProfile.acidity ?? 3));
    setBody(String(bean?.roastProfile.body ?? 3));
    setSweetness(String(bean?.roastProfile.sweetness ?? 3));
    setSuggestedBrew(bean?.roastProfile.suggestedBrew ?? 'V60, 1:16, 92C');
    setPrice(String(bean?.price ?? 420));
    setDripPackPrice(bean?.dripPackPrice !== null && bean ? String(bean.dripPackPrice) : '');
    setBagsInStock(String(bean?.bagsInStock ?? 30));
    setIsLimited(bean?.isLimited ?? false);
    setSingleOrigin(bean?.singleOrigin ?? true);
    setDescription(bean?.description ?? '');
    setImage(bean?.images[0] ?? null);
    setError('');
  }, [isOpen, bean, roaster]);

  const clampScale = (raw: string): 1 | 2 | 3 | 4 | 5 => {
    const value = Math.min(5, Math.max(1, Math.round(Number(raw) || 3)));
    return value as 1 | 2 | 3 | 4 | 5;
  };

  const submit = () => {
    setError('');
    try {
      const notes = tastingNotes
        .split(',')
        .map((note) => note.trim())
        .filter(Boolean)
        .slice(0, 6);
      if (!name.trim()) throw new Error('Lot name is required.');
      if (!origin.trim()) throw new Error('Origin is required.');
      if (notes.length === 0) throw new Error('Add at least one tasting note, comma separated.');
      const priceValue = Number(price);
      if (!Number.isFinite(priceValue) || priceValue < 50) throw new Error('Price must be at least P50.');
      const stockValue = Number(bagsInStock);
      if (!Number.isInteger(stockValue) || stockValue < 0) throw new Error('Bags in stock must be 0 or more.');
      const altitudeValue = Math.max(100, Math.round(Number(altitude) || 1200));
      const drip = dripPackPrice.trim() ? Number(dripPackPrice) : null;
      if (drip !== null && (!Number.isFinite(drip) || drip < 20)) throw new Error('Drip pack price must be at least P20.');

      const payload = {
        name: name.trim(),
        origin: origin.trim(),
        farm: farm.trim() || origin.trim(),
        varietal: varietal.trim() || 'Typica',
        process,
        altitudeMasl: altitudeValue,
        tastingNotes: notes,
        roastProfile: {
          roastLevel,
          acidity: clampScale(acidity),
          body: clampScale(body),
          sweetness: clampScale(sweetness),
          suggestedBrew: suggestedBrew.trim() || 'V60, 1:16, 92C',
        },
        price: Math.round(priceValue),
        dripPackPrice: drip === null ? null : Math.round(drip),
        bagsInStock: stockValue,
        images: [image ?? FALLBACK_IMAGE],
        description: description.trim() || `Fresh lot from ${roaster.name}.`,
        isLimited,
        singleOrigin,
      };

      if (bean) {
        catalogService.updateBean(bean.id, payload);
      } else {
        catalogService.createBean({ ...payload, roasterId: roaster.id, roasterName: roaster.name });
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the bean lot.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm:max-w-lg" labelledBy="bean-form-title">
      <ModalHeader
        title={bean ? `Edit ${bean.name}` : 'Publish a Bean Lot'}
        subtitle={bean ? 'Inventory and profile edits' : `${roaster.name} : new 250g bag on the shelf`}
        onClose={onClose}
      />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lot Name">
            <TextInput value={name} onChange={setName} placeholder="Mt. Talomo Honey Catimor" />
          </Field>
          <Field label="Origin">
            <TextInput value={origin} onChange={setOrigin} placeholder="Mt. Talomo, Davao City" />
          </Field>
          <Field label="Farm">
            <TextInput value={farm} onChange={setFarm} placeholder="Talomo Ridge Parcels" />
          </Field>
          <Field label="Varietal">
            <TextInput value={varietal} onChange={setVarietal} placeholder="Typica" />
          </Field>
          <Field label="Process">
            <SelectInput
              value={process}
              onChange={(value) => setProcess(value as Process)}
              options={PROCESSES.map((entry) => ({ value: entry, label: entry }))}
            />
          </Field>
          <Field label="Altitude (masl)">
            <TextInput value={altitude} onChange={setAltitude} type="number" />
          </Field>
        </div>

        <Field label="Tasting Notes" hint="Comma separated, up to 6">
          <TextInput value={tastingNotes} onChange={setTastingNotes} placeholder="Jasmine, Wild Honey, Dark Cacao" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Roast Level">
            <SelectInput
              value={roastLevel}
              onChange={(value) => setRoastLevel(value as RoastLevel)}
              options={ROAST_LEVELS.map((entry) => ({ value: entry, label: entry }))}
            />
          </Field>
          <Field label="Suggested Brew">
            <TextInput value={suggestedBrew} onChange={setSuggestedBrew} placeholder="V60, 1:16, 92C" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Acidity 1-5">
            <TextInput value={acidity} onChange={setAcidity} type="number" min={1} max={5} />
          </Field>
          <Field label="Body 1-5">
            <TextInput value={body} onChange={setBody} type="number" min={1} max={5} />
          </Field>
          <Field label="Sweet 1-5">
            <TextInput value={sweetness} onChange={setSweetness} type="number" min={1} max={5} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Price 250g">
            <TextInput value={price} onChange={setPrice} type="number" />
          </Field>
          <Field label="Drip Pack Price" hint="Optional">
            <TextInput value={dripPackPrice} onChange={setDripPackPrice} type="number" />
          </Field>
          <Field label="Bags in Stock">
            <TextInput value={bagsInStock} onChange={setBagsInStock} type="number" />
          </Field>
        </div>

        <div className="flex gap-5">
          <label className="inline-flex items-center gap-2 text-xs font-sans font-semibold text-[#13191F]">
            <input type="checkbox" checked={isLimited} onChange={(event) => setIsLimited(event.target.checked)} className="accent-[#906D4B] h-4 w-4" />
            Limited micro-lot
          </label>
          <label className="inline-flex items-center gap-2 text-xs font-sans font-semibold text-[#13191F]">
            <input type="checkbox" checked={singleOrigin} onChange={(event) => setSingleOrigin(event.target.checked)} className="accent-[#906D4B] h-4 w-4" />
            Single origin
          </label>
        </div>

        <Field label="Description">
          <TextArea value={description} onChange={setDescription} rows={3} maxLength={400} placeholder="Where the cherry comes from and how it cups." />
        </Field>

        <ImageUploadField
          label="Bag or Bean Photo (optional)"
          hint="Falls back to the Haraya bean shelf photo when empty."
          value={image}
          onChange={setImage}
          aspect="wide"
        />

        {error && <ErrorNote message={error} />}

        <PrimaryButton onClick={submit} className="w-full">
          {bean ? 'Save Changes' : 'Publish to Bean Shelf'}
        </PrimaryButton>

        <p className="text-[10px] font-sans text-[#594C3D] leading-relaxed">
          Published lots appear instantly in Fresh Beans, the roastery storefront, and the drop calendar.
        </p>
      </div>
    </Modal>
  );
};
