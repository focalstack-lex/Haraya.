import React, { useMemo, useState } from 'react';
import { Eye, Bookmark, Package, Flame, LogOut, Store, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Account } from '../../types/auth';
import type { Bean, Cafe, MenuItem, RoastDrop, BeanReservation } from '../../types/coffee';
import { roasterService } from '../../services/roasterService';
import { catalogService } from '../../services/catalogService';
import { useCatalogVersion } from '../../hooks/useServiceVersions';
import { BeanForm } from './BeanForm';
import { RoastScheduleTab } from './RoastScheduleTab';
import { DropCountdownTimer } from '../drops/DropCountdownTimer';
import { TextInput, SelectInput, PrimaryButton } from '../common/FormControls';
interface RoasterDashboardProps {
  account: Account;
  onSignOut: () => void;
  onViewStorefront: (cafeId: string) => void;
}

type DashboardTab = 'overview' | 'beans' | 'schedule' | 'menu' | 'inbox';

const MENU_CATEGORIES: MenuItem['category'][] = ['Espresso Bar', 'Filter', 'Signature', 'Pastry'];

/** Roaster Suite: overview analytics, bean inventory, roast schedule, menu, inbox. */
export const RoasterDashboard: React.FC<RoasterDashboardProps> = ({ account, onSignOut, onViewStorefront }) => {
  const catalogVersion = useCatalogVersion();
  const [tab, setTab] = useState<DashboardTab>('overview');
  const [beanFormOpen, setBeanFormOpen] = useState(false);
  const [editBean, setEditBean] = useState<Bean | null>(null);
  const [dashboardError, setDashboardError] = useState('');

  const cafe: Cafe = useMemo(() => roasterService.getMyCafe(account), [account]);
  const beans: Bean[] = useMemo(() => catalogService.getBeansByRoaster(cafe.id), [cafe.id]);
  const drops: RoastDrop[] = useMemo(() => catalogService.getDropsByRoaster(cafe.id), [cafe.id]);
  const reservations: BeanReservation[] = useMemo(
    () => catalogService.getReservationsByRoaster(cafe.id),
    [cafe.id]
  );
  const metrics = useMemo(() => catalogService.getMetrics(cafe.id), [cafe.id]);

  const newReservations = reservations.filter((reservation) => reservation.status === 'new').length;
  const lowStock = beans.filter((bean) => bean.bagsInStock <= 10);

  // Menu manager draft
  const [menuDraft, setMenuDraft] = useState<MenuItem[]>(() => catalogService.getEffectiveMenu(cafe));
  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuCategory, setMenuCategory] = useState<MenuItem['category']>('Espresso Bar');

  React.useEffect(() => {
    setMenuDraft(catalogService.getEffectiveMenu(cafe));
  }, [cafe, catalogVersion]);

  const statCard = (label: string, value: string, Icon: typeof Eye) => (
    <div className="rounded-2xl bg-[#FFFDF9] border border-[#E4D9C8] p-4 space-y-1">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#594C3D] font-sans">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="block font-cooper text-2xl font-bold text-[#13191F]">{value}</span>
    </div>
  );

  const tabButton = (id: DashboardTab, label: string, badge?: number) => (
    <button
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={`h-10 px-4 rounded-full inline-flex items-center gap-2 text-xs font-bold font-sans transition-colors ${
        tab === id ? 'bg-[#13191F] text-[#FFFDF9]' : 'bg-[#F2EAE0] border border-[#E4D9C8] text-[#13191F] hover:bg-[#E4D9C8]'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="h-4 min-w-4 px-1 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );

  const peakViews = Math.max(...metrics.days.map((day) => day.views), 1);

  const saveMenu = () => {
    try {
      catalogService.updateMenu(cafe.id, menuDraft);
      setDashboardError('');
    } catch (cause) {
      setDashboardError(cause instanceof Error ? cause.message : 'Could not save the menu.');
    }
  };

  const addMenuItem = () => {
    const priceValue = Number(menuPrice);
    if (!menuName.trim() || !Number.isFinite(priceValue) || priceValue <= 0) {
      setDashboardError('Menu item needs a name and a price above zero.');
      return;
    }
    setMenuDraft([
      ...menuDraft,
      { name: menuName.trim(), price: Math.round(priceValue), category: menuCategory },
    ]);
    setMenuName('');
    setMenuPrice('');
    setDashboardError('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden bg-[#13191F] text-[#FFFDF9] p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="font-cooper text-2xl sm:text-3xl font-bold tracking-tight truncate">{cafe.name}</h1>
            <p className="text-xs font-sans text-[#FFFDF9]/70">
              Roaster Suite : {cafe.district}, {cafe.city} : signed in as {account.email}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onViewStorefront(cafe.id)}
              className="h-10 px-5 rounded-full bg-[#FFFDF9] text-[#13191F] text-xs font-bold font-sans inline-flex items-center gap-2 hover:bg-white transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              View Storefront
            </button>
            <button
              onClick={onSignOut}
              className="h-10 px-5 rounded-full border border-[#FFFDF9]/25 text-xs font-bold font-sans inline-flex items-center gap-2 hover:bg-[#FFFDF9]/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabButton('overview', 'Overview')}
        {tabButton('beans', `Beans (${beans.length})`)}
        {tabButton('schedule', `Schedule (${drops.length})`)}
        {tabButton('menu', 'Menu')}
        {tabButton('inbox', 'Inbox', newReservations)}
      </div>

      {dashboardError && (
        <p role="alert" className="text-xs font-sans text-[#8C3A2E] bg-[#8C3A2E]/10 border border-[#8C3A2E]/25 rounded-xl px-3 py-2">
          {dashboardError}
        </p>
      )}

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCard('Profile Views', metrics.totalViews.toLocaleString(), Eye)}
            {statCard('Saves', metrics.totalSaves.toLocaleString(), Bookmark)}
            {statCard('Bean Lots', String(beans.length), Package)}
            {statCard('Batches', String(drops.length), Flame)}
          </div>

          <div className="rounded-2xl bg-[#FFFDF9] border border-[#E4D9C8] p-4 sm:p-5 space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#594C3D] font-sans">
              Views, last 14 days
            </h2>
            <div className="flex items-end gap-1 h-24">
              {metrics.days.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full rounded-t-md bg-[#906D4B]/80 group-hover:bg-[#906D4B] transition-colors"
                    style={{ height: `${Math.max(4, (day.views / peakViews) * 100)}%` }}
                  />
                  <span className="text-[8px] font-sans text-[#594C3D]">{day.date.slice(8)}</span>
                  <span className="pointer-events-none absolute -top-7 hidden group-hover:block px-2 py-0.5 rounded-full bg-[#13191F] text-[#FFFDF9] text-[9px] font-sans font-bold whitespace-nowrap">
                    {day.views} views
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E4D9C8] p-4 space-y-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#594C3D] font-sans">Upcoming Batches</h2>
              {drops.filter((drop) => new Date(drop.dropAt).getTime() > Date.now()).length === 0 ? (
                <p className="text-xs font-sans text-[#594C3D]">Nothing scheduled. Open the Schedule tab.</p>
              ) : (
                drops
                  .filter((drop) => new Date(drop.dropAt).getTime() > Date.now())
                  .slice(0, 3)
                  .map((drop) => (
                    <div key={drop.id} className="flex items-center justify-between gap-2 text-xs font-sans border-b border-dashed border-[#E4D9C8] pb-1.5 last:border-0">
                      <span className="truncate font-semibold text-[#13191F]">{drop.title}</span>
                      <DropCountdownTimer dropAt={drop.dropAt} compact />
                    </div>
                  ))
              )}
            </div>

            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E4D9C8] p-4 space-y-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#594C3D] font-sans">Low Stock (10 bags or fewer)</h2>
              {lowStock.length === 0 ? (
                <p className="text-xs font-sans text-[#594C3D]">All lots above 10 bags.</p>
              ) : (
                lowStock.map((bean) => (
                  <p key={bean.id} className="flex justify-between gap-2 text-xs font-sans border-b border-dashed border-[#E4D9C8] pb-1.5 last:border-0">
                    <span className="truncate text-[#13191F]">{bean.name}</span>
                    <span className="font-bold text-[#7D5C3D] shrink-0">{bean.bagsInStock} left</span>
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Beans inventory */}
      {tab === 'beans' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-cooper text-lg font-bold text-[#13191F]">Bean Inventory</h2>
            <button
              onClick={() => {
                setEditBean(null);
                setBeanFormOpen(true);
              }}
              className="h-10 px-5 rounded-full bg-[#13191F] text-[#FFFDF9] text-xs font-bold font-sans inline-flex items-center gap-2 hover:bg-[#2B2F2E] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Bean Lot
            </button>
          </div>

          {beans.length === 0 ? (
            <p className="text-xs font-sans text-[#594C3D]">No lots on the shelf yet. Publish your first bean.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {beans.map((bean) => (
                <article key={bean.id} className="rounded-2xl bg-[#FFFDF9] border border-[#E4D9C8] p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <img src={bean.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover border border-[#E4D9C8]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-sans font-bold text-[#13191F] truncate">{bean.name}</p>
                      <p className="text-[11px] font-sans text-[#594C3D]">
                        {bean.process}, {bean.roastProfile.roastLevel}, ₱{bean.price}
                      </p>
                      <p className={`text-[11px] font-sans ${bean.bagsInStock <= 10 ? 'text-[#7D5C3D] font-bold' : 'text-[#594C3D]'}`}>
                        {bean.bagsInStock} bags in stock
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditBean(bean);
                        setBeanFormOpen(true);
                      }}
                      className="h-9 px-3.5 rounded-full border border-[#E4D9C8] text-[11px] font-bold font-sans text-[#13191F] inline-flex items-center gap-1.5 hover:bg-[#F2EAE0] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        try {
                          catalogService.deleteBean(bean.id);
                          setDashboardError('');
                        } catch (cause) {
                          setDashboardError(cause instanceof Error ? cause.message : 'Could not delete the lot.');
                        }
                      }}
                      className="h-9 px-3.5 rounded-full border border-[#E4D9C8] text-[11px] font-bold font-sans text-[#13191F] inline-flex items-center gap-1.5 hover:bg-[#F2EAE0] hover:text-[#8C3A2E] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && <RoastScheduleTab roaster={cafe} beans={beans} drops={drops} />}

      {/* Menu manager */}
      {tab === 'menu' && (
        <div className="space-y-3">
          <h2 className="font-cooper text-lg font-bold text-[#13191F]">Menu Manager</h2>
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#E4D9C8] p-4 space-y-2">
            {menuDraft.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center gap-2">
                <TextInput value={item.name} onChange={(value) => setMenuDraft(menuDraft.map((candidate, i) => (i === index ? { ...candidate, name: value } : candidate)))} />
                <TextInput
                  value={String(item.price)}
                  onChange={(value) =>
                    setMenuDraft(menuDraft.map((candidate, i) => (i === index ? { ...candidate, price: Number(value) || 0 } : candidate)))
                  }
                  type="number"
                />
                <SelectInput
                  value={item.category}
                  onChange={(value) =>
                    setMenuDraft(menuDraft.map((candidate, i) => (i === index ? { ...candidate, category: value as MenuItem['category'] } : candidate)))
                  }
                  options={MENU_CATEGORIES.map((category) => ({ value: category, label: category }))}
                />
                <button
                  onClick={() => setMenuDraft(menuDraft.filter((_, i) => i !== index))}
                  aria-label={`Remove ${item.name}`}
                  className="h-10 w-10 shrink-0 rounded-xl border border-[#E4D9C8] flex items-center justify-center text-[#594C3D] hover:text-[#8C3A2E] hover:bg-[#F2EAE0] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {menuDraft.length === 0 && <p className="text-xs font-sans text-[#594C3D]">Menu is empty. Add the first item below.</p>}

            <div className="flex gap-2 pt-2 border-t border-dashed border-[#E4D9C8]">
              <TextInput value={menuName} onChange={setMenuName} placeholder="New item name" />
              <TextInput value={menuPrice} onChange={setMenuPrice} type="number" placeholder="150" />
              <SelectInput
                value={menuCategory}
                onChange={(value) => setMenuCategory(value as MenuItem['category'])}
                options={MENU_CATEGORIES.map((category) => ({ value: category, label: category }))}
              />
              <PrimaryButton onClick={addMenuItem} className="shrink-0">
                <Plus className="w-4 h-4" />
              </PrimaryButton>
            </div>

            <PrimaryButton onClick={saveMenu} className="w-full">
              Save Menu
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* Reservation inbox */}
      {tab === 'inbox' && (
        <div className="space-y-3">
          <h2 className="font-cooper text-lg font-bold text-[#13191F]">Reservation Inbox</h2>
          {reservations.length === 0 ? (
            <p className="text-xs font-sans text-[#594C3D]">No inquiries yet. Reservations from bean lots land here.</p>
          ) : (
            reservations.map((reservation) => (
              <article key={reservation.id} className="rounded-2xl bg-[#FFFDF9] border border-[#E4D9C8] p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-sans font-bold text-[#13191F] truncate">
                      {reservation.name} : {reservation.quantity}x {reservation.packType}
                    </p>
                    <p className="text-[11px] font-sans text-[#594C3D]">
                      {reservation.beanName} : {reservation.contact}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-full font-sans ${
                    reservation.status === 'new'
                      ? 'bg-[#906D4B] text-[#FFFDF9]'
                      : reservation.status === 'contacted'
                        ? 'bg-[#3E5C48]/15 text-[#3E5C48] border border-[#3E5C48]/30'
                        : 'bg-[#F2EAE0] text-[#594C3D] border border-[#E4D9C8]'
                  }`}>
                    {reservation.status}
                  </span>
                </div>
                {reservation.message && <p className="text-xs font-sans text-[#13191F]/85 italic">"{reservation.message}"</p>}
                <div className="flex gap-2">
                  {reservation.status === 'new' && (
                    <button
                      onClick={() => roasterService.setReservationStatus(account, reservation.id, 'contacted')}
                      className="h-9 px-3.5 rounded-full bg-[#13191F] text-[#FFFDF9] text-[11px] font-bold font-sans hover:bg-[#2B2F2E] transition-colors"
                    >
                      Mark Contacted
                    </button>
                  )}
                  {reservation.status !== 'closed' && (
                    <button
                      onClick={() => roasterService.setReservationStatus(account, reservation.id, 'closed')}
                      className="h-9 px-3.5 rounded-full border border-[#E4D9C8] text-[11px] font-bold font-sans text-[#13191F] hover:bg-[#F2EAE0] transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      <BeanForm
        isOpen={beanFormOpen}
        roaster={cafe}
        bean={editBean}
        onClose={() => setBeanFormOpen(false)}
        onSaved={() => setDashboardError('')}
      />
    </div>
  );
};
