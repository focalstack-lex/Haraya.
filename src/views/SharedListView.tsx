import React from 'react';
import { ChevronLeft, Link2 } from 'lucide-react';
import type { Cafe, Bean } from '../types/coffee';
import { catalogService } from '../services/catalogService';
import { CafeGrid } from '../components/feed/CafeGrid';
import { BeanGrid } from '../components/feed/BeanGrid';
import { userPrefsService } from '../services/userPrefsService';
import { absoluteUrl } from '../utils/router';
import { LargeTitle } from '../components/common/LargeTitle';

interface SharedListViewProps {
  name: string;
  cafeIds: string[];
  beanIds: string[];
  onBack: () => void;
  onSelectCafe: (cafeId: string) => void;
  onDirections: (cafe: Cafe) => void;
  /** Retired bean feature: beans on a list show only when a caller passes this. */
  onSelectBean?: (beanId: string) => void;
}

/**
 * Read-only view of a shared custom list. Items ride in the URL, so the link
 * works across browsers and devices without a backend.
 */
export const SharedListView: React.FC<SharedListViewProps> = ({
  name,
  cafeIds,
  beanIds,
  onBack,
  onSelectCafe,
  onDirections,
  onSelectBean,
}) => {
  const cafes = cafeIds
    .map((id) => catalogService.getCafeById(id))
    .filter((cafe): cafe is Cafe => Boolean(cafe));
  const beans = onSelectBean
    ? beanIds.map((id) => catalogService.getBeanById(id)).filter((bean): bean is Bean => Boolean(bean))
    : [];

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {
      window.prompt('Copy this link:', absoluteUrl(window.location.hash));
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-4 sm:pb-6 space-y-6">
      <div className="space-y-1">
        {/* Pushed-page back button */}
        <button
          onClick={onBack}
          aria-label="Back to Discover"
          className="-ml-2 inline-flex items-center gap-0.5 min-h-11 pr-2 text-[17px] text-[#7D5C3D] ios-press"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.4} />
          Back
        </button>

        <LargeTitle
          title={name}
          subtitle={
            <>
              A shared Haraya list: <span className="font-mono">{cafes.length}</span> cafes,{' '}
              <span className="font-mono">{beans.length}</span> beans
            </>
          }
          trailing={
            <button
              onClick={copyLink}
              className="h-9 px-3.5 rounded-full ios-fill text-[14px] font-semibold text-[#7D5C3D] inline-flex items-center gap-1.5 hover:bg-[#766046]/20 ios-press"
            >
              <Link2 className="w-4 h-4" strokeWidth={2.2} />
              Copy link
            </button>
          }
        />
      </div>

      {cafes.length > 0 && (
        <section className="space-y-3">
          <h2 className="ios-title">Cafes on the list</h2>
          <CafeGrid
            cafes={cafes}
            savedCafeIds={userPrefsService.getSavedCafes()}
            onToggleSave={(cafe) => userPrefsService.toggleSavedCafe(cafe)}
            onSelectCafe={onSelectCafe}
            onDirections={onDirections}
          />
        </section>
      )}

      {onSelectBean && beans.length > 0 && (
        <section className="space-y-3">
          <h2 className="ios-title">Beans on the list</h2>
          <BeanGrid
            beans={beans}
            savedBeanIds={userPrefsService.getSavedBeans()}
            onToggleSave={(bean) => userPrefsService.toggleSavedBean(bean)}
            onSelectBean={onSelectBean}
          />
        </section>
      )}

      {cafes.length === 0 && beans.length === 0 && (
        <div className="py-12 px-6 text-center flex flex-col items-center gap-2">
          <h2 className="ios-title text-[19px] text-[#13191F]">Nothing on this list</h2>
          <p className="text-[14px] text-[#594C3D] max-w-xs">
            This shared list has no items, or they were removed.
          </p>
          <button
            onClick={onBack}
            className="mt-3 h-11 px-5 w-full sm:w-auto rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold hover:bg-[#7D5C3D] ios-press"
          >
            Back to Discover
          </button>
        </div>
      )}
    </div>
  );
};
