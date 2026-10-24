import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CoupleResultMoment, coupleResultWinner } from './CoupleResultMoment';
import type { GameResult } from '../core/types';

const players = [{ id: 'p1' as const, nickname: 'Lisbeth' }, { id: 'p2' as const, nickname: '연석' }];
const result: GameResult = { winner: 'p1', reason: 'confirmed match result' };
const props = { gameId: 'davinci' as const, result, players };

describe('confirmed couple result picture', () => {
  it('maps actual named identities independently of host seat or nickname language', () => {
    expect(coupleResultWinner(props)).toBe('lisbeth');
    expect(coupleResultWinner({ ...props, result: { ...result, winner: 'p2' } })).toBe('yeonseok');
    expect(coupleResultWinner({ ...props, players: [{ id: 'p1', nickname: ' Yeonseok ' }, { id: 'p2', nickname: '리스벳' }] })).toBe('yeonseok');
  });
  it('does not invent an identity or rivalry for unknown, duplicate, drawn or unfinished matches', () => {
    expect(coupleResultWinner({ ...props, result: null })).toBeNull();
    expect(coupleResultWinner({ ...props, result: { ...result, winner: 'draw' } })).toBeNull();
    expect(coupleResultWinner({ ...props, players: [{ id: 'p1', nickname: 'Baby' }, players[1]] })).toBeNull();
    expect(coupleResultWinner({ ...props, players: [{ id: 'p1', nickname: 'Yeonseok' }, players[1]] })).toBeNull();
    expect(coupleResultWinner({ ...props, gameId: 'rhythm' })).toBeNull();
  });
  it('resolves mixed Domino teams and omits a shared humans-versus-bots victory', () => {
    expect(coupleResultWinner({ ...props, gameId: 'domino' })).toBeNull();
    expect(coupleResultWinner({ ...props, gameId: 'domino', teams: { p1: ['p1', 'b1'], p2: ['p2', 'b2'] } })).toBe('lisbeth');
    expect(coupleResultWinner({ ...props, gameId: 'domino', teams: { p1: ['p1', 'p2'], p2: ['b1', 'b2'] } })).toBeNull();
    expect(coupleResultWinner({ ...props, gameId: 'domino', result: { ...result, winner: 'p2' }, teams: { p1: ['p1', 'p2'], p2: ['b1', 'b2'] } })).toBeNull();
  });
  it('uses the matched approved asset, localized readable copy and an ordinary dismiss button', () => {
    const html = renderToStaticMarkup(createElement(CoupleResultMoment, { ...props, language: 'es' }));
    expect(html).toContain('/images/approved-couple-room/result-lisbeth-wins.png');
    expect(html).toContain('Ganó Lisbeth. Te felicito con cariño. La próxima partida ya es otra historia ♡');
    expect(html).toContain('Ocultar imagen');
    expect(html).toContain('role="img"');
    expect(html).toContain('/images/approved-couple-room/approved-couple-gaming-room.png');
    expect(html).toContain('/images/approved-couple-room/foreground-semantic-mask.png');
    expect(html).toContain('/images/approved-couple-room/result-lisbeth-mask.png');
    expect(html).toContain('mask-type:alpha');
    expect(html).toContain('1 -1 -1 0 0');
    expect(html).toContain('operator="dilate" radius="1"');
    expect(html).not.toContain('dialog');
    expect(renderToStaticMarkup(createElement(CoupleResultMoment, { ...props, result: null, language: 'ko' }))).toBe('');
  });
});
