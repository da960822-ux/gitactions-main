import { describe, expect, it } from 'vitest';
import { engines } from '../core/registry';
import { seededRandom, type PlayerId } from '../core/types';
import { aiGameIds, chooseSimpleAiAction } from './simpleAi';
import { davinciGuessProbabilities } from './davinciAi';

describe('computer policies', () => {
  for (const game of aiGameIds) it(`${game}: plays legal complete matches using only player views`, () => {
    const engine = engines[game]!;
    for (const seed of [17, 91, 305]) {
      let state = engine.createInitialState(seed);
      const random = seededRandom(seed);
      for (let step = 0; step < 1800 && !engine.getResult(state); step++) {
        if (game === 'domino' && state.roundResult) { state = engine.applyAction(state, 'p1', { type: 'next-round' }); continue; }
        let acted = false;
        for (const player of ['p1', 'p2'] as PlayerId[]) {
          const before = JSON.stringify(state), view = engine.getPlayerView(state, player);
          const action = chooseSimpleAiAction(game, view, player, random);
          expect(JSON.stringify(state)).toBe(before);
          if (!action) continue;
          expect(engine.validateAction(state, player, action)).toBeNull();
          state = engine.applyAction(state, player, action); acted = true; break;
        }
        expect(acted, `${game} stuck at ${state.phase}`).toBe(true);
      }
      expect(engine.getResult(state), `${game} seed ${seed} did not finish`).toBeTruthy();
    }
  }, 60000);

  it('infers a certain number without looking at the hidden rack', () => {
    const hand = [{ color: 'black' as const, value: 'joker' as const, revealed: false }];
    const tiles = [
      { color: 'black' as const, value: 3, revealed: true },
      { color: 'black' as const, value: null, revealed: false },
      { color: 'black' as const, value: 5, revealed: true },
    ];
    expect(davinciGuessProbabilities(hand, tiles, [], 'p2').get('1:4')).toBe(1);
    expect(davinciGuessProbabilities(hand, tiles, [{ type: 'wrong-guess', actor: 'p2', targetIndex: 1, guess: 4 }], 'p2').get('1:4')).toBeUndefined();
  });

  it('supports existing Domino team modes with a computer in the second player seat', () => {
    const engine = engines.domino!;
    for(const mode of ['partners', 'humans-vs-bots']) {
      let state = engine.createInitialState(91);
      state = engine.applyAction(state, 'p1', { type: 'configure', payload: { mode, difficulty: 'hard', targetScore: 100 } });
      const random = seededRandom(91);
      for(let step=0;step<500&&!state.result;step++) {
        const player: PlayerId = state.roundResult ? 'p1' : state.turn;
        const action = state.roundResult ? { type: 'next-round' } : chooseSimpleAiAction('domino',engine.getPlayerView(state,player),player,random);
        expect(action).toBeTruthy();
        expect(engine.validateAction(state,player,action!)).toBeNull();
        state=engine.applyAction(state,player,action!);
      }
      expect(state.result).toBeTruthy();
    }
  },60000);
});
