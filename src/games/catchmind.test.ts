import { afterEach, describe, expect, it, vi } from 'vitest';
import { advanceCatchmind, catchmindDrawDurationMs, catchmindEngine, catchmindDictionary, catchmindCategories, catchmindTopicWords, getCatchmindHintStage, isCorrectGuess } from './catchmind';

const configure = (state: any, category_id = 'animals', overrides: Record<string, unknown> = {}) => catchmindEngine.applyAction(state, 'p1', { type: 'settings', payload: { settings: { ...state.settings, category_id, ...overrides } } });

const normalize = (word: string) => word.normalize('NFC').toLowerCase().trim();

afterEach(() => vi.useRealTimers());

describe('catchmindEngine', () => {
  it('keeps spaces visible in both private hint masks without exposing letters', () => {
    const state = configure(catchmindEngine.createInitialState(4));
    state.phase = 'drawing';
    state.answer = { ko: '뜨거운 커피', es: 'café caliente' };
    state.settings.hints = 2;
    const view = catchmindEngine.getPlayerView(state, 'p2');
    expect(view.board.hintWord).toEqual({ ko: '□□□ □□', es: '???? ????????' });
    expect(view.board.answer).toBeNull();
    expect(view.hand).toBeNull();
  });
  it('keeps three choices private, draws normalized strokes, and scores a correct bilingual guess', () => {
    let s: any = configure(catchmindEngine.createInitialState(19));
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
    expect(s.score.p1).toBe(100);
    expect(s.score.p2).toBeGreaterThanOrEqual(199);
    expect(s.score.p2).toBeLessThanOrEqual(200);
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
    let s: any = configure(catchmindEngine.createInitialState(2));
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

  it('matches canonical words with optional vowel accents, case folding, and collapsed spaces while preserving ñ', () => {
    const s = configure(catchmindEngine.createInitialState(4));
    s.phase = 'drawing';
    s.answer = catchmindDictionary.find(word => word.es === 'gato')!;
    expect(isCorrectGuess(s, '  GATO  ')).toBe(true);
    expect(isCorrectGuess(s, 'gata')).toBe(false);
    s.answer = catchmindDictionary.find(word => word.es === 'cabra')!;
    expect(isCorrectGuess(s, 'chivo')).toBe(false);
    s.answer = catchmindDictionary.find(word => word.es === 'arcoíris')!;
    expect(isCorrectGuess(s, 'arcoíris')).toBe(true);
    expect(isCorrectGuess(s, 'arcoiris')).toBe(true);
    s.answer = catchmindDictionary.find(word => word.es === 'pavo real')!;
    expect(isCorrectGuess(s, 'pavo real')).toBe(true);
    expect(isCorrectGuess(s, 'pavo  real')).toBe(true);
    s.answer = catchmindDictionary.find(word => word.es === 'araña')!;
    expect(isCorrectGuess(s, 'araña')).toBe(true);
    expect(isCorrectGuess(s, 'ARAÑA')).toBe(true);
    expect(isCorrectGuess(s, 'arana')).toBe(false);
  });

  it('scores correct guesses from trusted server time remaining', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    for (const [elapsed, expected] of [[0, 200], [27_000, 166], [54_000, 112], [79_000, 61]]) {
      let s = configure(catchmindEngine.createInitialState(100 + elapsed));
      s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
      const answer = s.answer!;
      s.deadlineAt = new Date(Date.now() + catchmindDrawDurationMs).toISOString();
      vi.setSystemTime(Date.now() + elapsed);
      s = catchmindEngine.applyAction(s, 'p2', { type: 'guess', payload: { text: answer.ko } });
      expect(s.score.p2).toBe(expected);
      expect(s.score.p1).toBe(100);
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    }
  });

  it('has a large unambiguous bilingual dictionary and selects only dictionary concepts', () => {
    expect(catchmindTopicWords).toHaveLength(272);
    expect(catchmindDictionary).toHaveLength(192);
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '바나나', es: 'guineo' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '패션프루트', es: 'chinola' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '안경', es: 'lentes' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '자동차', es: 'carro' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '컴퓨터', es: 'computadora' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '버스', es: 'guagua' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '연', es: 'chichigua' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '오토바이', es: 'motor' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '버스 정류장', es: 'parada de guagua' }));
    expect(catchmindDictionary).toContainEqual(expect.objectContaining({ ko: '헤드폰', es: 'audífonos' }));
    for (const [id, spanish, oldAnswer] of [
      ['legacy-105', 'motor', 'motocicleta'], ['legacy-097', 'parada de guagua', 'parada de autobús'],
      ['legacy-158', 'bizcocho', 'pastel'], ['legacy-188', 'bizcocho de cumpleaños', 'pastel de cumpleaños'],
      ['food-extra-003', 'cocalecas', 'palomitas'], ['legacy-121', 'audífonos', 'auriculares'],
      ['places-extra-003', 'destacamento policial', 'comisaría'],
    ]) {
      const concept = catchmindTopicWords.find(word => word.id === id)!;
      expect(concept.es).toBe(spanish);
      expect(concept.aliases?.es).toContain(oldAnswer);
    }
    const owner = new Map<string, number>();
    catchmindDictionary.forEach((concept, id) => {
      for (const word of [concept.ko, concept.es]) {
        const key = normalize(word);
        expect(key).not.toBe('');
        expect(owner.has(key)).toBe(false);
        owner.set(key, id);
      }
    });
    const state = configure(catchmindEngine.createInitialState(101));
    const selected = state.wordChoices.flat();
    expect(selected).toHaveLength(18);
    expect(new Set(selected.map(word => normalize(word.ko))).size).toBe(18);
    expect(new Set(selected.map(word => normalize(word.es))).size).toBe(18);
    expect(selected.every(word => catchmindTopicWords.some(topic => topic.category_id === 'animals' && topic.ko === word.ko && topic.es === word.es))).toBe(true);
  });

  it('bounds persisted canvas data and rounds coordinates to the canvas resolution', () => {
    let s: any = configure(catchmindEngine.createInitialState(18));
    s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
    const points = Array.from({ length: 80 }, (_, i) => ({ x: i === 0 ? 0.123456 : 0.5, y: 0.654321 }));
    const batch = Array.from({ length: 10 }, () => ({ points }));
    for (let i = 0; i < 5; i++) s = catchmindEngine.applyAction(s, 'p1', { type: 'draw', payload: { strokes: batch } });
    expect(s.strokes).toHaveLength(50);
    expect(s.strokes[0].points[0]).toEqual({ x: 0.123, y: 0.654 });
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'draw', payload: { strokes: [{ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] } })).toBeTruthy();
    expect(JSON.stringify(catchmindEngine.getPlayerView(s, 'p1')).length).toBeLessThan(150_000);
  });

  it('merges backward-compatible ordered segments as one physical stroke under unchanged caps', () => {
    let s: any = configure(catchmindEngine.createInitialState(76));
    s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
    for (let segmentIndex = 0; segmentIndex < 201; segmentIndex++) {
      const x = segmentIndex / 201, nextX = (segmentIndex + 1) / 201;
      const segment = { strokeId: 'long-line', segmentIndex, color: '#222222', width: 5, points: [{ x, y: 0.5 }, { x: nextX, y: 0.5 }] };
      expect(catchmindEngine.validateAction(s, 'p1', { type: 'draw', payload: { strokes: [segment] } })).toBeNull();
      s = catchmindEngine.applyAction(s, 'p1', { type: 'draw', payload: { strokes: [segment] } });
    }
    expect(s.strokes).toHaveLength(1);
    expect(s.strokes[0].points).toHaveLength(202);
    expect(s.strokes[0]).toMatchObject({ strokeId: 'long-line', segmentIndex: 200, color: '#222222', width: 5 });
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'draw', payload: { strokes: [{ strokeId: 'long-line', segmentIndex: 201, color: '#333333', width: 5, points: [{ x: 1, y: 0.5 }, { x: 1, y: 0.6 }] }] } })).toContain('same style');
    s = catchmindEngine.applyAction(s, 'p1', { type: 'undo' });
    expect(s.strokes).toHaveLength(0);
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'draw', payload: { strokes: [{ strokeId: 'long-line', segmentIndex: 202, color: '#222222', width: 5, points: [{ x: 1 / 201, y: 0.5 }, { x: 2 / 201, y: 0.5 }] }] } })).toContain('consecutive');
    const duplicateIds = [
      { strokeId: 'repeat', segmentIndex: 0, points: [{ x: 0, y: 0 }, { x: 0.1, y: 0.1 }] },
      { strokeId: 'other', segmentIndex: 0, points: [{ x: 0.2, y: 0.2 }, { x: 0.3, y: 0.3 }] },
      { strokeId: 'repeat', segmentIndex: 0, points: [{ x: 0.4, y: 0.4 }, { x: 0.5, y: 0.5 }] },
    ];
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'draw', payload: { strokes: duplicateIds } })).toContain('already been used');

    let legacy: any = configure(catchmindEngine.createInitialState(75));
    legacy = catchmindEngine.applyAction(legacy, 'p1', { type: 'choose', payload: { wordId: 0 } });
    const oldChunk = { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };
    legacy = catchmindEngine.applyAction(legacy, 'p1', { type: 'draw', payload: { strokes: [oldChunk] } });
    expect(legacy.strokes[0]).not.toHaveProperty('strokeId');
  });

  it('retains the server round stroke and point caps', () => {
    let s: any = configure(catchmindEngine.createInitialState(77));
    s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
    const stroke = { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };
    for (let i = 0; i < 200; i++) s = catchmindEngine.applyAction(s, 'p1', { type: 'draw', payload: { strokes: [stroke] } });
    expect(s.strokes).toHaveLength(200);
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'draw', payload: { strokes: [stroke] } })).toBe('Round stroke limit reached');
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'draw', payload: { strokes: Array.from({ length: 13 }, () => stroke) } })).toBe('Send 1 to 12 strokes per batch');
    let unique: any = configure(catchmindEngine.createInitialState(79));
    unique = catchmindEngine.applyAction(unique, 'p1', { type: 'choose', payload: { wordId: 0 } });
    for (let i = 0; i < 200; i++) unique = catchmindEngine.applyAction(unique, 'p1', { type: 'draw', payload: { strokes: [{ ...stroke, strokeId: `line-${i}`, segmentIndex: 0 }] } });
    expect(catchmindEngine.validateAction(unique, 'p1', { type: 'draw', payload: { strokes: [{ ...stroke, strokeId: 'line-200', segmentIndex: 0 }] } })).toBe('Round stroke limit reached');

    s = catchmindEngine.applyAction(configure(catchmindEngine.createInitialState(78)), 'p1', { type: 'choose', payload: { wordId: 0 } });
    const fullStroke = { points: Array.from({ length: 80 }, (_, i) => ({ x: i / 79, y: i / 79 })) };
    for (let i = 0; i < 50; i++) s = catchmindEngine.applyAction(s, 'p1', { type: 'draw', payload: { strokes: [fullStroke] } });
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'draw', payload: { strokes: [stroke] } })).toBe('Round point limit reached');
  });

  it('keeps fill, undo, clear, and private timed hints within server-owned game state', () => {
    let s: any = catchmindEngine.createInitialState(81);
    s = catchmindEngine.applyAction(s, 'p1', { type: 'settings', payload: { settings: {
      category_id: 'nature_space', drawTimeSeconds: 60, rounds: 2, choices: 3, hints: 2, customOnly: true,
      customWords: [{ ko: '두루미', es: 'grulla' }, { ko: '소나무', es: 'pino' }, { ko: '지구본', es: 'globo terráqueo' }, { ko: '열기구', es: 'globo aerostático' }, { ko: '딸기우유', es: 'leche de fresa' }, { ko: '비눗방울', es: 'burbuja' }],
    } } });
    expect(s.wordChoices.flat()).toHaveLength(6);
    expect(catchmindEngine.validateAction(s, 'p2', { type: 'settings', payload: { settings: s.settings } })).toBeTruthy();
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'settings', payload: { settings: { ...s.settings, customWords: [...s.settings.customWords, { ko: '두루미', es: 'grulla' }] } } })).toBeTruthy();
    s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
    const answer = s.answer;
    s.deadlineAt = new Date(60_000).toISOString();
    expect(getCatchmindHintStage(s, 29_999)).toBe(0);
    expect(getCatchmindHintStage(s, 30_000)).toBe(1);
    expect(getCatchmindHintStage(s, 45_000)).toBe(2);
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


  it('requires one supported category, exposes its labels, and locks settings after drawing starts', () => {
    let s: any = catchmindEngine.createInitialState(55);
    expect(s.wordChoices).toEqual([]);
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'settings', payload: { settings: { ...s.settings, category_id: null } } })).toBeTruthy();
    for (const category_id of [['animals', 'food'], 'all', 'mixed']) {
      expect(catchmindEngine.validateAction(s, 'p1', { type: 'settings', payload: { settings: { ...s.settings, category_id } } })).toBeTruthy();
    }
    expect(catchmindEngine.validateAction(s, 'p2', { type: 'settings', payload: { settings: { ...s.settings, category_id: 'animals' } } })).toBeTruthy();
    s = configure(s, 'transport', { rounds: 12, choices: 5 });
    expect(s.wordChoices.flat().every((word: any) => catchmindTopicWords.some(topic => topic.category_id === 'transport' && topic.ko === word.ko && topic.es === word.es))).toBe(true);
    expect(new Set(s.wordChoices[0].map((word: any) => `${word.ko}:${word.es}`)).size).toBe(5);
    expect(s.wordChoices[0].map((word: any) => `${word.ko}:${word.es}`)).toEqual(s.wordChoices[6].map((word: any) => `${word.ko}:${word.es}`));
    expect(catchmindEngine.getPlayerView(s, 'p1').board.settings).toMatchObject({ category_id: 'transport', categoryOptions: catchmindCategories });
    s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'settings', payload: { settings: { ...s.settings, category_id: 'food' } } })).toBeTruthy();
  });

  it('matches explicit aliases with NFC, case, space, and vowel accent normalization', () => {
    const s: any = configure(catchmindEngine.createInitialState(9), 'food');
    s.phase = 'drawing';
    s.answer = catchmindTopicWords.find(word => word.id === 'food-extra-009');
    expect(isCorrectGuess(s, ' MANGU ')).toBe(true);
    expect(isCorrectGuess(s, 'mangú')).toBe(true);
    expect(isCorrectGuess(s, 'mang u')).toBe(false);
    expect(isCorrectGuess(s, 'mángu')).toBe(true);
    s.answer = catchmindTopicWords.find(word => word.id === 'food-extra-015');
    expect(isCorrectGuess(s, 'cafe')).toBe(true);
  });

  it('rejects custom words colliding with a selected category canonical or alias and preserves legacy deals', () => {
    const fresh: any = catchmindEngine.createInitialState(19);
    const invalid = { ...fresh.settings, category_id: 'animals', customWords: [{ ko: '새 고양이', es: 'gato' }] };
    expect(catchmindEngine.validateAction(fresh, 'p1', { type: 'settings', payload: { settings: invalid } })).toBeTruthy();
    const aliasConflict = { ...fresh.settings, category_id: 'food', customWords: [{ ko: '새 음식', es: 'mangu' }] };
    expect(catchmindEngine.validateAction(fresh, 'p1', { type: 'settings', payload: { settings: aliasConflict } })).toBeTruthy();
    const custom: any = configure(fresh, 'animals', { customWords: [{ ko: '  새단어  ', es: '  nueva palabra  ', aliases: { es: [123, 'injected'] } }] });
    expect(custom.settings.customWords).toEqual([{ ko: '새단어', es: 'nueva palabra' }]);
    const legacy: any = configure(fresh);
    const savedChoices = structuredClone(legacy.wordChoices);
    delete legacy.settings.category_id;
    const savedAnswer = legacy.wordChoices[0][0];
    legacy.answer = savedAnswer;
    expect(legacy.wordChoices).toEqual(savedChoices);
    expect(legacy.answer).toEqual(savedAnswer);
    expect(catchmindEngine.validateAction(legacy, 'p1', { type: 'settings', payload: { settings: { ...legacy.settings, category_id: 'food' } } })).toBeTruthy();
    expect(catchmindEngine.validateAction(legacy, 'p1', { type: 'choose', payload: { wordId: 0 } })).toBeNull();
  });

  it('uses private language masks and carries no answer text to the guesser', () => {
    let s: any = configure(catchmindEngine.createInitialState(81), 'food');
    s.phase = 'drawing'; s.answer = catchmindTopicWords.find(word => word.id === 'food-extra-015');
    const guesser = catchmindEngine.getPlayerView(s, 'p2');
    expect(guesser.board.hintWord).toEqual({ ko: '□□', es: '????' });
    expect(JSON.stringify(guesser)).not.toContain('café');
    expect(JSON.stringify(guesser)).not.toContain('커피');
    s.answer = { ko: '불가사리', es: 'estrella de mar' };
    const spaced = catchmindEngine.getPlayerView(s, 'p2').board.hintWord;
    expect(spaced).toEqual({ ko: '□□□□', es: '???????? ?? ???' });
    expect(catchmindEngine.validateAction(s, 'p1', { type: 'reveal-hint' })).toBe('Hints follow the server clock');
    expect(catchmindEngine.getPlayerView(s, 'p2').board.hintWord).toEqual(spaced);
  });
});

