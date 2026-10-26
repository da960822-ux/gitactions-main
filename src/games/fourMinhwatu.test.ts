import { describe, expect, it } from 'vitest';
import { fourSeats, type FourSeat } from '../core/fourPlayer';
import { seededRandom } from '../core/types';
import { fourMinhwatuEngine as engine, type FourMinhwatuState } from './fourMinhwatu';
import type { MinhwatuCard } from './minhwatu';

function allCards(state: FourMinhwatuState): MinhwatuCard[] {
  return [...Object.values(state.hands).flat(), ...Object.values(state.captures).flat(), ...state.table, ...state.deck, ...(state.pending ? [state.pending.card] : [])];
}

function deck(seed = 1): MinhwatuCard[] { return allCards(engine.createInitialState(seed)); }
const card = (id: string) => deck().find(c => c.id === id)!;

describe('four-player Minhwatu house team rules', () => {
  it('uses every starting seat across independent seed values without changing the 48-card deal', () => {
    for(const [index,seat] of fourSeats.entries()){
      const state=engine.createInitialState(index * 0x40000000);
      expect(state.turn).toBe(seat);
      expect(allCards(state)).toHaveLength(48);expect(new Set(allCards(state).map(card=>card.id)).size).toBe(48);
      expect(engine.getPlayerView(state,seat).actions.length).toBeGreaterThan(0);
    }
  });
  it('deals four hands of five, eight face-up cards and twenty in the deck', () => {
    const state: FourMinhwatuState = engine.createInitialState(23);
    expect(fourSeats.map(seat => state.hands[seat].length)).toEqual([5,5,5,5]);
    expect(state.table).toHaveLength(8); expect(state.deck).toHaveLength(20);
    expect(new Set(allCards(state).map(c => c.id)).size).toBe(48);
  });

  it('plays complete legal matches while conserving all forty-eight cards without mutating earlier states', () => {
    for (let seed = 0; seed < 30; seed++) {
      let state: FourMinhwatuState = engine.createInitialState(seed);
      const random = seededRandom(seed);
      let plays = 0;
      for (let step = 0; step < 45 && !state.result; step++) {
        const view = engine.getPlayerView(state, state.turn), action = engine.chooseAiAction(view, state.turn, random);
        expect(action).toBeTruthy(); expect(engine.validateAction(state, state.turn, action!)).toBeNull();
        if (action!.type === 'play') plays++;
        const before = JSON.stringify(state);
        const next = engine.applyAction(state, state.turn, action!);
        expect(JSON.stringify(state)).toBe(before); state = next;
        expect(allCards(state)).toHaveLength(48); expect(new Set(allCards(state).map(c => c.id)).size).toBe(48);
      }
      expect(state.result).toBeTruthy(); expect(plays).toBe(20);
      expect(fourSeats.every(seat => state.hands[seat].length === 0)).toBe(true);
      expect(state.deck).toHaveLength(0); expect(state.pending).toBeNull();
    }
  }, 30000);

  it('keeps teammates and opponents hands and deck order private; AI gets the same private view', () => {
    const state: FourMinhwatuState = engine.createInitialState(41);
    for (const player of fourSeats) {
      const view = engine.getPlayerView(state, player), serialized = JSON.stringify(view);
      expect(view.hand.map(c => c.id)).toEqual(state.hands[player].map(c => c.id));
      for (const seat of fourSeats.filter(seat => seat !== player)) for (const hidden of state.hands[seat]) expect(serialized).not.toContain(`"${hidden.id}"`);
      for (const hidden of state.deck) expect(serialized).not.toContain(`"${hidden.id}"`);
      if (player !== state.turn) expect(engine.chooseAiAction(view, player)).toBeNull();
    }
    const changed = structuredClone(state);
    [changed.hands.p2[0], changed.deck[0]] = [changed.deck[0], changed.hands.p2[0]];
    const beforeView = engine.getPlayerView(state,'p1'), afterView = engine.getPlayerView(changed,'p1');
    expect(afterView).toEqual(beforeView);
    expect(engine.chooseAiAction(beforeView,'p1',()=>0)).toEqual(engine.chooseAiAction(afterView,'p1',()=>0));
  });

  it('requires a choice for two matches and captures all three matches automatically', () => {
    const state: FourMinhwatuState = engine.createInitialState(1);
    state.hands.p1 = [card('3-1')]; state.table = [card('3-2'),card('3-3')]; state.deck=[];
    expect(engine.validateAction(state,'p1',{type:'play',payload:{index:0}})).toBe('Choose one matching table card');
    expect(engine.validateAction(state,'p1',{type:'play',payload:{index:0,targetIndex:3}})).toBe('Choose one matching table card');
    state.table.push(card('3-4'));
    const next = engine.applyAction(state,'p1',{type:'play',payload:{index:0}}) as FourMinhwatuState;
    expect(next.captures.p1.map(c=>c.id).sort()).toEqual(['3-1','3-2','3-3','3-4']); expect(next.table).toEqual([]);
  });

  it('resolves the final revealed-card choice before ending the game and leaves unclaimed table cards unawarded', () => {
    const state: FourMinhwatuState = engine.createInitialState(1);
    state.turn='p4'; state.hands={p1:[],p2:[],p3:[],p4:[card('1-4')]}; state.deck=[card('3-1')]; state.table=[card('3-2'),card('3-3')];
    const pending = engine.applyAction(state,'p4',{type:'play',payload:{index:0}}) as FourMinhwatuState;
    expect(pending.phase).toBe('capture-draw'); expect(pending.result).toBeNull();
    const finished = engine.applyAction(pending,'p4',{type:'capture',payload:{targetIndex:0}}) as FourMinhwatuState;
    expect(finished.phase).toBe('finished'); expect(finished.result).toBeTruthy();
    expect(finished.table.map(c=>c.id)).toEqual(['3-3','1-4']);
    expect(finished.captures.p4.map(c=>c.id)).toEqual(['3-2','3-1']);
  });

  it('keeps individual combinations separate while summing teammates adjusted scores', () => {
    const state: FourMinhwatuState = engine.createInitialState(1);
    state.hands={p1:[card('7-4')],p2:[],p3:[],p4:[]}; state.deck=[]; state.table=[];
    state.captures={p1:[card('1-2'),card('2-2')],p2:[card('6-2'),card('9-2'),card('10-2')],p3:[card('3-2')],p4:[]};
    const finished = engine.applyAction(state,'p1',{type:'play',payload:{index:0}}) as FourMinhwatuState;
    const scores = engine.getPlayerView(finished,'p1').players;
    expect(scores.find(p=>p.id==='p1')?.score).toBe(10-30);
    expect(scores.find(p=>p.id==='p3')?.score).toBe(5-30);
    expect(finished.result?.scores).toEqual({A:-45,B:75}); expect(finished.result?.winner).toBe('B');
  });

  it('prefers completing its own valuable yaku over a larger immediate card capture', () => {
    const state: FourMinhwatuState = engine.createInitialState(1);
    state.hands.p1=[card('3-2'),card('11-1')]; state.table=[card('3-3'),card('11-2')];
    state.captures.p1=[card('1-2'),card('2-2')]; state.deck=[];
    expect(engine.chooseAiAction(engine.getPlayerView(state,'p1'),'p1',()=>0)).toEqual({type:'play',payload:{index:0}});
  });

  it('rejects off-turn, invalid players, tampered selections and actions after the result', () => {
    const state: FourMinhwatuState = engine.createInitialState(1);
    expect(engine.validateAction(state,'p2',{type:'play',payload:{index:0}})).toBe('Not your turn');
    expect(engine.validateAction(state,'bad' as FourSeat,{type:'play',payload:{index:0}})).toBe('Invalid player');
    expect(engine.validateAction(state,'p1',{type:'play',payload:{index:-1}})).toBe('Invalid hand index');
    expect(engine.validateAction(state,'p1',{type:'play',payload:{index:1.5}})).toBe('Invalid hand index');
    state.phase='finished';
    expect(engine.validateAction(state,'p1',{type:'play',payload:{index:0}})).toBe('Game is finished');
  });
});
