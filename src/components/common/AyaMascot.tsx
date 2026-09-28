import React from 'react';

/**
 * One pose per surface, so Aya reads as a character rather than a repeated sticker:
 * - welcome: first run (WelcomeModal)
 * - mood: Mood Finder, steam curling into a heart
 * - empty: empty and no-result states, peering into an empty cup with one ear drooped
 * - drops: Roast Drops, hugging a bean sack
 * - holding-cup: the master reference pose
 * - portrait: head only, for compact marks
 */
export type AyaPose = 'holding-cup' | 'welcome' | 'mood' | 'empty' | 'drops' | 'portrait';

export interface AyaMascotProps {
  pose?: AyaPose;
  /** Size preset or pixel dimension (square box, art is contained) */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  /** Idle bob, blink and steam drift. Collapses to the rest frame under reduced motion. */
  animated?: boolean;
  /** Pass an empty string when Aya sits beside text that already says everything. */
  alt?: string;
}

const SIZE_MAP = {
  sm: 48,
  md: 80,
  lg: 120,
  xl: 180,
} as const;

/* Palette sampled from the official master art (Haraya Files/MASCOT/FULL BODY.png). */
const ROAST = '#574835';
const TAN = '#997247';
const WHITE = '#FFFFFF';
const CREAM = '#FFF6EE';
const STEAM = '#E7AC67';
const COFFEE = '#FFC183';
const INK = '#1D1203';

/** Master art frame; every pose is drawn in these coordinates. */
const VIEW_BOX = '0 0 860 980';
const PORTRAIT_VIEW_BOX = '0 0 860 700';

const EAR_PATH =
  'M130 308 C95 280 60 220 58 150 C55 80 75 20 125 12 C190 5 270 90 340 175 L250 300 Z';
const EAR_INNER_PATH = 'M136 92 C150 150 165 195 190 232 L262 200 C215 165 170 125 136 92 Z';
const MIRROR = 'translate(860 0) scale(-1 1)';

const Ear: React.FC<{ side: 'left' | 'right'; droop?: boolean }> = ({ side, droop }) => (
  <g transform={side === 'right' ? MIRROR : undefined}>
    <g transform={droop ? 'rotate(-22 250 250)' : undefined}>
      <path d={EAR_PATH} fill={TAN} />
      <path d={EAR_INNER_PATH} fill={WHITE} />
    </g>
  </g>
);

const Leaves: React.FC = () => {
  const pair = (
    <>
      <path d="M5 515 C30 490 75 488 92 520 C60 530 30 530 5 515 Z" fill={TAN} />
      <path d="M48 625 C45 590 70 560 108 558 C110 595 85 622 48 625 Z" fill={TAN} />
    </>
  );
  return (
    <g>
      {pair}
      <g transform={MIRROR}>{pair}</g>
    </g>
  );
};

type Gaze = 'forward' | 'up' | 'down';

const PUPIL_OFFSET: Record<Gaze, { dx: number; dy: number }> = {
  forward: { dx: 0, dy: 0 },
  up: { dx: 6, dy: -30 },
  down: { dx: 0, dy: 38 },
};

const Eyes: React.FC<{ gaze?: Gaze; sparkle?: boolean; blink: boolean }> = ({ gaze = 'forward', sparkle, blink }) => {
  const { dx, dy } = PUPIL_OFFSET[gaze];
  return (
    <g className={blink ? 'aya-blink' : undefined}>
      <ellipse cx="275" cy="425" rx="112" ry="130" fill={WHITE} />
      <ellipse cx="572" cy="425" rx="112" ry="130" fill={WHITE} />
      <ellipse cx={315 + dx} cy={428 + dy} rx="64" ry="72" fill={ROAST} />
      <ellipse cx={530 + dx} cy={428 + dy} rx="64" ry="72" fill={ROAST} />
      <circle cx={345 + dx} cy={377 + dy} r="21" fill={WHITE} />
      <circle cx={568 + dx} cy={381 + dy} r="21" fill={WHITE} />
      {sparkle && (
        <>
          <circle cx={292 + dx} cy={462 + dy} r="10" fill={WHITE} />
          <circle cx={505 + dx} cy={466 + dy} r="10" fill={WHITE} />
        </>
      )}
    </g>
  );
};

