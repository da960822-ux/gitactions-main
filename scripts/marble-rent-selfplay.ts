/** Reproduce from repository root:
 * npx esbuild scripts/marble-rent-selfplay.ts --bundle --platform=node --format=esm --outfile=/tmp/marble-rent-selfplay.mjs
 * node /tmp/marble-rent-selfplay.mjs > docs/performance/MARBLE-ECONOMY-20PCT-20261028.json
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { marbleEngine } from '../src/games/marble';
import { fourMarbleEngine } from '../src/games/fourMarble';
import { chooseSimpleAiAction } from '../src/games/simpleAi';
import { seededRandom } from '../src/core/types';

function play(seed: number, four: boolean, version: 1 | 2) {
  const engine: any = four ? fourMarbleEngine : marbleEngine;
  let state: any = engine.createInitialState(seed);
  if (version === 1) { delete state.rentRulesVersion; delete state.constructionPriceRulesVersion; }
  else { state.rentRulesVersion = 2; state.constructionPriceRulesVersion = 2; }
  assert.equal(state.loanRulesVersion, 2); assert.equal(state.festivalRulesVersion, 2); assert.equal(state.boardRevision, 3);
  const random = seededRandom(seed ^ 0x51f15e);
  let crisis = 0, sales = 0, loans = 0, landmarks = 0, maxPaidRent = 0, firstBankruptcyTurn: number | null = null, actions = 0;
  for (; actions < 2500 && !state.result; actions++) {
    const player = state.active, before = state, sequence = state.actionSequence ?? 0;
    const view = engine.getPlayerView(state, player);
    const action = four ? engine.chooseAiAction(view, player, random, 200) : chooseSimpleAiAction('marble', view, player, random, 200);
    assert.ok(action, 'AI must select an action');
    assert.equal(engine.validateAction(state, player, action), null, 'AI action must be legal');
    state = engine.applyAction(state, player, action);
    if (action.type === 'borrow') loans++;
    if (action.type === 'sell-property') sales++;
    if (action.type === 'build' && action.payload?.landmark) landmarks++;
    if (before.phase !== 'debt' && state.phase === 'debt') crisis++;
    for (const event of state.actionLog?.filter((event: any) => event.sequence > sequence) ?? []) {
      if (event.type === 'rent') maxPaidRent = Math.max(maxPaidRent, event.amount ?? 0);
      if (event.type === 'bankruptcy') firstBankruptcyTurn ??= state.turns + 1;
    }
  }
  assert.ok(state.result, 'Every match must finish before the action safety limit');
  const reason = typeof state.result.reason === 'string' ? state.result.reason : state.result.reason.ko;
  const ending = /insolvent|모두 파산/.test(reason) ? 'bankruptcy' : /turn limit|120차례/.test(reason) ? 'turn-cap' : 'monopoly';
  assert.ok(['bankruptcy', 'turn-cap', 'monopoly'].includes(ending));
  return { seed, turns: state.turns, actions, crisis, sales, loans, landmarks, maxPaidRent, firstBankruptcyTurn, ending, result: state.result };
}
const conditions = [];
for (const version of [1, 2] as const) for (const four of [false, true]) {
  const matches = Array.from({ length: 30 }, (_, index) => play(index + 1, four, version));
  const average = (key: 'turns' | 'crisis' | 'sales' | 'loans' | 'landmarks' | 'maxPaidRent') => matches.reduce((sum, match) => sum + match[key], 0) / matches.length;
  conditions.push({ name: version === 1 ? 'baseline' : 'rebalanced', mode: four ? 'team' : '2p', rentRulesVersion: version === 1 ? 'absent' : 2, constructionPriceRulesVersion: version === 1 ? 'absent' : 2,
    summary: { matches: matches.length, matchesWithBankruptcy: matches.filter(m => m.firstBankruptcyTurn !== null).length,
      bankruptcyEndings: matches.filter(m => m.ending === 'bankruptcy').length, monopolyEndings: matches.filter(m => m.ending === 'monopoly').length, turnCapEndings: matches.filter(m => m.ending === 'turn-cap').length,
      matchesWithLandmarks: matches.filter(m => m.landmarks > 0).length, avgTurns: average('turns'), avgCrises: average('crisis'), avgSales: average('sales'), avgLoans: average('loans'), avgLandmarks: average('landmarks'), avgMaxPaidRent: average('maxPaidRent') }, matches });
}
const sourceFiles = ['scripts/marble-rent-selfplay.ts', 'src/games/marble.ts', 'src/games/fourMarble.ts', 'src/games/simpleAi.ts', 'src/games/marbleClassicEconomy.ts', 'src/games/marbleClassicEconomyData.ts', 'src/games/marbleEconomy.ts', 'src/games/marbleBoardProfiles.ts', 'src/games/marbleConstruction.ts'];
console.log(JSON.stringify({ schemaVersion: 1, experiment: 'paired 30-seed toll and construction-price comparison; heuristic AI, not human win rates',
  config: { seeds: '1–30', fixedAiMinimumReserve: 200, aiRandomSeed: 'seed XOR 0x51f15e', actionSafetyLimit: 2500, loanRulesVersion: 2, festivalRulesVersion: 2, boardRevision: 3, startingCash: 3000, salary: 450, turnCap: 120, ordinaryCityMultiplier: .8, landmarkMultiplier: .7, tourismMultiplier: .8, constructionComponentMultiplier: .8, landPriceMultiplier: 1 },
  sourceSha256: Object.fromEntries(sourceFiles.map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')])), conditions }, null, 2));
