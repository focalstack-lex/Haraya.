import { Easing, interpolate, spring } from 'remotion';

/** The app's --ios-ease: sheets, bars and segmented thumbs. */
export const iosEase = Easing.bezier(0.32, 0.72, 0, 1);
/** The landing page's phone rise: fast out, long settle. */
export const riseEase = Easing.bezier(0.16, 1, 0.3, 1);
/** Symmetric move for things travelling between two rests (cursor, camera). */
export const glideEase = Easing.bezier(0.65, 0, 0.35, 1);
/** Accelerating exit. */
export const exitEase = Easing.bezier(0.55, 0, 0.8, 0.2);

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0 before `start`, 1 after `start + length`, eased in between. */
export const progress = (frame: number, start: number, length: number, easing: (t: number) => number = riseEase): number =>
  length <= 0 ? (frame >= start ? 1 : 0) : interpolate(frame, [start, start + length], [0, 1], { ...CLAMP, easing });

/** Linear blend of two numbers. */
export const mix = (from: number, to: number, t: number): number => from + (to - from) * t;

/** A soft spring that settles in about half a second at 60 fps; slight overshoot for UI that pops in. */
export const pop = (frame: number, start: number, fps: number, stiffness = 170, damping = 15): number =>
  spring({ frame: frame - start, fps, config: { stiffness, damping, mass: 0.9 } });
