import {describe,it,expect} from 'vitest';
import {marbleEngine} from '../games/marble';
import {fourMarbleEngine} from '../games/fourMarble';
import {marbleTileEffect} from './MarbleEventEffects';
import {marbleFlight} from './MarbleFlight';
import {isFreshMarbleCosmetic,marblePresentationFrames} from './marble-motion';

for(const [label,engine,team] of [['2p',marbleEngine,false],['4p',fourMarbleEngine,true]] as const)describe(`${label} confirmed engine effects`,()=>{
 const fresh=()=>{const s:any=engine.createInitialState(19);s.phase='main';s.money.p1=10000;s.properties={1:{owner:'p1',houses:0,buildings:[],landmark:false},3:{owner:'p2',houses:0,buildings:[],landmark:false}};s.positions.p1=1;s.buildSite=1;s.completedLaps.p1=2;return s;};
 const act=(s:any,type:string,payload:any)=>{const r:any=engine.applyAction(s,'p1',{type,payload});return r.state??r;};
 const tiles=(s:any)=>{const v:any=engine.getPlayerView(s,'p1');return team?v.publicBoard:v.board.tiles;};
 it('builds ordinary then landmark and maps each actual receipt to the correct tile only',()=>{
  let s=fresh();s=act(s,'build',{tile:1,buildings:['villa','building','hotel']});let receipt=s.actionLog.findLast((e:any)=>e.type==='build');expect(marbleTileEffect(receipt,1)).toBe('build');expect(marbleTileEffect(receipt,3)).toBeNull();s.landmarkOptions=[1];s=act(s,'build',{tile:1,landmark:true});receipt=s.actionLog.findLast((e:any)=>e.type==='build');expect(marbleTileEffect(receipt,1)).toBe('landmark');expect(marbleTileEffect({...receipt,skipCosmetics:true},1)).toBeNull();
 });
 it('activates festival and blackout only after target confirmation, not pending or shield/no-effect',()=>{
  for(const id of ['city-festival','blackout']){const s=fresh();s.phase='event-decision';s.pendingEvent=team?id:{id,playerId:'p1'};const target=id==='blackout'?3:1;const next=act(s,'choose-event-city',{tile:target});const receipt=next.actionLog.at(-1);expect(marbleTileEffect(receipt,target)).toBe(id==='blackout'?'blackout':'festival');for(const cardOutcome of ['pending-choice','no-effect'])expect(marbleTileEffect({...receipt,cardOutcome},target)).toBeNull();expect(marbleTileEffect({...receipt,blockedByShield:true},target)).toBeNull();}
 });
 it('restores train flights to special tiles, preserves destination language, and does not mistake dice movement',()=>{
  for(const destination of [0,8,12,16,24,30]){const s=fresh();s.phase='train-decision';s.positions.p1=24;s.pendingTrainFare=0;s.trainFare=0;s.eventDeck=['lottery'];const next=act(s,'choose-train',{destination});const receipt=next.actionLog.find((e:any)=>e.type==='move'&&e.source==='train');expect(receipt).toBeDefined();expect(marbleFlight(receipt,tiles(next),'ko')).toMatchObject({airline:'asiana',to:destination,destination:tiles(next)[destination].name.ko});expect(marbleFlight({...receipt,actor:'p2'},tiles(next),'es')).toMatchObject({airline:'jetblue',destination:tiles(next)[destination].name.es});expect(marbleFlight({...receipt,source:'dice'},tiles(next),'ko')).toBeNull();expect(marbleFlight({...receipt,skipCosmetics:true},tiles(next),'ko')).toBeNull();const frames=marblePresentationFrames(next.actionLog,s.positions,next.positions,32);expect(frames.some(f=>f.event===receipt)).toBe(true);}
 });
});

it('does not replay initial/repeated/reconnected snapshots and accepts a new confirmed event only once',()=>{
 const event={sequence:12,type:'build',tile:1};let previous=event.sequence;
 expect(isFreshMarbleCosmetic(event,previous)).toBe(false);
 const next={...event,sequence:13};expect(isFreshMarbleCosmetic(next,previous)).toBe(true);previous=13;
 expect(isFreshMarbleCosmetic({...next},previous)).toBe(false);
 expect(isFreshMarbleCosmetic({...next,sequence:20,skipCosmetics:true},previous)).toBe(false);
 expect(isFreshMarbleCosmetic({...next,sequence:1},previous)).toBe(false);
 expect(isFreshMarbleCosmetic(null,previous)).toBe(false);
});
