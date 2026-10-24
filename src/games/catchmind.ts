import { otherPlayer, seededRandom, shuffle, type GameAction, type GameEngine, type GameResult, type Language, type PlayerId } from '../core/types';
import { type Concept } from './catchmindWords';
import { catchmindCategories, catchmindTopicWords, type CatchmindCategoryId } from './catchmindTopics';
export { catchmindCategories, catchmindTopicWords } from './catchmindTopics';
export type { CatchmindCategoryId } from './catchmindTopics';
export { catchmindDictionary } from './catchmindWords';
export type { Concept } from './catchmindWords';
type Point = { x: number; y: number };
type Stroke = { by: PlayerId; points: Point[]; color: string; width: number; order: number; strokeId?: string; segmentIndex?: number };
type Guess = { by: PlayerId; text: string; correct: boolean };
type Fill = { x: number; y: number; color: string; order: number };
export type CatchmindSettings = { category_id: CatchmindCategoryId | null; drawTimeSeconds: number; rounds: number; choices: number; hints: number; customWords: Concept[]; customOnly: boolean };
export type CatchmindState = { seed: number; round: number; drawer: PlayerId; wordChoices: Concept[][]; answer: Concept | null; strokes: Stroke[]; fills: Fill[]; nextOrder: number; guesses: Guess[]; score: Record<PlayerId, number>; deadlineAt: string | null; hintStage: number; settings: CatchmindSettings; phase: 'choosing'|'drawing'|'round-over'|'finished'; result: GameResult|null; rulesVersion?: number; roundId?: string; choosingDeadlineAt?: string | null; roundOverAt?: string | null; roundAward?: { guesserPoints: number; drawerPoints: number; revealedHintCount: number; remainingSeconds: number } | null; playerLanguages?: Record<PlayerId, Language> };
const label = (ko: string, es: string, action: GameAction) => ({ label: { ko, es }, action });
export const catchmindRules = {
  ko: ['두 사람이 번갈아 제시어 3개 중 하나를 골라 그립니다. 15초 동안 고르지 않으면 자동 선택되고, 상대는 채팅으로 맞힙니다. 기본 제한 시간은 문제당 80초입니다.', '힌트를 켜면 처음에 글자 수가 보이고 제한 시간의 50%, 75%가 지날 때 글자가 한 개씩 더 공개됩니다. 정답자는 남은 시간에 따라 100~200점에서 공개된 힌트마다 20점을 빼고 최소 50점을 얻습니다. 정답 시 출제자는 100점, 시간초과·패스 시 두 사람 모두 0점입니다.', '정답·시간초과·패스 뒤 5초 동안 정답과 점수를 보여주고 자동으로 교대합니다. 기본 6개 개별 턴으로 각자 3번 그리며, 호스트는 시작 전에 2~12개 짝수 턴과 제한 시간·힌트를 설정할 수 있습니다. 최종 합계가 높은 사람이 승리합니다.'],
  es: ['Se turnan para elegir una de tres palabras y dibujarla. Si no se elige en 15 segundos, el servidor elige una; la otra persona adivina por el chat. Cada turno dura 80 segundos por defecto.', 'Con pistas activadas se muestra primero la longitud y se revela una letra al 50 % y otra al 75 % del tiempo. Quien acierta recibe entre 100 y 200 puntos según el tiempo restante, menos 20 por cada pista revelada, con un mínimo de 50. Quien dibuja suma 100 si aciertan; al agotarse el tiempo o pasar, ambos suman 0.', 'La respuesta y los puntos aparecen durante 5 segundos antes de cambiar automáticamente de turno. Hay seis turnos individuales por defecto, tres por persona. Antes de empezar, quien creó la sala puede elegir entre 2 y 12 turnos pares, el tiempo y las pistas. Gana la puntuación total más alta.'],
};
function isPlayer(p: unknown): p is PlayerId { return p === 'p1' || p === 'p2'; }
function norm(v: string) { return v.normalize('NFC').toLowerCase().trim(); }
function answerKey(v: string) { return norm(v).replace(/\s+/gu, ' ').normalize('NFD').replace(/[\u0300-\u0301\u0303-\u0308]/gu, mark => mark === '\u0303' ? mark : '').normalize('NFC'); }
function answers(c: Concept) { return [c.ko, c.es, ...(c.aliases?.ko ?? []), ...(c.aliases?.es ?? [])].map(norm); }
function localeAnswers(c: Concept, locale: 'ko' | 'es') { return [c[locale], ...(c.aliases?.[locale] ?? [])].map(norm); }
const defaultSettings = (): CatchmindSettings => ({ category_id: null, drawTimeSeconds: 80, rounds: 6, choices: 3, hints: 2, customWords: [], customOnly: false });
function uniqueConcepts(concepts: Concept[], key = norm) {
  const seen = { ko: new Set<string>(), es: new Set<string>() };
  return concepts.filter(concept => {
    const keys = { ko: localeAnswers(concept, 'ko').map(key), es: localeAnswers(concept, 'es').map(key) };
    if (keys.ko.some(key => !key || seen.ko.has(key)) || keys.es.some(key => !key || seen.es.has(key))) return false;
    keys.ko.forEach(key => seen.ko.add(key)); keys.es.forEach(key => seen.es.add(key));
    return true;
  });
}
function dealWords(seed: number, settings: CatchmindSettings, rulesVersion = 1) {
  if (!settings.category_id) return [];
  const categoryWords = catchmindTopicWords.filter(word => word.category_id === settings.category_id).map(({ ko, es, aliases }) => aliases && (aliases.ko?.length || aliases.es?.length) ? ({ ko, es, aliases }) : ({ ko, es }));
  const source = settings.customOnly ? settings.customWords : [...settings.customWords, ...categoryWords];
  const concepts = shuffle(uniqueConcepts(source, rulesVersion === 2 ? answerKey : norm), seededRandom(seed));
  return Array.from({ length: settings.rounds }, (_, round) => Array.from({ length: settings.choices }, (_, choice) => concepts[(round * settings.choices + choice) % concepts.length]));
}
function validSettings(value: unknown, rulesVersion = 1): value is Omit<CatchmindSettings, 'customWords'> & { customWords: unknown[] } {
  if (!value || typeof value !== 'object') return false;
  const settings = value as any;
  if (!catchmindCategories.some(category => category.id === settings.category_id)) return false;
  if (!Number.isInteger(settings.drawTimeSeconds) || settings.drawTimeSeconds < 30 || settings.drawTimeSeconds > 180) return false;
  if (!Number.isInteger(settings.rounds) || settings.rounds < 2 || settings.rounds > 12) return false;
  if (rulesVersion === 2 && settings.rounds % 2 !== 0) return false;
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
  const key = rulesVersion === 2 ? answerKey : norm;
  const base = uniqueConcepts(catchmindTopicWords.filter(word => word.category_id === settings.category_id), key);
  const all = uniqueConcepts([...customWords, ...base], key);
  if (all.length !== customWords.length + base.length) return false;
  return !settings.customOnly || customWords.length >= settings.rounds * settings.choices;
}
export const catchmindDrawDurationMs = 80_000;
export function getCatchmindDrawDurationMs(state: Pick<CatchmindState, 'settings'> | null | undefined): number {
  const seconds = state?.settings?.drawTimeSeconds;
  return typeof seconds === 'number' && Number.isInteger(seconds) ? seconds * 1000 : catchmindDrawDurationMs;
}
export function getCatchmindHintStage(state: Pick<CatchmindState, 'settings' | 'deadlineAt'>, now: number): number {
  const hints = 'rulesVersion' in state && state.rulesVersion === 2 ? Math.min(2, state.settings.hints) : state.settings.hints, duration = getCatchmindDrawDurationMs(state);
  if (hints < 1 || !state.deadlineAt) return 0;
  const elapsed = Math.max(0, duration - Math.max(0, Date.parse(state.deadlineAt) - now));
  if ('rulesVersion' in state && state.rulesVersion === 2) return Math.min(hints, elapsed >= duration * .75 ? 2 : elapsed >= duration * .5 ? 1 : 0);
  return Math.min(hints, Math.floor(elapsed * (hints + 1) / duration));
}
function guessPoints(s: CatchmindState, now = Date.now()) {
  const remaining = s.deadlineAt ? Math.max(0, Date.parse(s.deadlineAt) - now) : 0;
  if (s.rulesVersion === 2) return Math.max(50, 100 + Math.floor(100 * remaining / getCatchmindDrawDurationMs(s)) - 20 * revealedHintCount(s, Math.max(s.hintStage, getCatchmindHintStage(s, now))));
  return Math.max(1, Math.ceil(3 * remaining / getCatchmindDrawDurationMs(s)));
}
const graphemes = (word: string) => [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(word)].map(part => part.segment);
function guesserLanguage(s: CatchmindState): Language { return s.playerLanguages?.[otherPlayer(s.drawer)] ?? 'es'; }
function revealedHintCount(s: CatchmindState, stage: number): number {
  if (!s.answer || !s.settings.hints) return 0;
  const units = graphemes(s.answer[guesserLanguage(s)]).filter(char => !/\s/u.test(char));
  return Math.min(stage, Math.max(0, units.length - 1));
}
function timedMask(word: string, locale: 'ko' | 'es', stage: number, seed: number) {
  const chars = graphemes(word), positions = chars.flatMap((char, index) => /\s/u.test(char) ? [] : [index]);
  const random = seededRandom(seed ^ (locale === 'ko' ? 0x4b4f : 0x4553));
  for (let i = positions.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [positions[i], positions[j]] = [positions[j], positions[i]]; }
  const revealed = new Set(positions.slice(0, Math.min(stage, positions.length - 1)));
  return chars.map((char, index) => /\s/u.test(char) || revealed.has(index) ? char : locale === 'ko' ? '□' : '?').join('');
}
function maskedHint(word: string, locale: 'ko' | 'es') {
  return [...word].map(char => /\s/u.test(char) ? char : locale === 'ko' ? '□' : /\p{L}/u.test(char) ? '?' : char).join('');
}
export function isCorrectGuess(s: CatchmindState, text: string): boolean {
  return s.phase === 'drawing' && s.answer !== null && typeof text === 'string' && (s.rulesVersion === 2 ? [s.answer.ko, s.answer.es, ...(s.answer.aliases?.ko ?? []), ...(s.answer.aliases?.es ?? [])].map(answerKey).includes(answerKey(text)) : answers(s.answer).includes(norm(text)));
}
export function advanceCatchmind(s: CatchmindState, now = Date.now()): CatchmindState {
  if (s.rulesVersion !== 2 || s.phase === 'finished') return s;
  if (s.phase === 'choosing' && s.choosingDeadlineAt && now >= Date.parse(s.choosingDeadlineAt) && s.wordChoices[s.round]?.length) {
    const choice = Math.floor(seededRandom(s.seed ^ s.round)() * s.wordChoices[s.round].length);
    return catchmindEngine.applyAction(s, s.drawer, { type: 'choose', payload: { wordId: choice } });
  }
  if (s.phase === 'drawing') {
    if (s.deadlineAt && now >= Date.parse(s.deadlineAt)) return { ...s, phase: 'round-over', deadlineAt: null, roundOverAt: new Date(now + 5000).toISOString(), roundAward: { guesserPoints: 0, drawerPoints: 0, revealedHintCount: revealedHintCount(s, s.hintStage), remainingSeconds: 0 } };
    const hintStage = Math.max(s.hintStage, getCatchmindHintStage(s, now));
    return hintStage === s.hintStage ? s : { ...s, hintStage };
  }
  if (s.phase === 'round-over' && s.roundOverAt && now >= Date.parse(s.roundOverAt)) return catchmindEngine.applyAction(s, s.drawer, { type: 'end-round' });
  return s;
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
    return { seed, round: 0, drawer: 'p1', wordChoices: [], answer: null, strokes: [], fills: [], nextOrder: 0, guesses: [], score: { p1: 0, p2: 0 }, deadlineAt: null, hintStage: 0, settings, phase: 'choosing', result: null, rulesVersion: 2, roundId: crypto.randomUUID(), choosingDeadlineAt: null, roundOverAt: null, roundAward: null, playerLanguages: { p1: 'ko', p2: 'es' } };
  },
  validateAction(s, p, a) {
    if (!isPlayer(p)) return 'Invalid player';
    if (s.result) return 'Game is over';
    if (!a || typeof a.type !== 'string') return 'Invalid action';
    const payload = a.payload ?? {};
    if (a.type === 'settings') return p === 'p1' && s.round === 0 && s.phase === 'choosing' && Object.hasOwn(s.settings, 'category_id') && validSettings(payload.settings, s.rulesVersion) ? null : 'Room settings are invalid or locked';
    if (a.type === 'choose') return s.phase === 'choosing' && p === s.drawer && Number.isInteger(payload.wordId) && (payload.wordId as number) >= 0 && (payload.wordId as number) < (s.wordChoices[s.round]?.length ?? 0) ? null : 'Choose one of the offered words as the drawer';
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
    if (a.type === 'reveal-hint') return s.rulesVersion === 2 ? 'Hints follow the server clock' : s.phase === 'drawing' && p === s.drawer && s.hintStage < s.settings.hints ? null : 'No hint is due';
    if (a.type === 'guess') {
      if (s.phase !== 'drawing' || p === s.drawer) return 'Only the guesser can guess during an active round';
      if (typeof payload.text !== 'string' || payload.text.trim().length < 1 || payload.text.trim().length > 60 || s.guesses.length >= 200) return 'Guess must contain 1 to 60 characters; round guess limit is 200';
      return null;
    }
    if (a.type === 'undo' || a.type === 'clear') return p === s.drawer && s.phase === 'drawing' ? null : 'Only the drawer may edit the active drawing';
    if (a.type === 'end-round' || a.type === 'pass' || a.type === 'timeout') return p === s.drawer && (a.type === 'end-round' ? s.phase === 'drawing' || s.phase === 'round-over' : s.phase === 'drawing') ? null : 'Only the drawer can finish or pass the active round';
    return 'Unknown action';
  },
  applyAction(s, p, a) {
    const error = this.validateAction(s, p, a); if (error) throw new Error(error);
    if (a.type === 'settings') {
      const settings = structuredClone(a.payload!.settings as CatchmindSettings);
      settings.customWords = settings.customWords.map(({ ko, es }) => ({ ko: ko.trim(), es: es.trim() }));
      return { ...s, settings, wordChoices: dealWords(s.seed, settings, s.rulesVersion), ...(s.rulesVersion === 2 ? { choosingDeadlineAt: new Date(Date.now() + 15000).toISOString() } : {}) };
    }
    if (a.type === 'choose') return { ...s, answer: s.wordChoices[s.round][a.payload!.wordId as number], strokes: [], fills: [], guesses: [], hintStage: 0, phase: 'drawing', ...(s.rulesVersion === 2 ? { deadlineAt: new Date(Date.now() + getCatchmindDrawDurationMs(s)).toISOString(), choosingDeadlineAt: null, roundAward: null } : {}) };
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
      const now = Date.now(), guesserPoints = correct ? guessPoints(s, now) : 0;
      const score = correct ? { ...s.score, [p]: s.score[p] + guesserPoints, [s.drawer]: s.score[s.drawer] + (s.rulesVersion === 2 ? 100 : 1) } : s.score;
      return { ...s, score, guesses: [...s.guesses, { by: p, text, correct }], phase: correct ? 'round-over' : 'drawing', ...(correct && s.rulesVersion === 2 ? { roundOverAt: new Date(now + 5000).toISOString(), roundAward: { guesserPoints, drawerPoints: 100, revealedHintCount: revealedHintCount(s, Math.max(s.hintStage, getCatchmindHintStage(s, now))), remainingSeconds: s.deadlineAt ? Math.ceil(Math.max(0, Date.parse(s.deadlineAt) - now) / 1000) : 0 } } : {}) };
    }
    if (s.phase !== 'round-over') return { ...s, phase: 'round-over', ...(s.rulesVersion === 2 ? { roundOverAt: new Date(Date.now() + 5000).toISOString(), roundAward: { guesserPoints: 0, drawerPoints: 0, revealedHintCount: revealedHintCount(s, s.hintStage), remainingSeconds: 0 } } : {}) };
    const result = makeResult(s);
    return result ? { ...s, phase: 'finished', result } : { ...s, round: s.round + 1, drawer: otherPlayer(s.drawer), answer: null, strokes: [], fills: [], nextOrder: 0, guesses: [], hintStage: 0, phase: 'choosing', ...(s.rulesVersion === 2 ? { deadlineAt: null, roundOverAt: null, roundId: crypto.randomUUID(), choosingDeadlineAt: new Date(Date.now() + 15000).toISOString(), roundAward: null } : {}) };
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
    const hintLocale = s.rulesVersion === 2 ? guesserLanguage(s) : null;
    const hintLength = active && s.answer && (s.rulesVersion !== 2 || s.settings.hints) ? { ko: hintLocale === 'es' ? null : s.rulesVersion === 2 ? graphemes(s.answer.ko).length : [...s.answer.ko].length, es: hintLocale === 'ko' ? null : s.rulesVersion === 2 ? graphemes(s.answer.es).length : [...s.answer.es].length } : null;
    const hintWord = active && p !== s.drawer && s.answer && s.settings.hints ? { ko: hintLocale === 'es' ? null : s.rulesVersion === 2 ? timedMask(s.answer.ko, 'ko', s.hintStage, s.seed ^ s.round) : maskedHint(s.answer.ko, 'ko'), es: hintLocale === 'ko' ? null : s.rulesVersion === 2 ? timedMask(s.answer.es, 'es', s.hintStage, s.seed ^ s.round) : maskedHint(s.answer.es, 'es') } : null;
    return { game: 'catchmind', turn: s.drawer, phase: s.phase, hand: p === s.drawer ? { choices: s.phase === 'choosing' ? (s.wordChoices[s.round] ?? []).map((c, wordId) => ({ wordId, ko: c.ko, es: c.es })) : [], answer: ownAnswer, settingsCustomWords: p === 'p1' ? structuredClone(s.settings.customWords) : [] } : null, board: { strokes: s.strokes.map(st => ({ ...st, points: st.points.map(pt => ({ ...pt })) })), fills: s.fills.map(fill => ({ ...fill })), guesses: visibleGuesses, round: s.round + 1, totalRounds: s.settings.rounds, drawer: s.drawer, answer: s.phase === 'round-over' || s.phase === 'finished' ? s.answer : null, hintLength, hintWord, hintLocale, hintStage: s.hintStage, hintCount: s.rulesVersion === 2 ? revealedHintCount(s, s.hintStage) : s.hintStage, roundId: s.roundId ?? null, choosingDeadlineAt: s.choosingDeadlineAt ?? null, roundOverAt: s.roundOverAt ?? null, roundAward: s.roundAward ?? null, rulesVersion: s.rulesVersion ?? 1, settings: visibleSettings, scores: { ...s.score } }, opponentCount: 0, status: s.result ? 'finished' : s.phase === 'choosing' ? (p === s.drawer ? 'choose-word' : 'waiting') : active ? (p === s.drawer ? 'drawing' : 'guessing') : 'round-over', result: s.result, actions };
  },
  getResult: s => s.result,
};
