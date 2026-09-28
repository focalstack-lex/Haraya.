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
  <article className="group card-lift card-ambient bg-[#FFFDF9] rounded-[20px] overflow-hidden flex flex-col">
    <div className="relative aspect-[4/3] overflow-hidden bg-[#13191F]">
      <img
        src={bean.images[0]}
        alt={`${bean.name} whole bean bag`}
        loading="lazy"
        onClick={() => onSelectBean(bean.id)}
        className="w-full h-full object-cover cursor-pointer"
      />
      <button
        onClick={() => onToggleSave(bean)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${bean.name} from saved` : `Save ${bean.name}`}
        className={`absolute top-1 right-1 h-11 w-11 flex items-center justify-center ios-press active:scale-90 before:absolute before:inset-[5px] before:rounded-full before:transition-colors ${
          saved
            ? 'text-[#FFFDF9] before:bg-[#906D4B]'
            : 'text-[#FFFDF9] before:bg-[#13191F]/45 before:backdrop-blur-md hover:before:bg-[#13191F]/65'
        }`}
      >
        {saved ? <BookmarkCheck className="relative w-4 h-4" /> : <Bookmark className="relative w-4 h-4" />}
      </button>
      {bean.isLimited && (
        <span className="absolute left-2 bottom-2 h-6 px-2.5 rounded-full ios-material-dark text-[#FFFDF9] text-[11px] font-semibold flex items-center">
          Micro-lot
        </span>
      )}
    </div>

    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
      <div className="space-y-1">
        <button onClick={() => onSelectBean(bean.id)} className="block text-left w-full">
          <h3 className="ios-headline text-[#13191F] truncate sm:line-clamp-2 sm:whitespace-normal">{bean.name}</h3>
        </button>
        <p className="ios-footnote text-[#594C3D] truncate">{bean.roasterName}</p>
        <div className="flex items-center gap-1 ios-footnote text-[#594C3D] min-w-0">
          <BeanIcon className="w-3 h-3 shrink-0 text-[#906D4B]" />
          <span className="truncate">{bean.origin}</span>
        </div>
        <div className="hidden sm:flex flex-wrap gap-1 pt-1">
          {bean.tastingNotes.slice(0, 2).map((note) => (
            <span key={note} className="h-5.5 px-2 rounded-full ios-fill text-[11px] font-medium font-sans text-[#594C3D] flex items-center">
              {note}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1.5 ios-hairline-t ios-footnote">
        <span className="font-mono font-semibold text-[#13191F] text-[14px]">
          ₱{bean.price} <span className="font-sans font-normal text-[12px] text-[#594C3D]">/ 250g</span>
        </span>
        <button onClick={() => onSelectBean(bean.id)} className="h-9 px-1 -mr-1 font-semibold text-[#7D5C3D] ios-press">
          Details
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
      <div className="py-16 text-center space-y-2">
        <h3 className="ios-title text-[19px]">{emptyTitle}</h3>
        <p className="text-[14px] font-sans text-[#594C3D] max-w-xs mx-auto">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
