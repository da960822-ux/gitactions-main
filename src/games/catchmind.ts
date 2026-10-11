import { otherPlayer, seededRandom, shuffle, type GameAction, type GameEngine, type GameResult, type PlayerId } from '../core/types';
import { catchmindDictionary, type Concept } from './catchmindWords';
export { catchmindDictionary } from './catchmindWords';
export type { Concept } from './catchmindWords';
type Point = { x: number; y: number };
type Stroke = { by: PlayerId; points: Point[]; color: string; width: number; order: number; strokeId?: string; segmentIndex?: number };
type Guess = { by: PlayerId; text: string; correct: boolean };
type Fill = { x: number; y: number; color: string; order: number };
export type CatchmindSettings = { drawTimeSeconds: number; rounds: number; choices: number; hints: number; customWords: Concept[]; customOnly: boolean };
export type CatchmindState = { seed: number; round: number; drawer: PlayerId; wordChoices: Concept[][]; answer: Concept | null; strokes: Stroke[]; fills: Fill[]; nextOrder: number; guesses: Guess[]; score: Record<PlayerId, number>; deadlineAt: string | null; hintStage: number; settings: CatchmindSettings; phase: 'choosing'|'drawing'|'round-over'|'finished'; result: GameResult|null };
const label = (ko: string, es: string, action: GameAction) => ({ label: { ko, es }, action });
export const catchmindRules = {
  ko: ['두 사람이 번갈아 출제자가 되어 제시어를 골라 그림을 그리고, 다른 사람은 공유 채팅으로 맞힙니다. 각자 번갈아 그림을 그립니다.', '펜 색과 굵기를 조절하고 지우개·실행 취소·전체 지우기·영역 채우기를 쓸 수 있어요. 출제자는 정답에 1점을 얻고, 정답을 맞힌 사람은 남은 시간에 따라 1~3점을 얻습니다. 출제자는 라운드를 끝내거나 패스할 수 있어요.', '호스트는 라운드 수, 제한 시간, 보기 수, 힌트 수, 비공개 한·스페인어 제시어를 시작 전에 설정할 수 있어요. 라운드가 끝나면 정답이 공개되고 마지막 라운드 뒤 높은 점수가 승리합니다.'],
  es: ['Se turnan para elegir una palabra y dibujarla; la otra persona adivina por el chat compartido.', 'Pueden cambiar color y grosor del pincel, usar borrador, deshacer, borrar todo y rellenar regiones. Quien dibuja obtiene 1 punto y quien acierta recibe de 1 a 3 puntos según el tiempo restante. Quien dibuja también puede terminar o pasar la ronda.', 'La persona que creó la sala puede configurar rondas, tiempo, cantidad de opciones, pistas y palabras privadas en coreano y español. La respuesta se revela al terminar cada ronda y gana quien tenga más puntos al final.'],
};
function isPlayer(p: unknown): p is PlayerId { return p === 'p1' || p === 'p2'; }
function norm(v: string) { return v.normalize('NFC').toLowerCase().trim(); }
function answers(c: Concept) { return [c.ko, c.es].map(norm); }
const defaultSettings = (): CatchmindSettings => ({ drawTimeSeconds: 80, rounds: 6, choices: 3, hints: 2, customWords: [], customOnly: false });
function uniqueConcepts(concepts: Concept[]) {
  const seenKo = new Set<string>(), seenEs = new Set<string>();
  return concepts.filter(({ ko, es }) => {
    const normalizedKo = norm(ko), normalizedEs = norm(es);
    if (!normalizedKo || !normalizedEs || seenKo.has(normalizedKo) || seenEs.has(normalizedEs)) return false;
    seenKo.add(normalizedKo); seenEs.add(normalizedEs);
    return true;
  });
}
function dealWords(seed: number, settings: CatchmindSettings) {
  const source = settings.customOnly ? settings.customWords : [...settings.customWords, ...catchmindDictionary];
  const concepts = shuffle(uniqueConcepts(source), seededRandom(seed));
  return Array.from({ length: settings.rounds }, (_, i) => concepts.slice(i * settings.choices, (i + 1) * settings.choices));
}
function validSettings(value: unknown): value is Omit<CatchmindSettings, 'customWords'> & { customWords: unknown[] } {
  if (!value || typeof value !== 'object') return false;
  const settings = value as any;
  if (!Number.isInteger(settings.drawTimeSeconds) || settings.drawTimeSeconds < 30 || settings.drawTimeSeconds > 180) return false;
  if (!Number.isInteger(settings.rounds) || settings.rounds < 2 || settings.rounds > 12) return false;
  if (!Number.isInteger(settings.choices) || settings.choices < 3 || settings.choices > 5) return false;
  if (!Number.isInteger(settings.hints) || settings.hints < 0 || settings.hints > 3 || typeof settings.customOnly !== 'boolean') return false;
  if (!Array.isArray(settings.customWords) || settings.customWords.length > 30) return false;
  const customWords: Concept[] = [];
  for (const item of settings.customWords) {
    if (!item || typeof item.ko !== 'string' || typeof item.es !== 'string') return false;
    const ko = item.ko.trim(), es = item.es.trim();
    if (!ko || !es || [...ko].length > 32 || [...es].length > 32) return false;
    customWords.push({ ko, es });
  }
  const base = uniqueConcepts(catchmindDictionary);
  const all = uniqueConcepts([...customWords, ...base]);
  if (all.length !== customWords.length + base.length) return false;
  return !settings.customOnly || customWords.length >= settings.rounds * settings.choices;
}
export const catchmindDrawDurationMs = 80_000;
export function getCatchmindDrawDurationMs(state: Pick<CatchmindState, 'settings'> | null | undefined): number {
  const seconds = state?.settings?.drawTimeSeconds;
  return typeof seconds === 'number' && Number.isInteger(seconds) ? seconds * 1000 : catchmindDrawDurationMs;
}
export function getCatchmindHintStage(state: Pick<CatchmindState, 'settings' | 'deadlineAt'>, now: number): number {
  const hints = state.settings.hints, duration = getCatchmindDrawDurationMs(state);
  if (hints < 1 || !state.deadlineAt) return 0;
  const elapsed = Math.max(0, duration - Math.max(0, Date.parse(state.deadlineAt) - now));
  return Math.min(hints, Math.floor(elapsed * (hints + 1) / duration));
}
function guessPoints(s: CatchmindState) {
  const remaining = s.deadlineAt ? Math.max(0, Date.parse(s.deadlineAt) - Date.now()) : 0;
  return Math.max(1, Math.ceil(3 * remaining / getCatchmindDrawDurationMs(s)));
}
function maskedHint(word: string, stage: number) {
  let left = stage;
  return [...word].map(char => {
    if (/\s/u.test(char)) return char;
    if (left > 0) { left--; return char; }
    return '＿';
  }).join(' ');
}
export function isCorrectGuess(s: CatchmindState, text: string): boolean {
  return s.phase === 'drawing' && s.answer !== null && typeof text === 'string' && answers(s.answer).includes(norm(text));
}
function makeResult(s: CatchmindState): GameResult | null {
  if (s.round < s.settings.rounds - 1) return null;
  if (s.score.p1 === s.score.p2) return { winner: 'draw', reason: `${s.settings.rounds} rounds complete with equal scores`, scores: { ...s.score } };
  return { winner: s.score.p1 > s.score.p2 ? 'p1' : 'p2', reason: `Higher score after ${s.settings.rounds} rounds`, scores: { ...s.score } };
}
export const catchmindEngine: GameEngine<CatchmindState> = {
  id: 'catchmind',
  createInitialState(seed) {
    const settings = defaultSettings();
    return { seed, round: 0, drawer: 'p1', wordChoices: dealWords(seed, settings), answer: null, strokes: [], fills: [], nextOrder: 0, guesses: [], score: { p1: 0, p2: 0 }, deadlineAt: null, hintStage: 0, settings, phase: 'choosing', result: null };
  },
  validateAction(s, p, a) {
    if (!isPlayer(p)) return 'Invalid player';
    if (s.result) return 'Game is over';
    if (!a || typeof a.type !== 'string') return 'Invalid action';
    const payload = a.payload ?? {};
    if (a.type === 'settings') return p === 'p1' && s.round === 0 && s.phase === 'choosing' && validSettings(payload.settings) ? null : 'Room settings are invalid or locked';
    if (a.type === 'choose') return s.phase === 'choosing' && p === s.drawer && Number.isInteger(payload.wordId) && (payload.wordId as number) >= 0 && (payload.wordId as number) < s.settings.choices ? null : 'Choose one of the offered words as the drawer';
    if (a.type === 'draw') {
      if (s.phase !== 'drawing' || p !== s.drawer) return 'Only the drawer can draw during an active round';
      const strokes = payload.strokes;
      if (!Array.isArray(strokes) || strokes.length < 1 || strokes.length > 12) return 'Send 1 to 12 strokes per batch';
      let physicalStrokes = s.strokes.length;
      const incomingStrokeIds = new Set<string>();
      let totalPoints = s.strokes.reduce((sum, stroke) => sum + stroke.points.length, 0);
      let last: { strokeId?: string; segmentIndex?: number; color?: string; width?: number; points: Point[] } | undefined = s.strokes.at(-1);
      for (const stroke of strokes) {
        if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 2 || stroke.points.length > 80) return 'Each stroke needs 2 to 80 points';
        if (stroke.points.some((pt: any) => !pt || typeof pt.x !== 'number' || typeof pt.y !== 'number' || !Number.isFinite(pt.x) || !Number.isFinite(pt.y) || pt.x < 0 || pt.x > 1 || pt.y < 0 || pt.y > 1)) return 'Points must be normalized between 0 and 1';
        if (stroke.color !== undefined && (typeof stroke.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(stroke.color))) return 'Invalid stroke color';
        if (stroke.width !== undefined && (!Number.isFinite(stroke.width) || stroke.width < 1 || stroke.width > 24)) return 'Stroke width must be between 1 and 24';
        const hasId = stroke.strokeId !== undefined, hasSegment = stroke.segmentIndex !== undefined;
        if (hasId !== hasSegment || hasId && (typeof stroke.strokeId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(stroke.strokeId) || !Number.isInteger(stroke.segmentIndex) || stroke.segmentIndex < 0 || stroke.segmentIndex > 10000)) return 'Invalid stroke segment';
        if (hasId && stroke.segmentIndex > 0) {
          if (!last || last.strokeId !== stroke.strokeId || last.segmentIndex !== stroke.segmentIndex - 1 || last.color !== (stroke.color ?? '#172033') || last.width !== (stroke.width ?? 3)) return 'Stroke segments must be consecutive and keep the same style';
          const first = stroke.points[0], end = last.points.at(-1);
          const overlap = end && Math.round(first.x * 1000) === Math.round(end.x * 1000) && Math.round(first.y * 1000) === Math.round(end.y * 1000);
          totalPoints += stroke.points.length - (overlap ? 1 : 0);
          last = { ...last, segmentIndex: stroke.segmentIndex, points: [...last.points, ...(overlap ? stroke.points.slice(1) : stroke.points)] };
        } else {
          if (hasId && (incomingStrokeIds.has(stroke.strokeId) || s.strokes.some(item => item.strokeId === stroke.strokeId))) return 'Stroke ID has already been used';
          if (hasId) incomingStrokeIds.add(stroke.strokeId);
          physicalStrokes++;
          totalPoints += stroke.points.length;
          last = hasId ? { strokeId: stroke.strokeId, segmentIndex: stroke.segmentIndex, color: stroke.color ?? '#172033', width: stroke.width ?? 3, points: stroke.points } : undefined;
        }
      }
      if (physicalStrokes > 200) return 'Round stroke limit reached';
      if (totalPoints > 4000) return 'Round point limit reached';
      return null;
    }
    if (a.type === 'fill') return s.phase === 'drawing' && p === s.drawer && Number.isFinite(payload.x) && Number.isFinite(payload.y) && (payload.x as number) >= 0 && (payload.x as number) <= 1 && (payload.y as number) >= 0 && (payload.y as number) <= 1 && typeof payload.color === 'string' && /^#[0-9a-f]{6}$/i.test(payload.color) && s.fills.length < 60 ? null : 'Invalid fill operation';
    if (a.type === 'reveal-hint') return s.phase === 'drawing' && p === s.drawer && s.hintStage < s.settings.hints ? null : 'No hint is due';
    if (a.type === 'guess') {
      if (s.phase !== 'drawing' || p === s.drawer) return 'Only the guesser can guess during an active round';
      if (typeof payload.text !== 'string' || payload.text.trim().length < 1 || payload.text.trim().length > 60 || s.guesses.length >= 200) return 'Guess must contain 1 to 60 characters; round guess limit is 200';
      return null;
    }
    if (a.type === 'undo' || a.type === 'clear') return p === s.drawer && s.phase === 'drawing' ? null : 'Only the drawer may edit the active drawing';
    if (a.type === 'end-round' || a.type === 'pass' || a.type === 'timeout') return p === s.drawer && s.phase !== 'finished' && s.phase !== 'choosing' ? null : 'Only the drawer can finish or pass the active round';
    return 'Unknown action';
  },
  applyAction(s, p, a) {
    const error = this.validateAction(s, p, a); if (error) throw new Error(error);
    if (a.type === 'settings') {
      const settings = structuredClone(a.payload!.settings as CatchmindSettings);
      return { ...s, settings, wordChoices: dealWords(s.seed, settings) };
    }
    if (a.type === 'choose') return { ...s, answer: s.wordChoices[s.round][a.payload!.wordId as number], strokes: [], fills: [], guesses: [], hintStage: 0, phase: 'drawing' };
    if (a.type === 'draw') {
      let nextOrder = s.nextOrder;
      const nextStrokes = [...s.strokes];
      for (const st of a.payload!.strokes as any[]) {
        const points = st.points.map((pt: Point) => ({ x: Math.round(pt.x * 1000) / 1000, y: Math.round(pt.y * 1000) / 1000 }));
        const last = nextStrokes.at(-1);
        if (last && st.strokeId && st.segmentIndex > 0 && last.strokeId === st.strokeId) {
          const end = last.points.at(-1), first = points[0];
          if (end && first.x === end.x && first.y === end.y) points.shift();
          nextStrokes[nextStrokes.length - 1] = { ...last, points: [...last.points, ...points], segmentIndex: st.segmentIndex };
        } else {
          nextStrokes.push({ by: p, points, color: st.color ?? '#172033', width: st.width ?? 3, order: nextOrder++, ...(st.strokeId ? { strokeId: st.strokeId, segmentIndex: st.segmentIndex } : {}) });
        }
      }
      return { ...s, strokes: nextStrokes, nextOrder };
    }
    if (a.type === 'undo') {
      const lastStroke = s.strokes.at(-1), lastFill = s.fills.at(-1);
      return lastFill && (!lastStroke || lastFill.order > lastStroke.order)
        ? { ...s, fills: s.fills.slice(0, -1) }
        : { ...s, strokes: s.strokes.slice(0, -1) };
    }
    if (a.type === 'fill') return { ...s, fills: [...s.fills, { x: Math.round((a.payload!.x as number) * 1000) / 1000, y: Math.round((a.payload!.y as number) * 1000) / 1000, color: a.payload!.color as string, order: s.nextOrder }], nextOrder: s.nextOrder + 1 };
    if (a.type === 'clear') return { ...s, strokes: [], fills: [], nextOrder: 0 };
    if (a.type === 'reveal-hint') return { ...s, hintStage: s.hintStage + 1 };
    if (a.type === 'guess') {
      const text = (a.payload!.text as string).trim(), correct = isCorrectGuess(s, text);
      const guesserPoints = guessPoints(s);
      const score = correct ? { ...s.score, [p]: s.score[p] + guesserPoints, [s.drawer]: s.score[s.drawer] + 1 } : s.score;
      return { ...s, score, guesses: [...s.guesses, { by: p, text, correct }], phase: correct ? 'round-over' : 'drawing' };
    }
    if (s.phase !== 'round-over') return { ...s, phase: 'round-over' };
    const result = makeResult(s);
    return result ? { ...s, phase: 'finished', result } : { ...s, round: s.round + 1, drawer: otherPlayer(s.drawer), answer: null, strokes: [], fills: [], nextOrder: 0, guesses: [], hintStage: 0, phase: 'choosing' };
  },
  getPlayerView(s, p) {
    const guesser = otherPlayer(s.drawer), active = s.phase === 'drawing';
    const actions = [] as ReturnType<typeof label>[];
    if (!s.result && s.phase === 'choosing' && p === 'p1' && s.round === 0) actions.push(label('방 설정', 'Ajustes de sala', { type: 'settings', payload: { settings: s.settings } }));
    if (!s.result && s.phase === 'choosing' && p === s.drawer) s.wordChoices[s.round].forEach((word, wordId) => actions.push(label(`${word.ko} / ${word.es}`, `${word.es} / ${word.ko}`, { type: 'choose', payload: { wordId } })));
    if (!s.result && active && p === s.drawer) actions.push(label('라운드 종료', 'Terminar ronda', { type: 'end-round' }), label('패스', 'Pasar', { type: 'pass' }), label('실행 취소', 'Deshacer', { type: 'undo' }), label('전체 지우기', 'Borrar todo', { type: 'clear' }), label('채우기', 'Rellenar', { type: 'fill' }));
    if (!s.result && s.phase === 'round-over' && p === s.drawer) actions.push(label('다음 라운드', 'Siguiente ronda', { type: 'end-round' }));
    if (!s.result && active && p === guesser) actions.push(label('정답 제출', 'Enviar respuesta', { type: 'guess', payload: { text: '' } }));
    const visibleGuesses = s.guesses.map(g => ({ by: g.by, correct: g.correct, text: g.correct ? g.text : '…' }));
    const ownAnswer = p === s.drawer && s.phase === 'drawing' ? s.answer : null;
    const visibleSettings = { drawTimeSeconds: s.settings.drawTimeSeconds, rounds: s.settings.rounds, choices: s.settings.choices, hints: s.settings.hints, customWordCount: s.settings.customWords.length, customOnly: s.settings.customOnly };
    const hintLength = active && s.answer ? { ko: [...s.answer.ko].length, es: [...s.answer.es].length } : null;
    const hintWord = active && p !== s.drawer && s.answer && s.settings.hints ? { ko: maskedHint(s.answer.ko, s.hintStage), es: maskedHint(s.answer.es, s.hintStage) } : null;
    return { game: 'catchmind', turn: s.drawer, phase: s.phase, hand: p === s.drawer ? { choices: s.phase === 'choosing' ? s.wordChoices[s.round].map((c, wordId) => ({ wordId, ko: c.ko, es: c.es })) : [], answer: ownAnswer, settingsCustomWords: p === 'p1' ? structuredClone(s.settings.customWords) : [] } : null, board: { strokes: s.strokes.map(st => ({ ...st, points: st.points.map(pt => ({ ...pt })) })), fills: s.fills.map(fill => ({ ...fill })), guesses: visibleGuesses, round: s.round + 1, totalRounds: s.settings.rounds, drawer: s.drawer, answer: s.phase === 'round-over' || s.phase === 'finished' ? s.answer : null, hintLength, hintWord, hintStage: s.hintStage, settings: visibleSettings, scores: { ...s.score } }, opponentCount: 0, status: s.result ? 'finished' : s.phase === 'choosing' ? (p === s.drawer ? 'choose-word' : 'waiting') : active ? (p === s.drawer ? 'drawing' : 'guessing') : 'round-over', result: s.result, actions };
  },
  getResult: s => s.result,
};
