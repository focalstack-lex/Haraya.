import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { AyaMascot, type AyaPose } from '@haraya/components/common/AyaMascot';
import { exitEase, pop, progress } from '../lib/motion';

/**
 * Aya from the app's own component, so the video always shows the real character. The app animates her idle
 * with CSS, which a rendered frame cannot follow, so here she is drawn still (`animated={false}`) and every move
 * comes from the frame: a springy pop-up from her feet, a gentle bob, and an optional wiggle.
 */
export const Aya: React.FC<{
  pose: AyaPose;
  size: number;
  /** Frame (inside the scene) she pops up. */
  at: number;
  exitAt?: number;
  bob?: boolean;
  /** Degrees of side-to-side sway, for a wave or a toast. */
  sway?: number;
  style?: React.CSSProperties;
}> = ({ pose, size, at, exitAt, bob = true, sway = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const up = pop(frame, at, fps, 190, 13);
  const gone = exitAt === undefined ? 0 : progress(frame, exitAt, 16, exitEase);
  const local = frame - at;
  const bobY = bob ? Math.sin(local / 21) * size * 0.018 : 0;
  // Squash and stretch as she lands: taller on the way up, wider on the settle
  const stretch = 1 + (up - 1) * 0.35;
  const rotate = sway * Math.sin(local / 11) * Math.min(1, Math.max(0, local / 30));

  if (frame < at) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        transformOrigin: '50% 100%',
        transform: `translateY(${(1 - up) * size * 0.35 + bobY + gone * size * 0.2}px) scale(${up * (1 - gone * 0.3)}) scaleY(${stretch}) scaleX(${2 - stretch}) rotate(${rotate}deg)`,
        opacity: Math.min(1, up * 3) * (1 - gone),
        ...style,
      }}
    >
      <AyaMascot pose={pose} size={size} animated={false} alt="" />
    </div>
  );
};
