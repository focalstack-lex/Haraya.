import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { evolvePath, getLength, getPointAtLength } from '@remotion/paths';
import { ROUTE_DRAW_FRAMES, SCENES } from '../timeline';
import { color, gradient } from '../theme';
import { fontFamily } from '../fonts';
import { Words } from '../components/Words';
import { Aya } from '../components/Aya';
import { Phone, screenMetrics } from '../components/Phone';
import { GlassCard, Place } from '../components/ui';
import { glideEase, mix, pop, progress, riseEase } from '../lib/motion';

const B = SCENES.walk.beats;

/** The map plane, in its own pixels. It is tilted back like a navigation view. */
const PLANE = { width: 2400, height: 1500, tilt: 30, perspective: 1700 };
/** The plane point that sits at the video point below, and the axis it tilts about. */
const ANCHOR = { plane: [1490, 850], video: [960, 600] } as const;

const MAJOR = [
  'M0 520 C600 505 1200 540 2400 510',
  'M0 980 C700 1000 1500 965 2400 990',
  'M760 0 C745 500 780 1000 760 1500',
  'M1500 0 C1515 500 1490 1000 1505 1500',
  'M240 1500 C700 1000 1500 380 2250 0',
];
const MINOR = [
  'M0 250 H2400',
  'M0 750 H2400',
  'M0 1250 H2400',
  'M380 0 V1500',
  'M1120 0 V1500',
  'M1880 0 V1500',
  'M2200 0 V1500',
  'M1120 750 L1500 980',
  'M1880 250 L2400 610',
];

/** The walk follows the streets, as the app's OSRM route does: tint over a surface casing. */
const ROUTE = 'M1120 1150 L1120 990 Q1120 980 1130 980 L1490 980 Q1500 980 1500 970 L1500 530 Q1500 520 1510 520 L1860 520';
const ROUTE_LENGTH = getLength(ROUTE);

/** A point along the route. The route is a fixed path, so a missing point is a bug and stops the render. */
const routePoint = (length: number): { x: number; y: number } => {
  const point = getPointAtLength(ROUTE, length);
  if (!point) throw new Error(`Walk route has no point at length ${length}`);
  return point;
};
const START = routePoint(0);
const END = routePoint(ROUTE_LENGTH);

const PHONE = { width: 400, x: 960, y: 560 };

