import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { HEIGHT, SCENES, WIDTH, at } from '../timeline';
import { color } from '../theme';
import { Typewriter } from '../components/Typewriter';
import { Logo } from '../components/Logo';
import { Aya } from '../components/Aya';
import { Place } from '../components/ui';
import { irisGeometry, stageProgress, stageStartingAt } from '../components/Backdrop';
import { exitEase, mix, progress, riseEase } from '../lib/motion';

const B = SCENES.reveal.beats;
const IRIS = stageStartingAt(at('reveal', 'iris'));
const LOGO_WIDTH = 740;
const AYA_SIZE = 300;
const GAP = 70;
const LOGO_X = 960 - (AYA_SIZE + GAP) / 2;
const AYA_X = LOGO_X + LOGO_WIDTH / 2 + GAP + AYA_SIZE / 2 - 40;

/** 0:07 A caret types "Introducing", the linen iris opens, the logo comes into focus and Aya waves. */
export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const absolute = frame + SCENES.reveal.from;
  const { x, y, r } = irisGeometry(IRIS, stageProgress(IRIS, absolute));
  // Inside the iris the text is ink on linen; outside it stays cream on River Styx. The seam is the iris edge.
  const inside = `circle(${r}px at ${x}px ${y}px)`;
  const outside = `path(evenodd, "M0 0H${WIDTH}V${HEIGHT}H0Z M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z")`;

  const lift = progress(frame, B.logo, 44, riseEase);
  const logoIn = progress(frame, B.logo + 6, 58, riseEase);
  const out = progress(frame, B.out, 24, exitEase);
  // The logo and Aya read as one group centered in the frame; "Introducing" settles over the logo
  const textX = mix(960, LOGO_X, lift);
  const textY = mix(540, 312, lift);
  const textScale = mix(1, 0.4, lift);

  const introducing = (tone: string, caret: string) => (
    <Place x={textX} y={textY} scale={textScale}>
      <Typewriter text="Introducing" at={B.type} caretFrom={B.caret} caretUntil={B.logo} size={128} color={tone} caretColor={caret} />
    </Place>
  );

  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${-out * 70}px)`, filter: out > 0 ? `blur(${out * 14}px)` : undefined }}>
      <AbsoluteFill style={{ clipPath: outside }}>{introducing(color.surface, color.steam)}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: inside }}>{introducing(color.ink2, color.tint)}</AbsoluteFill>

      <Place x={LOGO_X} y={592} scale={mix(1.16, 1, logoIn)} opacity={logoIn} style={{ filter: logoIn < 1 ? `blur(${(1 - logoIn) * 28}px)` : undefined }}>
        <Logo width={LOGO_WIDTH} shineAt={B.shine} />
      </Place>

      <Place x={AYA_X} y={640}>
        <Aya pose="welcome" size={AYA_SIZE} at={B.aya} sway={4} />
      </Place>
    </AbsoluteFill>
  );
};
