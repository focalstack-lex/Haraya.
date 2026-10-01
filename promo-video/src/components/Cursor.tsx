import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { color } from '../theme';
import { glideEase, progress } from '../lib/motion';

export interface CursorKey {
  /** Frame (inside the scene) the cursor arrives at this point. */
  at: number;
  /** Fingertip position in video pixels. */
  x: number;
  y: number;
}

/** Fingertip position at a frame: rests on a key, glides between consecutive keys. */
const positionAt = (keys: CursorKey[], frame: number): { x: number; y: number } => {
  if (frame <= keys[0].at) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.at) {
      const t = glideEase(Math.min(1, Math.max(0, (frame - a.at) / Math.max(1, b.at - a.at))));
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return keys[keys.length - 1];
};

/**
 * Pointing hand drawn in shapes: a surface outline pass, then the ink fill on top, so only the outer silhouette
 * carries the outline. Fingertip is at (17, 2) in its 44 by 50 box.
 */
const HAND_SHAPES = (
  <>
    <rect x="13" y="2" width="8" height="25" rx="4" />
    <rect x="20.2" y="14" width="7.6" height="15" rx="3.8" />
    <rect x="26.8" y="16.2" width="7" height="14" rx="3.5" />
    <rect x="32.8" y="18.8" width="6.2" height="12.5" rx="3.1" />
    <rect x="13" y="21" width="26" height="21" rx="9" />
    <rect x="4.2" y="21.5" width="7.6" height="16" rx="3.8" transform="rotate(-40 8 29.5)" />
    <rect x="16" y="36" width="20" height="10" rx="4" />
  </>
);

const Hand: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={(size * 50) / 44} viewBox="0 0 44 50" style={{ overflow: 'visible', display: 'block' }}>
    <g fill={color.surface} stroke={color.surface} strokeWidth="3.4" strokeLinejoin="round">
      {HAND_SHAPES}
    </g>
    <g fill={color.ink}>{HAND_SHAPES}</g>
    <path d="M24 27.5v4.5M30.2 29v3.6M35.9 30.4v3" stroke="rgba(255, 253, 249, 0.28)" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/**
 * The reference's hand cursor: glides between keys, leans into its motion, and squishes on each tap with a tint
 * ripple under the fingertip.
 */
export const Cursor: React.FC<{ keys: CursorKey[]; taps: number[]; size?: number; hideAt?: number; ripple?: string }> = ({
  keys,
  taps,
  size = 58,
  hideAt,
  ripple = color.tint,
}) => {
  const frame = useCurrentFrame();
  const { x, y } = positionAt(keys, frame);
  const previous = positionAt(keys, frame - 1);
  const lean = Math.max(-14, Math.min(14, (x - previous.x) * 0.9));
  const shown = progress(frame, keys[0].at - 12, 12) * (hideAt === undefined ? 1 : 1 - progress(frame, hideAt, 12));
  const press = Math.max(0, ...taps.map((tap) => interpolate(frame, [tap - 3, tap + 1, tap + 11], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
  const scale = 1 - press * 0.16;
  const tipX = (17 / 44) * size;
  const tipY = (2 / 44) * size;

  return (
    <>
      {taps.map((tap) => {
        const t = progress(frame, tap, 28);
        if (frame < tap || t >= 1) return null;
        const r = 10 + t * 64;
        return (
          <div
            key={tap}
            style={{
              position: 'absolute',
              left: positionAt(keys, tap).x - r,
              top: positionAt(keys, tap).y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              border: `3px solid ${ripple}`,
              background: 'rgba(144, 109, 75, 0.14)',
              opacity: (1 - t) * 0.9 * shown,
              pointerEvents: 'none',
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: x - tipX,
          top: y - tipY,
          opacity: shown,
          transform: `rotate(${lean}deg) scale(${scale})`,
          transformOrigin: `${tipX}px ${tipY}px`,
          filter: 'drop-shadow(0 10px 14px rgba(19, 25, 31, 0.3))',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        <Hand size={size} />
      </div>
    </>
  );
};
