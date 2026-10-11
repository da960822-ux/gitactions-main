import { describe,it,expect } from 'vitest';
import { jaipurEngine } from './jaipur';
import { JaipurState } from './jaipur';
import type { GameAction } from '../core/types';
const p1='p1' as const;
describe('Jaipur engine',()=>{
 it('allows single cloth, spice and leather sales while requiring two precious goods',()=>{
  const initial=jaipurEngine.createInitialState(42);
  for(const good of ['cloth','spice','leather','diamond','gold','silver'] as const){
   const state:JaipurState={...initial,active:p1,hands:{...initial.hands,p1:[good]}};
   const action={type:'sell',payload:{good,count:1}};
   const precious=['diamond','gold','silver'].includes(good);
   const choices=jaipurEngine.getPlayerView(state,p1).actions.map((choice:{action:GameAction})=>choice.action);
   if(precious){expect(jaipurEngine.validateAction(state,p1,action)).toBeTruthy();expect(choices).not.toContainEqual(action);}
   else{expect(jaipurEngine.validateAction(state,p1,action)).toBeNull();expect(choices).toContainEqual(action);const next=jaipurEngine.applyAction(state,p1,action);expect(next.hands.p1).toHaveLength(0);expect(next.tokens.p1).toBe(initial.piles[good][0]);}
  }
 });
 it('deals a deterministic playable setup while hiding server seed and rival hand',()=>{
  const a=jaipurEngine.createInitialState(91),b=jaipurEngine.createInitialState(91),v=jaipurEngine.getPlayerView(a,p1);
  expect(a).toEqual(b);expect(a.hands.p1.length+a.herds.p1.length).toBe(5);expect(a.hands.p2.length+a.herds.p2.length).toBe(5);expect(a.market).toHaveLength(5);expect(a.bonusTiles[3].slice().sort((x,y)=>x-y)).toEqual([1,1,2,2,3,3,3]);expect(a.bonusTiles[4].slice().sort((x,y)=>x-y)).toEqual([4,4,5,5,6,6]);expect(a.bonusTiles[5].slice().sort((x,y)=>x-y)).toEqual([8,8,9,9,10]);expect(a.deck.length+a.market.length+a.hands.p1.length+a.hands.p2.length+a.herds.p1.length+a.herds.p2.length).toBe(55);
  expect(v).not.toHaveProperty('rngSeed');expect(v).not.toHaveProperty('deck');expect(v).not.toHaveProperty('hands');expect(v.ownHand).toEqual(a.hands.p1);expect(v.opponentCount).toBe(a.hands.p2.length);expect(v.board.bonusTileCounts).toEqual({3:7,4:6,5:5});expect(v.board).not.toHaveProperty('bonusTiles');
 });
 it('takes the entire camel market without adding camels to the hand and does not mutate input',()=>{
  let s:any=jaipurEngine.createInitialState(2);s={...s,active:p1,market:['camel','gold','camel','leather','camel'],hands:{...s.hands,p1:['silver']}};
  const next=jaipurEngine.applyAction(s,p1,{type:'take',payload:{mode:'camels'}});
  expect(next.herds.p1.length).toBe(s.herds.p1.length+3);expect(next.hands.p1).toEqual(['silver']);expect(s.market).toHaveLength(5);expect(s.herds.p1.length).not.toBe(next.herds.p1.length);
 });
 it('offers every indexed multi-card exchange combination',()=>{
  let s:any=jaipurEngine.createInitialState(6);s={...s,active:p1,hands:{...s.hands,p1:['diamond','gold','silver','cloth','spice']},market:['leather','cloth','spice','camel','camel']};const actions=jaipurEngine.getPlayerView(s,p1).actions.map((x:any)=>x.action);expect(actions).toContainEqual({type:'take',payload:{mode:'exchange',handIndices:[1,3],marketIndices:[0,1]}});expect(actions).not.toContainEqual(expect.objectContaining({type:'take',payload:expect.objectContaining({mode:'exchange',marketIndices:expect.arrayContaining([3])})}));expect(jaipurEngine.validateAction(s,p1,{type:'take',payload:{mode:'exchange',handIndices:[0,1],marketIndices:[0,3]}})).toBeTruthy();
 });
 it('uses the standard eleven-camel supply and can sell more goods than tokens remain',()=>{
  const s=jaipurEngine.createInitialState(13);expect([...s.deck,...s.market,...s.hands.p1,...s.hands.p2,...s.herds.p1.map(()=> 'camel'),...s.herds.p2.map(()=> 'camel')].filter((c:any)=>c==='camel')).toHaveLength(11);
  const nearEmpty:any={...s,active:p1,hands:{...s.hands,p1:['leather','leather','leather']},piles:{...s.piles,leather:[1,1]}};
  expect(jaipurEngine.validateAction(nearEmpty,p1,{type:'sell',payload:{good:'leather',count:3}})).toBeNull();
  const legal=jaipurEngine.getPlayerView(nearEmpty,p1).actions.map((x:any)=>x.action);expect(legal).toContainEqual({type:'sell',payload:{good:'leather',count:3}});
  const next=jaipurEngine.applyAction(nearEmpty,p1,{type:'sell',payload:{good:'leather',count:3}});expect(next.hands.p1).toHaveLength(0);expect(next.piles.leather).toHaveLength(0);expect(next.tokens.p1).toBeGreaterThanOrEqual(3);expect(next.tokens.p1).toBeLessThanOrEqual(5);
 });
 it('applies the five-or-more sale bonus to a six-card sale',()=>{
  let s:any=jaipurEngine.createInitialState(17);s={...s,active:p1,hands:{...s.hands,p1:Array(6).fill('leather')}};const next=jaipurEngine.applyAction(s,p1,{type:'sell',payload:{good:'leather',count:6}});
  expect(next.tokens.p1).toBeGreaterThanOrEqual(20);expect(next.tokens.p1).toBeLessThanOrEqual(22);expect(next.bonusTiles[5]).toHaveLength(s.bonusTiles[5].length-1);
 });
 it('sells only selected goods, takes top tokens plus a proper bonus tile, and preserves the source state',()=>{
  let s:any=jaipurEngine.createInitialState(7);s={...s,active:p1,hands:{...s.hands,p1:['leather','leather','leather']}};const before=s.piles.leather.length;const n=jaipurEngine.applyAction(s,p1,{type:'sell',payload:{good:'leather',count:3}});expect(n.hands.p1).toHaveLength(0);expect(n.piles.leather).toHaveLength(before-3);expect(n.tokens.p1).toBeGreaterThanOrEqual(10);expect(n.tokens.p1).toBeLessThanOrEqual(12);expect(s.hands.p1).toHaveLength(3);
 });
 it('counts the camel majority as five points when deciding the round',()=>{
  let s:any=jaipurEngine.createInitialState(9);s={...s,active:p1,round:3,deck:[],hands:{...s.hands,p1:['leather']},herds:{p1:[0],p2:[0,0]},tokens:{p1:20,p2:18},piles:{diamond:[],gold:[],silver:[],cloth:[],spice:[],leather:[1]}};const ended=jaipurEngine.applyAction(s,p1,{type:'sell',payload:{good:'leather',count:1}});expect(ended.result?.winner).toBe('p2');expect(ended.roundsWon.p2).toBe(1);
 });
 it('rejects an illegal single camel pick and invalid over-sale',()=>{
  let s:any=jaipurEngine.createInitialState(4);s={...s,active:p1,market:['camel','gold','silver','cloth','spice'],hands:{...s.hands,p1:['leather']}};
  expect(jaipurEngine.validateAction(s,p1,{type:'take',payload:{mode:'single',indices:[0]}})).toBeTruthy();
  expect(jaipurEngine.validateAction(s,p1,{type:'sell',payload:{good:'leather',count:2}})).toBeTruthy();
 });

 it('keeps the 7-card goods limit separate from camel herds and maintains a five-card market on single takes',()=>{
  let s:any=jaipurEngine.createInitialState(101);s={...s,active:p1,hands:{...s.hands,p1:Array(6).fill('cloth')},market:['gold','silver','spice','leather','cloth'],deck:['diamond','gold']};
  const choices=jaipurEngine.getPlayerView(s,p1).actions.map((x:any)=>x.action);
  expect(choices).toContainEqual({type:'take',payload:{mode:'single',indices:[0]}});
  const next=jaipurEngine.applyAction(s,p1,{type:'take',payload:{mode:'single',indices:[0]}});
  expect(next.hands.p1).toHaveLength(7);expect(next.herds.p1).toEqual(s.herds.p1);expect(next.market).toHaveLength(5);expect(next.deck).toHaveLength(1);
  const full:any={...s,hands:{...s.hands,p1:Array(7).fill('cloth')}};
  expect(jaipurEngine.getPlayerView(full,p1).actions.map((x:any)=>x.action)).not.toContainEqual({type:'take',payload:{mode:'single',indices:[0]}});
  expect(jaipurEngine.validateAction(full,p1,{type:'take',payload:{mode:'single',indices:[0]}})).toBeTruthy();
 });

 it('exchanges two through five non-camel cards one-for-one without changing the hand size',()=>{
  for(const count of [2,3,4,5]){
   const goods=['diamond','gold','silver','cloth','spice'];
   const s:any={...jaipurEngine.createInitialState(300+count),active:p1,hands:{p1:goods.slice(0,count),p2:[]},market:['leather','cloth','spice','gold','silver']};
   const action={type:'take',payload:{mode:'exchange',handIndices:Array.from({length:count},(_,i)=>i),marketIndices:Array.from({length:count},(_,i)=>i)}};
   expect(jaipurEngine.validateAction(s,p1,action)).toBeNull();
   const next=jaipurEngine.applyAction(s,p1,action);
   expect(next.hands.p1).toHaveLength(count);expect(next.market).toHaveLength(5);expect(next.hands.p1.slice().sort()).toEqual(['leather','cloth','spice','gold','silver'].slice(0,count).sort());
  }
  const s:any={...jaipurEngine.createInitialState(10),active:p1,hands:{p1:['diamond','gold','silver','cloth','spice'],p2:[]},market:['camel','leather','cloth','spice','gold']};
  for(const action of [
   {type:'take',payload:{mode:'exchange',handIndices:[0],marketIndices:[1]}},
   {type:'take',payload:{mode:'exchange',handIndices:[0,1,2,3,4,0],marketIndices:[1,2,3,4,1,2]}},
   {type:'take',payload:{mode:'exchange',handIndices:[0,1],marketIndices:[0,1]}},
   {type:'take',payload:{mode:'exchange',handIndices:[0,0],marketIndices:[1,2]}}
  ]) expect(jaipurEngine.validateAction(s,p1,action)).toBeTruthy();
 });

 it('awards the highest goods tokens first and adds the correct 3/4/5-card bonus tier',()=>{
  for(const [count,base,bonus] of [[3,9,2],[4,10,5],[5,11,9]] as const){
   const s:any={...jaipurEngine.createInitialState(55+count),active:p1,hands:{p1:Array(count).fill('leather'),p2:[]},deck:Array(20).fill('camel'),market:['camel','camel','camel','diamond','gold'],piles:{...jaipurEngine.createInitialState(7).piles,leather:[4,3,2,1,1,1,1,1,1]},bonusTiles:{3:[bonus],4:[bonus],5:[bonus]}};
   const next=jaipurEngine.applyAction(s,p1,{type:'sell',payload:{good:'leather',count}});
   expect(next.tokens.p1).toBe(base+bonus);expect(next.piles.leather).toEqual(s.piles.leather.slice(count));expect(next.bonusTiles[count===3?3:count===4?4:5]).toHaveLength(0);
   const sale=next.events?.find(e=>e.type==='sale'),revealed=next.events?.find(e=>e.type==='bonus');expect(sale?.tokenValues).toEqual(s.piles.leather.slice(0,count));expect(sale?.goodsPoints).toBe(base);expect(revealed?.bonus?.value).toBe(bonus);expect(revealed?.bonus?.size).toBe(count===3?3:count===4?4:5);
  }
  const two:any={...jaipurEngine.createInitialState(8),active:p1,hands:{p1:['diamond','diamond'],p2:[]},deck:Array(20).fill('camel'),market:['camel','camel','camel','cloth','spice']};
  expect(jaipurEngine.applyAction(two,p1,{type:'sell',payload:{good:'diamond',count:2}}).tokens.p1).toBe(14);
 });

 it('gives exactly five camel-majority points, none on a tie, and starts the next round with p1',()=>{
  const ending=(herds:any,tokens:any)=>({...jaipurEngine.createInitialState(73),active:p1,round:3,deck:[],hands:{p1:[],p2:[]},market:['leather','cloth','spice','diamond','gold'],herds,tokens} as any);
  const majority=jaipurEngine.applyAction(ending({p1:[0,0,0],p2:[0,0]},{p1:12,p2:15}),p1,{type:'take',payload:{mode:'single',indices:[0]}});
  expect(majority.round).toBe(3);expect(majority.camelBadges.p1).toBe(1);expect(majority.roundsWon.p1).toBe(1);expect(majority.result?.winner).toBe('p1');
  const tied=jaipurEngine.applyAction(ending({p1:[0,0],p2:[0,0]},{p1:12,p2:12}),p1,{type:'take',payload:{mode:'single',indices:[0]}});
  expect(tied.result?.winner).toBe('draw');expect(tied.camelBadges).toEqual({p1:0,p2:0});
 });

 it('ends after three non-empty goods stacks, and ends when the deck empties even if more stacks remain',()=>{
  const base:any=jaipurEngine.createInitialState(111);
  const stacks:any={diamond:[],gold:[],silver:[],cloth:[1],spice:[1],leather:[1]};
  const lowStacks:any={...base,active:p1,round:1,deck:Array(20).fill('camel'),hands:{p1:['diamond','diamond'],p2:[]},market:['camel','camel','camel','cloth','spice'],piles:{...stacks,diamond:[7,7]}};
  const byStacks=jaipurEngine.applyAction(lowStacks,p1,{type:'sell',payload:{good:'diamond',count:2}});
  expect(byStacks.round).toBe(2);expect(byStacks.active).toBe('p1');expect(byStacks.deck.length).toBeGreaterThan(0);expect(['diamond','gold','silver','cloth','spice','leather'].filter(g=>byStacks.piles[g as keyof typeof byStacks.piles].length>0)).toHaveLength(6);
  const byDeck:any={...base,active:p1,round:1,deck:[],hands:{p1:['cloth'],p2:[]},market:['cloth','spice','leather','diamond','gold'],piles:{diamond:[7,7],gold:[6,6],silver:[5,5],cloth:[5],spice:[5],leather:[4]}};
  const afterDraw=jaipurEngine.applyAction(byDeck,p1,{type:'take',payload:{mode:'single',indices:[0]}});
  expect(afterDraw.round).toBe(2);expect(afterDraw.active).toBe('p1');expect(afterDraw.deck.length).toBeGreaterThan(0);
 });

 it('finishes the match after a second round win and records a tied third-round match as a draw',()=>{
  const finalRound=(roundsWon:any,tokens:any)=>({...jaipurEngine.createInitialState(88),active:p1,round:3,deck:[],hands:{p1:[],p2:[]},market:['cloth','spice','leather','diamond','gold'],herds:{p1:[],p2:[]},tokens,roundsWon} as any);
  const secondWin=jaipurEngine.applyAction(finalRound({p1:1,p2:0},{p1:10,p2:0}),p1,{type:'take',payload:{mode:'single',indices:[0]}});
  expect(secondWin.result).toMatchObject({winner:'p1',scores:{p1:2,p2:0}});expect(secondWin.roundsWon).toEqual({p1:2,p2:0});
  const tie=jaipurEngine.applyAction(finalRound({p1:1,p2:1},{p1:10,p2:10}),p1,{type:'take',payload:{mode:'single',indices:[0]}});
  expect(tie.result).toMatchObject({winner:'draw',scores:{p1:1,p2:1}});
 });

 it('limits views to the caller hand and public state, with no seed, deck, bonus values or private event payload',()=>{
  const s=jaipurEngine.createInitialState(2026),own=jaipurEngine.getPlayerView(s,'p1'),rival=jaipurEngine.getPlayerView(s,'p2');
  for(const view of [own,rival]){
   expect(view).not.toHaveProperty('rngSeed');expect(view).not.toHaveProperty('deck');expect(view).not.toHaveProperty('hands');expect(view.board).not.toHaveProperty('bonusTiles');expect(view.board.market).toEqual(s.market);expect(view.board.deckCount).toBe(s.deck.length);
  expect(view.ownHand.length).toBeGreaterThanOrEqual(0);expect(view.opponentCount).toBeGreaterThanOrEqual(0);
   expect(view.handCards.map((c:any)=>c.good)).toEqual(view.ownHand);expect(view.board.marketCards.map((c:any)=>c.good)).toEqual(view.board.market);expect(view.board.roundSummary).toBeNull();expect(view.board.roundHistory).toEqual([]);
  }
  expect(own.ownHand).toEqual(s.hands.p1);expect(rival.ownHand).toEqual(s.hands.p2);expect(own.ownHand).not.toEqual(s.hands.p2);
  const p1Ids=new Set(own.handCards.map((c:any)=>c.id));expect(own.board.marketCards.every((c:any)=>!p1Ids.has(c.id))).toBe(true);
  expect(rival.handCards.every((c:any)=>!p1Ids.has(c.id))).toBe(true);expect(JSON.stringify(own)).not.toContain(s.rngSeed.toString());
 });

 it('hides lower goods-token values until the sale event reveals the tokens actually earned',()=>{
  const initial=jaipurEngine.createInitialState(515),state:any={...initial,active:p1,hands:{...initial.hands,p1:['leather','leather','leather']},piles:{...initial.piles,leather:[4,999,800,1]}};
  const before=jaipurEngine.getPlayerView(state,p1);
  expect(before.board.piles.leather).toEqual([4,null,null,null]);expect(JSON.stringify(before)).not.toContain('999');expect(JSON.stringify(before)).not.toContain('800');
  const next=jaipurEngine.applyAction(state,p1,{type:'sell',payload:{good:'leather',count:3}});
  const sale=next.events?.find(event=>event.type==='sale');expect(sale?.tokenValues).toEqual([4,999,800]);expect(sale?.goodsPoints).toBe(1803);
 });

 it('keeps physical card IDs stable as cards move through the face-up market, hand, exchange and camel herd',()=>{
  const initial=jaipurEngine.createInitialState(12),before=jaipurEngine.getPlayerView(initial,p1);
  const single=before.actions.find((x:any)=>x.action.type==='take'&&x.action.payload.mode==='single')!.action;
  const selectedIndex=(single.payload!.indices as number[])[0],selectedId=before.board.marketCards[selectedIndex].id;
  const afterSingle=jaipurEngine.applyAction(initial,p1,single),singleView=jaipurEngine.getPlayerView(afterSingle,p1);
  expect(singleView.handCards.some((c:any)=>c.id===selectedId)).toBe(true);expect(singleView.board.marketCards.some((c:any)=>c.id===selectedId)).toBe(false);
  expect(afterSingle.events?.map(e=>e.type)).toEqual(expect.arrayContaining(['take-single','market-refill']));
  const refilled=singleView.board.marketCards.find((c:any)=>!before.board.marketCards.some((old:any)=>old.id===c.id));expect(refilled).toBeDefined();

  const exchangeState={...afterSingle,active:p1};const exchangeView=jaipurEngine.getPlayerView(exchangeState,p1);
  const exchange=exchangeView.actions.find((x:any)=>x.action.type==='take'&&x.action.payload.mode==='exchange')!.action;
  const handIds=(exchange.payload!.handIndices as number[]).map(i=>exchangeView.handCards[i].id),marketIds=(exchange.payload!.marketIndices as number[]).map(i=>exchangeView.board.marketCards[i].id);
  const exchanged=jaipurEngine.applyAction(exchangeState,p1,exchange),exchangeResult=jaipurEngine.getPlayerView(exchanged,p1);
  expect(marketIds.every(id=>exchangeResult.handCards.some((c:any)=>c.id===id))).toBe(true);
  expect(handIds.every(id=>exchangeResult.board.marketCards.some((c:any)=>c.id===id))).toBe(true);
  expect(exchanged.events?.some(e=>e.type==='exchange'&&e.cards?.length===2&&e.given?.length===2)).toBe(true);

  const camelAction=before.actions.find((x:any)=>x.action.type==='take'&&x.action.payload.mode==='camels')!.action;
  const camelIds=before.board.marketCards.filter((c:any)=>c.good==='camel').map((c:any)=>c.id);
  const afterCamels=jaipurEngine.applyAction(initial,p1,camelAction),camelView=jaipurEngine.getPlayerView(afterCamels,p1);
  expect(camelView.board.herdCounts.p1).toBe(initial.herds.p1.length+3);expect(camelView.handCards.every((c:any)=>!camelIds.includes(c.id))).toBe(true);
  expect(afterCamels.events?.some(e=>e.type==='take-camels'&&e.cards?.map(c=>c.id).sort().join(',')===camelIds.sort().join(','))).toBe(true);
 });

 it('publishes a bounded public action log and round score breakdown without exposing deck identities',()=>{
  const initial=jaipurEngine.createInitialState(2027);let s:any={...initial,active:p1,round:3,deck:[],market:['cloth','spice','leather','diamond','gold'],hands:{p1:[],p2:[]},herds:{p1:[0,0,0],p2:[0]},tokens:{p1:20,p2:16},ledger:{p1:{goods:15,bonus:5,known:true},p2:{goods:16,bonus:0,known:true}},events:Array.from({length:42},(_,i)=>({sequence:i+1,round:1,type:'take-single',title:{ko:'이전',es:'Anterior'}}))};
  const before=jaipurEngine.getPlayerView(s,p1);expect(before.board.scoreBreakdown.p1.detailed).toBe(true);
  s=jaipurEngine.applyAction(s,p1,{type:'take',payload:{mode:'single',indices:[0]}});
  const view=jaipurEngine.getPlayerView(s,p1),summary=view.board.roundSummary;
  expect(view.board.actionLog).toHaveLength(40);expect(view.board.actionLog.at(-1)?.type).toBe('win');expect(view.board.deckCount).toBe(0);expect(view.board).not.toHaveProperty('deckIds');
  expect(summary).toMatchObject({round:3,winner:'p1',cause:'deck',camelCounts:{p1:3,p2:1},breakdown:{p1:{goods:15,bonus:5,sale:20,camel:5,total:25,detailed:true},p2:{goods:16,bonus:0,sale:16,camel:0,total:16,detailed:true}}});
  expect(view.board.roundHistory).toHaveLength(1);
  expect(view.board.actionLog.every((event:any)=>!('deck' in event)&&!('deckIds' in event)&&!('stock' in event))).toBe(true);
 });

 it('marks legacy snapshots as unknown for detailed sale breakdowns without failing view generation',()=>{
  const state:any={...jaipurEngine.createInitialState(313)};delete state.cardIds;delete state.events;delete state.roundHistory;delete state.ledger;
  const legacy=jaipurEngine.getPlayerView(state,p1);
  expect(legacy.handCards.map((c:any)=>c.good)).toEqual(state.hands.p1);expect(legacy.board.marketCards.map((c:any)=>c.good)).toEqual(state.market);
  expect(legacy.board.actionLog).toEqual([]);expect(legacy.board.roundSummary).toBeNull();expect(legacy.board.scoreBreakdown.p1).toMatchObject({goods:null,bonus:null,detailed:false});
 });
});
