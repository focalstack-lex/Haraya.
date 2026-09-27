import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Haraya Custom Icon Set: high-precision vector icons tailored for the Davao
 * specialty coffee interface. Stroke style matches the sibling Habi set
 * (1.8 stroke, round caps) so the two platforms read as one ecosystem.
 */

// 1. Discover / Pour Ring Icon (cup rings radiating over a pour spiral)
export const FeedIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" className="opacity-90" />
    <circle cx="12" cy="12" r="4.5" className="opacity-60" />
    <path d="M12 9.5c1.4.6 1.4 3.4 0 5-1.4-1.6-1.4-4.4 0-5Z" />
    <path d="M12 3v1.6M12 19.4V21" className="opacity-50" />
  </svg>
);

// 2. Bean Drops / Drum Flame Icon (roasting drum with a flame tongue)
export const DropsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="13" r="7" />
    <path d="M11 9.8c1.8 1.4 1.8 4 0 6.4-1.8-2.4-1.8-5 0-6.4Z" />
    <path d="M17 6.5l3-2M19.5 10H23" className="opacity-60" />
  </svg>
);

// 3. Coffee Map / Cup Pin Icon (location pin whose head is a cup rim)
export const MapIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 21s-6.5-5.4-6.5-10.2A6.5 6.5 0 0 1 12 4.5a6.5 6.5 0 0 1 6.5 6.3C18.5 15.6 12 21 12 21Z" />
    <path d="M9.2 10.5h5.6M9.6 10.5c0 1.5 1.1 2.4 2.4 2.4s2.4-.9 2.4-2.4" className="opacity-80" />
  </svg>
);

// 4. Cup Check / Camera Cup Icon (community cup moments)
export const CupCheckIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
    <path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17" className="opacity-80" />
    <path d="M8 6c0-1 .8-1.2.8-2M12 6c0-1 .8-1.2.8-2" className="opacity-70" />
  </svg>
);

// 5. Saved / Bean Bookmark Icon (bookmark with a bean crease)
export const SavedIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6.5 3.5h11V21l-5.5-3.4L6.5 21V3.5Z" />
    <path d="M12 6.5c-1.4 2-1.4 4.6 0 6.6 1.4-2 1.4-4.6 0-6.6Z" className="opacity-70" />
  </svg>
);

// 6. Roaster Suite / Drum Roaster Icon (roasting machine front)
export const RoasterIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3.5" y="7" width="13" height="10" rx="2.5" />
    <circle cx="10" cy="12" r="3" />
    <path d="M16.5 9.5H21M16.5 14.5H19M6 17v2.5M14 17v2.5" className="opacity-75" />
  </svg>
);

// 7. Bean Icon (single bean with center crease, for bean cards and vault)
export const BeanIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(28 12 12)" />
    <path d="M9.5 5.5c3.5 3.5 1.5 9.5 5 13" transform="rotate(0 12 12)" />
  </svg>
);

// 8. Trail Icon (curled hop path between stops)
export const TrailIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 19c6 0 4-6 8-6s5-4 6-9" />
    <circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="4" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);
