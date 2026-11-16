import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { legacyInitial, marbleScenarioDice } from './marble.effectFixtures';
for(const [name,engine] of [['2p',marbleEngine],['4p',fourMarbleEngine]] as const)for(const modern of [false,true])describe(`${name} ${modern?'world32':'saved40'} landmark blackout`,()=>{
 const four=name==='4p',target=1;
 const act=(s:any,type:string,payload?:Record<string,unknown>):any=>engine.applyAction(s,s.active,{type,payload});
 const fresh=()=>{const s:any=modern?engine.createInitialState(7):legacyInitial(engine,7);s.positions.p1=modern?10:0;s.rng=marbleScenarioDice();s.eventDeck=['blackout'];s.properties={1:{owner:'p2',houses:3,...(modern?{buildings:['villa','building','hotel'],landmark:true}:{})},3:{owner:'p1',houses:0,...(modern?{buildings:[],landmark:false}:{})}};s.money=Object.fromEntries(Object.keys(s.money).map(p=>[p,10000]));return s;};
 const selected=()=>act(act(fresh(),'roll'),'choose-event-city',{tile:target});
 const visit=(s:any)=>act({...s,active:'p1',phase:'train-decision',positions:{...s.positions,p1:target},pendingTrainFare:0,trainFare:0},'choose-train',{destination:target});
 const flag=(s:any)=>(four?s.modifiers:s.rentModifiers)[target]?.blackout;
 const baseToll=modern?351:80;
 it('draw and public choices include opponent landmark; own, missing and ally targets remain invalid',()=>{
   const s=act(fresh(),'roll');expect(s.phase).toBe('event-decision');expect(engine.getPlayerView(s,'p1').actions.some((o:any)=>o.action.type==='choose-event-city'&&o.action.payload.tile===target)).toBe(true);expect(engine.validateAction(s,'p1',{type:'choose-event-city',payload:{tile:target}})).toBeNull();
   for(const tile of [3,31,99])expect(engine.validateAction(s,'p1',{type:'choose-event-city',payload:{tile}})).toBeTruthy();
   if(four){s.properties[target].owner='p3';expect(engine.validateAction(s,'p1',{type:'choose-event-city',payload:{tile:target}})).toBeTruthy();}
 });
 it('reconnect preserves one half-toll effect, charges floor once, then restores full toll',()=>{
   let s=JSON.parse(JSON.stringify(selected()));expect(flag(s)).toBeDefined();expect(engine.validateAction(s,'p1',{type:'choose-event-city',payload:{tile:target}})).toBeTruthy();
   const cash=s.money.p1,owner=s.money.p2;s=visit(s);expect(s.money.p1).toBe(cash-Math.floor(baseToll/2));expect(s.money.p2).toBe(owner+Math.floor(baseToll/2));expect(flag(s)).toBeUndefined();const before=s.money.p1;s=visit(s);expect(s.money.p1).toBe(before-baseToll);expect(s.takeoverTile).toBe(target);expect(engine.validateAction(s,'p1',{type:'takeover',payload:{tile:target}})).toBeTruthy();
 });
 for(const resolution of ['use-rent-pass','pay-rent'])it(`${resolution} sees already-halved quote and consumes effect at arrival even when waived`,()=>{
   let s=selected();s.rentPasses.p1=1;const cash=s.money.p1;s=visit(s);expect(s.phase).toBe('rent-decision');expect(s.pendingRent.amount).toBe(Math.floor(baseToll/2));expect(flag(s)).toBeUndefined();expect(s.money.p1).toBe(cash);
   s=act(JSON.parse(JSON.stringify(s)),resolution);expect(s.money.p1).toBe(cash-(resolution==='pay-rent'?Math.floor(baseToll/2):0));expect(flag(s)).toBeUndefined();
 });
 it('repeat applications replace rather than compound the same landmark reduction',()=>{
   let s=selected();s.phase='roll';s.positions.p1=modern?10:0;s.rng=marbleScenarioDice();s.doublesCount=0;s.eventDeck=['blackout'];s=act(act(s,'roll'),'choose-event-city',{tile:target});const cash=s.money.p1;s=visit(s);expect(s.money.p1).toBe(cash-Math.floor(baseToll/2));
 });
 it('no opponent city still produces explicit no-effect rather than a stuck choice',()=>{
   const s=fresh();delete s.properties[target];const n=act(s,'roll');expect(n.phase).toBe('main');expect(n.pendingEvent).toBeNull();expect(n.actionLog.at(-1).cardOutcome).toBe('no-effect');
 });
});
