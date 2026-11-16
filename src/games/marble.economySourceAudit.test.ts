import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { worldIslandsBoard } from './marbleWorldIslands';
import { classicSourceCities } from './marbleClassicEconomyData';
const buildings=['villa','building','hotel'] as const;
const cases=worldIslandsBoard.flatMap((tile,index)=>tile.kind==='property'?Array.from({length:9},(_,stage)=>({tile,index,stage})):[]);
for(const [name,engine] of [['2p',marbleEngine],['4p',fourMarbleEngine]] as const)describe(`${name} source nominal cost/toll/settlement matrix`,()=>{
 for(const {tile,index,stage} of cases)it(`${tile.name.ko} ${stage===8?'landmark':`mask${stage}`} source price, all rent effects and salvage`,()=>{
  const row=classicSourceCities.find(row=>row[1]===tile.cityEconomy!.sourceCostRow)!,rawCosts=row[3],rawTolls=row[4],mask=stage===8?7:stage;
  const selected=buildings.filter((_,bit)=>(mask&(1<<bit))!==0),landmark=stage===8;
  const nominalRaw=rawCosts[0]+selected.reduce((sum,type)=>sum+rawCosts[buildings.indexOf(type)+1],0)+(landmark?rawCosts[4]:0),cost=nominalRaw*5/10000*3;
  const rawToll=landmark?rawTolls[4]:mask===0?rawTolls[0]:mask===1?rawTolls[1]:mask===3?rawTolls[2]:mask===7?rawTolls[3]:rawTolls[0]+(mask&1?rawTolls[1]-rawTolls[0]:0)+(mask&2?rawTolls[2]-rawTolls[1]:0)+(mask&4?rawTolls[3]-rawTolls[2]:0);
  const base=rawToll*5/10000*3,prop={owner:'p2',houses:landmark?3:mask===7?2:mask?1:0,buildings:selected,landmark};
  const fresh=()=>{const s:any=engine.createInitialState(1);s.rentRulesVersion=1;s.constructionPriceRulesVersion=1;s.boardRevision=1;s.money=Object.fromEntries(Object.keys(s.money).map(p=>[p,1e7]));return s;};
  const apply=(s:any,type:string,payload?:Record<string,unknown>):any=>{expect(engine.validateAction(s,s.active,{type,payload})).toBeNull();return engine.applyAction(s,s.active,{type,payload});};
  let purchased=fresh();purchased.phase='decision';purchased.positions.p1=index;purchased.pendingTile=index;purchased.buildSite=index;purchased.completedLaps.p1=1;purchased=apply(purchased,'buy',{buildings:selected});
  if(landmark){purchased.landmarkOptions=[index];purchased=apply(purchased,'build',{tile:index,landmark:true});}
  expect(1e7-purchased.money.p1).toBe(cost);expect(purchased.properties[index]).toMatchObject({...prop,owner:'p1'});
  const view:any=engine.getPlayerView(purchased,'p1');expect(name==='2p'?view.board.assets.p1:view.players.find((p:any)=>p.id==='p1').score).toBe(1e7);
  for(const effect of ['plain','color','festival','blackout','combined','pass'] as const){
   let s=fresh();s.phase='train-decision';s.positions.p1=index;s.pendingTrainFare=0;s.trainFare=0;s.properties[index]={...prop};
   const color=['color','combined','pass'].includes(effect),festival=['festival','combined','pass'].includes(effect),blackout=['blackout','combined','pass'].includes(effect);
   if(color)worldIslandsBoard.forEach((other,i)=>{if(other.kind==='property'&&other.group===tile.group&&i!==index)s.properties[i]={owner:'p2',houses:0,buildings:[],landmark:false};});
   if(name==='2p')s.rentModifiers[index]={...(festival?{festival:{source:'city-festival',owner:'p2',playerId:'p2'}}:{}),...(blackout?{blackout:{source:'blackout',owner:'p2',playerId:'p1'}}:{})};else s.modifiers[index]={...(festival?{festival:'p2'}:{}),...(blackout?{blackout:'p1'}:{})};
   if(effect==='pass')s.rentPasses.p1=1;
   let expected=base*(color?2:1)*(festival?2:1);if(blackout)expected=Math.max(1,Math.floor(expected/2));
   s=apply(s,'choose-train',{destination:index});
   if(effect==='pass'){expect(s.pendingRent.amount).toBe(expected);s=apply(s,'use-rent-pass');expected=0;}
   expect(s.money.p1).toBe(1e7-expected);expect(s.money.p2).toBe(1e7+expected);const modifiers=(name==='2p'?s.rentModifiers:s.modifiers)[index];expect(modifiers?.festival).toBeUndefined();expect(modifiers?.blackout).toBeUndefined();
  }
  let sale=fresh();sale.properties[index]={...prop,owner:'p1'};sale.money.p1=0;sale.phase='debt';sale.pendingPayment={amount:1,creditor:'bank',resumeActive:'p1',resumePhase:'main',reason:{ko:'검증',es:'Prueba'},type:'tax'};
  sale=apply(sale,'sell-property',{tile:index});const saleRaw=rawCosts[0]+selected.reduce((sum,type)=>sum+rawCosts[buildings.indexOf(type)+1],0),refund=Math.floor(saleRaw*5/2)/10000*3;
  expect(sale.money.p1).toBe(refund-1);expect(sale.properties[index]).toBeUndefined();expect(sale.actionLog.find((event:any)=>event.type==='sell').amount).toBe(refund);
 });
 it('all8 tourist islands retain150/120/75 and ignore city multiplier modifiers',()=>{
  for(const [index,tile] of worldIslandsBoard.entries())if(tile.kind==='tourism'){
   let s:any=engine.createInitialState(1);s.rentRulesVersion=1;s.constructionPriceRulesVersion=1;s.boardRevision=1;s.phase='decision';s.positions.p1=index;s.pendingTile=index;s=engine.applyAction(s,'p1',{type:'buy'});expect(s.money.p1).toBe(2850);
   s.properties[index].owner='p2';s.phase='train-decision';s.pendingTrainFare=0;s.trainFare=0;
   if(name==='2p')s.rentModifiers[index]={festival:{source:'city-festival',playerId:'p2',owner:'p2'},blackout:{source:'blackout',playerId:'p1',owner:'p2'}};else s.modifiers[index]={festival:'p2',blackout:'p1'};
   s=engine.applyAction(s,'p1',{type:'choose-train',payload:{destination:index}});expect(s.money.p1).toBe(2730);expect(s.money.p2).toBe(3120);
   s.phase='event-decision';s.pendingEvent=name==='2p'?{id:'blackout',playerId:'p1'}:'blackout';expect(engine.validateAction(s,'p1',{type:'choose-event-city',payload:{tile:index}})).toBeTruthy();
   s.phase='debt';s.pendingEvent=null;s.properties[index].owner='p1';s.money.p1=0;s.pendingPayment={amount:1,creditor:'bank',resumeActive:'p1',resumePhase:'main',reason:{ko:'검증',es:'Prueba'},type:'tax'};s=engine.applyAction(s,'p1',{type:'sell-property',payload:{tile:index}});expect(s.money.p1).toBe(74);
  }
 });
});
