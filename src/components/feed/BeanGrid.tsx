import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { BeanIcon } from '../common/CustomIcons';
import type { Bean } from '../../types/coffee';

interface BeanGridProps {
  beans: Bean[];
  savedBeanIds: string[];
  onToggleSave: (bean: Bean) => void;
  onSelectBean: (beanId: string) => void;
  emptyTitle?: string;
  emptyBody?: string;
}

const BeanCard: React.FC<{
  bean: Bean;
  saved: boolean;
  onToggleSave: (bean: Bean) => void;
  onSelectBean: (beanId: string) => void;
}> = ({ bean, saved, onToggleSave, onSelectBean }) => (
  <article className="group bg-[#FFF9E9] border border-[#E6DCC0] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#1A2225]/30 transition-all">
    <div className="relative aspect-[4/3] overflow-hidden bg-[#1A2225]">
      <img
        src={bean.images[0]}
        alt={`${bean.name} whole bean bag`}
        loading="lazy"
        onClick={() => onSelectBean(bean.id)}
        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
      />
      <button
        onClick={() => onToggleSave(bean)}
        aria-label={saved ? `Remove ${bean.name} from saved` : `Save ${bean.name}`}
        className={`absolute top-2.5 right-2.5 h-9 w-9 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors ${
          saved ? 'bg-[#C86428] border-[#C86428] text-[#FFF9E9]' : 'bg-[#1A2225]/60 border-[#FFF9E9]/25 text-[#FFF9E9]'
        }`}
      >
        {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>
      {bean.isLimited && (
        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-[#C86428] px-2.5 py-1 text-[9px] font-bold tracking-widest text-[#FFF9E9]">
          LIMITED MICRO-LOT
        </span>
      )}
    </div>

    <div className="p-3 sm:p-4 space-y-2">
      <button onClick={() => onSelectBean(bean.id)} className="block text-left w-full">
        <h3 className="font-cooper text-sm sm:text-base font-bold text-[#1A2225] leading-snug line-clamp-2 group-hover:underline underline-offset-2">
          {bean.name}
        </h3>
      </button>
      <div className="flex items-center gap-1.5 text-[11px] font-sans text-[#55615D]">
        <BeanIcon className="w-3 h-3 shrink-0" />
        <span className="truncate">
          {bean.roasterName} : {bean.origin}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {bean.tastingNotes.slice(0, 3).map((note) => (
          <span key={note} className="h-6 px-2 rounded-full bg-[#C86428]/10 border border-[#C86428]/30 text-[9px] font-bold font-sans text-[#A34F1E] flex items-center tracking-wide">
            {note}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#E6DCC0] text-[11px] font-sans">
        <span className="font-bold text-[#1A2225]">P{bean.price} <span className="font-normal text-[#55615D]">/ 250g</span></span>
        <button onClick={() => onSelectBean(bean.id)} className="font-bold text-[#C86428] hover:underline">
          Inspect Lot
        </button>
      </div>
    </div>
  </article>
);

export const BeanGrid: React.FC<BeanGridProps> = ({
  beans,
  savedBeanIds,
  onToggleSave,
  onSelectBean,
  emptyTitle = 'No beans in this roast window',
  emptyBody = 'Loosen a process or roast filter to see more of the vault.',
}) => {
  if (beans.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <h3 className="font-cooper text-xl font-bold text-[#1A2225]">{emptyTitle}</h3>
        <p className="text-sm font-sans text-[#55615D] max-w-sm mx-auto">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
      {beans.map((bean) => (
        <BeanCard
          key={bean.id}
          bean={bean}
          saved={savedBeanIds.includes(bean.id)}
          onToggleSave={onToggleSave}
          onSelectBean={onSelectBean}
        />
      ))}
    </div>
  );
};
