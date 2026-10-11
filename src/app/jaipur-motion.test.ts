import { describe, expect, it } from 'vitest';
import { jaipurCueForEvent, jaipurCuesForEvent, jaipurEventWindow, jaipurFlights, type JaipurEvent } from './jaipur-motion';

const event = (sequence: number, type: string, extra: Record<string, unknown> = {}) => ({ sequence, round: 1, type, title: { ko: type, es: type }, ...extra }) as JaipurEvent;

describe('Jaipur committed motion events', () => {
  it('queues only fresh events in sequence order and treats a lower sequence as a new round', () => {
    const events = [event(8, 'bonus'), event(6, 'sale'), event(7, 'market-refill')];
    expect(jaipurEventWindow(events, 5).fresh.map(event => event.sequence)).toEqual([6, 7, 8]);
    expect(jaipurEventWindow(events, 8).fresh).toEqual([]);
    expect(jaipurEventWindow([event(1, 'round-start')], 8)).toMatchObject({ reset: true, latestSequence: 1, fresh: [{ sequence: 1 }] });
    expect(jaipurEventWindow([], 8)).toMatchObject({ reset: true, latestSequence: 0, fresh: [] });
  });

  it('maps committed action families to distinct Jaipur sounds', () => {
    const cues = [
      ['take-single', 'place'], ['exchange', 'exchange'], ['take-camels', 'camel'], ['sale', 'sell'],
      ['market-refill', 'draw'], ['bonus', 'bonus'], ['round-end', 'score'], ['win', 'win'],
    ] as const;
    for (const [type, cue] of cues) expect(jaipurCueForEvent(event(1, type))).toBe(cue);
    expect(jaipurCuesForEvent({ sequence: 1, round: 1, type: 'sale', title: { ko: '판매', es: 'Venta' } })).toEqual(['sell', 'coin']);
  });

  it('defines simultaneous reciprocal card flights for an exchange', () => {
    const flights = jaipurFlights(event(3, 'exchange', { actor: 'p1', cards: [{ id: 'm-2', good: 'gold', slot: 2 }], given: [{ id: 'h-1', good: 'cloth', slot: 1 }] }), 'p1');
    expect(flights).toEqual([
      { id: '3:exchange-in:m-2', good: 'gold', cardId: 'm-2', from: 'market:m-2', to: 'hand:m-2', delay: 0, kind: 'card' },
      { id: '3:exchange-out:h-1', good: 'cloth', cardId: 'h-1', from: 'hand:h-1', to: 'market:h-1', delay: 0, kind: 'card' },
    ]);
  });

  it('sends public camels to the herd and market refills from the deck', () => {
    expect(jaipurFlights(event(4, 'take-camels', { actor: 'p2', cards: [{ id: 'm-c', good: 'camel' }] }), 'p1')[0]).toMatchObject({ from: 'market:m-c', to: 'herd-p2', kind: 'card' });
    expect(jaipurFlights(event(5, 'market-refill', { cards: [{ id: 'm-new', good: 'diamond', slot: 0 }] }), 'p1')[0]).toMatchObject({ from: 'deck:m-new', to: 'market:m-new', kind: 'card' });
  });

  it('stages sold goods, their token values, and a separate bonus reveal', () => {
    const sale = jaipurFlights(event(6, 'sale', { actor: 'p1', cards: [{ id: 'h-1', good: 'spice' }], tokenValues: [5, 4] }), 'p1');
    expect(sale.map(({ from, to, delay, kind }) => ({ from, to, delay, kind }))).toEqual([
      { from: 'hand:h-1', to: 'sale', delay: 0, kind: 'card' },
      { from: 'sale', to: 'tokens-p1', delay: 130, kind: 'token' },
      { from: 'sale', to: 'tokens-p1', delay: 185, kind: 'token' },
    ]);
    expect(jaipurFlights(event(7, 'bonus', { actor: 'p2', bonus: { size: 3, value: 3 } }), 'p1')[0]).toMatchObject({ good: '3', from: 'bonus', to: 'tokens-p2', kind: 'bonus' });
  });
});
