export type SharedEventId = 'R01' | 'R02' | 'R03' | 'R04';
export type SharedEventSeat = 'p1' | 'p2';
export type SharedEventActor = SharedEventSeat | 'system';
export type SharedEventIntent =
  | null
  | { decorId: 'fox' | 'cat' | 'penguin' | 'astronaut' | 'robot' | 'dragon' | 'sali-suli' }
  | { points: Array<{ x: number; y: number }> }
  | { pattern: number[] };
export type SharedEventStatus = 'proposed' | 'scheduled' | 'started' | 'cancelled' | 'expired';

export interface SharedEventRound {
  roundId: string;
  eventId: SharedEventId;
  revision: number;
  seed: number;
  ackBy: Partial<Record<SharedEventSeat, true>>;
  expiresAt: number;
  startAt: number | null;
  status: SharedEventStatus;
  intentBy: Partial<Record<SharedEventSeat, SharedEventIntent>>;
  readyBy: Partial<Record<SharedEventSeat, true>>;
  confirmBy: Partial<Record<SharedEventSeat, true>>;
  lastStartedAt: number | null;
  receipts: Array<{ requestId: string; actor: SharedEventActor; signature: string; revision: number }>;
}

export type SharedEventAction =
  | { type: 'propose'; requestId: string; revision: number; roundId: string; eventId: SharedEventId; intent: SharedEventIntent }
  | { type: 'contribute'; requestId: string; revision: number; roundId: string; intent: Exclude<SharedEventIntent, null> }
  | { type: 'acknowledge'; requestId: string; revision: number; roundId: string; pattern: number[] }
  | { type: 'ready' | 'confirm'; requestId: string; revision: number; roundId: string }
  | { type: 'cancel'; requestId: string; revision: number; roundId: string; reason?: 'cancel' | 'timeout' | 'disconnect' | 'hidden' };

export const SHARED_EVENT_READY_MS = 20_000;
export const SHARED_EVENT_COOLDOWN_MS = 30_000;
export const SHARED_EVENT_START_DELAY_MS = 700;
const MAX_RECEIPTS = 128;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECOR_IDS = new Set(['fox', 'cat', 'penguin', 'astronaut', 'robot', 'dragon', 'sali-suli']);

export function createSharedEventRound(): SharedEventRound {
  return { roundId: '', eventId: 'R01', revision: 0, seed: 0, ackBy: {}, expiresAt: 0, startAt: null, status: 'cancelled', intentBy: {}, readyBy: {}, confirmBy: {}, lastStartedAt: null, receipts: [] };
}

function fail(code: string): never { throw new Error(code); }
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function keysAre(value: Record<string, unknown>, allowed: string[]) { return Object.keys(value).every(key => allowed.includes(key)); }
function validUuid(value: unknown): value is string { return typeof value === 'string' && UUID.test(value); }

function validIntent(eventId: SharedEventId, intent: unknown): intent is SharedEventIntent {
  if (eventId === 'R01') return intent === null;
  if (!record(intent) || !keysAre(intent, eventId === 'R02' ? ['decorId'] : eventId === 'R03' ? ['points'] : ['pattern'])) return false;
  if (eventId === 'R02') return typeof intent.decorId === 'string' && DECOR_IDS.has(intent.decorId);
  if (eventId === 'R03') return Array.isArray(intent.points) && intent.points.length >= 1 && intent.points.length <= 200 && intent.points.every(point => record(point) && keysAre(point, ['x', 'y']) && Number.isFinite(point.x) && Number.isFinite(point.y) && (point.x as number) >= 0 && (point.x as number) <= 1 && (point.y as number) >= 0 && (point.y as number) <= 1);
  return Array.isArray(intent.pattern) && intent.pattern.length >= 1 && intent.pattern.length <= 6 && intent.pattern.every(step => Number.isInteger(step) && step >= 0 && step <= 5);
}

function hasRequiredIntents(state: SharedEventRound): boolean {
  if (state.eventId === 'R03') return Boolean((state.intentBy.p1 as { points?: unknown[] } | undefined)?.points?.length && (state.intentBy.p2 as { points?: unknown[] } | undefined)?.points?.length);
  if (state.eventId === 'R04') return Boolean((state.intentBy.p1 as { pattern?: unknown[] } | undefined)?.pattern?.length && (state.intentBy.p2 as { pattern?: unknown[] } | undefined)?.pattern?.length);
  return true;
}

export function advanceSharedEventRound(state: SharedEventRound, serverNow: number): SharedEventRound {
  if (!Number.isFinite(serverNow)) fail('invalid_server_time');
  if (state.status === 'proposed' && serverNow >= state.expiresAt) {
    return { ...state, revision: state.revision + 1, status: 'expired', startAt: null, ackBy: {}, readyBy: {}, confirmBy: {} };
  }
  if (state.status === 'scheduled' && state.startAt !== null && serverNow >= state.startAt) {
    return { ...state, revision: state.revision + 1, status: 'started', ackBy: {}, readyBy: {}, confirmBy: {}, lastStartedAt: state.startAt };
  }
  return state;
}

