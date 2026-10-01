import React from 'react';
import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from 'remotion';
import { X } from 'lucide-react';
import { AyaMascot } from '@haraya/components/common/AyaMascot';
import { FocusTimerIcon, RubberStampIcon } from '@haraya/components/common/CustomIcons';
import { SCENES, TIMER_RACE_FRAMES } from '../timeline';
import { color, gradient } from '../theme';
import { fontFamily } from '../fonts';
import { Words } from '../components/Words';
import { Cursor } from '../components/Cursor';
import { GlassCard, Place } from '../components/ui';
import { exitEase, glideEase, iosEase, mix, pop, progress, riseEase } from '../lib/motion';

const B = SCENES.focus.beats;

/** The check-in sheet is built at app pixels (390 wide) and scaled, anchored at its top left. */
const SHEET = { width: 390, scale: 1.6, top: 258 };
const SHEET_LEFT = 960 - (SHEET.width * SHEET.scale) / 2;
/** The Start Focus Session row inside the sheet, in app pixels. */
const ROW = { left: 16, top: 282, width: 358, height: 64 };
/** The focus banner: 44 app pixels tall in the app, shown here 2.7 times larger. */
const BANNER = { width: 380, height: 44, scale: 2.7, x: 960, y: 600 };
/** The real session in the capture ran to this: 1 hour, 24 minutes, 52 seconds. */
const SESSION_SECONDS = 1 * 3600 + 24 * 60 + 52;

const at = (x: number, y: number) => ({ x: SHEET_LEFT + x * SHEET.scale, y: SHEET.top + y * SHEET.scale });
const START_ROW = at(ROW.left + ROW.width * 0.42, ROW.top + ROW.height / 2);
/** Finish sits at the banner's right end: 72 wide, 4 from the edge. */
const FINISH = { x: BANNER.x + (BANNER.width - 4 - 36 - BANNER.width / 2) * BANNER.scale, y: BANNER.y };

