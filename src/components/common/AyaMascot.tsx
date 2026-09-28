import React from 'react';

/**
 * One pose per surface, so Aya reads as a character rather than a repeated sticker:
 * - welcome: first run (WelcomeModal)
 * - mood: Mood Finder, steam curling into a heart
 * - empty: empty and no-result states, peering into an empty cup with one ear drooped
 * - drops: Roast Drops, hugging a bean sack
 * - holding-cup: the master reference pose
 * - portrait: head only, for compact marks
 * Sanctuary passport poses, one emotion each:
 * - focus: calm concentration, eyes half-lidded over an open book (floating focus banner)
 * - arrive: delight, both paws up with sparkles (check-in, you are at the spot)
 * - wander: wistful, gazing up at a map pin with one ear drooped (check-in, too far away)
 * - content: satisfied, happy closed eyes, cup held to her chest (end of a session)
 * - stamp: proud, rubber stamp raised over a stamped passport page (passport tab)
 * - clink: cheerful, cup raised in a toast with clink sparks (diary)
 */
export type AyaPose =
  | 'holding-cup'
  | 'welcome'
  | 'mood'
  | 'empty'
  | 'drops'
  | 'portrait'
  | 'focus'
  | 'arrive'
  | 'wander'
  | 'content'
  | 'stamp'
  | 'clink';

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

type Gaze = 'forward' | 'up' | 'down' | 'upLeft';

const PUPIL_OFFSET: Record<Gaze, { dx: number; dy: number }> = {
  forward: { dx: 0, dy: 0 },
  up: { dx: 6, dy: -30 },
  down: { dx: 0, dy: 38 },
  upLeft: { dx: -34, dy: -26 },
};

/** half: calm lids over the top of each eye; happy: eyes closed into upward arcs. */
type Lids = 'open' | 'half' | 'happy';

const Eyes: React.FC<{ gaze?: Gaze; sparkle?: boolean; blink: boolean; lids?: Lids }> = ({
  gaze = 'forward',
  sparkle,
  blink,
  lids = 'open',
}) => {
  const { dx, dy } = PUPIL_OFFSET[gaze];
  if (lids === 'happy') {
    return (
      <g>
        <path d="M180 462 Q275 360 370 462" stroke={CREAM} strokeWidth="30" strokeLinecap="round" fill="none" />
        <path d="M477 462 Q572 360 667 462" stroke={CREAM} strokeWidth="30" strokeLinecap="round" fill="none" />
        <ellipse cx="190" cy="548" rx="46" ry="26" fill={STEAM} opacity="0.55" />
        <ellipse cx="660" cy="548" rx="46" ry="26" fill={STEAM} opacity="0.55" />
      </g>
    );
  }
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
      {lids === 'half' && (
        <>
          <path d="M152 440 A123 152 0 0 1 398 440 Z" fill={ROAST} />
          <path d="M449 440 A123 152 0 0 1 695 440 Z" fill={ROAST} />
          <path d="M170 440 L380 440 M467 440 L677 440" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        </>
      )}
    </g>
  );
};

const Head: React.FC<{ gaze?: Gaze; sparkle?: boolean; droopRightEar?: boolean; blink: boolean; lids?: Lids }> = ({
  gaze,
  sparkle,
  droopRightEar,
  blink,
  lids,
}) => (
  <g>
    <Ear side="left" />
    <Ear side="right" droop={droopRightEar} />
    <Leaves />
    <ellipse cx="425" cy="415" rx="325" ry="262" fill={ROAST} />
    <Eyes gaze={gaze} sparkle={sparkle} blink={blink} lids={lids} />
  </g>
);

/** Four-point sparkle in steam, centered on (cx, cy). */
const Sparkle: React.FC<{ cx: number; cy: number; r?: number }> = ({ cx, cy, r = 34 }) => {
  const k = r * 0.18;
  return (
    <path
      d={`M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`}
      fill={STEAM}
    />
  );
};

