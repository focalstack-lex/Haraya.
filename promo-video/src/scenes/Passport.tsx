import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PassportStamp } from '@haraya/components/passport/PassportStamp';
import { SCENES } from '../timeline';
import { color, gradient } from '../theme';
import { fontFamily } from '../fonts';
import { Words } from '../components/Words';
import { Aya } from '../components/Aya';
import { GlassCard, Place } from '../components/ui';
import { exitEase, glideEase, mix, progress, riseEase } from '../lib/motion';

const B = SCENES.passport.beats;

/**
 * The ten listed Digos spots, stamped one first, as the Passport tab orders them (the capture shows this order).
 * Ids are the app's own, so each ghost stamp keeps the tilt the app gives it.
 */
const SPOTS = [
  { id: 'curated-green-coffee-digos', name: 'Green Coffee' },
  { id: 'osm-n13168672184', name: 'Café Vicente' },
  { id: 'osm-n13049364628', name: "Cely's Cafe" },
  { id: 'digos-cool-brews', name: 'Cool Brews' },
  { id: 'osm-w1431054042', name: 'G&Co. Cafe' },
  { id: 'digos-infinitea', name: 'Infinitea' },
  { id: 'digos-kaffeeneology', name: 'Kaffeeneology' },
  { id: 'osm-n13308179172', name: "Lil' Ben Coffee House" },
  { id: 'digos-the-nook', name: 'The Nook' },
  { id: 'digos-the-tipsy-butter', name: 'The Tipsy Butter' },
];

/** Midday Manila on the capture's date, so the printed date is the same in any render timezone. */
const STAMPED_AT = '2026-10-01T12:00:00+08:00';

const CARD = { width: 1320, x: 960, top: 272, pad: 40 };
const CELL = { width: (CARD.width - CARD.pad * 2) / 5, height: 252, stamp: 150 };
const GRID_TOP = CARD.top + CARD.pad + 52 + 28;
const IMPACT = B.stamp + 10;
const FIRST = { x: CARD.x - CARD.width / 2 + CARD.pad + CELL.width / 2, y: GRID_TOP + CELL.stamp / 2 };

/** 0:48 "A passport for your cafe days." A stamp slams onto the real Digos page. */
export const Passport: React.FC = () => {
  const frame = useCurrentFrame();
  const cardIn = progress(frame, B.page, 34, riseEase);
  const fall = progress(frame, B.stamp, IMPACT - B.stamp, exitEase);
  const hovering = frame >= B.stamp - 16 && frame < IMPACT;
  const stamped = frame >= IMPACT;
  const since = frame - IMPACT;
  const shake = stamped && since < 16 ? Math.sin(since * 2.6) * 9 * (1 - since / 16) : 0;
  const squash = stamped ? 1 + Math.max(0, 1 - since / 8) * 0.07 : 1;
  const ring = progress(frame, IMPACT, 26);
  const push = progress(frame, B.push, 110, glideEase);
  const out = progress(frame, B.out, 26, exitEase);
  const hover = progress(frame, B.stamp - 16, 16, riseEase);

  return (
    // Lifts away as the dark sheet rises from the bottom
    <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${-out * 420}px)`, filter: out > 0 ? `blur(${out * 10}px)` : undefined }}>
      <Place x={960} y={150} opacity={1 - push}>
        <Words text="A passport for *your cafe days.*" at={B.headline} size={92} color={color.ink} accentFill={gradient.onLinen} style={{ whiteSpace: 'nowrap' }} />
      </Place>

      {/* A slow camera push that brings the fresh stamp toward the middle */}
      <AbsoluteFill
        style={{
          transformOrigin: `${FIRST.x}px ${FIRST.y}px`,
          transform: `translate(${mix(0, 330, push)}px, ${mix(0, 60, push)}px) scale(${mix(1, 1.42, push)}) translate(${shake}px, ${shake * 0.6}px)`,
        }}
      >
        <div style={{ position: 'absolute', left: CARD.x - CARD.width / 2, top: CARD.top, opacity: cardIn, transform: `translateY(${(1 - cardIn) * 120}px)` }}>
          <GlassCard width={CARD.width} style={{ padding: CARD.pad }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', height: 52 }}>
              <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em' }}>Digos City</span>
              <span style={{ fontSize: 28, color: color.ink2, fontVariantNumeric: 'tabular-nums' }}>{stamped ? 1 : 0} of 10</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, ${CELL.width}px)`, marginTop: 28 }}>
              {SPOTS.map((spot, index) => {
                const first = index === 0;
                return (
                  <div key={spot.id} style={{ height: CELL.height, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: CELL.stamp, height: CELL.stamp, transform: first && stamped ? `scale(${squash})` : undefined }}>
                      <PassportStamp cafeName={spot.name} city="Digos City" stampedAt={first && stamped ? STAMPED_AT : null} seed={spot.id} size={CELL.stamp} />
                    </div>
                    <div style={{ marginTop: 12, fontSize: 23, fontWeight: 500, lineHeight: 1.15, maxWidth: CELL.width - 20, fontFamily }}>{spot.name}</div>
                    <div style={{ marginTop: 4, fontSize: 20, color: color.ink2 }}>{first && stamped ? 'Oct 1' : 'Not yet'}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Ink ring from the impact */}
        {ring > 0 && ring < 1 && (
          <div
            style={{
              position: 'absolute',
              left: FIRST.x - mix(80, 190, ring),
              top: FIRST.y - mix(80, 190, ring),
              width: mix(160, 380, ring),
              height: mix(160, 380, ring),
              borderRadius: '50%',
              border: `${mix(10, 2, ring)}px solid ${color.tint}`,
              opacity: (1 - ring) * 0.55,
            }}
          />
        )}

        {/* The stamp in the air, dropping onto the Green Coffee ghost */}
        {hovering && (
          <div
            style={{
              position: 'absolute',
              left: FIRST.x - CELL.stamp / 2,
              top: FIRST.y - CELL.stamp / 2,
              width: CELL.stamp,
              height: CELL.stamp,
              opacity: hover,
              transform: `translate(${mix(60, 0, fall)}px, ${mix(-240, 0, fall)}px) scale(${mix(2.6, 1, fall)}) rotate(${mix(-16, 0, fall)}deg)`,
              filter: `drop-shadow(0 ${mix(60, 4, fall)}px ${mix(40, 4, fall)}px rgba(19, 25, 31, ${mix(0.18, 0.3, fall)}))`,
            }}
          >
            <PassportStamp cafeName="Green Coffee" city="Digos City" stampedAt={STAMPED_AT} seed="curated-green-coffee-digos" size={CELL.stamp} />
          </div>
        )}

        <Place x={1704} y={884}>
          <Aya pose="stamp" size={300} at={B.settle} sway={3} />
        </Place>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