const Head: React.FC<{ gaze?: Gaze; sparkle?: boolean; droopRightEar?: boolean; blink: boolean }> = ({
  gaze,
  sparkle,
  droopRightEar,
  blink,
}) => (
  <g>
    <Ear side="left" />
    <Ear side="right" droop={droopRightEar} />
    <Leaves />
    <ellipse cx="425" cy="415" rx="325" ry="262" fill={ROAST} />
    <Eyes gaze={gaze} sparkle={sparkle} blink={blink} />
  </g>
);

const Body: React.FC = () => (
  <path
    d="M250 640 C215 700 200 780 230 840 C250 880 280 900 290 915 C295 950 320 968 345 965 C375 960 390 935 392 915 L478 915 C480 945 500 965 525 962 C552 958 565 935 568 910 C590 890 625 850 640 800 C655 740 640 690 600 640 Z"
    fill={ROAST}
  />
);

/** Cream cup with coffee, drawn level at the master position. */
const Cup: React.FC = () => (
  <g>
    <path d="M525 752 C585 742 588 822 508 834" stroke={CREAM} strokeWidth="22" strokeLinecap="round" fill="none" />
    <path d="M318 720 C318 790 345 850 380 865 C400 872 450 872 470 865 C505 850 532 790 532 720 Z" fill={CREAM} />
    <ellipse cx="425" cy="720" rx="107" ry="24" fill={CREAM} />
    <ellipse cx="425" cy="723" rx="90" ry="14" fill={COFFEE} />
  </g>
);

/** Left paw wrapped over the cup side, with the ink finger lines from the master art. */
const CupPaw: React.FC = () => (
  <g>
    <ellipse cx="338" cy="800" rx="40" ry="56" fill={ROAST} />
    <path d="M314 786 L354 789 M314 812 L354 815" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    <path d="M272 846 C300 856 340 854 366 840" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
  </g>
);

const RightPawUnderCup: React.FC = () => (
  <path d="M500 846 C525 852 552 852 576 846" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
);

const STEAM_STROKE = { stroke: STEAM, strokeWidth: 19, strokeLinecap: 'round' as const, fill: 'none' };

const Steam: React.FC<{ animate: boolean }> = ({ animate }) => (
  <g className={animate ? 'aya-steam' : undefined}>
    <path d="M438 692 C405 660 448 632 432 600 C418 570 474 546 498 578 C516 604 484 630 462 606" {...STEAM_STROKE} />
    <path d="M385 662 C365 640 395 620 380 598" {...STEAM_STROKE} />
    <path d="M410 692 C394 670 420 652 408 630" {...STEAM_STROKE} />
  </g>
);

const HeartSteam: React.FC<{ animate: boolean }> = ({ animate }) => (
  <g className={animate ? 'aya-steam' : undefined}>
    <path d="M425 692 C400 668 440 650 425 628" {...STEAM_STROKE} />
    <path d="M425 612 C378 582 384 536 412 541 C420 543 425 551 425 557 C425 551 430 543 438 541 C466 536 472 582 425 612 Z" fill={STEAM} />
    <path d="M500 575 C486 566 488 548 499 550 C502 551 504 554 504 556 C504 554 506 551 509 550 C520 548 522 566 500 575 Z" fill={STEAM} opacity="0.7" />
  </g>
);

const Bean: React.FC<{ cx: number; cy: number; rotate: number; scale?: number; fill?: string; crease?: string }> = ({
  cx,
  cy,
  rotate,
  scale = 1,
  fill = TAN,
  crease = CREAM,
}) => (
  <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
    <ellipse cx="0" cy="0" rx="24" ry="33" fill={fill} />
    <path d="M-4 -26 C8 -10 -8 10 4 26" stroke={crease} strokeWidth="5" strokeLinecap="round" fill="none" />
  </g>
);

