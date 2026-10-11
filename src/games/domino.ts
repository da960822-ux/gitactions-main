import { seededRandom, shuffle, type GameAction, type GameEngine, type GameResult, type PlayerId } from '../core/types';

type Domino = { a: number; b: number };
type Seat = PlayerId | 'b1' | 'b2';
type Mode = '1v1' | 'humans-vs-bots' | 'partners';
type Difficulty = 'easy' | 'normal' | 'hard';
type Settings = { difficulty: Difficulty; targetScore: 0 | 100 | 200; capicuaBonus: 0 | 25; pasoCorridoBonus: 0 | 25; tranqueRule: 'team' | 'lowest-player' };
type Event = { sequence: number; type: 'play'|'pass'|'turn'|'tranque'|'capicua'|'paso-corrido'|'round-end'|'score'|'win'|'round-start'|'configure'; actor?: Seat; title: { ko: string; es: string }; text?: { ko: string; es: string }; tile?: Domino; side?: 'left'|'right'; ends?: { left: number; right: number } | null; count?: number; points?: number; team?: PlayerId; round?: number };
type Placed = Domino & { by: Seat; side?: 'left'|'right'; sequence?: number };
type RoundResult = { winner: PlayerId | 'draw'; reason: string; pips: Record<PlayerId, number>; award: number; capicua: boolean; pasoCorrido: number; bonuses: Record<PlayerId, number>; scoreDelta: Record<PlayerId, number>; round: number };
type DominoState = { seed: number; turn: Seat; mode: Mode; hands: Record<Seat, Domino[]>; stock: Domino[]; board: Placed[]; ends: { left: number; right: number } | null; passes: number; opening: { player: Seat; tile: Domino }; result: GameResult | null; rulesVersion?: number; settings?: Settings; matchScores?: Record<PlayerId, number>; round?: number; roundResult?: RoundResult | null; log?: Event[]; lastPlacer?: Seat | null; pasoAwarded?: boolean; roundBonuses?: Record<PlayerId, number> };
const DEFAULT_SETTINGS: Settings = { difficulty: 'normal', targetScore: 0, capicuaBonus: 0, pasoCorridoBonus: 0, tranqueRule: 'team' };
const label = (ko: string, es: string, action: GameAction) => ({ label: { ko, es }, action });
export const dominoRules = {
  ko: ['선택 규칙: 2인 더블 식스 블록 도미노입니다. 0-0부터 6-6까지 28개 타일 중 각자 7개를 받고, 나머지는 사용하지 않습니다. 가장 높은 더블이 먼저 놓으며, 더블이 없으면 합이 가장 높은 타일로 시작합니다.', '양 끝 숫자에 맞춰 타일을 놓고, 놓을 수 없으면 패스합니다. 1대1에서는 두 번 연속 패스하면 막히고, 손패 점수가 낮은 사람이 이깁니다. 먼저 손패를 비워도 승리합니다.', '선택 가능한 추가 모드: 사람 2명 대 봇 2명, 또는 사람-봇 짝 대 사람-봇 짝입니다. 이 모드에서는 네 명이 돌아가며 놓고, 네 번 연속 패스하면 막힙니다. 팀 손패의 합계가 낮은 팀이 이깁니다. 봇은 자기 손패와 공개된 보드만 사용합니다.'],
  es: ['Variante elegida: dominó bloqueado doble-seis para dos personas. De las 28 fichas del 0-0 al 6-6, cada una recibe 7 y las demás no se usan. Empieza el doble más alto; si no hay dobles, empieza la ficha de mayor suma.', 'Coloca una ficha que coincida con un extremo o pasa si no puedes. En 1 contra 1, dos pases seguidos bloquean la partida y gana quien tenga menos puntos. También gana quien se queda sin fichas.', 'Modos opcionales: dos personas contra dos bots, o equipos mixtos de una persona y un bot. En estos modos juegan cuatro asientos y cuatro pases seguidos bloquean la partida. Gana el equipo con menos puntos restantes. Los bots solo usan su mano y el tablero público.'],
};
const seats = (mode: Mode): Seat[] => mode === '1v1' ? ['p1', 'p2'] : ['p1', 'b1', 'p2', 'b2'];
const isBot = (seat: Seat) => seat === 'b1' || seat === 'b2';
function score(hand: Domino[]) { return hand.reduce((n, t) => n + t.a + t.b, 0); }
function openingRank(t: Domino) { return t.a === t.b ? 100 + t.a : t.a + t.b; }
function legalOrient(t: Domino, side: 'left'|'right', ends: DominoState['ends']) { if (!ends) return true; return side === 'left' ? t.a === ends.left || t.b === ends.left : t.a === ends.right || t.b === ends.right; }
function sideWinner(mode: Mode, seat: Seat): PlayerId { if (mode === '1v1') return seat === 'p1' ? 'p1' : 'p2'; if (mode === 'partners') return seat === 'p1' || seat === 'b1' ? 'p1' : 'p2'; return seat === 'p1' || seat === 'p2' ? 'p1' : 'p2'; }
function teams(mode: Mode): Record<PlayerId, Seat[]> { return mode === 'partners' ? { p1: ['p1','b1'], p2: ['p2','b2'] } : mode === 'humans-vs-bots' ? { p1: ['p1','p2'], p2: ['b1','b2'] } : { p1: ['p1'], p2: ['p2'] }; }
function teamScores(s: DominoState): Record<PlayerId, number> { const t = teams(s.mode); return { p1: t.p1.reduce((n,x)=>n+score(s.hands[x]),0), p2: t.p2.reduce((n,x)=>n+score(s.hands[x]),0) }; }
function lowestPlayerScores(s: DominoState): Record<PlayerId, number> { const t=teams(s.mode); return {p1:Math.min(...t.p1.map(x=>score(s.hands[x]))),p2:Math.min(...t.p2.map(x=>score(s.hands[x])))}; }
function cloneLog(s: DominoState): Event[] { return [...(s.log ?? [])]; }
function event(s: DominoState, e: Omit<Event,'sequence'>): Event[] { const log=cloneLog(s); log.push({ ...e, sequence: (log.at(-1)?.sequence ?? 0)+1 }); return log.slice(-40); }
function nextSeat(s: DominoState, seat: Seat): Seat { const order = seats(s.mode); return order[(order.indexOf(seat) + 1) % order.length]; }
function resultFor(s: DominoState, winner: PlayerId|'draw', reason: string, pips: Record<PlayerId,number>): GameResult { return { winner, reason, scores: s.settings?.targetScore ? { ...(s.matchScores ?? {p1:0,p2:0}) } : pips }; }
function finishRound(s: DominoState, winner: PlayerId|'draw', reason: string, hands: DominoState['hands'], capicua=false): DominoState {
  const current = { ...s, hands }, pips = teamScores(current);
  if (s.rulesVersion !== 1) return { ...current, result: { winner, reason, scores: pips } };
  const bonuses = { p1: s.roundBonuses?.p1 ?? 0, p2: s.roundBonuses?.p2 ?? 0 };
  const scoreDelta = { ...bonuses };
  if (winner !== 'draw') scoreDelta[winner] += pips[winner === 'p1' ? 'p2' : 'p1'] + (capicua ? s.settings?.capicuaBonus ?? 0 : 0);
  const matchScores = { p1: (s.matchScores?.p1 ?? 0) + scoreDelta.p1, p2: (s.matchScores?.p2 ?? 0) + scoreDelta.p2 };
  const award = winner === 'draw' ? 0 : scoreDelta[winner];
  const rr: RoundResult = { winner, reason, pips, award, capicua, bonuses, scoreDelta, pasoCorrido: winner === 'draw' ? bonuses.p1 + bonuses.p2 : bonuses[winner], round: s.round ?? 1 };
  const blocked = reason.startsWith('Blocked game');
  let next: DominoState = { ...current, roundResult: rr, matchScores };
  const append = (e: Omit<Event, 'sequence'>) => { next = { ...next, log: event(next, { round: s.round ?? 1, ...e }) }; };
  if (blocked) append({ type: 'tranque', title: { ko: '트랑케 · 판이 막혔어요', es: '¡Tranque! Se cerró la mano' }, text: { ko: winner === 'draw' ? '남은 숫자 합이 같아 무승부입니다.' : s.settings?.tranqueRule === 'lowest-player' ? '각 팀에서 숫자 합이 가장 낮은 한 사람을 비교했습니다.' : '두 팀의 남은 숫자 합을 비교했습니다.', es: winner === 'draw' ? 'Los puntos restantes quedaron empatados.' : s.settings?.tranqueRule === 'lowest-player' ? 'Se comparó a la persona con menos puntos de cada equipo.' : 'Se compararon los puntos restantes de cada equipo.' } });
  if (capicua) append({ type: 'capicua', title: { ko: '카피쿠아!', es: '¡Capicúa!' }, text: { ko: '마지막 비더블 타일을 양쪽 끝 어디에든 놓을 수 있었어요.', es: 'La última ficha, sin ser doble, servía en cualquiera de los dos extremos.' }, points: s.settings?.capicuaBonus ?? 0, team: winner === 'draw' ? undefined : winner });
  append({ type: 'round-end', title: { ko: '라운드 정산', es: 'Cuenta de la mano' }, text: { ko: blocked ? '남은 패를 공개하고 점수를 정산합니다.' : '손패를 모두 놓았습니다. 남은 패를 공개합니다.', es: blocked ? 'Se muestran las fichas restantes y se cuentan los puntos.' : 'Una persona se quedó sin fichas. Se muestran las manos restantes.' }, team: winner === 'draw' ? undefined : winner, points: award });
  for (const team of ['p1', 'p2'] as const) if (scoreDelta[team] > 0) append({ type: 'score', title: { ko: '점수 획득', es: 'Puntos ganados' }, points: scoreDelta[team], team });
  const target = s.settings?.targetScore ?? 0;
  const reached = target > 0 && (matchScores.p1 >= target || matchScores.p2 >= target);
  const matchWinner: PlayerId|'draw' = target > 0 ? matchScores.p1 === matchScores.p2 ? 'draw' : matchScores.p1 > matchScores.p2 ? 'p1' : 'p2' : winner;
  if (target === 0 || reached) {
    next.result = resultFor(next, matchWinner, target ? 'Match target reached' : reason, pips);
    append({ type: 'win', title: { ko: matchWinner === 'draw' ? '무승부' : '경기 승리', es: matchWinner === 'draw' ? 'Empate' : '¡Partido ganado!' }, team: matchWinner === 'draw' ? undefined : matchWinner });
  }
  return next;
}
function play(state: DominoState, seat: Seat, action: GameAction): DominoState {
  const threshold = seats(state.mode).length;
  if (action.type === 'pass') {
    const passes = state.passes + 1, turn = nextSeat(state, seat);
    let next: DominoState = { ...state, passes, turn, log: event(state, { type: 'pass', actor: seat, title: { ko: '패스', es: 'Paso' }, ends: state.ends, count: passes }) };
    if (state.lastPlacer && turn === state.lastPlacer && passes === threshold - 1 && !state.pasoAwarded) {
      const team = sideWinner(state.mode, state.lastPlacer), points = state.settings?.pasoCorridoBonus ?? 0;
      next = { ...next, pasoAwarded: true, roundBonuses: { p1: state.roundBonuses?.p1 ?? 0, p2: state.roundBonuses?.p2 ?? 0 } };
      next.roundBonuses![team] += points;
      next.log = event(next, { type: 'paso-corrido', actor: state.lastPlacer, team, points, title: { ko: '파소 코리도', es: 'Paso corrido' }, text: { ko: '다른 자리들이 모두 패스해 마지막으로 놓은 사람에게 차례가 돌아왔어요. 판은 계속됩니다.', es: 'Los demás asientos pasaron y volvió el turno a quien jugó la última ficha. La mano continúa.' } });
    }
    if (passes === threshold) {
      const sc = state.settings?.tranqueRule === 'lowest-player' ? lowestPlayerScores(state) : teamScores(state);
      const winner = sc.p1 === sc.p2 ? 'draw' : sc.p1 < sc.p2 ? 'p1' : 'p2';
      return finishRound(next, winner, winner === 'draw' ? 'Blocked game tied on remaining pips' : 'Blocked game; lower team pip total wins', state.hands);
    }
    next.log = event(next, { type: 'turn', actor: turn, title: { ko: '다음 차례', es: 'Siguiente turno' } });
    return next;
  }
  const index = action.payload!.index as number, side = action.payload!.side as 'left'|'right', tile = state.hands[seat][index];
  const placed = !state.ends ? tile : side === 'left' ? tile.b === state.ends.left ? tile : { a: tile.b, b: tile.a } : tile.a === state.ends.right ? tile : { a: tile.b, b: tile.a };
  const ends = !state.ends ? { left: placed.a, right: placed.b } : side === 'left' ? { left: placed.a, right: state.ends.right } : { left: state.ends.left, right: placed.b };
  const hands = { ...state.hands, [seat]: state.hands[seat].filter((_, i) => i !== index) };
  const sequence = (state.log?.at(-1)?.sequence ?? 0) + 1;
  let next: DominoState = { ...state, hands, board: [...state.board, { ...placed, by: seat, side, sequence }], ends, passes: 0, lastPlacer: seat, pasoAwarded: false, turn: nextSeat(state, seat), log: event(state, { type: 'play', actor: seat, title: { ko: `${tile.a}|${tile.b} 놓기`, es: `Ficha ${tile.a}|${tile.b}` }, tile: { ...placed }, side, ends, count: hands[seat].length }) };
  const capicua = tile.a !== tile.b && !!state.ends && ((tile.a === state.ends.left && tile.b === state.ends.right) || (tile.b === state.ends.left && tile.a === state.ends.right));
  if (!hands[seat].length) return finishRound(next, sideWinner(state.mode, seat), 'A player played all dominoes', hands, capicua);
  next.log = event(next, { type: 'turn', actor: next.turn, title: { ko: '다음 차례', es: 'Siguiente turno' } });
  return next;
}

