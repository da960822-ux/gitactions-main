import {describe,it,expect} from 'vitest';
import {splendorEngine,SplendorState,splendorNobles} from './splendor';
import {canonicalCards} from './splendorCards';
describe('Splendor engine',()=>{
 it('deals a deterministic public market and keeps reserve, tokens and seed private',()=>{
  const s=splendorEngine.createInitialState(10),v=splendorEngine.getPlayerView(s,'p1');expect(splendorEngine.createInitialState(10)).toEqual(s);
  expect(s.market[1]).toHaveLength(4);expect(Object.keys(s.availableNobles)).toHaveLength(3);expect([1,2,3].map(t=>s.market[t as 1|2|3].length+s.decks[t as 1|2|3].length)).toEqual([40,30,20]);expect(canonicalCards).toHaveLength(90);expect(canonicalCards[1]).toEqual({tier:1,bonus:'blue',points:1,cost:{red:4}});expect(v).not.toHaveProperty('seed');expect(v).not.toHaveProperty('hands');expect(v.ownHand.tokens).toEqual(s.hands.p1);expect(v.opponentCount).toBe(0);
 });
 it('keeps the ten base nobles and adds six balanced candidates with the same requirement patterns',()=>{
  const pairs=splendorNobles.filter(n=>Object.keys(n.requirement).length===2),triples=splendorNobles.filter(n=>Object.keys(n.requirement).length===3);
  expect(splendorNobles).toHaveLength(16);expect(pairs).toHaveLength(8);expect(triples).toHaveLength(8);
  expect(pairs.every(n=>Object.values(n.requirement).every(cost=>cost===4))).toBe(true);expect(triples.every(n=>Object.values(n.requirement).every(cost=>cost===3))).toBe(true);
  expect(splendorNobles.every(n=>n.points===3)).toBe(true);
  expect(new Set(splendorNobles.map(n=>JSON.stringify(n.requirement))).size).toBe(16);
  expect(pairs.slice(0,5).map(n=>Object.keys(n.requirement))).toEqual([['white','blue'],['blue','green'],['green','red'],['red','black'],['white','black']]);
  expect(triples.slice(0,5).map(n=>Object.keys(n.requirement))).toEqual([['white','blue','black'],['white','blue','green'],['blue','green','red'],['green','red','black'],['white','red','black']]);
 });
 it('continues an existing saved game with its original noble IDs and public count',()=>{
  const original=splendorEngine.createInitialState(10);
  const saved=JSON.parse(JSON.stringify({...original,availableNobles:Object.fromEntries([0,1,2].map(i=>[`n${i}`,splendorNobles[i]]))})) as SplendorState;
  const next=splendorEngine.applyAction(saved,'p1',{type:'take',payload:{gems:['white','blue','green']}});
  expect(Object.keys(next.availableNobles)).toEqual(['n0','n1','n2']);
  expect(next.availableNobles.n0).toEqual(splendorNobles[0]);
  expect(next.hands.p1.white).toBe(1);
 });
 it('keeps each public bonus display separate from the canonical player state',()=>{
  const s=splendorEngine.createInitialState(10),before=structuredClone(s);
  const view=splendorEngine.getPlayerView(s,'p1');
  view.board.ownedBonuses.p1.white=99;
  view.board.ownedBonuses.p2.blue=99;
  expect(s).toEqual(before);
  expect(view.ownHand.bonuses).toEqual(before.bonuses.p1);
  expect(splendorEngine.getPlayerView(s,'p2').board.ownedBonuses).toEqual(before.bonuses);
 });
 it('takes legal tokens immutably and rejects bank or hand limit violations',()=>{
  const s=splendorEngine.createInitialState(3);const action={type:'take',payload:{gems:['white','blue','green']}};
  expect(splendorEngine.validateAction(s,'p1',action)).toBeNull();const n=splendorEngine.applyAction(s,'p1',action);
  expect(n.hands.p1.white).toBe(1);expect(n.bank.white).toBe(3);expect(s.hands.p1.white).toBe(0);
  expect(splendorEngine.validateAction({...s,hands:{...s.hands,p1:{...s.hands.p1,white:8}}},'p1',action)).toBeTruthy();const full={...s,hands:{...s.hands,p1:{...s.hands.p1,white:8,blue:1}}};expect(splendorEngine.validateAction(full,'p1',{type:'take',payload:{gems:['white','blue','green'],returnTokens:{white:2}}})).toBeNull();
 });
 it('does not expose or accept a zero-token take when the bank has no colored gems',()=>{
  const base=splendorEngine.createInitialState(34),s={...base,bank:{...base.bank,white:0,blue:0,green:0,red:0,black:0}};
  expect(splendorEngine.validateAction(s,'p1',{type:'take',payload:{gems:[]}})).toBeTruthy();
  expect(splendorEngine.getPlayerView(s,'p1').actions.some((item:any)=>item.action.type==='take')).toBe(false);
 });
 it('offers every legal token return choice when a take would exceed the ten-token limit',()=>{
  const base=splendorEngine.createInitialState(12);const s:SplendorState={...base,hands:{...base.hands,p1:{white:2,blue:2,green:2,red:2,black:1,gold:0}}};const view=splendorEngine.getPlayerView(s,'p1');const takes=view.actions.filter((x:any)=>x.action.type==='take');expect(takes.length).toBeGreaterThan(0);for(const item of takes)expect(splendorEngine.validateAction(s,'p1',item.action)).toBeNull();const redemptions=takes.map((x:any)=>x.action.payload.returnTokens).filter(Boolean);expect(redemptions.length).toBeGreaterThan(0);expect(redemptions.some((x:any)=>x.white===1)).toBe(true);expect(redemptions.some((x:any)=>x.gold===1)).toBe(false);
 });
 it('pays a purchase using bonuses before tokens and claims a newly qualified noble',()=>{
  const base=splendorEngine.createInitialState(8),target=base.market[1][0];let s:SplendorState={...base,bonuses:{...base.bonuses,p1:{white:3,blue:3,green:3,red:0,black:0}},availableNobles:{patron:{points:3,requirement:{white:3,blue:3,green:3}}},market:{...base.market,1:[{...target,cost:{white:2,blue:0,green:0,red:0,black:0},points:1,bonus:'red'},...base.market[1].slice(1)]}};const n=splendorEngine.applyAction(s,'p1',{type:'buy',payload:{source:'market',tier:1,index:0}});expect(n.cardPoints.p1).toBe(1);expect(n.nobles.p1).toBe(3);expect(n.availableNobles).toEqual({});expect(n.hands.p1.white).toBe(0);expect(n.bank.white).toBe(4);expect(s.nobles.p1).toBe(0);
 });
 it('publishes purchased card identities but never opponent reservation identities, including legacy saves',()=>{
  const base=splendorEngine.createInitialState(18),target=base.market[1][0],free={...target,cost:{white:0,blue:0,green:0,red:0,black:0}};
  const legacy:any={...base,acquiredCards:undefined,acquiredCardHistoryComplete:undefined,cardPoints:{p1:5,p2:0},market:{...base.market,1:[free,...base.market[1].slice(1)]}};
  const bought=splendorEngine.applyAction(legacy,'p1',{type:'buy',payload:{source:'market',tier:1,index:0}});
  expect(bought.acquiredCards?.p1).toEqual([expect.objectContaining({id:target.id,points:target.points,bonus:target.bonus})]);
  expect(bought.acquiredCardHistoryComplete?.p1).toBe(false);
  expect(bought.cardPoints.p1).toBe(5+target.points);
  const hiddenId=bought.market[2][0].id;
  const withReserve=splendorEngine.applyAction(bought,'p2',{type:'reserve',payload:{tier:2,index:0}});
  const view=splendorEngine.getPlayerView(withReserve,'p1');
  expect(view.board.acquiredCards.p1[0]).toMatchObject({id:target.id,points:target.points,bonus:target.bonus});
  expect(view.board.acquiredCardHistoryComplete.p1).toBe(false);
  expect(JSON.stringify(view)).not.toContain(hiddenId);
  expect(view.board.reservedOpponentCount).toBe(1);
 });
 it('lets the active player choose one when several nobles qualify without ending their turn early',()=>{
  const base=splendorEngine.createInitialState(21),target=base.market[1][0];const s:SplendorState={...base,cardPoints:{p1:14,p2:0},turns:{p1:14,p2:14},bonuses:{...base.bonuses,p1:{white:3,blue:3,green:3,red:3,black:0}},availableNobles:{n1:{points:3,requirement:{white:3,blue:3,green:3}},n2:{points:3,requirement:{white:3,blue:3,red:3}}},market:{...base.market,1:[{...target,cost:{white:0,blue:0,green:0,red:0,black:0},points:1}]}};const bought=splendorEngine.applyAction(s,'p1',{type:'buy',payload:{source:'market',tier:1,index:0}});expect(bought.result).toBeNull();expect(bought.active).toBe('p1');expect(bought.turns.p1).toBe(14);expect(bought.pendingNobles).toHaveLength(2);const actions=splendorEngine.getPlayerView(bought,'p1').actions;expect(actions.map((x:any)=>x.action.type)).toEqual(['chooseNoble','chooseNoble']);const chosen=splendorEngine.applyAction(bought,'p1',actions[0].action);expect(chosen.active).toBe('p2');expect(chosen.turns.p1).toBe(15);expect(chosen.nobles.p1).toBe(3);expect(chosen.pendingNobles).toEqual([]);expect(chosen.result).toBeNull();const ended=splendorEngine.applyAction(chosen,'p2',{type:'take',payload:{gems:['white','blue','green']}});expect(ended.result?.winner).toBe('p1');
 });
 it('reserves a face-up card, grants gold, then enforces equal turns after 15 points',()=>{
  const s=splendorEngine.createInitialState(5),reserved=splendorEngine.applyAction(s,'p1',{type:'reserve',payload:{tier:1,index:0}});
  expect(reserved.reserved.p1).toHaveLength(1);expect(reserved.hands.p1.gold).toBe(1);expect(reserved.bank.gold).toBe(4);
  let final:SplendorState={...s,active:'p1',pendingEnd:true,turns:{p1:14,p2:14},cardPoints:{p1:15,p2:13}};
  final=splendorEngine.applyAction(final,'p1',{type:'take',payload:{gems:['white','blue','green']}});
  expect(final.result).toBeNull();expect(final.active).toBe('p2');
  final=splendorEngine.applyAction(final,'p2',{type:'take',payload:{gems:['white','blue','green']}});
  expect(final.result?.winner).toBe('p1');
 });
 it('does not expose a reserve action after all three private slots are occupied',()=>{
  const base=splendorEngine.createInitialState(42),reserved=base.market[1].slice(0,3).map((card,i)=>({...card,id:`reserved-${i}`}));
  const full:SplendorState={...base,reserved:{...base.reserved,p1:reserved}};
  expect(splendorEngine.getPlayerView(full,'p1').actions.some((item:any)=>item.action.type==='reserve')).toBe(false);
  expect(splendorEngine.validateAction(full,'p1',{type:'reserve',payload:{tier:1,index:0}})).toBe('Reserve limit reached');
  expect(splendorEngine.getPlayerView(full,'p2').board.reservedOpponentCount).toBe(3);
  expect(splendorEngine.getPlayerView(full,'p2').ownHand.reserved).toHaveLength(0);
 });
 it.each([1,2])('preserves earlier snapshots when claiming one of %i qualifying nobles',(count)=>{
  const base=splendorEngine.createInitialState(21),target=base.market[1][0];
  const s:SplendorState={...base,
   bonuses:{...base.bonuses,p1:{white:3,blue:3,green:3,red:3,black:0}},
   availableNobles:Object.fromEntries(Array.from({length:count},(_,i)=>[`n${i}`,{points:3,requirement:{white:3,blue:3,green:3}}])),
   market:{...base.market,1:[{...target,cost:{white:0,blue:0,green:0,red:0,black:0}},...base.market[1].slice(1)]},
  };
  const before=structuredClone(s);
  const bought=splendorEngine.applyAction(s,'p1',{type:'buy',payload:{source:'market',tier:1,index:0}});
  expect(s).toEqual(before);
  if(count===1){expect(bought.availableNobles).toEqual({});expect(bought.nobles.p1).toBe(3);}
  else{
   const beforeChoice=structuredClone(bought);
   const chosen=splendorEngine.applyAction(bought,'p1',{type:'chooseNoble',payload:{id:'n0'}});
   expect(bought).toEqual(beforeChoice);
   expect(Object.keys(chosen.availableNobles)).toEqual(['n1']);
   expect(chosen.nobles.p1).toBe(3);
   expect(splendorEngine.getPlayerView(bought,'p1').actions).toHaveLength(2);
  }
 });
});
