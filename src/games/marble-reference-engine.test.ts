import { describe, expect, it } from 'vitest';
import { seededRandom } from '../core/types';
import { fourMarbleEngine, type FourMarbleState, type MarbleView as TeamMarbleView } from './fourMarble';
import { marbleBuildCost, marbleEngine, type MarbleEventId, type MarbleState } from './marble';
import { classicMarbleCityToll, classicMarbleReferenceProfile } from './marble-reference-profile';
import { classicOlympicsMultiplier } from './marble-classic-specials';

function seedForSum(sum: number) {
  for (let seed = 0; seed < 10_000; seed++) {
    const random = seededRandom(seed), actual = 2 + Math.floor(random() * 6) + Math.floor(random() * 6);
    if (actual === sum) return seed;
  }
  throw new Error(`No dice seed for ${sum}`);
}

const step2 = (state: MarbleState, type: string, payload?: Record<string, unknown>) => marbleEngine.applyAction(state, state.active, { type, payload });
const step4 = (state: FourMarbleState, type: string, payload?: Record<string, unknown>) => fourMarbleEngine.applyAction(state, state.active, { type, payload }) as FourMarbleState;

describe('active Kakao World / Business engine profile', () => {
  it('uses 32-cell data for new 2p/team games while retaining old serialized routes', () => {
    const two = marbleEngine.createInitialState(4), team = fourMarbleEngine.createInitialState(4);
    const twoView = marbleEngine.getPlayerView(two, 'p1'), teamView = fourMarbleEngine.getPlayerView(team, 'p1') as TeamMarbleView;
    expect(twoView.board.tiles).toHaveLength(32);
    expect(twoView.board.tiles.filter((tile: any) => tile.kind === 'property')).toHaveLength(18);
    expect(twoView.board.tiles.filter((tile: any) => tile.kind === 'tourism')).toHaveLength(5);
    expect(two.money).toEqual({ p1: 5_000_000, p2: 5_000_000 });
    expect(teamView.publicBoard).toHaveLength(32);
    expect(team.money).toEqual({ p1: 5_000_000, p2: 5_000_000, p3: 5_000_000, p4: 5_000_000 });
    expect(team.referenceProfileId).toBe(classicMarbleReferenceProfile.id);

    const oldTwo = marbleEngine.getPlayerView({ ...two, referenceProfileId: undefined, cityRouteVersion: 3, economicVersion: 3, money: { p1: 1500, p2: 1500 } }, 'p1');
    const oldTeam = fourMarbleEngine.getPlayerView({ ...team, referenceProfileId: undefined, cityRouteVersion: undefined, economicVersion: undefined, money: { p1: 1500, p2: 1500, p3: 1500, p4: 1500 } }, 'p1') as TeamMarbleView;
    expect(oldTwo.board.tiles).toHaveLength(40);
    expect(oldTwo.ownHand.money).toBe(1500);
    expect(oldTeam.publicBoard).toHaveLength(40);
    expect(oldTeam.players.map(player => player.score)).toEqual([1500, 1500, 1500, 1500]);
  });

  it('connects city purchase, landing-gated villa construction and toll preview in both engines', () => {
    const twoStart = { ...marbleEngine.createInitialState(seedForSum(2)), positions: { p1: 31, p2: 0 } };
    const twoLand = step2(twoStart, 'roll');
    expect(twoLand.positions.p1).toBe(1);
    expect(twoLand.money.p1).toBe(5_750_000);
    expect(twoLand.completedLaps?.p1).toBe(1);
    const twoBought = step2(twoLand, 'buy');
    expect(twoBought.money.p1).toBe(5_700_000);
    expect(twoBought.properties['1']).toMatchObject({ owner: 'p1', buildings: {} });
    const twoBuild = marbleEngine.getPlayerView(twoBought, 'p1').actions.find((item: any) => item.action.type === 'build');
    expect(twoBuild?.action).toMatchObject({ type: 'build', payload: { tile: 1, structure: 'villa' } });
    const twoBuilt = step2(twoBought, 'build', { tile: 1, structure: 'villa' });
    const twoCity = marbleEngine.getPlayerView(twoBuilt, 'p1').board.tiles[1];
    expect(twoBuilt.money.p1).toBe(5_675_000);
    expect(twoCity).toMatchObject({ currentToll: 20_000, buildings: { villa: true } });
    expect(twoCity.nextBuildOptions).toContainEqual(expect.objectContaining({ structure: 'building', cost: 75_000, tollAfter: 70_000 }));
    expect(twoBuilt.actionLog?.at(-1)).toMatchObject({ amount: 25_000, fromAccount: 'p1', toAccount: 'bank', moneyDelta: { p1: -25_000 } });

    const teamStart = { ...fourMarbleEngine.createInitialState(seedForSum(2)), positions: { p1: 31, p2: 0, p3: 0, p4: 0 } };
    const teamLand = step4(teamStart, 'roll');
    const teamBought = step4(teamLand, 'buy');
    const teamBuildAction = fourMarbleEngine.getPlayerView(teamBought, 'p1').actions.find((item: any) => item.action.type === 'build');
    expect(teamBuildAction?.action).toMatchObject({ type: 'build', payload: { tile: 1, structure: 'villa' } });
    const teamBuilt = step4(teamBought, 'build', { tile: 1, structure: 'villa' });
    const teamCity = (fourMarbleEngine.getPlayerView(teamBuilt, 'p1') as TeamMarbleView).publicBoard[1];
    expect(teamBuilt.money.p1).toBe(twoBuilt.money.p1);
    expect(teamCity).toMatchObject({ currentToll: twoCity.currentToll, buildings: twoCity.buildings });
    expect(fourMarbleEngine.chooseAiAction(fourMarbleEngine.getPlayerView(teamBought, 'p1'), 'p1', () => 0)?.type).toBe('build');
    expect(classicMarbleCityToll('방콕', teamCity.buildings)).toBe(teamCity.currentToll);
  });

  it('matches first-two-lap cash, build cost, toll, and asset value between both routes', () => {
    const two = marbleEngine.createInitialState(seedForSum(2));
    two.positions.p1 = 31;
    let twoNext = step2(two, 'roll');
    twoNext = step2(twoNext, 'buy');
    twoNext = step2(twoNext, 'build', { tile: 1, structure: 'villa' });
    expect(twoNext.money.p1).toBe(5_675_000);
    expect(marbleEngine.getPlayerView(twoNext, 'p1').board.tiles[1].currentToll).toBe(20_000);
    expect(marbleEngine.getPlayerView(twoNext, 'p1').actions.map((item: any) => item.action.payload?.structure)).toContain('building');
    twoNext.active = 'p1'; twoNext.phase = 'roll'; twoNext.positions.p1 = 31; twoNext.rng = seedForSum(2);
    twoNext = step2(twoNext, 'roll');
    expect(twoNext.money.p1).toBe(6_425_000);
    expect(twoNext.completedLaps?.p1).toBe(2);
    twoNext = step2(twoNext, 'build', { tile: 1, structure: 'building' });
    expect(twoNext.money.p1).toBe(6_350_000);
    expect(marbleEngine.getPlayerView(twoNext, 'p1').board.tiles[1].currentToll).toBe(70_000);
    expect(marbleEngine.getPlayerView(twoNext, 'p1').actions.map((item: any) => item.action.payload?.structure)).toContain('hotel');

    const team = fourMarbleEngine.createInitialState(seedForSum(2));
    team.positions.p1 = 31;
    let teamNext = step4(team, 'roll');
    teamNext = step4(teamNext, 'buy');
    teamNext = step4(teamNext, 'build', { tile: 1, structure: 'villa' });
    expect(teamNext.money.p1).toBe(5_675_000);
    expect((fourMarbleEngine.getPlayerView(teamNext, 'p1') as TeamMarbleView).publicBoard[1].currentToll).toBe(20_000);
    expect(fourMarbleEngine.getPlayerView(teamNext, 'p1').actions.map((item: any) => item.action.payload?.structure)).toContain('building');
    teamNext.active = 'p1'; teamNext.phase = 'roll'; teamNext.positions.p1 = 31; teamNext.rng = seedForSum(2);
    teamNext = step4(teamNext, 'roll');
    expect(teamNext.money.p1).toBe(6_425_000);
    expect(teamNext.completedLaps?.p1).toBe(2);
    teamNext = step4(teamNext, 'build', { tile: 1, structure: 'building' });
    expect(teamNext.money.p1).toBe(6_350_000);
    expect((fourMarbleEngine.getPlayerView(teamNext, 'p1') as TeamMarbleView).publicBoard[1].currentToll).toBe(70_000);
    expect(fourMarbleEngine.getPlayerView(teamNext, 'p1').actions.map((item: any) => item.action.payload?.structure)).toContain('hotel');

    const mask = { villa: true, building: true, hotel: true, landmark: true };
    const twoAssetState = { ...marbleEngine.createInitialState(2), properties: { '1': { owner: 'p1' as const, houses: 3, buildings: mask } } };
    const teamAssetState = { ...fourMarbleEngine.createInitialState(2), properties: { '1': { owner: 'p1' as const, houses: 3, buildings: mask } } };
    const twoAssets = marbleEngine.getPlayerView(twoAssetState, 'p1').ownHand.assets;
    const teamAssets = (fourMarbleEngine.getPlayerView(teamAssetState, 'p1') as TeamMarbleView).players.find(player => player.id === 'p1')!.score;
    expect(twoAssets).toBe(5_400_000);
    expect(teamAssets).toBe(twoAssets);
  });

  it('matches every valid city building mask and individual construction cost in both engine views', () => {
    const base2 = marbleEngine.createInitialState(6), base4 = fourMarbleEngine.createInitialState(6);
    const cityIndices: number[] = marbleEngine.getPlayerView(base2, 'p1').board.tiles.flatMap((tile: any, index: number) => tile.kind === 'property' && tile.referenceCity ? [index] : []);
    for (let bits = 0; bits < 16; bits++) {
      const buildings = { villa: !!(bits & 1), building: !!(bits & 2), hotel: !!(bits & 4), landmark: !!(bits & 8) };
      if (buildings.landmark && !(buildings.villa && buildings.building && buildings.hotel)) continue;
      const houses = [buildings.villa, buildings.building, buildings.hotel].filter(Boolean).length;
      const properties = Object.fromEntries(cityIndices.map(index => [index, { owner: 'p1' as const, houses, buildings }]));
      const view2 = marbleEngine.getPlayerView({ ...base2, properties }, 'p1');
      const view4 = fourMarbleEngine.getPlayerView({ ...base4, properties }, 'p1') as TeamMarbleView;
      for (const index of cityIndices) {
        const city2: any = view2.board.tiles[index], city4 = view4.publicBoard[index];
        const expected = classicMarbleCityToll(city2.referenceCity, buildings);
        expect(city2.currentToll).toBe(expected);
        expect(city4.currentToll).toBe(expected);
        for (const structure of ['villa', 'building', 'hotel', 'landmark'] as const) {
          const expectedCost = classicMarbleReferenceProfile.cities.find(city => city.name === city2.referenceCity)!.construction[structure];
          expect(marbleBuildCost(city2, houses, 4, structure)).toBe(expectedCost);
          expect(marbleBuildCost(city4, houses, 4, structure)).toBe(expectedCost);
        }
      }
    }
  });

  it('applies the own-arrival rule and lap gates, while keeping salary marked as inferred', () => {
    const state = marbleEngine.createInitialState(seedForSum(2));
    state.phase = 'main'; state.pendingTile = 1; state.positions.p1 = 1; state.buildArrivalTile = null; state.properties['1'] = { owner: 'p1', houses: 0, buildings: {} };
    expect(marbleEngine.getPlayerView(state, 'p1').actions.some((item: any) => item.action.type === 'build')).toBe(false);
    state.buildArrivalTile = 1;
    expect(marbleEngine.getPlayerView(state, 'p1').actions.map((item: any) => item.action.payload?.structure)).toContain('villa');
    expect(marbleEngine.getPlayerView(state, 'p1').actions.map((item: any) => item.action.payload?.structure)).not.toContain('building');
    expect(marbleEngine.validateAction(state, 'p1', { type: 'build', payload: { tile: 1, structure: 'building' } })).toBe('Construction is not unlocked');

    let cashFlow = marbleEngine.createInitialState(seedForSum(2));
    cashFlow.positions.p1 = 31;
    cashFlow = step2(cashFlow, 'roll');
    expect(cashFlow.money.p1).toBe(5_750_000);
    expect(cashFlow.salaryStatus).toBe('inferred');
    cashFlow.phase = 'roll'; cashFlow.active = 'p1'; cashFlow.positions.p1 = 31; cashFlow.rng = seedForSum(2);
    cashFlow = step2(cashFlow, 'roll');
    expect(cashFlow.money.p1).toBe(6_500_000);
    expect(cashFlow.completedLaps?.p1).toBe(2);
  });

  it('uses the same tourism selectors for engine cash, published previews and team AI', () => {
    let two = marbleEngine.createInitialState(seedForSum(4));
    two.positions.p1 = 2; two.rng = seedForSum(2); // land on Dokdo (index 4)
    two = step2(two, 'roll');
    expect(two.positions.p1).toBe(4);
    two = step2(two, 'buy');
    expect(two.money.p1).toBe(4_750_000);
    const islandRent = marbleEngine.getPlayerView(two, 'p1').board.tiles[4].currentToll;
    expect(islandRent).toBe(200_000);
    const visitor = { ...two, active: 'p2' as const, phase: 'roll' as const, positions: { p1: 4, p2: 2 }, rng: seedForSum(2) };
    const paid = step2(visitor, 'roll');
    expect(paid.money).toEqual({ p1: 4_950_000, p2: 4_800_000 });

    let team = fourMarbleEngine.createInitialState(seedForSum(2));
    team.positions.p1 = 2; team.rng = seedForSum(2);
    team = step4(team, 'roll');
    team = step4(team, 'buy');
    const teamView = fourMarbleEngine.getPlayerView(team, 'p1') as TeamMarbleView;
    expect(teamView.publicBoard[4].currentToll).toBe(islandRent);
    expect(fourMarbleEngine.chooseAiAction(teamView, 'p1', () => 0)?.type).toBe('endTurn');
  });

  it('settles each island toll by owner count and advances beach rent only after the prior toll is paid', () => {
    const islandIndices = [4, 14, 18], tolls = [200_000, 400_000, 800_000];
    for (let count = 1; count <= 3; count++) {
      const two = marbleEngine.createInitialState(seedForSum(2)); two.positions.p1 = 2;
      for (const index of islandIndices.slice(0, count)) two.properties[String(index)] = { owner: 'p2', houses: 0, buildings: {} };
      const twoPaid = step2(two, 'roll');
      expect(twoPaid.money.p1).toBe(5_000_000 - tolls[count - 1]);
      expect(twoPaid.money.p2).toBe(5_000_000 + tolls[count - 1]);
      expect(marbleEngine.validateAction(twoPaid, 'p1', { type: 'takeover', payload: { tile: 4 } })).toBeTruthy();

      const team = fourMarbleEngine.createInitialState(seedForSum(2)); team.positions.p1 = 2;
      for (const index of islandIndices.slice(0, count)) team.properties[String(index)] = { owner: 'p2', houses: 0, buildings: {} };
      const teamPaid = step4(team, 'roll');
      expect(teamPaid.money.p1).toBe(5_000_000 - tolls[count - 1]);
      expect(teamPaid.money.p2).toBe(5_000_000 + tolls[count - 1]);
      expect(fourMarbleEngine.validateAction(teamPaid, 'p1', { type: 'takeover', payload: { tile: 4 } })).toBeTruthy();
    }

    const twoWithBeachSites = marbleEngine.createInitialState(seedForSum(2));
    twoWithBeachSites.positions.p1 = 2;
    twoWithBeachSites.properties['4'] = { owner: 'p2', houses: 0, buildings: {} };
    twoWithBeachSites.properties['9'] = { owner: 'p2', houses: 0, buildings: {} };
    twoWithBeachSites.properties['25'] = { owner: 'p2', houses: 0, buildings: {} };
    const twoPaid = step2(twoWithBeachSites, 'roll');
    expect(twoPaid.money.p1).toBe(4_800_000);

    const teamWithBeachSites = fourMarbleEngine.createInitialState(seedForSum(2));
    teamWithBeachSites.positions.p1 = 2;
    teamWithBeachSites.properties['4'] = { owner: 'p2', houses: 0, buildings: {} };
    teamWithBeachSites.properties['9'] = { owner: 'p2', houses: 0, buildings: {} };
    teamWithBeachSites.properties['25'] = { owner: 'p2', houses: 0, buildings: {} };
    const teamPaid = step4(teamWithBeachSites, 'roll');
    expect(teamPaid.money.p1).toBe(4_800_000);

    let beach = marbleEngine.createInitialState(seedForSum(2)); beach.positions.p1 = 7;
    beach.properties['9'] = { owner: 'p2', houses: 0, buildings: {} };
    beach = step2(beach, 'roll');
    expect(beach.money.p1).toBe(4_800_000);
    expect(beach.tourismVisitStages?.['9']).toBe(2);
    beach.phase = 'roll'; beach.positions.p1 = 7; beach.rng = seedForSum(2);
    beach = step2(beach, 'roll');
    expect(beach.money.p1).toBe(4_400_000);
    expect(beach.money.p2).toBe(5_600_000);
    expect(beach.tourismVisitStages?.['9']).toBe(3);

    let teamBeach = fourMarbleEngine.createInitialState(seedForSum(2)); teamBeach.positions.p1 = 7;
    teamBeach.properties['9'] = { owner: 'p2', houses: 0, buildings: {} };
    teamBeach = step4(teamBeach, 'roll');
    expect(teamBeach.money.p1).toBe(4_800_000);
    expect(teamBeach.tourismVisitStages?.['9']).toBe(2);
    teamBeach.phase = 'roll'; teamBeach.positions.p1 = 7; teamBeach.rng = seedForSum(2);
    teamBeach = step4(teamBeach, 'roll');
    expect(teamBeach.money.p1).toBe(4_400_000);
    expect(teamBeach.money.p2).toBe(5_600_000);
    expect(teamBeach.tourismVisitStages?.['9']).toBe(3);

    let twoDebt = marbleEngine.createInitialState(seedForSum(2)); twoDebt.positions.p1 = 7; twoDebt.money.p1 = 180_000;
    twoDebt.properties['9'] = { owner: 'p2', houses: 0, buildings: {} };
    twoDebt.properties['1'] = { owner: 'p1', houses: 0, buildings: {} };
    twoDebt = step2(twoDebt, 'roll');
    expect(twoDebt.phase).toBe('debt');
    expect(twoDebt.tourismVisitStages?.['9']).toBe(1);
    twoDebt = step2(twoDebt, 'sell-property', { tile: 1 });
    expect(twoDebt.money.p1).toBe(5_000);
    expect(twoDebt.tourismVisitStages?.['9']).toBe(2);

    let twoBankrupt = marbleEngine.createInitialState(seedForSum(2)); twoBankrupt.positions.p1 = 7; twoBankrupt.money.p1 = 0;
    twoBankrupt.properties['9'] = { owner: 'p2', houses: 0, buildings: {} };
    twoBankrupt = step2(twoBankrupt, 'roll');
    expect(twoBankrupt.phase).toBe('debt');
    twoBankrupt = step2(twoBankrupt, 'declare-bankruptcy');
    expect(twoBankrupt.tourismVisitStages?.['9']).toBe(1);

    let teamDebt = fourMarbleEngine.createInitialState(seedForSum(2)); teamDebt.positions.p1 = 7; teamDebt.money.p1 = 180_000;
    teamDebt.properties['9'] = { owner: 'p2', houses: 0, buildings: {} };
    teamDebt.properties['1'] = { owner: 'p1', houses: 0, buildings: {} };
    teamDebt = step4(teamDebt, 'roll');
    expect(teamDebt.phase).toBe('debt');
    expect(teamDebt.tourismVisitStages?.['9']).toBe(1);
    teamDebt = step4(teamDebt, 'sell-property', { tile: 1 });
    expect(teamDebt.money.p1).toBe(5_000);
    expect(teamDebt.tourismVisitStages?.['9']).toBe(2);

    let teamBankrupt = fourMarbleEngine.createInitialState(seedForSum(2)); teamBankrupt.positions.p1 = 7; teamBankrupt.money.p1 = 0;
    teamBankrupt.properties['9'] = { owner: 'p2', houses: 0, buildings: {} };
    teamBankrupt = step4(teamBankrupt, 'roll');
    expect(teamBankrupt.phase).toBe('debt');
    teamBankrupt = step4(teamBankrupt, 'declare-bankruptcy');
    expect(teamBankrupt.tourismVisitStages?.['9']).toBe(1);
  });

  it('sends third doubles to the mapped island in both fresh 32-cell routes', () => {
    const landOnEvent = (state: MarbleState) => {
      let next = step2(state, 'roll');
      if (next.phase === 'decision') next = step2(next, 'decline');
      return step2(next, 'endTurn');
    };
    const landOnEventTeam = (state: FourMarbleState) => {
      let next = step4(state, 'roll');
      if (next.phase === 'decision') next = step4(next, 'decline');
      return step4(next, 'endTurn');
    };
    let two = marbleEngine.createInitialState(seedForSum(2));
    two = landOnEvent(two); two.rng = seedForSum(2);
    two = landOnEvent(two); two.rng = seedForSum(2);
    two = step2(two, 'roll');
    expect(two.positions.p1).toBe(8);
    expect(two.pendingTile).toBe(8);
    expect(two.islandTurns?.p1).toBe(3);
    expect(marbleEngine.getPlayerView(two, 'p1').board.tiles[8].kind).toBe('island');

    let team = fourMarbleEngine.createInitialState(seedForSum(2));
    team = landOnEventTeam(team); team.rng = seedForSum(2);
    team = landOnEventTeam(team); team.rng = seedForSum(2);
    team = step4(team, 'roll');
    expect(team.positions.p1).toBe(8);
    expect(team.pendingTile).toBe(8);
    expect(team.islandTurns.p1).toBe(3);
    expect((fourMarbleEngine.getPlayerView(team, 'p1') as TeamMarbleView).publicBoard[8].kind).toBe('island');
  });

  it('does not offer the unverified legacy 100 escape fee in the new million-unit profile', () => {
    expect(classicMarbleReferenceProfile.rules.islandEscapeFee).toEqual({ amount: 500_000, status: 'inferred-class-proportional-not-enabled' });
    const two = { ...marbleEngine.createInitialState(1), phase: 'island' as const, islandTurns: { p1: 3, p2: 0 } };
    expect(marbleEngine.getPlayerView(two, 'p1').actions.some((item: any) => item.action.type === 'pay-escape')).toBe(false);
    expect(marbleEngine.validateAction(two, 'p1', { type: 'pay-escape' })).toBe('Escape fee is unverified for this ruleset');

    const team = { ...fourMarbleEngine.createInitialState(1), phase: 'island' as const, islandTurns: { p1: 3, p2: 0, p3: 0, p4: 0 } };
    expect(fourMarbleEngine.getPlayerView(team, 'p1').actions.some((item: any) => item.action.type === 'pay-escape')).toBe(false);
    expect(fourMarbleEngine.validateAction(team, 'p1', { type: 'pay-escape' })).toBe('Action unavailable');

    const legacy = { ...two, referenceProfileId: undefined, cityRouteVersion: 3 as const, economicVersion: 3 as const, money: { p1: 1500, p2: 1500 } };
    expect(marbleEngine.getPlayerView(legacy, 'p1').actions.some((item: any) => item.action.type === 'pay-escape')).toBe(true);
    const legacyTeam = { ...team, referenceProfileId: undefined, cityRouteVersion: undefined, economicVersion: undefined, money: { p1: 1500, p2: 1500, p3: 1500, p4: 1500 } };
    expect(fourMarbleEngine.getPlayerView(legacyTeam, 'p1').actions.some((item: any) => item.action.type === 'pay-escape')).toBe(true);
  });

  it('hosts one global Olympics, increases its multiplier, and charges it in both engines', () => {
    expect([0, 1, 2, 3, 4, 8].map(classicOlympicsMultiplier)).toEqual([2, 3, 4, 5, 5, 5]);

    let two = marbleEngine.createInitialState(seedForSum(2));
    two.positions.p1 = 14;
    two.properties['1'] = { owner: 'p1', houses: 0, buildings: {} };
    two = step2(two, 'roll');
    expect(two.phase).toBe('olympic-decision');
    expect(marbleEngine.getPlayerView(two, 'p1').actions.map((action: any) => action.action)).toContainEqual({ type: 'choose-olympic-target', payload: { tile: 1 } });
    two = step2(two, 'choose-olympic-target', { tile: 1 });
    expect(two.activeOlympics).toEqual({ tile: 1, multiplier: 2, host: 'p1' });
    two.active = 'p2'; two.phase = 'roll'; two.positions.p2 = 31; two.rng = seedForSum(2);
    const twoPaid = step2(two, 'roll');
    expect(twoPaid.money.p2).toBe(5_740_000);

    const twoTourism = { ...marbleEngine.createInitialState(seedForSum(2)), active: 'p2' as const, positions: { p1: 0, p2: 2 }, properties: { '4': { owner: 'p1' as const, houses: 0, buildings: {} } }, activeOlympics: { tile: 4, multiplier: 2, host: 'p1' as const } };
    expect(step2(twoTourism, 'roll').money.p2).toBe(4_600_000);

    let team = fourMarbleEngine.createInitialState(seedForSum(2));
    team.positions.p1 = 14;
    team.properties['1'] = { owner: 'p1', houses: 0, buildings: {} };
    team = step4(team, 'roll');
    expect(team.phase).toBe('olympic-decision');
    team = step4(team, 'choose-olympic-target', { tile: 1 });
    expect(team.activeOlympics).toEqual({ tile: 1, multiplier: 2, host: 'p1' });
    team.active = 'p2'; team.phase = 'roll'; team.positions.p2 = 31; team.rng = seedForSum(2);
    const teamPaid = step4(team, 'roll');
    expect(teamPaid.money.p2).toBe(5_740_000);

    const teamTourism = { ...fourMarbleEngine.createInitialState(seedForSum(2)), active: 'p2' as const, positions: { p1: 0, p2: 2, p3: 0, p4: 0 }, properties: { '4': { owner: 'p1' as const, houses: 0, buildings: {} } }, activeOlympics: { tile: 4, multiplier: 2, host: 'p1' as const } };
    expect(step4(teamTourism, 'roll').money.p2).toBe(4_600_000);

    two.properties['3'] = { owner: 'p2', houses: 0, buildings: {} };
    two.active = 'p2'; two.phase = 'roll'; two.positions.p2 = 14; two.rng = seedForSum(2);
    two = step2(two, 'roll'); two = step2(two, 'choose-olympic-target', { tile: 3 });
    expect(two.activeOlympics).toEqual({ tile: 3, multiplier: 3, host: 'p2' });
    expect(marbleEngine.getPlayerView(two, 'p1').board.tiles[1].currentToll).toBe(5_000);
    team.properties['3'] = { owner: 'p2', houses: 0, buildings: {} };
    team.active = 'p2'; team.phase = 'roll'; team.positions.p2 = 14; team.rng = seedForSum(2);
    team = step4(team, 'roll'); team = step4(team, 'choose-olympic-target', { tile: 3 });
    expect(team.activeOlympics).toEqual({ tile: 3, multiplier: 3, host: 'p2' });
  });

  it('does not apply undocumented special effects as taxes or random cards', () => {
    const s = { ...marbleEngine.createInitialState(seedForSum(2)), eventDeck: ['lottery'] as MarbleEventId[] };
    const atBonus = step2(s, 'roll');
    expect(atBonus.positions.p1).toBe(2);
    expect(atBonus.money.p1).toBe(5_000_000);
    expect(atBonus.actionLog?.at(-1)?.text.ko).toContain('임의 카드 규칙');
    const team = fourMarbleEngine.createInitialState(seedForSum(2)); team.eventDeck = ['lottery'];
    const teamAtBonus = step4(team, 'roll');
    expect(teamAtBonus.money.p1).toBe(5_000_000);
    expect(teamAtBonus.actionLog.at(-1)?.type).toBe('reference-pending');
  });

  it('allows bankruptcy only when the historical-profile payment cannot be rescued', () => {
    const state = marbleEngine.createInitialState(31);
    state.phase = 'debt'; state.money.p1 = 0;
    state.pendingPayment = { amount: 100_000, creditor: 'bank', reason: { ko: '확인', es: 'prueba' }, type: 'tax', resumePhase: 'main', resumeActive: 'p1' };
    expect(marbleEngine.validateAction(state, 'p1', { type: 'declare-bankruptcy' })).toBeNull();
    const finished = marbleEngine.applyAction(state, 'p1', { type: 'declare-bankruptcy' });
    expect(finished.result?.winner).toBe('p2');

    const team = fourMarbleEngine.createInitialState(31);
    team.phase = 'debt'; team.money.p1 = 0;
    team.pendingPayment = { amount: 100_000, creditor: 'bank', resumeActive: 'p1' };
    expect(fourMarbleEngine.validateAction(team, 'p1', { type: 'declare-bankruptcy' })).toBeNull();
    expect(step4(team, 'declare-bankruptcy').eliminated.p1).toBe(true);
  });

  it('preserves old-route salaries and state values instead of upgrading saved games', () => {
    const newTwo = marbleEngine.createInitialState(seedForSum(2));
    const oldTwo = { ...newTwo, referenceProfileId: undefined, cityRouteVersion: 3 as const, economicVersion: 3 as const, money: { p1: 1500, p2: 1500 }, positions: { p1: 39, p2: 0 } };
    const afterTwo = step2(oldTwo, 'roll');
    expect(marbleEngine.getPlayerView(afterTwo, 'p1').board.tiles).toHaveLength(40);
    expect(afterTwo.money.p1).toBe(1700);
    expect(afterTwo.completedLaps).toEqual(newTwo.completedLaps);

    const newTeam = fourMarbleEngine.createInitialState(seedForSum(2));
    const oldTeam = { ...newTeam, referenceProfileId: undefined, cityRouteVersion: undefined, economicVersion: undefined, completedLaps: undefined, money: { p1: 1500, p2: 1500, p3: 1500, p4: 1500 }, positions: { p1: 39, p2: 0, p3: 0, p4: 0 } };
    const afterTeam = step4(oldTeam, 'roll');
    expect((fourMarbleEngine.getPlayerView(afterTeam, 'p1') as TeamMarbleView).publicBoard).toHaveLength(40);
    expect(afterTeam.money.p1).toBe(1700);
    expect(afterTeam.completedLaps).toBeUndefined();
  });
});
