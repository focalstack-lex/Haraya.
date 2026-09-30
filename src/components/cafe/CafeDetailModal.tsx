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
  BadgeCheck,
  Flame,
  Clock,
  Star,
  ChevronRight,
  Flag,
  Megaphone,
} from 'lucide-react';
import type { Cafe, AmenityKey, Bean } from '../../types/coffee';
import { AMENITY_LABELS } from '../../types/coffee';
import { Modal, ModalHeader } from '../common/FormControls';
import { GROUP, SECTION_LABEL } from '../common/sheetStyles';
import { isOpenNow, hoursTodayLabel, hasListedHours } from '../../utils/calendar';
import { catalogService } from '../../services/catalogService';
import { useCatalogVersion } from '../../hooks/useServiceVersions';
import { AddToListSheet } from '../common/AddToListSheet';
import { V60DripperIcon, FocusTimerIcon } from '../common/CustomIcons';
import { CafeRecentVisitors } from './CafeRecentVisitors';
import { CafeReviews } from './CafeReviews';
import { ReportSheet, type ReportSubject } from './ReportSheet';
import { activeNotice } from '../../services/placeMapping';

const AMENITY_ICONS: Record<AmenityKey, React.ComponentType<{ className?: string }>> = {
  fastWifi: Wifi,
  plugs: Zap,
  aircon: Snowflake,
  outdoor: Trees,
  petFriendly: PawPrint,
  lateNight: MoonStar,
  quietFocus: VolumeX,
  workFriendly: LaptopMinimal,
  pourOverBar: V60DripperIcon,
  oatMilk: Milk,
};

const SECONDARY_ACTION =
  'h-11 px-3 rounded-full ios-fill text-tint-ink text-[15px] font-semibold font-sans inline-flex items-center justify-center gap-2 hover:bg-shade/20 ios-press';

export const AmenityBadges: React.FC<{ amenities: AmenityKey[]; wifiMbps: number }> = ({ amenities, wifiMbps }) => (
  <div className={GROUP}>
    {amenities.map((amenity) => {
      const Icon = AMENITY_ICONS[amenity];
      return (
        <div
          key={amenity}
          className="ios-group-row min-h-11 py-2 text-[15px] font-sans text-ink"
        >
          <Icon className="w-4.5 h-4.5 text-tint shrink-0" />
          <span className="truncate">
            {amenity === 'fastWifi' ? 'Fast WiFi' : AMENITY_LABELS[amenity]}
          </span>
          {amenity === 'fastWifi' && wifiMbps > 0 && (
            <span className="ml-auto shrink-0 font-mono text-[13px] text-ink-2">{wifiMbps} Mbps</span>
          )}
        </div>
      );
    })}
  </div>
);