/** Applies one server-authenticated member action to a single shared-event round. */
export function applySharedEventAction(
  current: SharedEventRound,
  actor: SharedEventActor,
  action: SharedEventAction,
  serverNow: number,
): SharedEventRound {
  if (!Number.isFinite(serverNow)) fail('invalid_server_time');
  if (actor !== 'p1' && actor !== 'p2' && actor !== 'system') fail('not_event_member');
  if (!record(action)) fail('invalid_event_action');
  const allowed = action.type === 'acknowledge' ? ['type', 'requestId', 'revision', 'roundId', 'pattern'] : action.type === 'propose' ? ['type', 'requestId', 'revision', 'roundId', 'eventId', 'intent'] : action.type === 'contribute' ? ['type', 'requestId', 'revision', 'roundId', 'intent'] : action.type === 'cancel' ? ['type', 'requestId', 'revision', 'roundId', 'reason'] : ['type', 'requestId', 'revision', 'roundId'];
  if (!keysAre(action, allowed)) fail('invalid_event_action');
  if (!validUuid(action.requestId) || !Number.isSafeInteger(action.revision) || !validUuid(action.roundId)) fail('invalid_event_action');
  if (!['propose', 'contribute', 'acknowledge', 'ready', 'confirm', 'cancel'].includes(action.type)) fail('invalid_event_action');
  if (action.type === 'propose') {
    if (actor === 'system' || !['R01', 'R02', 'R03', 'R04'].includes(action.eventId as string) || !validIntent(action.eventId, action.intent)) fail('invalid_event_intent');
  } else if (action.type === 'contribute') {
    if (actor === 'system' || !record(action.intent) || !keysAre(action.intent, ['points', 'pattern'])) fail('invalid_event_intent');
  } else if (action.type === 'acknowledge') {
    if (!validIntent('R04', { pattern: action.pattern })) fail('invalid_event_intent');
  } else if (action.type !== 'cancel' && ('eventId' in action || 'intent' in action || 'reason' in action)) fail('invalid_event_action');
  else if (action.type === 'cancel' && action.reason !== undefined && !['cancel', 'timeout', 'disconnect', 'hidden'].includes(action.reason)) fail('invalid_event_action');
  if (action.type === 'cancel' && actor === 'system' && !['timeout', 'disconnect', 'hidden'].includes(action.reason ?? '')) fail('invalid_event_action');
  if (action.type === 'cancel' && actor !== 'system' && action.reason !== undefined && action.reason !== 'cancel') fail('invalid_event_action');
  if (action.type !== 'cancel' && actor === 'system') fail('not_event_member');

  const state = current;
  if (action.type === 'contribute' && (state.eventId !== 'R03' && state.eventId !== 'R04' || !validIntent(state.eventId, action.intent))) fail('invalid_event_intent');
  const signature = JSON.stringify(action);
  const prior = state.receipts.find(receipt => receipt.requestId === action.requestId);
  if (prior) {
    if (prior.actor !== actor || prior.signature !== signature) fail('event_request_conflict');
    return state;
  }
  if (state.receipts.length >= MAX_RECEIPTS) fail('event_receipt_limit');
  if (action.revision !== state.revision) fail('stale_event_state');
  if (state.status === 'proposed' && serverNow >= state.expiresAt) fail('event_round_expired');
  if (state.status === 'scheduled' && state.startAt !== null && serverNow >= state.startAt) fail('event_round_unavailable');

  let next: SharedEventRound;
  if (action.type === 'propose') {
    if (state.status === 'proposed' || state.status === 'scheduled') fail('event_round_unavailable');
    if (state.lastStartedAt !== null && serverNow < state.lastStartedAt + SHARED_EVENT_COOLDOWN_MS) fail('event_cooldown');
    next = { ...state, roundId: action.roundId, eventId: action.eventId, seed: parseInt(action.roundId.replaceAll('-', '').slice(-8), 16), ackBy: {}, revision: state.revision + 1, expiresAt: serverNow + SHARED_EVENT_READY_MS, startAt: null, status: 'proposed', intentBy: { [actor]: action.intent }, readyBy: {}, confirmBy: {} };
  } else {
    if (action.roundId !== state.roundId || !['proposed', 'scheduled'].includes(state.status)) fail(state.status === 'expired' ? 'event_round_expired' : 'event_round_unavailable');
    if (action.type === 'cancel') {
      next = { ...state, revision: state.revision + 1, status: action.reason === 'timeout' ? 'expired' : 'cancelled', startAt: null, ackBy: {}, readyBy: {}, confirmBy: {} };
    } else {
      if (state.status !== 'proposed') fail('event_round_unavailable');
      if (action.type === 'contribute') {
        next = { ...state, revision: state.revision + 1, intentBy: { ...state.intentBy, [actor]: action.intent }, ackBy: {}, readyBy: {}, confirmBy: {} };
      } else if (action.type === 'acknowledge') {
        const other = actor === 'p1' ? 'p2' : 'p1';
        if (state.eventId !== 'R04' || !hasRequiredIntents(state)) fail('event_both_contributions_required');
        if (JSON.stringify(action.pattern) !== JSON.stringify((state.intentBy[other] as { pattern: number[] }).pattern)) fail('event_pattern_mismatch');
        next = { ...state, revision: state.revision + 1, ackBy: { ...state.ackBy, [actor]: true } };
      } else if (action.type === 'ready') {
        if (state.eventId === 'R04' && (!state.ackBy.p1 || !state.ackBy.p2)) fail('event_both_acknowledged_required');
        if (!hasRequiredIntents(state)) fail('event_both_contributions_required');
      next = { ...state, revision: state.revision + 1, readyBy: { ...state.readyBy, [actor]: true } };
      } else {
        if (!hasRequiredIntents(state)) fail('event_both_contributions_required');
        if (!state.readyBy.p1 || !state.readyBy.p2) fail('event_both_ready_required');
        const confirmBy = { ...state.confirmBy, [actor]: true };
        const scheduled = Boolean(confirmBy.p1 && confirmBy.p2);
        next = { ...state, revision: state.revision + 1, confirmBy, status: scheduled ? 'scheduled' : state.status, expiresAt: scheduled ? 0 : state.expiresAt, startAt: scheduled ? serverNow + SHARED_EVENT_START_DELAY_MS : state.startAt };
      }
    }
  }
  return { ...next, receipts: [...state.receipts, { requestId: action.requestId, actor, signature, revision: next.revision }] };
}
