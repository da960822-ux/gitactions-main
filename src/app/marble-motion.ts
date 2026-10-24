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

export type MarbleMotionSeat = 'p1' | 'p2' | 'p3' | 'p4';
export type MarblePresentationFrame = {
  at: number; event: MarbleActionEvent; dice: boolean;
  positions: Record<string, number>;
  traveler: { seat: MarbleMotionSeat; tile: number; seq: number } | null;
};

export type MarbleJourneyDisplay = 'inspect' | 'moving' | 'arrived';

/** Keep the map's arrival label in step with the animated pawn, while an explicit city inspection takes precedence. */
export function marbleJourneyDisplay(input: {
  selectedTile: number;
  actionTile: number;
  displayedTile: number;
  traveler: { seat: MarbleMotionSeat } | null;
  playerId: MarbleMotionSeat;
  diceRolling: boolean;
}): MarbleJourneyDisplay {
  if (input.selectedTile !== input.actionTile) return 'inspect';
  if (input.diceRolling || input.traveler?.seat === input.playerId || input.displayedTile !== input.actionTile) return 'moving';
  return 'arrived';
}

// One clock orders confirmed dice, movement and arrival feedback. Long catch-up
// batches are shown through the persistent history instead of replaying old turns.
export function marblePresentationFrames(events: MarbleActionEvent[], from: Record<string, number>, to: Record<string, number>, size: number) {
  const frames: MarblePresentationFrame[] = [];
  let at = 0, positions = { ...from };
  for (const event of events) {
    const type = marbleEventType(event), seat = (event.actor && event.actor in positions ? event.actor : 'p1') as MarbleMotionSeat;
    frames.push({ at, event, dice: type === 'roll', positions: { ...positions }, traveler: null });
    if (type === 'move') {
      const start = Number.isInteger(event.from) ? Number(event.from) : positions[seat];
      const end = Number.isInteger(event.to) ? Number(event.to) : to[seat];
      const path = marbleMovementPath(start, end, 0, { sequence: marbleEventSequence(event), playerId: seat, effect: 'roll', from: start, to: end, steps: Number.isInteger(event.steps) ? Number(event.steps) : null }, true, seat, size);
      path.forEach(tile => {
        positions = { ...positions, [seat]: tile };
        frames.push({ at, event, dice: false, positions: { ...positions }, traveler: { seat, tile, seq: marbleEventSequence(event) } });
        at += 80;
      });
    } else at += type === 'roll' ? 620 : type === 'arrival' ? 640 : type === 'turn' ? 160 : 300;
  }
  // If the event window missed the end of a displacement, append from one stable
  // origin. Updating the origin inside the loop skips cells (3,5,8 instead of 3,4,5).
  for (const seat of Object.keys(to) as MarbleMotionSeat[]) {
    if (positions[seat] === to[seat] || !events.length) continue;
    const origin = positions[seat], gap = (to[seat] - origin + size) % size;
    const event = events.at(-1)!;
    for (let step = 1; step <= gap; step += 1) {
      const tile = (origin + step) % size;
      positions = { ...positions, [seat]: tile };
      frames.push({ at, event, dice: false, positions: { ...positions }, traveler: { seat, tile, seq: marbleEventSequence(event) } }); at += 80;
    }
  }
  if (events.length) frames.push({ at, event: events.at(-1)!, dice: false, positions: { ...to }, traveler: null });
  return frames;
}
