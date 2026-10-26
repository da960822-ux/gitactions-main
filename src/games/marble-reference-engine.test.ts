import { describe, expect, it } from 'vitest';
import { seededRandom } from '../core/types';
import { fourMarbleEngine, type FourMarbleState, type MarbleView as TeamMarbleView } from './fourMarble';
import { marbleEngine, type MarbleEventId, type MarbleState } from './marble';
import { classicMarbleCityToll, classicMarbleReferenceProfile } from './marble-reference-profile';

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
  });
});
