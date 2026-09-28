import React, { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, ListPlus, Mountain, FlaskConical, ChevronRight } from 'lucide-react';
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

/** Grouped list on the white sheet: the linen canvas tone lets the inset group read as a group. */
const GROUP = 'ios-group bg-[#FAF5EB]';
const SECTION_LABEL = 'px-4 text-[13px] text-[#594C3D] font-sans';
const SECONDARY_ACTION =
  'h-11 px-3 rounded-full ios-fill text-[#7D5C3D] text-[15px] font-semibold font-sans inline-flex items-center justify-center gap-2 hover:bg-[#766046]/20 ios-press';

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
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [bean?.id]);

  if (!bean) return null;

  const meter = (label: string, value: number) => (
    <div className="ios-group-row min-h-11 py-2">
      <span className="text-[15px] font-sans text-[#13191F]">{label}</span>
      <span className="ml-auto flex gap-1.5" role="img" aria-label={`${label} ${value} of 5`}>
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={`h-2.5 w-2.5 rounded-full ${step <= value ? 'bg-[#906D4B]' : 'bg-[#766046]/20'}`}
          />
        ))}
      </span>
    </div>
  );

  const lowStock = bean.bagsInStock <= 10;

  return (
    <>
      <Modal isOpen={Boolean(bean)} onClose={onClose} maxWidth="sm:max-w-xl" labelledBy="bean-detail-title">
        <ModalHeader title={bean.name} subtitle={`${bean.roasterName}, ${bean.origin}`} onClose={onClose} />

        <div className="px-4 sm:px-6 py-4 space-y-6">
          {/* Snap gallery */}
          <div className="relative">
            <div
              onScroll={(event) => {
                const el = event.currentTarget;
                setActiveImage(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
              }}
              className="flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain scrollbar-none rounded-[20px] aspect-[16/9] bg-[#13191F]"
            >
              {bean.images.map((src, index) => (
                <img
                  key={src + index}
                  src={src}
                  alt={index === 0 ? `${bean.name} whole beans` : `${bean.name} photo ${index + 1}`}
                  className="w-full h-full object-cover shrink-0 snap-center snap-always"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              ))}
            </div>
            {bean.images.length > 1 && (
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 h-5 px-2 rounded-full ios-material-dark"
                role="img"
                aria-label={`Photo ${activeImage + 1} of ${bean.images.length}`}
              >
                {bean.images.map((src, index) => (
                  <span
                    key={src + index}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${index === activeImage ? 'bg-[#FFFDF9]' : 'bg-[#FFFDF9]/45'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <p className="text-[15px] font-sans text-[#13191F]/85 leading-relaxed">{bean.description}</p>

          {/* Price and stock */}
          <div className="space-y-2">
            <div className={GROUP}>
              <div className="ios-group-row">
                <span className="text-[15px] font-sans text-[#13191F]">250g whole bean</span>
                <span className="ml-auto font-mono text-[17px] font-semibold text-[#13191F]">₱{bean.price}</span>
              </div>
              {bean.dripPackPrice !== null && (
                <div className="ios-group-row">
                  <span className="text-[15px] font-sans text-[#13191F]">Drip pack sachet</span>
                  <span className="ml-auto font-mono text-[17px] font-semibold text-[#13191F]">₱{bean.dripPackPrice}</span>
                </div>
              )}
              <div className="ios-group-row">
                <span className="text-[15px] font-sans text-[#13191F]">Stock</span>
                <span className={`ml-auto font-mono text-[15px] ${lowStock ? 'font-semibold text-[#7D5C3D]' : 'text-[#594C3D]'}`}>
                  {bean.bagsInStock > 0 ? `${bean.bagsInStock} bags left` : 'Sold out'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onReserve(bean)}
              className="h-11 w-full rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold font-sans inline-flex items-center justify-center gap-2 hover:bg-[#7D5C3D] ios-press"
            >
              Reserve or inquire
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onToggleSave(bean)} aria-pressed={saved} className={SECONDARY_ACTION}>
                {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {saved ? 'Saved' : 'Save'}
              </button>
              <SecondaryButton onClick={() => setIsListSheetOpen(true)} className="px-3">
                <span className="inline-flex items-center justify-center gap-2">
                  <ListPlus className="w-4 h-4" />
                  Add to list
                </span>
              </SecondaryButton>
            </div>
          </div>

          <section className="space-y-1.5">
            <h3 className={SECTION_LABEL}>Origin</h3>
            <div className={GROUP}>
              {[
                { icon: Mountain, label: 'Farm', value: bean.farm },
                { icon: FlaskConical, label: 'Process', value: bean.process },
                { icon: BeanIcon, label: 'Varietal', value: bean.varietal },
                { icon: Mountain, label: 'Altitude', value: `${bean.altitudeMasl} masl` },
              ].map((entry) => (
                <div key={entry.label} className="ios-group-row min-h-11 py-2">
                  <entry.icon className="w-4.5 h-4.5 text-[#906D4B] shrink-0" />
                  <span className="text-[15px] font-sans text-[#13191F] shrink-0">{entry.label}</span>
                  <span className="ml-auto min-w-0 truncate text-right text-[15px] font-sans text-[#594C3D]">{entry.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-1.5">
            <h3 className={SECTION_LABEL}>Tasting notes</h3>
            <div className="flex flex-wrap gap-1.5">
              {bean.tastingNotes.map((note) => (
                <span
                  key={note}
                  className="h-8 inline-flex items-center px-3 rounded-full bg-[#906D4B]/12 text-[13px] font-medium font-sans text-[#7D5C3D]"
                >
                  {note}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-1.5">
            <h3 className={SECTION_LABEL}>Roast profile: {bean.roastProfile.roastLevel}</h3>
            <div className={GROUP}>
              {meter('Acidity', bean.roastProfile.acidity)}
              {meter('Body', bean.roastProfile.body)}
              {meter('Sweetness', bean.roastProfile.sweetness)}
              <div className="ios-group-row min-h-11 py-2">
                <span className="text-[15px] font-sans text-[#13191F] shrink-0">Suggested brew</span>
                <span className="ml-auto min-w-0 text-right text-[15px] font-sans text-[#594C3D]">{bean.roastProfile.suggestedBrew}</span>
              </div>
            </div>
          </section>

          <div className={GROUP}>
            <button onClick={() => onSelectRoastery(bean.roasterId)} className="ios-group-row ios-press">
              <span className="min-w-0 flex-1 text-[15px] font-sans text-[#7D5C3D] font-medium truncate">
                Visit {bean.roasterName}
              </span>
              <ChevronRight className="w-4 h-4 text-[#6E6150]/60 shrink-0" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </Modal>

      <AddToListSheet isOpen={isListSheetOpen} onClose={() => setIsListSheetOpen(false)} beanId={bean.id} />
    </>
  );
};
