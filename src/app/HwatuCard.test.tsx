import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { minhwatuEngine } from '../games/minhwatu';
import type { MinhwatuCard } from '../games/minhwatu';
import { HwatuCard, HwatuFaceFallback } from './HwatuCard';

const assetId = (id: string) => id.split('-').map(part => part.padStart(2, '0')).join('-');

describe('Korean Hwatu face assets', () => {
  const state = minhwatuEngine.createInitialState(12);
  const cards = [...state.hands.p1, ...state.hands.p2, ...state.table, ...state.deck];
  const byId = new Map(cards.map(card => [card.id, card]));

  it('maps the complete 48-card month deck to the unchanged, source-verified faces', () => {
    expect(cards).toHaveLength(48);
    expect(new Set(cards.map(card => card.id)).size).toBe(48);
    const manifest = JSON.parse(readFileSync(resolve('public/images/hwatu/source-verification.json'), 'utf8'));
    expect(manifest.assets).toHaveLength(48);
    for (const entry of manifest.assets) {
      const [month, index] = entry.cardId.slice(1).split('-');
      const id = `${Number(month)}-${Number(index)}`;
      const filename = `${assetId(id)}.svg`;
      const source = readFileSync(resolve('public/images/hwatu', filename));
      expect(createHash('sha1').update(source).digest('hex'), filename).toBe(entry.sha1);
      expect(byId.has(id), filename).toBe(true);
    }
  });

  it('preserves the 5/9/10/24 category distribution and hallmark ribbon/yaku cards', () => {
    const counts = cards.reduce<Record<string, number>>((result, card) => {
      result[card.kind] = (result[card.kind] ?? 0) + 1;
      return result;
    }, {});
    expect(counts).toEqual({ bright: 5, animal: 9, ribbon: 10, plain: 24 });
    for (const id of ['1-2', '2-2', '3-2']) expect(byId.get(id)?.ribbonSet).toBe('red');
    for (const id of ['6-2', '9-2', '10-2']) expect(byId.get(id)?.ribbonSet).toBe('blue');
    for (const id of ['4-2', '5-2', '7-2']) expect(byId.get(id)?.ribbonSet).toBe('grass');
    expect(byId.get('2-1')?.kind).toBe('animal');
    expect(byId.get('4-1')?.kind).toBe('animal');
    expect(byId.get('8-2')?.kind).toBe('animal');
  });

  it('keeps month tags outside original artwork and labels the card accessibly in both locales', () => {
    const card = byId.get('12-1') as MinhwatuCard;
    const ko = renderToStaticMarkup(<HwatuCard card={card} language="ko"/>);
    const es = renderToStaticMarkup(<HwatuCard card={card} language="es"/>);
    expect(ko).toContain('src="/images/hwatu/12-01.svg"');
    expect(ko).toContain('aria-label="12월 · 비 · 비광 · 20 점"');
    expect(ko).toContain('>12월</span>');
    expect(es).toContain('aria-label="Mes 12 · lluvia · hombre bajo la lluvia · 20 pts"');
    expect(es).toContain('>Mes 12</span>');
    const compactEs = renderToStaticMarkup(<HwatuCard card={card} language="es" compactMonth/>);
    expect(compactEs).toContain('>12</span>');
    expect(compactEs).toContain('aria-label="Mes 12 · lluvia · hombre bajo la lluvia · 20 pts"');
    expect(ko).toContain('alt="" aria-hidden="true"');
  });

  it('shows the card identity as visible content when its face asset fails', () => {
    const fallback = renderToStaticMarkup(<HwatuFaceFallback month={12} flower="비" kind="비광" points={20} language="ko"/>);
    expect(fallback).toContain('class="gb-hwatu-face-fallback"');
    expect(fallback).toContain('>12월</b>');
    expect(fallback).toContain('>비</span>');
    expect(fallback).toContain('>비광</strong>');
    expect(fallback).toContain('>20 점</span>');
  });
});
