import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { catchmindEngine } from '../games/catchmind';
import CatchmindTable, { bucketFill, sendDrawQueue, composeDisplayedStrokes, catchmindPersistedSettingsKey, restoreCatchmindPenColor } from './CatchmindTable';

function configured(seed: number) {
  const state = catchmindEngine.createInitialState(seed);
  return catchmindEngine.applyAction(state, 'p1', { type: 'settings', payload: { settings: { ...state.settings, category_id: 'animals' } } });
}

function markup(player: 'p1' | 'p2', revealHint = false) {
  let state = configured(8);
  const answer = state.wordChoices[0][0];
  state = catchmindEngine.applyAction(state, 'p1', { type: 'choose', payload: { wordId: 0 } });
  if (revealHint) state = catchmindEngine.applyAction(state, 'p1', { type: 'reveal-hint' });
  return { answer, html: renderToStaticMarkup(createElement(CatchmindTable, {
    view: { ...catchmindEngine.getPlayerView(state, player), deadlineAt: new Date(Date.now() + 40_000).toISOString() },
    playerId: player,
    language: 'ko',
    now: Date.now(),
    palette: '#284f49',
    setPalette: vi.fn(),
    strokeWidth: 5,
    setStrokeWidth: vi.fn(),
    runAction: vi.fn(async () => true),
  })) };
}

function stateMarkup(state: ReturnType<typeof catchmindEngine.createInitialState>, player: 'p1' | 'p2', language: 'ko' | 'es' = 'ko') {
  return renderToStaticMarkup(createElement(CatchmindTable, {
    view: catchmindEngine.getPlayerView(state, player),
    playerId: player,
    language,
    now: Date.now(),
    palette: '#284f49',
    setPalette: vi.fn(),
    strokeWidth: 5,
    setStrokeWidth: vi.fn(),
    runAction: vi.fn(async () => true),
    onReplay: vi.fn(), replayPending: true,
  }));
}

