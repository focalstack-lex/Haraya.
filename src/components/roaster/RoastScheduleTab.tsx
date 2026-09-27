import React, { useState } from 'react';
import { CalendarClock, PackageX, Trash2 } from 'lucide-react';
import type { Bean, Cafe, RoastDrop } from '../../types/coffee';
import { catalogService } from '../../services/catalogService';
import { Modal, ModalHeader, Field, TextInput, TextArea, SelectInput, PrimaryButton, ErrorNote } from '../common/FormControls';
import { DropCountdownTimer } from '../drops/DropCountdownTimer';

interface RoastScheduleTabProps {
  roaster: Cafe;
  beans: Bean[];
  drops: RoastDrop[];
}

function defaultDropValue(): string {
  const tomorrow = new Date(Date.now() + 86_400_000);
  tomorrow.setHours(10, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
}

/** Roast scheduling: create batches, watch countdowns, mark sold out. */
export const RoastScheduleTab: React.FC<RoastScheduleTabProps> = ({ roaster, beans, drops }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [beanId, setBeanId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dropAt, setDropAt] = useState(defaultDropValue());
  const [batchBags, setBatchBags] = useState('30');
  const [price, setPrice] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [error, setError] = useState('');

  const selectedBean = beans.find((bean) => bean.id === beanId);

  const openForm = () => {
    setBeanId(beans[0]?.id ?? '');
    setTitle('');
    setDescription('');
    setDropAt(defaultDropValue());
    setBatchBags('30');
    setPrice('');
    setCoverImage(null);
    setError('');
    setIsFormOpen(true);
  };

  const schedule = () => {
    setError('');
    try {
      if (!selectedBean) throw new Error('Pick which bean lot this batch roasts.');
      const when = new Date(dropAt);
      if (Number.isNaN(when.getTime())) throw new Error('Pick a valid drop date and time.');
      if (when.getTime() <= Date.now()) throw new Error('Drop time must be in the future.');
      const bags = Number(batchBags);
      if (!Number.isInteger(bags) || bags < 1 || bags > 500) throw new Error('Batch size must be between 1 and 500 bags.');
      const priceValue = price.trim() ? Number(price) : selectedBean.price;
      if (!Number.isFinite(priceValue) || priceValue < 50) throw new Error('Batch price must be at least P50.');

      catalogService.createDrop({
        roasterId: roaster.id,
        roasterName: roaster.name,
        beanId: selectedBean.id,
        title: title.trim() || `${selectedBean.name}, Fresh Batch`,
        description: description.trim() || `Fresh drum batch of ${selectedBean.name} from ${roaster.name}.`,
        dropAt: when.toISOString(),
        batchBags: bags,
        price: Math.round(priceValue),
        coverImage: coverImage ?? selectedBean.images[0],
      });
      setIsFormOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not schedule the batch.');
    }
  };

  const sellOut = (drop: RoastDrop) => {
    try {
      catalogService.markDropSoldOut(drop.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the batch.');
    }
  };

  const remove = (drop: RoastDrop) => {
    try {
      catalogService.removeDrop(drop.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove the batch.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-cooper text-lg font-bold text-[#1A2225]">Roast Schedule</h2>
        <button
          onClick={openForm}
          disabled={beans.length === 0}
          className="h-10 px-5 rounded-full bg-[#1A2225] text-[#FFF9E9] text-xs font-bold font-sans disabled:opacity-40 inline-flex items-center gap-2 hover:bg-[#26302F] transition-colors"
        >
          <CalendarClock className="w-4 h-4" />
          Schedule Batch
        </button>
      </div>

      {beans.length === 0 && (
        <p className="text-xs font-sans text-[#55615D]">
          Publish a bean lot first: every batch roasts one of your shelf lots.
        </p>
      )}

      {error && <ErrorNote message={error} />}

      <div className="space-y-3">
        {drops.length === 0 && (
          <p className="text-xs font-sans text-[#55615D]">No batches scheduled yet. The drop calendar is empty without them.</p>
        )}
        {drops.map((drop) => {
          const status = catalogService.getDropStatus(drop);
          return (
            <article key={drop.id} className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] p-4 flex flex-wrap items-center gap-3">
              <img src={drop.coverImage} alt="" className="h-14 w-14 rounded-xl object-cover border border-[#E6DCC0]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-sans font-bold text-[#1A2225] truncate">{drop.title}</p>
                <p className="text-[11px] font-sans text-[#55615D]">
                  {new Date(drop.dropAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  : {drop.batchBags} bags at P{drop.price}
                </p>
                <div className="mt-1">
                  <DropCountdownTimer dropAt={drop.dropAt} compact />
                </div>
              </div>
              <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-full font-sans ${
                status === 'live'
                  ? 'bg-[#3E5C48] text-[#FFF9E9]'
                  : status === 'soldOut'
                    ? 'bg-[#F3ECD8] text-[#55615D] border border-[#E6DCC0]'
                    : 'bg-[#C86428]/15 text-[#A34F1E] border border-[#C86428]/40'
              }`}>
                {status === 'live' ? 'LIVE' : status === 'soldOut' ? 'SOLD OUT' : 'SCHEDULED'}
              </span>
              {status !== 'soldOut' && (
                <button
                  onClick={() => sellOut(drop)}
                  className="h-9 px-3.5 rounded-full border border-[#E6DCC0] text-[11px] font-bold font-sans text-[#1A2225] inline-flex items-center gap-1.5 hover:bg-[#F3ECD8] transition-colors"
                >
                  <PackageX className="w-3.5 h-3.5" />
                  Mark Sold Out
                </button>
              )}
              <button
                onClick={() => remove(drop)}
                aria-label={`Remove ${drop.title}`}
                className="h-9 w-9 rounded-full border border-[#E6DCC0] flex items-center justify-center text-[#55615D] hover:text-[#8C3A2E] hover:bg-[#F3ECD8] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </article>
          );
        })}
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="sm:max-w-md" labelledBy="schedule-title">
        <ModalHeader title="Schedule a Roast Batch" subtitle="Goes live on the 14-day drop calendar" onClose={() => setIsFormOpen(false)} />
        <div className="px-4 sm:px-6 py-4 space-y-4">
          <Field label="Bean Lot">
            <SelectInput
              value={beanId}
              onChange={setBeanId}
              options={beans.map((bean) => ({ value: bean.id, label: bean.name }))}
            />
          </Field>
          <Field label="Batch Title" hint="Left empty, it uses the lot name">
            <TextInput value={title} onChange={setTitle} placeholder="Mt. Apo Anaerobic, Harvest Release" />
          </Field>
          <Field label="Description">
            <TextArea value={description} onChange={setDescription} rows={2} maxLength={240} placeholder="What makes this batch special?" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Drop Date and Time">
              <TextInput value={dropAt} onChange={setDropAt} type="datetime-local" />
            </Field>
            <Field label="Batch Size (bags)">
              <TextInput value={batchBags} onChange={setBatchBags} type="number" />
            </Field>
          </div>
          <Field label="Batch Price" hint={selectedBean ? `Defaults to the lot price: P${selectedBean.price}` : undefined}>
            <TextInput value={price} onChange={setPrice} type="number" placeholder={selectedBean ? String(selectedBean.price) : '450'} />
          </Field>
          {error && <ErrorNote message={error} />}
          <PrimaryButton onClick={schedule} className="w-full">
            Schedule Batch
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
};
