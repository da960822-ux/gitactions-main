import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, sceneProgress, letterOpenProgress, createEnvelopeState, updateEnvelopeFromScroll, toggleEnvelope, reopenEnvelope, envelopeTarget, loadPreferences, savePreferences } from './interaction';

test('normalized progress clamps finite values and maps letter range', () => {
  assert.equal(clamp01(Infinity), 0);
  assert.equal(clamp01(-2), 0);
  assert.ok(Math.abs(sceneProgress(15, 10, 20) - 0.5) < 1e-12);
  assert.equal(sceneProgress(10, 10, 10), 0);
  assert.equal(letterOpenProgress(0.57), 0);
  assert.ok(Math.abs(letterOpenProgress(0.665) - 0.5) < 1e-12);
  assert.equal(letterOpenProgress(0.76), 1);
});

test('manual click persists within letter section and clears after leaving', () => {
  let state = createEnvelopeState();
  state = toggleEnvelope(state, 0.62);
  assert.equal(envelopeTarget(state, 0.62), 1);
  state = updateEnvelopeFromScroll(state, 0.72);
  assert.equal(envelopeTarget(state, 0.72), 1);
  state = toggleEnvelope(state, 0.72);
  assert.equal(envelopeTarget(state, 0.72), 0);
  state = updateEnvelopeFromScroll(state, 0.8);
  assert.equal(envelopeTarget(state, 0.8), 0);
  state = updateEnvelopeFromScroll(state, 1);
  assert.equal(envelopeTarget(state, 1), 0);
  state = updateEnvelopeFromScroll(state, 0.4);
  assert.equal(envelopeTarget(state, 0.4), 0);
  const reopenedAtLetter = reopenEnvelope(createEnvelopeState());
  assert.equal(envelopeTarget(reopenedAtLetter, 0.86), 1);
  assert.equal(envelopeTarget(updateEnvelopeFromScroll(reopenedAtLetter, 0.86), 0.86), 1);
  assert.equal(envelopeTarget(updateEnvelopeFromScroll(reopenedAtLetter, 0.4), 0.4), 0);
});

test('preferences tolerate invalid and unavailable storage', () => {
  assert.deepEqual(loadPreferences(null, 'p'), {});
  assert.deepEqual(loadPreferences({ getItem: () => '{bad' }, 'p'), {});
  const values = new Map<string, string>();
  const store = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  assert.equal(savePreferences(store, 'p', { effectsEnabled: false, stamp: 'YL' }), true);
  assert.deepEqual(loadPreferences(store, 'p'), { effectsEnabled: false, stamp: 'YL' });
  assert.equal(savePreferences({ setItem: () => { throw Error('blocked'); } }, 'p', {}), false);
});

test('domino placements use the selected tile, orient its matching end, and require three valid placements', async () => {
  const { createDominoState, placeDominoTile, isDominoChainComplete } = await import('./interaction');
  let state = createDominoState();
  assert.deepEqual(state.placed, [[0, 1]]);
  assert.equal(placeDominoTile(state, [4, 5]), null);
  state = placeDominoTile(state, [2, 1])!;
  assert.deepEqual(state.placed.at(-1), [1, 2]);
  state = placeDominoTile(state, [2, 3])!;
  state = placeDominoTile(state, [4, 3])!;
  assert.deepEqual(state.placed, [[0, 1], [1, 2], [2, 3], [3, 4]]);
  assert.equal(isDominoChainComplete(state), true);
  assert.equal(placeDominoTile(state, [4, 6]), null);
  assert.equal(placeDominoTile(state, [3.5, 4]), null);
});