const clock = (seconds: number) => {
  const whole = Math.floor(seconds);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(whole / 3600))}:${pad(Math.floor((whole % 3600) / 60))}:${pad(whole % 60)}`;
};

const SheetRow: React.FC<{ primary?: boolean; title: string; body: string; icon: React.ReactNode; press?: number }> = ({ primary, title, body, icon, press = 0 }) => (
  <div
    style={{
      minHeight: ROW.height,
      padding: '12px 16px',
      borderRadius: 14,
      background: primary ? color.tint : color.fill,
      color: primary ? color.surface : color.ink,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      textAlign: 'left',
      transform: `scale(${1 - press * 0.03})`,
      filter: press > 0 ? `brightness(${1 - press * 0.08})` : undefined,
    }}
  >
    <span style={{ width: 24, height: 24, flexShrink: 0, color: primary ? color.surface : color.tintInk }}>{icon}</span>
    <span>
      <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{title}</span>
      {/* One line, as in the app: the text runs a few pixels wider here than in the capture */}
      <span style={{ display: 'block', fontSize: 12, marginTop: 2, whiteSpace: 'nowrap', letterSpacing: '-0.01em', color: primary ? 'rgba(255, 253, 249, 0.8)' : color.ink2 }}>{body}</span>
    </span>
  </div>
);

/** 0:40 Check in at Green Coffee, start a focus session, and the timer runs. */
export const Focus: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sheetIn = progress(frame, B.card, 36, riseEase);
  const ayaUp = pop(frame, B.card + 16, fps, 200, 12);
  const press = Math.max(0, 1 - Math.abs(frame - B.tap - 3) / 7);
  const morph = progress(frame, B.morph, 40, iosEase);
  const sheetGone = progress(frame, B.morph - 2, 18);
  const bannerContent = progress(frame, B.morph + 16, 22, riseEase);
  const race = progress(frame, B.timer, TIMER_RACE_FRAMES, glideEase);
  const out = progress(frame, B.out, 26, exitEase);

  // The tapped row detaches and stretches into the banner: rect, radius and color all travel
  const from = { left: SHEET_LEFT + ROW.left * SHEET.scale, top: SHEET.top + ROW.top * SHEET.scale, width: ROW.width * SHEET.scale, height: ROW.height * SHEET.scale, radius: 14 * SHEET.scale };
  const to = { left: BANNER.x - (BANNER.width * BANNER.scale) / 2, top: BANNER.y - (BANNER.height * BANNER.scale) / 2, width: BANNER.width * BANNER.scale, height: BANNER.height * BANNER.scale, radius: (BANNER.height * BANNER.scale) / 2 };
  const pulse = ((frame - B.timer) % (race > 0 && race < 1 ? 24 : 60)) / (race > 0 && race < 1 ? 24 : 60);

  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${out * 90}px)`, filter: out > 0 ? `blur(${out * 10}px)` : undefined }}>
      <Place x={960} y={150}>
        <Words text="Check in *when you arrive.*" at={B.headline} exitAt={B.morph} size={92} color={color.ink} accentFill={gradient.onLinen} style={{ whiteSpace: 'nowrap' }} />
      </Place>
      <Place x={960} y={330}>
        <Words text="Log a *focus session.*" at={B.headline2} size={104} color={color.ink} accentFill={gradient.onLinen} style={{ whiteSpace: 'nowrap' }} />
      </Place>

      {/* The real check-in sheet's located state, word for word */}
      <div
        style={{
          position: 'absolute',
          left: SHEET_LEFT,
          top: SHEET.top,
          transformOrigin: '0 0',
          transform: `translateY(${(1 - sheetIn) * 140}px) scale(${SHEET.scale})`,
          // The whole sheet fades as its tapped row leaves to become the banner
          opacity: sheetIn * (1 - sheetGone),
        }}
      >
        <GlassCard width={SHEET.width} round={28}>
          <div style={{ position: 'relative', padding: '8px 16px 12px' }}>
            <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(89, 76, 61, 0.25)', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.01em' }}>Check in</div>
            <div style={{ fontSize: 13, color: color.ink2, marginTop: 2 }}>Green Coffee, Digos City</div>
            <div style={{ position: 'absolute', right: 14, top: 24, width: 30, height: 30, borderRadius: 15, background: 'rgba(118, 96, 70, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.ink2 }}>
              <X size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ height: 0.5, background: color.separator }} />
          <div style={{ padding: '10px 16px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <div style={{ transform: `translateY(${(1 - ayaUp) * 30}px) scale(${0.6 + 0.4 * ayaUp})`, transformOrigin: '50% 100%', opacity: Math.min(1, ayaUp * 2) }}>
              <AyaMascot pose="arrive" size={124} animated={false} alt="" />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: color.ok, boxShadow: '0 0 0 4px rgba(62, 92, 72, 0.18)' }} />
                You are at Green Coffee
              </div>
              <div style={{ fontSize: 12, color: color.ink2, marginTop: 4 }}>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>28 m</span> from the spot, verified by GPS
              </div>
            </div>
            <div style={{ width: '100%', display: 'grid', gap: 8, paddingTop: 4 }}>
              <div style={{ opacity: morph > 0 ? 0 : 1 }}>
                <SheetRow primary press={press} title="Start Focus Session" body="A timer runs while you study. It saves itself if you leave." icon={<FocusTimerIcon className="icon-fit" />} />
              </div>
              <div>
                <SheetRow title="Quick Stamp" body="Log a 30 minute drop-in and collect the stamp now." icon={<RubberStampIcon className="icon-fit" />} />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
      {/* The row becoming the banner */}
      {morph > 0 && (
        <div
          style={{
            position: 'absolute',
            left: mix(from.left, to.left, morph),
            top: mix(from.top, to.top, morph),
            width: mix(from.width, to.width, morph),
            height: mix(from.height, to.height, morph),
            borderRadius: mix(from.radius, to.radius, morph),
            background: interpolateColors(morph, [0, 1], [color.tint, color.ink]),
            boxShadow: `0 ${mix(0, 30, morph)}px ${mix(0, 70, morph)}px -20px rgba(19, 25, 31, 0.45)`,
          }}
        />
      )}

      {/* The running Deep Focus banner, as it floats above the tab dock in the app */}
      {bannerContent > 0 && (
        <Place x={BANNER.x} y={BANNER.y} scale={BANNER.scale} opacity={bannerContent}>
          <div style={{ position: 'relative', width: BANNER.width, height: BANNER.height, fontFamily, color: color.surface }}>
            <div style={{ position: 'absolute', left: 8, top: -20, width: 48, height: 48, transform: `translateY(${(1 - bannerContent) * 14}px)` }}>
              <AyaMascot pose="focus" size={48} animated={false} alt="" />
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 60, paddingRight: 4 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>Green Coffee</span>
                <span style={{ display: 'block', fontSize: 11, lineHeight: 1.2, color: 'rgba(255, 253, 249, 0.64)' }}>Deep focus</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                <span style={{ position: 'relative', width: 8, height: 8 }}>
                  <span style={{ position: 'absolute', inset: 0, borderRadius: 4, background: color.steam, opacity: 0.6 * (1 - pulse), transform: `scale(${1 + pulse * 1.8})` }} />
                  <span style={{ position: 'absolute', inset: 0, borderRadius: 4, background: color.steam }} />
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{clock(race * SESSION_SECONDS)}</span>
              </span>
              <span style={{ height: 36, padding: '0 16px', borderRadius: 18, background: color.tint, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', transform: `scale(${1 - Math.max(0, 1 - Math.abs(frame - B.finish - 3) / 7) * 0.06})` }}>
                Finish
              </span>
            </div>
          </div>
        </Place>
      )}

      <Cursor
        keys={[
          { at: B.cursor, x: 1760, y: 1180 },
          { at: B.tap - 12, x: START_ROW.x, y: START_ROW.y },
          { at: B.tap + 30, x: START_ROW.x + 60, y: START_ROW.y + 50 },
          { at: B.tap + 80, x: 1560, y: 880 },
          { at: B.finish - 34, x: 1560, y: 880 },
          { at: B.finish - 10, x: FINISH.x, y: FINISH.y + 6 },
          { at: B.out + 20, x: 1780, y: 1180 },
        ]}
        taps={[B.tap, B.finish]}
        hideAt={B.out}
      />
    </AbsoluteFill>
  );
};