type PublicBotContext = { actor?: Seat; mode?: Mode; passes?: number; counts?: Partial<Record<Seat,number>>; log?: Event[]; tranqueRule?: Settings['tranqueRule'] };
type BotMove = { tile: Domino; index: number; side: 'left'|'right'; ends: { left: number; right: number } };
const allTiles = Array.from({length:7},(_,a)=>Array.from({length:7-a},(_,i)=>({a,b:a+i}))).flat();
const tileId = (tile: Domino) => `${Math.min(tile.a,tile.b)}-${Math.max(tile.a,tile.b)}`;
const matches = (tile: Domino,pip: number) => tile.a===pip||tile.b===pip;
function placedEnds(tile: Domino, side: 'left'|'right', current: DominoState['ends']) {
  if (!current) return {left:tile.a,right:tile.b};
  // The left end is the tile's b face; the right end is its a face.
  const oriented = side==='left' ? tile.b===current.left ? tile : {a:tile.b,b:tile.a} : tile.a===current.right ? tile : {a:tile.b,b:tile.a};
  return side==='left' ? {left:oriented.a,right:current.right} : {left:current.left,right:oriented.b};
}
function legalMoves(hand: Domino[], ends: DominoState['ends']): BotMove[] {
  return hand.flatMap((tile,index)=>(['left','right'] as const).filter(side=>legalOrient(tile,side,ends)).map(side=>({tile,index,side,ends:placedEnds(tile,side,ends)})));
}
function teamOf(mode: Mode, seat: Seat) { return mode==='partners' ? seat==='p1'||seat==='b1'?'p1':'p2' : mode==='humans-vs-bots' ? seat==='p1'||seat==='p2'?'p1':'p2' : seat==='p1'?'p1':'p2'; }
function following(mode: Mode, seat: Seat, offset: number): Seat { const order=seats(mode),i=order.indexOf(seat); return order[(i+offset)%order.length]; }
function currentRoundEvents(context: PublicBotContext, board: Placed[]) {
  const log=context.log??[],roundStart=log.map(event=>event.type).lastIndexOf('round-start');
  // Logs are capped at 40 entries. If round-start has fallen out, the first
  // tile on the current board is a safe lower bound for current-round events.
  const firstBoardSequence=Math.min(...board.map(tile=>tile.sequence??Infinity));
  const startSequence=roundStart>=0 ? log[roundStart].sequence : Number.isFinite(firstBoardSequence) ? firstBoardSequence : Infinity;
  return log.filter(event=>event.sequence>startSequence);
}
function passVoids(context: PublicBotContext, board: Placed[]) {
  const voids=new Map<Seat,Set<number>>();
  for(const event of currentRoundEvents(context,board)) if(event.type==='pass'&&event.actor&&event.ends) {
    const values=voids.get(event.actor)??new Set<number>();
    values.add(event.ends.left); values.add(event.ends.right); voids.set(event.actor,values);
  }
  return voids;
}
function unseenTiles(hand: Domino[],board: Placed[]) {
  const known=new Set([...hand,...board].map(tileId));
  return allTiles.filter(tile=>!known.has(tileId(tile)));
}
function probabilityCanPlay(seat: Seat, ends: {left:number;right:number}, unseen: Domino[], voids: Map<Seat,Set<number>>, counts: Partial<Record<Seat,number>>) {
  const forbidden=voids.get(seat)??new Set<number>();
  const eligible=unseen.filter(tile=>!forbidden.has(tile.a)&&!forbidden.has(tile.b));
  const count=Math.max(0,Math.min(eligible.length,counts[seat]??0));
  const matching=eligible.filter(tile=>matches(tile,ends.left)||matches(tile,ends.right)).length;
  let none=1;
  for(let i=0;i<count;i++) none*=Math.max(0,eligible.length-matching-i)/Math.max(1,eligible.length-i);
  return 1-none;
}
function allySignal(ally: Seat, ends: {left:number;right:number}, context: PublicBotContext, board: Placed[], voids: Map<Seat,Set<number>>) {
  const last=currentRoundEvents(context,board).slice().reverse().find(event=>event.type==='play'&&event.actor===ally&&event.tile);
  if(!last?.tile) return 0;
  const allyVoids=voids.get(ally)??new Set<number>();
  const faces=[last.tile.a,last.tile.b].filter((value,index,values)=>values.indexOf(value)===index);
  return faces.some(pip=>(pip===ends.left||pip===ends.right)&&!allyVoids.has(pip)) ? 2.2 : 0;
}
function handSupport(hand: Domino[], ends: {left:number;right:number}) {
  return hand.reduce((sum,tile)=>sum+Number(matches(tile,ends.left))+Number(matches(tile,ends.right)),0);
}
function futureReach(hand: Domino[], ends: {left:number;right:number}) {
  let best=0;
  for(const first of legalMoves(hand,ends)) {
    const afterFirst=hand.filter((_,index)=>index!==first.index);
    const firstSupport=handSupport(afterFirst,first.ends);
    for(const second of legalMoves(afterFirst,first.ends)) {
      const afterSecond=afterFirst.filter((_,index)=>index!==second.index);
      const score=first.tile.a+first.tile.b+handSupport(afterSecond,second.ends)*0.65+firstSupport*0.2;
      best=Math.max(best,score);
    }
    best=Math.max(best,first.tile.a+first.tile.b+firstSupport*0.45);
  }
  return best;
}
function rngFrom(publicText: string) {
  let state=2166136261;
  for(let i=0;i<publicText.length;i++) state=Math.imul(state^publicText.charCodeAt(i),16777619)>>>0;
  return () => { state=(Math.imul(state,1664525)+1013904223)>>>0; return state/0x1_0000_0000; };
}
function sampleUnknownHands(unseen: Domino[], actor: Seat, mode: Mode, counts: Partial<Record<Seat,number>>, voids: Map<Seat,Set<number>>, random: () => number) {
  const originalSeats=seats(mode).filter(seat=>seat!==actor),needed=new Map(originalSeats.map(seat=>[seat,Math.max(0,counts[seat]??7)]));
  let workBudget=64;
  const pick=(remaining:Domino[], pending:Seat[], result:Map<Seat,Domino[]>):Map<Seat,Domino[]>|null=>{
    if(!pending.length) return result;
    const options=pending.map(seat=>({seat,eligible:remaining.filter(tile=>{const blocked=voids.get(seat)??new Set<number>();return !blocked.has(tile.a)&&!blocked.has(tile.b);})}));
    options.sort((a,b)=>a.eligible.length-b.eligible.length);
    const {seat,eligible}=options[0],count=needed.get(seat)??0;
    if(eligible.length<count) return null;
    const restSeats=pending.filter(value=>value!==seat);
    for(let attempt=0;attempt<48&&workBudget>0;attempt++,workBudget--) {
      const shuffled=eligible.slice();
      for(let i=shuffled.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
      const picked=shuffled.slice(0,count),pickedIds=new Set(picked.map(tileId)),nextRemaining=remaining.filter(tile=>!pickedIds.has(tileId(tile)));
      if(restSeats.some(other=>nextRemaining.filter(tile=>{const blocked=voids.get(other)??new Set<number>();return !blocked.has(tile.a)&&!blocked.has(tile.b);}).length<(needed.get(other)??0))) continue;
      const next=new Map(result);next.set(seat,picked);
      const complete=pick(nextRemaining,restSeats,next);if(complete)return complete;
    }
    return null;
  };
  return pick(unseen,originalSeats,new Map());
}
function sampledRollout(move: BotMove, hand: Domino[], actor: Seat, mode: Mode, board: Placed[], ends: DominoState['ends'], context: PublicBotContext, sampled: Map<Seat,Domino[]>) {
  const hands:DominoState['hands']={p1:[],p2:[],b1:[],b2:[]};
  hands[actor]=hand.slice();
  for(const [seat,tiles] of sampled) hands[seat]=tiles.slice();
  const known=new Set([...hand,...board,...Array.from(sampled.values()).flat()].map(tileId));
  let state:DominoState={seed:0,turn:actor,mode,hands,stock:allTiles.filter(tile=>!known.has(tileId(tile))),board:board.map(tile=>({...tile})),ends:ends?{...ends}:null,passes:context.passes??0,opening:{player:actor,tile:move.tile},result:null,rulesVersion:1,settings:{...DEFAULT_SETTINGS,tranqueRule:context.tranqueRule??'team'},matchScores:{p1:0,p2:0},round:1,roundResult:null,log:(context.log??[]).slice(),lastPlacer:board.at(-1)?.by??null,pasoAwarded:currentRoundEvents(context,board).some(event=>event.type==='paso-corrido'),roundBonuses:{p1:0,p2:0}};
  state=play(state,actor,{type:'play',payload:{index:move.index,side:move.side}});
  for(let step=0;step<60&&!state.roundResult&&!state.result;step++) {
    const seat=state.turn,seatHand=state.hands[seat],moves=legalMoves(seatHand,state.ends);
    let chosen:BotMove|undefined,chosenScore=-Infinity;
    for(const candidate of moves) {const rank=utility(candidate,seatHand,state.board,state.ends,{},'normal',[],new Map());if(rank>chosenScore){chosen=candidate;chosenScore=rank;}}
    const action:GameAction=chosen?{type:'play',payload:{index:chosen.index,side:chosen.side}}:{type:'pass'};
    state=play(state,seat,action);
  }
  const result=state.roundResult;
  if(!result) return 0;
  if(result.winner==='draw') return 0;
  const ownTeam=teamOf(mode,actor),other=ownTeam==='p1'?'p2':'p1',margin=(result.pips[other]-result.pips[ownTeam])*0.001;
  return result.winner===ownTeam?1+margin:-1-margin;
}
function hardRolloutWorlds(hand: Domino[], actor: Seat, mode: Mode, board: Placed[], context: PublicBotContext, unseen: Domino[], voids: Map<Seat,Set<number>>) {
  const text=JSON.stringify({actor,mode,hand:hand.map(tileId).sort(),board:board.map(tile=>[tile.a,tile.b,tile.by,tile.sequence]),counts:context.counts,passes:context.passes,log:currentRoundEvents(context,board).map(event=>[event.sequence,event.type,event.actor,event.ends])});
  const random=rngFrom(text),worlds:Map<Seat,Domino[]>[]=[];
  for(let i=0;i<16;i++) {const world=sampleUnknownHands(unseen,actor,mode,context.counts??{},voids,random);if(world)worlds.push(world);}
  return worlds;
}
function hardRolloutScore(move: BotMove, hand: Domino[], actor: Seat, mode: Mode, board: Placed[], ends: DominoState['ends'], context: PublicBotContext, worlds: Map<Seat,Domino[]>[]) {
  if(!worlds.length) return 0;
  return worlds.reduce((total,world)=>total+sampledRollout(move,hand,actor,mode,board,ends,context,world),0)/worlds.length;
}
function utility(move: BotMove, hand: Domino[], board: Placed[], ends: DominoState['ends'], context: PublicBotContext, difficulty: Difficulty, unseen: Domino[], voids: Map<Seat,Set<number>>) {
  const rest=hand.filter((_,index)=>index!==move.index),pips=move.tile.a+move.tile.b;
  if(!rest.length) return 1_000_000+pips+(move.tile.a===move.tile.b?move.tile.a:0);
  const support=handSupport(rest,move.ends),leftSupport=rest.filter(tile=>matches(tile,move.ends.left)).length,rightSupport=rest.filter(tile=>matches(tile,move.ends.right)).length;
  let score=pips*(difficulty==='easy'?0.72:1.05)+(move.tile.a===move.tile.b?0.8+move.tile.a*0.12:0)+support*(difficulty==='easy'?0.55:difficulty==='normal'?1.05:2.25);
  score-=Number(leftSupport===0)*0.7+Number(rightSupport===0)*0.7;
  if(difficulty!=='hard') return score;

  const actor=context.actor,mode=context.mode??'1v1',counts=context.counts??{};
  if(!actor) return score+futureReach(rest,move.ends)*0.55;
  const ownTeam=teamOf(mode,actor),near= Math.min(2,seats(mode).length-1);
  for(let offset=1;offset<=near;offset++) {
    const next=following(mode,actor,offset),sameTeam=teamOf(mode,next)===ownTeam;
    const canPlay=probabilityCanPlay(next,move.ends,unseen,voids,counts);
    const count=counts[next]??7;
    const weight=count<=1?11:count<=2?8:count<=3?5:3;
    score+=sameTeam ? canPlay*(offset===1?3.2:1.1) : -canPlay*weight*(offset===1?1:0.52);
    if(sameTeam&&offset===1) score+=allySignal(next,move.ends,context,board,voids);
  }
  score+=futureReach(rest,move.ends)*0.2;
  return score;
}

export function chooseDominoBotAction(hand: Domino[], board: Placed[], ends: DominoState['ends'], difficulty: Difficulty='normal', publicContext: PublicBotContext={}): GameAction {
  const moves=legalMoves(hand,ends);
  if(!moves.length) return {type:'pass'};
  if(moves.length===1) return {type:'play',payload:{index:moves[0].index,side:moves[0].side}};
  const handOut=moves.find(move=>hand.length===1);
  if(handOut) return {type:'play',payload:{index:handOut.index,side:handOut.side}};
  const unseen=difficulty==='hard'?unseenTiles(hand,board):[],voids=difficulty==='hard'?passVoids(publicContext,board):new Map<Seat,Set<number>>();
  const worlds=difficulty==='hard'&&publicContext.actor ? hardRolloutWorlds(hand,publicContext.actor,publicContext.mode??'1v1',board,publicContext,unseen,voids) : [];
  const ranked=moves.map((move,index)=>({move,index,score:utility(move,hand,board,ends,publicContext,difficulty,unseen,voids)}));
  if(difficulty==='hard'&&publicContext.actor&&worlds.length) {
    const candidates=ranked.slice().sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,Math.min(3,ranked.length));
    for(const candidate of candidates) candidate.score+=hardRolloutScore(candidate.move,hand,publicContext.actor,publicContext.mode??'1v1',board,ends,publicContext,worlds)*30;
  }
  const best=ranked.reduce((chosen,item)=>item.score>chosen.score?item:chosen,ranked[0]).move;
  return {type:'play',payload:{index:best.index,side:best.side}};
}
function botAction(s:DominoState,seat:Seat):GameAction { if(!s.board.length&&seat===s.opening.player) { const index=s.hands[seat].findIndex(t=>t.a===s.opening.tile.a&&t.b===s.opening.tile.b); return {type:'play',payload:{index,side:'left'}}; } return chooseDominoBotAction(s.hands[seat],s.board,s.ends,s.settings?.difficulty??'normal',{actor:seat,mode:s.mode,passes:s.passes,counts:Object.fromEntries(seats(s.mode).map(x=>[x,s.hands[x].length])),log:s.log,tranqueRule:s.settings?.tranqueRule}); }
function runBots(s:DominoState):DominoState { let next=s; while(!next.result&& !next.roundResult&&isBot(next.turn)) next=play(next,next.turn,botAction(next,next.turn)); return next; }
function pack() { return Array.from({length:7},(_,a)=>Array.from({length:7-a},(_,j)=>({a,b:a+j}))).flat(); }
function deal(seed:number,mode:Mode,round:number) { const deck=shuffle(pack(),seededRandom(seed+(round-1)*7919)), hands:DominoState['hands']={p1:deck.slice(0,7),p2:deck.slice(7,14),b1:[],b2:[]}; if(mode!=='1v1'){hands.b1=deck.slice(14,21);hands.b2=deck.slice(21,28);} const opening=(Object.entries(hands) as [Seat,Domino[]][]).filter(([x])=>seats(mode).includes(x)).flatMap(([player,h])=>h.map(tile=>({player,tile,rank:openingRank(tile)}))).sort((x,y)=>y.rank-x.rank)[0]; return {hands,opening,stock:deck.slice(14,mode==='1v1'?28:14)}; }
function validSettings(s:Partial<Settings>):boolean { return (s.difficulty===undefined||['easy','normal','hard'].includes(s.difficulty))&&(s.targetScore===undefined||[0,100,200].includes(s.targetScore))&&(s.capicuaBonus===undefined||[0,25].includes(s.capicuaBonus))&&(s.pasoCorridoBonus===undefined||[0,25].includes(s.pasoCorridoBonus))&&(s.tranqueRule===undefined||['team','lowest-player'].includes(s.tranqueRule)); }
export const dominoEngine: GameEngine<DominoState> = {
 id:'domino',
 createInitialState(seed) { const d=deal(seed,'1v1',1); return {seed,turn:d.opening.player,mode:'1v1',hands:d.hands,stock:d.stock,board:[],ends:null,passes:0,opening:{player:d.opening.player,tile:d.opening.tile},result:null,rulesVersion:1,settings:{...DEFAULT_SETTINGS},matchScores:{p1:0,p2:0},round:1,roundResult:null,log:[],lastPlacer:null,pasoAwarded:false,roundBonuses:{p1:0,p2:0}}; },
 validateAction(s,p,a) {
  if(p!=='p1'&&p!=='p2') return 'Invalid player'; if(!a||typeof a.type!=='string') return 'Invalid action'; if(s.result)return 'Game is over';
  if(a.type==='set-mode'||a.type==='configure') { if(a.type==='configure'&&s.rulesVersion!==1)return 'Settings unavailable in this saved ruleset'; if(a.type==='set-mode'&&s.mode!=='1v1')return 'Mode already selected'; if(p!=='p1'||s.board.length||((s.round??1)!==1)||s.roundResult) return 'Settings can only be changed by player 1 before the first tile'; const pl=a.payload??{}; if(a.type==='set-mode') return (pl.mode==='partners'||pl.mode==='humans-vs-bots')?null:'Invalid mode'; return ((pl.mode===undefined||['1v1','partners','humans-vs-bots'].includes(pl.mode as string))&& (pl.difficulty===undefined||['easy','normal','hard'].includes(pl.difficulty as string))&&validSettings(pl as Partial<Settings>))?null:'Invalid configuration'; }
  if(a.type==='next-round') return s.rulesVersion===1&&p==='p1'&&!!s.roundResult&&!s.result?null:'Next round is unavailable';
  if(s.roundResult)return 'Round is over'; if(p!==s.turn)return 'Not your turn';
  if(a.type==='pass') return s.hands[p].every(t=>!legalOrient(t,'left',s.ends)&&!legalOrient(t,'right',s.ends))?null:'A playable tile is available';
  if(a.type!=='play')return 'Unknown action'; const {index,side}=a.payload??{}; if(!Number.isInteger(index)||(index as number)<0||(index as number)>=s.hands[p].length)return 'Invalid tile index'; if(side!=='left'&&side!=='right')return 'Invalid side'; const tile=s.hands[p][index as number]; if(s.board.length===0&&(p!==s.opening.player||tile.a!==s.opening.tile.a||tile.b!==s.opening.tile.b))return 'Must open with the highest-ranked tile'; return legalOrient(tile,side,s.ends)?null:'Tile does not match that end';
 },
 applyAction(s,p,a) {
  const error=this.validateAction(s,p,a);if(error)throw new Error(error);
  if(a.type==='configure') { const mode=(a.payload?.mode??s.mode) as Mode, settings={...(s.settings??DEFAULT_SETTINGS)} as Settings, d=deal(s.seed,mode,1); for(const key of ['difficulty','targetScore','capicuaBonus','pasoCorridoBonus','tranqueRule'] as const) if(a.payload?.[key]!==undefined) Object.assign(settings,{[key]:a.payload[key]}); const next={...s,mode,settings,hands:d.hands,stock:d.stock,turn:d.opening.player,opening:{player:d.opening.player,tile:d.opening.tile},log:event(s,{type:'configure',actor:p,title:{ko:'게임 설정 변경',es:'Configuración actualizada'}})}; return runBots(next); }
  if(a.type==='set-mode') { const mode=a.payload!.mode as Mode, hands={...s.hands,b1:s.stock.slice(0,7),b2:s.stock.slice(7,14)}, opening=(Object.entries(hands) as [Seat,Domino[]][]).flatMap(([player,hand])=>hand.map(tile=>({player,tile,rank:openingRank(tile)}))).sort((x,y)=>y.rank-x.rank)[0]; return runBots({...s,mode,hands,stock:[],turn:opening.player,opening:{player:opening.player,tile:opening.tile}}); }
  if(a.type==='next-round') { const round=(s.round??1)+1,d=deal(s.seed,s.mode,round),log=event(s,{type:'round-start',title:{ko:`${round}라운드 시작`,es:`Inicio de ronda ${round}`},round}); return runBots({...s,round,roundResult:null,result:null,hands:d.hands,stock:d.stock,board:[],ends:null,passes:0,opening:{player:d.opening.player,tile:d.opening.tile},turn:d.opening.player,lastPlacer:null,pasoAwarded:false,roundBonuses:{p1:0,p2:0},log}); }
  return runBots(play(s,p,a));
 },
 getPlayerView(s,p) {
  const actions=[] as ReturnType<typeof label>[],order=seats(s.mode), teamsView=teams(s.mode);
  if(s.rulesVersion===1&&!s.result&&!s.roundResult&&p==='p1'&&!s.board.length&&(s.round??1)===1) actions.push(label('설정 저장','Guardar configuración',{type:'configure',payload:{mode:s.mode,...(s.settings??DEFAULT_SETTINGS)}}));
  if(!s.result&&!s.roundResult&&s.mode==='1v1'&&p==='p1'&&!s.board.length&&(s.round??1)===1) { actions.push(label('사람 2명 대 봇 2명','Dos personas contra dos bots',{type:'set-mode',payload:{mode:'humans-vs-bots'}}),label('사람-봇 팀전','Equipos mixtos',{type:'set-mode',payload:{mode:'partners'}})); }
  if(!s.result&&s.roundResult&&p==='p1') actions.push(label('다음 라운드','Siguiente ronda',{type:'next-round'}));
  if(!s.result&&!s.roundResult&&s.turn===p) { s.hands[p].forEach((t,index)=>{ for(const side of ['left','right'] as const) if(legalOrient(t,side,s.ends)&&(s.board.length!==0||(p===s.opening.player&&t.a===s.opening.tile.a&&t.b===s.opening.tile.b)))actions.push(label(`놓기 ${t.a}|${t.b} (${side==='left'?'왼쪽':'오른쪽'})`,`Jugar ${t.a}|${t.b} (${side==='left'?'izquierda':'derecha'})`,{type:'play',payload:{index,side}})); }); if(s.hands[p].every(t=>!legalOrient(t,'left',s.ends)&&!legalOrient(t,'right',s.ends)))actions.push(label('패스','Pasar',{type:'pass'})); }
  const reveal=!!s.roundResult||!!s.result, scores=reveal?teamScores(s):null;
  const log=(s.log??[]).map(e=>({...e,title:{...e.title},...(e.text?{text:{...e.text}}:{}),...(e.tile?{tile:{...e.tile}}:{}),...(e.ends?{ends:{...e.ends}}:{})}));
  return {game:'domino',mode:s.mode,turn:s.turn,phase:s.result?'finished':s.roundResult?'round-over':'play',round:s.round??1,settings:{...(s.settings??DEFAULT_SETTINGS)},hand:s.hands[p].map(t=>({...t})),board:{tiles:s.board.map(t=>({...t})),ends:s.ends?{...s.ends}:null,seats:order,counts:Object.fromEntries(order.map(x=>[x,s.hands[x].length])),teams:teamsView,scores,revealedHands:reveal?Object.fromEntries(order.map(x=>[x,s.hands[x].map(t=>({...t}))])):undefined,matchScores:{...(s.matchScores??{p1:0,p2:0})},roundResult:s.roundResult?{...s.roundResult,pips:{...s.roundResult.pips},bonuses:{...s.roundResult.bonuses},scoreDelta:{...s.roundResult.scoreDelta}}:null,roundBonuses:{p1:s.roundBonuses?.p1??0,p2:s.roundBonuses?.p2??0},settings:{...(s.settings??DEFAULT_SETTINGS)},rulesVersion:s.rulesVersion??0,round:s.round??1,actionLog:log},opponentCount:order.filter(x=>x!==p).reduce((n,x)=>n+s.hands[x].length,0),status:s.result?'finished':s.roundResult?'round-over':s.turn===p?'your-turn':isBot(s.turn)?'bot-turn':'opponent-turn',result:s.result,log,actions};
 },
 getResult:s=>s.result,
};
