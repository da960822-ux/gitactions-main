import { describe, expect, it } from 'vitest';
import { fourMarbleEngine as engine, createFourLegacyMarbleState, createFourClassicKoreaResearchState, type FourMarbleState, type MarbleView } from './fourMarble';
import { seededRandom, type GameAction } from '../core/types';
import { worldIslandsBoard } from './marbleBoardProfiles';
import { classicInvestment, classicToll } from './marbleClassicEconomy';
const fresh = (seed = 1) => ({ ...engine.createInitialState(seed), boardRevision: 1, rentRulesVersion: 1, constructionPriceRulesVersion: 1 }) as FourMarbleState;
const step = (s: FourMarbleState, a: GameAction) => engine.applyAction(s, s.active, a) as FourMarbleState;
const travel = (s: FourMarbleState, destination: number) => { s.phase = 'train-decision'; s.trainFare = 0; return step(s, { type: 'choose-train', payload: { destination } }); };
const own = (owner: 'p1'|'p2'|'p3'|'p4') => ({ owner, houses: 0, buildings: [] as [] });
describe('four-seat saved v50 world islands32 revision1', () => {
  it('starts the approved32 profile and preserves both legacy40 and blocked historical profiles', () => {
    const s = fresh(), view = engine.getPlayerView(s, 'p1') as MarbleView;
    expect(s).toMatchObject({ boardProfile: 'world-islands-32-v1', cityRouteVersion: 5, constructionRulesVersion: 2 }); expect(view.publicBoard).toHaveLength(32); expect(view.publicBoard.filter(t => t.kind === 'tourism')).toHaveLength(8); expect(view.publicBoard.filter(t => t.kind === 'property')).toHaveLength(18);
    expect(engine.getPlayerView(createFourLegacyMarbleState(1), 'p1').panels[0].cards).toHaveLength(40);
    expect(engine.getPlayerView(createFourClassicKoreaResearchState(), 'p1').actions).toHaveLength(0);
  });
  it('buys islands for150, values them at150, never builds/takes over and charges fixed120 only to enemies', () => {
    let s = travel(fresh(), 2); const before = s.money.p1;
    expect(engine.validateAction(s, 'p1', { type: 'buy', payload: { buildings: ['villa'] } })).toBeTruthy();
    s = step(s, { type: 'buy', payload: { buildings: [] } }); expect(s.money.p1).toBe(before - 150); expect(s.actionLog.find(e => e.type === 'buy')?.title).toEqual({ ko: '관광섬 구매 완료', es: 'Isla turística comprada' }); expect(engine.getPlayerView(s, 'p1').players[0].score).toBe(before);
    s.buildSite = 'start'; expect(engine.getPlayerView(s, 'p1').actions.some(c => c.action.type === 'build')).toBe(false);
    s.active = 'p3'; const allied = s.money.p3; s = travel(s, 2); expect(s.money.p3).toBe(allied);
    s.modifiers[2] = { festival: 'p1', blackout: 'p2' }; s.active = 'p2'; const enemy = s.money.p2, owner = s.money.p1; s = travel(s, 2); expect(s.money.p2).toBe(enemy - 120); expect(s.money.p1).toBe(owner + 120); expect(s.takeoverTile).toBeNull(); expect(engine.validateAction(s, 'p2', { type: 'takeover', payload: { tile: 2 } })).toBeTruthy();
  });
  it('liquidates an island for75 and automatically settles a covered obligation', () => {
    const s = fresh(); s.properties[2] = own('p1'); s.money.p1 = 0; s.phase = 'debt'; s.pendingPayment = { amount: 60, creditor: 'p4', resumeActive: 'p1' };
    const n = step(s, { type: 'sell-property', payload: { tile: 2 } }); expect(n.money.p1).toBe(15); expect(n.money.p4).toBe(3060); expect(n.phase).toBe('main'); expect(n.properties[2]).toBeUndefined();
  });
  it('keeps modifier cards, maintenance and dividends city-only', () => {
    for (const card of ['city-festival','blackout','maintenance','city-dividend'] as const) {
      const s = fresh(); s.properties[2] = own('p1'); s.properties[4] = own('p2'); s.eventDeck = [card]; const n = travel(s, 12);
      expect(n.phase).toBe('main'); expect(n.money.p1).toBe(3000); expect(n.pendingEvent).toBeNull();
    }
  });
  it('uses source city costs and tolls with independent selections and450 START salary', () => {
    let s = travel(fresh(), 1); const economy = worldIslandsBoard[1].cityEconomy!;
    s = step(s, { type: 'buy', payload: { buildings: ['building'] } }); expect(s.money.p1).toBe(3000 - classicInvestment(economy, s.properties[1]));
    const owner = s.money.p1; s.active = 'p2'; s = travel(s, 1); expect(s.money.p1).toBe(owner + classicToll(economy, s.properties[1], 1)!);
    s.positions.p2 = 31; const cash = s.money.p2; s = travel(s, 0); expect(s.money.p2).toBe(cash + 450);
  });
  it('requires islands and one individual owner for a side, then awards that player team', () => {
    let s = fresh(); for (const index of [1,3,4,5,6,7]) s.properties[index] = own('p1');
    s.properties[4] = own('p3'); s = travel(s, 2); s = step(s, { type: 'buy' }); expect(s.result).toBeNull();
    s.properties[4] = own('p1'); delete s.properties[7]; s = travel(s, 7); s = step(s, { type: 'buy' }); expect(s.result?.winner).toBe('A'); expect(s.result?.reason.ko).toContain('한 면'); expect(engine.getPlayerView(s, 'p1').actions).toHaveLength(0);
  });
  it('awards all eight islands to one individual, not combined teammates', () => {
    let s = fresh(); for (const index of [2,4,9,14,16,18,25]) s.properties[index] = own('p1'); s.properties[16] = own('p3'); s = travel(s, 30); s = step(s, { type: 'buy' }); expect(s.result).toBeNull(); s.properties[16] = own('p1'); delete s.properties[30]; s = travel(s,30); s = step(s,{type:'buy'}); expect(s.result?.winner).toBe('A'); expect(s.actionLog.at(-1)).toMatchObject({ victoryType: 'tourism-monopoly' });
  });
  it('keeps all32 world-travel destinations, self station no salary and event resolution', () => {
    const s = fresh(); s.phase = 'train-decision'; s.positions.p1 = 24; const choices = engine.getPlayerView(s, 'p1').actions.filter(c => c.action.type === 'choose-train'); expect(choices).toHaveLength(32);
    const n = step(s, { type: 'choose-train', payload: { destination: 24 } }); expect(n.lastMove?.steps).toBe(0); expect(n.money.p1).toBe(2900); expect(n.phase).toBe('main'); expect(n.trainReady.p1).toBe(true);
    const event = fresh(); event.eventDeck = ['lottery']; expect(travel(event, 12).money.p1).toBe(3200);
  });
  it('finishes seeded world32 AI games with legal moves and nonnegative cash', () => {
    for (const seed of [1,17,91]) { let s = fresh(seed); const random = seededRandom(seed);
      for (let i = 0; i < 2500 && !s.result; i++) { const action = engine.chooseAiAction(engine.getPlayerView(s,s.active),s.active,random)!; expect(action).toBeTruthy(); expect(engine.validateAction(s,s.active,action)).toBeNull(); s=step(s,action); for(const cash of Object.values(s.money)) expect(cash).toBeGreaterThanOrEqual(0); }
      expect(s.result).toBeTruthy();
    }
  },30000);
});

