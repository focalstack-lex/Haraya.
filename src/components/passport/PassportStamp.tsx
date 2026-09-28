import React, { useId } from 'react';

interface PassportStampProps {
  cafeName: string;
  city: string;
  /** ISO date of the first visit; absent for a ghost stamp (not visited yet). */
  stampedAt?: string | null;
  /** Seeds the small, stable tilt so a grid of stamps looks hand-pressed rather than aligned. */
  seed: string;
  size?: number;
  className?: string;
}

const INK = '#906D4B';
/** Ghost outline: #594C3D at 20% for the ring, a little stronger for the lettering so it still reads. */
const GHOST = 'rgba(89, 76, 61, 0.2)';
const GHOST_TEXT = 'rgba(89, 76, 61, 0.42)';

/** Deterministic tilt between -7 and 7 degrees. */
function tiltFor(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 15) - 7;
}

function fitLabel(text: string, max: number): string {
  const upper = text.toUpperCase();
  return upper.length > max ? `${upper.slice(0, max - 1).trimEnd()}.` : upper;
}

function formatStampDate(iso: string): string {
  const date = new Date(iso);
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `${month} ${date.getDate()} ${date.getFullYear()}`;
}

/**
 * A woodblock ink stamp for one sanctuary: a double ring with the spot name over the top arc and the city
 * under it, a cup mark and the visit date in the middle. Stamped, it is pressed in roasted caramel with a
 * rough, uneven ink edge (an SVG turbulence filter). Unvisited, it is a faint dotted ghost of the same stamp.
 */
export const PassportStamp: React.FC<PassportStampProps> = ({ cafeName, city, stampedAt, seed, size = 104, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const stamped = Boolean(stampedAt);
  const color = stamped ? INK : GHOST;
  const textColor = stamped ? INK : GHOST_TEXT;
  const name = fitLabel(cafeName, 20);
  const place = fitLabel(city, 18);
  const label = stamped
    ? `${cafeName}, ${city}: stamped ${new Date(stampedAt as string).toLocaleDateString('en-PH', { dateStyle: 'medium' })}`
    : `${cafeName}, ${city}: not visited yet`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`shrink-0 ${className}`}
      style={{ transform: `rotate(${stamped ? tiltFor(seed) : 0}deg)` }}
    >
      <defs>
        <path id={`top-${uid}`} d="M 17 60 A 43 43 0 0 1 103 60" />
        <path id={`bottom-${uid}`} d="M 14 60 A 46 46 0 0 0 106 60" />
        {stamped && (
          <filter id={`ink-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
            {/* Rough the edges like a hand-cut block, then knock small gaps out of the ink */}
            <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed={Math.abs(tiltFor(seed)) + 3} result="grain" />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="rough" />
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed={Math.abs(tiltFor(seed)) + 11} result="speckle" />
            <feColorMatrix in="speckle" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.55" result="gaps" />
            <feComposite in="rough" in2="gaps" operator="in" />
          </filter>
        )}
      </defs>

      <g filter={stamped ? `url(#ink-${uid})` : undefined} opacity={stamped ? 0.94 : 1}>
        <circle cx="60" cy="60" r="56" fill="none" stroke={color} strokeWidth={stamped ? 3.2 : 1.6} strokeDasharray={stamped ? undefined : '2 3.2'} />
        <circle cx="60" cy="60" r="35" fill="none" stroke={color} strokeWidth={stamped ? 1.6 : 1.2} strokeDasharray={stamped ? undefined : '2 3.2'} />

        <text fill={textColor} fontSize="9" fontWeight="700" letterSpacing="1.1" fontFamily="var(--font-ui)">
          <textPath href={`#top-${uid}`} startOffset="50%" textAnchor="middle" {...(name.length > 14 ? { textLength: 118, lengthAdjust: 'spacingAndGlyphs' } : {})}>
            {name}
          </textPath>
        </text>
        <text fill={textColor} fontSize="7.5" fontWeight="600" letterSpacing="1.4" fontFamily="var(--font-ui)">
          <textPath href={`#bottom-${uid}`} startOffset="50%" textAnchor="middle">
            {place}
          </textPath>
        </text>
        <circle cx="9.5" cy="60" r="1.8" fill={color} />
        <circle cx="110.5" cy="60" r="1.8" fill={color} />

        {/* Cup mark */}
        <g fill="none" stroke={color} strokeWidth={stamped ? 2.2 : 1.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M48 47h20v6.5a10 10 0 0 1-20 0V47Z" />
          <path d="M68 49.5h2.2a3.4 3.4 0 0 1 0 6.8H67" />
          <path d="M54 43c-1.2-1.4 1.2-2.6 0-4M60 43c-1.2-1.4 1.2-2.6 0-4" className="opacity-80" />
        </g>
        <text x="60" y="80" textAnchor="middle" fill={textColor} fontSize="7" fontWeight="700" letterSpacing="0.8" fontFamily="var(--font-ui)" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {stamped ? formatStampDate(stampedAt as string) : 'NOT YET'}
        </text>
      </g>
    </svg>
  );
};
