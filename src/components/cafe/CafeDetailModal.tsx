import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  MapPin,
  Bookmark,
  BookmarkCheck,
  Navigation,
  ListPlus,
  Wifi,
  Zap,
  Snowflake,
  Trees,
  PawPrint,
  MoonStar,
  VolumeX,
  LaptopMinimal,
  Milk,
  FlaskConical,
  BadgeCheck,
  Flame,
  Clock,
} from 'lucide-react';
import type { Cafe, AmenityKey, Bean } from '../../types/coffee';
import { AMENITY_LABELS } from '../../types/coffee';
import { Modal, ModalHeader, SecondaryButton } from '../common/FormControls';
import { isOpenNow, hoursTodayLabel } from '../../utils/calendar';
import { directionsUrl } from '../../utils/geo';
import { catalogService } from '../../services/catalogService';
import { useCatalogVersion } from '../../hooks/useServiceVersions';
import { AddToListSheet } from '../common/AddToListSheet';

const AMENITY_ICONS: Record<AmenityKey, React.ComponentType<{ className?: string }>> = {
  fastWifi: Wifi,
  plugs: Zap,
  aircon: Snowflake,
  outdoor: Trees,
  petFriendly: PawPrint,
  lateNight: MoonStar,
  quietFocus: VolumeX,
  workFriendly: LaptopMinimal,
  pourOverBar: FlaskConical,
  oatMilk: Milk,
};

export const AmenityBadges: React.FC<{ amenities: AmenityKey[]; wifiMbps: number }> = ({ amenities, wifiMbps }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {amenities.map((amenity) => {
      const Icon = AMENITY_ICONS[amenity];
      return (
        <div
          key={amenity}
          className="flex items-center gap-2 h-9 px-3 rounded-xl bg-[#F3ECD8] border border-[#E6DCC0] text-[11px] font-semibold font-sans text-[#1A2225]"
        >
          <Icon className="w-3.5 h-3.5 text-[#55615D] shrink-0" />
          <span className="truncate">
            {amenity === 'fastWifi' ? `Fast WiFi ${wifiMbps} Mbps` : AMENITY_LABELS[amenity]}
          </span>
        </div>
      );
    })}
  </div>
);

