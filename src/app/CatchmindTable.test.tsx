import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { catchmindEngine } from '../games/catchmind';
import CatchmindTable, { bucketFill, composeDisplayedStrokes, sendDrawQueue } from './CatchmindTable';

function markup(player: 'p1' | 'p2', revealHint = false) {
  let state = catchmindEngine.createInitialState(8);
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
  }));
}

describe('CatchmindTable', () => {
  it('shows the caller role and phase with public score values in both locales', () => {
    const drawer = markup('p1'), guesser = markup('p2');
    expect(drawer.html).toContain('출제자 · 그리는 중');
    expect(guesser.html).toContain('맞히는 사람 · 맞혀 보세요');
    const choosingState = catchmindEngine.createInitialState(8);
    expect(stateMarkup(choosingState, 'p1')).toContain('제시어 선택');
    expect(stateMarkup(choosingState, 'p2')).toContain('상대가 제시어를 고르는 중');
    expect(stateMarkup(choosingState, 'p2', 'es')).toContain('Tu pareja está eligiendo');
    expect(stateMarkup(catchmindEngine.applyAction(catchmindEngine.createInitialState(8), 'p1', { type: 'choose', payload: { wordId: 0 } }), 'p1', 'es')).toContain('Dibujas');
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
    const hinted = markup('p2', true);
    expect(hinted.html).toContain('cm-hint-word');
    expect(hinted.html).toContain('class="cm-hint-word"');
    expect(hinted.html).not.toContain(hinted.answer.ko);
    expect(hinted.html).not.toContain(hinted.answer.es);
  });

  it('describes timeout rounds and finished games without claiming a correct answer', () => {
    let timedOut = catchmindEngine.createInitialState(13);
    timedOut = catchmindEngine.applyAction(timedOut, 'p1', { type: 'choose', payload: { wordId: 0 } });
    timedOut = catchmindEngine.applyAction(timedOut, 'p1', { type: 'timeout' });
    const timeoutHtml = stateMarkup(timedOut, 'p1');
    expect(timeoutHtml).toContain('라운드 종료');
    expect(timeoutHtml).toContain('라운드가 끝났어요. 정답을 확인하고 다음 그림으로 넘어가요.');
    expect(timeoutHtml).not.toContain('정답을 맞혀서 두 사람 모두 점수를 얻었어요.');
    expect(timeoutHtml).not.toContain('정답은 출제자만 볼 수 있어요.');

    let solved = catchmindEngine.createInitialState(17);
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
    expect(finishedHtml).toContain('최종 결과');
    expect(finishedHtml).not.toContain('내가 그리고 있어요');
    const finishedSpanishHtml = stateMarkup(solved, 'p1', 'es');
    expect(finishedSpanishHtml).toContain('Resultado final');
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

    expect(bucketFill(context, 10.2, 10.2, '#e57f6a')).toBe(true);
    expect(Array.from(imageData.data.slice(pixel(10, 10), pixel(10, 10) + 4))).toEqual([229, 127, 106, 255]);
    expect(Array.from(imageData.data.slice(pixel(5, 10), pixel(5, 10) + 4))).toEqual([0, 0, 0, 255]);
    expect(Array.from(imageData.data.slice(pixel(20, 10), pixel(20, 10) + 4))).toEqual([255, 255, 255, 255]);
    expect(putImageData).toHaveBeenCalledOnce();
    expect(bucketFill(context, 999.9, 599.9, '#e57f6a')).toBe(false);
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
