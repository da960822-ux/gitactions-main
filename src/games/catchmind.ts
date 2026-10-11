import { otherPlayer, seededRandom, shuffle, type GameAction, type GameEngine, type GameResult, type PlayerId } from '../core/types';
import { catchmindDictionary, type Concept } from './catchmindWords';
import { catchmindCategories, catchmindTopicWords, type CatchmindCategoryId } from './catchmindTopics';
export { catchmindCategories, catchmindTopicWords } from './catchmindTopics';
export type { CatchmindCategoryId } from './catchmindTopics';
export { catchmindDictionary } from './catchmindWords';
export type { Concept } from './catchmindWords';
type Point = { x: number; y: number };
type Stroke = { by: PlayerId; points: Point[]; color: string; width: number; order: number };
type Guess = { by: PlayerId; text: string; correct: boolean };
type Fill = { x: number; y: number; color: string; order: number };
export type CatchmindSettings = { category_id: CatchmindCategoryId | null; drawTimeSeconds: number; rounds: number; choices: number; hints: number; customWords: Concept[]; customOnly: boolean };
export type CatchmindState = { seed: number; round: number; drawer: PlayerId; wordChoices: Concept[][]; answer: Concept | null; strokes: Stroke[]; fills: Fill[]; nextOrder: number; guesses: Guess[]; score: Record<PlayerId, number>; deadlineAt: string | null; hintStage: number; settings: CatchmindSettings; phase: 'choosing'|'drawing'|'round-over'|'finished'; result: GameResult|null };
const label = (ko: string, es: string, action: GameAction) => ({ label: { ko, es }, action });
export const catchmindRules = {
  ko: ['두 사람이 번갈아 출제자가 되어 제시어를 골라 그림을 그리고, 다른 사람은 공유 채팅으로 맞힙니다. 각자 번갈아 그림을 그립니다.', '펜 색과 굵기를 조절하고 지우개·실행 취소·전체 지우기·영역 채우기를 쓸 수 있어요. 출제자는 정답에 1점을 얻고, 정답을 맞힌 사람은 남은 시간에 따라 1~3점을 얻습니다. 출제자는 라운드를 끝내거나 패스할 수 있어요.', '호스트는 주제 하나, 라운드 수, 제한 시간, 보기 수, 글자 수 표시, 비공개 한·스페인어 제시어를 시작 전에 설정할 수 있어요. 라운드가 끝나면 정답이 공개되고 마지막 라운드 뒤 높은 점수가 승리합니다.'],
  es: ['Se turnan para elegir una palabra y dibujarla; la otra persona adivina por el chat compartido.', 'Pueden cambiar color y grosor del pincel, usar borrador, deshacer, borrar todo y rellenar regiones. Quien dibuja obtiene 1 punto y quien acierta recibe de 1 a 3 puntos según el tiempo restante. Quien dibuja también puede terminar o pasar la ronda.', 'La persona que creó la sala debe elegir una categoría y puede configurar rondas, tiempo, cantidad de opciones, longitud visible y palabras privadas en coreano y español. La respuesta se revela al terminar cada ronda y gana quien tenga más puntos al final.'],
};
function isPlayer(p: unknown): p is PlayerId { return p === 'p1' || p === 'p2'; }
function norm(v: string) { return v.normalize('NFC').toLowerCase().trim(); }
function answers(c: Concept) { return [c.ko, c.es, ...(c.aliases?.ko ?? []), ...(c.aliases?.es ?? [])].map(norm); }
function localeAnswers(c: Concept, locale: 'ko' | 'es') { return [c[locale], ...(c.aliases?.[locale] ?? [])].map(norm); }
const defaultSettings = (): CatchmindSettings => ({ category_id: null, drawTimeSeconds: 80, rounds: 6, choices: 3, hints: 2, customWords: [], customOnly: false });
function uniqueConcepts(concepts: Concept[]) {
  const seen = { ko: new Set<string>(), es: new Set<string>() };
  return concepts.filter(concept => {
    const keys = { ko: localeAnswers(concept, 'ko'), es: localeAnswers(concept, 'es') };
    if (keys.ko.some(key => !key || seen.ko.has(key)) || keys.es.some(key => !key || seen.es.has(key))) return false;
    keys.ko.forEach(key => seen.ko.add(key)); keys.es.forEach(key => seen.es.add(key));
    return true;
  });
}
function dealWords(seed: number, settings: CatchmindSettings) {
  if (!settings.category_id) return [];
  const categoryWords = catchmindTopicWords.filter(word => word.category_id === settings.category_id).map(({ ko, es, aliases }) => aliases && (aliases.ko?.length || aliases.es?.length) ? ({ ko, es, aliases }) : ({ ko, es }));
  const source = settings.customOnly ? settings.customWords : [...settings.customWords, ...categoryWords];
  const concepts = shuffle(uniqueConcepts(source), seededRandom(seed));
  return Array.from({ length: settings.rounds }, (_, round) => Array.from({ length: settings.choices }, (_, choice) => concepts[(round * settings.choices + choice) % concepts.length]));
}
function validSettings(value: unknown): value is Omit<CatchmindSettings, 'customWords'> & { customWords: unknown[] } {
  if (!value || typeof value !== 'object') return false;
  const settings = value as any;
  if (!catchmindCategories.some(category => category.id === settings.category_id)) return false;
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
  const base = uniqueConcepts(catchmindTopicWords.filter(word => word.category_id === settings.category_id));
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
function maskedHint(word: string, locale: 'ko' | 'es') {
  return [...word].map(char => locale === 'ko' ? '□' : /\p{L}/u.test(char) ? '?' : char).join('');
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
    return { seed, round: 0, drawer: 'p1', wordChoices: [], answer: null, strokes: [], fills: [], nextOrder: 0, guesses: [], score: { p1: 0, p2: 0 }, deadlineAt: null, hintStage: 0, settings, phase: 'choosing', result: null };
  },
  validateAction(s, p, a) {
    if (!isPlayer(p)) return 'Invalid player';
    if (s.result) return 'Game is over';
    if (!a || typeof a.type !== 'string') return 'Invalid action';
    const payload = a.payload ?? {};
    if (a.type === 'settings') return p === 'p1' && s.round === 0 && s.phase === 'choosing' && Object.hasOwn(s.settings, 'category_id') && validSettings(payload.settings) ? null : 'Room settings are invalid or locked';
    if (a.type === 'choose') return s.phase === 'choosing' && p === s.drawer && Number.isInteger(payload.wordId) && (payload.wordId as number) >= 0 && (payload.wordId as number) < (s.wordChoices[s.round]?.length ?? 0) ? null : 'Choose one of the offered words as the drawer';
    if (a.type === 'draw') {
      if (s.phase !== 'drawing' || p !== s.drawer) return 'Only the drawer can draw during an active round';
      const strokes = payload.strokes;
      if (!Array.isArray(strokes) || strokes.length < 1 || strokes.length > 12) return 'Send 1 to 12 strokes per batch';
      if (s.strokes.length + strokes.length > 200) return 'Round stroke limit reached';
      if (s.strokes.reduce((sum, stroke) => sum + stroke.points.length, 0) + strokes.reduce((sum: number, stroke: any) => sum + (Array.isArray(stroke?.points) ? stroke.points.length : 0), 0) > 4000) return 'Round point limit reached';
      for (const stroke of strokes) {
        if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 2 || stroke.points.length > 80) return 'Each stroke needs 2 to 80 points';
        if (stroke.points.some((pt: any) => !pt || typeof pt.x !== 'number' || typeof pt.y !== 'number' || !Number.isFinite(pt.x) || !Number.isFinite(pt.y) || pt.x < 0 || pt.x > 1 || pt.y < 0 || pt.y > 1)) return 'Points must be normalized between 0 and 1';
        if (stroke.color !== undefined && (typeof stroke.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(stroke.color))) return 'Invalid stroke color';
        if (stroke.width !== undefined && (!Number.isFinite(stroke.width) || stroke.width < 1 || stroke.width > 24)) return 'Stroke width must be between 1 and 24';
      }
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
      settings.customWords = settings.customWords.map(({ ko, es }) => ({ ko: ko.trim(), es: es.trim() }));
      return { ...s, settings, wordChoices: dealWords(s.seed, settings) };
    }
    if (a.type === 'choose') return { ...s, answer: s.wordChoices[s.round][a.payload!.wordId as number], strokes: [], fills: [], guesses: [], hintStage: 0, phase: 'drawing' };
    if (a.type === 'draw') {
      const added = (a.payload!.strokes as any[]).map((st, i) => ({ by: p, points: st.points.map((pt: Point) => ({ x: Math.round(pt.x * 1000) / 1000, y: Math.round(pt.y * 1000) / 1000 })), color: st.color ?? '#172033', width: st.width ?? 3, order: s.nextOrder + i }));
      return { ...s, strokes: [...s.strokes, ...added], nextOrder: s.nextOrder + added.length };
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
    if (!s.result && s.phase === 'choosing' && p === 'p1' && s.round === 0 && Object.hasOwn(s.settings, 'category_id')) actions.push(label('방 설정', 'Ajustes de sala', { type: 'settings', payload: { settings: s.settings } }));
    if (!s.result && s.phase === 'choosing' && p === s.drawer) (s.wordChoices[s.round] ?? []).forEach((word, wordId) => actions.push(label(`${word.ko} / ${word.es}`, `${word.es} / ${word.ko}`, { type: 'choose', payload: { wordId } })));
    if (!s.result && active && p === s.drawer) actions.push(label('라운드 종료', 'Terminar ronda', { type: 'end-round' }), label('패스', 'Pasar', { type: 'pass' }), label('실행 취소', 'Deshacer', { type: 'undo' }), label('전체 지우기', 'Borrar todo', { type: 'clear' }), label('채우기', 'Rellenar', { type: 'fill' }));
    if (!s.result && s.phase === 'round-over' && p === s.drawer) actions.push(label('다음 라운드', 'Siguiente ronda', { type: 'end-round' }));
    if (!s.result && active && p === guesser) actions.push(label('정답 제출', 'Enviar respuesta', { type: 'guess', payload: { text: '' } }));
    const visibleGuesses = s.guesses.map(g => ({ by: g.by, correct: g.correct, text: g.correct ? g.text : '…' }));
    const ownAnswer = p === s.drawer && s.phase === 'drawing' ? s.answer : null;
    const visibleSettings = { category_id: s.settings.category_id, categoryOptions: catchmindCategories, drawTimeSeconds: s.settings.drawTimeSeconds, rounds: s.settings.rounds, choices: s.settings.choices, hints: s.settings.hints, customWordCount: s.settings.customWords.length, customOnly: s.settings.customOnly };
    const hintLength = active && s.answer ? { ko: [...s.answer.ko].length, es: [...s.answer.es].length } : null;
    const hintWord = active && p !== s.drawer && s.answer && s.settings.hints ? { ko: maskedHint(s.answer.ko, 'ko'), es: maskedHint(s.answer.es, 'es') } : null;
    return { game: 'catchmind', turn: s.drawer, phase: s.phase, hand: p === s.drawer ? { choices: s.phase === 'choosing' ? (s.wordChoices[s.round] ?? []).map((c, wordId) => ({ wordId, ko: c.ko, es: c.es })) : [], answer: ownAnswer, settingsCustomWords: p === 'p1' ? structuredClone(s.settings.customWords) : [] } : null, board: { strokes: s.strokes.map(st => ({ ...st, points: st.points.map(pt => ({ ...pt })) })), fills: s.fills.map(fill => ({ ...fill })), guesses: visibleGuesses, round: s.round + 1, totalRounds: s.settings.rounds, drawer: s.drawer, answer: s.phase === 'round-over' || s.phase === 'finished' ? s.answer : null, hintLength, hintWord, hintStage: s.hintStage, settings: visibleSettings, scores: { ...s.score } }, opponentCount: 0, status: s.result ? 'finished' : s.phase === 'choosing' ? (p === s.drawer ? 'choose-word' : 'waiting') : active ? (p === s.drawer ? 'drawing' : 'guessing') : 'round-over', result: s.result, actions };
  },
  getResult: s => s.result,
};
