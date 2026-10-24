import { describe, expect, it } from 'vitest';
import { fourSeats, fourTeam } from '../core/fourPlayer';
import { seededRandom, type GameAction } from '../core/types';
import { fourMarbleEngine as engine, type FourMarbleState } from './fourMarble';

const state = (seed = 1) => engine.createInitialState(seed) as FourMarbleState;
function rollFor(total: number) {
  for (let seed = 0; seed < 10000; seed++) {
    const random = seededRandom(seed);
    if (2 + Math.floor(random() * 6) + Math.floor(random() * 6) === total) return seed;
  }
  throw new Error('No dice seed');
}
const step = (s: FourMarbleState, action: GameAction) => engine.applyAction(s, s.active, action) as FourMarbleState;

describe('four-seat Marble team variant', () => {
  it('allows all seven pawn skins only when unoccupied and locks each seat after its first roll', () => {
    const s = state();
    expect(new Set(Object.values(s.pawns)).size).toBe(4);
    expect(engine.validateAction(s, 'p1', { type: 'choose-pawn', payload: { pawn: 'penguin' } })).toBeTruthy();
    expect(engine.validateAction(s, 'p2', { type: 'choose-pawn', payload: { pawn: 'robot' } })).toBeTruthy();
    expect(engine.validateAction(s, 'p1', { type: 'choose-pawn', payload: { pawn: 'unknown' } })).toBeTruthy();
    const selected = step(s, { type: 'choose-pawn', payload: { pawn: 'sali-suli' } });
    expect(selected.pawns).toEqual({ p1: 'sali-suli', p2: 'cat', p3: 'penguin', p4: 'astronaut' });
    expect(s.pawns.p1).toBe('fox'); expect(selected.pawnLocked.p1).toBe(false);
    expect(engine.getPlayerView(selected, 'p1').actions.some(option => option.action.payload?.pawn === 'fox')).toBe(true);
    const rolled = step(selected, { type: 'roll' });
    expect(rolled.pawnLocked).toEqual({ p1: true, p2: false, p3: false, p4: false });
    rolled.active = 'p1'; rolled.phase = 'roll';
    expect(engine.validateAction(rolled, 'p1', { type: 'choose-pawn', payload: { pawn: 'robot' } })).toBeTruthy();
    expect(engine.getPlayerView(rolled, 'p1').actions.some(option => option.action.type === 'choose-pawn')).toBe(false);
    rolled.active = 'p2';
    expect(engine.validateAction(rolled, 'p2', { type: 'choose-pawn', payload: { pawn: 'fox' } })).toBeNull();
    expect(engine.chooseAiAction(engine.getPlayerView(rolled, 'p2'), 'p2', () => .99)?.type).toBe('roll');
  });
  it('retains the current forty-square board and independent accounts', () => {
    const s = state(), view = engine.getPlayerView(s, 'p1');
    expect(view.panels[0].cards).toHaveLength(40);
    expect(view.players.map(player => player.score)).toEqual([1500, 1500, 1500, 1500]);
    expect(s.active).toBe('p1'); expect(fourTeam('p1')).toBe(fourTeam('p3'));
    expect(JSON.stringify(view)).not.toContain('eventDeck');
    expect(JSON.stringify(view)).not.toContain('"rng"');
    expect(engine.validateAction(s, 'p2', { type: 'roll' })).toBeTruthy();
    expect(engine.validateAction(s, 'p1', { type: 'roll', payload: { amount: 9999 } })).toBeTruthy();
  });

  it('pays rent to the actual fourth seat, without touching another opponent', () => {
    const s = state(); s.rng = rollFor(2); s.positions.p1 = 39; s.properties[1] = { owner: 'p4', houses: 2 };
    const next = step(s, { type: 'roll' });
    expect(next.positions.p1).toBe(1);
    expect(next.money).toEqual({ p1: 1500 + 200 - 48, p2: 1500, p3: 1500, p4: 1548 });
    expect(s.money.p1).toBe(1500);
  });

  it('publishes ordered four-seat movement receipts for the original premium motion timeline', () => {
    const s = state(); s.active = 'p4'; s.rng = rollFor(2); s.positions.p4 = 39;
    const next = step(s, { type: 'roll' });
    expect(next.lastMove).toMatchObject({ playerId: 'p4', from: 39, to: 1, steps: 2, source: 'dice' });
    expect(next.actionLog.map(event => event.type)).toEqual(['roll', 'move', 'arrival']);
    expect(next.actionLog.map(event => event.actor)).toEqual(['p4', 'p4', 'p4']);
    expect(next.actionLog.map(event => event.sequence)).toEqual([1, 2, 3]);
    expect(next.diceSequence).toBe(1);
  });

  it('waives rent for teammates and preserves city effects until an enemy arrives', () => {
    const s = state(); s.rng = rollFor(2); s.positions.p1 = 39; s.properties[1] = { owner: 'p3', houses: 3 }; s.modifiers[1] = { festival: 'p3' };
    const next = step(s, { type: 'roll' });
    expect(next.money.p1).toBe(1700); expect(next.money.p3).toBe(1500);
    expect(next.modifiers[1].festival).toBe('p3');
  });

  it('resolves a payment by the fixed loan and keeps the actual creditor', () => {
    const s = state(); s.rng = rollFor(2); s.positions.p1 = 0; s.properties[3] = { owner: 'p4', houses: 0 };
    s.phase = 'debt'; s.money.p1 = 5; s.pendingPayment = { amount: 100, creditor: 'p4', resumeActive: 'p1' };
    const next = step(s, { type: 'borrow' });
    expect(next.money.p1).toBe(205); expect(next.money.p4).toBe(1600);
    expect(next.debt.p1).toBe(330); expect(next.phase).toBe('main'); expect(next.pendingPayment).toBeNull();
    expect(engine.validateAction(next, 'p1', { type: 'borrow' })).toBeTruthy();
  });

  it('requires both teammates to bankrupt, returns their cities and skips eliminated seats', () => {
    const s = state(); s.phase = 'debt'; s.money.p1 = 0; s.debt.p1 = 330;
    s.pendingPayment = { amount: 100, creditor: 'p2', resumeActive: 'p1' }; s.properties[1] = { owner: 'p1', houses: 2 };
    const first = step(s, { type: 'declare-bankruptcy' });
    expect(first.result).toBeNull(); expect(first.eliminated.p1).toBe(true); expect(first.properties[1]).toBeUndefined(); expect(first.active).toBe('p2');
    first.active = 'p4'; first.phase = 'main';
    expect(step(first, { type: 'endTurn' }).active).toBe('p2');
    first.active = 'p3'; first.phase = 'debt'; first.money.p3 = 0; first.pendingPayment = { amount: 10, creditor: 'bank', resumeActive: 'p3' };
    const last = step(first, { type: 'declare-bankruptcy' });
    expect(last.result?.winner).toBe('B'); expect(last.phase).toBe('finished');
  });

  it('resumes the drawer after another seat resolves an event-card debt', () => {
    const s = state(); s.active = 'p4'; s.phase = 'debt'; s.money.p4 = 1;
    s.pendingPayment = { amount: 100, creditor: 'bank', resumeActive: 'p1' };
    const borrowed = step(s, { type: 'borrow' });
    expect(borrowed.active).toBe('p1'); expect(borrowed.phase).toBe('main');
    const bankrupt = step(s, { type: 'declare-bankruptcy' });
    expect(bankrupt.active).toBe('p1'); expect(bankrupt.turns).toBe(0);
  });

  it('settles the two team net assets at exactly 120 completed turns', () => {
    const s = state(); s.active = 'p4'; s.phase = 'main'; s.turns = 119;
    s.money.p1 = 1900; s.debt.p1 = 330; s.properties[1] = { owner: 'p3', houses: 1 };
    const next = step(s, { type: 'endTurn' });
    expect(next.result).toMatchObject({ winner: 'A', scores: { A: 3210, B: 3000 } });
    expect(next.turns).toBe(120); expect(engine.getPlayerView(next, 'p4').actions).toHaveLength(0);
  });

  it('handles all sixteen cards without leaking their order to the policy', () => {
    for(const card of state().eventDeck) {
      const s = state(); s.rng = rollFor(2); s.positions.p1 = 0; s.eventDeck = [card, ...s.eventDeck.filter(id => id !== card)];
      s.properties[1] = {owner:'p1',houses:1}; s.properties[3] = {owner:'p4',houses:2};
      let next = step(s, {type:'roll'});
      expect(next.log.some(item => item.ko.includes('p1'))).toBe(true);
      for(let i=0;i<10 && next.active==='p1' && !next.result;i++) {
        const view = engine.getPlayerView(next,'p1'), action=engine.chooseAiAction(view,'p1',()=>.3);
        expect(action).toBeTruthy(); expect(engine.validateAction(next,'p1',action!)).toBeNull();
        next=step(next,action!);
      }
      expect(next.phase).not.toBe('event-decision');
    }
  });

  it('completes seeded AI matches with legal moves and consistent money/property limits', () => {
    for(const seed of [1,17,91,305,1009]) {
      let s=state(seed); const random=seededRandom(seed);
      for(let actionCount=0;actionCount<2000&&!s.result;actionCount++) {
        const before=JSON.stringify(s), view=engine.getPlayerView(s,s.active), action=engine.chooseAiAction(view,s.active,random);
        expect(action).toBeTruthy(); expect(JSON.stringify(s)).toBe(before);
        expect(engine.validateAction(s,s.active,action!)).toBeNull();
        s=step(s,action!);
        for(const seat of fourSeats) { expect(s.money[seat]).toBeGreaterThanOrEqual(0); expect([0,330]).toContain(s.debt[seat]); }
        for(const prop of Object.values(s.properties)) { expect(prop.houses).toBeLessThanOrEqual(3); expect(s.eliminated[prop.owner]).toBe(false); }
      }
      expect(s.result).toBeTruthy();
    }
  }, 30000);
});
