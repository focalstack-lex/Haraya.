import React from 'react';
import { ArrowLeft, Share2, Copy } from 'lucide-react';
import type { Cafe, Bean } from '../types/coffee';
import { catalogService } from '../services/catalogService';
import { CafeGrid } from '../components/feed/CafeGrid';
import { BeanGrid } from '../components/feed/BeanGrid';
import { userPrefsService } from '../services/userPrefsService';
import { absoluteUrl } from '../utils/router';

interface SharedListViewProps {
  name: string;
  cafeIds: string[];
  beanIds: string[];
  onBack: () => void;
  onSelectCafe: (cafeId: string) => void;
  onSelectBean: (beanId: string) => void;
  onSelectRoastery: (cafeId: string) => void;
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
  onSelectBean,
  onSelectRoastery,
}) => {
  const cafes = cafeIds
    .map((id) => catalogService.getCafeById(id))
    .filter((cafe): cafe is Cafe => Boolean(cafe));
  const beans = beanIds
    .map((id) => catalogService.getBeanById(id))
    .filter((bean): bean is Bean => Boolean(bean));

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {
      window.prompt('Copy this link:', absoluteUrl(window.location.hash));
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold font-sans text-[#55615D] hover:text-[#1A2225] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Discover
      </button>

      <div className="relative overflow-hidden bg-[#1A2225] text-[#FFF9E9] p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-cooper text-2xl sm:text-3xl font-bold tracking-tight">{name}</h1>
            <p className="text-xs text-[#FFF9E9]/70 font-sans">
              A shared Haraya list: {cafes.length} cafes, {beans.length} beans
            </p>
          </div>
          <button
            onClick={copyLink}
            className="h-10 px-5 rounded-full bg-[#FFF9E9] text-[#1A2225] text-xs font-bold font-sans inline-flex items-center gap-2 hover:bg-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Link
          </button>
        </div>
      </div>

      {cafes.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-cooper text-lg font-bold text-[#1A2225]">Cafes on the List</h2>
          <CafeGrid
            cafes={cafes}
            savedCafeIds={userPrefsService.getSavedCafes()}
            onToggleSave={(cafe) => userPrefsService.toggleSavedCafe(cafe)}
            onSelectCafe={onSelectCafe}
            onSelectRoastery={onSelectRoastery}
          />
        </section>
      )}

      {beans.length > 0 && (
        <section className="space-y-3">
          <h2 className="inline-flex items-center gap-2 font-cooper text-lg font-bold text-[#1A2225]">
            <Share2 className="w-4.5 h-4.5 text-[#C86428]" />
            Beans on the List
          </h2>
          <BeanGrid
            beans={beans}
            savedBeanIds={userPrefsService.getSavedBeans()}
            onToggleSave={(bean) => userPrefsService.toggleSavedBean(bean)}
            onSelectBean={onSelectBean}
          />
        </section>
      )}

      {cafes.length === 0 && beans.length === 0 && (
        <p className="text-sm font-sans text-[#55615D] py-10 text-center">
          This shared list has no items, or they were removed by the roaster.
        </p>
      )}
    </div>
  );
};