it('finishes line victory on city takeover and keeps island-only incomplete lines unwon', () => {
  let s = fresh(); for (const index of [1,2,3,4,5,6]) s.properties[index] = own('p2'); s.properties[7] = own('p1'); s.active = 'p2'; s = travel(s,7);
  expect(s.result).toBeNull(); s = step(s,{type:'takeover',payload:{tile:7}}); expect(s.result?.winner).toBe('B'); expect(s.phase).toBe('finished');
});

it('handles every retained card on world32 without a missing destination or invalid next action', () => {
  for (const card of fresh().eventDeck) {
    const s = fresh(); s.properties[1] = own('p1'); s.properties[3] = own('p2'); s.eventDeck = [card,...s.eventDeck.filter(id => id !== card)];
    let n = travel(s,12);
    for(let i=0;i<12 && n.active==='p1' && !n.result;i++) { const action=engine.chooseAiAction(engine.getPlayerView(n,'p1'),'p1',()=>.3)!; expect(action).toBeTruthy(); expect(engine.validateAction(n,'p1',action)).toBeNull(); n=step(n,action); }
    expect(n.phase).not.toBe('event-decision');
  }
});

it('awards three color groups to their individual owner team, without combining teammates', () => {
  let s = fresh(); for (const index of [1,3,10,11,26]) s.properties[index] = own('p2'); s.properties[11] = own('p4'); s.active = 'p2'; s = travel(s,27); s = step(s,{type:'buy'}); expect(s.result).toBeNull();
  s.properties[11] = own('p2'); delete s.properties[27]; s = travel(s,27); s = step(s,{type:'buy'}); expect(s.result?.winner).toBe('B'); expect(s.actionLog.at(-1)).toMatchObject({ victoryType: 'triple-monopoly' });
});

it('assigns corner16 island only to the third side and gives line priority over triple monopoly', () => {
  let s = fresh(); for(const index of [17,18,19,21,22]) s.properties[index]=own('p1'); s = travel(s,23); s = step(s,{type:'buy'}); expect(s.result).toBeNull();
  s = travel(s,16); s = step(s,{type:'buy'}); expect(s.actionLog.at(-1)).toMatchObject({victoryType:'line-monopoly',line:2});
  let preceding = fresh(); for(const index of [9,10,11,13,14]) preceding.properties[index]=own('p2'); preceding.active='p2'; preceding=travel(preceding,15); preceding=step(preceding,{type:'buy'}); expect(preceding.actionLog.at(-1)).toMatchObject({victoryType:'line-monopoly',line:1});
  let tied = fresh(); for(const index of [1,2,3,4,5,6,10,11]) tied.properties[index]=own('p1'); tied=travel(tied,7); tied=step(tied,{type:'buy'}); expect(tied.actionLog.at(-1)).toMatchObject({victoryType:'line-monopoly',line:0});
});
