import { expect, it } from 'vitest';
import { seededRandom } from '../core/types';
import { fourMarbleEngine } from './fourMarble';
import { marbleEngine } from './marble';
import { chooseSimpleAiAction } from './simpleAi';

function play(seed: number, team: boolean, version: 2 | 3) {
  const engine: any = team ? fourMarbleEngine : marbleEngine;
  let state: any = engine.createInitialState(seed);
  if (version === 2) {
    state.economicVersion = 2;
    state.money = Object.fromEntries(Object.keys(state.money).map(player => [player, 1500]));
  }
  const random = seededRandom(seed ^ 0x51f15e);
  let buys = 0, builds = 0, rentPayments = 0, rentTotal = 0, maxRent = 0, cashAtMaxRent = 0, rentCrises = 0, loans = 0, sales = 0, fifthBuyCanBuild = 0;
  const cashAfterFifthBuy: number[] = [];
  const buyCount: Record<string, number> = {}, lapCrossings: Record<string, number> = {}, early = { buys: 0, builds: 0 };

  for (let actions = 0; actions < 1500 && !state.result; actions++) {
    const player = state.active, before = state, sequence = state.actionSequence ?? 0;
    const view = engine.getPlayerView(state, player);
    const action = team ? engine.chooseAiAction(view, player, random) : chooseSimpleAiAction('marble', view, player, random);
    if (!action) break;
    state = engine.applyAction(state, player, action);
    if (action.type === 'buy') {
      buys++;
      buyCount[player] = (buyCount[player] ?? 0) + 1;
      if (buyCount[player] === 5) {
        cashAfterFifthBuy.push(state.money[player]);
        if (engine.getPlayerView(state, player).actions.some((item: any) => item.action.type === 'build')) fifthBuyCanBuild++;
      }
      if ((lapCrossings[player] ?? 0) < 2) early.buys++;
    }
    if (action.type === 'build') { builds++; if ((lapCrossings[player] ?? 0) < 2) early.builds++; }
    if (action.type === 'borrow') loans++;
    if (action.type === 'sell-property') sales++;
    const events = state.actionLog?.filter((event: any) => event.sequence > sequence) ?? [];
    const rents = events.filter((event: any) => event.type === 'rent');
    rentPayments += rents.length;
    rentTotal += rents.reduce((sum: number, event: any) => sum + (event.amount ?? 0), 0);
    for (const event of rents) if ((event.amount ?? 0) > maxRent) {
      maxRent = event.amount;
      cashAtMaxRent = state.money[event.actor] + event.amount;
    }
    if (state.phase === 'debt' && state.pendingPayment?.type === 'rent') {
      rentCrises++;
      if (state.pendingPayment.amount > maxRent) { maxRent = state.pendingPayment.amount; cashAtMaxRent = state.money[state.active]; }
    }
    if ((state.lastMove?.sequence ?? 0) !== (before.lastMove?.sequence ?? 0) && state.lastMove.from > state.lastMove.to) lapCrossings[player] = (lapCrossings[player] ?? 0) + 1;
  }

  return {
    turns: state.turns,
    bankrupt: team ? String(state.result?.reason?.ko ?? '').includes('파산') : String(state.result?.reason ?? '').includes('insolvent'),
    eliminatedPlayers: team ? Object.values(state.eliminated).filter(Boolean).length : 0,
    buys, builds, rentPayments, rentTotal, maxRent, cashAtMaxRent, rentCrises, loans, sales,
    properties: Object.keys(state.properties).length, cashAfterFifthBuy, fifthBuyCanBuild, early,
  };
}

function summarize(rows: ReturnType<typeof play>[]) {
  const ordered = <T extends number>(values: T[]) => values.slice().sort((a, b) => a - b);
  const average = (field: 'turns' | 'buys' | 'builds' | 'rentPayments' | 'rentTotal' | 'rentCrises' | 'loans' | 'sales' | 'properties') => rows.reduce((sum, row) => sum + row[field], 0) / rows.length;
  const cashAfterFifthBuy = ordered(rows.flatMap(row => row.cashAfterFifthBuy));
  const maxima = ordered(rows.map(row => row.maxRent));
  const cashAtMaxima = ordered(rows.map(row => row.cashAtMaxRent));
  return {
    matches: rows.length,
    avgTurns: average('turns'), medianTurns: ordered(rows.map(row => row.turns))[49], p90Turns: ordered(rows.map(row => row.turns))[89],
    turnCapFinishes: rows.filter(row => row.turns === 120).length, bankruptcies: rows.filter(row => row.bankrupt).length,
    eliminatedPlayers: rows.reduce((sum, row) => sum + row.eliminatedPlayers, 0), avgBuys: average('buys'), avgBuilds: average('builds'),
    avgPaidRent: average('rentTotal') / Math.max(0.0001, average('rentPayments')), p90MatchMaxRent: maxima[89], medianCashBeforeMatchMaxRent: cashAtMaxima[49],
    avgRentCrises: average('rentCrises'), avgLoans: average('loans'), avgSales: average('sales'), avgPropertiesAtFinish: average('properties'),
    avgBuysBeforeEachPlayerCrossesStartTwice: rows.reduce((sum, row) => sum + row.early.buys, 0) / rows.length,
    avgBuildsBeforeEachPlayerCrossesStartTwice: rows.reduce((sum, row) => sum + row.early.builds, 0) / rows.length,
    medianCashImmediatelyAfterPersonalFifthPurchase: cashAfterFifthBuy[Math.floor(cashAfterFifthBuy.length / 2)] ?? null,
    fifthPurchaseWithBuildStillAffordablePct: cashAfterFifthBuy.length ? 100 * rows.reduce((sum, row) => sum + row.fifthBuyCanBuild, 0) / cashAfterFifthBuy.length : null,
    fifthPurchaseSamples: cashAfterFifthBuy.length,
  };
}

it('compares the old and new economy across paired 100-seed AI matches', () => {
  const runSet = (team: boolean, version: 2 | 3) => Array.from({ length: 100 }, (_, index) => play(index + 1, team, version));
  const report = {
    twoPlayerV2: summarize(runSet(false, 2)), teamV2: summarize(runSet(true, 2)),
    twoPlayerV3: summarize(runSet(false, 3)), teamV3: summarize(runSet(true, 3)),
  };
  expect(report.twoPlayerV2.matches).toBe(100);
  expect(report.teamV2.matches).toBe(100);
  expect(report.twoPlayerV3.matches).toBe(100);
  expect(report.teamV3.matches).toBe(100);
  expect(report.twoPlayerV3.medianCashImmediatelyAfterPersonalFifthPurchase).toBeGreaterThan(report.twoPlayerV2.medianCashImmediatelyAfterPersonalFifthPurchase!);
  expect(report.twoPlayerV3.avgBuysBeforeEachPlayerCrossesStartTwice).toBeGreaterThan(report.twoPlayerV2.avgBuysBeforeEachPlayerCrossesStartTwice);
  console.info('MARBLE_ECONOMY_SIMULATION', JSON.stringify(report));
}, 120000);
