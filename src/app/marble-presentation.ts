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
      if (windowed.fresh.length) {
        // shortcut: snapshots may contain a long catch-up; history retains every receipt.
        const fresh = windowed.fresh;
        const turn = fresh.map(event => event.type).lastIndexOf('turn');
        const currentTurn = fresh.slice(Math.max(0, turn));
        const money = currentTurn.filter(event => event.moneyDelta && Object.values(event.moneyDelta).some(delta => delta !== 0));
        const compact = currentTurn.length > 3
          ? [...new Map([...money.slice(-2), ...currentTurn.slice(-1)].map(event => [marbleEventSequence(event), event])).values()].sort((a, b) => marbleEventSequence(a) - marbleEventSequence(b))
          : currentTurn;
        // A newer action supersedes unfinished decoration from the previous snapshot.
        cancel();
        pending = compact;
      }
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
