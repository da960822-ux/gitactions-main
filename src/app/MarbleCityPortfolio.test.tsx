import { Children, createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MarbleCityPortfolio } from './MarbleCityPortfolio';

const city = (index: number, owner = 'p1', houses = 0) => ({ kind: 'property', owner, houses, rent: 20, name: { ko: `도시 ${index}`, es: `Ciudad ${index}` } });
const props = { tiles: [], owner: 'p1', language: 'ko' as const, economicVersion: 3, onInspect: vi.fn() };
const render = (overrides: Partial<Parameters<typeof MarbleCityPortfolio>[0]>) => renderToStaticMarkup(createElement(MarbleCityPortfolio, { ...props, ...overrides }));
function buttons(node: ReactNode): { onClick: () => void }[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<{ children?: ReactNode; onClick: () => void }>(child)) return [];
    return child.type === 'button' ? [child.props] : buttons(child.props.children);
  });
}

describe('MarbleCityPortfolio', () => {
  it('shows only the selected owner’s properties, with exact stages and current rents', () => {
    const tiles = [city(0, 'p2'), ...[0, 1, 2, 3].map(level => city(level + 1, 'p1', level)), { kind: 'event', owner: 'p1' }];
    const html = render({ tiles });
    expect(html).toContain('<h3>내 도시</h3><span>4</span>');
    expect(html).not.toContain('도시 0');
    ['미건설 · 0단계', '단독주택 · 1단계', '아파트 · 2단계', '랜드마크 · 3단계'].forEach(stage => expect(html).toContain(stage));
    [20, 40, 60, 80].forEach(rent => expect(html).toContain(`<b>${rent}</b>`));
    expect(html.match(/<button/g)).toHaveLength(4);
  });

  it('uses Spanish labels and the existing rent multiplier', () => {
    const html = render({ tiles: [{ ...city(1, 'p3', 2), monopolyMultiplier: 2 }], owner: 'p3', language: 'es' });
    expect(html).toContain('Mis ciudades');
    expect(html).toContain('Abrir tarjeta de Ciudad 1 · Apartamentos · nivel 2 · Alquiler 120');
  });

  it('keeps overflow cities inspectable and forwards the original board index', () => {
    const onInspect = vi.fn();
    const tiles = [city(0, 'p2'), ...Array.from({ length: 10 }, (_, index) => city(index + 1))];
    const rows = buttons(MarbleCityPortfolio({ ...props, tiles, onInspect }));
    expect(rows).toHaveLength(10);
    rows[9].onClick();
    expect(onInspect).toHaveBeenCalledWith(10);
  });

  it('explains the empty state in either language without action buttons', () => {
    expect(render({})).toContain('구매한 도시가 여기에 표시돼요.');
    expect(render({ language: 'es' })).toContain('Las que compres aparecerán aquí.');
    expect(render({})).not.toContain('<button');
  });

  it('preserves legacy rent arithmetic for older boards', () => {
    const html = render({ tiles: [city(1, 'p1', 2)], economicVersion: 0 });
    expect(html).toContain('집 · 2단계');
    expect(html).toContain('<b>60</b>');
  });
});
