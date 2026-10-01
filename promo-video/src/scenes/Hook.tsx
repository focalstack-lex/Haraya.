import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { DoorOpen, Plug, VolumeX } from 'lucide-react';
import { SCENES } from '../timeline';
import { color, gradient } from '../theme';
import { Words } from '../components/Words';
import { DarkChip, Place } from '../components/ui';
import { exitEase, mix, pop, progress, riseEase } from '../lib/motion';

const B = SCENES.hook.beats;
const ICON = { size: 34, strokeWidth: 2.2 } as const;

/** What a visitor actually picks a cafe for, from the landing page: a free plug, a quiet table, a door still open. */
const CHIPS = [
  { label: 'A free plug', icon: <Plug {...ICON} />, at: B.chip1 },
  { label: 'A quiet table', icon: <VolumeX {...ICON} />, at: B.chip2 },
  { label: 'A door that is still open', icon: <DoorOpen {...ICON} />, at: B.chip3 },
];

/** 0:00 Dark. "Not just the closest cafe." then the three things that matter more. */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lift = progress(frame, B.pivot, 40, riseEase);
  // At the end everything rushes past the camera and out of focus
  const out = progress(frame, B.out, 46, exitEase);

  return (
    <AbsoluteFill style={{ transform: `scale(${1 + out * 0.4})`, filter: out > 0 ? `blur(${out * 20}px)` : undefined, opacity: 1 - out }}>
      <Place x={960} y={mix(540, 352, lift)} scale={mix(1, 0.62, lift)} opacity={mix(1, 0.55, lift)}>
        <Words text="~Not just the~ closest cafe." at={B.line} size={116} color={color.surface} style={{ whiteSpace: 'nowrap' }} />
      </Place>

      <Place x={960} y={518}>
        <Words text="*The one with*" at={B.pivot + 12} size={92} weight={700} color={color.surface} accentFill={gradient.onDark} style={{ whiteSpace: 'nowrap' }} />
      </Place>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', gap: 34 }}>
        {CHIPS.map((chip, index) => {
          const s = pop(frame, chip.at, fps, 200, 14);
          const float = Math.sin((frame - chip.at) / 28 + index * 1.7) * 7;
          return (
            <div
              key={chip.label}
              style={{
                transform: `translateY(${(1 - s) * 90 + (frame > chip.at ? float : 0)}px) scale(${0.55 + 0.45 * s})`,
                opacity: Math.min(1, Math.max(0, s * 2)),
                filter: s < 0.98 ? `blur(${Math.max(0, 1 - s) * 12}px)` : undefined,
              }}
            >
              <DarkChip label={chip.label} icon={chip.icon} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
