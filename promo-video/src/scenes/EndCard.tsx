import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ArrowRight } from 'lucide-react';
import { SCENES } from '../timeline';
import { color, gradient } from '../theme';
import { fontFamily } from '../fonts';
import { Words } from '../components/Words';
import { Logo } from '../components/Logo';
import { Aya } from '../components/Aya';
import { Cursor } from '../components/Cursor';
import { Place, PrimaryButton } from '../components/ui';
import { glideEase, mix, pop, progress, riseEase } from '../lib/motion';

const B = SCENES.end.beats;
/** Open Haraya and the web address share one centered row; the button is about 364 wide, the address 250. */
const BUTTON = { x: 790, y: 838 };
const ADDRESS = { x: 1152, y: 838 };

/** 1:09 Linen. The logo, the closing line from the landing page, the web address and Open Haraya. */
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const settleLine = progress(frame, B.logo, 50, riseEase);
  const logoIn = progress(frame, B.logo + 4, 56, riseEase);
  const ctaIn = pop(frame, B.cta, fps, 180, 14);
  const press = Math.max(0, 1 - Math.abs(frame - B.tap - 3) / 7);
  const shine = progress(frame, B.tap + 6, 40, glideEase);
  const hop = frame >= B.tap ? pop(frame, B.tap + 4, fps, 260, 11) : 0;

  return (
    <AbsoluteFill>
      <Place x={960} y={336} scale={mix(1.12, 1, logoIn)} opacity={logoIn} style={{ filter: logoIn < 1 ? `blur(${(1 - logoIn) * 24}px)` : undefined }}>
        <Logo width={600} />
      </Place>

      <Place x={960} y={mix(540, 632, settleLine)} scale={mix(1, 0.7, settleLine)}>
        <Words text="Your next cup *is close.*" at={B.headline} size={120} color={color.ink} accentFill={gradient.onLinen} style={{ whiteSpace: 'nowrap' }} />
      </Place>

      <Place x={960} y={722}>
        <Words text="Free, and nothing to install." at={B.sub} size={40} weight={500} color={color.ink2} tracking="-0.02em" style={{ whiteSpace: 'nowrap' }} />
      </Place>

      <Place x={BUTTON.x} y={BUTTON.y} scale={(0.7 + 0.3 * ctaIn) * (1 - press * 0.05)} opacity={Math.min(1, ctaIn * 2)}>
        <div style={{ position: 'relative', borderRadius: 48, overflow: 'hidden', boxShadow: '0 22px 44px -18px rgba(19, 25, 31, 0.45)' }}>
          <PrimaryButton label="Open Haraya" icon={<ArrowRight size={34} strokeWidth={2.4} />} height={96} size={36} style={{ gap: 14 }} />
          {shine > 0 && shine < 1 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(100deg, rgba(255, 253, 249, 0) ${shine * 160 - 50}%, rgba(255, 233, 202, 0.55) ${shine * 160 - 30}%, rgba(255, 253, 249, 0) ${shine * 160 - 10}%)`,
              }}
            />
          )}
        </div>
      </Place>
      <Place x={ADDRESS.x} y={ADDRESS.y} opacity={Math.min(1, ctaIn * 2)}>
        <span style={{ fontFamily, fontSize: 40, fontWeight: 600, color: color.tintInk, letterSpacing: '-0.02em' }}>haraya.space</span>
      </Place>

      <Place x={1618} y={726}>
        <div style={{ transform: `translateY(${-Math.sin(Math.min(1, hop) * Math.PI) * 34}px)` }}>
          <Aya pose="clink" size={380} at={B.aya} sway={5} />
        </div>
      </Place>

      <Cursor
        keys={[
          { at: B.cursor, x: 1760, y: 1180 },
          { at: B.tap - 10, x: BUTTON.x + 40, y: BUTTON.y + 10 },
          { at: B.tap + 40, x: BUTTON.x + 110, y: BUTTON.y + 90 },
        ]}
        taps={[B.tap]}
        hideAt={B.hold}
      />
    </AbsoluteFill>
  );
};
