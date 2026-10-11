import type { AudioCue } from '../audio/audio';
import type { PlayerId } from '../core/types';
import type { MinhwatuCard, MinhwatuEvent } from '../games/minhwatu';

export type HwatuEvent = MinhwatuEvent;
export const HWATU_EVENT_INTERVAL = 320;

export function hwatuSequence(event: HwatuEvent | null | undefined): number {
  return Number.isSafeInteger(event?.sequence) && Number(event?.sequence) > 0 ? Number(event?.sequence) : 0;
}

export function hwatuEventWindow(events: readonly HwatuEvent[], sequence: number) {
  const ordered = [...new Map(events.map(event => [hwatuSequence(event), event] as const).filter(([value]) => value > 0)).values()]
    .sort((a, b) => hwatuSequence(a) - hwatuSequence(b));
  const latestSequence = ordered.at(-1) ? hwatuSequence(ordered.at(-1)) : 0;
  const reset = sequence > 0 && latestSequence < sequence;
  const fresh = ordered.filter(event => hwatuSequence(event) > (reset ? 0 : sequence));
  return { latestSequence, reset, fresh };
}

export function hwatuCueTimeline(count: number, now: number, nextCueAt: number) {
  const start = Math.max(now, nextCueAt);
  return { times: Array.from({ length: count }, (_, index) => start + index * HWATU_EVENT_INTERVAL), nextCueAt: start + count * HWATU_EVENT_INTERVAL };
}

export function hwatuCueForEvent(event: HwatuEvent, playerId: PlayerId): AudioCue | null {
  switch (event.type) {
    case 'deal': return 'deal';
    case 'play': return 'place';
    case 'draw': return 'draw';
    case 'capture': return 'capture';
    case 'special': return event.yaku?.bonus && event.yaku.bonus > 0 ? 'special' : null;
    case 'turn': return 'turn';
    case 'win': return event.winner === 'draw' ? 'score' : event.winner === playerId ? 'win' : 'lose';
    default: return null;
  }
}

export function claimInitialHwatuDeal(event: HwatuEvent | null | undefined, channel: 'motion' | 'sound'): boolean {
  if (event?.type !== 'deal' || !event.cards?.length || typeof sessionStorage === 'undefined') return false;
  const key = `dos-minhwatu-deal-v1-${channel}`;
  const signature = `${hwatuSequence(event)}:${event.cards.map(card => card.id).join(',')}`;
  try {
    if (sessionStorage.getItem(key) === signature) return false;
    sessionStorage.setItem(key, signature);
    return true;
  } catch { return false; }
}

export function hwatuEvents(view: any): HwatuEvent[] {
  const values = Array.isArray(view?.log) ? view.log : Array.isArray(view?.board?.actionLog) ? view.board.actionLog : [];
  return values.filter((event: unknown): event is HwatuEvent => Boolean(event && typeof event === 'object' && Number.isSafeInteger((event as HwatuEvent).sequence)));
}

export function hwatuEventsAfter(previous: readonly HwatuEvent[], next: readonly HwatuEvent[]): HwatuEvent[] {
  const priorSequence = previous.reduce((max, event) => Math.max(max, hwatuSequence(event)), 0);
  return hwatuEventWindow(next, priorSequence).fresh;
}

export function hwatuDestination(card: MinhwatuCard, actor: PlayerId): string {
  return `captures-${actor}-${card.kind}`;
}
