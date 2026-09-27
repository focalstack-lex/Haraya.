import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, ListPlus, Flame, Mountain, FlaskConical } from 'lucide-react';
import type { Bean } from '../../types/coffee';
import { Modal, ModalHeader, SecondaryButton } from '../common/FormControls';
import { BeanIcon } from '../common/CustomIcons';
import { AddToListSheet } from '../common/AddToListSheet';

interface BeanDetailModalProps {
  bean: Bean | null;
  onClose: () => void;
  saved: boolean;
  onToggleSave: (bean: Bean) => void;
  onReserve: (bean: Bean) => void;
  onSelectRoastery: (cafeId: string) => void;
}

/** Micro-lot detail: roast profile meters, tasting notes, and reservation CTA. */
export const BeanDetailModal: React.FC<BeanDetailModalProps> = ({
  bean,
  onClose,
  saved,
  onToggleSave,
  onReserve,
  onSelectRoastery,
}) => {
  const [isListSheetOpen, setIsListSheetOpen] = useState(false);

  if (!bean) return null;

  const meter = (label: string, value: number) => (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">{label}</span>
      <span className="flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={`h-2.5 w-2.5 rounded-full ${step <= value ? 'bg-[#C86428]' : 'bg-[#F3ECD8] border border-[#E6DCC0]'}`}
          />
        ))}
      </span>
    </div>
  );

  return (
    <>
      <Modal isOpen={Boolean(bean)} onClose={onClose} maxWidth="sm:max-w-xl" labelledBy="bean-detail-title">
        <ModalHeader title={bean.name} subtitle={`${bean.roasterName} : ${bean.origin}`} onClose={onClose} />

        <div className="px-4 sm:px-6 py-4 space-y-5">
          <div className="relative rounded-2xl overflow-hidden border border-[#E6DCC0] aspect-[16/9] bg-[#1A2225]">
            <img src={bean.images[0]} alt={`${bean.name} whole beans`} className="w-full h-full object-cover" />
            {bean.isLimited && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#C86428] px-2.5 py-1 text-[9px] font-bold tracking-widest text-[#FFF9E9]">
                <Flame className="w-3 h-3" />
                LIMITED MICRO-LOT
              </span>
            )}
          </div>

          <p className="text-sm font-sans text-[#1A2225]/85 leading-relaxed">{bean.description}</p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Mountain, label: 'Farm', value: bean.farm },
              { icon: FlaskConical, label: 'Process', value: bean.process },
              { icon: BeanIcon, label: 'Varietal', value: bean.varietal },
              { icon: Mountain, label: 'Altitude', value: `${bean.altitudeMasl} masl` },
            ].map((entry) => (
              <div key={entry.label} className="rounded-xl bg-[#F3ECD8] border border-[#E6DCC0] px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#55615D] font-sans">
                  <entry.icon className="w-3 h-3" />
                  {entry.label}
                </span>
                <span className="block text-xs font-sans font-semibold text-[#1A2225] mt-0.5 truncate">{entry.value}</span>
              </div>
            ))}
          </div>

          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">Tasting Notes</h3>
            <div className="flex flex-wrap gap-1.5">
              {bean.tastingNotes.map((note) => (
                <span
                  key={note}
                  className="h-7 px-2.5 rounded-full bg-[#C86428]/10 border border-[#C86428]/30 text-[10px] font-bold font-sans text-[#A34F1E] flex items-center"
                >
                  {note}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">
              Roast Profile: {bean.roastProfile.roastLevel}
            </h3>
            {meter('Acidity', bean.roastProfile.acidity)}
            {meter('Body', bean.roastProfile.body)}
            {meter('Sweet', bean.roastProfile.sweetness)}
            <p className="text-[11px] font-sans text-[#55615D] pt-1">
              Suggested brew: <span className="font-semibold text-[#1A2225]">{bean.roastProfile.suggestedBrew}</span>
            </p>
          </section>

          <div className="rounded-2xl bg-[#1A2225] text-[#FFF9E9] px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="block font-cooper text-xl font-bold">P{bean.price}</span>
              <span className="text-[10px] font-sans text-[#FFF9E9]/70">250g whole bean</span>
            </div>
            {bean.dripPackPrice !== null && (
              <div className="text-right">
                <span className="block font-cooper text-lg font-bold">P{bean.dripPackPrice}</span>
                <span className="text-[10px] font-sans text-[#FFF9E9]/70">drip pack sachet</span>
              </div>
            )}
            <span className={`text-[10px] font-bold font-sans px-2.5 py-1 rounded-full border ${
              bean.bagsInStock > 10
                ? 'border-[#FFF9E9]/25 text-[#FFF9E9]/80'
                : 'border-[#C86428] text-[#FFB477]'
            }`}>
              {bean.bagsInStock > 0 ? `${bean.bagsInStock} bags left` : 'Sold out'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-[#E6DCC0] sheet-safe">
            <button
              onClick={() => onReserve(bean)}
              className="h-10 px-5 rounded-full bg-[#C86428] text-[#FFF9E9] text-xs font-bold font-sans inline-flex items-center gap-2 hover:bg-[#A34F1E] transition-colors"
            >
              Reserve or Inquire
            </button>
            <button
              onClick={() => onToggleSave(bean)}
              className={`h-10 px-5 rounded-full text-xs font-bold font-sans inline-flex items-center gap-2 border transition-colors ${
                saved ? 'bg-[#C86428] border-[#C86428] text-[#FFF9E9]' : 'bg-[#F3ECD8] border-[#E6DCC0] text-[#1A2225] hover:bg-[#E6DCC0]'
              }`}
            >
              {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              {saved ? 'Saved' : 'Save Bean'}
            </button>
            <SecondaryButton onClick={() => setIsListSheetOpen(true)}>
              <span className="inline-flex items-center gap-2">
                <ListPlus className="w-3.5 h-3.5" />
                Add to List
              </span>
            </SecondaryButton>
            <button
              onClick={() => onSelectRoastery(bean.roasterId)}
              className="h-10 px-5 rounded-full border border-[#E6DCC0] text-xs font-bold font-sans text-[#1A2225] inline-flex items-center gap-2 hover:bg-[#F3ECD8] transition-colors"
            >
              Visit {bean.roasterName}
            </button>
          </div>
        </div>
      </Modal>

      <AddToListSheet isOpen={isListSheetOpen} onClose={() => setIsListSheetOpen(false)} beanId={bean.id} />
    </>
  );
};
