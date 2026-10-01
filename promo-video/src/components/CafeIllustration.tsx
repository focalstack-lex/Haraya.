import React from 'react';
import { color } from '../theme';

/**
 * A flat drawing of a cafe corner for the owner demo's "Your Cafe" listing. It stands in for the photo an owner
 * uploads, so no real shop's photo is ever shown as someone else's listing. Brand tones only: an arched window
 * onto the mountain from the logo, a tint counter, an ink espresso machine, pendant lamps and a plant.
 */
export const CafeIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
    <defs>
      <linearGradient id="cafe-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color.peach} />
        <stop offset="1" stopColor={color.coffee} />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill={color.sunken} />
    <rect y="470" width="800" height="130" fill={color.hairline} />

    {/* Arched window onto the mountain */}
    <path d="M86 424V206a122 122 0 0 1 244 0v218Z" fill="url(#cafe-sky)" />
    <path d="M86 424l66-86 44 30 58-70 76 82v44Z" fill={color.tan} opacity="0.75" />
    <path d="M190 190c-8-12 8-18 0-30M212 190c-8-12 8-18 0-30" stroke={color.surface} strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.8" />
    <path d="M86 424V206a122 122 0 0 1 244 0v218Z" fill="none" stroke={color.surface} strokeWidth="12" />
    <path d="M208 84v340" stroke={color.surface} strokeWidth="8" />

    {/* Shelf with jars */}
    <path d="M400 208h330" stroke={color.tintInk} strokeWidth="8" strokeLinecap="round" />
    <rect x="428" y="150" width="46" height="58" rx="10" fill={color.tan} />
    <rect x="492" y="164" width="40" height="44" rx="9" fill={color.cream} />
    <rect x="552" y="140" width="50" height="68" rx="11" fill={color.star} />
    <rect x="628" y="158" width="44" height="50" rx="9" fill={color.cream} />

    {/* Pendant lamps with a warm glow */}
    <circle cx="470" cy="118" r="70" fill={color.steam} opacity="0.18" />
    <circle cx="660" cy="118" r="70" fill={color.steam} opacity="0.18" />
    <path d="M470 0v80M660 0v80" stroke={color.ink} strokeWidth="4" />
    <path d="M436 110a34 34 0 0 1 68 0Z" fill={color.ink} />
    <path d="M626 110a34 34 0 0 1 68 0Z" fill={color.ink} />

    {/* Counter, espresso machine and cups */}
    <rect x="360" y="376" width="420" height="96" rx="8" fill={color.tint} />
    <rect x="360" y="376" width="420" height="16" rx="8" fill={color.tintInk} />
    <rect x="560" y="276" width="140" height="102" rx="16" fill={color.ink} />
    <rect x="584" y="300" width="92" height="18" rx="9" fill={color.roast} />
    <path d="M598 344h20M642 344h20" stroke={color.cream} strokeWidth="8" strokeLinecap="round" />
    <path d="M420 350h52v14a22 22 0 0 1-22 22h-8a22 22 0 0 1-22-22Z" fill={color.cream} />
    <path d="M472 356h8a9 9 0 0 1 0 18h-8" stroke={color.cream} strokeWidth="6" fill="none" />
    <path d="M492 360h40v10a16 16 0 0 1-16 16h-8a16 16 0 0 1-16-16Z" fill={color.surface} />

    {/* Plant */}
    <path d="M50 470h78l-10 76H60Z" fill={color.roast} />
    <ellipse cx="72" cy="420" rx="22" ry="52" fill={color.ok} transform="rotate(-24 72 420)" />
    <ellipse cx="106" cy="410" rx="20" ry="56" fill={color.ok} opacity="0.85" transform="rotate(18 106 410)" />
    <ellipse cx="90" cy="386" rx="16" ry="48" fill={color.ok} opacity="0.7" />
  </svg>
);