/** A raised arm ending in a round paw. */
const RaisedArm: React.FC<{ d: string; paw: [number, number] }> = ({ d, paw }) => (
  <g>
    <path d={d} stroke={ROAST} strokeWidth="70" strokeLinecap="round" fill="none" />
    <circle cx={paw[0]} cy={paw[1]} r="44" fill={ROAST} />
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
      case 'focus':
        return (
          <>
            <Body />
            <Head gaze="down" lids="half" blink={false} />
            {/* Open book held low; the cover peeks out behind the pages */}
            <path d="M425 772 C375 752 305 750 268 766 L268 896 C305 882 375 884 425 904 C475 884 545 882 582 896 L582 766 C545 750 475 752 425 772 Z" fill={TAN} />
            <path d="M425 760 C380 740 320 738 282 752 L282 880 C320 866 380 868 425 888 Z" fill={CREAM} />
            <path d="M425 760 C470 740 530 738 568 752 L568 880 C530 866 470 868 425 888 Z" fill={CREAM} />
            <path d="M425 762 L425 886" stroke={TAN} strokeWidth="6" strokeLinecap="round" />
            <path
              d="M312 786 C340 778 372 780 402 790 M312 816 C340 808 372 810 402 820 M312 846 C340 838 362 840 380 846 M448 790 C478 780 510 778 538 786 M448 820 C478 810 510 808 538 816"
              stroke="#E4D2BD"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx="270" cy="852" rx="36" ry="48" fill={ROAST} />
            <ellipse cx="580" cy="852" rx="36" ry="48" fill={ROAST} />
          </>
        );
      case 'arrive':
        return (
          <>
            <Body />
            <g className={animated ? 'aya-wave' : undefined}>
              <RaisedArm d="M600 772 Q690 730 735 620" paw={[738, 602]} />
            </g>
            <RaisedArm d="M250 772 Q160 730 118 620" paw={[114, 602]} />
            <Head gaze="up" sparkle blink={animated} />
            <g className={animated ? 'aya-float' : undefined}>
              <Sparkle cx={58} cy={470} />
              <Sparkle cx={805} cy={455} r={26} />
            </g>
            <g className={animated ? 'aya-float aya-float-late' : undefined}>
              <Sparkle cx={176} cy={505} r={20} />
              <Sparkle cx={700} cy={510} r={18} />
            </g>
            <ellipse cx="338" cy="840" rx="38" ry="44" fill={ROAST} />
            <ellipse cx="512" cy="840" rx="38" ry="44" fill={ROAST} />
          </>
        );
      case 'wander':
        return (
          <>
            <Body />
            <Head gaze="upLeft" droopRightEar blink={animated} />
            <RaisedArm d="M252 780 Q170 770 128 712" paw={[124, 700]} />
            {/* Map pin held up like a lantern */}
            <g className={animated ? 'aya-float' : undefined}>
              <path d="M112 500 C70 500 48 532 48 562 C48 602 112 656 112 656 C112 656 176 602 176 562 C176 532 154 500 112 500 Z" fill={STEAM} />
              <circle cx="112" cy="560" r="24" fill={CREAM} />
            </g>
            <ellipse cx="560" cy="846" rx="38" ry="48" fill={ROAST} />
            {/* The dotted trail still to walk */}
            <g fill={TAN} opacity="0.75">
              <circle cx="640" cy="950" r="11" />
              <circle cx="700" cy="938" r="11" />
              <circle cx="756" cy="918" r="11" />
              <circle cx="806" cy="892" r="11" />
            </g>
          </>
        );
      case 'content':
        return (
          <>
            <Body />
            <g transform="rotate(5 425 690)">
              <Head lids="happy" blink={false} />
            </g>
            <g className={animated ? 'aya-steam' : undefined}>
              <path d="M425 716 C405 696 440 682 425 660" {...STEAM_STROKE} strokeWidth={14} />
            </g>
            <g transform="translate(0 18)">
              <Cup />
            </g>
            <ellipse cx="330" cy="818" rx="44" ry="56" fill={ROAST} />
            <ellipse cx="520" cy="818" rx="44" ry="56" fill={ROAST} />
            <path d="M306 806 L350 809 M306 830 L350 833 M544 809 L500 812 M544 833 L500 836" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          </>
        );
      case 'stamp':
        return (
          <>
            <Body />
            {/* Passport page with a fresh steam-ink ring */}
            <g transform="rotate(-8 330 830)">
              <rect x="222" y="752" width="220" height="160" rx="16" fill={CREAM} />
              <circle cx="332" cy="832" r="48" stroke={STEAM} strokeWidth="10" fill="none" />
              <circle cx="332" cy="832" r="30" stroke={STEAM} strokeWidth="5" fill="none" strokeDasharray="10 8" />
            </g>
            <ellipse cx="238" cy="860" rx="38" ry="50" fill={ROAST} />
            <Head sparkle blink={animated} />
            {/* Rubber stamp raised in the right paw */}
            <g className={animated ? 'aya-wave' : undefined}>
              <path d="M600 790 Q720 780 772 700" stroke={ROAST} strokeWidth="70" strokeLinecap="round" fill="none" />
              <rect x="732" y="600" width="80" height="34" rx="10" fill={INK} />
              <rect x="754" y="540" width="36" height="66" rx="12" fill={TAN} />
              <circle cx="772" cy="520" r="36" fill={TAN} />
              <rect x="740" y="632" width="64" height="10" rx="5" fill={STEAM} />
              <circle cx="772" cy="680" r="42" fill={ROAST} />
            </g>
          </>
        );
      case 'clink':
        return (
          <>
            <Body />
            <Head sparkle gaze="up" blink={animated} />
            <RaisedArm d="M600 800 Q712 790 716 690" paw={[716, 676]} />
            {/* Cup raised to the right in a toast, scaled about its own center */}
            <g transform="translate(300 -170) rotate(14 425 790) translate(425 790) scale(0.72) translate(-425 -790)">
              <Cup />
            </g>
            <g className={animated ? 'aya-float' : undefined}>
              <path d="M800 520 L840 484 M818 566 L866 558 M752 500 L760 452" stroke={STEAM} strokeWidth="14" strokeLinecap="round" />
            </g>
            <ellipse cx="338" cy="820" rx="40" ry="52" fill={ROAST} />
            <path d="M314 806 L354 809 M314 830 L354 833" stroke={INK} strokeWidth="5" strokeLinecap="round" />
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
