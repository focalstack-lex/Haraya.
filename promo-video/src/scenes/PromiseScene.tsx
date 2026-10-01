import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { SCENES } from '../timeline';
import { color, gradient, shadow } from '../theme';
import { fontFamily } from '../fonts';
import { Words } from '../components/Words';
import { Phone } from '../components/Phone';
import { Ripples } from '../components/Ripples';
import { Place } from '../components/ui';
import { exitEase, mix, pop, progress, riseEase } from '../lib/motion';

const B = SCENES.promise.beats;

/** The landing page's band: what Haraya filters for (LandingView BAND_ITEMS). */
const BAND_ITEMS = ['Study and work', 'Quiet corners', 'Open late', 'Plugs and Wi-Fi', 'Hidden gems', 'Walking routes', 'Focus sessions'];

/** Frame the phones start rising, after the headline has been read. */
const RISE = 104;

/** The landing hero: map, Discover and a spot sheet on the tint arch, the center phone first. */
const HERO = [
  { src: 'screens/map.jpg', x: 632, top: 432, width: 292, rotate: -6, delay: 14, z: 0 },
  { src: 'screens/spot.jpg', x: 1288, top: 432, width: 292, rotate: 6, delay: 26, z: 0 },
  { src: 'screens/discover.jpg', x: 960, top: 318, width: 368, rotate: 0, delay: 0, z: 1 },
];

const OpenNowPill: React.FC<{ frame: number; width: number; height: number }> = ({ frame, width, height }) => {
  const pulse = ((frame - B.open) % 54) / 54;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: height / 2,
        background: color.surface,
        boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.9), ${shadow.lifted}`,
        border: '0.5px solid rgba(228, 217, 200, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 26,
        fontFamily,
        fontSize: 64,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        color: color.ok,
      }}
    >
      <span style={{ position: 'relative', width: 30, height: 30 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color.ok, opacity: 0.35 * (1 - pulse), transform: `scale(${1 + pulse * 1.6})` }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color.ok }} />
      </span>
      Open now
    </div>
  );
};

/** 0:12 "Find your daily cup in Davao.", the landing hero with its band, then which spots are open now. */
export const PromiseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lift = progress(frame, RISE, 46, riseEase);
  const archUp = progress(frame, RISE - 6, 54, riseEase);
  const heroOut = progress(frame, B.open - 34, 30, exitEase);
  const bandIn = progress(frame, B.band, 40, riseEase);
  const pillIn = pop(frame, B.open, fps, 180, 14);
  const out = progress(frame, B.out, 26, exitEase);

  const PILL = { x: 1330, y: 520, width: 470, height: 132 };

  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 12}px)` : undefined }}>
      {/* Hero: headline, arch, phones and band */}
      <AbsoluteFill
        style={{
          opacity: 1 - heroOut,
          transform: `translateY(${heroOut * 260}px)`,
          filter: heroOut > 0 ? `blur(${heroOut * 10}px)` : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 960 - 600,
            top: 1080 - 560 + (1 - archUp) * 620,
            width: 1200,
            height: 600,
            borderRadius: '600px 600px 0 0',
            background: color.tint,
          }}
        />
        {HERO.map((phone) => {
          const p = progress(frame, RISE + phone.delay, 64, riseEase);
          return (
            <div
              key={phone.src}
              style={{
                position: 'absolute',
                left: phone.x - phone.width / 2,
                top: phone.top + (1 - p) * 520,
                opacity: Math.min(1, p * 1.6),
                zIndex: phone.z,
                transform: `rotate(${phone.rotate}deg)`,
                transformOrigin: phone.rotate < 0 ? '100% 100%' : '0% 100%',
              }}
            >
              <Phone width={phone.width} src={phone.src} />
            </div>
          );
        })}

        {/* The River Styx band crossing in front of the phones, as on the landing page */}
        <div
          style={{
            position: 'absolute',
            left: -200,
            top: 812,
            width: 2320,
            height: 124,
            background: color.ink,
            transform: `translateX(${(1 - bandIn) * 2400}px) rotate(-3deg)`,
            overflow: 'hidden',
            zIndex: 2,
            boxShadow: '0 24px 60px -20px rgba(19, 25, 31, 0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              gap: 56,
              paddingLeft: 60,
              whiteSpace: 'nowrap',
              transform: `translateX(${-(frame - B.band) * 4.2}px)`,
              fontFamily,
              fontSize: 42,
              fontWeight: 500,
              color: color.surface,
              letterSpacing: '-0.01em',
            }}
          >
            {[...BAND_ITEMS, ...BAND_ITEMS].map((item, index) => (
              <span key={`${item}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 56 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: color.star }} />
                {item}
              </span>
            ))}
          </div>
        </div>

        <Place x={960} y={mix(500, 176, lift)} scale={mix(1, 0.64, lift)}>
          <Words text="Find your daily cup in *Davao.*" at={B.headline} size={122} color={color.ink} accentFill={gradient.onLinen} style={{ whiteSpace: 'nowrap' }} />
        </Place>
      </AbsoluteFill>

      {/* Open now: the pill lands inside rings, the reference's "10x better" move */}
      {frame >= B.open - 2 && (
        <>
          <Ripples x={PILL.x} y={PILL.y} width={PILL.width} height={PILL.height} at={B.open + 4} tone="rgba(144, 109, 75, 0.1)" />
          <div
            style={{
              position: 'absolute',
              right: 1920 - (PILL.x - PILL.width / 2 - 40),
              top: PILL.y - 56,
              height: 112,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Words text="See which ones are" at={B.open - 10} size={76} weight={600} color={color.ink} style={{ whiteSpace: 'nowrap' }} />
          </div>
          <Place x={PILL.x} y={PILL.y} scale={0.6 + 0.4 * pillIn} opacity={Math.min(1, pillIn * 2)}>
            <OpenNowPill frame={frame} width={PILL.width} height={PILL.height} />
          </Place>
          <Place x={960} y={726}>
            <Words text="Even the ones that close after midnight." at={B.note} size={46} weight={500} color={color.ink2} tracking="-0.02em" style={{ whiteSpace: 'nowrap' }} />
          </Place>
        </>
      )}
    </AbsoluteFill>
  );
};
