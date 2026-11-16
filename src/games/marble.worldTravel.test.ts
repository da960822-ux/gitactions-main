import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { marbleDrawFixture, marbleEffectFixture } from './marble.effectFixtures';

for (const [name, engine] of [['2p',marbleEngine],['4p',fourMarbleEngine]] as const) describe(`${name} all-tile custom world travel`,()=>{
  const act=(s:any,type:string,payload?:Record<string,unknown>):any=>engine.applyAction(s,s.active,{type,payload});
  const fresh=()=>{const s=marbleEffectFixture(engine);s.phase='train-decision';s.positions.p1=30;s.pendingTrainFare=100;s.pendingTrainSource='station';s.trainFare=100;s.trainReady.p1=true;s.eventDeck=['lottery'];return s;};
  it('offers all 40 indexes, not only cities, and validates bounds strictly',()=>{
    const s=fresh(), actions=engine.getPlayerView(s,'p1').actions.filter((x:any)=>x.action.type==='choose-train');expect(actions.map((x:any)=>x.action.payload.destination)).toEqual(Array.from({length:40},(_,i)=>i));
    for(const option of actions)expect(engine.validateAction(s,'p1',option.action)).toBeNull();for(const destination of [-1,40,1.5,'0',null,undefined])expect(engine.validateAction(s,'p1',{type:'choose-train',payload:{destination}})).toBeTruthy();
    s.money.p1=99;expect(engine.validateAction(s,'p1',{type:'choose-train',payload:{destination:0}})).toBeTruthy();
  });
  for(const [destination,delta,kind] of [[0,200,'start'],[2,400,'event'],[6,100,'tax'],[10,200,'island'],[20,323,'fund'],[23,200,'rest'],[30,-100,'self'],[37,-250,'fund-deposit']] as const)it(`${kind} target applies its ordinary arrival effect once`,()=>{
    const s=fresh();s.fundPool=123;const n=act(s,'choose-train',{destination});expect(n.positions.p1).toBe(destination);expect(n.money.p1).toBe(s.money.p1+delta);
    expect(n.actionLog.filter((e:any)=>e.type==='move')).toHaveLength(1);expect(n.actionLog.filter((e:any)=>e.type==='arrival')).toHaveLength(1);
    if(kind==='event'){expect(n.eventDeck).toEqual(['lottery']);expect(n.actionLog.filter((e:any)=>e.cardPhase==='draw')).toHaveLength(1);}
    if(kind==='island'){expect(n.islandTurns.p1).toBe(3);expect(n.extraRoll).toBe(false);}
    if(kind==='fund')expect(n.fundPool).toBe(0);if(kind==='fund-deposit')expect(n.fundPool).toBe(273);
    if(kind==='start')expect(n.buildSite).toBe('start');
    if(kind==='self'){expect(n.lastMove.steps).toBe(0);expect(n.trainReady.p1).toBe(true);expect(n.phase).toBe('main');expect(n.actionLog.some((e:any)=>e.moneyDelta?.p1===300)).toBe(false);}
  });
  it('free card travel to another golden key draws a new unique card cause exactly once',()=>{
    let s=act(marbleDrawFixture(engine,'train-ticket'),'roll');const first=s.actionLog.find((e:any)=>e.cardPhase==='draw');s.eventDeck=['lottery'];const before=s.money.p1;
    s=act(s,'choose-train',{destination:7});const draws=s.actionLog.filter((e:any)=>e.cardPhase==='draw');expect(draws).toHaveLength(2);expect(draws[1].cardDrawSequence).not.toBe(first.cardDrawSequence);expect(s.money.p1).toBe(before+200);expect(s.eventDeck).toEqual(['lottery']);expect(s.actionLog.at(-1).cardDrawSequence).toBe(draws[1].sequence);
  });
  it('landing on another travel tile schedules next turn, not an immediate recursive decision',()=>{
    const s=act(fresh(),'choose-train',{destination:14});expect(s.phase).toBe('main');expect(s.trainReady.p1).toBe(true);expect(engine.validateAction(s,'p1',{type:'choose-train',payload:{destination:14}})).toBeTruthy();
  });
  it('free travel to island preserves held escape pass for the later island turn',()=>{
    let s=act(marbleDrawFixture(engine,'train-ticket'),'roll');s.escapePasses.p1=1;const cash=s.money.p1;s=act(s,'choose-train',{destination:10});expect(s.money.p1).toBe(cash);expect(s.islandTurns.p1).toBe(3);expect(s.escapePasses.p1).toBe(1);
    s.phase='island';s=act(s,'use-escape-pass');expect(s.islandTurns.p1).toBe(0);expect(s.escapePasses.p1).toBe(0);expect(s.phase).toBe('roll');
  });
});
