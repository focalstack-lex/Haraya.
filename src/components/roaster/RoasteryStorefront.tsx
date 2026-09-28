import React, { useMemo, useState } from 'react';
import { MapPin, Bookmark, BookmarkCheck, UserPlus, UserCheck, BadgeCheck, Clock, ChevronLeft, ListPlus, Navigation } from 'lucide-react';
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

  const actionClass = 'h-11 px-4 rounded-full text-[15px] font-semibold font-sans inline-flex items-center justify-center gap-1.5 ios-press';
  const tintAction = `${actionClass} bg-[#906D4B] text-[#FFFDF9] hover:bg-[#7D5C3D]`;
  const fillAction = `${actionClass} ios-fill text-[#7D5C3D] hover:bg-[#766046]/20`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-6 sm:pt-3 space-y-6">
      {/* iOS back button */}
      <button
        onClick={onBack}
        className="h-11 -ml-2 pr-3 inline-flex items-center gap-0.5 text-[17px] font-sans text-[#7D5C3D] ios-press"
      >
        <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
        Back
      </button>

      {/* Brand header */}
      <header className="space-y-4">
        <div className="relative h-44 sm:h-64 rounded-[20px] overflow-hidden ios-card-shadow bg-[#13191F]">
          <img src={cafe.images[0]} alt={`${cafe.name} cover`} className="w-full h-full object-cover" />
        </div>

        <div className="flex items-center gap-3">
          <img
            src={cafe.logoUrl}
            alt={`${cafe.name} logo`}
            className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-[14px] object-cover bg-[#13191F] ios-card-shadow"
          />
          <div className="min-w-0 flex-1">
            <h1 className="ios-large-title text-balance">
              {cafe.name}
              {cafe.verified && <BadgeCheck className="inline-block w-6 h-6 ml-1.5 -mt-1 align-middle text-[#3E5C48]" aria-label="Verified" />}
            </h1>
            <p className="ios-footnote text-[#594C3D] truncate mt-0.5">
              @{cafe.handle}, {cafe.district}, {cafe.city}
            </p>
          </div>
        </div>

        <p className="text-[15px] leading-[1.45] text-[#13191F]/85 max-w-3xl">{cafe.description}</p>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <button
            onClick={() => userPrefsService.toggleFollowing(cafe.id)}
            aria-pressed={following}
            className={following ? fillAction : tintAction}
          >
            {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {following ? 'Following' : 'Follow'}
          </button>
          <button onClick={() => onToggleSave(cafe)} aria-pressed={saved} className={saved ? tintAction : fillAction}>
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save'}
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`}
            target="_blank"
            rel="noreferrer"
            className={fillAction}
          >
            <Navigation className="w-4 h-4" />
            Directions
          </a>
          <button onClick={() => setIsListSheetOpen(true)} className={fillAction}>
            <ListPlus className="w-4 h-4" />
            Add to List
          </button>
        </div>

        {/* Visit info as a grouped list */}
        <dl className="ios-group ios-card-shadow max-w-3xl">
          <div className="ios-group-row">
            <Clock className="w-4.5 h-4.5 shrink-0 text-[#906D4B]" />
            <dt className="sr-only">Status</dt>
            <dd className="flex-1 min-w-0 flex items-center justify-between gap-3 text-[15px]">
              <span className={`font-medium inline-flex items-center gap-1.5 ${openNow ? 'text-[#3E5C48]' : 'text-[#8C3A2E]'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-[#3E5C48]' : 'bg-[#8C3A2E]'}`} />
                {openNow ? 'Open now' : 'Closed'}
              </span>
              <span className="font-mono text-[#594C3D] truncate">{hoursTodayLabel(cafe.hours)}</span>
            </dd>
          </div>
          <div className="ios-group-row">
            <MapPin className="w-4.5 h-4.5 shrink-0 text-[#906D4B]" />
            <dt className="sr-only">Address</dt>
            <dd className="flex-1 min-w-0 text-[15px] text-[#13191F]">{cafe.address}</dd>
          </div>
        </dl>
      </header>

      {/* Bean shelf */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <h2 className="ios-title">Bean shelf</h2>
          <span className="ios-footnote font-mono text-[#594C3D]">{beans.length} lots</span>
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
        <section className="space-y-2">
          <h2 className="ios-title px-1">Roast schedule</h2>
          <ul className="ios-group ios-card-shadow max-w-3xl">
            {drops.map((drop) => (
              <li key={drop.id} className="ios-group-row !px-3">
                <img src={drop.coverImage} alt="" className="h-11 w-11 shrink-0 rounded-[10px] object-cover bg-[#13191F]" />
                <div className="min-w-0 flex-1">
                  <p className="ios-headline text-[#13191F] truncate">{drop.title}</p>
                  <p className="ios-footnote text-[#594C3D] font-mono truncate">
                    {new Date(drop.dropAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    , {drop.batchBags} bags at ₱{drop.price}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Menu and hours */}
      <section className="grid lg:grid-cols-2 gap-6 lg:gap-4 items-start">
        <div className="space-y-2">
          <h2 className="ios-title px-1">Menu</h2>
          <div className="rounded-[20px] bg-[#FFFDF9] ios-card-shadow p-4 sm:p-5">
            <MenuSheet menu={menu} />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="ios-title px-1">Weekly hours</h2>
          <dl className="ios-group ios-card-shadow">
            {WEEKDAY_ORDER.map((day) => {
              const entry = cafe.hours[day];
              const isOpenDay = Boolean(entry.open && entry.close);
              return (
                <div key={day} className="ios-group-row justify-between !min-h-11">
                  <dt className="text-[15px] text-[#13191F]">{day}</dt>
                  <dd className={`text-[15px] font-mono ${isOpenDay ? 'text-[#594C3D]' : 'text-[#8C3A2E]'}`}>
                    {isOpenDay ? `${entry.open} to ${entry.close}` : 'Closed'}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      <AddToListSheet isOpen={isListSheetOpen} onClose={() => setIsListSheetOpen(false)} cafeId={cafe.id} />
    </div>
  );
};
