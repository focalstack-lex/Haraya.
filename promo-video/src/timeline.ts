/**
 * The one source of timing for the video. Scenes animate from these beats and the SFX cue sheet is generated from
 * the same numbers, so a sound placed from the sheet always lands on its picture. No imports: the Node scripts and
 * the Remotion bundle both read this file.
 *
 * Frames are 60 per second. A scene's beats are frames from that scene's own start.
 */

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = 4500;

export type SceneId = 'hook' | 'reveal' | 'promise' | 'mood' | 'walk' | 'focus' | 'passport' | 'owners' | 'community' | 'end';

export interface SceneSpec {
  from: number;
  duration: number;
  beats: Record<string, number>;
}

/** Scenes may overlap by a few frames: the later one draws on top while the earlier one leaves. */
export const SCENES = {
  hook: {
    from: 0,
    duration: 420,
    beats: { line: 20, pivot: 140, chip1: 175, chip2: 205, chip3: 235, out: 350 },
  },
  reveal: {
    from: 400,
    duration: 330,
    beats: { caret: 8, type: 22, iris: 90, logo: 100, aya: 150, shine: 196, out: 300 },
  },
  promise: {
    from: 710,
    duration: 490,
    beats: { headline: 12, band: 150, open: 318, note: 372, out: 456 },
  },
  mood: {
    from: 1190,
    duration: 670,
    beats: { headline: 12, aya: 40, card: 70, cursor: 112, tap: 172, phone: 246, flank: 318, push: 440, out: 632 },
  },
  walk: {
    from: 1840,
    duration: 560,
    beats: { wipe: 0, headline: 26, map: 44, route: 92, arrive: 244, phone: 300, flank: 360, out: 520 },
  },
  focus: {
    from: 2390,
    duration: 490,
    beats: { iris: 0, headline: 22, card: 40, cursor: 104, tap: 158, morph: 184, headline2: 204, timer: 232, finish: 414, out: 448 },
  },
  passport: {
    from: 2856,
    duration: 384,
    beats: { headline: 10, page: 18, stamp: 92, settle: 150, push: 196, out: 340 },
  },
  owners: {
    from: 3230,
    duration: 670,
    beats: { rise: 0, question: 30, listing: 128, badge: 176, editor: 250, wifi: 320, plugs: 352, photo: 402, stats: 468, permit: 572, out: 636 },
  },
  community: {
    from: 3890,
    duration: 260,
    beats: { iris: 0, question: 22, pin: 80, land: 104, add: 124, out: 226 },
  },
  end: {
    from: 4140,
    duration: 360,
    beats: { headline: 10, logo: 70, aya: 100, sub: 140, cta: 168, cursor: 196, tap: 240, hold: 300 },
  },
} as const satisfies Record<SceneId, SceneSpec>;

/** Absolute frame of a scene beat. */
export const at = <S extends SceneId>(scene: S, beat: keyof (typeof SCENES)[S]['beats']): number =>
  SCENES[scene].from + (SCENES[scene].beats as Record<string, number>)[beat as string];

export type StageKind = 'dark' | 'linen';
export type StageTransition = 'cut' | 'iris' | 'wipe' | 'rise';

export interface StageChange {
  /** Absolute frame the change starts. */
  at: number;
  kind: StageKind;
  transition: StageTransition;
  /** Frames the transition takes. */
  length: number;
  /** Iris center in video pixels. */
  origin?: [number, number];
  /** Iris radius at the start, when it opens from under something already covering the center. */
  startRadius?: number;
}

/** The background under every scene: River Styx dark or linen, and how it switches. */
export const STAGES: StageChange[] = [
  { at: 0, kind: 'dark', transition: 'cut', length: 0 },
  { at: at('reveal', 'iris'), kind: 'linen', transition: 'iris', length: 44, origin: [960, 540] },
  { at: at('walk', 'wipe'), kind: 'dark', transition: 'wipe', length: 40 },
  // Opens from under the walk's zoomed phone screen, so the phone dissolves straight into linen
  { at: at('focus', 'iris'), kind: 'linen', transition: 'iris', length: 42, origin: [960, 560], startRadius: 560 },
  { at: at('owners', 'rise'), kind: 'dark', transition: 'rise', length: 40 },
  { at: at('community', 'iris'), kind: 'linen', transition: 'iris', length: 40, origin: [960, 540] },
];

export type CueKind =
  | 'whoosh'
  | 'swell'
  | 'pop'
  | 'tap'
  | 'type'
  | 'impact'
  | 'shimmer'
  | 'ripple'
  | 'draw'
  | 'ding'
  | 'tick'
  | 'thud'
  | 'drop';

export interface Cue {
  frame: number;
  kind: CueKind;
  note: string;
  /** Frames the sound should run for, where it is a run rather than a hit. */
  length?: number;
}

const cue = <S extends SceneId>(
  scene: S,
  beat: keyof (typeof SCENES)[S]['beats'],
  kind: CueKind,
  note: string,
  options: { offset?: number; length?: number } = {}
): Cue => ({ frame: at(scene, beat) + (options.offset ?? 0), kind, note, ...(options.length ? { length: options.length } : {}) });

/** Characters of "Introducing" times the typewriter's frames per character. */
export const TYPE_FRAMES_PER_CHAR = 3;
const INTRO_TYPE_LENGTH = 'Introducing'.length * TYPE_FRAMES_PER_CHAR;

/** How long the focus timer races and the owner numbers count. */
export const TIMER_RACE_FRAMES = 150;
export const STATS_COUNT_FRAMES = 90;
export const ROUTE_DRAW_FRAMES = 150;