/** An upright element standing on the tilted plane at a plane point. */
const Standing: React.FC<{ x: number; y: number; children: React.ReactNode }> = ({ x, y, children }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -100%) rotateX(${-PLANE.tilt}deg)`,
      transformOrigin: '50% 100%',
    }}
  >
    {children}
  </div>
);

/** 0:31 Dark map: the walk draws along the streets, then the real in-app navigation, then through the screen. */
export const Walk: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mapIn = progress(frame, B.map, 50, riseEase);
  const draw = progress(frame, B.route, ROUTE_DRAW_FRAMES, glideEase);
  const { strokeDasharray, strokeDashoffset } = evolvePath(draw, ROUTE);
  const head = routePoint(ROUTE_LENGTH * draw);
  const pin = pop(frame, B.arrive, fps, 200, 12);
  const eta = progress(frame, B.arrive + 16, 26, riseEase);
  const phoneUp = progress(frame, B.phone, 64, riseEase);
  const mapBack = progress(frame, B.phone - 10, 50, riseEase);
  // The phone is already at full zoom when the linen iris opens beneath it, then dissolves into it
  const through = progress(frame, B.out, 30, glideEase);
  const gone = progress(frame, B.out + 30, 9);
  const screen = screenMetrics(PHONE.width);
  const halo = ((frame - B.map) % 70) / 70;

  return (
    <AbsoluteFill style={{ opacity: 1 - gone }}>
      {/* The tilted map */}
      <AbsoluteFill
        style={{
          perspective: PLANE.perspective,
          opacity: mapIn * mix(1, 0.22, mapBack),
          filter: mapBack > 0 ? `blur(${mapBack * 6}px)` : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: ANCHOR.video[0] - ANCHOR.plane[0],
            top: ANCHOR.video[1] - ANCHOR.plane[1],
            width: PLANE.width,
            height: PLANE.height,
            transformOrigin: `${ANCHOR.plane[0]}px ${ANCHOR.plane[1]}px`,
            transform: `rotateX(${PLANE.tilt}deg) scale(${mix(1.12, 1, mapIn) * mix(1, 0.9, mapBack)}) rotateZ(${mix(-4, 0, mapIn)}deg)`,
            transformStyle: 'preserve-3d',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 62% 57%, #000 55%, transparent 100%)',
            maskImage: 'radial-gradient(ellipse 50% 50% at 62% 57%, #000 55%, transparent 100%)',
          }}
        >
          <svg width={PLANE.width} height={PLANE.height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {MINOR.map((d, index) => (
              <path key={d} d={d} stroke="rgba(255, 253, 249, 0.07)" strokeWidth={14} fill="none" strokeLinecap="round" opacity={progress(frame, B.map + index * 3, 30)} />
            ))}
            {MAJOR.map((d, index) => (
              <path key={d} d={d} stroke="rgba(255, 253, 249, 0.12)" strokeWidth={34} fill="none" strokeLinecap="round" opacity={progress(frame, B.map + 10 + index * 4, 30)} />
            ))}
            <path d={ROUTE} stroke="rgba(255, 253, 249, 0.92)" strokeWidth={30} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
            <path d={ROUTE} stroke={color.tint} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
            {draw > 0 && draw < 1 && <circle cx={head.x} cy={head.y} r={20} fill={color.steam} opacity={0.9} />}
            {/* The blue "You" dot, the app's only blue: it means your position */}
            <circle cx={START.x} cy={START.y} r={30 + halo * 50} fill={color.you} opacity={(1 - halo) * 0.25 * mapIn} />
            <circle cx={START.x} cy={START.y} r={26} fill={color.you} stroke={color.surface} strokeWidth={9} opacity={mapIn} />
          </svg>

          {frame >= B.arrive && (
            <Standing x={END.x} y={END.y}>
              <div style={{ transform: `translateY(${(1 - pin) * -120}px) scale(${0.5 + 0.5 * pin})`, transformOrigin: '50% 100%', opacity: Math.min(1, pin * 2) }}>
                <div
                  style={{
                    width: 196,
                    height: 196,
                    borderRadius: '50%',
                    border: `9px solid ${color.surface}`,
                    overflow: 'hidden',
                    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.45)',
                  }}
                >
                  <Img src={staticFile('spots/green-coffee.webp')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ width: 0, height: 0, margin: '-4px auto 0', borderLeft: '22px solid transparent', borderRight: '22px solid transparent', borderTop: `30px solid ${color.surface}` }} />
              </div>
            </Standing>
          )}
        </div>
      </AbsoluteFill>

      <Place x={380} y={760}>
        <Aya pose="wander" size={300} at={B.route + 20} exitAt={B.phone - 6} />
      </Place>

      {/* The same numbers as the app's live walk to Green Coffee */}
      <Place x={1560} y={640} opacity={eta * (1 - mapBack)}>
        <GlassCard style={{ padding: '22px 30px', transform: `translateY(${(1 - eta) * 30}px)` }}>
          <div style={{ fontSize: 26, color: color.ink2 }}>To Green Coffee</div>
          <div style={{ fontSize: 40, color: color.ink, letterSpacing: '-0.02em', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            <b>1.1 km</b> left, about <b>13</b> min walk
          </div>
        </GlassCard>
      </Place>

      <Place x={960} y={138} opacity={1 - mapBack}>
        <Words text="Walk there *in the app.*" at={B.headline} size={96} color={color.surface} accentFill={gradient.onDark} style={{ whiteSpace: 'nowrap' }} />
      </Place>

      {/* The real walking navigation, then the camera pushes through its screen */}
      {frame >= B.phone && (
        <AbsoluteFill style={{ perspective: 1900 }}>
          <div
            style={{
              position: 'absolute',
              left: PHONE.x - PHONE.width / 2,
              top: PHONE.y - screen.height / 2 - screen.top,
              transformOrigin: `${PHONE.width / 2}px ${screen.top + screen.height / 2}px`,
              transform: `translateY(${(1 - phoneUp) * 760}px) rotateX(${(1 - phoneUp) * 40}deg) scale(${mix(1, 3.4, through)})`,
              opacity: Math.min(1, phoneUp * 2),
              filter: through > 0 ? `blur(${through * 8}px)` : undefined,
            }}
          >
            <Phone width={PHONE.width} src="screens/navigate.jpg" line={color.cream} />
          </div>
        </AbsoluteFill>
      )}

      <Place x={440} y={560} opacity={1 - through}>
        <Words text="Follows the *streets.*" at={B.flank} size={62} color={color.surface} accentFill={gradient.onDark} style={{ whiteSpace: 'nowrap', fontFamily }} />
      </Place>
      <Place x={1480} y={560} opacity={1 - through}>
        <Words text="Time left *as you go.*" at={B.flank + 16} size={62} color={color.surface} accentFill={gradient.onDark} style={{ whiteSpace: 'nowrap' }} />
      </Place>
    </AbsoluteFill>
  );
};
