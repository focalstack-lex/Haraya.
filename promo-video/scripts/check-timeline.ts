import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CUES, FPS, SCENES, STAGES, TOTAL_FRAMES, toClock, toTimecode, type SceneId } from '../src/timeline.ts';

const sceneIds = Object.keys(SCENES) as SceneId[];

test('the video is 75 seconds at 60 fps', () => {
  assert.equal(FPS, 60);
  assert.equal(TOTAL_FRAMES, 75 * FPS);
});

test('scenes are in order and every frame belongs to at least one scene', () => {
  const starts = sceneIds.map((id) => SCENES[id].from);
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const covered = sceneIds.some((id) => frame >= SCENES[id].from && frame < SCENES[id].from + SCENES[id].duration);
    assert.ok(covered, `frame ${frame} is not inside any scene`);
  }
  const last = SCENES[sceneIds[sceneIds.length - 1]];
  assert.equal(last.from + last.duration, TOTAL_FRAMES);
});

test('every beat sits inside its own scene', () => {
  for (const id of sceneIds) {
    for (const [name, beat] of Object.entries(SCENES[id].beats)) {
      assert.ok(beat >= 0 && beat < SCENES[id].duration, `${id}.${name} = ${beat} is outside 0..${SCENES[id].duration - 1}`);
    }
  }
});

test('stages start dark, alternate, and change inside the video', () => {
  assert.equal(STAGES[0].at, 0);
  assert.equal(STAGES[0].kind, 'dark');
  for (let i = 1; i < STAGES.length; i++) {
    assert.ok(STAGES[i].at > STAGES[i - 1].at + STAGES[i - 1].length, `stage ${i} starts before stage ${i - 1} finishes`);
    assert.notEqual(STAGES[i].kind, STAGES[i - 1].kind, `stage ${i} repeats ${STAGES[i].kind}`);
    assert.ok(STAGES[i].at + STAGES[i].length < TOTAL_FRAMES);
  }
});

test('cues are sorted, inside the video, and described', () => {
  assert.ok(CUES.length > 20);
  for (let i = 0; i < CUES.length; i++) {
    const cue = CUES[i];
    assert.ok(cue.frame >= 0 && cue.frame < TOTAL_FRAMES, `cue ${cue.note} at ${cue.frame}`);
    assert.ok(cue.note.length > 0);
    assert.ok(!/[\u2013\u2014]/.test(cue.note), `cue note uses a long dash: ${cue.note}`);
    if (i > 0) assert.ok(cue.frame >= CUES[i - 1].frame, `cue ${cue.note} is out of order`);
    if (cue.length !== undefined) assert.ok(cue.frame + cue.length <= TOTAL_FRAMES);
  }
});

test('timecodes read as minutes, seconds and frames, and as a clock', () => {
  assert.equal(toTimecode(0), '00:00:00');
  assert.equal(toTimecode(61), '00:01:01');
  assert.equal(toTimecode(3659), '01:00:59');
  assert.equal(toClock(90), '0:01.500');
  assert.equal(toClock(4499), '1:14.983');
});
