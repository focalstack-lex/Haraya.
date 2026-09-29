import React from 'react';
import { ChevronDown } from 'lucide-react';
import { DAVAO_CITIES } from '../../types/coffee';

interface LargeTitleProps {
  title: string;
  /** One line of context under the title. */
  subtitle?: React.ReactNode;
  /** Right-aligned control on the title row (a menu, an action). */
  trailing?: React.ReactNode;
  id?: string;
}

/** iOS large title: the first thing on every primary page, left aligned. */
export const LargeTitle: React.FC<LargeTitleProps> = ({ title, subtitle, trailing, id }) => (
  <div className="flex items-end justify-between gap-3 pt-1">
    <div className="min-w-0">
      <h1 id={id} className="ios-large-title text-balance break-words">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-[14px] text-ink-2">{subtitle}</p>}
    </div>
    {trailing && <div className="shrink-0 pb-0.5">{trailing}</div>}
  </div>
);

/** Pull-down city menu styled as a tinted pill; uses the native picker on touch devices. */
export const CityMenu: React.FC<{ value: string; onChange: (city: string) => void }> = ({ value, onChange }) => (
  <label data-tour="city" className="relative inline-flex items-center gap-1 h-9 pl-3.5 pr-2.5 rounded-full ios-fill text-[14px] font-semibold text-tint-ink ios-press">
    <span className="max-w-[9.5rem] truncate">{value === 'All Davao Region' ? 'All Davao' : value}</span>
    <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Choose city"
      className="absolute inset-0 opacity-0 cursor-pointer"
    >
      {DAVAO_CITIES.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  </label>
);
