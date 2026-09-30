import React from 'react';
import { Search, X } from 'lucide-react';

interface FeedSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/** iOS search field: filled, borderless, with the round clear button once text is entered. */
export const FeedSearchBar: React.FC<FeedSearchBarProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div role="search" data-tour="search" className="flex items-center ios-fill rounded-row h-10 px-2.5 focus-within:shadow-[0_0_0_1.5px_rgba(144,109,75,0.6)] transition-shadow">
      <Search className="w-[18px] h-[18px] text-ink-3 shrink-0 mr-1.5" strokeWidth={2.2} />
      <input
        type="search"
        enterKeyHint="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Cafes, study spots, areas"
        aria-label="Search cafes, study spots and areas"
        className="w-full min-w-0 bg-transparent text-[15px] font-sans text-ink placeholder:text-ink-3 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          aria-label="Clear search"
          className="h-10 w-9 -mr-2 flex items-center justify-center shrink-0"
        >
          <span className="h-[18px] w-[18px] rounded-full bg-ink-3/70 text-surface flex items-center justify-center">
            <X className="w-3 h-3" strokeWidth={3} />
          </span>
        </button>
      )}
    </div>
  );
};
