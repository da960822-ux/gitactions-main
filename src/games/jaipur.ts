import { GameAction, GameEngine, GameResult, PlayerId, otherPlayer, seededRandom, shuffle } from '../core/types';

export type JaipurGood = 'diamond' | 'gold' | 'silver' | 'cloth' | 'spice' | 'leather' | 'camel';
export type JaipurCard = { id: string; good: JaipurGood; slot?: number };
export type JaipurRoundSummary = { round: number; winner: PlayerId|'draw'; cause: 'deck'|'piles'; camelCounts: Record<PlayerId, number>; roundsWon: Record<PlayerId, number>; breakdown: Record<PlayerId, { goods: number|null; bonus: number|null; sale: number; camel: number; total: number; detailed: boolean }> };
export type JaipurEvent = { sequence: number; round: number; type: 'take-single'|'exchange'|'take-camels'|'sale'|'market-refill'|'bonus'|'round-end'|'round-start'|'win'; actor?: PlayerId; title: {ko:string;es:string}; text?: {ko:string;es:string}; cards?: JaipurCard[]; given?: JaipurCard[]; tokenValues?: number[]; goodsPoints?: number; bonus?: {size:3|4|5;value:number}; points?: number; summary?: JaipurRoundSummary; winner?: PlayerId|'draw' };
export interface JaipurState {
  rngSeed: number; active: PlayerId; deck: JaipurGood[]; market: JaipurGood[];
  hands: Record<PlayerId, JaipurGood[]>; herds: Record<PlayerId, number[]>;
  tokens: Record<PlayerId, number>; piles: Record<Exclude<JaipurGood,'camel'>, number[]>; bonusTiles: {3:number[];4:number[];5:number[]}; camelBadges: Record<PlayerId, number>;
  roundsWon: Record<PlayerId, number>; round: number; result: GameResult | null;
  turnCount: number;
  cardIds?: { market: string[]; hands: Record<PlayerId, string[]> };
  events?: JaipurEvent[];
  roundHistory?: JaipurRoundSummary[];
  ledger?: Record<PlayerId, { goods: number; bonus: number; known: boolean }>;
}
const players: PlayerId[] = ['p1', 'p2'];
const goods: Exclude<JaipurGood,'camel'>[] = ['diamond','gold','silver','cloth','spice','leather'];
const minimumSale = (good: unknown) => good === 'diamond' || good === 'gold' || good === 'silver' ? 2 : 1;
const emptyPiles:JaipurState['piles']={diamond:[],gold:[],silver:[],cloth:[],spice:[],leather:[]};
const tokenValues: Record<Exclude<JaipurGood,'camel'>, number[]> = { diamond:[7,7,5,5,5], gold:[6,6,5,5,5], silver:[5,5,5,5,5], cloth:[5,4,3,3,2,2,1], spice:[5,4,3,3,2,2,1], leather:[4,3,2,1,1,1,1,1,1] };
const label: Record<JaipurGood, {ko:string;es:string}> = {
 diamond:{ko:'다이아몬드',es:'diamantes'}, gold:{ko:'금',es:'oro'}, silver:{ko:'은',es:'plata'}, cloth:{ko:'옷감',es:'tela'}, spice:{ko:'향신료',es:'especias'}, leather:{ko:'가죽',es:'cuero'}, camel:{ko:'낙타',es:'camello'}
};
function identities(s: JaipurState) {
 const ids = s.cardIds;
 return { market: ids?.market.length === s.market.length ? [...ids.market] : s.market.map((_,i)=>`r${s.round}-m${i}`), hands: Object.fromEntries(players.map(p=>[p, ids?.hands[p]?.length === s.hands[p].length ? [...ids.hands[p]] : s.hands[p].map((_,i)=>`r${s.round}-${p}-h${i}`)])) as Record<PlayerId,string[]> };
}
function appendEvent(s: JaipurState, e: Omit<JaipurEvent,'sequence'|'round'>): JaipurState {
 return {...s,events:[...(s.events??[]),{...e,sequence:(s.events?.at(-1)?.sequence??0)+1,round:s.round}].slice(-40)};
}
function scoreBreakdown(s: JaipurState, p: PlayerId, camel=0) {
 const entry=s.ledger?.[p], detailed=!!entry?.known && entry.goods+entry.bonus===s.tokens[p];
 return {goods:detailed?entry.goods:null,bonus:detailed?entry.bonus:null,sale:s.tokens[p],camel,total:s.tokens[p]+camel,detailed};
}
function mixSeed(seed:number, n:number) { return (seed + Math.imul(n + 1, 0x9e3779b9)) >>> 0; }
function newRound(state: JaipurState, seed: number): JaipurState {
 const pile: JaipurGood[] = [...Array(6).fill('diamond'),...Array(6).fill('gold'),...Array(6).fill('silver'),...Array(8).fill('cloth'),...Array(8).fill('spice'),...Array(10).fill('leather'),...Array(8).fill('camel')] as JaipurGood[];
 const rnd=seededRandom(seed); const deck=shuffle(pile,rnd); const hands: Record<PlayerId,JaipurGood[]>={p1:[],p2:[]}; const herds:Record<PlayerId,number[]>={p1:[],p2:[]};
 for(const p of players) for(let i=0;i<5;i++){const c=deck.pop()!; if(c==='camel')herds[p].push(0);else hands[p].push(c);}
 const market:JaipurGood[]=['camel','camel','camel']; while(market.length<5) market.push(deck.pop()!);
 return {...state,rngSeed:seed,deck,market,hands,herds,tokens:{p1:0,p2:0},piles:Object.fromEntries(goods.map(g=>[g,[...tokenValues[g]]])) as JaipurState['piles'],bonusTiles:{3:shuffle([1,1,2,2,3,3,3],rnd),4:shuffle([4,4,5,5,6,6],rnd),5:shuffle([8,8,9,9,10],rnd)},camelBadges:{p1:0,p2:0},turnCount:0,cardIds:{market:market.map((_,i)=>`r${state.round}-m${i}`),hands:{p1:hands.p1.map((_,i)=>`r${state.round}-p1-h${i}`),p2:hands.p2.map((_,i)=>`r${state.round}-p2-h${i}`)}},ledger:{p1:{goods:0,bonus:0,known:true},p2:{goods:0,bonus:0,known:true}}};
}
function draw(s:JaipurState): JaipurState { const deck=[...s.deck],market=[...s.market],cardIds=identities(s); if(deck.length){cardIds.market.push(`r${s.round}-draw${deck.length}`);market.push(deck.pop()!);} return {...s,deck,market,cardIds}; }
function finishRound(s:JaipurState): JaipurState {
 const a=s.herds.p1.length,b=s.herds.p2.length; const badges={...s.camelBadges}; let roundsWon={...s.roundsWon};
 const score1=s.tokens.p1+(a>b?5:0),score2=s.tokens.p2+(b>a?5:0);const winner:PlayerId|'draw'=score1===score2?'draw':score1>score2?'p1':'p2';
 if(a>b)badges.p1++;else if(b>a)badges.p2++;if(winner!=='draw')roundsWon[winner]++;
 let result:GameResult|null=null;
 if(roundsWon.p1>=2||roundsWon.p2>=2||s.round>=3){
   if(roundsWon.p1>roundsWon.p2) result={winner:'p1',reason:'won two rounds / ganó dos rondas',scores:{p1:roundsWon.p1,p2:roundsWon.p2}};
   else if(roundsWon.p2>roundsWon.p1) result={winner:'p2',reason:'won two rounds / ganó dos rondas',scores:{p1:roundsWon.p1,p2:roundsWon.p2}};
   else result={winner:'draw',reason:'rounds tied / empate de rondas',scores:{p1:roundsWon.p1,p2:roundsWon.p2}};
 }
 const summary:JaipurRoundSummary={round:s.round,winner,cause:s.deck.length===0?'deck':'piles',camelCounts:{p1:a,p2:b},roundsWon:{...roundsWon},breakdown:{p1:scoreBreakdown(s,'p1',a>b?5:0),p2:scoreBreakdown(s,'p2',b>a?5:0)}};
 return appendEvent({...s,camelBadges:badges,roundsWon,result,roundHistory:[...(s.roundHistory??[]),summary].slice(-3)},{type:'round-end',winner,summary,title:{ko:`${s.round}라운드 정산`,es:`Cuenta de la ronda ${s.round}`}});
}
function endRound(s:JaipurState){
 const ended=finishRound(s); if(ended.result)return appendEvent(ended,{type:'win',winner:ended.result.winner,title:{ko:ended.result.winner==='draw'?'경기 무승부':'시장 거래의 승자',es:ended.result.winner==='draw'?'Partida empatada':'¡Partida ganada!'}});
 return appendEvent(newRound({...ended,round:s.round+1,active:'p1'},mixSeed(s.rngSeed,s.round+1)),{type:'round-start',title:{ko:`${s.round+1}라운드 시작`,es:`Empieza la ronda ${s.round+1}`}});
}
function isRoundOver(s:JaipurState){return goods.filter(g=>s.piles[g].length>0).length<=3 || s.deck.length===0;}
function makeView(s:JaipurState,p:PlayerId){
 const cardIds=identities(s),roundHistory=structuredClone(s.roundHistory??[]),log=structuredClone(s.events??[]);
 const actions: {label:{ko:string;es:string};action:GameAction}[]=[];
 const add=(ko:string,es:string,action:GameAction)=>actions.push({label:{ko,es},action});
 if(!s.result&&s.active===p){
   for(let i=0;i<s.market.length;i++){const c=s.market[i];if(c!=='camel'&&s.hands[p].length<7)add(`가져오기: ${label[c].ko}`,`Tomar: ${label[c].es}`,{type:'take',payload:{mode:'single',indices:[i]}});}
   const camels=s.market.flatMap((c,i)=>c==='camel'?[i]:[]); if(camels.length)add(`낙타 ${camels.length}마리 가져오기`,`Tomar ${camels.length} camellos`,{type:'take',payload:{mode:'camels'}});
   const combos=(size:number,max:number):number[][]=>{const out:number[][]=[];const walk=(from:number,cur:number[])=>{if(cur.length===size){out.push(cur);return;}for(let i=from;i<max;i++)walk(i+1,[...cur,i]);};walk(0,[]);return out;};
   const exchangeable=s.market.flatMap((c,i)=>c==='camel'?[]:[i]);
   for(let count=2;count<=Math.min(5,s.hands[p].length,exchangeable.length);count++)for(const hi of combos(count,s.hands[p].length))for(const mi of combos(count,exchangeable.length))add(`${count}장 교환`,`Cambiar ${count} cartas`,{type:'take',payload:{mode:'exchange',handIndices:hi,marketIndices:mi.map(i=>exchangeable[i])}});
   for(const g of goods){const n=s.hands[p].filter(c=>c===g).length;if(s.piles[g].length)for(let count=minimumSale(g);count<=n;count++)add(`${label[g].ko} ${count}장 판매`,`Vender ${label[g].es} (${count})`,{type:'sell',payload:{good:g,count}});}
 }
 return {turn:s.active,phase:s.result?'finished':s.active===p?'choose':'waiting',board:{market:[...s.market],marketCards:s.market.map((good,i)=>({id:cardIds.market[i],good})),deckCount:s.deck.length,round:s.round,tokens:{...s.tokens},piles:Object.fromEntries(goods.map(g=>[g,s.piles[g].map((value,index)=>index===0?value:null)])),bonusTileCounts:{3:s.bonusTiles[3].length,4:s.bonusTiles[4].length,5:s.bonusTiles[5].length},camelBadges:{...s.camelBadges},roundsWon:{...s.roundsWon},herdCounts:{p1:s.herds.p1.length,p2:s.herds.p2.length},roundHistory,roundSummary:roundHistory.at(-1)??null,actionLog:log,scoreBreakdown:{p1:scoreBreakdown(s,'p1'),p2:scoreBreakdown(s,'p2')}},ownHand:[...s.hands[p]],handCards:s.hands[p].map((good,i)=>({id:cardIds.hands[p][i],good})),opponentCount:s.hands[otherPlayer(p)].length,status:s.result?'finished':s.active===p?'Your turn':'Opponent turn',result:s.result,log,actions};
}
function validate(s:JaipurState,p:PlayerId,a:GameAction):string|null{
 if(!players.includes(p)||!a||typeof a.type!=='string')return 'Invalid player or action';
 if(s.result)return 'Game is finished'; if(s.active!==p)return 'Not your turn'; const x=a.payload??{};
 if(a.type==='sell'){
   const g=x.good; const n=x.count; if(!goods.includes(g as any)||!Number.isInteger(n)||Number(n)<minimumSale(g)||Number(n)>s.hands[p].filter(c=>c===g).length||!s.piles[g as Exclude<JaipurGood,'camel'>].length)return 'Invalid sale'; return null;
 }
 if(a.type!=='take')return 'Unknown action';
 const mode=x.mode; if(mode==='single') {const ix=x.indices;if(!Array.isArray(ix)||ix.length!==1||!Number.isInteger(ix[0])||ix[0]<0||ix[0]>=s.market.length)return 'Invalid market selection';if(s.market[ix[0]]==='camel')return 'Take camels as a group';if(s.hands[p].length>=7)return 'Hand is full';return null;}
 if(mode==='camels')return s.market.includes('camel')?null:'No camels in market';
 if(mode==='exchange'){
  const hi=x.handIndices,mi=x.marketIndices;if(!Array.isArray(hi)||!Array.isArray(mi)||hi.length!==mi.length||hi.length<2||hi.length>5)return 'Exchange needs 2–5 cards';
  if(new Set(hi).size!==hi.length||hi.some(i=>!Number.isInteger(i)||i<0||i>=s.hands[p].length))return 'Invalid hand selection';
  if(new Set(mi).size!==mi.length||mi.some(i=>!Number.isInteger(i)||i<0||i>=s.market.length))return 'Invalid market selection';
  if(mi.some(i=>s.market[i]==='camel'))return 'Camels must be taken as a group'; return null;
 }
 return 'Unknown take mode';
}
function apply(s:JaipurState,p:PlayerId,a:GameAction):JaipurState{
 const err=validate(s,p,a);if(err)throw new Error(err);let n:JaipurState={...s,market:[...s.market],deck:[...s.deck],hands:{...s.hands,[p]:[...s.hands[p]]},herds:{...s.herds,[p]:[...s.herds[p]]},tokens:{...s.tokens},piles:Object.fromEntries(goods.map(g=>[g,[...s.piles[g]]])) as JaipurState['piles'],bonusTiles:{3:[...s.bonusTiles[3]],4:[...s.bonusTiles[4]],5:[...s.bonusTiles[5]]},camelBadges:{...s.camelBadges},roundsWon:{...s.roundsWon},active:otherPlayer(p),turnCount:s.turnCount+1}; const x=a.payload??{};
 n.cardIds=identities(s);
 n.ledger=Object.fromEntries(players.map(seat=>{const old=s.ledger?.[seat],known=!!old?.known&&old.goods+old.bonus===s.tokens[seat];return [seat,known?{...old}:{goods:s.tokens[seat],bonus:0,known:false}];})) as NonNullable<JaipurState['ledger']>;
 const actor=p;
 if(a.type==='take'){
  if(x.mode==='single'){
   const i=(x.indices as number[])[0],card=n.market.splice(i,1)[0],id=n.cardIds.market.splice(i,1)[0];n.hands[p].push(card);n.cardIds.hands[p].push(id);
   n=appendEvent(n,{type:'take-single',actor,cards:[{id,good:card,slot:i}],title:{ko:`${label[card].ko} 가져오기`,es:`Tomaste ${label[card].es}`}});
   n=draw(n);
  }else if(x.mode==='camels'){
   const cards=n.market.flatMap((good,i)=>good==='camel'?[{id:n.cardIds!.market[i],good,slot:i}]:[]),keep:JaipurGood[]=[],ids:string[]=[];
   n.market.forEach((c,i)=>{if(c==='camel')n.herds[p].push(0);else{keep.push(c);ids.push(n.cardIds!.market[i]);}});n.market=keep;n.cardIds.market=ids;
   n=appendEvent(n,{type:'take-camels',actor,cards,title:{ko:`낙타 ${cards.length}마리 가져오기`,es:`Tomaste ${cards.length} camellos`}});
   while(n.market.length<5&&n.deck.length)n=draw(n);
  }else{
   const hi=[...(x.handIndices as number[])].sort((a,b)=>b-a),mi=[...(x.marketIndices as number[])].sort((a,b)=>b-a),given:JaipurCard[]=[],cards:JaipurCard[]=[];
   for(const i of hi)given.push({good:n.hands[p].splice(i,1)[0],id:n.cardIds.hands[p].splice(i,1)[0],slot:i});
   for(const i of mi)cards.push({good:n.market.splice(i,1)[0],id:n.cardIds.market.splice(i,1)[0],slot:i});
   n.hands[p].push(...cards.map(c=>c.good));n.cardIds.hands[p].push(...cards.map(c=>c.id));n.market.push(...given.map(c=>c.good));n.cardIds.market.push(...given.map(c=>c.id));
   n=appendEvent(n,{type:'exchange',actor,cards,given,title:{ko:`상품 ${cards.length}장 교환`,es:`Intercambio de ${cards.length} cartas`}});
  }
  const oldIds=new Set(identities(s).market),refill=n.market.flatMap((good,i)=>oldIds.has(n.cardIds!.market[i])||x.mode==='exchange'?[]:[{id:n.cardIds!.market[i],good,slot:i}]);
  if(refill.length)n=appendEvent(n,{type:'market-refill',cards:refill,title:{ko:'시장에 새 상품이 도착했어요',es:'Llegaron cartas nuevas al mercado'}});
 }else{
  const g=x.good as Exclude<JaipurGood,'camel'>,count=x.count as number,cards:JaipurCard[]=[],originalIds=identities(s).hands[p];
  for(let i=0;i<count;i++){const ix=n.hands[p].indexOf(g),id=n.cardIds.hands[p].splice(ix,1)[0];n.hands[p].splice(ix,1);cards.push({id,good:g,slot:originalIds.indexOf(id)});}
  const pile=n.piles[g],tokenValues:number[]=[];for(let i=0;i<count&&pile.length;i++)tokenValues.push(pile.shift()!);
  const goodsPoints=tokenValues.reduce((total,v)=>total+v,0);let bonus:JaipurEvent['bonus'];
  if(count>=3){const size=count>=5?5:count as 3|4;if(n.bonusTiles[size].length)bonus={size,value:n.bonusTiles[size].shift()!};}
  const points=goodsPoints+(bonus?.value??0);n.tokens[p]+=points;n.ledger![p].goods+=goodsPoints;n.ledger![p].bonus+=bonus?.value??0;
  n=appendEvent(n,{type:'sale',actor,cards,tokenValues,goodsPoints,bonus,points,title:{ko:`${label[g].ko} ${count}장 판매`,es:`Venta de ${count} cartas de ${label[g].es}`}});
  if(bonus)n=appendEvent(n,{type:'bonus',actor,bonus,points:bonus.value,title:{ko:`${bonus.size}장 판매 보너스 공개`,es:`Bono por vender ${bonus.size===5?'5 o más':bonus.size} cartas`}});
 }
 if(isRoundOver(n))return endRound(n);
 return n;
}
export const jaipurEngine:GameEngine<JaipurState>={id:'jaipur',createInitialState(seed){
 const base:JaipurState={rngSeed:seed>>>0,active:'p1',deck:[],market:[],hands:{p1:[],p2:[]},herds:{p1:[],p2:[]},tokens:{p1:0,p2:0},piles:emptyPiles,bonusTiles:{3:[],4:[],5:[]},camelBadges:{p1:0,p2:0},roundsWon:{p1:0,p2:0},round:1,result:null,turnCount:0};return newRound(base,seed>>>0);
 },validateAction:validate,applyAction:apply,getPlayerView(s,p){return makeView(s,p)},getResult(s){return s.result}};