export const MenuSheet: React.FC<{ menu: Cafe['menu'] }> = ({ menu }) => {
  const categories = ['Espresso Bar', 'Filter', 'Signature', 'Pastry'] as const;
  const filled = categories
    .map((category) => ({ category, items: menu.filter((item) => item.category === category) }))
    .filter((entry) => entry.items.length > 0);
  if (filled.length === 0) return null;
  return (
    <div className={GROUP}>
      {/* One list: each category is a subhead row, then its items, so the hairlines separate every row */}
      {filled.map(({ category, items }) => (
        <React.Fragment key={category}>
          <h4 className="px-4 pt-3 pb-1.5 ios-footnote font-semibold text-ink-2">{category}</h4>
          {items.map((item) => (
            <div key={item.name} className="ios-group-row min-h-11 justify-between items-baseline">
              <div className="min-w-0">
                <span className="block text-[15px] font-sans text-ink">{item.name}</span>
                {item.description && <span className="block ios-footnote text-ink-2 mt-0.5">{item.description}</span>}
              </div>
              <span className="text-[15px] font-mono font-medium text-ink shrink-0">₱{item.price}</span>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

interface CafeDetailModalProps {
  cafe: Cafe | null;
  onClose: () => void;
  saved: boolean;
  onToggleSave: (cafe: Cafe) => void;
  /** Opens the directions picker (Haraya live navigation or a maps app). */
  onDirections: (cafe: Cafe) => void;
  /** Retired roaster features: rendered only when a caller passes them. */
  onSelectRoastery?: (cafeId: string) => void;
  onViewBean?: (beanId: string) => void;
  onRateCafe?: (cafe: Cafe) => void;
  /** Opens the geofenced check-in sheet (focus session or Quick Stamp). */
  onCheckIn?: (cafe: Cafe) => void;
  /** A focus session is running at this spot: the check-in button becomes Finish. */
  focusingHere?: boolean;
  onFinishSession?: () => void;
}

/**
 * Full cafe detail: snap gallery, live open status, actions (directions, save, rate,
 * roastery hop), and grouped lists for visit details, amenities, menu and beans.
 */
export const CafeDetailModal: React.FC<CafeDetailModalProps> = ({
  cafe,
  onClose,
  saved,
  onToggleSave,
  onDirections,
  onSelectRoastery,
  onViewBean,
  onRateCafe,
  onCheckIn,
  focusingHere = false,
  onFinishSession,
}) => {
  const catalogVersion = useCatalogVersion();
  const [isListSheetOpen, setIsListSheetOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [reportSubject, setReportSubject] = useState<ReportSubject | null>(null);

  useEffect(() => {
    setActiveImage(0);
    setReportSubject(null);
  }, [cafe?.id]);

  const menu = useMemo(
    () => (cafe ? catalogService.getEffectiveMenu(cafe) : []),
    [cafe, catalogVersion]
  );

  if (!cafe) return null;

  const openNow = isOpenNow(cafe.hours);
  const hoursKnown = hasListedHours(cafe.hours);
  const roasterBeans: Bean[] = cafe.isRoastery ? catalogService.getBeansByRoaster(cafe.id) : [];
  const closed = Boolean(cafe.closed);
  const notice = activeNotice(cafe);
  // A spot only the contributor can see has nobody to report it to yet
  const reportable = cafe.community?.status !== 'pending';

  return (
    <>
      <Modal isOpen={Boolean(cafe)} onClose={onClose} maxWidth="sm:max-w-2xl" labelledBy="cafe-detail-title">
        <ModalHeader title={cafe.name} subtitle={`${cafe.district}, ${cafe.city}`} onClose={onClose} />

        <div className="px-4 sm:px-6 py-4 space-y-6">
          {/* Snap gallery */}
          <div className="relative">
            <div
              ref={galleryRef}
              onScroll={(event) => {
                const el = event.currentTarget;
                setActiveImage(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
              }}
              className="flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain scrollbar-none rounded-card aspect-[16/10] bg-ink"
            >
              {cafe.images.map((src, index) => (
                <img
                  key={src + index}
                  src={src}
                  alt={`${cafe.name} photo ${index + 1}`}
                  className="w-full h-full object-cover shrink-0 snap-center snap-always"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              ))}
            </div>
            {cafe.images.length > 1 && (
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 h-5 px-2 rounded-full ios-material-dark"
                role="img"
                aria-label={`Photo ${activeImage + 1} of ${cafe.images.length}`}
              >
                {cafe.images.map((src, index) => (
                  <span
                    key={src + index}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${index === activeImage ? 'bg-surface' : 'bg-surface/45'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status line */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-sans">
              <span className={`font-semibold inline-flex items-center gap-1.5 ${
                closed ? 'text-danger' : !hoursKnown ? 'text-ink-2' : openNow ? 'text-ok' : 'text-danger'
              }`}>
                {!closed && hoursKnown && <span className={`h-2 w-2 rounded-full ${openNow ? 'bg-ok' : 'bg-danger'}`} />}
                {closed ? 'Permanently closed' : !hoursKnown ? 'Hours not listed' : openNow ? 'Open now' : 'Closed'}
              </span>
              {cafe.verified && (
                <span className="inline-flex items-center gap-1 text-ink-2">
                  <BadgeCheck className="w-4 h-4 text-ok" />
                  Verified
                </span>
              )}
              {cafe.isRoastery && (
                <span className="inline-flex items-center gap-1 text-tint-ink font-medium">
                  <Flame className="w-4 h-4 text-tint" />
                  Brews in-house
                </span>
              )}
              {cafe.community && (
                <span className={`font-medium ${cafe.community.status === 'pending' ? 'text-tint-ink' : 'text-ok'}`}>
                  {cafe.community.status === 'pending' ? 'Pending review, only you can see it' : 'Community gem'}
                </span>
              )}
            </div>
            {notice && (
              <p className="rounded-row bg-tint/12 px-3.5 py-2.5 text-[15px] text-ink flex items-start gap-2">
                <Megaphone className="w-4.5 h-4.5 shrink-0 mt-0.5 text-tint-ink" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  <span className="font-semibold">From the owner: </span>
                  {notice}
                </span>
              </p>
            )}
            {cafe.description && <p className="text-[15px] font-sans text-ink/85 leading-relaxed">{cafe.description}</p>}
            {cafe.community?.tip && (
              <p className="rounded-row bg-canvas px-3.5 py-2.5 text-[15px] text-ink">
                <span className="font-semibold">Local tip: </span>
                {cafe.community.tip}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {/* One primary action; save and list ride beside it as icon buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDirections(cafe)}
                className="h-11 flex-1 rounded-full bg-tint text-surface text-[15px] font-semibold font-sans inline-flex items-center justify-center gap-2 hover:bg-tint-ink ios-press"
              >
                <Navigation className="w-4 h-4" />
                Directions
              </button>
              <button
                onClick={() => onToggleSave(cafe)}
                aria-pressed={saved}
                aria-label={saved ? `Remove ${cafe.name} from saved` : `Save ${cafe.name}`}
                className={
                  saved
                    ? 'h-11 w-11 rounded-full bg-tint text-surface inline-flex items-center justify-center hover:bg-tint-ink ios-press'
                    : `${SECONDARY_ACTION} w-11 px-0`
                }
              >
                {saved ? <BookmarkCheck className="w-4.5 h-4.5" /> : <Bookmark className="w-4.5 h-4.5" />}
              </button>
              <button
                onClick={() => setIsListSheetOpen(true)}
                aria-label={`Add ${cafe.name} to a list`}
                className={`${SECONDARY_ACTION} w-11 px-0`}
              >
                <ListPlus className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {onCheckIn && (!closed || focusingHere) && (
                <button
                  onClick={() => (focusingHere && onFinishSession ? onFinishSession() : onCheckIn(cafe))}
                  className={SECONDARY_ACTION}
                >
                  <FocusTimerIcon className="w-4.5 h-4.5" />
                  {focusingHere ? 'Finish session' : 'Check in'}
                </button>
              )}
              {onRateCafe && (
                <button
                  onClick={() => onRateCafe(cafe)}
                  className={`${SECONDARY_ACTION} ${(onCheckIn && (!closed || focusingHere) ? 1 : 0) + (cafe.isRoastery && onSelectRoastery ? 1 : 0) === 0 ? 'col-span-2' : ''}`}
                >
                  <Star className="w-4 h-4" />
                  Rate
                </button>
              )}
              {cafe.isRoastery && onSelectRoastery && (
                <button
                  onClick={() => onSelectRoastery(cafe.id)}
                  className={`${SECONDARY_ACTION} ${(onCheckIn ? 1 : 0) + (onRateCafe ? 1 : 0) === 1 ? '' : 'col-span-2'}`}
                >
                  <Flame className="w-4 h-4" />
                  Roastery profile
                </button>
              )}
            </div>
          </div>

          {/* Visit details */}
          <div className={GROUP}>
            <div className="ios-group-row">
              <Clock className="w-4.5 h-4.5 text-tint shrink-0" />
              <span className="text-[15px] font-sans text-ink">Today</span>
              <span className="ml-auto text-[15px] font-mono text-ink-2 text-right">{hoursTodayLabel(cafe.hours)}</span>
            </div>
            <div className="ios-group-row items-start">
              <MapPin className="w-4.5 h-4.5 text-tint shrink-0 mt-0.5" />
              <span className="text-[15px] font-sans text-ink leading-snug">{cafe.address}</span>
            </div>
          </div>

          {cafe.amenities.length > 0 && (
            <section className="space-y-1.5">
              <h3 className={SECTION_LABEL}>Amenities</h3>
              <AmenityBadges amenities={cafe.amenities} wifiMbps={cafe.wifiMbps} />
            </section>
          )}

          <CafeReviews cafe={cafe} onReport={setReportSubject} />

          <CafeRecentVisitors cafe={cafe} onReport={setReportSubject} />

          {cafe.brewMethods.length > 0 && (
          <section className="space-y-1.5">
            <h3 className={SECTION_LABEL}>Brew methods</h3>
            <div className="flex flex-wrap gap-1.5">
              {cafe.brewMethods.map((method) => (
                <span key={method} className="h-8 inline-flex items-center px-3 rounded-full ios-fill text-[13px] font-medium font-sans text-ink">
                  {method}
                </span>
              ))}
            </div>
          </section>
          )}

          {menu.length > 0 && (
            <section className="space-y-1.5">
              <h3 className={SECTION_LABEL}>Menu</h3>
              <MenuSheet menu={menu} />
            </section>
          )}

          {onViewBean && roasterBeans.length > 0 && (
            <section className="space-y-1.5">
              <h3 className={SECTION_LABEL}>Roasted here</h3>
              <div className={GROUP}>
                {roasterBeans.map((bean) => (
                  <button
                    key={bean.id}
                    onClick={() => onViewBean(bean.id)}
                    className="ios-group-row ios-press"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-sans text-ink truncate">{bean.name}</span>
                      <span className="block ios-footnote text-ink-2 truncate">{bean.origin}</span>
                    </span>
                    <span className="font-mono text-[15px] text-ink-2 shrink-0">₱{bean.price}</span>
                    <ChevronRight className="w-4 h-4 text-ink-3/60 shrink-0" strokeWidth={2.5} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {reportable && (
            <button
              onClick={() => setReportSubject({ type: 'spot', id: cafe.id, label: cafe.name })}
              className="min-h-11 mx-auto px-3 flex items-center justify-center gap-1.5 text-[14px] font-medium text-ink-2 ios-press"
            >
              <Flag className="w-4 h-4" />
              Report a problem or suggest a fix
            </button>
          )}
        </div>
      </Modal>

      <ReportSheet subject={reportSubject} onClose={() => setReportSubject(null)} />

      <AddToListSheet
        isOpen={isListSheetOpen}
        onClose={() => setIsListSheetOpen(false)}
        cafeId={cafe.id}
      />
    </>
  );
};
