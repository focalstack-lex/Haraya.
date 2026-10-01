/**
 * Renders review stills of HarayaPromo from one bundle: out/stills/<frame>.jpg for every frame given.
 *
 * Run: node scripts/stills.mjs 60 240 480        (frames)
 *      node scripts/stills.mjs --scene mood       (the start, every beat and the end of one scene)
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { webpackOverride } from '../webpack-override.ts';
import { SCENES } from '../src/timeline.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// The override resolves paths from the working directory, as it does under the Remotion CLI
process.chdir(root);
const out = join(root, 'out', 'stills');
mkdirSync(out, { recursive: true });

const args = process.argv.slice(2);
let frames;
if (args[0] === '--scene') {
  const scene = SCENES[args[1]];
  if (!scene) throw new Error(`Unknown scene ${args[1]}; one of ${Object.keys(SCENES).join(', ')}`);
  const beats = Object.values(scene.beats).map((beat) => scene.from + beat + 12);
  frames = [...new Set([scene.from + 2, ...beats, scene.from + scene.duration - 2])].sort((a, b) => a - b);
} else {
  frames = args.map(Number).filter(Number.isFinite);
}
if (frames.length === 0) throw new Error('Give frame numbers, or --scene <id>');

const serveUrl = await bundle({ entryPoint: join(root, 'src', 'index.ts'), webpackOverride, publicDir: join(root, 'public') });
const composition = await selectComposition({ serveUrl, id: 'HarayaPromo' });
for (const frame of frames) {
  const output = join(out, `${String(frame).padStart(4, '0')}.jpg`);
  await renderStill({ serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 88, scale: 0.5 });
  console.log(`stills: ${output}`);
}
