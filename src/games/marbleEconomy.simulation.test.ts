import { expect, it } from 'vitest';
import { fourSeats } from '../core/fourPlayer';
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
  const random = seededRandom(seed ^ 0x51f15e), sharedAiReserve = 200;
  let actionCount = 0, buys = 0, builds = 0, rentPayments = 0, rentTotal = 0, maxRent = 0, cashAtMaxRent = 0, rentCrises = 0, loans = 0, sales = 0, fifthBuyCanBuild = 0, fifthBuildAfterBuyPlayer: string | null = null, firstBankruptcyTurn: number | null = null;
  const cashAfterFifthBuy: number[] = [], cashAfterImmediateFifthBuyBuild: number[] = [], boughtTiles = new Set<number>(), eliminatedSeen = new Set<string>();
  const buyCount: Record<string, number> = {}, salaryCrossings: Record<string, number> = {}, early = { buys: 0, builds: 0 };

  for (let actions = 0; actions < 1500 && !state.result; actions++) {
    const player = state.active, before = state, sequence = state.actionSequence ?? 0;
    const view = engine.getPlayerView(state, player);
    const action = team ? engine.chooseAiAction(view, player, random, sharedAiReserve) : chooseSimpleAiAction('marble', view, player, random, sharedAiReserve);
    if (!action) break;
    state = engine.applyAction(state, player, action);
    actionCount++;
    if (fifthBuildAfterBuyPlayer) {
      if (player === fifthBuildAfterBuyPlayer && action.type === 'build') cashAfterImmediateFifthBuyBuild.push(state.money[player]);
      fifthBuildAfterBuyPlayer = null;
    }
    if (action.type === 'buy') {
      buys++;
      const boughtIndex = Number.isInteger(action.payload?.tile) ? Number(action.payload?.tile) : before.pendingTile ?? before.positions[player];
      if (Number.isInteger(boughtIndex)) boughtTiles.add(Number(boughtIndex));
      buyCount[player] = (buyCount[player] ?? 0) + 1;
      if (buyCount[player] === 5) {
        cashAfterFifthBuy.push(state.money[player]);
        if (engine.getPlayerView(state, player).actions.some((item: any) => item.action.type === 'build')) fifthBuyCanBuild++;
        fifthBuildAfterBuyPlayer = player;
      }
      if ((salaryCrossings[player] ?? 0) < 2) early.buys++;
    }
    if (action.type === 'build') { builds++; if ((salaryCrossings[player] ?? 0) < 2) early.builds++; }
    if (action.type === 'borrow') loans++;
    if (action.type === 'sell-property') sales++;
    const events = state.actionLog?.filter((event: any) => event.sequence > sequence) ?? [];
    const rents = events.filter((event: any) => event.type === 'rent' && (event.amount ?? 0) > 0);
    rentPayments += rents.length;
    rentTotal += rents.reduce((sum: number, event: any) => sum + (event.amount ?? 0), 0);
    for (const event of rents) if ((event.amount ?? 0) > maxRent) {
      maxRent = event.amount;
      cashAtMaxRent = state.money[event.actor] + event.amount;
    }
    const enteredRentDebt = before.phase !== 'debt' && state.phase === 'debt' && (team
      ? fourSeats.includes(state.pendingPayment?.creditor)
      : state.pendingPayment?.type === 'rent');
    if (enteredRentDebt) {
      rentCrises++;
      if (state.pendingPayment.amount > maxRent) { maxRent = state.pendingPayment.amount; cashAtMaxRent = state.money[state.active]; }
    }
    const salaryPaid = events.some((event: any) => event.type === 'salary' || (event.type === 'bonus' && event.title?.ko === '출발 보너스'));
    if (salaryPaid) salaryCrossings[player] = (salaryCrossings[player] ?? 0) + 1;
    if (team) {
      for (const [seat, isEliminated] of Object.entries(state.eliminated as Record<string, boolean>)) {
        if (isEliminated && !eliminatedSeen.has(seat)) {
          eliminatedSeen.add(seat);
          firstBankruptcyTurn ??= state.turns;
        }
      }
    } else if (firstBankruptcyTurn === null && (state.actionLog ?? []).some((event: any) => event.sequence > sequence && event.type === 'bankruptcy')) {
      // A two-player bankruptcy ends inside the current turn, before endTurn increments the completed-turn counter.
      firstBankruptcyTurn = state.turns + 1;
    }
  }

  return {
    turns: state.turns,
    bankrupt: team ? String(state.result?.reason?.ko ?? '').includes('파산') : String(state.result?.reason ?? '').includes('insolvent'),
    eliminatedPlayers: team ? Object.values(state.eliminated).filter(Boolean).length : 0,
    actionCount, buys, builds, rentPayments, rentTotal, maxRent, cashAtMaxRent, rentCrises, loans, sales,
    properties: Object.keys(state.properties).length, buysOfPreviouslyBoughtCity: buys - boughtTiles.size, uniqueCitiesBought: boughtTiles.size,
    cashAtFinish: Object.values(state.money).map(Number), cashAfterFifthBuy, cashAfterImmediateFifthBuyBuild,
    fifthBuyCanBuild, firstBankruptcyTurn, early,
  };
}

