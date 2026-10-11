import { afterEach, describe, expect, it, vi } from 'vitest';
import { catchmindDrawDurationMs, catchmindEngine, catchmindDictionary, getCatchmindHintStage, isCorrectGuess } from './catchmind';

const normalize = (word: string) => word.normalize('NFC').toLowerCase().trim();

afterEach(() => vi.useRealTimers());

describe('catchmindEngine', () => {
  it('keeps three choices private, draws normalized strokes, and scores a correct bilingual guess', () => {
    let s: any = catchmindEngine.createInitialState(19);
    const guesserView = catchmindEngine.getPlayerView(s, 'p2');
    expect(guesserView.hand).toBeNull();
    const drawerView = catchmindEngine.getPlayerView(s, 'p1');
    expect(drawerView.hand.choices).toHaveLength(3);
    expect(guesserView.board.answer).toBeNull();
    expect(guesserView.board).not.toHaveProperty('choices');
    const answer = drawerView.hand.choices[0];
    expect(catchmindEngine.validateAction(s, 'p2', { type: 'choose', payload: { wordId: 0 } })).toBeTruthy();
    s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
    s.deadlineAt = new Date(Date.now() + catchmindDrawDurationMs).toISOString();
    expect(catchmindEngine.getPlayerView(s, 'p2').board.answer).toBeNull();
    expect(catchmindEngine.getPlayerView(s, 'p2').board.hintLength).toEqual({ ko: [...answer.ko].length, es: [...answer.es].length });
    expect(isCorrectGuess(s, answer.es)).toBe(true);
    expect(isCorrectGuess(s, 'not the answer')).toBe(false);
    s = catchmindEngine.applyAction(s, 'p1', { type: 'draw', payload: { strokes: [{ points: [{ x: 0.1, y: 0.2 }, { x: 0.9, y: 0.8 }], color: '#e57f6a', width: 7 }] } });
    const before = s.strokes;
    expect(s.strokes[0]).toMatchObject({ color: '#e57f6a', width: 7 });
    s = catchmindEngine.applyAction(s, 'p2', { type: 'guess', payload: { text: answer.es } });
    expect(s.score.p1).toBe(1);
    expect(s.score.p2).toBe(3);
    expect(s.phase).toBe('round-over');
    expect(before).toHaveLength(1);
    expect(catchmindEngine.getPlayerView(s, 'p2').board.answer).toEqual({ ko: answer.ko, es: answer.es });
    for (let round = 1; round < 6; round++) {
      s = catchmindEngine.applyAction(s, s.drawer, { type: 'end-round' });
      const drawer = s.drawer;
      s = catchmindEngine.applyAction(s, drawer, { type: 'choose', payload: { wordId: 0 } });
      s = catchmindEngine.applyAction(s, drawer, { type: 'pass' });
    }
    s = catchmindEngine.applyAction(s, s.drawer, { type: 'end-round' });
    expect(s.result.winner).toBe('p2');
  });

  it('alternates drawers for six rounds and rejects non-normalized drawing points', () => {
    let s: any = catchmindEngine.createInitialState(2);
    for (let i = 0; i < 6; i++) {
      const drawer = s.drawer;
      s = catchmindEngine.applyAction(s, drawer, { type: 'choose', payload: { wordId: 1 } });
      expect(catchmindEngine.validateAction(s, drawer, { type: 'draw', payload: { strokes: [{ points: [{ x: 1.1, y: 0 }, { x: 1, y: 1 }] }] } })).toBeTruthy();
      s = catchmindEngine.applyAction(s, drawer, { type: 'pass' });
      s = catchmindEngine.applyAction(s, drawer, { type: 'end-round' });
      if (i < 5) expect(s.drawer).toBe(drawer === 'p1' ? 'p2' : 'p1');
    }
    expect(s.phase).toBe('finished');
    expect(s.result.winner).toBe('draw');
  });

  it('accepts only canonical words with accents intact, case folding, and outer whitespace', () => {
    const s = catchmindEngine.createInitialState(4);
    s.phase = 'drawing';
    s.answer = catchmindDictionary.find(word => word.es === 'gato')!;
    expect(isCorrectGuess(s, '  GATO  ')).toBe(true);
    expect(isCorrectGuess(s, 'gata')).toBe(false);
    s.answer = catchmindDictionary.find(word => word.es === 'cabra')!;
    expect(isCorrectGuess(s, 'chivo')).toBe(false);
    s.answer = catchmindDictionary.find(word => word.es === 'arcoíris')!;
    expect(isCorrectGuess(s, 'arcoíris')).toBe(true);
    expect(isCorrectGuess(s, 'arcoiris')).toBe(false);
    s.answer = catchmindDictionary.find(word => word.es === 'pavo real')!;
    expect(isCorrectGuess(s, 'pavo real')).toBe(true);
    expect(isCorrectGuess(s, 'pavo  real')).toBe(false);
    s.answer = catchmindDictionary.find(word => word.es === 'araña')!;
    expect(isCorrectGuess(s, 'araña')).toBe(true);
    expect(isCorrectGuess(s, 'ARAÑA')).toBe(true);
    expect(isCorrectGuess(s, 'arana')).toBe(false);
  });

  it('scores correct guesses from trusted server time remaining', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    for (const [elapsed, expected] of [[0, 3], [27_000, 2], [54_000, 1], [79_000, 1]]) {
      let s = catchmindEngine.createInitialState(100 + elapsed);
      s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
      const answer = s.answer!;
      s.deadlineAt = new Date(Date.now() + catchmindDrawDurationMs).toISOString();
      vi.setSystemTime(Date.now() + elapsed);
      s = catchmindEngine.applyAction(s, 'p2', { type: 'guess', payload: { text: answer.ko } });
      expect(s.score.p2).toBe(expected);
      expect(s.score.p1).toBe(1);
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    }
  });

  it('has a large unambiguous bilingual dictionary and selects only dictionary concepts', () => {
    expect(catchmindDictionary.length).toBeGreaterThanOrEqual(120);
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '바나나', es: 'guineo' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '패션프루트', es: 'chinola' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '안경', es: 'lentes' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '자동차', es: 'carro' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '컴퓨터', es: 'computadora' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '버스', es: 'guagua' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '연', es: 'chichigua' }));
    const owner = new Map<string, number>();
    catchmindDictionary.forEach((concept, id) => {
      for (const word of [concept.ko, concept.es]) {
        const key = normalize(word);
        expect(key).not.toBe('');
        expect(owner.has(key)).toBe(false);
        owner.set(key, id);
      }
    });
    const state = catchmindEngine.createInitialState(101);
    const selected = state.wordChoices.flat();
    expect(selected).toHaveLength(18);
    expect(new Set(selected.map(word => normalize(word.ko))).size).toBe(18);
    expect(new Set(selected.map(word => normalize(word.es))).size).toBe(18);
    expect(selected.every(word => catchmindDictionary.some(item => item.ko === word.ko && item.es === word.es))).toBe(true);
  });

  it('bounds persisted canvas data and rounds coordinates to the canvas resolution', () => {
    let s: any = catchmindEngine.createInitialState(18);
    s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
    const points = Array.from({ length: 80 }, (_, i) => ({ x: i === 0 ? 0.123456 : 0.5, y: 0.654321 }));
    const batch = Array.from({ length: 10 }, () => ({ points }));
    for (let i = 0; i < 5; i++) s = catchmindEngine.applyAction(s, 'p1', { type: 'draw', payload: { strokes: batch } });
    expect(s.strokes).toHaveLength(50);
    expect(s.strokes[0].points[0]).toEqual({ x: 0.123, y: 0.654 });
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'draw', payload: { strokes: [{ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] } })).toBeTruthy();
    expect(JSON.stringify(catchmindEngine.getPlayerView(s, 'p1')).length).toBeLessThan(150_000);
  });

  it('keeps fill, undo, clear, and private timed hints within server-owned game state', () => {
    let s: any = catchmindEngine.createInitialState(81);
    s = catchmindEngine.applyAction(s, 'p1', { type: 'settings', payload: { settings: {
      drawTimeSeconds: 60, rounds: 2, choices: 3, hints: 2, customOnly: true,
      customWords: [{ ko: '두루미', es: 'grulla' }, { ko: '소나무', es: 'pino' }, { ko: '지구본', es: 'globo terráqueo' }, { ko: '열기구', es: 'globo aerostático' }, { ko: '딸기우유', es: 'leche de fresa' }, { ko: '비눗방울', es: 'burbuja' }],
    } } });
    expect(s.wordChoices.flat()).toHaveLength(6);
    expect(catchmindEngine.validateAction(s, 'p2', { type: 'settings', payload: { settings: s.settings } })).toBeTruthy();
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'settings', payload: { settings: { ...s.settings, customWords: [...s.settings.customWords, { ko: '두루미', es: 'grulla' }] } } })).toBeTruthy();
    s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
    const answer = s.answer;
    s.deadlineAt = new Date(60_000).toISOString();
    expect(getCatchmindHintStage(s, 19_999)).toBe(0);
    expect(getCatchmindHintStage(s, 20_000)).toBe(1);
    expect(getCatchmindHintStage(s, 40_000)).toBe(2);
    expect(JSON.stringify(catchmindEngine.getPlayerView(s, 'p2'))).not.toContain(answer.ko);
    s = catchmindEngine.applyAction(s, 'p1', { type: 'draw', payload: { strokes: [{ points: [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }], color: '#000000', width: 4 }] } });
    s = catchmindEngine.applyAction(s, 'p1', { type: 'fill', payload: { x: 0.5, y: 0.5, color: '#ff0000' } });
    expect(s.strokes).toHaveLength(1); expect(s.fills).toHaveLength(1);
    expect(s.fills[0]).toMatchObject({ x: 0.5, y: 0.5, color: '#ff0000', order: 1 });
    s = catchmindEngine.applyAction(s, 'p1', { type: 'undo' });
    expect(s.strokes).toHaveLength(1); expect(s.fills).toHaveLength(0);
    s = catchmindEngine.applyAction(s, 'p1', { type: 'clear' });
    expect(s.strokes).toHaveLength(0); expect(s.fills).toHaveLength(0);
    expect(catchmindEngine.validateAction(s, 'p2', { type: 'fill', payload: { x: 0.5, y: 0.5, color: '#ff0000' } })).toBeTruthy();
  });
});
