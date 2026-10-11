import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { claimInitialHwatuDeal, hwatuCueForEvent, hwatuCueTimeline, hwatuDestination, hwatuEventWindow, hwatuEventsAfter, type HwatuEvent } from './hwatu-motion';
import { HwatuMotion } from './HwatuMotion';

const event = (sequence: number, type: HwatuEvent['type'], extra: Partial<HwatuEvent> = {}): HwatuEvent => ({ sequence, type, title: { ko: '이벤트', es: 'Evento' }, ...extra });

afterEach(() => vi.unstubAllGlobals());

describe('Minhwatu public event motion contract', () => {
  it('starts quietly at the current sequence and only returns later committed events', () => {
    const current = [event(4, 'play')];
    expect(hwatuEventWindow(current, 0).fresh).toEqual([current[0]]);
    expect(hwatuEventsAfter(current, [event(4, 'play'), event(5, 'draw')]).map(item => item.type)).toEqual(['draw']);
    expect(hwatuEventsAfter(current, [event(4, 'play')])).toEqual([]);
  });

  it('deduplicates sequence snapshots and appends sound cues behind an active batch', () => {
    const repeated = [event(5, 'play'), event(6, 'draw'), event(6, 'draw')];
    expect(hwatuEventWindow(repeated, 4).fresh.map(item => item.sequence)).toEqual([5, 6]);
    const first = hwatuCueTimeline(3, 1000, 0);
    const appended = hwatuCueTimeline(2, 1080, first.nextCueAt);
    expect(first.times).toEqual([1000, 1320, 1640]);
    expect(appended.times).toEqual([1960, 2280]);
  });

  it('treats a lower sequence as a new quiet log window instead of replaying stale events', () => {
    const window = hwatuEventWindow([event(1, 'play'), event(2, 'draw')], 8);
    expect(window.reset).toBe(true);
    expect(window.latestSequence).toBe(2);
  });

  it('maps confirmed game events to distinct game cues and only celebrates a scored yaku', () => {
    expect(hwatuCueForEvent(event(1, 'play'), 'p1')).toBe('place');
    expect(hwatuCueForEvent(event(2, 'draw'), 'p1')).toBe('draw');
    expect(hwatuCueForEvent(event(3, 'capture'), 'p1')).toBe('capture');
    expect(hwatuCueForEvent(event(4, 'special', { yaku: { id: 'godori', label: { ko: '고도리', es: 'Godori' }, bonus: 0 } }), 'p1')).toBeNull();
    expect(hwatuCueForEvent(event(5, 'special', { yaku: { id: 'three-brights', label: { ko: '삼광', es: 'Tres brillantes' }, bonus: 3 } }), 'p1')).toBe('special');
    expect(hwatuCueForEvent(event(6, 'turn'), 'p1')).toBe('turn');
    expect(hwatuCueForEvent(event(7, 'win', { winner: 'p2' }), 'p1')).toBe('lose');
    expect(hwatuCueForEvent(event(8, 'win', { winner: 'draw' }), 'p1')).toBe('score');
  });

  it('routes captured cards to the actor category rack without exposing opponent hands', () => {
    expect(hwatuDestination({ id: '03-2', kind: 'ribbon', month: 3, flower: { ko: '벚꽃', es: 'cerezo' }, points: 5, badge: { ko: '띠', es: 'cinta' } }, 'p2')).toBe('captures-p2-ribbon');
    const capture = event(4, 'capture', { actor: 'p2', cards: [{ id: '03-2', kind: 'ribbon', month: 3, flower: { ko: '벚꽃', es: 'cerezo' }, points: 5, badge: { ko: '띠', es: 'cinta' } }], origins: { '03-2': 'draw' } });
    expect(capture.origins?.['03-2']).toBe('draw');
    expect(capture.cards?.[0].id).toBe('03-2');
  });

  it('allows a public initial deal only once per tab and stays quiet if storage is unavailable', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
    const deal = event(1, 'deal', { cards: Array.from({ length: 8 }, (_, index) => ({ id: `${index + 1}-1`, month: index + 1, kind: 'plain' as const, points: 0 as const, flower: { ko: '꽃', es: 'flor' }, badge: { ko: '피', es: 'simple' } })) });
    expect(claimInitialHwatuDeal(deal, 'motion')).toBe(true);
    expect(claimInitialHwatuDeal(deal, 'motion')).toBe(false);
    expect(claimInitialHwatuDeal(deal, 'sound')).toBe(true);
    vi.stubGlobal('sessionStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(claimInitialHwatuDeal(deal, 'motion')).toBe(false);
  });

  it('renders the current public event as static context without an initial motion marker', () => {
    const deal = event(1, 'deal', {
      title: { ko: '패를 섞어 놓았어요', es: 'Cartas listas' },
      cards: Array.from({ length: 8 }, (_, index) => ({
        id: `${index + 1}-1`, month: index + 1, kind: 'plain' as const, points: 0 as const,
        flower: { ko: '꽃', es: 'flor' }, badge: { ko: '피', es: 'simple' },
      })),
    });
    const html = renderToStaticMarkup(createElement(HwatuMotion, { events: [deal], language: 'es', playerId: 'p1' }));
    expect(html).toContain('Cartas listas');
    expect(html).not.toContain('is-animating');
    expect(html).not.toContain('is-fresh');
    expect(html).not.toContain('hwatu-flight');
    expect(html).not.toContain('opponent-secret-card-id');
    const empty = renderToStaticMarkup(createElement(HwatuMotion, { events: [], language: 'ko', playerId: 'p1' }));
    expect(empty).toContain('data-hwatu-motion');
    expect(empty).not.toContain('hwatu-motion-note');
  });
});
