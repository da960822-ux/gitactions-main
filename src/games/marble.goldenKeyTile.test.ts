import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { worldIslandsBoardFor, completedPropertyLines, worldOwnershipVictory } from './marbleBoardProfiles';

const owned = { owner: 'p1', houses: 0, buildings: [], landmark: false };
const viewOf = (engine:any,s:any) => { const v=engine.getPlayerView(s,'p1'); return {tiles:v.board?.tiles??v.publicBoard,state:v.board??v.publicState}; };
const travel = (engine:any,s:any,destination:number) => engine.applyAction({...s,phase:'train-decision',pendingTrainFare:0,trainFare:0},s.active,{type:'choose-train',payload:{destination}});

describe('revision4 Bora Bora golden key replacement',()=>{
 it('changes exactly slot4, leaving cities, islands, Festival and route economics untouched',()=>{
  const current=worldIslandsBoardFor(4),old=worldIslandsBoardFor(3);
  expect(current).toHaveLength(32);
  expect(current[4]).toEqual({kind:'event',name:{ko:'황금열쇠',es:'Llave dorada'}});
  current.forEach((tile,i)=>{if(i!==4)expect(tile).toEqual(old[i]);});
  expect(current.filter(t=>t.kind==='property')).toHaveLength(18);
  expect(current.filter(t=>t.kind==='tourism')).toHaveLength(6);
  expect(current[16].kind).toBe('festival-site');
  const islands=Object.fromEntries([2,9,14,18,25,30].map(i=>[i,owned]));
  expect(worldOwnershipVictory(current,islands,'p1')).toBe('tourism-monopoly');
  expect(worldOwnershipVictory(old,islands,'p1')).toBeNull();
  expect(worldOwnershipVictory(old,{...islands,4:owned},'p1')).toBe('tourism-monopoly');
  const side=Object.fromEntries([1,2,3,5,6,7].map(i=>[i,owned]));
  expect(completedPropertyLines(current,side,'p1')).toEqual([0]);
  expect(completedPropertyLines(old,side,'p1')).toEqual([]);
  expect(completedPropertyLines(old,{...side,4:owned},'p1')).toEqual([0]);
 });
 for(const [mode,engine] of [['2p',marbleEngine],['4p',fourMarbleEngine]] as const){
  it(`${mode} defaults to revision4 and legally draws from its23-card deck at slot4`,()=>{
   const s:any=JSON.parse(JSON.stringify(engine.createInitialState(22)));
   expect(s).toMatchObject({boardRevision:4,eventVersion:4,loanRulesVersion:2,festivalRulesVersion:2,rentRulesVersion:2,constructionPriceRulesVersion:2});
   expect(new Set(s.eventDeck).size).toBe(23);
   expect(viewOf(engine,s).state.profileMetadata).toMatchObject({boardRevision:4,tourismCount:6,festivalSites:[16],travelMilestones:[1,3,10,15,29,31,0,1]});
   s.eventDeck=['lottery',...s.eventDeck.filter((id:string)=>id!=='lottery')];
   const n=travel(engine,s,4);
   expect(n.positions.p1).toBe(4);
   expect(n.actionLog.filter((e:any)=>e.cardPhase==='draw')).toHaveLength(1);
   expect(n.actionLog.find((e:any)=>e.cardPhase==='draw').cardId).toBe('lottery');
   expect(n.properties[4]).toBeUndefined();
   expect(engine.validateAction(n,'p1',{type:'buy'})).toBeTruthy();
  });
  it(`${mode} preserves every old revision through JSON reload, including owned Bora Bora`,()=>{
   for(const revision of [undefined,1,2,3]){
    const s:any=engine.createInitialState(22);s.boardRevision=revision;s.rentRulesVersion=1;s.constructionPriceRulesVersion=1;s.properties={4:structuredClone(owned)};s.positions.p1=4;
    const saved=JSON.parse(JSON.stringify(s)),v=viewOf(engine,saved);
    expect(v.tiles[4]).toMatchObject({kind:'tourism',name:{ko:'보라보라'},price:150,rent:120});
    expect(v.tiles.filter((t:any)=>t.kind==='tourism')).toHaveLength(revision===2||revision===3?7:8);
    expect(saved.positions).toEqual(s.positions);expect(saved.properties).toEqual(s.properties);
    const n=travel(engine,saved,4);expect(n.properties).toEqual(s.properties);expect(n.eventDeck).toEqual(s.eventDeck);expect(n.money).toEqual(s.money);
   }
  });
  it(`${mode} wins on the sixth current island but requires Bora Bora on revision3`,()=>{
   for(const revision of [3,4]){
    let s:any=engine.createInitialState(22);s.boardRevision=revision;s.properties=Object.fromEntries([2,9,14,18,25].map(i=>[i,structuredClone(owned)]));
    s=travel(engine,s,30);s=engine.applyAction(s,'p1',{type:'buy'});
    if(revision===4)expect(s.result?.winner).toBe(mode==='2p'?'p1':'A');
    else {expect(s.result).toBeNull();s=travel(engine,s,4);s=engine.applyAction(s,'p1',{type:'buy'});expect(s.result?.winner).toBe(mode==='2p'?'p1':'A');}
   }
  });
 }
});
