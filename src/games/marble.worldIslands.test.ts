import { describe, expect, it } from 'vitest';
import { marbleEngine, createLegacyMarbleState, createClassicKoreaResearchState } from './marble';
import { worldIslandsBoard, completedPropertyLines, worldOwnershipVictory } from './marbleBoardProfiles';
import { marbleScenarioDice } from './marble.effectFixtures';
const initial=()=>({...marbleEngine.createInitialState(1),boardRevision:1 as const,rentRulesVersion:1 as const,constructionPriceRulesVersion:1 as const,pawnLocked:{p1:true,p2:true}});
const act=(s:any,type:string,payload?:Record<string,unknown>)=>marbleEngine.applyAction(s,'p1',{type,payload});
const decision=(index:number)=>({...initial(),phase:'decision' as const,positions:{p1:index,p2:0},pendingTile:index,buildSite:worldIslandsBoard[index].kind==='property'?index:null});
describe('saved v50 world32 revision1 profile',()=>{
  it('uses exact city economy with18 cities,8 fixed islands,4 corners and no extra travel stations',()=>{
    const s=initial(),v=marbleEngine.getPlayerView(s,'p1');expect(s).toMatchObject({boardProfile:'world-islands-32-v1',cityRouteVersion:5,constructionRulesVersion:2,money:{p1:3000,p2:3000}});expect(v.board.boardSize).toBe(32);expect(v.board.passStartSalary).toBe(450);
    expect(worldIslandsBoard.filter(t=>t.kind==='property')).toHaveLength(18);expect(worldIslandsBoard.filter(t=>t.kind==='tourism')).toHaveLength(8);expect(worldIslandsBoard.flatMap((t,i)=>t.kind==='train'?[i]:[])).toEqual([24]);expect([0,8,16,24].map(i=>worldIslandsBoard[i].kind)).toEqual(['start','island','tourism','train']);expect(worldIslandsBoard[31].cityEconomy).toMatchObject({landCost:300,buildCosts:{villa:120,building:360,hotel:600},landmarkCost:600,landmarkToll:2820});
    expect(marbleEngine.getPlayerView(createLegacyMarbleState(),'p1').board.boardSize).toBe(40);expect(marbleEngine.getPlayerView(createClassicKoreaResearchState(),'p1').actions).toEqual([]);
  });
  it('purchases selected first-lap source buildings atomically and unlocks hotel only after a lap',()=>{
    const s=decision(1);expect(marbleEngine.validateAction(s,'p1',{type:'buy',payload:{buildings:['hotel']}})).toBeTruthy();let n=act(s,'buy',{buildings:['villa','building']});expect(n.money.p1).toBe(2910);expect(n.properties[1].buildings).toEqual(['villa','building']);
    n={...n,phase:'roll',positions:{p1:30,p2:0},rng:marbleScenarioDice(1,2)};n=act(n,'roll');expect(n.completedLaps?.p1).toBe(1);expect(n.money.p1).toBe(3360);expect(marbleEngine.validateAction(n,'p1',{type:'build',payload:{tile:1,buildings:['hotel']}})).toBeNull();
  });
  it('islands charge fixed toll with no building, acquisition, growth or color bonus',()=>{
    const s=decision(2);expect(marbleEngine.validateAction(s,'p1',{type:'buy',payload:{buildings:['villa']}})).toBeTruthy();let n=act(s,'buy');expect(n.money.p1).toBe(2850);expect(n.properties[2]).toMatchObject({owner:'p1',houses:0,buildings:[],landmark:false});expect(marbleEngine.validateAction(n,'p1',{type:'build',payload:{tile:2,buildings:['villa']}})).toBeTruthy();
    n={...n,phase:'train-decision',positions:{p1:1,p2:0},properties:{2:{owner:'p2',houses:0,buildings:[],landmark:false}},pendingTrainFare:0,rentModifiers:{2:{festival:{source:'city-festival',playerId:'p2',owner:'p2'},blackout:{source:'blackout',playerId:'p1',owner:'p2'}}}};const before=n.money.p1;n=act(n,'choose-train',{destination:2});expect(n.money.p1).toBe(before-120);expect(n.takeoverTile).toBeNull();expect(marbleEngine.getPlayerView(n,'p1').board.takeoverOffer).toBeNull();expect(marbleEngine.validateAction(n,'p1',{type:'takeover',payload:{tile:2}})).toBeTruthy();
  });
  it('island debt sale returns75, removes ownership and settles debt normally',()=>{
    let s:any=act(decision(2),'buy');s.money.p1=0;s.phase='debt';s.pendingPayment={amount:50,creditor:'bank',reason:{ko:'테스트',es:'Prueba'},resumePhase:'main',resumeActive:'p1',type:'tax'};s=act(s,'sell-property',{tile:2});expect(s.money.p1).toBe(25);expect(s.properties[2]).toBeUndefined();expect(s.pendingPayment).toBeNull();expect(s.phase).toBe('main');
  });
  it('line victory cannot omit the islands and triggers exactly once on final ownership acquisition',()=>{
    let s:any=decision(4);s.properties=Object.fromEntries([1,2,3,5,6,7].map(i=>[i,{owner:'p1',houses:0,buildings:[],landmark:false}]));expect(completedPropertyLines(worldIslandsBoard,s.properties,'p1')).toEqual([]);s=act(s,'buy');expect(s.result?.winner).toBe('p1');expect(s.result?.reason).toContain('line-monopoly');expect(s.phase).toBe('finished');expect(s.actionLog.filter((e:any)=>e.type==='win')).toHaveLength(1);expect(marbleEngine.getPlayerView(s,'p1').actions).toEqual([]);
  });
  it('all8 tourism islands trigger the adapted all-tourism victory',()=>{
    const s:any=decision(30);s.properties=Object.fromEntries([2,4,9,14,16,18,25].map(i=>[i,{owner:'p1',houses:0,buildings:[],landmark:false}]));expect(act(s,'buy').result?.reason).toBe('tourism-monopoly');
  });
  it('city-only targeted and dividend cards do not apply ordinary-building effects to islands',()=>{
    for(const card of ['city-festival','blackout','city-dividend','maintenance']){let s:any=initial();s.properties={2:{owner:card==='blackout'?'p2':'p1',houses:0,buildings:[],landmark:false}};s.positions.p1=10;s.rng=marbleScenarioDice();s.eventDeck=[card];s=act(s,'roll');expect(s.money.p1).toBe(3000);expect(s.phase).toBe('main');expect(s.pendingEvent).toBeNull();}
  });
  it('all32 worldtravel destinations include the only travel corner and zero-distance revisits do not pay salary',()=>{
    let s:any=initial();s.phase='train-decision';s.positions.p1=24;s.pendingTrainFare=0;expect(marbleEngine.getPlayerView(s,'p1').actions.filter((a:any)=>a.action.type==='choose-train')).toHaveLength(32);s=act(s,'choose-train',{destination:24});expect(s.money.p1).toBe(3000);expect(s.lastMove.steps).toBe(0);expect(s.phase).toBe('main');expect(s.trainReady.p1).toBe(true);
  });
});

it('three complete color groups win, and corner16 is required only for the16..23 line',()=>{
  const properties=Object.fromEntries([1,3,10,11,13,15].map(index=>[index,{owner:'p1'}]));expect(worldOwnershipVictory(worldIslandsBoard,properties,'p1')).toBe('triple-monopoly');
  const line=Object.fromEntries([17,18,19,21,22,23].map(index=>[index,{owner:'p1'}]));expect(completedPropertyLines(worldIslandsBoard,line,'p1')).toEqual([]);line[16]={owner:'p1'};expect(completedPropertyLines(worldIslandsBoard,line,'p1')).toEqual([2]);
});