describe('CatchmindTable', () => {
  it('offers exactly six single-choice topics to the host before a new match starts', () => {
    const state = catchmindEngine.createInitialState(23);
    const host = stateMarkup(state, 'p1'), guest = stateMarkup(state, 'p2');
    expect(host.match(/type="radio"/g)).toHaveLength(6);
    expect(host).toContain('하나만 선택');
    expect(host).toContain('호스트가 주제를 선택하고 설정을 저장해 주세요.');
    expect(guest).not.toContain('type="radio"');
    expect(markup('p1').html).not.toContain('type="radio"');
  });
  it('fills the entire blank canvas at a fractional pointer position, then treats the same color as a no-op', () => {
    const image = { width: 1000, height: 600, data: new Uint8ClampedArray(1000 * 600 * 4) } as ImageData;
    for (let at = 0; at < image.data.length; at += 4) image.data.set([255, 254, 250, 255], at);
    const putImageData = vi.fn();
    const context = { getImageData: () => image, putImageData } as unknown as CanvasRenderingContext2D;
    expect(bucketFill(context, 307.37, 183.91, '#284f49')).toBe(true);
    for (let at = 0; at < image.data.length; at += 4) {
      if (image.data[at] !== 40 || image.data[at + 1] !== 79 || image.data[at + 2] !== 73 || image.data[at + 3] !== 255) throw new Error(`Unfilled pixel ${at / 4}`);
    }
    expect(bucketFill(context, 999.9, 600, '#284f49')).toBe(false);
    expect(putImageData).toHaveBeenCalledOnce();
  });

  it('fills a closed region larger than the former 42 percent limit and preserves its border', () => {
    const image = { width: 1000, height: 600, data: new Uint8ClampedArray(1000 * 600 * 4) } as ImageData;
    for (let at = 0; at < image.data.length; at += 4) image.data.set([255, 255, 255, 255], at);
    const pixel = (x: number, y: number) => (y * 1000 + x) * 4;
    for (let x = 100; x <= 900; x++) for (const y of [80, 520]) image.data.set([0, 0, 0, 255], pixel(x, y));
    for (let y = 80; y <= 520; y++) for (const x of [100, 900]) image.data.set([0, 0, 0, 255], pixel(x, y));
    const context = { getImageData: () => image, putImageData: vi.fn() } as unknown as CanvasRenderingContext2D;
    expect(bucketFill(context, 150.4, 100.2, '#284f49')).toBe(true);
    let filled = 0;
    for (let at = 0; at < image.data.length; at += 4) if (image.data[at] === 40 && image.data[at + 1] === 79 && image.data[at + 2] === 73) filled++;
    expect(filled).toBe(799 * 439);
    expect(Array.from(image.data.slice(pixel(100, 100), pixel(100, 100) + 4))).toEqual([0, 0, 0, 255]);
    expect(image.data[pixel(99, 100)]).toBe(255);
  });

  it('shows the caller role and phase with public score values in both locales', () => {
    const drawer = markup('p1'), guesser = markup('p2');
    expect(drawer.html).toContain('출제자 · 그리는 중');
    expect(guesser.html).toContain('맞히는 사람 · 맞혀 보세요');
    expect(stateMarkup(catchmindEngine.applyAction(configured(8), 'p1', { type: 'choose', payload: { wordId: 0 } }), 'p1', 'es')).toContain('Dibujas');
    expect(drawer.html.match(/class="game-value"/g)).toHaveLength(2);
    expect(drawer.html).toContain('cm-phase-label');
  });

  it('shows the answer and drawing tools only to the drawer during a round', () => {
    const drawer = markup('p1'), guesser = markup('p2');
    expect(drawer.html).toContain(drawer.answer.ko);
    expect(drawer.html).toContain('cm-tools');
    expect(drawer.html).toContain('지우개');
    expect(drawer.html).toContain('실행 취소');
    expect(drawer.html).toContain('모두 지우기');
    expect(drawer.html).toContain('type="range"');
    expect(drawer.html.match(/class="cm-color /g)).toHaveLength(10);
    expect(guesser.html).not.toContain(drawer.answer.ko);
    expect(guesser.html).not.toContain(drawer.answer.es);
    expect(guesser.html).not.toContain('cm-tools');
    expect(guesser.html).toContain('첫 선을 기다리고 있어요');
    expect(guesser.html).toContain('cm-hint-word');
    expect(guesser.html).toContain(' / ');
    expect(guesser.html).toContain('□');
    expect(guesser.html).toContain('?');
    const hinted = markup('p2', true);
    expect(hinted.html).toContain('cm-hint-word');
    expect(hinted.html).toContain('class="cm-hint-word"');
    expect(hinted.html).not.toContain(hinted.answer.ko);
    expect(hinted.html).not.toContain(hinted.answer.es);
  });

  it('describes timeout rounds and finished games without claiming a correct answer', () => {
    let timedOut = configured(13);
    timedOut = catchmindEngine.applyAction(timedOut, 'p1', { type: 'choose', payload: { wordId: 0 } });
    timedOut = catchmindEngine.applyAction(timedOut, 'p1', { type: 'timeout' });
    const timeoutHtml = stateMarkup(timedOut, 'p1');
    expect(timeoutHtml).toContain('라운드 종료');
    expect(timeoutHtml).toContain('라운드가 끝났어요. 정답을 확인하고 다음 그림으로 넘어가요.');
    expect(timeoutHtml).not.toContain('정답을 맞혀서 두 사람 모두 점수를 얻었어요.');
    expect(timeoutHtml).not.toContain('정답은 출제자만 볼 수 있어요.');

    let solved = configured(17);
    solved = catchmindEngine.applyAction(solved, 'p1', { type: 'settings', payload: { settings: { ...solved.settings, rounds: 2 } } });
    const firstAnswer = solved.wordChoices[0][0];
    solved = catchmindEngine.applyAction(solved, 'p1', { type: 'choose', payload: { wordId: 0 } });
    solved = catchmindEngine.applyAction(solved, 'p2', { type: 'guess', payload: { text: firstAnswer.es } });
    solved = catchmindEngine.applyAction(solved, 'p1', { type: 'end-round' });
    const secondAnswer = solved.wordChoices[1][0];
    solved = catchmindEngine.applyAction(solved, 'p2', { type: 'choose', payload: { wordId: 0 } });
    solved = catchmindEngine.applyAction(solved, 'p1', { type: 'guess', payload: { text: secondAnswer.ko } });
    solved = catchmindEngine.applyAction(solved, 'p2', { type: 'end-round' });
    const finishedHtml = stateMarkup(solved, 'p1');
    expect(finishedHtml).toContain('게임 종료');
    expect(finishedHtml).toContain('같이 다시 시작하기');
    expect(finishedHtml).toContain('두 사람이 모두 수락하면 새 판을 시작해요.');
    expect(finishedHtml).not.toContain('내가 그리고 있어요');
    const finishedSpanishHtml = stateMarkup(solved, 'p1', 'es');
    expect(finishedSpanishHtml).toContain('Partida terminada');
    expect(finishedSpanishHtml).not.toContain('Tú dibujas');
  });

  it('fills a bounded canvas region with the selected hex color and preserves its border', () => {
    const width = 1000, height = 600;
    const imageData = { width, height, data: new Uint8ClampedArray(width * height * 4) } as ImageData;
    for (let at = 0; at < imageData.data.length; at += 4) {
      imageData.data[at] = imageData.data[at + 1] = imageData.data[at + 2] = imageData.data[at + 3] = 255;
    }
    const pixel = (x: number, y: number) => (y * width + x) * 4;
    for (let x = 5; x <= 15; x++) {
      imageData.data.set([0, 0, 0, 255], pixel(x, 5));
      imageData.data.set([0, 0, 0, 255], pixel(x, 15));
    }
    for (let y = 5; y <= 15; y++) {
      imageData.data.set([0, 0, 0, 255], pixel(5, y));
      imageData.data.set([0, 0, 0, 255], pixel(15, y));
    }
    const putImageData = vi.fn();
    const context = { getImageData: () => imageData, putImageData } as unknown as CanvasRenderingContext2D;

    expect(bucketFill(context, 10, 10, '#e57f6a')).toBe(true);
    expect(Array.from(imageData.data.slice(pixel(10, 10), pixel(10, 10) + 4))).toEqual([229, 127, 106, 255]);
    expect(Array.from(imageData.data.slice(pixel(5, 10), pixel(5, 10) + 4))).toEqual([0, 0, 0, 255]);
    expect(Array.from(imageData.data.slice(pixel(20, 10), pixel(20, 10) + 4))).toEqual([255, 255, 255, 255]);
    expect(putImageData).toHaveBeenCalledOnce();
  });

  it('keeps queued stroke snapshots in order and retains failed work for explicit retry', async () => {
    const queue = [
      { points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }], color: '#111111', width: 4, strokeId: 'first', segmentIndex: 0, round: 1 },
      { points: [{ x: 0.7, y: 0.7 }, { x: 0.8, y: 0.8 }], color: '#eeeeee', width: 9, strokeId: 'second', segmentIndex: 0, round: 1 },
    ];
    const sent: string[] = [];
    expect(await sendDrawQueue(queue, async batch => { sent.push(batch.color); return sent.length !== 1; })).toBe(false);
    expect(sent).toEqual(['#111111']);
    expect(queue).toHaveLength(2);
    expect(await sendDrawQueue(queue, async batch => { sent.push(batch.color); return true; })).toBe(true);
    expect(sent).toEqual(['#111111', '#111111', '#eeeeee']);
    expect(queue).toHaveLength(0);

    const failed = [{ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], color: '#111111', width: 4, strokeId: 'failed', segmentIndex: 0, round: 1 }];
    expect(await sendDrawQueue(failed, async () => { throw new Error('offline'); })).toBe(false);
    expect(failed).toHaveLength(1);
  });

  it('renders immutable queued segments before the active points and authoritative replay', () => {
    const authoritative = [{ points: [{ x: 0, y: 0 }, { x: .1, y: .1 }], color: '#222222', width: 3, order: 0 }];
    const queued = [
      { points: [{ x: .1, y: .1 }, { x: .2, y: .2 }], color: '#111111', width: 4, strokeId: 'pending', segmentIndex: 0, round: 1 },
      { points: [{ x: .2, y: .2 }, { x: .3, y: .3 }], color: '#e57f6a', width: 8, strokeId: 'pending', segmentIndex: 1, round: 1 },
    ];
    const active = { points: [{ x: .3, y: .3 }, { x: .4, y: .4 }], color: '#5786a1', width: 12, by: 'p1' as const };
    const displayed = composeDisplayedStrokes(authoritative, queued, active);
    expect(displayed.map(stroke => [stroke.color, stroke.width, stroke.points.at(-1)?.x])).toEqual([
      ['#222222', 3, .1], ['#111111', 4, .2], ['#e57f6a', 8, .3], ['#5786a1', 12, .4],
    ]);
    expect(composeDisplayedStrokes(authoritative, queued, null)).toHaveLength(3);
    const mergedAuthoritative = [{ strokeId: 'pending', segmentIndex: 1, points: [...queued[0].points, ...queued[1].points.slice(1)], color: '#111111', width: 4, order: 1 }];
    expect(composeDisplayedStrokes(mergedAuthoritative, queued, null)).toEqual(mergedAuthoritative);
    expect(composeDisplayedStrokes(mergedAuthoritative, [queued[1]], null)).toEqual(mergedAuthoritative);
  });
});


describe('Catchmind queue acknowledgement races', () => {
  it('keeps the next stroke when a refreshed snapshot removes the in-flight head', async () => {
    const first = { points: [{ x: 0, y: 0 }, { x: .1, y: .1 }], color: '#111111', width: 4, strokeId: 'first', segmentIndex: 0, round: 1 };
    const second = { ...first, color: '#222222', strokeId: 'second' };
    const queue = [first, second], sent: string[] = [];
    expect(await sendDrawQueue(queue, async batch => { sent.push(batch.strokeId); if (batch === first) queue.splice(0, 1); return true; })).toBe(true);
    expect(sent).toEqual(['first', 'second']);
    expect(queue).toEqual([]);
  });
});
