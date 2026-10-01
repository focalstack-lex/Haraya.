/**
 * Writes the SFX cue sheet for the editor: out/SFX_CUES.md (to read) and out/SFX_CUES.csv (to import or sort).
 * Every row comes from src/timeline.ts, the same numbers the scenes animate from.
 *
 * Run: npm run cues
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CUES, FPS, HEIGHT, SCENES, TOTAL_FRAMES, WIDTH, toClock, toTimecode, type CueKind, type SceneId } from '../src/timeline.ts';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');

const SOUND: Record<CueKind, string> = {
  whoosh: 'Soft air whoosh, short and clean',
  swell: 'Riser or reverse swell that peaks at the end of the run',
  pop: 'Light bubbly UI pop',
  tap: 'Crisp finger tap or click',
  type: 'Soft keyboard run for the whole length',
  impact: 'Warm low hit, felt more than heard',
  shimmer: 'Short glint or sparkle',
  ripple: 'Airy ring or water ripple that fades out',
  draw: 'Marker or pen glide that follows the line',
  ding: 'Bright, friendly success chime',
  tick: 'Clock ticks that speed up for the whole length',
  thud: 'Rubber stamp thump with a little paper',
  drop: 'Pin drop plink with a small bounce',
};

const sceneOf = (frame: number): SceneId => {
  const ids = Object.keys(SCENES) as SceneId[];
  // The latest scene that has started wins, because later scenes draw on top during an overlap
  return ids.filter((id) => SCENES[id].from <= frame).pop() ?? ids[0];
};

const seconds = (frames: number) => (frames / FPS).toFixed(3);

const markdown = [
  '# Haraya promo video: SFX cue sheet',
  '',
  `Video: \`out/haraya-promo.mp4\`, ${WIDTH}x${HEIGHT}, ${FPS} fps, ${seconds(TOTAL_FRAMES)} s, no audio track.`,
  'Generated from `src/timeline.ts` by `npm run cues`, so it always matches the render.',
  '',
  'Time is minutes:seconds.milliseconds and works in any editor. Timecode and frame are at 60 fps; at 30 fps halve',
  'the frame number. Length is how long a run should last; empty means a single hit.',
  '',
  '## Scenes',
  '',
  '| Scene | Starts | Timecode | Length |',
  '| --- | --- | --- | --- |',
  ...(Object.keys(SCENES) as SceneId[]).map(
    (id) => `| ${id} | ${toClock(SCENES[id].from)} | ${toTimecode(SCENES[id].from)} | ${seconds(SCENES[id].duration)} s |`
  ),
  '',
  '## Cues',
  '',
  '| # | Time | Timecode | Frame | Scene | Cue | Length | What happens |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...CUES.map(
    (cue, index) =>
      `| ${index + 1} | ${toClock(cue.frame)} | ${toTimecode(cue.frame)} | ${cue.frame} | ${sceneOf(cue.frame)} | ${cue.kind} | ${
        cue.length ? `${seconds(cue.length)} s` : ''
      } | ${cue.note} |`
  ),
  '',
  '## Sound for each cue',
  '',
  '| Cue | Suggested sound |',
  '| --- | --- |',
  ...(Object.keys(SOUND) as CueKind[]).map((kind) => `| ${kind} | ${SOUND[kind]} |`),
  '',
].join('\n');

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const csv = [
  ['index', 'seconds', 'clock', 'timecode_60fps', 'frame_60fps', 'scene', 'kind', 'length_seconds', 'note'].join(','),
  ...CUES.map((cue, index) =>
    [index + 1, seconds(cue.frame), toClock(cue.frame), toTimecode(cue.frame), cue.frame, sceneOf(cue.frame), cue.kind, cue.length ? seconds(cue.length) : '', cue.note]
      .map(csvCell)
      .join(',')
  ),
  '',
].join('\n');

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'SFX_CUES.md'), markdown);
writeFileSync(join(OUT, 'SFX_CUES.csv'), csv);
console.log(`cue-sheet: wrote ${CUES.length} cues to out/SFX_CUES.md and out/SFX_CUES.csv`);
