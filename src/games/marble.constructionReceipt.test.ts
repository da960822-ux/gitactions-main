import { expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { legacyInitial } from './marble.effectFixtures';
for(const [name,engine] of [['2p',marbleEngine],['4p',fourMarbleEngine]] as const)for(const version of [1,2])it(`${name} v${version} construction receipt snapshots ordinary versus landmark for delayed presentation`,()=>{
  let s:any=version===1?legacyInitial(engine,1):engine.createInitialState(1);s.phase='decision';s.positions.p1=1;s.pendingTile=1;s.buildSite=1;s.money.p1=10000;
  s=engine.applyAction(s,'p1',{type:'buy',payload:version===1?{targetLevel:1}:{buildings:['villa']}});const bought=s.actionLog.find((e:any)=>e.type==='buy');expect(bought).toMatchObject({houses:1,landmark:false,buildings:version===1?[]:['villa']});
  s.properties[1]=version===1?{owner:'p1',houses:2}:{owner:'p1',houses:2,buildings:['villa','building','hotel'],landmark:false};s.landmarkOptions=[1];
  s=engine.applyAction(s,'p1',{type:'build',payload:version===1?{tile:1,targetLevel:3}:{tile:1,landmark:true}});const built=s.actionLog.filter((e:any)=>e.type==='build').at(-1);expect(built).toMatchObject({houses:3,landmark:true,buildings:version===1?[]:['villa','building','hotel']});
  expect(bought.landmark).toBe(false);if(version===2){s.properties[1].buildings.pop();expect(built.buildings).toEqual(['villa','building','hotel']);}
});
