import { otherPlayer, seededRandom, shuffle, type GameAction, type GameEngine, type GameResult, type PlayerId } from '../core/types';

export type MinhwatuKind = 'bright' | 'animal' | 'ribbon' | 'plain';
export type MinhwatuRibbonSet = 'red' | 'blue' | 'grass' | 'rain';
export const MINHWATU_GODORI_BONUS = 50;
export interface MinhwatuCard {
  id: string;
  month: number;
  flower: { ko: string; es: string };
  kind: MinhwatuKind;
  points: 20 | 10 | 5 | 0;
  badge: { ko: string; es: string };
  ribbonSet?: MinhwatuRibbonSet;
}
export interface MinhwatuYaku {
  id: string; label: { ko: string; es: string }; cardIds: string[];
  have: number; need: number; complete: boolean; bonus: number;
}
export interface MinhwatuBreakdown {
  counts: Record<MinhwatuKind, number>; basePoints: number; yakus: MinhwatuYaku[];
  ownYakuPoints: number; opponentYakuPoints: number; finalScore: number;
}
export interface MinhwatuEvent {
  sequence: number; type: 'deal' | 'play' | 'draw' | 'capture' | 'special' | 'turn' | 'win';
  actor?: PlayerId; title: { ko: string; es: string }; cards?: MinhwatuCard[];
  origins?: Record<string, 'table' | 'draw'>; scoreChanges?: Record<PlayerId, number>;
  yaku?: { id: string; label: { ko: string; es: string }; bonus: number };
  winner?: PlayerId | 'draw';
}
type PendingCapture = { card: MinhwatuCard } | null;
export interface MinhwatuState {
  seed: number;
  rulesVersion?: 2;
  events?: MinhwatuEvent[];
  turn: PlayerId;
  hands: Record<PlayerId, MinhwatuCard[]>;
  deck: MinhwatuCard[];
  table: MinhwatuCard[];
  captures: Record<PlayerId, MinhwatuCard[]>;
  pending: PendingCapture;
  phase: 'play' | 'capture-draw' | 'finished';
  result: GameResult | null;
}

