import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { worldIslandsBoard } from './marbleWorldIslands';
import { classicSourceCities } from './marbleClassicEconomyData';
import { marbleScenarioDice } from './marble.effectFixtures';

const cityIndices=worldIslandsBoard.flatMap((tile,index)=>tile.kind==='property'?[index]:[]);
const safe=(index:number)=>!['event','island','train'].includes(worldIslandsBoard[index].kind);
const diceSeed=(distance:number)=>{for(let a=1;a<=6;a++){const b=distance-a;if(b>=1&&b<=6&&a!==b)return marbleScenarioDice(a,b);}throw Error('No non-double seed');};
// A real forward lap using legal non-double rolls; no teleport, salary injection or lap-counter edits.
function lapPath(from:number,remaining=32):number[]{
  for(let distance=3;distance<=11&&distance<=remaining;distance++){
    const to=(from+distance)%32;if(!safe(to))continue;
    if(distance===remaining)return[distance];
    if(remaining-distance<3)continue;
    const rest=lapPath(to,remaining-distance);if(rest.length)return[distance,...rest];
  }
  return[];
}
for(const [name,engine] of [['2p',marbleEngine],['4p',fourMarbleEngine]] as const)describe(`${name} all18 source-priced landmark totals`,()=>{
  for(const index of cityIndices)for(const mode of ['batch','separate'] as const)it(`${worldIslandsBoard[index].name.ko} ${mode}: charges each existing building and extra landmark exactly once`,()=>{
    const city=worldIslandsBoard[index],source=classicSourceCities.find(row=>row[1]===city.cityEconomy!.sourceCostRow)!;
    const [land,villa,building,hotel,landmark]=source[3].map(amount=>amount*5/10000*3),total=land+villa+building+hotel+landmark;
    let s:any=engine.createInitialState(31);s.boardRevision=1;s.rentRulesVersion=1;s.constructionPriceRulesVersion=1;s.phase='decision';s.positions.p1=index;s.pendingTile=index;s.buildSite=index;s.pawnLocked=Object.fromEntries(Object.keys(s.money).map(p=>[p,true]));
    const charges:number[]=[];
    const apply=(type:string,payload?:Record<string,unknown>)=>{const actor=s.active,action={type,payload};expect(engine.validateAction(s,actor,action)).toBeNull();const before=s.money.p1;s=engine.applyAction(s,actor,action);if(actor==='p1'&&['buy','build'].includes(type))charges.push(before-s.money.p1);};
    if(mode==='batch')apply('buy',{buildings:['villa','building']});else{apply('buy');apply('build',{tile:index,buildings:['villa']});apply('build',{tile:index,buildings:['building']});}
    expect(s.money.p1).toBe(3000-land-villa-building);expect(engine.validateAction(s,'p1',{type:'build',payload:{tile:index,buildings:['hotel']}})).toBeTruthy();
    const nextP1Turn=()=>{
      apply('endTurn');
      while(s.active!=='p1'){
        if(s.phase==='roll'){const distance=Array.from({length:9},(_,i)=>i+3).find(d=>safe((s.positions[s.active]+d)%32)&&(s.positions[s.active]+d)%32!==index)!;s.rng=diceSeed(distance);apply('roll');}
        else if(s.phase==='decision')apply('decline');else if(s.phase==='main')apply('endTurn');else throw Error(`Unexpected fixture phase ${s.phase}`);
      }
      expect(s.phase).toBe('roll');
    };
    const lap=()=>{const path=lapPath(index);expect(path.reduce((a,b)=>a+b,0)).toBe(32);for(const distance of path){nextP1Turn();s.rng=diceSeed(distance);apply('roll');if(s.phase==='decision')apply('decline');}expect(s.positions.p1).toBe(index);};
    lap();expect(s.completedLaps.p1).toBe(1);apply('build',{tile:index,buildings:['hotel']});expect(engine.validateAction(s,'p1',{type:'build',payload:{tile:index,buildings:['villa']}})).toBeTruthy();expect(engine.validateAction(s,'p1',{type:'build',payload:{tile:index,landmark:true}})).toBeTruthy();
    lap();expect(s.completedLaps.p1).toBe(2);apply('build',{tile:index,landmark:true});
    expect(charges).toEqual(mode==='batch'?[land+villa+building,hotel,landmark]:[land,villa,building,hotel,landmark]);expect(charges.reduce((a,b)=>a+b,0)).toBe(total);expect(s.money.p1).toBe(3000+900-total);expect(s.properties[index].landmark).toBe(true);expect(engine.validateAction(s,'p1',{type:'build',payload:{tile:index,landmark:true}})).toBeTruthy();
    const view:any=engine.getPlayerView(s,'p1');if(name==='2p')expect(view.board.assets.p1).toBe(3900);else expect(view.players.find((p:any)=>p.id==='p1').score).toBe(3900);
  });
});
