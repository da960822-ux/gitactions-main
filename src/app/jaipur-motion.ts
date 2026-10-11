import type { AudioCue } from '../audio/audio';
import type { JaipurEvent as EngineJaipurEvent } from '../games/jaipur';

export type JaipurEvent = EngineJaipurEvent;
type JaipurCardEvent = NonNullable<JaipurEvent['cards']>[number];

export function jaipurSequence(event: JaipurEvent | null | undefined): number {
  const value = event?.sequence;
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : 0;
}

export function jaipurEventWindow(events: readonly JaipurEvent[], sequence: number) {
  const latestSequence = events.reduce((max, event) => Math.max(max, jaipurSequence(event)), 0);
  const reset = sequence > 0 && latestSequence < sequence;
  return {
    latestSequence,
    reset,
    fresh: events.filter(event => jaipurSequence(event) > (reset ? 0 : sequence)).slice().sort((a, b) => jaipurSequence(a) - jaipurSequence(b)),
  };
}

export function jaipurCueForEvent(event: JaipurEvent): AudioCue | null {
  switch (event.type) {
    case 'take-single': return 'place';
    case 'exchange': return 'exchange';
    case 'take-camels': return 'camel';
    case 'sale': return 'sell';
    case 'market-refill': return 'draw';
    case 'bonus': return 'bonus';
    case 'round-end': return 'score';
    case 'win': return 'win';
    case 'round-start': return 'event';
    default: return null;
  }
}

export function jaipurCuesForEvent(event: JaipurEvent): AudioCue[] {
  const cue = jaipurCueForEvent(event);
  return event.type === 'sale' ? ['sell', 'coin'] : cue ? [cue] : [];
}

export type JaipurFlight = { id: string; good: string; mark?: string; cardId?: string; from: string; to: string; delay: number; kind: 'card' | 'token' | 'bonus' };

export function jaipurFlights(event: JaipurEvent, playerId: string): JaipurFlight[] {
  const actor = event.actor ?? playerId;
  const flights: JaipurFlight[] = [];
  const addCards = (cards: JaipurCardEvent[] | undefined, from: string, to: string, prefix: string) => {
    cards?.forEach((card, index) => {
      if (!card.good) return;
      const cardKey = card.id || `slot-${card.slot ?? index}`;
      const cardTarget = card.id && (to === 'market' || to === 'hand');
      flights.push({ id: `${event.sequence}:${prefix}:${cardKey}`, good: card.good, cardId: card.id, from: `${from}:${cardKey}`, to: cardTarget ? `${to}:${cardKey}` : to, delay: Math.min(index, 4) * 55, kind: 'card' });
    });
  };

  if (event.type === 'take-single') addCards(event.cards, 'market', actor === playerId ? 'hand' : 'opponent-hand', 'take');
  if (event.type === 'exchange') {
    addCards(event.cards, 'market', actor === playerId ? 'hand' : 'opponent-hand', 'exchange-in');
    addCards(event.given, actor === playerId ? 'hand' : 'opponent-hand', 'market', 'exchange-out');
  }
  if (event.type === 'take-camels') addCards(event.cards, 'market', `herd-${actor}`, 'camel');
  if (event.type === 'sale') {
    addCards(event.cards, actor === playerId ? 'hand' : 'opponent-hand', 'sale', 'sale');
    (event.tokenValues ?? []).forEach((value, index) => flights.push({ id: `${event.sequence}:token:${index}`, good: String(value), mark: event.cards?.[0]?.good, from: 'sale', to: `tokens-${actor}`, delay: 130 + 55 * Math.min(index, 4), kind: 'token' }));
  }
  if (event.type === 'market-refill') addCards(event.cards, 'deck', 'market', 'refill');
  if (event.type === 'bonus' && event.bonus) flights.push({ id: `${event.sequence}:bonus`, good: String(event.bonus.value), from: 'bonus', to: `tokens-${actor}`, delay: 0, kind: 'bonus' });
  return flights;
}