const flowers: Record<number, { ko: string; es: string }> = {
  1:{ko:'소나무',es:'pino'},2:{ko:'매화',es:'ciruelo'},3:{ko:'벚꽃',es:'cerezo'},4:{ko:'등나무',es:'glicinia'},
  5:{ko:'창포',es:'iris'},6:{ko:'모란',es:'peonía'},7:{ko:'싸리',es:'lespedeza'},8:{ko:'억새',es:'pampas'},
  9:{ko:'국화',es:'crisantemo'},10:{ko:'단풍',es:'arce'},11:{ko:'오동나무',es:'paulownia'},12:{ko:'비',es:'lluvia'},
};
const badgeByKind: Record<MinhwatuKind,{ko:string;es:string}> = {
  bright:{ko:'광',es:'brillante'},animal:{ko:'열끗',es:'animal'},ribbon:{ko:'띠',es:'cinta'},plain:{ko:'피',es:'simple'},
};
const cardKinds: Record<number,Array<{kind:MinhwatuKind;ribbonSet?:MinhwatuRibbonSet;badge?:{ko:string;es:string}}>> = {
  1:[{kind:'bright',badge:{ko:'학',es:'grulla'}},{kind:'ribbon',ribbonSet:'red',badge:{ko:'홍단',es:'poesía roja'}},{kind:'plain'},{kind:'plain'}],
  2:[{kind:'animal',badge:{ko:'꾀꼬리',es:'ruiseñor'}},{kind:'ribbon',ribbonSet:'red',badge:{ko:'홍단',es:'poesía roja'}},{kind:'plain'},{kind:'plain'}],
  3:[{kind:'bright',badge:{ko:'막',es:'cortina'}},{kind:'ribbon',ribbonSet:'red',badge:{ko:'홍단',es:'poesía roja'}},{kind:'plain'},{kind:'plain'}],
  4:[{kind:'animal',badge:{ko:'두견새',es:'cuco'}},{kind:'ribbon',ribbonSet:'grass',badge:{ko:'초단',es:'cinta verde'}},{kind:'plain'},{kind:'plain'}],
  5:[{kind:'animal',badge:{ko:'다리',es:'puente'}},{kind:'ribbon',ribbonSet:'grass',badge:{ko:'초단',es:'cinta verde'}},{kind:'plain'},{kind:'plain'}],
  6:[{kind:'animal',badge:{ko:'나비',es:'mariposa'}},{kind:'ribbon',ribbonSet:'blue',badge:{ko:'청단',es:'cinta azul'}},{kind:'plain'},{kind:'plain'}],
  7:[{kind:'animal',badge:{ko:'멧돼지',es:'jabalí'}},{kind:'ribbon',ribbonSet:'grass',badge:{ko:'초단',es:'cinta verde'}},{kind:'plain'},{kind:'plain'}],
  8:[{kind:'bright',badge:{ko:'달',es:'luna'}},{kind:'animal',badge:{ko:'기러기',es:'gansos'}},{kind:'plain'},{kind:'plain'}],
  9:[{kind:'animal',badge:{ko:'술잔',es:'copa de sake'}},{kind:'ribbon',ribbonSet:'blue',badge:{ko:'청단',es:'cinta azul'}},{kind:'plain'},{kind:'plain'}],
  10:[{kind:'animal',badge:{ko:'사슴',es:'ciervo'}},{kind:'ribbon',ribbonSet:'blue',badge:{ko:'청단',es:'cinta azul'}},{kind:'plain'},{kind:'plain'}],
  11:[{kind:'bright',badge:{ko:'봉황',es:'fénix'}},{kind:'plain'},{kind:'plain'},{kind:'plain'}],
  12:[{kind:'bright',badge:{ko:'비광',es:'hombre bajo la lluvia'}},{kind:'animal',badge:{ko:'제비',es:'golondrina'}},{kind:'ribbon',ribbonSet:'rain',badge:{ko:'비띠',es:'cinta de lluvia'}},{kind:'plain'}],
};
function makeDeck(): MinhwatuCard[] {
  return Object.entries(cardKinds).flatMap(([month,kinds])=>kinds.map((card,index)=>({
    id:`${month}-${index+1}`,month:Number(month),flower:{...flowers[Number(month)]},kind:card.kind,
    points:card.kind==='bright'?20:card.kind==='animal'?10:card.kind==='ribbon'?5:0,
    badge:{...(card.badge??badgeByKind[card.kind])},...(card.ribbonSet?{ribbonSet:card.ribbonSet}:{}),
  })));
}
const cloneCard=(card:MinhwatuCard):MinhwatuCard=>({...card,flower:{...card.flower},badge:{...card.badge}});
const count=(cards:MinhwatuCard[],test:(card:MinhwatuCard)=>boolean)=>cards.filter(test).length;
const yakuRules = [
  {id:'hongdan',label:{ko:'홍단',es:'Hongdan'},cardIds:['1-2','2-2','3-2'],bonus:30},
  {id:'cheongdan',label:{ko:'청단',es:'Cheongdan'},cardIds:['6-2','9-2','10-2'],bonus:30},
  {id:'chodan',label:{ko:'초단',es:'Chodan'},cardIds:['4-2','5-2','7-2'],bonus:30},
  {id:'godori',label:{ko:'고도리',es:'Godori'},cardIds:['2-1','4-1','8-2'],bonus:MINHWATU_GODORI_BONUS},
  ...([11,5,10,12] as const).map(month=>({id:`month-${month}`,label:{ko:`${month}월 완성`,es:`Mes ${month} completo`},cardIds:[1,2,3,4].map(index=>`${month}-${index}`),bonus:month===11?40:20})),
];
export function minhwatuYakuProgress(cards: MinhwatuCard[], godoriBonus = MINHWATU_GODORI_BONUS): MinhwatuYaku[] {
  const ids=new Set(cards.map(card=>card.id));
  return yakuRules.map(rule=>{const have=rule.cardIds.filter(id=>ids.has(id)).length;return {...rule,bonus:rule.id==='godori'?godoriBonus:rule.bonus,label:{...rule.label},cardIds:[...rule.cardIds],have,need:rule.cardIds.length,complete:have===rule.cardIds.length};});
}
export function scoreMinhwatuYakus(cards:MinhwatuCard[],godoriBonus = MINHWATU_GODORI_BONUS):number {
  return minhwatuYakuProgress(cards,godoriBonus).reduce((sum,yaku)=>sum+(yaku.complete?yaku.bonus:0),0);
}
export function minhwatuScoreBreakdown(captures:Record<PlayerId,MinhwatuCard[]>,godoriBonus = MINHWATU_GODORI_BONUS):Record<PlayerId,MinhwatuBreakdown> {
  const yakus={p1:minhwatuYakuProgress(captures.p1,godoriBonus),p2:minhwatuYakuProgress(captures.p2,godoriBonus)};
  const bonuses={p1:scoreMinhwatuYakus(captures.p1,godoriBonus),p2:scoreMinhwatuYakus(captures.p2,godoriBonus)};
  const seat=(p:PlayerId):MinhwatuBreakdown=>{
    const cards=captures[p],basePoints=cards.reduce((sum,card)=>sum+card.points,0),opponentYakuPoints=bonuses[otherPlayer(p)];
    return {counts:{bright:count(cards,c=>c.kind==='bright'),animal:count(cards,c=>c.kind==='animal'),ribbon:count(cards,c=>c.kind==='ribbon'),plain:count(cards,c=>c.kind==='plain')},basePoints,yakus:yakus[p],ownYakuPoints:bonuses[p],opponentYakuPoints,finalScore:basePoints+2*bonuses[p]-opponentYakuPoints};
  };
  return {p1:seat('p1'),p2:seat('p2')};
}
function appendEvent(s:MinhwatuState,event:Omit<MinhwatuEvent,'sequence'>):void {
  const events=s.events??[],sequence=(events.at(-1)?.sequence??0)+1;
  s.events=[...events,{...event,sequence}].slice(-48);
}
function captureWithEvent(s:MinhwatuState,player:PlayerId,table:MinhwatuCard[],captures:Record<PlayerId,MinhwatuCard[]>,card:MinhwatuCard,source:'table'|'draw',targetIndex?:number):void {
  const before=scoreMinhwatuMatch(captures),oldYaku=minhwatuYakuProgress(captures[player]),oldCount=captures[player].length;
  if(!resolveCaptured(table,captures[player],card,targetIndex))return;
  const cards=captures[player].slice(oldCount).map(cloneCard),after=scoreMinhwatuMatch(captures);
  appendEvent(s,{type:'capture',actor:player,title:{ko:`${card.month}월 ${cards.length}장 획득`,es:`Captura de ${cards.length} cartas del mes ${card.month}`},cards,origins:Object.fromEntries(cards.map(c=>[c.id,c.id===card.id?source:'table'])),scoreChanges:{p1:after.p1-before.p1,p2:after.p2-before.p2}});
  for(const yaku of minhwatuYakuProgress(captures[player]))if(yaku.complete&&yaku.bonus>0&&!oldYaku.find(old=>old.id===yaku.id)?.complete)appendEvent(s,{type:'special',actor:player,title:{ko:`${yaku.label.ko} 완성 · 보너스 ${yaku.bonus}점`,es:`${yaku.label.es}: bono de ${yaku.bonus} pts`},yaku:{id:yaku.id,label:yaku.label,bonus:yaku.bonus}});
}
export function scoreMinhwatuCards(cards:MinhwatuCard[]):number {
  return cards.reduce((sum,card)=>sum+card.points,0)+scoreMinhwatuYakus(cards);
}
export function scoreMinhwatuMatch(captures:Record<PlayerId,MinhwatuCard[]>,godoriBonus = MINHWATU_GODORI_BONUS):Record<PlayerId,number> {
  const ownYakus={p1:scoreMinhwatuYakus(captures.p1,godoriBonus),p2:scoreMinhwatuYakus(captures.p2,godoriBonus)};
  const basePoints={p1:captures.p1.reduce((sum,card)=>sum+card.points,0),p2:captures.p2.reduce((sum,card)=>sum+card.points,0)};
  return {p1:basePoints.p1+2*ownYakus.p1-ownYakus.p2,p2:basePoints.p2+2*ownYakus.p2-ownYakus.p1};
}
function scoreResult(captures:Record<PlayerId,MinhwatuCard[]>):GameResult {
  const scores=scoreMinhwatuMatch(captures);
  if(scores.p1===scores.p2)return {winner:'draw',reason:'Equal Minhwatu scores / empate',scores};
  return {winner:scores.p1>scores.p2?'p1':'p2',reason:'Higher Minhwatu score / mayor puntuación',scores};
}
function matches(table:MinhwatuCard[],card:MinhwatuCard):number[]{return table.flatMap((c,index)=>c.month===card.month?[index]:[]);}
function resolveCaptured(table:MinhwatuCard[],captures:MinhwatuCard[],card:MinhwatuCard,targetIndex?:number):boolean {
  const indices=matches(table,card);
  if(!indices.length){table.push(card);return false;}
  const chosen=indices.length===3?indices:indices.length===1?indices:[targetIndex!];
  for(const index of [...chosen].sort((a,b)=>b-a))captures.push(table.splice(index,1)[0]);
  captures.push(card);
  return true;
}
function finishTurn(s:MinhwatuState,player:PlayerId,deck:MinhwatuCard[],table:MinhwatuCard[],captures:Record<PlayerId,MinhwatuCard[]>,hands=s.hands):MinhwatuState {
  const finished=deck.length===0&&hands.p1.length===0&&hands.p2.length===0;
  const next:MinhwatuState={...s,deck,table,captures,hands,pending:null,phase:finished?'finished':'play',turn:otherPlayer(player),result:finished?scoreResult(captures):null};
  if(finished)appendEvent(next,{type:'win',winner:next.result!.winner,title:{ko:next.result!.winner==='draw'?'민화투 무승부':'민화투 최종 정산',es:next.result!.winner==='draw'?'Empate en Minhwatu':'Resultado de Minhwatu'}});
  else appendEvent(next,{type:'turn',actor:next.turn,title:{ko:'다음 차례',es:'Siguiente turno'}});
  return next;
}
function finishAfterPlay(s:MinhwatuState,player:PlayerId,table:MinhwatuCard[],captures:Record<PlayerId,MinhwatuCard[]>,hands:Record<PlayerId,MinhwatuCard[]>):MinhwatuState {
  if(!s.deck.length)return finishTurn(s,player,[],table,captures,hands);
  const [drawn,...deck]=s.deck,indices=matches(table,drawn);
  appendEvent(s,{type:'draw',actor:player,title:{ko:`더미에서 ${drawn.month}월 공개`,es:`Sale una carta del mes ${drawn.month}`},cards:[cloneCard(drawn)]});
  if(indices.length===2)return {...s,turn:player,hands,deck,table,captures,pending:{card:drawn},phase:'capture-draw',result:null};
  captureWithEvent(s,player,table,captures,drawn,'draw');
  return finishTurn(s,player,deck,table,captures,hands);
}
function validate(s:MinhwatuState,p:PlayerId,a:GameAction):string|null {
  if(p!=='p1'&&p!=='p2')return 'Invalid player';
  if(s.result||s.phase==='finished')return 'Game is finished';
  if(p!==s.turn)return 'Not your turn';
  if(!a||typeof a.type!=='string')return 'Invalid action';
  if(a.type==='play'){
    if(s.phase!=='play')return 'Resolve the current capture first';
    const index=a.payload?.index,target=a.payload?.targetIndex;
    if(!Number.isInteger(index)||Number(index)<0||Number(index)>=s.hands[p].length)return 'Invalid hand index';
    const matchesForCard=matches(s.table,s.hands[p][Number(index)]);
    if(matchesForCard.length===2&&(!Number.isInteger(target)||!matchesForCard.includes(Number(target))))return 'Choose one matching table card';
    if(matchesForCard.length!==2&&target!==undefined)return 'A target is only needed for a duplicate month';
    return null;
  }
  if(a.type==='capture'){
    if(s.phase!=='capture-draw'||!s.pending)return 'No pending capture';
    const target=a.payload?.targetIndex,found=matches(s.table,s.pending.card);
    return found.length===2&&Number.isInteger(target)&&found.includes(Number(target))?null:'Choose one matching table card';
  }
  return 'Unknown action';
}
function apply(s:MinhwatuState,p:PlayerId,a:GameAction):MinhwatuState {
  const error=validate(s,p,a);if(error)throw new Error(error);
  s={...s,rulesVersion:2,events:[...(s.events??[])]};
  const hands:Record<PlayerId,MinhwatuCard[]>={p1:[...s.hands.p1],p2:[...s.hands.p2]};
  const table=[...s.table],deck=[...s.deck],captures:Record<PlayerId,MinhwatuCard[]>={p1:[...s.captures.p1],p2:[...s.captures.p2]};
  if(a.type==='capture'){
    const pending=s.pending!,index=Number(a.payload!.targetIndex);
    captureWithEvent(s,p,table,captures,pending.card,'draw',index);
    return finishTurn(s,p,deck,table,captures,hands);
  }
  const handIndex=Number(a.payload!.index),card=hands[p].splice(handIndex,1)[0],indices=matches(table,card);
  appendEvent(s,{type:'play',actor:p,title:{ko:`${card.month}월 ${card.badge.ko} 내기`,es:`Jugada: mes ${card.month}, ${card.badge.es}`},cards:[cloneCard(card)]});
  captureWithEvent(s,p,table,captures,card,'table',indices.length===2?Number(a.payload!.targetIndex):undefined);
  return finishAfterPlay(s,p,table,captures,hands);
}
const actionLabel=(ko:string,es:string,action:GameAction)=>({label:{ko,es},action});
// Museum reference: 2-player deal and card classes; BGA reference: capture flow and Yaku transfer scoring.
// https://sekaiyugi.com/old/games/hwatu-4.html · https://boardgamearena.com/doc/Gamehelpminhwatu
export const minhwatuRules={
  ko:[
    '선택한 민화투 규칙: 2인 게임은 48장 전체를 사용해 각자 10장, 바닥 8장, 더미 20장으로 시작합니다. 3인 분배는 구현하지 않았습니다. 각 월은 네 장이며 전통 화투 그림과 월·꽃·광/열끗/띠/피 종류를 표시합니다.',
    '차례에는 손에서 한 장을 내고 같은 월의 바닥 카드와 짝지어 가져옵니다. 같은 월 바닥 카드가 두 장이면 하나를 고릅니다. 세 장이면 세 장 전부 가져옵니다. 짝이 없으면 낸 카드는 바닥에 놓습니다. 이어 더미 맨 위 카드를 공개해 같은 규칙으로 처리합니다.',
    '더미와 양쪽 손패가 모두 비면 점수를 셉니다. 광은 20점, 열은 10점, 띠는 5점, 피는 0점입니다. 선택한 한국식 보너스: 11월 네 장 40점, 5·10·12월 네 장 각각 20점, 홍단(1·2·3월), 청단(6·9·10월), 초단(4·5·7월)은 각각 30점입니다. 고도리(2·4·8월 새패 세 장)는 50점 보너스이며, 광과 피는 획득 수량을 표시합니다. 고스톱의 피 교환, 점수 배수, 고/스톱은 없습니다. BGA식 정산을 사용해 본 야쿠는 2배, 상대 야쿠 점수는 내 기본점수에서 차감합니다. 선택 규칙은 다섯 새 야쿠를 빼고 11월 완성 보너스를 40점으로 둡니다. 이 엔진은 한 라운드로 구성했습니다.',
  ],
  es:[
    'Reglas elegidas de Minhwatu: para dos personas se usan las 48 cartas; cada quien recibe 10, hay 8 en la mesa y quedan 20 en el mazo. No se implementa el reparto para tres. Cada mes tiene cuatro cartas; se muestran mes, flor y categoría, con ilustraciones tradicionales.',
    'En tu turno juega una carta y empareja con una carta de la mesa del mismo mes. Si hay dos, eliges una; si hay tres, capturas las tres. Sin coincidencia, la carta jugada queda en la mesa. Después se revela la carta superior del mazo y se aplica la misma regla.',
    'Cuando se agotan el mazo y ambas manos, se cuentan puntos: brillante 20, animal 10, cinta 5 y simple 0. Bonos coreanos elegidos: las cuatro cartas de noviembre valen 40 extra; las colecciones completas de mayo, octubre y diciembre dan 20 cada una; Hongdan (enero/febrero/marzo), Cheongdan (junio/septiembre/octubre) y Chodan (abril/mayo/julio) dan 30 cada conjunto. Usa el ajuste de BGA: tus yakus se multiplican por dos y los yakus rivales se restan de tus puntos base. Godori (las tres cartas de aves de febrero, abril y agosto) da un bono de 50 puntos. Las cartas brillantes y simples muestran su cantidad. Esta variante omite el yaku opcional de cinco aves y da 40 puntos a la colección de noviembre. No incluye intercambios de pi ni parar/seguir de Go-Stop; se juega una ronda.',
  ],
};
export const minhwatuEngine:GameEngine<MinhwatuState>={
  id:'minhwatu',
  createInitialState(seed){
    const cards=shuffle(makeDeck(),seededRandom(seed));
    return {seed:seed>>>0,rulesVersion:2,turn:'p1',hands:{p1:cards.slice(0,10),p2:cards.slice(10,20)},table:cards.slice(20,28),deck:cards.slice(28),captures:{p1:[],p2:[]},pending:null,phase:'play',result:null,events:[{sequence:1,type:'deal',title:{ko:'화투패를 나눴어요',es:'Las cartas están repartidas'},cards:cards.slice(20,28).map(cloneCard)}]};
  },
  validateAction:validate,
  applyAction:apply,
  getPlayerView(s,p){
    const actions:{label:{ko:string;es:string};action:GameAction}[]=[];
    if(!s.result&&s.turn===p&&s.phase==='play')s.hands[p].forEach((card,index)=>{
      const targetIndices=matches(s.table,card);
      if(targetIndices.length===2)targetIndices.forEach(targetIndex=>actions.push(actionLabel(`${card.month}월 ${card.badge.ko} → 바닥 ${targetIndex+1}번`,`Mes ${card.month} ${card.badge.es} → mesa ${targetIndex+1}`,{type:'play',payload:{index,targetIndex}})));
      else actions.push(actionLabel(`${card.month}월 ${card.badge.ko} 내기`,`Jugar mes ${card.month} ${card.badge.es}`,{type:'play',payload:{index}}));
    });
    if(!s.result&&s.turn===p&&(s.phase==='capture-draw')&&s.pending)matches(s.table,s.pending.card).forEach(targetIndex=>actions.push(actionLabel(`${s.pending!.card.month}월 카드와 바닥 ${targetIndex+1}번 가져오기`,`Capturar mes ${s.pending!.card.month} con mesa ${targetIndex+1}`,{type:'capture',payload:{targetIndex}})));
    // Completed legacy games retain the score rule used when they finished.
    const godoriBonus=s.result&&s.rulesVersion!==2?0:MINHWATU_GODORI_BONUS;
    const scores=scoreMinhwatuMatch(s.captures,godoriBonus);
    const hand=s.hands[p].map(cloneCard);
    const table=s.table.map(cloneCard);
    const captures={p1:s.captures.p1.map(cloneCard),p2:s.captures.p2.map(cloneCard)};
    const pending=s.pending?{...cloneCard(s.pending.card),source:'draw'}:null;
    return {game:'minhwatu',turn:s.turn,phase:s.phase,ownHand:hand,hand,opponentCount:s.hands[otherPlayer(p)].length,board:{table,captures,pendingCard:pending,deckCount:s.deck.length,remainingDeck:s.deck.length,scores,breakdown:minhwatuScoreBreakdown(s.captures,godoriBonus),rulesVersion:godoriBonus?2:1,actionLog:structuredClone(s.events??[])},log:structuredClone(s.events??[]),status:s.result?'finished':s.turn===p?'your-turn':'opponent-turn',result:s.result,actions};
  },
  getResult:s=>s.result,
};