export const CUES: Cue[] = [
  cue('hook', 'line', 'whoosh', 'Soft air rise under "Not just the closest cafe."'),
  cue('hook', 'pivot', 'whoosh', 'Light swipe as the line lifts and "The one with" appears'),
  cue('hook', 'chip1', 'pop', 'Chip pops in: A free plug'),
  cue('hook', 'chip2', 'pop', 'Chip pops in: A quiet table'),
  cue('hook', 'chip3', 'pop', 'Chip pops in: A door that is still open'),
  cue('hook', 'out', 'whoosh', 'Everything pushes past the camera and out of focus'),
  cue('reveal', 'type', 'type', 'Keyboard run: "Introducing"', { length: INTRO_TYPE_LENGTH }),
  cue('reveal', 'iris', 'swell', 'Riser as the linen iris opens, peaking when the logo is sharp', { length: 44 }),
  cue('reveal', 'logo', 'impact', 'Soft low hit as the logo comes into focus', { offset: 30 }),
  cue('reveal', 'aya', 'pop', 'Aya pops up and waves'),
  cue('reveal', 'shine', 'shimmer', 'Shine sweeps across the logo'),
  cue('reveal', 'out', 'whoosh', 'Logo lifts away'),
  cue('promise', 'headline', 'whoosh', 'Words rise: "Find your daily cup in Davao."'),
  cue('promise', 'band', 'whoosh', 'Long glide as the line of what Haraya finds slides across', { length: 150 }),
  cue('promise', 'open', 'pop', 'The Open now pill lands'),
  cue('promise', 'open', 'ripple', 'Rings spread out from the pill', { offset: 6, length: 90 }),
  cue('promise', 'out', 'whoosh', 'Scene clears'),
  cue('mood', 'headline', 'whoosh', 'Words rise: "Tell Aya how you feel."'),
  cue('mood', 'aya', 'pop', 'Aya pops in with her heart of steam'),
  cue('mood', 'card', 'pop', 'Mood chips cascade in, six light pops', { length: 30 }),
  cue('mood', 'tap', 'tap', 'Tap: Focused'),
  cue('mood', 'phone', 'whoosh', 'The phone rises and tilts upright'),
  cue('mood', 'push', 'whoosh', 'Slow push in on the picks', { length: 60 }),
  cue('walk', 'wipe', 'whoosh', 'Wipe to the dark map'),
  cue('walk', 'headline', 'whoosh', 'Words rise: "Walk there in the app."'),
  cue('walk', 'route', 'draw', 'The walking route draws along the streets', { length: ROUTE_DRAW_FRAMES }),
  cue('walk', 'arrive', 'ding', 'The route reaches the cafe'),
  cue('walk', 'phone', 'whoosh', 'The phone rises with the live walk'),
  cue('focus', 'iris', 'whoosh', 'Push through the phone into the linen check-in scene'),
  cue('focus', 'card', 'pop', 'The check-in card rises'),
  cue('focus', 'tap', 'tap', 'Tap: Start Focus Session'),
  cue('focus', 'morph', 'whoosh', 'The button stretches into the focus banner'),
  cue('focus', 'timer', 'tick', 'Clock ticks speeding up as the timer races', { length: TIMER_RACE_FRAMES }),
  cue('focus', 'finish', 'tap', 'Tap: Finish'),
  cue('passport', 'page', 'pop', 'The passport page slides in'),
  cue('passport', 'stamp', 'thud', 'Rubber stamp slams onto the page', { offset: 10 }),
  cue('passport', 'push', 'whoosh', 'Slow push in on the fresh stamp', { length: 90 }),
  cue('owners', 'rise', 'whoosh', 'Dark sheet rises over the scene'),
  cue('owners', 'question', 'whoosh', 'Words rise: "Own a cafe or study spot?"'),
  cue('owners', 'listing', 'pop', 'The listing card pops in'),
  cue('owners', 'badge', 'ding', 'Verified badge appears'),
  cue('owners', 'editor', 'whoosh', 'The owner editor tilts up'),
  cue('owners', 'wifi', 'tap', 'Tap: Wi-Fi'),
  cue('owners', 'plugs', 'tap', 'Tap: Plugs'),
  cue('owners', 'photo', 'tap', 'Tap: Add photo, the photo pops in as the cover'),
  cue('owners', 'stats', 'tick', 'Numbers count up', { length: STATS_COUNT_FRAMES }),
  cue('owners', 'permit', 'ding', 'Shield appears: the permit check', { offset: 14 }),
  cue('community', 'iris', 'whoosh', 'Iris back to linen'),
  cue('community', 'pin', 'drop', 'A pin drops and bounces on the map', { offset: 24 }),
  cue('end', 'headline', 'whoosh', 'Words rise: "Your next cup is close."'),
  cue('end', 'logo', 'impact', 'Logo lands as it comes into focus', { offset: 24 }),
  cue('end', 'aya', 'pop', 'Aya raises her cup'),
  cue('end', 'cta', 'pop', 'The Open Haraya button appears'),
  cue('end', 'tap', 'tap', 'Tap: Open Haraya'),
  cue('end', 'tap', 'shimmer', 'Shine across the button after the tap', { offset: 6 }),
].sort((a, b) => a.frame - b.frame);

const pad = (value: number, size = 2) => String(value).padStart(size, '0');

/** Minutes, seconds and frames, the way an edit timeline at 60 fps shows it. */
export const toTimecode = (frame: number): string => {
  const seconds = Math.floor(frame / FPS);
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}:${pad(frame % FPS)}`;
};

/** Minutes and seconds with milliseconds, readable in any editor whatever its frame rate. */
export const toClock = (frame: number): string => {
  const totalMs = Math.round((frame / FPS) * 1000);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  return `${minutes}:${pad(seconds)}.${pad(totalMs % 1000, 3)}`;
};
