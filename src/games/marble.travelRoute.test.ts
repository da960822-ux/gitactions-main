import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { worldIslandsBoardFor, completedPropertyLines, worldOwnershipVictory } from './marbleBoardProfiles';

const oldCities = ['광주','산토도밍고','기자','리우','싱가포르','베를린','파리','도쿄','이스탄불','아그라','아테네','시드니','뉴욕','런던','바르셀로나','베이징','두바이','서울'];
const newCities = ['광주','인천','기자','리우','싱가포르','뉴욕','베를린','파리','산토도밍고','도쿄','이스탄불','시드니','런던','바르셀로나','베이징','두바이','뉴어크','서울'];
const owned = { owner: 'p1', houses: 3, buildings: ['villa','building','hotel'], landmark: true };
const viewOf = (engine:any,s:any) => { const v=engine.getPlayerView(s,'p1'); return {tiles:v.board?.tiles??v.publicBoard,metadata:(v.board??v.publicState).profileMetadata}; };
const travel = (engine:any,s:any,destination:number) => engine.applyAction({...s,phase:'train-decision',pendingTrainFare:0,trainFare:0},s.active,{type:'choose-train',payload:{destination}});

describe('revision3 travel route',()=>{
 it('orders travel milestones around the unchanged32-slot shape and preserves every economic row and color group',()=>{
  const board=worldIslandsBoardFor(3),previous=worldIslandsBoardFor(2);
  expect(board).toHaveLength(32);
  expect(board.filter(t=>t.kind==='property').map(t=>t.name.ko)).toEqual(newCities);
  expect([1,3,10,15,29,31,0,1].map(i=>board[i].name.ko)).toEqual(['광주','인천','뉴욕','산토도밍고','뉴어크','서울','출발','광주']);
  board.forEach((tile,index)=>{const {name,...row}=tile;const {name:oldName,...oldRow}=previous[index];expect(row).toEqual(oldRow);if(tile.kind!=='property')expect(name).toEqual(oldName);});
  expect(board.filter(t=>t.kind==='tourism')).toHaveLength(7);
  expect([0,8,16,24].map(i=>board[i].kind)).toEqual(['start','island','festival-site','train']);
  expect(new Set(newCities).size).toBe(18);
  expect(oldCities.filter(name=>!newCities.includes(name))).toEqual(['아그라','아테네']);
 });
 it('keeps all eight complete color groups and all lines/tourism victories attainable',()=>{
  const board=worldIslandsBoardFor(3),groups=[...new Set(board.filter(t=>t.group).map(t=>t.group!))];
  expect(groups).toHaveLength(8);
  expect(groups.map(group=>board.filter(t=>t.group===group).length)).toEqual([2,3,2,2,2,3,2,2]);
  const triple=Object.fromEntries(board.flatMap((t,i)=>t.group&&[groups[0],groups[2],groups[6]].includes(t.group)?[[i,owned]]:[]));
  expect(worldOwnershipVictory(board,triple,'p1')).toBe('triple-monopoly');
  for(let side=0;side<4;side++){const properties=Object.fromEntries(board.flatMap((t,i)=>Math.floor(i/8)===side&&(t.kind==='property'||t.kind==='tourism')?[[i,owned]]:[]));expect(completedPropertyLines(board,properties,'p1')).toEqual([side]);expect(worldOwnershipVictory(board,properties,'p1')).toBe('line-monopoly');}
  const islands=Object.fromEntries(board.flatMap((t,i)=>t.kind==='tourism'?[[i,owned]]:[]));expect(worldOwnershipVictory(board,islands,'p1')).toBe('tourism-monopoly');
 });
 for(const [label,engine] of [['2p',marbleEngine],['4p',fourMarbleEngine]] as const){
  it(`${label} serializes revision3 and resolves Santo Domingo cards using the new destination`,()=>{
   const s:any=JSON.parse(JSON.stringify({...engine.createInitialState(17),boardRevision:3}));
   expect(s.boardRevision).toBe(3);expect(s.cityRouteVersion).toBe(5);
   const view=viewOf(engine,s);expect(view.metadata).toMatchObject({boardRevision:3,tourismCount:7,festivalSites:[16],travelMilestones:[1,3,10,15,29,31,0,1]});
   expect(view.tiles.filter((t:any)=>t.kind==='property').map((t:any)=>t.name.ko)).toEqual(newCities);
   s.eventDeck=['visit-santo-domingo'];const next=travel(engine,s,12);expect(next.positions.p1).toBe(15);expect(next.phase).toBe('decision');
   next.properties[15]=structuredClone(owned);expect(viewOf(engine,JSON.parse(JSON.stringify(next))).tiles[15].name.ko).toBe('산토도밍고');
  });
  it(`${label} pins missing/revision1 and revision2 saved names, properties and card destinations`,()=>{
   for(const revision of [undefined,1,2]){
    const s:any=engine.createInitialState(17);s.boardRevision=revision;s.properties={3:structuredClone(owned),17:{...structuredClone(owned),owner:'p2'}};
    const loaded=JSON.parse(JSON.stringify(s)),view=viewOf(engine,loaded);
    expect(view.tiles.filter((t:any)=>t.kind==='property').map((t:any)=>t.name.ko)).toEqual(oldCities);
    expect(view.tiles[16].kind).toBe(revision===2?'festival-site':'tourism');expect(view.metadata.boardRevision).toBe(revision??1);
    expect(loaded.properties).toEqual(s.properties);loaded.eventDeck=['visit-santo-domingo'];const next=travel(engine,loaded,12);
    expect(next.positions.p1).toBe(3);expect(next.properties).toEqual(s.properties);expect(viewOf(engine,next).tiles[17].name.ko).toBe('아그라');
   }
  });
  it(`${label} crosses Seoul→START→Gwangju in forward movement with one salary`,()=>{
   let s:any=engine.createInitialState(17);s.positions.p1=31;const cash=s.money.p1;
   s=travel(engine,s,0);expect(s.positions.p1).toBe(0);expect(s.money.p1).toBe(cash+450);
   s=travel(engine,s,1);expect(s.positions.p1).toBe(1);expect(s.money.p1).toBe(cash+450);expect(viewOf(engine,s).tiles[1].name.ko).toBe('광주');
  });
 }
});
