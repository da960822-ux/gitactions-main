export const MAX_DRAW_POINTS = 200;
export const DRAW_GRID_COLUMNS = 5;
export const DRAW_GRID_ROWS = 5;

type StartObservation = {
  sessionId: string;
  seat: 'p1' | 'p2';
  syncEpoch: number;
  connection: 'connected' | 'reconnecting';
  serverNow: number;
  deliveryDelayMs?: number;
  round: {
    roundId: string;
    eventId: string;
    status: string;
    startAt: number | null;
    confirmBy: Partial<Record<'p1' | 'p2', true>>;
  };
};

export function canChooseNewRound(status: string | null | undefined) {
  return status !== 'proposed' && status !== 'scheduled';
}

/** Only animate a newly confirmed live start. Recovery snapshots never replay. */
export function sharedStartMode(previous: StartObservation | null, next: StartObservation): 'animate' | 'settle' | null {
  const priorConsent = previous?.round.status === 'scheduled'
    || (previous?.round.status === 'proposed' && Boolean(previous.round.confirmBy[previous.seat]));
  const isLiveStart = Boolean(previous
    && previous.sessionId === next.sessionId
    && previous.connection === 'connected'
    && next.connection === 'connected'
    && previous.syncEpoch === next.syncEpoch
    && previous.round.roundId === next.round.roundId
    && priorConsent
    && ['R01', 'R02', 'R03'].includes(next.round.eventId)
    && next.round.status === 'started'
    && next.round.startAt !== null
    && next.serverNow >= next.round.startAt);
  if (!isLiveStart) return null;
  return next.serverNow - next.round.startAt! > 250 || (next.deliveryDelayMs ?? 0) > 250 ? 'settle' : 'animate';
}

export function gridPoint(index: number) {
  return { x: (index % DRAW_GRID_COLUMNS) / (DRAW_GRID_COLUMNS - 1), y: Math.floor(index / DRAW_GRID_COLUMNS) / (DRAW_GRID_ROWS - 1) };
}

export function appendDrawingPoint(points: Array<{ x: number; y: number }>, point: { x: number; y: number }) {
  if (points.length >= MAX_DRAW_POINTS || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return points;
  return [...points, { x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) }];
}

export function matchesPattern(input: number[], target: number[]) {
  return input.length === target.length && input.every((step, index) => step === target[index]);
}
