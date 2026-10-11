import type { AudioCue } from '../audio/audio';

export type DominoActionEvent = {
  sequence?: number;
  seq?: number;
  type?: string;
  actor?: string;
  title?: Partial<Record<'ko' | 'es', string>>;
  text?: Partial<Record<'ko' | 'es', string>>;
  tile?: { a: number; b: number };
  side?: 'left' | 'right';
  ends?: { left: number; right: number } | null;
  count?: number;
  points?: number;
  team?: string;
  round?: number;
};

export function dominoSequence(event: DominoActionEvent | null | undefined) {
  const value = event?.sequence ?? event?.seq;
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : 0;
}

export function dominoWindow(events: readonly DominoActionEvent[], sequence: number) {
  const latest = events.reduce((max, event) => Math.max(max, dominoSequence(event)), 0);
  const reset = sequence > 0 && latest < sequence;
  return { latest, reset, fresh: events.filter(event => dominoSequence(event) > (reset ? 0 : sequence)).sort((a, b) => dominoSequence(a) - dominoSequence(b)) };
}

export function dominoCueForEvent(event: DominoActionEvent): AudioCue | null {
  switch (event.type) {
    case 'play': return 'place';
    case 'pass': return 'pass';
    case 'turn': return 'turn';
    case 'tranque': return 'tranque';
    case 'capicua': return 'capicua';
    case 'paso-corrido': return 'paso';
    case 'round-end': case 'score': return 'score';
    case 'win': return 'win';
    case 'round-start': return 'event';
    default: return null;
  }
}
