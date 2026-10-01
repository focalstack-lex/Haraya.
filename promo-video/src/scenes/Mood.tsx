import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { SCENES } from '../timeline';
import { color, gradient } from '../theme';
import { fontFamily } from '../fonts';
import { Words } from '../components/Words';
import { Aya } from '../components/Aya';
import { Cursor } from '../components/Cursor';
import { Phone, screenMetrics } from '../components/Phone';
import { Chip, GlassCard, Place } from '../components/ui';
import { exitEase, glideEase, mix, pop, progress, riseEase } from '../lib/motion';

const B = SCENES.mood.beats;

/** The mood finder's own lists (src/components/moodFinder/moods.ts). */
const MOODS = ['Focused', 'Cozy', 'Social', 'Treat myself', 'Quick cup', 'Explore'];
const MUST_HAVES = ['Pets', 'Wi-Fi', 'Quiet', 'Plugs', 'Air-con', 'Open now'];

/** The card is built at app pixels and scaled, anchored at its top left. */
const CARD = { left: 800, top: 330, width: 420, scale: 1.9 };
/** Center of the Focused chip in video pixels (first chip of the first row). */
const FOCUSED = { x: CARD.left + 70 * CARD.scale, y: CARD.top + 76 * CARD.scale };

/** Both captures show the same sheet: the list one is scrolled 215 app pixels further, under a fixed header. */
const SHEET_HEADER = 136;
const SCROLL = 215;
/** The Best match card in the scrolled capture, in app pixels. */
const BEST_MATCH = { x: 195, y: 416 };

const PHONE = { width: 430, x: 960, y: 562 };

/** The real mood finder, scrolling from the chips to Aya's three picks. */
const ScrollingSheet: React.FC<{ scroll: number; pixel: number }> = ({ scroll, pixel }) => {
  const clip = `inset(${SHEET_HEADER * pixel}px 0 0 0)`;
  return (
    <>
      <Img src={staticFile('screens/mood-picks-list.jpg')} style={{ position: 'absolute', left: 0, top: (1 - scroll) * SCROLL * pixel, width: '100%', clipPath: clip }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: clip }}>
        <Img src={staticFile('screens/mood-picks.jpg')} style={{ position: 'absolute', left: 0, top: -scroll * SCROLL * pixel, width: '100%', opacity: scroll >= 1 ? 0 : 1 }} />
      </div>
      <Img src={staticFile('screens/mood-picks.jpg')} style={{ position: 'absolute', left: 0, top: 0, width: '100%', clipPath: `inset(0 0 calc(100% - ${SHEET_HEADER * pixel}px) 0)` }} />
    </>
  );
};

/** 0:20 "Tell Aya how you feel." A mood is tapped, and the phone shows the app's real picks. */
export const Mood: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = progress(frame, B.card, 30, riseEase);
  const cardOut = progress(frame, B.phone - 8, 26, exitEase);
  const focusedOn = progress(frame, B.tap + 1, 8);
  const hint = progress(frame, B.tap + 8, 22, riseEase);
  const hop = frame >= B.tap ? pop(frame, B.tap, fps, 260, 11) : 0;

  const rise = progress(frame, B.phone, 66, riseEase);
  const scroll = progress(frame, B.flank + 14, 72, glideEase);
  const push = progress(frame, B.push, 80, glideEase);
  const out = progress(frame, B.out, 28, exitEase);
  const screen = screenMetrics(PHONE.width);
  const origin = { x: screen.left + BEST_MATCH.x * screen.pixel, y: screen.top + BEST_MATCH.y * screen.pixel };

  return (
    // Leaves to the left, ahead of the dark wipe that sweeps in from the right
    <AbsoluteFill style={{ opacity: 1 - out, transform: `translateX(${-out * 520}px)`, filter: out > 0 ? `blur(${out * 10}px)` : undefined }}>
      <Place x={960} y={172} opacity={1 - cardOut}>
        <Words text="Tell Aya *how you feel.*" at={B.headline} size={98} color={color.ink} accentFill={gradient.onLinen} style={{ whiteSpace: 'nowrap' }} />
      </Place>

      <Place x={520} y={660}>
        {/* A small hop when her mood is picked */}
        <div style={{ transform: `translateY(${-Math.sin(Math.min(1, hop) * Math.PI) * 40}px)` }}>
          <Aya pose="mood" size={430} at={B.aya} exitAt={B.phone - 6} />
        </div>
      </Place>

      {/* The mood card, built like the finder's first group */}
      <div
        style={{
          position: 'absolute',
          left: CARD.left,
          top: CARD.top,
          transformOrigin: '0 0',
          transform: `translateY(${(1 - cardIn) * 60 - cardOut * 80}px) scale(${CARD.scale * (1 - cardOut * 0.2)})`,
          opacity: cardIn * (1 - cardOut),
        }}
      >
        <GlassCard width={CARD.width} style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: color.ink2, marginBottom: 12 }}>How are you feeling?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MOODS.map((mood, index) => {
              const s = pop(frame, B.card + 8 + index * 5, fps, 240, 15);
              return (
                <div key={mood} style={{ transform: `scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s * 2) }}>
                  <Chip label={mood} on={mood === 'Focused' ? focusedOn : 0} />
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 13, color: color.ink2, marginTop: 10, height: 18, opacity: hint, transform: `translateY(${(1 - hint) * 6}px)` }}>
            Quiet, Wi-Fi, plugs, open for a while
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: color.ink2, margin: '14px 0 12px' }}>Must have</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MUST_HAVES.map((item, index) => {
              const s = pop(frame, B.card + 34 + index * 4, fps, 240, 15);
              return (
                <div key={item} style={{ transform: `scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s * 2) }}>
                  <Chip label={item} />
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <Cursor
        keys={[
          { at: B.cursor, x: 1760, y: 1170 },
          { at: B.tap - 12, x: FOCUSED.x, y: FOCUSED.y },
          { at: B.tap + 26, x: FOCUSED.x + 40, y: FOCUSED.y + 34 },
          { at: B.phone, x: 1720, y: 1180 },
        ]}
        taps={[B.tap]}
        hideAt={B.phone - 14}
      />

      {/* The phone rises and tilts upright with the real finder: Focused chosen, three picks */}
      {frame >= B.phone && (
        <AbsoluteFill style={{ perspective: 1900 }}>
          <div
            style={{
              position: 'absolute',
              left: PHONE.x - PHONE.width / 2,
              top: PHONE.y - screen.height / 2 - screen.top,
              transformOrigin: `${origin.x}px ${origin.y}px`,
              transform: `translateY(${(1 - rise) * 820}px) rotateX(${(1 - rise) * 42}deg) scale(${mix(1, 1.62, push)})`,
              opacity: Math.min(1, rise * 2),
            }}
          >
            <Phone width={PHONE.width}>
              <ScrollingSheet scroll={scroll} pixel={screen.pixel} />
            </Phone>
          </div>
        </AbsoluteFill>
      )}

      {/* The reference's split line around the product: text flanking the phone */}
      <Place x={440} y={540} opacity={1 - push}>
        <Words text="Three picks." at={B.flank} size={74} color={color.ink} style={{ whiteSpace: 'nowrap', fontFamily }} />
      </Place>
      <Place x={1520} y={540} opacity={1 - push}>
        <Words text="*Why each one fits.*" at={B.flank + 16} size={62} color={color.ink} accentFill={gradient.onLinen} style={{ whiteSpace: 'nowrap' }} />
      </Place>
    </AbsoluteFill>
  );
};
