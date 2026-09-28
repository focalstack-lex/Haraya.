import React, { useMemo, useState } from 'react';
import { Bookmark, Bean as BeanLucide, ListChecks, Share2, Trash2, Plus, BellRing, Link2, Check } from 'lucide-react';
import type { Cafe, Bean } from '../types/coffee';
import { userPrefsService } from '../services/userPrefsService';
import { catalogService } from '../services/catalogService';
import { useCatalogVersion, usePrefsVersion } from '../hooks/useServiceVersions';
import { CafeGrid } from '../components/feed/CafeGrid';
import { BeanGrid } from '../components/feed/BeanGrid';
import { DropCountdownTimer } from '../components/drops/DropCountdownTimer';
import { PrimaryButton, TextInput } from '../components/common/FormControls';
import { absoluteUrl, buildHash } from '../utils/router';

export type SavedTab = 'cafes' | 'beans' | 'lists';

interface SavedViewProps {
  initialTab: SavedTab;
  onSelectCafe: (cafeId: string) => void;
  onSelectBean: (beanId: string) => void;
  onSelectRoastery: (cafeId: string) => void;
  onExploreDrops: () => void;
  onExploreFeed: () => void;
}

/** Tasting journal: bookmarked cafes and beans, drop alerts, custom shareable lists. */
export const SavedView: React.FC<SavedViewProps> = ({
  initialTab,
  onSelectCafe,
  onSelectBean,
  onExploreDrops,
  onExploreFeed,
}) => {
  useCatalogVersion();
  usePrefsVersion();
  const [tab, setTab] = useState<SavedTab>(initialTab);
  const [newListName, setNewListName] = useState('');
  const [copiedListId, setCopiedListId] = useState<string | null>(null);

  const savedCafeIds = userPrefsService.getSavedCafes();
  const savedBeanIds = userPrefsService.getSavedBeans();
  const reminderIds = userPrefsService.getReminders();

  const cafes = useMemo(
    () => savedCafeIds.map((id) => catalogService.getCafeById(id)).filter((cafe): cafe is Cafe => Boolean(cafe)),
    [savedCafeIds.join(',')]
  );
  const beans = useMemo(
    () => savedBeanIds.map((id) => catalogService.getBeanById(id)).filter((bean): bean is Bean => Boolean(bean)),
    [savedBeanIds.join(',')]
  );
  const alertedDrops = useMemo(
    () =>
      catalogService
        .getDrops()
        .filter((drop) => reminderIds.includes(drop.id))
        .map((drop) => ({ drop, bean: catalogService.getBeanById(drop.beanId) })),
    [reminderIds.join(',')]
  );

  const lists = userPrefsService.getLists();

  const createList = () => {
    try {
      userPrefsService.createList(newListName);
      setNewListName('');
    } catch (cause) {
      console.error('List creation failed', cause);
    }
  };

  const shareList = (listId: string) => {
    const list = userPrefsService.getList(listId);
    if (!list) return;
    const slug = list.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'list';
    const hash = buildHash(`/list/${slug}`, {
      name: list.name,
      cafes: list.cafeIds.join(','),
      beans: list.beanIds.join(','),
    });
    const url = absoluteUrl(hash);
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedListId(listId);
        window.setTimeout(() => setCopiedListId(null), 2000);
      })
      .catch(() => {
        window.prompt('Copy this share link:', url);
      });
  };

  const tabButton = (id: SavedTab, label: string, Icon: typeof Bookmark) => (
    <button
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={`h-9 px-4 rounded-full inline-flex items-center gap-1.5 text-xs font-bold font-sans transition-colors ${
        tab === id ? 'bg-[#1A2225] text-[#FFF9E9]' : 'bg-[#F3ECD8] border border-[#E6DCC0] text-[#1A2225] hover:bg-[#E6DCC0]'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      <div className="relative overflow-hidden bg-[#1A2225] text-[#FFF9E9] p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl space-y-2">
        <h1 className="font-cooper text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Tasting Journal</h1>
        <p className="text-xs sm:text-sm lg:text-base text-[#FFF9E9]/75 max-w-2xl font-sans leading-relaxed">
          Your bookmarked cafes, saved micro-lots, drop alerts, and custom lists. Share any list with one link.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabButton('cafes', `Cafes (${cafes.length})`, Bookmark)}
        {tabButton('beans', `Beans (${beans.length})`, BeanLucide)}
        {tabButton('lists', `Lists (${lists.length})`, ListChecks)}
      </div>

      {tab === 'cafes' && (
        <CafeGrid
          cafes={cafes}
          savedCafeIds={savedCafeIds}
          onToggleSave={(cafe) => userPrefsService.toggleSavedCafe(cafe)}
          onSelectCafe={onSelectCafe}
          onDirections={(cafe) => onSelectCafe(cafe.id)}
          emptyTitle="No saved cafes yet"
          emptyBody="Tap the bookmark on any cafe card to keep it here."
          emptyAction={{ label: 'Discover Cafes', onClick: onExploreFeed }}
        />
      )}

      {tab === 'beans' && (
        <div className="space-y-6">
          <BeanGrid
            beans={beans}
            savedBeanIds={savedBeanIds}
            onToggleSave={(bean) => userPrefsService.toggleSavedBean(bean)}
            onSelectBean={onSelectBean}
            emptyTitle="No saved beans yet"
            emptyBody="Save a micro-lot from the Fresh Beans feed to track it here."
          />

          <section className="space-y-3">
            <h2 className="inline-flex items-center gap-2 font-cooper text-lg font-bold text-[#1A2225]">
              <BellRing className="w-4.5 h-4.5 text-[#C86428]" />
              Drop Alerts
            </h2>
            {alertedDrops.length === 0 ? (
              <p className="text-xs font-sans text-[#55615D]">
                No alerts yet. Hit "Remind me" on any roast drop and the countdown lands here.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {alertedDrops.map(({ drop, bean }) => (
                  <article key={drop.id} className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-sans font-bold text-[#1A2225] truncate">{bean?.name ?? drop.title}</span>
                      <button
                        onClick={() => userPrefsService.toggleReminder(drop.id)}
                        aria-label="Remove alert"
                        className="text-[10px] font-bold font-sans text-[#55615D] hover:text-[#8C3A2E] shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] font-sans text-[#55615D]">{drop.roasterName}</p>
                    <div className="flex items-center justify-between gap-2">
                      <DropCountdownTimer dropAt={drop.dropAt} compact />
                      <button onClick={onExploreDrops} className="text-[11px] font-bold font-sans text-[#C86428] hover:underline">
                        Open Calendar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'lists' && (
        <div className="space-y-4">
          <div className="flex gap-2 max-w-md">
            <TextInput value={newListName} onChange={setNewListName} placeholder="New list: Work Cafes with Good WiFi" />
            <PrimaryButton onClick={createList} disabled={!newListName.trim()} className="shrink-0">
              <Plus className="w-4 h-4" />
            </PrimaryButton>
          </div>

          {lists.length === 0 ? (
            <p className="text-xs font-sans text-[#55615D]">
              Custom lists hold cafes and beans together: a weekend pour-over wishlist, an office crawl plan,
              anything. Create one above, then add items from any cafe or bean sheet.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lists.map((list) => {
                const listCafes = list.cafeIds
                  .map((id) => catalogService.getCafeById(id))
                  .filter((cafe): cafe is Cafe => Boolean(cafe));
                const listBeans = list.beanIds
                  .map((id) => catalogService.getBeanById(id))
                  .filter((bean): bean is Bean => Boolean(bean));
                return (
                  <article key={list.id} className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-cooper text-base font-bold text-[#1A2225] leading-snug">{list.name}</h3>
                      <span className="text-[10px] font-sans text-[#55615D] shrink-0">
                        {listCafes.length + listBeans.length} items
                      </span>
                    </div>

                    {listCafes.length === 0 && listBeans.length === 0 && (
                      <p className="text-[11px] font-sans text-[#55615D]">
                        Empty list. Add cafes and beans from their detail sheets.
                      </p>
                    )}

                    <ul className="space-y-1">
                      {listCafes.map((cafe) => (
                        <li key={cafe.id} className="flex items-center justify-between gap-2 text-[11px] font-sans">
                          <button onClick={() => onSelectCafe(cafe.id)} className="font-semibold text-[#1A2225] hover:underline truncate">
                            {cafe.name}
                          </button>
                          <button
                            onClick={() => userPrefsService.removeCafeFromList(list.id, cafe.id)}
                            aria-label={`Remove ${cafe.name}`}
                            className="text-[#55615D] hover:text-[#8C3A2E] shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                      {listBeans.map((bean) => (
                        <li key={bean.id} className="flex items-center justify-between gap-2 text-[11px] font-sans">
                          <button onClick={() => onSelectBean(bean.id)} className="font-semibold text-[#1A2225] hover:underline truncate">
                            {bean.name}
                          </button>
                          <button
                            onClick={() => userPrefsService.removeBeanFromList(list.id, bean.id)}
                            aria-label={`Remove ${bean.name}`}
                            className="text-[#55615D] hover:text-[#8C3A2E] shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => shareList(list.id)}
                        className="h-9 px-3.5 rounded-full bg-[#1A2225] text-[#FFF9E9] text-[11px] font-bold font-sans inline-flex items-center gap-1.5 hover:bg-[#26302F] transition-colors"
                      >
                        {copiedListId === list.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                        {copiedListId === list.id ? 'Link Copied' : 'Share Link'}
                      </button>
                      <button
                        onClick={() => userPrefsService.deleteList(list.id)}
                        className="h-9 px-3.5 rounded-full border border-[#E6DCC0] text-[11px] font-bold font-sans text-[#55615D] inline-flex items-center gap-1.5 hover:bg-[#F3ECD8] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p className="text-[10px] font-sans text-[#55615D] inline-flex items-center gap-1.5">
            <Link2 className="w-3 h-3" />
            Shared links open the list on any device. Items live in the link itself.
          </p>
        </div>
      )}

      {tab === 'cafes' && cafes.length > 0 && <RecentlyViewedSection onSelectBean={onSelectBean} onSelectCafe={onSelectCafe} />}
    </div>
  );
};

const RecentlyViewedSection: React.FC<{ onSelectCafe: (id: string) => void; onSelectBean: (id: string) => void }> = ({
  onSelectCafe,
  onSelectBean,
}) => {
  const recent = userPrefsService
    .getRecentViews()
    .map((id) => catalogService.getCafeById(id) ?? catalogService.getBeanById(id))
    .filter((record): record is Cafe | Bean => Boolean(record))
    .slice(0, 8);

  if (recent.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#55615D] font-sans">Recently Inspected</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-2 sm:mx-0 sm:px-0">
        {recent.map((record) => (
          <button
            key={record.id}
            onClick={() => ('handle' in record ? onSelectCafe(record.id) : onSelectBean(record.id))}
            className="shrink-0 w-28 space-y-1.5 text-left group"
          >
            <img
              src={record.images[0]}
              alt=""
              className="h-20 w-28 rounded-xl object-cover border border-[#E6DCC0] group-hover:border-[#1A2225]/40 transition-colors"
              loading="lazy"
            />
            <span className="block text-[10px] font-sans font-bold text-[#1A2225] truncate">{record.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