function summarize(rows: ReturnType<typeof play>[]) {
  const ordered = <T extends number>(values: T[]) => values.slice().sort((a, b) => a - b);
  const average = (field: 'turns' | 'actionCount' | 'buys' | 'builds' | 'rentPayments' | 'rentTotal' | 'rentCrises' | 'loans' | 'sales' | 'properties' | 'buysOfPreviouslyBoughtCity' | 'uniqueCitiesBought') => rows.reduce((sum, row) => sum + row[field], 0) / rows.length;
  const cashAfterFifthBuy = ordered(rows.flatMap(row => row.cashAfterFifthBuy));
  const cashAfterImmediateFifthBuyBuild = ordered(rows.flatMap(row => row.cashAfterImmediateFifthBuyBuild));
  const maxima = ordered(rows.map(row => row.maxRent));
  const cashAtMaxima = ordered(rows.map(row => row.cashAtMaxRent));
  const maxRentCashRatios = ordered(rows.filter(row => row.maxRent > 0).map(row => row.maxRent / Math.max(1, row.cashAtMaxRent)));
  const finalCash = ordered(rows.flatMap(row => row.cashAtFinish));
  const firstBankruptcyTurns = ordered(rows.flatMap(row => row.firstBankruptcyTurn === null ? [] : [row.firstBankruptcyTurn]));
  return {
    matches: rows.length, aiReservePolicy: 'fixed 200 in all economy versions',
    avgTurns: average('turns'), medianTurns: ordered(rows.map(row => row.turns))[49], p90Turns: ordered(rows.map(row => row.turns))[89],
    avgActions: average('actionCount'),
    turnCapFinishes: rows.filter(row => row.turns === 120).length, bankruptcies: rows.filter(row => row.bankrupt).length,
    eliminatedPlayers: rows.reduce((sum, row) => sum + row.eliminatedPlayers, 0), avgBuys: average('buys'), avgBuilds: average('builds'),
    avgPaidRent: average('rentTotal') / Math.max(0.0001, average('rentPayments')), p90MatchMaxRent: maxima[89], medianCashBeforeMatchMaxRent: cashAtMaxima[49],
    avgRentCrises: average('rentCrises'), avgLoans: average('loans'), avgSales: average('sales'), avgPropertiesAtFinish: average('properties'),
    avgRepeatBuyActions: average('buysOfPreviouslyBoughtCity'), avgDistinctCitiesBought: average('uniqueCitiesBought'),
    avgBuysBeforeEachPlayerCrossesStartTwice: rows.reduce((sum, row) => sum + row.early.buys, 0) / rows.length,
    avgBuildsBeforeEachPlayerCrossesStartTwice: rows.reduce((sum, row) => sum + row.early.builds, 0) / rows.length,
    medianCashImmediatelyAfterPersonalFifthPurchase: cashAfterFifthBuy[Math.floor(cashAfterFifthBuy.length / 2)] ?? null,
    matchesWithPlayerReachingFifthPurchase: rows.filter(row => row.cashAfterFifthBuy.length > 0).length,
    playersReachingFifthPurchase: cashAfterFifthBuy.length,
    fifthPurchaseWithBuildStillAffordablePct: cashAfterFifthBuy.length ? 100 * rows.reduce((sum, row) => sum + row.fifthBuyCanBuild, 0) / cashAfterFifthBuy.length : null,
    fifthPurchaseSamples: cashAfterFifthBuy.length,
    medianCashAfterImmediateBuildFollowingFifthPurchase: cashAfterImmediateFifthBuyBuild[Math.floor(cashAfterImmediateFifthBuyBuild.length / 2)] ?? null,
    immediateFifthPurchaseBuildSamples: cashAfterImmediateFifthBuyBuild.length,
    medianCashAtSettlement: finalCash[Math.floor(finalCash.length / 2)] ?? null,
    p90CashAtSettlement: finalCash[Math.floor(finalCash.length * 0.9)] ?? null,
    medianFirstBankruptcyTurn: firstBankruptcyTurns[Math.floor(firstBankruptcyTurns.length / 2)] ?? null,
    firstBankruptcySamples: firstBankruptcyTurns.length,
    medianLargestRentToPrepaymentCashRatio: maxRentCashRatios[Math.floor(maxRentCashRatios.length / 2)] ?? null,
    p90LargestRentToPrepaymentCashRatio: maxRentCashRatios[Math.floor(maxRentCashRatios.length * 0.9)] ?? null,
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
