import { otherPlayer, seededRandom, shuffle, type GameAction, type GameEngine, type GameResult, type PlayerId } from '../core/types';

type Tile = { color: 'black' | 'white'; value: number | 'joker'; revealed: boolean };
export type DavinciEvent = {
  sequence: number;
  type: 'draw' | 'correct-guess' | 'wrong-guess' | 'stop' | 'skip-draw' | 'arrange' | 'ready';
  actor: PlayerId;
  targetIndex?: number;
  guess?: number | 'joker';
  revealedOwnIndex?: number;
  insertedIndex?: number;
};
type DavinciState = {
  seed: number; turn: PlayerId; hands: Record<PlayerId, Tile[]>; deck: Tile[];
  phase: 'setup' | 'draw' | 'place-joker' | 'guess'; drawnIndex: number | null; mayStop: boolean; result: GameResult | null;
  actionLog?: DavinciEvent[]; turnNumber?: number;
  rulesVersion?: 2;
  setupReady?: Record<PlayerId, boolean>;
  setupPending?: Record<PlayerId, ('black' | 'white')[]>;
};
function recordEvent(before: DavinciState, next: DavinciState, event: Omit<DavinciEvent, 'sequence'>): DavinciState {
  const log = before.actionLog ?? [];
  const recorded = { ...event, sequence: (log.at(-1)?.sequence ?? 0) + 1 };
  return { ...next, actionLog: [...log, recorded].slice(-12), turnNumber: (before.turnNumber ?? 1) + (event.type === 'stop' || event.type === 'wrong-guess' ? 1 : 0) };
}
const label = (ko: string, es: string, action: GameAction) => ({ label: { ko, es }, action });
export const davinciRules = {
  ko: ['흑백 각각 0~11 숫자 타일과 조커 － 한 장씩, 총 26장을 사용합니다. 각자 네 장을 받고 숫자 순서대로 놓으며, 같은 숫자면 검정이 먼저입니다. 처음 받은 조커는 원하는 자리에 넣고 둘 다 배치 완료를 누르면 시작합니다.', '자기 차례에 타일을 하나 뽑습니다. 숫자는 자동 정렬되고, 조커는 놓을 위치를 직접 고릅니다. 한 번 배치한 조커는 다시 옮길 수 없습니다. 상대 타일을 클릭하고 0~11 또는 －를 추리합니다.', '맞히면 상대 타일이 공개되고 계속 추리하거나 차례를 마칠 수 있습니다. 틀리면 방금 뽑은 내 타일이 공개됩니다. 더미가 빈 뒤 틀리면 새 타일 공개 없이 차례를 넘깁니다. 상대 타일을 모두 공개하면 승리합니다.'],
  es: ['Se usan 26 fichas: números del 0 al 11 en blanco y negro, más un comodín － de cada color. Cada persona recibe cuatro; se ordenan por número y, si empatan, la negra va primero. Coloca cualquier comodín inicial donde quieras y ambos pulsen «Listo para jugar».', 'En tu turno robas una ficha. Los números se ordenan automáticamente; si robas un comodín, eliges su posición. Una vez colocado, no puedes moverlo. Pulsa una ficha rival y adivina un número del 0 al 11 o －.', 'Si aciertas, la ficha rival se revela y puedes seguir o terminar el turno. Si fallas, se revela la ficha que acabas de robar. Con el mazo vacío, un fallo termina el turno sin revelar otra ficha. Ganas al revelar todas las fichas rivales.'],
};
function isPlayer(p: unknown): p is PlayerId { return p === 'p1' || p === 'p2'; }
function sortedInsert(hand: Tile[], tile: Tile): Tile[] {
  const out = [...hand];
  const at = tile.value === 'joker' ? -1 : out.findIndex(t => t.value !== 'joker' && ((t.value as number) > (tile.value as number) || (t.value === tile.value && t.color === 'white' && tile.color === 'black')));
  out.splice(at < 0 ? out.length : at, 0, tile);
  return out;
}
export const davinciEngine: GameEngine<DavinciState> = {
  id: 'davinci',
  createInitialState(seed) {
    const rand = seededRandom(seed);
    const pack: Tile[] = (['black', 'white'] as const).flatMap(color => Array.from({ length: 12 }, (_, value) => ({ color, value, revealed: false })));
    pack.push({ color: 'black', value: 'joker', revealed: false }, { color: 'white', value: 'joker', revealed: false });
    const deck = shuffle(pack, rand);
    const hands: Record<PlayerId, Tile[]> = { p1: [], p2: [] };
    for (let i = 0; i < 4; i++) for (const p of ['p1', 'p2'] as const) hands[p] = sortedInsert(hands[p], deck.pop()!);
    return { seed, turn: 'p1', hands, deck, phase: 'setup', drawnIndex: null, mayStop: false, result: null, actionLog: [], turnNumber: 1, rulesVersion: 2, setupReady: { p1: false, p2: false }, setupPending: { p1: hands.p1.filter(t => t.value === 'joker').map(t => t.color), p2: hands.p2.filter(t => t.value === 'joker').map(t => t.color) } };
  },
  validateAction(s, p, a) {
    if (!isPlayer(p)) return 'Invalid player';
    if (s.result) return 'Game is over';
    if (!a || typeof a.type !== 'string') return 'Invalid action';
    const payload = a.payload ?? {};
    if (s.phase === 'setup') {
      if (s.setupReady?.[p]) return 'Rack is already ready';
      const color = s.setupPending?.[p]?.[0];
      if (a.type === 'finish-setup') return !color ? null : 'Place your joker first';
      if (a.type === 'place-joker') return color && Number.isInteger(payload.index) && (payload.index as number) >= 0 && (payload.index as number) < s.hands[p].length ? null : 'Invalid joker position';
      return 'Finish the starting arrangement first';
    }
    if (a.type === 'place-joker') return p === s.turn && s.phase === 'place-joker' && s.drawnIndex !== null && s.hands[p][s.drawnIndex]?.value === 'joker' && Number.isInteger(payload.index) && (payload.index as number) >= 0 && (payload.index as number) < s.hands[p].length ? null : 'Cannot place a joker now';
    if (a.type === 'draw') return p === s.turn && s.phase === 'draw' && s.deck.length > 0 ? null : 'Cannot draw now';
    if (a.type === 'skip-draw') return p === s.turn && s.phase === 'draw' && s.deck.length === 0 ? null : 'Cannot skip the draw now';
    if (a.type === 'guess') {
      if (s.phase !== 'guess' || p !== s.turn) return 'Not your guessing turn';
      const index = payload.index, value = payload.value;
      if (!Number.isInteger(index) || (index as number) < 0 || (index as number) >= s.hands[otherPlayer(p)].length) return 'Invalid tile index';
      if (!(value === 'joker' && s.rulesVersion === 2) && (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 11)) return 'Invalid tile guess';
      if (s.hands[otherPlayer(p)][index as number].revealed) return 'Tile is already revealed';
      return null;
    }
    if (a.type === 'stop') return p === s.turn && s.phase === 'guess' && s.mayStop ? null : 'Cannot stop now';
    return 'Unknown action';
  },
  applyAction(s, p, a) {
    const error = this.validateAction(s, p, a); if (error) throw new Error(error);
    if (a.type === 'finish-setup') {
      const setupReady = { ...s.setupReady!, [p]: true };
      return recordEvent(s, { ...s, setupReady, phase: setupReady.p1 && setupReady.p2 ? 'draw' : 'setup', turn: 'p1' }, { type: 'ready', actor: p });
    }
    if (a.type === 'place-joker') {
      const oldIndex = s.phase === 'setup' ? s.hands[p].findIndex(t => t.value === 'joker' && t.color === s.setupPending?.[p]?.[0]) : s.drawnIndex!;
      const index = a.payload!.index as number, hand = [...s.hands[p]], [tile] = hand.splice(oldIndex, 1);
      hand.splice(index, 0, tile);
      const hands = { ...s.hands, [p]: hand };
      const setupPending = s.phase === 'setup' ? { ...s.setupPending!, [p]: s.setupPending![p].slice(1) } : s.setupPending;
      return recordEvent(s, { ...s, hands, setupPending, phase: s.phase === 'setup' ? 'setup' : 'guess', drawnIndex: s.phase === 'setup' ? null : index }, { type: 'arrange', actor: p, insertedIndex: index });
    }
    if (a.type === 'skip-draw') return recordEvent(s, { ...s, phase: 'guess', drawnIndex: null, mayStop: false }, { type: 'skip-draw', actor: p });
    if (a.type === 'draw') {
      const hands = { ...s.hands, [p]: sortedInsert(s.hands[p], s.deck[s.deck.length - 1]) };
      const drawnIndex = hands[p].findIndex(t => t === s.deck[s.deck.length - 1]);
      return recordEvent(s, { ...s, hands, deck: s.deck.slice(0, -1), phase: s.deck[s.deck.length - 1].value === 'joker' ? 'place-joker' : 'guess', drawnIndex, mayStop: false }, { type: 'draw', actor: p, insertedIndex: drawnIndex });
    }
    if (a.type === 'stop') return recordEvent(s, { ...s, turn: otherPlayer(p), phase: s.deck.length ? 'draw' : 'guess', drawnIndex: null, mayStop: false }, { type: 'stop', actor: p });
    const opponent = otherPlayer(p), i = a.payload!.index as number, target = s.hands[opponent][i];
    if (target.value === a.payload!.value) {
      const hands = { ...s.hands, [opponent]: s.hands[opponent].map((t, j) => j === i ? { ...t, revealed: true } : t) };
      const result = hands[opponent].every(t => t.revealed) ? { winner: p, reason: 'All opposing tiles were revealed' } as GameResult : null;
      return recordEvent(s, { ...s, hands, mayStop: true, result }, { type: 'correct-guess', actor: p, targetIndex: i, guess: a.payload!.value as number | 'joker' });
    }
    const hands = s.drawnIndex === null ? s.hands : { ...s.hands, [p]: s.hands[p].map((t, j) => j === s.drawnIndex ? { ...t, revealed: true } : t) };
    return recordEvent(s, { ...s, hands, turn: opponent, phase: s.deck.length ? 'draw' : 'guess', drawnIndex: null, mayStop: false }, { type: 'wrong-guess', actor: p, targetIndex: i, guess: a.payload!.value as number | 'joker', ...(s.drawnIndex !== null ? { revealedOwnIndex: s.drawnIndex } : {}) });
  },
  getPlayerView(s, p) {
    const own = s.hands[p].map(t => ({ ...t })), rival = s.hands[otherPlayer(p)].map(t => t.revealed ? { ...t } : { revealed: false, color: t.color, value: null });
    const actions = [] as ReturnType<typeof label>[];
    const jokerIndex = s.phase === 'setup' ? s.hands[p].findIndex(t => t.value === 'joker' && t.color === s.setupPending?.[p]?.[0]) : s.turn === p && s.phase === 'place-joker' ? s.drawnIndex ?? -1 : -1;
    if (!s.result && jokerIndex >= 0) for (let index = 0; index < own.length; index++) actions.push(label(`조커를 ${index + 1}번째 자리에 놓기`, `Colocar el comodín en la posición ${index + 1}`, { type: 'place-joker', payload: { index } }));
    if (!s.result && s.phase === 'setup' && !s.setupReady?.[p] && !s.setupPending?.[p]?.length) actions.push(label('배치 완료', 'Listo para jugar', { type: 'finish-setup' }));
    if (!s.result && s.turn === p && s.phase === 'draw' && s.deck.length) actions.push(label('타일 뽑기', 'Robar ficha', { type: 'draw' }));
    if (!s.result && s.turn === p && s.phase === 'draw' && !s.deck.length) actions.push(label('추측 계속하기', 'Seguir adivinando', { type: 'skip-draw' }));
    if (!s.result && s.turn === p && s.phase === 'guess') {
      for (let i = 0; i < rival.length; i++) if (!rival[i].revealed) for (const value of [...Array.from({ length: 12 }, (_, n) => n), ...(s.rulesVersion === 2 ? ['joker' as const] : [])]) actions.push(label(`${i + 1}번 ${rival[i].color === 'black' ? '검정' : '흰색'} 타일: ${value === 'joker' ? '－' : value} 추측`, `Ficha ${i + 1} ${rival[i].color === 'black' ? 'negra' : 'blanca'}: adivinar ${value === 'joker' ? '－' : value}`, { type: 'guess', payload: { index: i, value } }));
      if (s.mayStop) actions.push(label('차례 마치기', 'Terminar turno', { type: 'stop' }));
    }
    // A placement event would identify the rival's hidden joker and its exact position.
    const actionLog = (s.actionLog ?? []).filter(event => event.type !== 'arrange' || event.actor === p).map(event => ({ ...event }));
    const turn = s.phase === 'setup' ? s.setupReady?.[p] ? otherPlayer(p) : p : s.turn;
    const phase = s.phase === 'setup' ? s.setupReady?.[p] ? 'waiting' : 'setup' : s.turn === p ? s.phase : 'waiting';
    return { game: 'davinci', turn, phase, hand: own, ...(jokerIndex >= 0 ? { ownJokerToPlace: { color: own[jokerIndex].color, index: jokerIndex } } : {}), board: { opponentTiles: rival, deckCount: s.deck.length, turnNumber: s.turnNumber ?? 1, setupReady: s.setupReady ? { ...s.setupReady } : undefined, tileCount: s.rulesVersion === 2 ? 26 : 24, actionLog, lastEvent: actionLog.at(-1) ?? null }, opponentCount: rival.filter(t => !t.revealed).length, status: s.result ? 'finished' : turn === p ? 'your-turn' : 'opponent-turn', result: s.result, actions };
  },
  getResult: s => s.result,
};
