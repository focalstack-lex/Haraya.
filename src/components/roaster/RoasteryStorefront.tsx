import React, { useMemo, useState } from 'react';
import { MapPin, Bookmark, BookmarkCheck, UserPlus, UserCheck, BadgeCheck, Clock, ArrowLeft, Navigation } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import { catalogService } from '../../services/catalogService';
import { userPrefsService } from '../../services/userPrefsService';
import { useCatalogVersion, usePrefsVersion } from '../../hooks/useServiceVersions';
import { isOpenNow, hoursTodayLabel } from '../../utils/calendar';
import { BeanGrid } from '../feed/BeanGrid';
import { MenuSheet } from '../cafe/CafeDetailModal';
import { AddToListSheet } from '../common/AddToListSheet';
import { WEEKDAY_ORDER } from '../../utils/weekdays';

interface RoasteryStorefrontProps {
  cafe: Cafe;
  onBack: () => void;
  onSelectBean: (beanId: string) => void;
  onToggleSave: (cafe: Cafe) => void;
  saved: boolean;
}

/** Public roastery storefront: brand header, bean shelf, drop schedule, menu, hours. */
export const RoasteryStorefront: React.FC<RoasteryStorefrontProps> = ({
  cafe,
  onBack,
  onSelectBean,
  onToggleSave,
  saved,
}) => {
  useCatalogVersion();
  usePrefsVersion();
  const [isListSheetOpen, setIsListSheetOpen] = useState(false);

  const beans = useMemo(() => catalogService.getBeansByRoaster(cafe.id), [cafe.id]);
  const drops = useMemo(() => catalogService.getDropsByRoaster(cafe.id), [cafe.id]);
  const menu = useMemo(() => catalogService.getEffectiveMenu(cafe), [cafe]);
  const following = userPrefsService.isFollowing(cafe.id);
  const openNow = isOpenNow(cafe.hours);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold font-sans text-[#55615D] hover:text-[#1A2225] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Discover
      </button>

      {/* Brand header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E6DCC0] bg-[#FFF9E9] shadow-sm">
        <div className="relative h-40 sm:h-56 bg-[#1A2225]">
          <img src={cafe.images[0]} alt={`${cafe.name} cover`} className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="px-4 sm:px-6 pb-5">
          <div className="flex items-end gap-3 sm:gap-4 -mt-8 sm:-mt-10">
            <img
              src={cafe.logoUrl}
              alt={`${cafe.name} logo`}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-[#FFF9E9] shadow-lg bg-[#1A2225]"
            />
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="font-cooper text-xl sm:text-2xl font-bold text-[#1A2225] truncate flex items-center gap-2">
                {cafe.name}
                {cafe.verified && <BadgeCheck className="w-5 h-5 text-[#3E5C48] shrink-0" />}
              </h1>
              <p className="text-xs font-sans text-[#55615D] truncate">
                @{cafe.handle} : {cafe.district}, {cafe.city}
              </p>
            </div>
          </div>

          <p className="text-sm font-sans text-[#1A2225]/85 leading-relaxed mt-3">{cafe.description}</p>

          <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-sans">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border font-bold ${
              openNow ? 'bg-[#3E5C48]/10 border-[#3E5C48]/30 text-[#3E5C48]' : 'bg-[#C86428]/10 border-[#C86428]/30 text-[#A34F1E]'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-[#3E5C48]' : 'bg-[#C86428]'}`} />
              {openNow ? 'Open Now' : 'Closed'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#55615D]">
              <Clock className="w-3.5 h-3.5" />
              {hoursTodayLabel(cafe.hours)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#55615D]">
              <MapPin className="w-3.5 h-3.5" />
              {cafe.address}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => onToggleSave(cafe)}
              className={`h-10 px-5 rounded-full text-xs font-bold font-sans inline-flex items-center gap-2 border transition-colors ${
                saved ? 'bg-[#C86428] border-[#C86428] text-[#FFF9E9]' : 'bg-[#F3ECD8] border-[#E6DCC0] text-[#1A2225] hover:bg-[#E6DCC0]'
              }`}
            >
              {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              {saved ? 'Saved' : 'Save Roastery'}
            </button>
            <button
              onClick={() => userPrefsService.toggleFollowing(cafe.id)}
              className={`h-10 px-5 rounded-full text-xs font-bold font-sans inline-flex items-center gap-2 border transition-colors ${
                following ? 'bg-[#1A2225] border-[#1A2225] text-[#FFF9E9]' : 'bg-[#FFF9E9] border-[#E6DCC0] text-[#1A2225] hover:bg-[#F3ECD8]'
              }`}
            >
              {following ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {following ? 'Following' : 'Follow Roaster'}
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-5 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] text-xs font-bold font-sans text-[#1A2225] inline-flex items-center gap-2 hover:bg-[#E6DCC0] transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Directions
            </a>
            <button
              onClick={() => setIsListSheetOpen(true)}
              className="h-10 px-5 rounded-full border border-[#E6DCC0] text-xs font-bold font-sans text-[#1A2225] hover:bg-[#F3ECD8] transition-colors"
            >
              Add to List
            </button>
          </div>
        </div>
      </div>

      {/* Bean shelf */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-cooper text-lg sm:text-xl font-bold text-[#1A2225]">Bean Shelf</h2>
          <span className="text-[11px] font-sans text-[#55615D]">{beans.length} lots on the shelf</span>
        </div>
        <BeanGrid
          beans={beans}
          savedBeanIds={userPrefsService.getSavedBeans()}
          onToggleSave={(bean) => userPrefsService.toggleSavedBean(bean)}
          onSelectBean={onSelectBean}
        />
      </section>

      {/* Drop schedule */}
      {drops.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-cooper text-lg sm:text-xl font-bold text-[#1A2225]">Roast Schedule</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {drops.map((drop) => (
              <div key={drop.id} className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] p-4 flex items-center gap-3">
                <img src={drop.coverImage} alt="" className="h-14 w-14 rounded-xl object-cover border border-[#E6DCC0]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-sans font-bold text-[#1A2225] truncate">{drop.title}</p>
                  <p className="text-[11px] font-sans text-[#55615D]">
                    {new Date(drop.dropAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    : {drop.batchBags} bags at P{drop.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu and hours */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] p-4 sm:p-5 space-y-3">
          <h2 className="font-cooper text-lg font-bold text-[#1A2225]">Menu</h2>
          <MenuSheet menu={menu} />
        </div>
        <div className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] p-4 sm:p-5 space-y-2">
          <h2 className="font-cooper text-lg font-bold text-[#1A2225] mb-2">Weekly Hours</h2>
          {WEEKDAY_ORDER.map((day) => {
            const entry = cafe.hours[day];
            return (
              <div key={day} className="flex items-center justify-between text-xs font-sans border-b border-dashed border-[#E6DCC0] pb-1.5 last:border-0">
                <span className="font-semibold text-[#1A2225]">{day}</span>
                <span className="text-[#55615D] tabular-nums">
                  {entry.open && entry.close ? `${entry.open} to ${entry.close}` : 'Closed'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <AddToListSheet isOpen={isListSheetOpen} onClose={() => setIsListSheetOpen(false)} cafeId={cafe.id} />
    </div>
  );
};
