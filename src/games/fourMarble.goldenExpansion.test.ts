import { describe, expect, it } from 'vitest';
import { fourMarbleEngine as engine, createFourLegacyMarbleState, type FourMarbleState, type MarbleView } from './fourMarble';
import type { MarbleEventId } from './marble';
import type { GameAction } from '../core/types';
import { classicSaleValue } from './marbleClassicEconomy';
const fresh = () => engine.createInitialState(17) as FourMarbleState;
const step = (s: FourMarbleState, a: GameAction) => engine.applyAction(s, s.active, a) as FourMarbleState;
const board = (s: FourMarbleState) => (engine.getPlayerView(s, 'p1') as MarbleView).publicBoard;
const draw = (s: FourMarbleState, card: MarbleEventId) => { s.eventDeck = [card]; s.phase = 'train-decision'; s.trainFare = 0; return step(s, { type: 'choose-train', payload: { destination: board(s).findIndex(t => t.kind === 'event') } }); };
const choose = (s: FourMarbleState, tile = 1) => step(JSON.parse(JSON.stringify(s)), { type: 'choose-event-city', payload: { tile } });
const prop = (owner: 'p1'|'p2'|'p3'|'p4', buildings: ('villa'|'building'|'hotel')[] = []) => ({ owner, houses: buildings.length === 3 ? 2 : buildings.length ? 1 : 0, buildings, landmark: false });
describe('four-player v4 golden keys', () => {
  it('only fresh games have23 cards and publishes shield inventory; legacy16 remains unchanged', () => {
    const s = fresh(); expect(s.eventVersion).toBe(4); expect(new Set(s.eventDeck).size).toBe(23); expect(createFourLegacyMarbleState(17).eventDeck).toHaveLength(16);
    expect((engine.getPlayerView(s,'p1') as MarbleView).publicState.cityShields).toEqual({p1:0,p2:0,p3:0,p4:0});
  });
  it('forced sale pays actual bank sale proceeds to owner only, clears property/effects and cannot replay', () => {
    let s=fresh(); s.properties[1]=prop('p2',['villa','building']); s.modifiers[1]={festival:'p2',blackout:'p1'}; const amount=classicSaleValue(board(s)[1].cityEconomy!,s.properties[1]); const money={...s.money};
    s=draw(s,'forced-sale'); expect(s.phase).toBe('event-decision'); s=choose(s); expect(s.properties[1]).toBeUndefined(); expect(s.modifiers[1]).toBeUndefined(); expect(s.money).toEqual({...money,p2:money.p2+amount});
    expect(s.actionLog.at(-1)).toMatchObject({type:'sell',fromAccount:'bank',toAccount:'p2',amount,cardPhase:'resolution'}); expect(engine.validateAction(s,'p1',{type:'choose-event-city',payload:{tile:1}})).toBeTruthy();
  });
  for(const id of ['forced-sale','earthquake'] as const) it(`${id} excludes ally, tourism, landmark and empty earthquake targets`,()=>{
    let s=fresh(); s.properties[1]={...prop('p2',['villa','building','hotel']),landmark:true,houses:3}; s.properties[3]=prop('p3',['villa']); const island=board(s).findIndex(t=>t.kind==='tourism'); s.properties[island]=prop('p4');
    s=draw(s,id); expect(s.phase).toBe('main'); expect(s.actionLog.at(-1)?.cardOutcome).toBe('no-effect');
  });
  it('earthquake removes highest building and preserves ownership, other buildings and modifiers without money',()=>{
    let s=fresh(); s.properties[1]=prop('p2',['villa','hotel']); s.modifiers[1]={festival:'p2'}; const money={...s.money}; s=choose(draw(s,'earthquake')); expect(s.properties[1]).toEqual(prop('p2',['villa'])); expect(s.modifiers[1]).toEqual({festival:'p2'}); expect(s.money).toEqual(money); expect(s.actionLog.at(-1)).toMatchObject({constructionBefore:{buildings:['villa','hotel']},constructionAfter:{buildings:['villa']}});
  });
  for(const id of ['forced-sale','earthquake','blackout'] as const) it(`shield blocks ${id} once across reload`,()=>{
    let s=fresh(); s.active='p2'; s=draw(s,'city-shield'); s=draw(s,'city-shield'); expect(s.cityShields?.p2).toBe(1); expect(s.actionLog.at(-1)?.cardOutcome).toBe('no-effect');
    s.active='p1'; s.properties[1]=prop('p2',['villa']); s=choose(draw(s,id)); expect(s.cityShields?.p2).toBe(0); expect(s.properties[1]).toEqual(prop('p2',['villa'])); expect(s.actionLog.at(-1)).toMatchObject({blockedByShield:true,cardOutcome:'no-effect'}); s=choose(draw(s,id)); expect(s.actionLog.at(-1)?.blockedByShield).toBeUndefined();
  });
  it('grant adds lowest missing available building free, respects hotel lap rule and never grants landmark',()=>{
    let s=fresh(); s.properties[1]=prop('p1',['building']); const money={...s.money}; s=choose(draw(s,'construction-grant')); expect(s.properties[1].buildings).toEqual(['villa','building']); expect(s.money).toEqual(money);
    s=draw(s,'construction-grant'); expect(s.actionLog.at(-1)?.cardOutcome).toBe('no-effect'); s.completedLaps!.p1=1; s=choose(draw(s,'construction-grant')); expect(s.properties[1].buildings).toEqual(['villa','building','hotel']); expect(s.properties[1].landmark).toBe(false); s=draw(s,'construction-grant'); expect(s.actionLog.at(-1)?.cardOutcome).toBe('no-effect');
  });
  it('birthday transfers only available enemy cash, no ally charge or debt, one aggregate receipt and conserved total',()=>{
    let s=fresh(); s.money.p2=17; s.money.p4=80; const money={...s.money}, total=Object.values(s.money).reduce((a,b)=>a+b,0); s=draw(s,'birthday'); expect(s.money).toEqual({...money,p1:money.p1+57,p2:0,p4:40}); expect(Object.values(s.money).reduce((a,b)=>a+b,0)).toBe(total); expect(s.debt).toEqual({p1:0,p2:0,p3:0,p4:0}); const receipts=s.actionLog.filter(e=>e.cardId==='birthday'&&e.cardPhase==='resolution'); expect(receipts).toHaveLength(1); expect(receipts[0]).toMatchObject({amount:57,toAccount:'p1',moneyDelta:{p1:57,p2:-17,p4:-40},transfers:[{from:'p2',to:'p1',amount:17},{from:'p4',to:'p1',amount:40}],cardOutcome:'paid'}); expect(receipts[0].text.ko).toContain('p2 → p1: 17'); expect(receipts[0].text.ko).toContain('p4 → p1: 40');
  });
  it('hunt skips islands and owned cities, wraps with salary, offers normal purchase; full board is no effect',()=>{
    let s=fresh(); const b=board(s), event=b.findIndex(t=>t.kind==='event'); for(let i=event+1;i<b.length;i++) if(b[i].kind==='property') s.properties[i]=prop('p2'); const money=s.money.p1;
    s=draw(s,'property-hunt'); expect(s.positions.p1).toBe(1); expect(s.phase).toBe('decision'); expect(s.money.p1).toBe(money+450); expect(engine.getPlayerView(s,'p1').actions.some(a=>a.action.type==='buy')).toBe(true);
    for(let i=0;i<b.length;i++) if(b[i].kind==='property') s.properties[i]=prop('p2'); s=draw(s,'property-hunt'); expect(s.actionLog.at(-1)?.cardOutcome).toBe('no-effect');
  });
  it('AI chooses valid new targets and repeated identical draws have distinct cause IDs',()=>{
    let s=fresh(); s.properties[1]=prop('p2',['villa','building','hotel']); s=draw(s,'earthquake'); const ai=engine.chooseAiAction(engine.getPlayerView(s,'p1'),'p1',()=>0)!; expect(engine.validateAction(s,'p1',ai)).toBeNull(); s=step(s,ai); const first=s.actionLog.at(-1)?.cardDrawSequence; s=choose(draw(s,'earthquake')); expect(s.actionLog.at(-1)?.cardDrawSequence).not.toBe(first);
  });
});
