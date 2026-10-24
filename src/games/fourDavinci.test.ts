import { describe, expect, it } from 'vitest';
import { fourSeats, fourTeam } from '../core/fourPlayer';
import { seededRandom } from '../core/types';
import { fourDavinciEngine as engine, type FourDavinciState } from './fourDavinci';

function ready(seed: number): FourDavinciState {
  let state = engine.createInitialState(seed) as FourDavinciState;
  while (state.phase === 'setup') {
    const action = engine.chooseAiAction(engine.getPlayerView(state, state.turn), state.turn, () => .5)!;
    state = engine.applyAction(state, state.turn, action);
  }
  return state;
}
describe('four-player advanced Da Vinci team variant', () => {
  it('deals three per seat, preserves all 26 distinct tiles, and requires four ready confirmations', () => {
    let state = engine.createInitialState(91) as FourDavinciState;
    expect(state.deck).toHaveLength(14);
    for (const seat of fourSeats) expect(state.hands[seat]).toHaveLength(3);
    expect(new Set([...state.deck, ...fourSeats.flatMap(seat => state.hands[seat])].map(tile => `${tile.color}-${tile.value}`)).size).toBe(26);
    expect(engine.validateAction(state, 'p2', { type: 'finish-setup' })).toBe('not_your_turn');
    for (let i = 0; i < 4; i++) {
      const seat = state.turn;
      while (state.pendingJokers[seat].length) state = engine.applyAction(state, seat, { type: 'place-joker', payload: { index: 1 } });
      state = engine.applyAction(state, seat, { type: 'finish-setup' });
      expect(state.phase).toBe(i < 3 ? 'setup' : 'draw');
    }
    expect(state.turn).toBe('p1');
  });

  it('never exposes hidden enemy or teammate values, deck order, or joker placement', () => {
    let state = ready(31);
    state = engine.applyAction(state, 'p1', { type: 'draw' });
    if(state.phase==='place-joker')state=engine.applyAction(state,'p1',{type:'place-joker',payload:{index:0}});
    const ownView = engine.getPlayerView(state, 'p1') as any;
    for(const seat of ['p2','p3','p4']) {
      expect(ownView.policy.racks[seat].every((tile:any)=>tile.value===null)).toBe(true);
      expect(ownView.panels.find((panel:any)=>panel.id===seat).cards.every((card:any)=>card.hidden)).toBe(true);
    }
    expect(ownView.policy.own.map((tile:any)=>tile.value)).toEqual(state.hands.p1.map(tile=>tile.value));
    expect(ownView.policy.deck).toBeUndefined();
    expect(ownView.policy.log.filter((event:any)=>event.actor!=='p1').every((event:any)=>!Object.hasOwn(event,'insertedIndex'))).toBe(true);
    const guess = ownView.actions.find((option:any)=>option.action.type==='guess').action;
    expect(engine.validateAction(state,'p1',{...guess,payload:{...guess.payload,target:'p3'}})).toBe('choose_enemy');
    const changed = structuredClone(state);
    [changed.hands.p2[0].value, changed.hands.p2[1].value] = [changed.hands.p2[1].value, changed.hands.p2[0].value];
    expect(engine.getPlayerView(changed,'p1')).toEqual(ownView);
  });

  it('reveals the drawn tile on a miss and skips eliminated seats', () => {
    let state = ready(91);
    state.hands.p2 = state.hands.p2.map(tile=>({...tile,revealed:true}));
    state = engine.applyAction(state,'p1',{type:'draw'});
    if(state.phase==='place-joker')state=engine.applyAction(state,'p1',{type:'place-joker',payload:{index:0}});
    const index = state.hands.p4.findIndex(tile=>!tile.revealed), value = state.hands.p4[index].value === 0 ? 1 : 0;
    const drawnIndex=state.drawnIndex!;
    state = engine.applyAction(state,'p1',{type:'guess',payload:{target:'p4',index,value}});
    expect(state.turn).toBe('p3');
    expect(state.hands.p1[drawnIndex].revealed).toBe(true);
    expect(engine.validateAction(state,'p2',{type:'draw'})).toBe('not_your_turn');
  });

  it('lets a stock-empty player choose an unrevealed own tile before advancing', () => {
    let state = ready(91);
    state = { ...state, deck: [], phase: 'guess', drawnIndex: null };
    const wrong = state.hands.p2[0].value === 0 ? 1 : 0;
    state = engine.applyAction(state, 'p1', { type: 'guess', payload: { target: 'p2', index: 0, value: wrong } });
    expect(state.phase).toBe('reveal-own');
    expect(state.turn).toBe('p1');
    expect(engine.validateAction(state, 'p1', { type: 'guess', payload: { target: 'p2', index: 0, value: wrong } })).not.toBeNull();
    expect(engine.validateAction(state, 'p2', { type: 'reveal-own', payload: { index: 0 } })).toBe('not_your_turn');
    const actions = engine.getPlayerView(state, 'p1').actions.filter(choice => choice.action.type === 'reveal-own');
    expect(actions.length).toBe(state.hands.p1.filter(tile => !tile.revealed).length);
    const chosen = actions.at(-1)!.action.payload!.index as number;
    state = engine.applyAction(state, 'p1', { type: 'reveal-own', payload: { index: chosen } });
    expect(state.hands.p1[chosen].revealed).toBe(true);
    expect(state.log.at(-1)).toMatchObject({ type: 'wrong-guess', actor: 'p1', revealedOwnIndex: chosen });
    expect(state.turn).toBe('p2');
    expect(engine.chooseAiAction(engine.getPlayerView({ ...state, turn: 'p1', phase: 'reveal-own', pendingGuess: { target: 'p2', index: 0, value: wrong } }, 'p1'), 'p1', () => .9)?.type).toBe('reveal-own');
  });

  it('finishes when both opposing racks are exposed, preserving a surviving teammate', () => {
    let state=ready(17);
    state.phase='guess';
    state.hands.p2=state.hands.p2.map(tile=>({...tile,revealed:true}));
    state.hands.p4=state.hands.p4.map((tile,i)=>({...tile,revealed:i!==0}));
    state=engine.applyAction(state,'p1',{type:'guess',payload:{target:'p4',index:0,value:state.hands.p4[0].value}});
    expect(state.result?.winner).toBe('A');
    expect(state.hands.p3.some(tile=>!tile.revealed)).toBe(true);
    expect(engine.validateAction(state,'p1',{type:'stop'})).toBe('game_finished');
  });

  it('settles defeat immediately if a failed guess exposes the last surviving friendly tile', () => {
    let state=ready(17);
    state.phase='guess';state.drawnIndex=0;
    state.hands.p1=state.hands.p1.map((tile,i)=>({...tile,revealed:i!==0}));
    state.hands.p3=state.hands.p3.map(tile=>({...tile,revealed:true}));
    const wrong=state.hands.p2[0].value===0?1:0;
    state=engine.applyAction(state,'p1',{type:'guess',payload:{target:'p2',index:0,value:wrong}});
    expect(state.phase).toBe('finished');
    expect(state.result?.winner).toBe('B');
    expect(engine.getPlayerView(state,'p2').actions).toEqual([]);
  });

  it('plays complete legal matches from filtered views across multiple deals', () => {
    for(const seed of [1,17,31,91,305,701]) {
      const random=seededRandom(seed);
      let state=engine.createInitialState(seed) as FourDavinciState;
      for(let step=0;step<1500&&!state.result;step++) {
        const view=engine.getPlayerView(state,state.turn), before=JSON.stringify(state);
        const action=engine.chooseAiAction(view,state.turn,random);
        expect(action).toBeTruthy();
        expect(JSON.stringify(state)).toBe(before);
        expect(engine.validateAction(state,state.turn,action!)).toBeNull();
        if(action!.type==='guess')expect(fourTeam(action!.payload!.target as any)).not.toBe(fourTeam(state.turn));
        state=engine.applyAction(state,state.turn,action!);
        expect(state.deck.length+fourSeats.reduce((n,seat)=>n+state.hands[seat].length,0)).toBe(26);
      }
      expect(state.result,`seed ${seed} did not terminate`).toBeTruthy();
    }
  },30000);
});
