import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { HEIGHT, STAGES, WIDTH, type StageChange, type StageKind } from '../timeline';
import { color } from '../theme';
import { iosEase, mix, progress } from '../lib/motion';

/** A fine static grain tile. It breaks up the banding a soft gradient gets in H.264. */
const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
)}")`;

const Grain: React.FC<{ strength: number }> = ({ strength }) => (
  <AbsoluteFill style={{ backgroundImage: NOISE, opacity: strength, mixBlendMode: 'overlay' }} />
);

/** River Styx with two warm glows that drift, and a vignette. The reference's violet glow, in roast and steam. */
const DarkStage: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / 60;
  // Small, warm cores on a clean River Styx field: a wide low glow reads as brown haze, a tight one as light
  const glows = [
    'radial-gradient(ellipse 120% 92% at 50% 50%, rgba(6, 8, 10, 0) 50%, rgba(6, 8, 10, 0.62) 100%)',
    `radial-gradient(760px 520px at ${28 + Math.sin(t * 0.33) * 6}% ${30 + Math.cos(t * 0.27) * 6}%, rgba(231, 172, 103, 0.2), rgba(231, 172, 103, 0.07) 42%, rgba(231, 172, 103, 0) 72%)`,
    `radial-gradient(680px 480px at ${76 + Math.cos(t * 0.29) * 6}% ${76 + Math.sin(t * 0.24) * 6}%, rgba(255, 193, 131, 0.13), rgba(255, 193, 131, 0.04) 45%, rgba(255, 193, 131, 0) 72%)`,
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: color.ink, backgroundImage: glows.join(', ') }}>
      <Grain strength={0.09} />
    </AbsoluteFill>
  );
};

/** Linen with three drifting blobs in the brand's own warm tones: coffee, peach and steam. */
const LinenStage: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / 60;
  const blobs = [
    `radial-gradient(1050px 720px at ${80 + Math.sin(t * 0.31) * 6}% ${20 + Math.cos(t * 0.25) * 7}%, rgba(255, 193, 131, 0.55), rgba(255, 193, 131, 0) 70%)`,
    `radial-gradient(1000px 760px at ${14 + Math.cos(t * 0.23) * 6}% ${82 + Math.sin(t * 0.29) * 6}%, rgba(255, 233, 202, 1), rgba(255, 233, 202, 0) 70%)`,
    `radial-gradient(760px 560px at ${58 + Math.sin(t * 0.19) * 9}% ${78 + Math.cos(t * 0.21) * 7}%, rgba(231, 172, 103, 0.3), rgba(231, 172, 103, 0) 70%)`,
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: color.canvas, backgroundImage: blobs.join(', ') }}>
      <Grain strength={0.05} />
    </AbsoluteFill>
  );
};

const Stage: React.FC<{ kind: StageKind; frame: number }> = ({ kind, frame }) =>
  kind === 'dark' ? <DarkStage frame={frame} /> : <LinenStage frame={frame} />;

/** Center and radius of an iris transition at progress p, shared with scenes that recolor text at its edge. */
export const irisGeometry = (change: StageChange, p: number): { x: number; y: number; r: number } => {
  const [x, y] = change.origin ?? [WIDTH / 2, HEIGHT / 2];
  const reach = Math.hypot(Math.max(x, WIDTH - x), Math.max(y, HEIGHT - y)) + 40;
  const start = change.startRadius ?? 0;
  return { x, y, r: p <= 0 ? 0 : start + p * (reach - start) };
};

/** The stage change that starts at an absolute frame. Scenes look up their own transition with it. */
export const stageStartingAt = (frame: number): StageChange => {
  const change = STAGES.find((entry) => entry.at === frame);
  if (!change) throw new Error(`No stage change starts at frame ${frame}`);
  return change;
};

/** Progress of a stage change at an absolute frame, on the same curve the backdrop uses. */
export const stageProgress = (change: StageChange, frame: number): number => progress(frame, change.at, change.length, iosEase);

/** Clip or move the incoming stage for its transition at progress p (0 to 1). */
const entrance = (change: StageChange, p: number): React.CSSProperties => {
  switch (change.transition) {
    case 'iris': {
      const { x, y, r } = irisGeometry(change, p);
      return { clipPath: `circle(${r}px at ${x}px ${y}px)` };
    }
    case 'wipe': {
      // A slanted edge sweeping right to left
      const slant = 320;
      const edge = mix(WIDTH + slant, 0, p);
      return { clipPath: `polygon(${edge}px 0, ${WIDTH + slant}px 0, ${WIDTH + slant}px ${HEIGHT}px, ${edge - slant}px ${HEIGHT}px)` };
    }
    case 'rise': {
      // The stage rises like one of the app's sheets, its rounded top flattening as it covers the frame
      const corner = 72 * (1 - p);
      return {
        transform: `translateY(${(1 - p) * (HEIGHT + 60)}px)`,
        borderTopLeftRadius: corner,
        borderTopRightRadius: corner,
        overflow: 'hidden',
        boxShadow: '0 -24px 80px rgba(19, 25, 31, 0.35)',
      };
    }
    case 'cut':
    default:
      return {};
  }
};

/** The stage under every scene for the current frame, with at most two layers drawn. */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  let index = 0;
  for (let i = 0; i < STAGES.length; i++) if (STAGES[i].at <= frame) index = i;
  const current = STAGES[index];
  const p = stageProgress(current, frame);

  if (index === 0 || p >= 1) {
    return <Stage kind={current.kind} frame={frame} />;
  }
  return (
    <AbsoluteFill>
      <Stage kind={STAGES[index - 1].kind} frame={frame} />
      <AbsoluteFill style={entrance(current, p)}>
        <Stage kind={current.kind} frame={frame} />
        {current.transition === 'rise' && (
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: WIDTH / 2 - 44,
              width: 88,
              height: 10,
              borderRadius: 5,
              background: 'rgba(255, 253, 249, 0.35)',
              opacity: 1 - p,
            }}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