export const MenuSheet: React.FC<{ menu: Cafe['menu'] }> = ({ menu }) => {
  const categories = ['Espresso Bar', 'Filter', 'Signature', 'Pastry'] as const;
  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const items = menu.filter((item) => item.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category} className="space-y-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">{category}</h4>
            {items.map((item) => (
              <div key={item.name} className="flex items-baseline justify-between gap-3 border-b border-dashed border-[#E6DCC0] pb-1.5">
                <div className="min-w-0">
                  <span className="text-sm font-sans font-semibold text-[#1A2225]">{item.name}</span>
                  {item.description && <span className="block text-[11px] font-sans text-[#55615D]">{item.description}</span>}
                </div>
                <span className="text-sm font-sans font-bold text-[#1A2225] shrink-0 tabular-nums">P{item.price}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

interface CafeDetailModalProps {
  cafe: Cafe | null;
  onClose: () => void;
  saved: boolean;
  onToggleSave: (cafe: Cafe) => void;
  onSelectRoastery: (cafeId: string) => void;
  onViewBean: (beanId: string) => void;
}

/**
 * Full cafe detail: snap gallery, live open status, amenity grid, menu sheet,
 * and actions (directions, save, add to list, roastery hop).
 */
export const CafeDetailModal: React.FC<CafeDetailModalProps> = ({
  cafe,
  onClose,
  saved,
  onToggleSave,
  onSelectRoastery,
  onViewBean,
}) => {
  const catalogVersion = useCatalogVersion();
  const [isListSheetOpen, setIsListSheetOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [cafe?.id]);

  const menu = useMemo(
    () => (cafe ? catalogService.getEffectiveMenu(cafe) : []),
    [cafe, catalogVersion]
  );

  if (!cafe) return null;

  const openNow = isOpenNow(cafe.hours);
  const roasterBeans: Bean[] = cafe.isRoastery ? catalogService.getBeansByRoaster(cafe.id) : [];

  return (
    <>
      <Modal isOpen={Boolean(cafe)} onClose={onClose} maxWidth="sm:max-w-2xl" labelledBy="cafe-detail-title">
        <ModalHeader title={cafe.name} subtitle={`${cafe.district}, ${cafe.city}`} onClose={onClose} />

        <div className="px-4 sm:px-6 py-4 space-y-5">
          {/* Snap gallery */}
          <div className="relative">
            <div
              ref={galleryRef}
              onScroll={(event) => {
                const el = event.currentTarget;
                setActiveImage(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
              }}
              className="snap-gallery flex overflow-x-auto scrollbar-none rounded-2xl border border-[#E6DCC0] aspect-[16/10] bg-[#1A2225]"
            >
              {cafe.images.map((src, index) => (
                <img
                  key={src + index}
                  src={src}
                  alt={`${cafe.name} photo ${index + 1}`}
                  className="w-full h-full object-cover shrink-0 snap-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              ))}
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {cafe.images.map((src, index) => (
                <span
                  key={src + index}
                  className={`h-1.5 rounded-full transition-all ${index === activeImage ? 'w-5 bg-[#FFF9E9]' : 'w-1.5 bg-[#FFF9E9]/50'}`}
                />
              ))}
            </div>
          </div>

          {/* Status row */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border font-bold ${
              openNow
                ? 'bg-[#3E5C48]/10 border-[#3E5C48]/30 text-[#3E5C48]'
                : 'bg-[#C86428]/10 border-[#C86428]/30 text-[#A34F1E]'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-[#3E5C48]' : 'bg-[#C86428]'}`} />
              {openNow ? 'Open Now' : 'Closed'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#55615D]">
              <Clock className="w-3.5 h-3.5" />
              {hoursTodayLabel(cafe.hours)}
            </span>
            {cafe.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] px-2.5 py-1 font-bold text-[#1A2225]">
                <BadgeCheck className="w-3.5 h-3.5 text-[#3E5C48]" />
                Verified Venue
              </span>
            )}
            {cafe.isRoastery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#C86428] px-2.5 py-1 font-bold tracking-widest text-[#FFF9E9] text-[9px]">
                <Flame className="w-3 h-3" />
                MICRO-ROASTERY
              </span>
            )}
          </div>

          <p className="text-sm font-sans text-[#1A2225]/85 leading-relaxed">{cafe.description}</p>

          <div className="flex items-start gap-2 text-xs font-sans text-[#55615D]">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{cafe.address}</span>
          </div>

          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">Amenities</h3>
            <AmenityBadges amenities={cafe.amenities} wifiMbps={cafe.wifiMbps} />
          </section>

          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">Brew Methods</h3>
            <div className="flex flex-wrap gap-1.5">
              {cafe.brewMethods.map((method) => (
                <span key={method} className="h-7 px-2.5 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] text-[10px] font-bold font-sans text-[#1A2225] flex items-center">
                  {method}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">Menu</h3>
            <MenuSheet menu={menu} />
          </section>

          {roasterBeans.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">Roasted Here</h3>
              <div className="flex flex-wrap gap-1.5">
                {roasterBeans.map((bean) => (
                  <button
                    key={bean.id}
                    onClick={() => onViewBean(bean.id)}
                    className="h-8 px-3 rounded-full bg-[#C86428]/10 border border-[#C86428]/30 text-[10px] font-bold font-sans text-[#A34F1E] flex items-center gap-1.5 hover:bg-[#C86428]/20 transition-colors"
                  >
                    {bean.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E6DCC0] sheet-safe">
            <a
              href={directionsUrl([{ lat: cafe.lat, lng: cafe.lng }])}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-5 rounded-full bg-[#1A2225] text-[#FFF9E9] text-xs font-bold font-sans inline-flex items-center gap-2 hover:bg-[#26302F] transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Directions
            </a>
            <button
              onClick={() => onToggleSave(cafe)}
              className={`h-10 px-5 rounded-full text-xs font-bold font-sans inline-flex items-center gap-2 border transition-colors ${
                saved ? 'bg-[#C86428] border-[#C86428] text-[#FFF9E9]' : 'bg-[#F3ECD8] border-[#E6DCC0] text-[#1A2225] hover:bg-[#E6DCC0]'
              }`}
            >
              {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              {saved ? 'Saved' : 'Save Cafe'}
            </button>
            <SecondaryButton onClick={() => setIsListSheetOpen(true)}>
              <span className="inline-flex items-center gap-2">
                <ListPlus className="w-3.5 h-3.5" />
                Add to List
              </span>
            </SecondaryButton>
            {cafe.isRoastery && (
              <button
                onClick={() => onSelectRoastery(cafe.id)}
                className="h-10 px-5 rounded-full bg-roast-soft border border-[#C86428]/40 text-[#A34F1E] text-xs font-bold font-sans inline-flex items-center gap-2 hover:bg-[#C86428]/20 transition-colors"
              >
                <Flame className="w-3.5 h-3.5" />
                Roastery Profile
              </button>
            )}
          </div>
        </div>
      </Modal>

      <AddToListSheet
        isOpen={isListSheetOpen}
        onClose={() => setIsListSheetOpen(false)}
        cafeId={cafe.id}
      />
    </>
  );
};
