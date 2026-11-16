import { legacyInitial } from './marble.effectFixtures';
import { describe, expect, it } from 'vitest';
import { seededRandom, type GameAction } from '../core/types';
import { marbleEngine, type MarbleEventId } from './marble';
import { fourMarbleEngine } from './fourMarble';
const ids: MarbleEventId[] = ['festival','lottery','rent-rebate','travel-cost','maintenance','visit-santo-domingo','advance-start','retreat','go-to-island','escape-pass','train-ticket','city-dividend','monopoly-warning','city-festival','blackout','rent-pass'];
function seedTwo() { for(let seed=0;seed<10000;seed++){const r=seededRandom(seed);if(Math.floor(r()*6)===0&&Math.floor(r()*6)===0)return seed;}throw Error('seed'); }
for(const constructionRulesVersion of [1,2] as const) for(const [name,engine] of [['2p',marbleEngine],['4p',fourMarbleEngine]] as const) describe(`${name} construction${constructionRulesVersion} canonical card cash accounting`,()=>{
  const apply=(before:any,action:GameAction)=>{
    const frozen=structuredClone(before), after:any=engine.applyAction(before,before.active,action);
    const events=after.actionLog.filter((event:any)=>event.sequence>(before.actionSequence??0));
    for(const player of Object.keys(before.money)) expect(events.reduce((sum:number,event:any)=>sum+(event.moneyDelta?.[player]??0),0),`${action.type}:${player}`).toBe(after.money[player]-before.money[player]);
    expect(before).toEqual(frozen); return after;
  };
  for(const id of ids) it(`${id}: repeated same-ID draws each settle exactly once`,()=>{
    let s:any=legacyInitial(engine, 1);s.constructionRulesVersion=constructionRulesVersion;s.money=Object.fromEntries(Object.keys(s.money).map(p=>[p,10000]));
    s.properties={4:{owner:'p2',houses:1,buildings:['villa'],landmark:false},5:{owner:'p2',houses:0,buildings:[],landmark:false},15:{owner:'p1',houses:1,buildings:['building'],landmark:false}};
    for(let repeat=0;repeat<2;repeat++){
      s={...s,active:'p1',phase:'roll',positions:{...s.positions,p1:0},rng:seedTwo(),eventDeck:[id],doublesCount:0,islandTurns:{...s.islandTurns,p1:0}};
      const beforeSequence=s.actionSequence;s=apply(s,{type:'roll'});
      expect(s.actionSequence).toBeGreaterThan(beforeSequence);
      if(s.phase==='event-decision'){
        const choice=engine.getPlayerView(s,'p1').actions.find((c:any)=>c.action.type==='choose-event-city')!;
        s=apply(s,choice.action);
      }
      if(s.phase==='train-decision')s=apply(s,{type:'skip-train'});
      if(s.phase==='rent-decision')s=apply(s,{type:'pay-rent'});
      expect(s.phase).not.toBe('debt');
    }
  });
  it('rent→card→free travel→build→turn has no duplicate debit or stale economic replay',()=>{
    let s:any=legacyInitial(engine, 1);s.constructionRulesVersion=constructionRulesVersion;
    s.properties={4:{owner:'p2',houses:1,buildings:['villa'],landmark:false},15:{owner:'p1',houses:0,buildings:[],landmark:false}};
    s={...s,phase:'train-decision',positions:{...s.positions,p1:14},pendingTrainFare:100,trainFare:100};
    s=apply(s,{type:'choose-train',payload:{destination:4}});
    s={...s,phase:'roll',positions:{...s.positions,p1:0},rng:seedTwo(),eventDeck:['train-ticket'],doublesCount:0};
    s=apply(s,{type:'roll'});s=apply(s,{type:'choose-train',payload:{destination:15}});
    s=apply(s,{type:'build',payload:constructionRulesVersion===2?{tile:15,buildings:['villa','building']}:{tile:15}});
    s=apply(s,{type:'endTurn'});
    expect(s.money.p1).toBeGreaterThanOrEqual(0);
  });
});
