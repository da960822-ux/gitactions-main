import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DominoEventStage } from './DominoEventStage';

describe('Domino event stage', () => {
  it('shows the current domino and localized announcement statically on the first render', () => {
    const html = renderToStaticMarkup(createElement(DominoEventStage, {
      events: [{ sequence: 3, type: 'play', actor: 'p1', title: { ko: '놓기 6|4', es: 'Jugar 6|4' }, tile: { a: 6, b: 4 }, side: 'right' }],
      language: 'es', playerId: 'p1',
    }));
    expect(html).toContain('Jugar 6|4');
    expect(html).toContain('domino-event-tile-art');
    expect(html).toContain('domino-tile--premium');
    expect(html.match(/class="domino-pip"/g)?.length).toBe(10);
    expect(html).toContain('aria-label="Jugar 6|4"');
    expect(html).not.toContain('is-animating');
  });

  it('keeps scores and round win presentation grounded in event fields', () => {
    const html = renderToStaticMarkup(createElement(DominoEventStage, {
      events: [{ sequence: 5, type: 'capicua', title: { ko: '카피쿠아 보너스', es: 'Bono capicúa' }, points: 25, team: 'p1' }],
      language: 'ko', playerId: 'p2',
    }));
    expect(html).toContain('카피쿠아 보너스');
    expect(html).toContain('+25');
    expect(html).toContain('25');
    expect(html).toContain('domino-event-seal');
    expect(html).toContain('aria-live="polite" aria-atomic="true"></span>');
    expect(html).not.toContain('is-animating');
  });

  it('renders the localized event detail and labels the cooperative team from the viewer seat', () => {
    const html = renderToStaticMarkup(createElement(DominoEventStage, {
      events: [{ sequence: 8, type: 'win', team: 'p1', title: { ko: '매치 종료', es: 'Fin del partido' }, text: { ko: '사람 팀이 이겼어요.', es: 'Ganó el equipo humano.' } }],
      language: 'es', playerId: 'p2', ownTeam: 'p1',
    }));
    expect(html).toContain('Ganó el equipo humano.');
    expect(html).toContain('Ganó tu equipo');
    expect(html).not.toContain('Tu pareja');
  });

  it('uses a neutral result title when the viewer loses and preserves draw titles', () => {
    const losingEvent = { sequence: 9, type: 'win', team: 'p1', title: { ko: '경기 승리', es: '¡Partido ganado!' } };
    const spanishLoss = renderToStaticMarkup(createElement(DominoEventStage, { events: [losingEvent], language: 'es', playerId: 'p2', ownTeam: 'p2' }));
    const koreanLoss = renderToStaticMarkup(createElement(DominoEventStage, { events: [losingEvent], language: 'ko', playerId: 'p2', ownTeam: 'p2' }));
    const draw = renderToStaticMarkup(createElement(DominoEventStage, { events: [{ sequence: 10, type: 'win', title: { ko: '무승부', es: 'Empate' } }], language: 'es', playerId: 'p2' }));
    expect(spanishLoss).toContain('aria-label="Resultado del partido"');
    expect(spanishLoss).toContain('<strong>Resultado del partido</strong>');
    expect(spanishLoss).toContain('Ganó el equipo rival');
    expect(spanishLoss).not.toContain('¡Partido ganado!');
    expect(koreanLoss).toContain('aria-label="경기 결과"');
    expect(koreanLoss).toContain('상대 팀 승리');
    expect(koreanLoss).not.toContain('경기 승리');
    expect(draw).toContain('aria-label="Empate"');
    expect(draw).toContain('<strong>Empate</strong>');
  });

  it('labels the other human as a teammate only in cooperative mode', () => {
    const event = { sequence: 2, type: 'play', actor: 'p2', tile: { a: 0, b: 3 } };
    const render = (mode: string) => renderToStaticMarkup(createElement(DominoEventStage, { events: [event], playerId: 'p1', language: 'es', mode }));
    expect(render('1v1')).toContain('Rival');
    expect(render('humans-vs-bots')).toContain('Compañero');
  });

  it('does not call Paso corrido a bonus when the event has no bonus points', () => {
    const html = renderToStaticMarkup(createElement(DominoEventStage, {
      events: [{ sequence: 9, type: 'paso-corrido', title: { ko: '연속 패스', es: 'Paso corrido' } }],
      language: 'es', playerId: 'p1',
    }));
    expect(html).toContain('Paso corrido');
    expect(html).not.toContain('Bono por pases seguidos');
  });
});
