import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { isMarblePawnImageFailed, MarblePawn, MarblePawnPicker, marblePawnCatalog } from './MarblePawn';

describe('Marble pawn selection', () => {
  it('preserves all six saved skin slots before adding the approved seventh pair', () => {
    expect(marblePawnCatalog.slice(0, 6).map(pawn => pawn.id)).toEqual(['fox', 'cat', 'penguin', 'astronaut', 'robot', 'dragon']);
  });
  it('renders the approved two dogs as exactly one public pawn image in both languages', () => {
    for (const language of ['ko', 'es'] as const) {
      const html = renderToStaticMarkup(createElement(MarblePawn, { pawn: 'sali-suli', language }));
      expect(html.match(/<img /g)).toHaveLength(1);
      expect(html).toContain('src="/images/marble/premium/pawns/sali-suli.webp"');
      expect(html).toContain(language === 'ko' ? 'alt="살리·술리"' : 'alt="Sali y Suli"');
    }
  });
  it('limits a failed image to the same pawn and source so another asset still renders', () => {
    const failedSrc = '/images/marble/premium/pawns/sali-suli.webp';
    const failedImage = `sali-suli:${failedSrc}`;
    expect(isMarblePawnImageFailed(failedImage, 'sali-suli', failedSrc)).toBe(true);
    expect(isMarblePawnImageFailed(failedImage, 'fox', '/images/marble/pawns/fox.webp')).toBe(false);
    expect(isMarblePawnImageFailed(failedImage, 'sali-suli', '/images/marble/pawns/sali-suli.webp')).toBe(false);
  });
  it('shows the six original figures and the approved seventh pair but only enables engine-legal choices', () => {
    const html = renderToStaticMarkup(createElement(MarblePawnPicker, {
      view: {
        board: { pawns: { p1: 'fox', p2: 'cat' } },
        actions: [{ label: { ko: 'ACTION ID: PENGUIN', es: 'ACTION ID: PENGUIN' }, action: { type: 'choose-pawn', payload: { pawn: 'penguin' } } }],
      },
      playerId: 'p1', language: 'ko', runAction: vi.fn(),
    }));

    expect(marblePawnCatalog).toHaveLength(7);
    expect((html.match(/<button/g) ?? []).length).toBe(7);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('판다');
    expect(html).toContain('disabled=""');
    expect(html).toContain('alt="말티푸"');
    expect(html).toContain('alt="친칠라"');
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
    expect(html).toContain('Lisyeon');
    expect(html).toContain('Sali y Suli');
    expect(html).toContain('/images/marble/premium/pawns/sali-suli.webp');
    expect(html).not.toContain('Gata');
    expect(html).toContain('De tu pareja');
    expect(html).toContain('Elegir');
  });
});
