import type { AudioCue } from '../audio/audio';

export type MarbleActionEvent = {
  sequence?: number;
  seq?: number;
  type?: string;
  actor?: string;
  title?: Partial<Record<'ko' | 'es', string>>;
  text?: Partial<Record<'ko' | 'es', string>>;
  amount?: number;
  moneyDelta?: Partial<Record<string, number>>;
  tile?: number;
  from?: number;
  to?: number;
  steps?: number;
  cardId?: string;
  [key: string]: unknown;
};

export function marbleEventSequence(event: MarbleActionEvent | null | undefined): number {
  const sequence = event?.sequence ?? event?.seq;
  return Number.isSafeInteger(sequence) && Number(sequence) > 0 ? Number(sequence) : 0;
}

export function marbleEventsAfter(events: readonly MarbleActionEvent[], sequence: number): MarbleActionEvent[] {
  return events.filter(event => marbleEventSequence(event) > sequence).sort((a, b) => marbleEventSequence(a) - marbleEventSequence(b));
}

export function marbleEventWindow(events: readonly MarbleActionEvent[], sequence: number) {
  const latestSequence = events.reduce((max, event) => Math.max(max, marbleEventSequence(event)), 0);
  const reset = sequence > 0 && latestSequence < sequence;
  return { reset, latestSequence, fresh: marbleEventsAfter(events, reset ? 0 : sequence) };
}

export function marbleEventType(event: MarbleActionEvent): string {
  return typeof event.type === 'string' ? event.type : event.id || event.effect ? 'event-card' : '';
}

export function marbleMoneyDelta(event: MarbleActionEvent, playerId: string): number | null {
  const delta = event.moneyDelta?.[playerId];
  if (typeof delta === 'number' && Number.isFinite(delta)) return delta;
  if (typeof event.cashDelta === 'number' && Number.isFinite(event.cashDelta)) return event.cashDelta;
  return null;
}

export function marbleCueForEvent(event: MarbleActionEvent): AudioCue | null {
  switch (marbleEventType(event)) {
    case 'roll': return 'dice';
    case 'move': case 'pawn': case 'train': return 'move';
    case 'arrival': case 'event-card': case 'island': case 'escape': case 'bonus': return 'event';
    case 'buy': return 'buy';
    case 'build': return 'build';
    case 'rent': case 'tax': return 'toll';
    case 'loan': case 'repay': return 'loan';
    case 'crisis': case 'bankruptcy': return 'crisis';
    case 'monopoly-warning': return 'warning';
    case 'turn': return 'turn';
    case 'win': return 'win';
    default: return null;
  }
}

export type MarbleMoveEvent = {
  sequence: number;
  playerId: string;
  effect: string;
  from: number | null;
  to: number | null;
  steps: number | null;
};

export function marbleMovementPath(
  from: number,
  to: number,
  diceSteps: number,
  event: MarbleMoveEvent | null,
  eventChanged: boolean,
  playerId: string,
  tileCount = 18,
) {
  const path: number[] = [];
  const size = Math.max(1, tileCount);
  const append = (start: number, steps: number) => {
    for (let step = 1; step <= Math.min(Math.abs(steps), size); step += 1) {
      path.push(((start + Math.sign(steps) * step) % size + size) % size);
    }
  };

  if (eventChanged && event?.playerId === playerId && event.from !== null && event.to !== null) {
    if (event.effect === 'train') {
      if (event.steps !== null) append(event.from, event.steps);
      else if (event.to !== event.from) path.push(event.to);
    } else if (event.effect === 'island') {
      append(event.from, event.steps ?? (event.to - event.from + size) % size);
    } else if (event.effect === 'card' || event.effect === 'move' || event.effect === 'visit') {
      append(from, diceSteps || (event.from - from + size) % size);
      const afterDice = path.at(-1) ?? from;
      if (afterDice !== event.from) append(afterDice, (event.from - afterDice + size) % size);
      if (path.at(-1) !== event.to) append(event.from, event.steps ?? (event.to - event.from + size) % size);
    } else {
      append(from, event.steps ?? (event.to - from + size) % size);
    }
  } else {
    append(from, diceSteps || (to - from + size) % size);
  }

  if (path.at(-1) !== to) append(path.at(-1) ?? from, (to - (path.at(-1) ?? from) + size) % size);
  return path;
}

export function marbleGridPosition(index: number, tileCount: number): [number, number] | undefined {
  if (tileCount === 18) return marblePath18[index];
  if (index < 0 || index >= tileCount) return undefined;
  if (tileCount === 32) {
    if (index < 9) return [9 - index, 9];
    if (index < 16) return [1, 9 - (index - 8)];
    if (index < 25) return [index - 15, 1];
    return [9, index - 23];
  }
  if (tileCount !== 40) return undefined;
  if (index < 11) return [11 - index, 11];
  if (index < 20) return [1, 21 - index];
  if (index < 31) return [index - 19, 1];
  return [11, index - 29];
}

const marblePath18: readonly [number, number][] = [
  [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5],
  [6, 4], [6, 3], [6, 2], [6, 1], [5, 1], [4, 1],
  [3, 1], [2, 1], [1, 1], [1, 2], [1, 3], [1, 4],
];
