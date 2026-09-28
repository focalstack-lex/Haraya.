import React from 'react';

/**
 * Haraya logo cut from the brand master (Haraya Files/LOGO.webp) with the background keyed out,
 * so it sits on any light surface. 'wordmark' is the mountain and name for bars and menus;
 * 'full' adds the "Find your daily cup." tagline for larger placements.
 */
const VARIANTS = {
  wordmark: { base: '/brand/haraya-wordmark', width: 480, height: 268 },
  full: { base: '/brand/haraya-logo', width: 720, height: 404 },
} as const;

export const BrandLogo: React.FC<{
  variant?: keyof typeof VARIANTS;
  /** Size with a height utility (h-10); width follows the aspect ratio. */
  className?: string;
  eager?: boolean;
}> = ({ variant = 'wordmark', className = 'h-10', eager = false }) => {
  const { base, width, height } = VARIANTS[variant];
  return (
    <picture className="contents">
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img
        src={`${base}.png`}
        alt="Haraya"
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className={`w-auto select-none ${className}`}
      />
    </picture>
  );
};
