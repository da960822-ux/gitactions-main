// Reproduce from the repository root:
// ./node_modules/.bin/esbuild scripts/audit-minhwatu-fairness.ts --bundle --platform=node --format=esm --outfile=/tmp/minhwatu-fairness-audit.mjs && node /tmp/minhwatu-fairness-audit.mjs [--fixed-starter]
import { minhwatuEngine } from '../src/games/minhwatu';
import { fourMinhwatuEngine } from '../src/games/fourMinhwatu';
import { chooseSimpleAiAction } from '../src/games/simpleAi';
import { seededRandom } from '../src/core/types';
import { fourSeats } from '../src/core/fourPlayer';
import { createHash } from 'node:crypto';

const N = 1000;
const fixedStarter = process.argv.includes('--fixed-starter');
const auditSeed = (index: number) => createHash('sha256').update(`minhwatu-fairness-2026:${index}`).digest().readUInt32LE(0);
const assert = (condition: unknown, message: string) => { if (!condition) throw Error(message); };
const rand = (random: () => number, length: number) => Math.floor(random() * length);
const all = (s: any) => [...Object.values(s.hands).flat(), ...Object.values(s.captures).flat(), ...s.table, ...s.deck, ...(s.pending ? [s.pending.card] : [])] as { id: string }[];
const signature = (s: any) => JSON.stringify([Object.values(s.hands).map((h: any) => h.map((c: any) => c.id)), s.table.map((c: any) => c.id), s.deck.map((c: any) => c.id)]);
const check = (s: any, ids: string[]) => {
  const current = all(s).map(c => c.id).sort();
  assert(current.length === 48 && new Set(current).size === 48 && JSON.stringify(current) === JSON.stringify(ids), 'card conservation');
};
type Tally = { games: number; hand: number[]; plays: number[]; draw: number[]; draws: number[]; perfectDrawGames: number[]; maxDrawHits: number[]; differences: number[]; mutated: number };
function measure(mode: '2p' | '4p', policy: 'uniform' | 'ai') {
  const engine = mode === '2p' ? minhwatuEngine : fourMinhwatuEngine;
  const seats = mode === '2p' ? ['p1', 'p2'] : [...fourSeats];
  const tally: Tally = { games: 0, hand: seats.map(() => 0), plays: seats.map(() => 0), draw: seats.map(() => 0), draws: seats.map(() => 0), perfectDrawGames: seats.map(() => 0), maxDrawHits: seats.map(() => 0), differences: [], mutated: 0 };
  const layouts = new Set<string>();
  for (let seed = 0; seed < N; seed++) {
    const deckSeed = auditSeed(seed);
    let state: any = engine.createInitialState(deckSeed);
    if (fixedStarter) state.turn = 'p1';
    layouts.add(signature(state));
    const ids = all(state).map(c => c.id).sort(); check(state, ids);
    const random = seededRandom(deckSeed ^ 0x9e3779b9);
    const gameDraw = seats.map(() => 0);
    let steps = 0;
    while (!state.result && steps++ < 45) {
      const seat = state.turn, index = seats.indexOf(seat), view = engine.getPlayerView(state, seat as any);
      const actions = view.actions.map((x: any) => x.action);
      const action = policy === 'uniform' ? actions[rand(random, actions.length)] : mode === '2p' ? chooseSimpleAiAction('minhwatu', view, seat as any, random) : fourMinhwatuEngine.chooseAiAction(view as any, seat as any, random);
      assert(action && !engine.validateAction(state, seat as any, action), 'illegal action');
      const previous = JSON.stringify(state);
      if (action.type === 'play') {
        const card = state.hands[seat][Number(action.payload?.index)];
        tally.plays[index]++;
        if (state.table.some((c: any) => c.month === card.month)) tally.hand[index]++;
      }
      const drawn = action.type === 'play' ? state.deck[0] : null;
      const next: any = engine.applyAction(state, seat as any, action);
      if (JSON.stringify(state) !== previous) tally.mutated++;
      check(next, ids);
      if (drawn) {
        tally.draws[index]++;
        const hit = !!next.pending || next.captures[seat].some((c: any) => c.id === drawn.id);
        if (hit) { tally.draw[index]++; gameDraw[index]++; }
      }
      state = next;
    }
    assert(state.result && tally.draws.reduce((a,b) => a+b, 0) === (seed + 1) * 20, 'unfinished game / missing draw');
    tally.games++;
    gameDraw.forEach((hits,i) => { if (hits === 20/seats.length) tally.perfectDrawGames[i]++; tally.maxDrawHits[i] = Math.max(tally.maxDrawHits[i],hits); });
    const ai = mode === '2p' ? gameDraw[1] : gameDraw.slice(1).reduce((a,b) => a+b, 0) / 3;
    tally.differences.push((gameDraw[0] - ai) / (mode === '2p' ? 10 : 5));
  }
  const mean = tally.differences.reduce((a,b) => a+b, 0) / N;
  const variance = tally.differences.reduce((a,b) => a + (b-mean)**2, 0) / (N-1);
  const half95 = 1.96 * Math.sqrt(variance / N);
  return { mode, policy, seeds: N, uniqueLayouts: layouts.size, initialAndStepConservation: 'pass', stateMutations: tally.mutated,
    seats: Object.fromEntries(seats.map((seat,i) => [seat, { hand: `${tally.hand[i]}/${tally.plays[i]}`, draw: `${tally.draw[i]}/${tally.draws[i]}`, drawRate: tally.draw[i]/tally.draws[i], perfectDrawGames: `${tally.perfectDrawGames[i]}/${N}`, maxDrawHits: tally.maxDrawHits[i] }])),
    humanMinusAiDrawRate: mean, paired95CI: [mean-half95, mean+half95] };
}
function invariance(mode: '2p' | '4p') {
  const engine = mode === '2p' ? minhwatuEngine : fourMinhwatuEngine;
  const seats = mode === '2p' ? ['p1','p2'] : [...fourSeats];
  let cases = 0;
  for (let seed = 0; seed < N; seed++) {
    let state: any = engine.createInitialState(auditSeed(seed));
    if (fixedStarter) state.turn = 'p1';
    const rollout = seededRandom(seed+301);
    for (const seat of seats) {
      while (state.turn !== seat || state.phase !== 'play') {
        const actions = engine.getPlayerView(state, state.turn as any).actions;
        state = engine.applyAction(state, state.turn as any, actions[rand(rollout,actions.length)].action);
      }
      const altered = structuredClone(state);
      const hiddenSeat = seats.find(s => s !== seat)!;
      [altered.hands[hiddenSeat][0], altered.deck[0]] = [altered.deck[0], altered.hands[hiddenSeat][0]];
      altered.seed = (altered.seed + 1) >>> 0;
      const before: any = engine.getPlayerView(state, seat as any), after: any = engine.getPlayerView(altered, seat as any);
      assert(JSON.stringify(before) === JSON.stringify(after), 'hidden data changed public view');
      const r1 = seededRandom(seed+99), r2 = seededRandom(seed+99);
      const a1 = mode === '2p' ? chooseSimpleAiAction('minhwatu', before, seat as any, r1) : fourMinhwatuEngine.chooseAiAction(before, seat as any, r1);
      const a2 = mode === '2p' ? chooseSimpleAiAction('minhwatu', after, seat as any, r2) : fourMinhwatuEngine.chooseAiAction(after, seat as any, r2);
      assert(JSON.stringify(a1) === JSON.stringify(a2), 'hidden data changed AI decision');
      cases++;
      state = engine.applyAction(state, seat as any, engine.getPlayerView(state, seat as any).actions[rand(rollout, before.actions.length)].action);
    }
  }
  return { mode, hiddenHandDeckSeedSwapCases: cases, publicViewAndAction: 'identical' };
}
console.log(JSON.stringify({ startingSeat: fixedStarter ? 'fixed-p1' : 'seed-rotated', invariance: [invariance('2p'), invariance('4p')], simulations: [measure('2p','uniform'), measure('2p','ai'), measure('4p','uniform'), measure('4p','ai')] }, null, 2));
