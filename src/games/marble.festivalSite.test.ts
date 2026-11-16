import { describe, expect, it } from 'vitest';
import { marbleEngine as engine } from './marble';
import { worldIslandsBoardFor, completedPropertyLines, worldOwnershipVictory } from './marbleBoardProfiles';
import { marbleScenarioDice } from './marble.effectFixtures';
const act=(s:any,type:string,payload?:Record<string,unknown>):any=>engine.applyAction(s,s.active,{type,payload});
const initial=()=>{const s:any=engine.createInitialState(19);s.positions.p1=14;s.rng=marbleScenarioDice();s.eventDeck=['lottery'];s.properties={1:{owner:'p1',houses:0,buildings:[],landmark:false},2:{owner:'p1',houses:0,buildings:[],landmark:false},3:{owner:'p2',houses:0,buildings:[],landmark:false}};return s;};
const freeTravel=(s:any,player:string,destination:number)=>act({...s,active:player,phase:'train-decision',positions:{...s.positions,[player]:destination},pendingTrainFare:0},'choose-train',{destination});
describe('festival corner revision2, preserving v50 owned Ibiza',()=>{
 it('defaults new games to revision4 with6 islands while missing/1 revision keeps8 islands and ownership',()=>{
  for(const seed of [1,33]){const s=engine.createInitialState(seed),v=engine.getPlayerView(s,'p1');expect(s.boardRevision).toBe(4);expect(v.board.boardRevision).toBe(4);expect(v.board.profileMetadata).toMatchObject({boardRevision:4,tourismCount:6,festivalSites:[16]});expect(v.board.tiles[16].kind).toBe('festival-site');}
  for(const revision of [undefined,1]){const s:any=initial();s.boardRevision=revision;s.rentRulesVersion=1;s.properties[16]={owner:'p1',houses:0,buildings:[],landmark:false};const loaded=JSON.parse(JSON.stringify(s));const v=engine.getPlayerView(loaded,'p1');expect(v.board.tiles[16]).toMatchObject({kind:'tourism',owner:'p1',price:150,rent:120});expect(v.board.profileMetadata.tourismCount).toBe(8);expect(loaded.properties[16]).toEqual(s.properties[16]);}
 });
 it('changes only index16, keepsallcityprices, and counts purchasables perrevision for victories',()=>{
  const old=worldIslandsBoardFor(1),next=worldIslandsBoardFor(2);old.forEach((tile,index)=>{if(index!==16)expect(next[index]).toEqual(tile);});
  const side=Object.fromEntries([17,18,19,21,22,23].map(i=>[i,{owner:'p1'}]));expect(completedPropertyLines(next,side,'p1')).toEqual([2]);expect(completedPropertyLines(old,side,'p1')).toEqual([]);
  const islands=Object.fromEntries([2,4,9,14,18,25,30].map(i=>[i,{owner:'p1'}]));expect(worldOwnershipVictory(next,islands,'p1')).toBe('tourism-monopoly');expect(worldOwnershipVictory(old,islands,'p1')).toBeNull();
 });
 it('arrival offers a free own-city choice without drawing a card or losing earned extra roll',()=>{
  const s=initial();s.properties[1]={owner:'p1',houses:3,buildings:['villa','building','hotel'],landmark:true};const n=act(s,'roll');expect(n.money).toEqual(s.money);expect(n.eventDeck).toEqual(s.eventDeck);expect(n.extraRoll).toBe(true);expect(n.pendingEvent).toEqual({id:'city-festival',playerId:'p1'});expect(n.pendingEventSource).toBe('festival-site');expect(engine.getPlayerView(n,'p1').board.pendingEventSource).toBe('festival-site');
  expect(n.actionLog.at(-1)).toMatchObject({type:'festival-site',cardOutcome:'pending-choice',amount:0});expect(n.actionLog.some((e:any)=>e.cardPhase==='draw')).toBe(false);expect(engine.validateAction(n,'p1',{type:'choose-event-city',payload:{tile:1}})).toBeNull();for(const tile of [2,3,31])expect(engine.validateAction(n,'p1',{type:'choose-event-city',payload:{tile}})).toBeTruthy();
 });
 it('selection resolves as a site, not golden key, survivesreconnect and rejects replay without mutation',()=>{
  const s=initial();s.lastEvent={id:'city-festival',title:{ko:'이전카드',es:'Anterior'},text:{ko:'이전문구',es:'Anterior'}};let n:any=act(s,'roll');n=act(JSON.parse(JSON.stringify(n)),'choose-event-city',{tile:1});expect(n.phase).toBe('main');expect(n.pendingEventSource).toBeNull();expect(n.extraRoll).toBe(true);expect(n.lastEvent).toEqual(s.lastEvent);expect(n.money).toEqual(s.money);expect(n.actionLog.at(-1)).toMatchObject({type:'festival-site',cardOutcome:'applied'});expect(n.actionLog.at(-1).cardId).toBeUndefined();const before=structuredClone(n);expect(()=>act(n,'choose-event-city',{tile:1})).toThrow();expect(n).toEqual(before);
 });
 it('no city (including island-only ownership) produces explicit no-effect and continues the turn',()=>{
  const s=initial();delete s.properties[1];delete s.properties[3];const n=act(s,'roll');expect(n.phase).toBe('main');expect(n.pendingEvent).toBeNull();expect(n.actionLog.at(-1)).toMatchObject({type:'festival-site',cardOutcome:'no-effect'});expect(n.money).toEqual(s.money);expect(n.eventDeck).toEqual(s.eventDeck);expect(act(n,'endTurn').phase).toBe('roll');
 });
 it('repeat hosting overwrites2x; ownervisit doesnotconsume; next opponentvisit consumes once',()=>{
  let s:any=act(act(initial(),'roll'),'choose-event-city',{tile:1});s=act(freeTravel(s,'p1',16),'choose-event-city',{tile:1});expect(s.rentModifiers[1].festival).toMatchObject({owner:'p1',playerId:'p1'});s=freeTravel(s,'p1',1);expect(s.rentModifiers[1].festival).toBeDefined();const cash=s.money.p2;s=freeTravel(s,'p2',1);expect(s.money.p2).toBe(cash-4);expect(s.rentModifiers[1]?.festival).toBeUndefined();s=freeTravel(s,'p2',1);expect(s.money.p2).toBe(cash-6);
 });
 it('travel-card cause continues through festivalchoice without a second draw or deck mutation',()=>{
  const s=initial();s.positions.p1=10;s.eventDeck=['train-ticket'];let n:any=act(s,'roll');const draw=n.actionLog.find((e:any)=>e.cardPhase==='draw'),deck=[...n.eventDeck];n=act(n,'choose-train',{destination:16});expect(n.phase).toBe('event-decision');expect(n.actionLog.at(-1)).toMatchObject({type:'festival-site',cardDrawSequence:draw.sequence,cardPhase:'resolution'});n=act(n,'choose-event-city',{tile:1});expect(n.actionLog.at(-1)).toMatchObject({type:'festival-site',cardDrawSequence:draw.sequence,cardPhase:'resolution',cardOutcome:'applied'});expect(n.actionLog.filter((e:any)=>e.cardPhase==='draw')).toHaveLength(1);expect(n.eventDeck).toEqual(deck);expect(n.pendingCardDrawSequence).toBeUndefined();
 });
 it('new6-island victory text matches actualboard and festivalcorner is never for sale',()=>{
  const s:any=engine.createInitialState(1);s.phase='decision';s.pendingTile=30;s.positions.p1=30;s.properties=Object.fromEntries([2,9,14,18,25].map(i=>[i,{owner:'p1',houses:0,buildings:[],landmark:false}]));const n=act(s,'buy');expect(n.result?.reason).toBe('tourism-monopoly');expect(n.actionLog.at(-1).text.ko).toContain('6개');s.pendingTile=16;s.positions.p1=16;expect(engine.validateAction(s,'p1',{type:'buy'})).toBeTruthy();
 });
});
