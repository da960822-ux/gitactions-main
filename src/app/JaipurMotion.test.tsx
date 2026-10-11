import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { JaipurMotion, jaipurNoticeDuration, jaipurNoticeTitle } from './JaipurMotion';
import { JaipurBoard } from './JaipurBoard';
import type { JaipurEvent } from './jaipur-motion';

describe('Jaipur event presentation', () => {
  it('leaves snapshot settlement in board history without replaying its transient notice', () => {
    const event: JaipurEvent = { sequence: 12, round: 2, type: 'round-end', title: { ko: '2라운드 정산', es: 'Cuenta de la ronda 2' }, summary: {
        round: 2, winner: 'p1', cause: 'piles', camelCounts: { p1: 4, p2: 2 }, roundsWon: { p1: 1, p2: 1 },
        breakdown: {
          p1: { goods: 21, bonus: 3, sale: 24, camel: 5, total: 29, detailed: true },
          p2: { goods: 17, bonus: 0, sale: 17, camel: 0, total: 17, detailed: true },
        },
      } };
    const html = renderToStaticMarkup(createElement(JaipurMotion, { events: [event], language: 'es', playerId: 'p1' }));
    expect(html).not.toContain('Cuenta de la ronda 2');
    expect(html).not.toContain('jaipur-event-note');
    expect(html).not.toContain('jaipur-flight');
    const board = renderToStaticMarkup(createElement(JaipurBoard, {
      view: { turn: 'p1', log: [event], actions: [], ownHand: [], board: { round: 2, roundSummary: event.summary } },
      language: 'es', playerId: 'p1', runAction: vi.fn(),
    }));
    expect(board).toContain('jp-history-content');
    expect(board).toContain('Cuenta de la ronda 2');
    const historyText = board.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    expect(historyText).toContain('Mercancías 21');
    expect(historyText).toContain('Bonos 3');
  });

  it('leaves the previous-round ledger to the board when the next round has already started', () => {
    const html = renderToStaticMarkup(createElement(JaipurMotion, {
      events: [
        { sequence: 12, round: 1, type: 'round-end', title: { ko: '1라운드 정산', es: 'Cuenta de la ronda 1' } },
        { sequence: 13, round: 2, type: 'round-start', title: { ko: '2라운드 시작', es: 'Empieza la ronda 2' } },
      ],
      language: 'es', playerId: 'p1',
    }));
    expect(html).not.toContain('jaipur-event-note');
    expect(html).not.toContain('Cuenta de la ronda 1');
  });

  it.each(['ko', 'es'] as const)('does not replay an old bonus on %s snapshot mount', language => {
    const html = renderToStaticMarkup(createElement(JaipurMotion, {
      events: [{ sequence: 8, round: 1, type: 'bonus', title: { ko: '과거 보너스', es: 'Bono anterior' }, bonus: { size: 3, value: 2 } }],
      language, playerId: 'p1',
    }));
    expect(html).not.toContain('jaipur-event-note');
    expect(html).not.toContain('jaipur-flight');
  });

  it('uses the same finite lifetime for each notice in all motion modes', () => {
    const event = (type: JaipurEvent['type']): JaipurEvent => ({ sequence: 1, round: 1, type, title: { ko: '', es: '' } });
    expect(jaipurNoticeDuration(event('bonus'))).toBe(2600);
    expect(jaipurNoticeDuration(event('round-end'))).toBe(4500);
    expect(jaipurNoticeDuration(event('win'))).toBe(4500);
    expect(jaipurNoticeDuration(event('take-single'))).toBe(0);
    expect(jaipurNoticeDuration(null)).toBe(0);
  });

  it('uses public winner identity for both viewers instead of the shared victory title', () => {
    const event: JaipurEvent = { sequence: 8, round: 2, type: 'win', winner: 'p1', title: { ko: '공유 승리', es: '¡Partida ganada!' } };
    expect(jaipurNoticeTitle(event, 'ko', 'p1')).toBe('경기에서 이겼어요!');
    expect(jaipurNoticeTitle(event, 'ko', 'p2')).toBe('상대가 이겼어요.');
    expect(jaipurNoticeTitle(event, 'es', 'p1')).toBe('¡Ganaste la partida!');
    expect(jaipurNoticeTitle(event, 'es', 'p2')).toBe('Ganó tu pareja.');
    expect(jaipurNoticeTitle({ ...event, winner: 'draw' }, 'ko', 'p1')).toBe('경기 무승부');
    expect(jaipurNoticeTitle({ ...event, winner: 'draw' }, 'es', 'p2')).toBe('Partida empatada');
    expect(jaipurNoticeTitle({ ...event, winner: undefined }, 'es', 'p1')).toBe('Resultado del partido');
  });
});
