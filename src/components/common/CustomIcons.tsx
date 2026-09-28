import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Haraya Custom Icon Set: high-precision vector icons tailored for the Davao
 * specialty coffee interface. Stroke style matches the system standard
 * (1.8 stroke, round caps, round joins) in River Styx and Tanned Wood palette.
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
    <path d="M9.5 5.5c3.5 3.5 1.5 9.5 5 13" />
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

// 9. Ceramic Cup & Latte Foam Icon (All Pours / House Pour)
export const CeramicCupIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3.5 8h13v5.5a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5V8Z" />
    <path d="M16.5 10h1.5a2.5 2.5 0 0 1 0 5h-1.5" />
    <path d="M2 20.5h16" />
    <path d="M8 5.5c.5-1 1-1.5 1.8-1.5s1.2.5 1.7 1.5" className="opacity-70" />
  </svg>
);

// 10. V60 Conical Dripper & Server Icon (Manual Pour Over)
export const V60DripperIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 4h15l-4.5 7.5h-6L4.5 4Z" />
    <path d="M3 4h18" />
    <path d="M8.5 11.5 7 18.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5l-1.5-7" />
    <path d="M12 6.5v3" className="opacity-65" />
  </svg>
);

// 11. Commercial Espresso Portafilter Icon (Espresso Bar)
export const PortafilterIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 6.5h8v3.5a4 4 0 0 1-8 0V6.5Z" />
    <path d="M12 8h8a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1h-8" />
    <path d="M6 13.5v2.5M10 13.5v2.5" className="opacity-70" />
  </svg>
);

// 12. Kyoto Cold Drip Tower & Carafe Icon (Cold Brew / Iced Pours)
export const ColdDripIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 3.5h10v3a5 5 0 0 1-10 0v-3Z" />
    <path d="M12 10v2" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
    <path d="M7.5 16h9l-1 4.5a1 1 0 0 1-1 .9h-5a1 1 0 0 1-1-.9L7.5 16Z" />
  </svg>
);

// 13. Mt. Apo Terroir & Coffee Branch Icon (Single Origin)
export const MtApoOriginIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 20 8.5-13 4 6 2.5-3.5 5 10.5H2Z" />
    <path d="m8 11 2.5 3.5 3-2 1.5 2" className="opacity-65" />
    <circle cx="17.5" cy="7.5" r="1.5" className="text-[#CA9C68]" />
  </svg>
);

// 14. Roasting Drum Cylinder Icon (Micro-Roasteries)
export const RoasterDrumIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" className="opacity-70" />
    <path d="M12 4v2M12 18v2M4 12h2M18 12h2" className="opacity-60" />
    <path d="M10 11.5c1.2-1 2.8-1 4 0" />
  </svg>
);

// 15. Specialty Cupping Spoon & Aroma Icon (Visited & Rated Tasting Reviews)
export const CuppingSpoonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="8" cy="8" rx="5" ry="4.5" />
    <path d="M11.5 11.5 20 20" />
    <path d="M18.5 18.5a1.5 1.5 0 0 1-2.1-2.1l1-1" />
    <path d="M5.5 3.5c0-1 .8-1.5 1.5-1.5s1 .5 1.5 1.5" className="opacity-70" />
  </svg>
);

// 16. Valve Coffee Bag Icon (Saved Wishlist)
export const CoffeeBagIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 7h12l-1.5 13.5a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5L6 7Z" />
    <path d="M7 4h10v3H7V4Z" />
    <circle cx="12" cy="13" r="1.5" />
  </svg>
);

// 17. Topographic Trail & Route Icon (Davao Map & Hops)
export const TopoTrailIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 17c4-1 6-4 9-4s5 2 9 0" />
    <path d="M3 11c4-1 6-4 9-4s5 2 9 0" className="opacity-60" />
    <circle cx="6" cy="16" r="1.8" fill="currentColor" />
    <circle cx="18" cy="13" r="1.8" fill="currentColor" />
  </svg>
);

// 18. Wax Stamp Seal & Bean Icon (Coffee Explorer Pass)
export const WaxStampSealIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.5 9.5 0 0 0 12 2.5Z" />
    <circle cx="12" cy="12" r="6" className="opacity-70" />
    <path d="M10.5 9.5c1.5 1.5 1 4 2.5 5.5" />
  </svg>
);

// 19. Cupper Rating Star Icon (8-point SCA grade star)
export const CupperStarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 14.8 8.5 21.8 9.3 16.5 14 18.2 21 12 17.2 5.8 21 7.5 14 2.2 9.3 9.2 8.5 12 2" />
  </svg>
);