describe('catchmind timed two-player rules', () => {
  const start = new Date('2026-01-01T00:00:00.000Z');
  const begin = (overrides: Record<string, unknown> = {}) => {
    vi.useFakeTimers();
    vi.setSystemTime(start);
    return configure(catchmindEngine.createInitialState(42), 'animals', overrides);
  };

  it('offers three words and selects one from the server after 15 seconds', () => {
    const choosing = begin();
    expect(choosing.rulesVersion).toBe(2);
    expect(choosing.wordChoices[0]).toHaveLength(3);
    expect(advanceCatchmind(choosing, start.getTime() + 14_999)).toBe(choosing);
    vi.setSystemTime(start.getTime() + 15_000);
    const drawing = advanceCatchmind(choosing, Date.now());
    expect(drawing.phase).toBe('drawing');
    expect(drawing.answer).toBeTruthy();
    expect(drawing.deadlineAt).toBe(new Date(Date.now() + 80_000).toISOString());
    expect(drawing.choosingDeadlineAt).toBeNull();
  });

  it('reveals hints only at 50% and 75%, then transitions on the server clock', () => {
    let s = begin({ drawTimeSeconds: 60, hints: 2 });
    s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
    expect(getCatchmindHintStage(s, start.getTime() + 29_999)).toBe(0);
    s = advanceCatchmind(s, start.getTime() + 30_000);
    expect(s.hintStage).toBe(1);
    expect(getCatchmindHintStage(s, start.getTime() + 44_999)).toBe(1);
    s = advanceCatchmind(s, start.getTime() + 45_000);
    expect(s.hintStage).toBe(2);
    expect(advanceCatchmind(s, start.getTime() + 59_999)).toBe(s);
    s = advanceCatchmind(s, start.getTime() + 60_000);
    expect(s.phase).toBe('round-over');
    expect(s.roundOverAt).toBe(new Date(start.getTime() + 65_000).toISOString());
    expect(s.score).toEqual({ p1: 0, p2: 0 });
    expect(advanceCatchmind(s, start.getTime() + 64_999)).toBe(s);
    vi.setSystemTime(start.getTime() + 65_000);
    s = advanceCatchmind(s, Date.now());
    expect(s.round).toBe(1);
    expect(s.drawer).toBe('p2');
    expect(s.phase).toBe('choosing');
  });

  it('never leaks a whole short, numeric, or emoji answer in a hint mask', () => {
    const base = begin();
    const drawing = catchmindEngine.applyAction(base, 'p1', { type: 'choose', payload: { wordId: 0 } });
    for (const answer of [{ ko: '가', es: '7' }, { ko: '🎨', es: '🥑' }, { ko: '가나', es: '8🎨' }]) {
      const s = { ...drawing, answer, hintStage: 2 };
      const view = catchmindEngine.getPlayerView(s, 'p2');
      expect(view.board.hintWord!.ko).not.toBe(answer.ko);
      expect(view.board.hintWord!.es).not.toBe(answer.es);
      expect(JSON.stringify(view)).not.toContain(`"ko":"${answer.ko}"`);
    }
  });

  it('uses only actually enabled hints when awarding points and gives the drawer 100', () => {
    let s = begin({ hints: 0 });
    s = catchmindEngine.applyAction(s, 'p1', { type: 'choose', payload: { wordId: 0 } });
    expect(catchmindEngine.getPlayerView(s, 'p2').board.hintLength).toBeNull();
    expect(catchmindEngine.getPlayerView(s, 'p2').board.hintWord).toBeNull();
    vi.setSystemTime(start.getTime() + 60_000);
    s = advanceCatchmind(s, Date.now());
    expect(s.hintStage).toBe(0);
    s = catchmindEngine.applyAction(s, 'p2', { type: 'guess', payload: { text: s.answer!.ko } });
    expect(s.score).toEqual({ p1: 100, p2: 125 });
    expect(s.roundOverAt).toBe(new Date(Date.now() + 5000).toISOString());
    expect(catchmindEngine.validateAction(s, 'p2', { type: 'guess', payload: { text: s.answer!.ko } })).toBeTruthy();
    expect(s.score).toEqual({ p1: 100, p2: 125 });
  });

  it('counts Unicode graphemes and keeps complete answers hidden after both hints', () => {
    const base = begin();
    const drawing = catchmindEngine.applyAction(base, 'p1', { type: 'choose', payload: { wordId: 0 } });
    const s = { ...drawing, answer: { ko: '한글👩‍🎨', es: 'cáfe☕' }, hintStage: 2 };
    const view = catchmindEngine.getPlayerView(s, 'p2');
    expect(view.board.hintLength).toEqual({ ko: 3, es: 5 });
    expect(view.board.hintWord!.ko).not.toBe(s.answer.ko);
    expect(view.board.hintWord!.es).not.toBe(s.answer.es);
  });

  it('enforces even round settings for a new match and preserves legacy odd-round state', () => {
    const fresh = begin();
    expect(catchmindEngine.validateAction(fresh, 'p1', { type: 'settings', payload: { settings: { ...fresh.settings, category_id: 'animals', rounds: 3 } } })).toBeTruthy();
    expect(catchmindEngine.validateAction(fresh, 'p1', { type: 'settings', payload: { settings: { ...fresh.settings, category_id: 'animals', rounds: 2 } } })).toBeNull();
    const legacy = { ...fresh, rulesVersion: undefined, roundId: undefined, settings: { ...fresh.settings, rounds: 3 }, score: { p1: 5, p2: 2 }, deadlineAt: '2026-01-01T00:02:00.000Z' };
    expect(advanceCatchmind(legacy, start.getTime() + 121_000)).toBe(legacy);
    expect(legacy.settings.rounds).toBe(3);
    expect(legacy.score).toEqual({ p1: 5, p2: 2 });
    expect(legacy.deadlineAt).toBe('2026-01-01T00:02:00.000Z');
  });

  it('keeps a legacy live round on its original scoring and normalization rules', () => {
    const fresh = begin();
    const legacy = { ...fresh, rulesVersion: undefined, roundId: undefined, phase: 'drawing' as const, answer: { ko: '무지개', es: 'arcoíris' }, deadlineAt: new Date(start.getTime() + 80_000).toISOString() };
    expect(isCorrectGuess(legacy, 'arcoiris')).toBe(false);
    expect(isCorrectGuess(legacy, 'arcoíris')).toBe(true);
    const scored = catchmindEngine.applyAction(legacy, 'p2', { type: 'guess', payload: { text: 'arcoíris' } });
    expect(scored.score).toEqual({ p1: 1, p2: 3 });
    expect(scored.rulesVersion).toBeUndefined();
  });

  it('collapses spaces and optional vowel accents but never merges n and ñ or matches substrings', () => {
    const s = begin();
    s.phase = 'drawing';
    s.answer = { ko: '  별 빛  ', es: 'piñata azul', aliases: { es: ['canción'] } };
    expect(isCorrectGuess(s, '  별   빛 ')).toBe(true);
    expect(isCorrectGuess(s, ' PIÑATA    AZUL ')).toBe(true);
    expect(isCorrectGuess(s, 'pinata azul')).toBe(false);
    expect(isCorrectGuess(s, 'cancion')).toBe(true);
    expect(isCorrectGuess(s, 'piñata')).toBe(false);
  });

  it('rejects custom answer collisions after the same accent and space normalization', () => {
    const fresh = begin();
    const conflicting = { ...fresh.settings, category_id: 'animals', customWords: [{ ko: '작은 별', es: 'canción' }, { ko: '작은   별', es: 'cancion' }] };
    expect(catchmindEngine.validateAction(fresh, 'p1', { type: 'settings', payload: { settings: conflicting } })).toBeTruthy();
  });
});