export const jaipurRules={ko:['목표: 3라운드 중 2라운드를 먼저 이기세요. 상품을 모아 팔아 토큰 점수를 얻고, 낙타 다수 토큰은 5점이며 상품 점수와 합산해 라운드 승자를 정합니다.','차례에는 시장 상품 한 장 가져오기, 시장의 낙타 전부 가져오기, 손과 시장에서 2장 이상 같은 수로 교환하기, 또는 한 종류 상품 팔기 중 하나를 합니다. 손패는 7장까지이며 낙타는 손패 제한에 포함되지 않습니다.','상품을 팔면 그 종류의 가장 높은 토큰부터 얻습니다. 3/4/5장 이상 판매 보너스는 각각 1–3/4–6/8–10점이며, 보너스 가치는 뒤집을 때 확인합니다. 3종류 토큰 더미가 비거나 덱이 비면 라운드가 끝납니다.'],es:['Objetivo: gana primero 2 de hasta 3 rondas. Reúne y vende mercancías para obtener puntos; la mayoría de camellos vale 5 puntos y se suma a las fichas de mercancía para decidir la ronda.','En tu turno toma una mercancía del mercado, todos los camellos, intercambia al menos 2 cartas de la mano por la misma cantidad del mercado, o vende mercancías de un solo tipo. La mano admite 7 cartas; los camellos no cuentan.','Al vender se toman primero las fichas de mayor valor. Los bonos por vender 3/4/5 o más cartas valen 1–3/4–6/8–10 puntos y su valor se descubre al tomar cada ficha. La ronda termina cuando se agotan 3 pilas de mercancías o el mazo.']};
