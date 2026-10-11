import { marbleEventSequence, marbleEventWindow, type MarbleActionEvent } from './marble-motion';

export const MARBLE_EVENT_INTERVAL = 640;

// A single display callback owns both the card and its cue.
export function marblePresentation(present: (event: MarbleActionEvent | null, animate: boolean, audible: boolean) => void) {
  let sequence: number | null = null;
  let viewer = '';
  let current: MarbleActionEvent | null = null;
  let pending: MarbleActionEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pending = [];
  };
  const advance = () => {
    const event = pending.shift();
    if (!event) { timer = null; present(current, false, false); return; }
    current = event;
    present(event, true, true);
    timer = setTimeout(advance, MARBLE_EVENT_INTERVAL);
  };
  return {
    update(events: readonly MarbleActionEvent[], playerId: string, reduced: boolean, finished: boolean) {
      const ordered = events.filter(event => marbleEventSequence(event) > 0).slice().sort((a, b) => marbleEventSequence(a) - marbleEventSequence(b));
      const latest = ordered.at(-1) ?? null;
      const windowed = marbleEventWindow(ordered, sequence ?? 0);
      if (sequence === null || viewer !== playerId || windowed.reset || finished) {
        cancel();
        sequence = windowed.latestSequence;
        viewer = playerId;
        current = latest;
        present(latest, false, false);
        return;
      }
      sequence = windowed.latestSequence;
      pending.push(...windowed.fresh);
      if (reduced) {
        const last = pending.at(-1);
        const playing = timer !== null;
        cancel();
        if (last) { current = last; present(last, false, true); }
        else if (current && playing) present(current, false, false);
      } else if (timer === null && pending.length) advance();
    },
    dispose() { cancel(); sequence = null; },
  };
}
