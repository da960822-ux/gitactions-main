import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, sceneProgress, letterOpenProgress, createEnvelopeState, updateEnvelopeFromScroll, toggleEnvelope, reopenEnvelope, envelopeTarget, closeEnvelope, LETTER_PAPER_HANDOFF, loadPreferences, savePreferences } from './interaction';

test('normalized progress clamps finite values and maps letter range', () => {
  assert.equal(clamp01(Infinity), 0);
  assert.equal(clamp01(-2), 0);
  assert.ok(Math.abs(sceneProgress(15, 10, 20) - 0.5) < 1e-12);
  assert.equal(sceneProgress(10, 10, 10), 0);
  assert.equal(letterOpenProgress(0.62), 0);
  assert.ok(Math.abs(letterOpenProgress(0.72) - 0.5) < 1e-12);
  assert.equal(letterOpenProgress(0.79), 1);
});

test('manual letter state survives forward, reverse and mid-scroll direction changes', () => {
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
  assert.equal(envelopeTarget(updateEnvelopeFromScroll(reopenedAtLetter, 0.4), 0.4), 1);
});

test('a partial scroll opening still continues opening on the primary toggle',()=>{
 const state=updateEnvelopeFromScroll(createEnvelopeState(),.686);
 assert.ok(envelopeTarget(state,.686)>0&&envelopeTarget(state,.686)<.5);
 assert.equal(envelopeTarget(toggleEnvelope(state,.686),.686),1);
});

test('reader close keeps the paper open through reverse handoff and a new opening owns the target',()=>{
 let closing=closeEnvelope(reopenEnvelope(createEnvelopeState()),.884);
 assert.equal(closing.manual,false,'the explicit close intent is retained during the return');
 assert.equal(closing.returning,true);
 for(const pausedOrReversed of [.884,.81,.83,.75]){closing=updateEnvelopeFromScroll(closing,pausedOrReversed);assert.equal(envelopeTarget(closing,pausedOrReversed),1,'a paused or reversed return cannot fold the reader in place');}
 const reopened=reopenEnvelope(closing);
 assert.equal(reopened.returning,false);assert.equal(envelopeTarget(updateEnvelopeFromScroll(reopened,LETTER_PAPER_HANDOFF),LETTER_PAPER_HANDOFF),1,'a new direct/shared/hash opening cancels the old close target');
 assert.equal(toggleEnvelope(closing,.81).manual,true,'the same control can reverse its pending close');
 closing=updateEnvelopeFromScroll(closing,LETTER_PAPER_HANDOFF);
 assert.equal(closing.returning,false);assert.equal(envelopeTarget(closing,LETTER_PAPER_HANDOFF),0,'folding starts only after physical paper ownership returns');
 assert.equal(envelopeTarget(updateEnvelopeFromScroll(closing,.884),.884),0,'later forward scroll does not undo the explicit close');
});

test('preferences tolerate invalid and unavailable storage', () => {
  assert.deepEqual(loadPreferences(null, 'p'), {});
  assert.deepEqual(loadPreferences({getItem:()=>'{"pawn":6}'}, 'p'), {pawn:6});
  assert.deepEqual(loadPreferences({getItem:()=>'{"pawn":7}'}, 'p'), {});
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