export const AyaMascot: React.FC<AyaMascotProps> = ({
  pose = 'holding-cup',
  size = 'md',
  className = '',
  animated = true,
  alt = 'Aya, the Haraya mascot',
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const decorative = alt === '';

  const figure = (() => {
    switch (pose) {
      case 'welcome':
        return (
          <>
            <Body />
            <g className={animated ? 'aya-wave' : undefined}>
              <path d="M600 772 Q690 742 738 640" stroke={ROAST} strokeWidth="70" strokeLinecap="round" fill="none" />
              <circle cx="742" cy="622" r="44" fill={ROAST} />
              <path d="M792 548 C812 560 824 578 828 600 M806 648 C816 660 820 674 818 690" stroke={TAN} strokeWidth="12" strokeLinecap="round" fill="none" />
            </g>
            <Head blink={animated} />
            <Steam animate={animated} />
            <Cup />
            <CupPaw />
          </>
        );
      case 'mood':
        return (
          <>
            <Body />
            <g transform="rotate(-6 425 690)">
              <Head gaze="up" blink={animated} />
            </g>
            <HeartSteam animate={animated} />
            <Cup />
            <CupPaw />
            <RightPawUnderCup />
          </>
        );
      case 'empty':
        return (
          <>
            <Body />
            <Head gaze="down" droopRightEar blink={animated} />
            {/* Cup tipped toward the viewer: nothing inside, no steam */}
            <g transform="rotate(-14 425 790)">
              <path d="M525 760 C585 750 588 830 508 842" stroke={CREAM} strokeWidth="22" strokeLinecap="round" fill="none" />
              <path d="M318 728 C318 798 345 858 380 873 C400 880 450 880 470 873 C505 858 532 798 532 728 Z" fill={CREAM} />
              <ellipse cx="425" cy="728" rx="107" ry="44" fill={CREAM} />
              <ellipse cx="425" cy="732" rx="88" ry="32" fill="#EFDFCC" />
            </g>
            <CupPaw />
            <RightPawUnderCup />
          </>
        );
      case 'drops':
        return (
          <>
            <Body />
            <Head sparkle blink={animated} />
            <g className={animated ? 'aya-float' : undefined}>
              <Bean cx={130} cy={780} rotate={-25} />
            </g>
            <g className={animated ? 'aya-float aya-float-late' : undefined}>
              <Bean cx={735} cy={770} rotate={30} scale={0.85} />
            </g>
            {/* Bean sack hugged against the body */}
            <path d="M300 772 C288 830 298 900 332 918 L518 918 C552 900 562 830 550 772 Z" fill={TAN} />
            <path d="M330 772 L342 722 L382 748 L425 708 L468 748 L508 722 L520 772 Z" fill={TAN} />
            <rect x="318" y="760" width="214" height="20" rx="10" fill={CREAM} />
            <Bean cx={425} cy={845} rotate={18} scale={1.45} fill={ROAST} crease={TAN} />
            <ellipse cx="300" cy="835" rx="38" ry="52" fill={ROAST} />
            <ellipse cx="550" cy="835" rx="38" ry="52" fill={ROAST} />
            <path d="M318 822 L346 826 M318 846 L346 850 M532 826 L504 830 M532 850 L504 854" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          </>
        );
      case 'portrait':
        return <Head blink={animated} />;
      case 'holding-cup':
      default:
        return (
          <>
            <Body />
            <Head blink={animated} />
            <Steam animate={animated} />
            <Cup />
            <CupPaw />
            <RightPawUnderCup />
          </>
        );
    }
  })();

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : alt}
      aria-hidden={decorative ? true : undefined}
    >
      <svg
        viewBox={pose === 'portrait' ? PORTRAIT_VIEW_BOX : VIEW_BOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <g className={animated && pose !== 'portrait' ? 'aya-bob' : undefined}>{figure}</g>
      </svg>
    </div>
  );
};
