import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MarblePawnPicker, marblePawnCatalog } from './MarblePawn';

describe('Marble pawn selection', () => {
  it('shows the six original figures but only enables engine-legal choices', () => {
    const html = renderToStaticMarkup(createElement(MarblePawnPicker, {
      view: {
        board: { pawns: { p1: 'fox', p2: 'cat' } },
        actions: [{ label: { ko: 'ACTION ID: PENGUIN', es: 'ACTION ID: PENGUIN' }, action: { type: 'choose-pawn', payload: { pawn: 'penguin' } } }],
      },
      playerId: 'p1', language: 'ko', runAction: vi.fn(),
    }));

    expect(marblePawnCatalog).toHaveLength(6);
    expect((html.match(/<button/g) ?? []).length).toBe(6);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('판다');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-label="말티푸"');
    expect(html).toContain('aria-label="친칠라"');
    expect(html).toContain('상대 말');
    expect(html).toContain('선택</span>');
    expect(html).not.toContain('ACTION ID');
  });

  it('does not render a picker unless the engine offers a valid pawn action', () => {
    const props = { view: { board: { pawns: { p1: 'fox' } }, actions: [{ action: { type: 'roll' } }] }, playerId: 'p1' as const, language: 'es' as const, runAction: vi.fn() };
    expect(renderToStaticMarkup(createElement(MarblePawnPicker, props))).toBe('');
    expect(renderToStaticMarkup(createElement(MarblePawnPicker, { ...props, view: { ...props.view, actions: [{ action: { type: 'choose-pawn', payload: { pawn: 'unlisted' } } }] } }))).toBe('');
  });

  it('uses Spanish names and concise status text', () => {
    const html = renderToStaticMarkup(createElement(MarblePawnPicker, {
      view: { board: { pawns: { p1: 'fox', p2: 'cat' } }, actions: [{ action: { type: 'choose-pawn', payload: { pawn: 'penguin' } } }] },
      playerId: 'p1', language: 'es', runAction: vi.fn(),
    }));
    expect(html).toContain('Panda');
    expect(html).toContain('Ragdoll');
    expect(html).not.toContain('Gata');
    expect(html).toContain('De tu pareja');
    expect(html).toContain('Elegir');
  });
});
