import React from 'react';
import { useCurrentFrame } from 'remotion';
import { progress } from '../lib/motion';

/**
 * Concentric rounded rings spreading from a pill, the reference's "10x better" backdrop, in the stage's own tones.
 * Rings are centered on (x, y) and start as the pill's own size.
 */
export const Ripples: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  at: number;
  rings?: number;
  tone: string;
  exitAt?: number;
}> = ({ x, y, width, height, at, rings = 5, tone, exitAt }) => {
  const frame = useCurrentFrame();
  const gone = exitAt === undefined ? 0 : progress(frame, exitAt, 20);
  return (
    <>
      {Array.from({ length: rings }, (_, index) => {
        const ring = rings - index;
        const grow = progress(frame, at + index * 4, 46);
        const spread = ring * height * 0.62 * grow;
        const w = width + spread * 2;
        const h = height + spread * 2;
        return (
          <div
            key={ring}
            style={{
              position: 'absolute',
              left: x - w / 2,
              top: y - h / 2,
              width: w,
              height: h,
              borderRadius: h / 2,
              background: tone,
              opacity: grow * (0.2 + (index / rings) * 0.5) * (1 - gone),
              transform: `scale(${1 + Math.sin((frame - at - index * 8) / 34) * 0.012})`,
            }}
          />
        );
      })}
    </>
  );
};
