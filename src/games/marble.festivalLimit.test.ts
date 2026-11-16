import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
for (const [name, engine, four] of [['2p',marbleEngine,false],['4p',fourMarbleEngine,true]] as const) describe(`${name} one festival per player`,()=>{
 const field=four?'modifiers':'rentModifiers';
 const effect=(p:string)=>four?p:{source:'city-festival',owner:p,playerId:p};
 const fresh=()=>{const s:any=engine.createInitialState(1);s.properties={1:{owner:'p1',houses:0,buildings:[]},3:{owner:'p1',houses:3,buildings:['villa','building','hotel'],landmark:true},5:{owner:'p2',houses:0,buildings:[]},7:{owner:four?'p3':'p2',houses:0,buildings:[]}};s[field]={1:{festival:effect('p1'),blackout:four?'p2':{source:'blackout',owner:'p1',playerId:'p2'}},5:{festival:effect('p2')},7:{festival:effect(four?'p3':'p2')}};return s;};
 const choose=(s:any,tile:number,site=false)=>engine.applyAction({...s,phase:'event-decision',pendingEvent:four?'city-festival':{id:'city-festival',playerId:'p1'},pendingEventSource:site?'festival-site':undefined},'p1',{type:'choose-event-city',payload:{tile}}) as any;
 for(const site of [false,true]) it(`replaces only actor festival, preserves blackout/others and renews without stacking (${site?'free site':'card'})`,()=>{
  const s=fresh(),before=structuredClone(s);expect(s.festivalRulesVersion).toBe(2);let n=choose(JSON.parse(JSON.stringify(s)),3,site);
  expect(n[field][1].festival).toBeUndefined();expect(n[field][1].blackout).toEqual(s[field][1].blackout);expect(n[field][5]).toEqual(s[field][5]);expect(n[field][7]).toEqual(s[field][7]);expect(n[field][3].festival).toEqual(effect('p1'));expect(s).toEqual(before);
  n=choose(n,3,site);expect(Object.values(n[field]).filter((x:any)=>(four?x.festival:x.festival?.playerId)==='p1')).toHaveLength(1);
  const view:any=engine.getPlayerView(n,'p1');expect((four?view.publicState:view.board).festivalRulesVersion).toBe(2);
  expect(n.actionLog.at(-1).text.ko).toContain('플레이어당 축제 1개');
 });
 for(const version of [undefined,1]) it(`preserves serialized legacy multi-city festivals (${version})`,()=>{const s=fresh();s.festivalRulesVersion=version;const n=choose(JSON.parse(JSON.stringify(s)),3,true);expect(n[field][1].festival).toEqual(effect('p1'));expect(n[field][3].festival).toEqual(effect('p1'));});
 it('still consumes once on enemy visit, not on owner or ally visit',()=>{
  let n=choose(fresh(),3);delete n[field][1].blackout;
  const travel=(p:string)=>{n=engine.applyAction({...n,active:p,phase:'train-decision',pendingTrainFare:0,trainFare:0,positions:{...n.positions,[p]:3}},p as any,{type:'choose-train',payload:{destination:3}}) as any;};
  travel('p1');if(four)travel('p3');expect(n[field][3].festival).toBeDefined();const initial=n.money.p2;travel('p2');const doubled=initial-n.money.p2;expect(doubled).toBeGreaterThan(0);expect(n[field][3]?.festival).toBeUndefined();travel('p2');expect(initial-n.money.p2).toBe(doubled*1.5);
 });
 it('takeover clears acquired effects without removing buyer festival',()=>{let s=fresh();s.properties[5].houses=0;s.phase='main';s.positions.p1=5;s.takeoverTile=5;s.money.p1=10000;const n:any=engine.applyAction(s,'p1',{type:'takeover',payload:{tile:5}});expect(n[field][5]).toBeUndefined();expect(n[field][1].festival).toEqual(effect('p1'));});
});
