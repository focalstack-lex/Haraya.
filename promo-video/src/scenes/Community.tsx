import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Plus } from 'lucide-react';
import { SCENES } from '../timeline';
import { color, gradient } from '../theme';
import { Words } from '../components/Words';
import { GlassCard, Place } from '../components/ui';
import { exitEase, mix, pop, progress, riseEase } from '../lib/motion';

const B = SCENES.community.beats;

const MAP = { width: 1040, height: 420, x: 960, y: 716 };
/** Where the new spot lands on the map card, in card pixels. */
const DROP = { x: 640, y: 236 };

/** Two listed spots already on the map, as small photo pins. */
const EXISTING = [
  { src: 'spots/cool-brews.webp', x: 300, y: 170 },
  { src: 'spots/cafe-vicente.webp', x: 820, y: 300 },
];

const PhotoPin: React.FC<{ src: string; size: number }> = ({ src, size }) => (
  <div style={{ transform: 'translate(-50%, -100%)' }}>
    <div style={{ width: size, height: size, borderRadius: '50%', border: `5px solid ${color.surface}`, overflow: 'hidden', boxShadow: '0 10px 22px -8px rgba(19, 25, 31, 0.4)' }}>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ width: 0, height: 0, margin: '-3px auto 0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: `14px solid ${color.surface}` }} />
  </div>
);

/** 1:05 "Know a spot that is missing? Add it for everyone." A new pin drops onto the map. */
export const Community: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mapIn = progress(frame, B.question + 10, 36, riseEase);
  const fall = pop(frame, B.pin, fps, 210, 10);
  const landed = frame >= B.land;
  const ring = progress(frame, B.land, 32);
  const out = progress(frame, B.out, 26, exitEase);

  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined }}>
      <Place x={960} y={196}>
        <Words text="Know a spot *that is missing?*" at={B.question} size={96} color={color.ink} accentFill={gradient.onLinen} style={{ whiteSpace: 'nowrap' }} />
      </Place>
      <Place x={960} y={318}>
        <Words text="Add it for everyone." at={B.add} size={64} weight={600} color={color.ink2} tracking="-0.03em" style={{ whiteSpace: 'nowrap' }} />
      </Place>

      <Place x={MAP.x} y={MAP.y} opacity={mapIn}>
        <div style={{ transform: `translateY(${(1 - mapIn) * 80}px)` }}>
          <GlassCard width={MAP.width} round={28} style={{ height: MAP.height, position: 'relative' }}>
            <svg width={MAP.width} height={MAP.height} style={{ position: 'absolute', inset: 0 }}>
              <path d="M-20 300 C240 250 520 330 1060 210" stroke={color.peach} strokeWidth={44} fill="none" />
              <path d="M-20 120 H1060 M-20 380 H1060 M180 -20 V440 M520 -20 V440 M880 -20 V440" stroke={color.hairline} strokeWidth={16} fill="none" />
              <path d="M-20 220 C300 200 700 250 1060 90 M340 -20 L700 440" stroke={color.hairline} strokeWidth={9} fill="none" />
            </svg>
            {EXISTING.map((spot) => (
              <div key={spot.src} style={{ position: 'absolute', left: spot.x, top: spot.y }}>
                <PhotoPin src={spot.src} size={72} />
              </div>
            ))}
            {ring > 0 && ring < 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: DROP.x - mix(10, 90, ring),
                  top: DROP.y - mix(4, 36, ring),
                  width: mix(20, 180, ring),
                  height: mix(8, 72, ring),
                  borderRadius: '50%',
                  border: `4px solid ${color.tint}`,
                  opacity: (1 - ring) * 0.8,
                }}
              />
            )}
            {frame >= B.pin && (
              <div
                style={{
                  position: 'absolute',
                  left: DROP.x,
                  top: DROP.y,
                  transform: `translate(-50%, -100%) translateY(${(1 - Math.min(1, fall)) * -360}px) scaleY(${landed ? 1 + Math.max(0, 1 - (frame - B.land) / 8) * -0.12 : 1})`,
                  transformOrigin: '50% 100%',
                  opacity: Math.min(1, fall * 3),
                }}
              >
                <svg width="96" height="124" viewBox="0 0 24 31" style={{ display: 'block', filter: 'drop-shadow(0 12px 14px rgba(19, 25, 31, 0.35))' }}>
                  <path d="M12 30.5s-11-9.2-11-17.9A11 11 0 0 1 12 1.6a11 11 0 0 1 11 11c0 8.7-11 17.9-11 17.9Z" fill={color.tint} stroke={color.surface} strokeWidth="1.4" />
                </svg>
                <span style={{ position: 'absolute', left: 0, right: 0, top: 22, display: 'flex', justifyContent: 'center', color: color.surface }}>
                  <Plus size={40} strokeWidth={2.8} />
                </span>
              </div>
            )}
          </GlassCard>
        </div>
      </Place>

      <Place x={960} y={990}>
        <Words text="Haraya reviews every spot before it goes up." at={B.add + 24} size={34} weight={500} color={color.ink2} tracking="-0.015em" style={{ whiteSpace: 'nowrap' }} />
      </Place>
    </AbsoluteFill>
  );
};
