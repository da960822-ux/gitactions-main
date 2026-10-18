import { applySharedEventAction, createSharedEventRound, type SharedEventAction, type SharedEventRound, type SharedEventSeat } from './sharedEventsState';

export interface EventSessionRecord { sessionId: string; seat: SharedEventSeat; revision: number; eventState: SharedEventRound | null; expiresAt: string; serverNow?: number; memberCount?: number }
export interface SharedEventStore {
  read(sessionId: string, actor: string): Promise<EventSessionRecord>;
  receipt(sessionId: string, requestId: string): Promise<{ user_id: string; signature: unknown } | null>;
  commit(sessionId: string, actor: string, action: SharedEventAction, next: SharedEventRound): Promise<EventSessionRecord>;
}
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
// JSON key ordering is not part of request identity (Postgres stores jsonb).
export function sameEventRequest(a: unknown, b: unknown): boolean {
  const canonical = (value: unknown): string => JSON.stringify(value, (_key, nested) => nested && typeof nested === 'object' && !Array.isArray(nested) ? Object.fromEntries(Object.keys(nested).sort().map(key => [key, nested[key]])) : nested);
  return canonical(a) === canonical(b);
}

/** The caller must obtain verifiedActor from auth.getUser, never from a request field. */
export async function executeSharedEventRequest(store: SharedEventStore, verifiedActor: string, input: unknown, now: number): Promise<EventSessionRecord> {
  if (!verifiedActor) throw new Error('authentication_required');
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_event_request');
  const request = input as { sessionId: string; action: SharedEventAction };
  if (Object.keys(request).some(key => !['sessionId', 'action'].includes(key)) || !uuid(request.sessionId) || !request.action || !uuid(request.action.requestId)) throw new Error('invalid_event_request');
  const session = await store.read(request.sessionId, verifiedActor);
  if (Date.parse(session.expiresAt) <= now) throw new Error('event_session_unavailable');
  const prior = await store.receipt(request.sessionId, request.action.requestId);
  if (prior) {
    if (prior.user_id !== verifiedActor || !sameEventRequest(prior.signature, request.action)) throw new Error('event_request_conflict');
    return session;
  }
  if (session.memberCount !== 2) throw new Error('event_session_not_ready');
  const current = session.eventState ?? createSharedEventRound();
  if (current.revision !== session.revision) throw new Error('event_state_invalid');
  const next = applySharedEventAction(current, session.seat, request.action, now);
  // Durable receipts hold request signatures; never repeat drawing content in every public snapshot.
  return store.commit(request.sessionId, verifiedActor, request.action, { ...next, receipts: [] });
}
