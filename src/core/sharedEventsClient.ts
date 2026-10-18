import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { onlineDb } from './supabase';
import { createSharedEventRound, type SharedEventAction, type SharedEventRound, type SharedEventSeat } from './sharedEventsState';
import type { EventSessionRecord } from './sharedEventsServer';

export const isSharedEventsConfigured = Boolean(onlineDb);
export interface SharedEventSnapshot {
  sessionId: string; seat: SharedEventSeat; memberCount: number; expiresAt: number;
  round: SharedEventRound; serverNow: number; deliveryDelayMs?: number; connection: 'connected' | 'reconnecting'; syncEpoch: number;
}
export type SharedEventSend =
  | Pick<Extract<SharedEventAction, { type: 'propose' }>, 'type' | 'eventId' | 'intent'>
  | Pick<Extract<SharedEventAction, { type: 'contribute' }>, 'type' | 'intent'>
  | { type: 'acknowledge'; pattern: number[] }
  | { type: 'ready' | 'confirm' | 'cancel' };

export class SharedEventsClient {
  private value: SharedEventSnapshot | null = null;
  private listeners = new Set<(value: SharedEventSnapshot | null) => void>();
  private channel: RealtimeChannel | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private refreshing: Promise<SharedEventSnapshot> | null = null;
  private generation = 0;
  private dirty = false;
  private channelEpoch = 0;
  private needsResync = false;
  private paused = false;
  private panelPaused = false;
  private pausing: Promise<void> | null = null;
  private cleanupEvents: (() => void) | null = null;
  constructor(private db: SupabaseClient | null = onlineDb) {}
  getSnapshot = () => this.value;
  private emit() { for (const listener of this.listeners) listener(this.value); }
  private database() { if (!this.db) throw new Error('online_unavailable'); return this.db; }
  private async authenticate() {
    const db = this.database(); const { data, error } = await db.auth.getSession(); if (error) throw error;
    if (!data.session) { const result = await db.auth.signInAnonymously(); if (result.error) throw result.error; }
  }
  private async rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await this.database().rpc(name, args); if (error) throw new Error(error.message); return data;
  }
  async createSession(): Promise<SharedEventSnapshot> {
    await this.authenticate();
    const id = await this.rpc('create_event_session', {});
    return this.enter(id);
  }
  async joinSession(inviteCode: string): Promise<SharedEventSnapshot> {
    const id = inviteCode.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new Error('invalid_event_invite');
    await this.authenticate(); await this.rpc('join_event_session', { p_session: id });
    return this.enter(id);
  }
  private async enter(id: string) {
    if (this.value && this.value.sessionId !== id) await this.pause();
    this.generation++; this.stop(); this.paused = false; this.panelPaused = false; this.needsResync = true;
    const record: EventSessionRecord = await this.rpc('refresh_event_session', { p_session: id });
    this.value = null; this.accept(record); this.connect(); return this.value!;
  }
  private accept(record: EventSessionRecord, deliveryDelayMs = 0) {
    if (this.value && record.sessionId !== this.value.sessionId) return;
    if (this.value && record.revision < this.value.round.revision) return;
    const syncEpoch = (this.value?.syncEpoch ?? 0) + (this.needsResync ? 1 : 0);
    this.needsResync = false;
    this.value = { sessionId: record.sessionId, seat: record.seat, memberCount: record.memberCount ?? this.value?.memberCount ?? 1,
      expiresAt: Date.parse(record.expiresAt), round: { ...(record.eventState ?? createSharedEventRound()), receipts: [] },
      serverNow: record.serverNow ?? Date.now(), deliveryDelayMs, connection: this.paused ? 'reconnecting' : 'connected', syncEpoch };
    this.emit(); this.schedule();
  }
  async snapshot(sessionId = this.value?.sessionId): Promise<SharedEventSnapshot> {
    if (!sessionId || (this.value && sessionId !== this.value.sessionId)) throw new Error('event_session_unavailable');
    if (this.refreshing) return this.refreshing;
    const generation = this.generation;
    const request = (async () => {
      const requestedAt = performance.now();
      const record = await this.rpc('refresh_event_session', { p_session: sessionId });
      if (generation !== this.generation) throw new Error('event_session_unavailable');
      this.accept(record, performance.now() - requestedAt); return this.value!;
    })().catch(error => {
      if (generation === this.generation && /event_session_(unavailable|expired)/.test(error.message)) { this.generation++; this.stop(); this.value = null; this.emit(); }
      throw error;
    });
    this.refreshing = request;
    try { return await request; } finally {
      if (this.refreshing === request) this.refreshing = null;
      if (generation === this.generation && this.dirty && this.value && !this.paused) {
        this.dirty = false; void this.snapshot().catch(() => { if (generation === this.generation) this.disconnected(); });
      }
    }
  }
  async send(input: SharedEventSend): Promise<SharedEventSnapshot> {
    if (!this.value) throw new Error('event_session_unavailable');
    const action = { ...input, requestId: crypto.randomUUID(), revision: this.value.round.revision,
      roundId: input.type === 'propose' ? crypto.randomUUID() : this.value.round.roundId } as SharedEventAction;
    return this.act(action);
  }
  async act(action: SharedEventAction): Promise<SharedEventSnapshot> {
    return this.invokeAction(action, true);
  }
  private async invokeAction(action: SharedEventAction, retryCancellation: boolean): Promise<SharedEventSnapshot> {
    if (!this.value || this.paused || this.value.connection !== 'connected') throw new Error('event_session_unavailable');
    const sessionId = this.value.sessionId, generation = this.generation;
    const body = { sessionId, action };
    // Retry only this exact idempotent request, never silently rebase consent on newer content.
    for (let attempt = 0; attempt < 2; attempt++) {
      const requestedAt = performance.now();
      const { data, error } = await this.database().functions.invoke('shared-event', { body });
      if (generation !== this.generation) throw new Error('event_session_unavailable');
      if (!error) { this.accept(data, performance.now() - requestedAt); return this.snapshot(); }
      if (attempt === 0 && error.name === 'FunctionsFetchError') continue;
      let code = error.message;
      try { code = (await error.context?.json())?.error ?? code; } catch { /* Transport errors have no JSON body. */ }
      const fresh = await this.snapshot().catch(() => { if (generation === this.generation) this.disconnected(); });
      if (retryCancellation && code === 'stale_event_state' && action.type === 'cancel' && fresh?.round.roundId === action.roundId && ['proposed', 'scheduled'].includes(fresh.round.status)) {
        // Revocation can follow a peer's new consent, but never cancel a different round.
        return this.invokeAction({ ...action, requestId: crypto.randomUUID(), revision: fresh.round.revision }, false);
      }
      throw new Error(code);
    }
    throw new Error('event_request_failed');
  }
  async pause(explicit = true): Promise<void> {
    this.paused = true; this.needsResync = true;
    if (explicit) this.panelPaused = true;
    if (this.timer) clearTimeout(this.timer); this.timer = null;
    if (this.pausing) return this.pausing;
    if (!this.value) return;
    const request = this.rpc('pause_event_session', { p_session: this.value.sessionId }).then(() => {});
    this.pausing = request;
    try { await request; } finally { if (this.pausing === request) this.pausing = null; }
  }
  async resume(): Promise<SharedEventSnapshot> {
    if (!this.value || !this.foreground()) throw new Error('event_session_unavailable');
    // A rapid reopen must read after the preceding cancellation has committed.
    if (this.pausing) await this.pausing;
    if (this.refreshing) await this.refreshing.catch(() => {});
    if (!this.value || !this.foreground()) throw new Error('event_session_unavailable');
    this.panelPaused = false; this.paused = false; this.needsResync = true;
    try { return await this.snapshot(); }
    catch (error) { this.paused = true; this.panelPaused = true; throw error; }
  }
  private foreground() {
    return (typeof document === 'undefined' || document.visibilityState !== 'hidden') && (typeof navigator === 'undefined' || navigator.onLine !== false);
  }
  async closeSession(): Promise<void> {
    if (this.value) await this.rpc('close_event_session', { p_session: this.value.sessionId });
    this.generation++; this.stop(); this.value = null; this.emit();
  }
  subscribe(listener: (value: SharedEventSnapshot | null) => void) {
    this.listeners.add(listener); listener(this.value); if (this.value && !this.channel) this.connect();
    return () => { this.listeners.delete(listener); if (!this.listeners.size) { void this.pause().catch(() => {}); this.stop(); } };
  }
  private schedule() {
    if (this.timer) clearTimeout(this.timer); this.timer = null;
    if (!this.value || this.paused || !this.listeners.size) return;
    const { round, serverNow, expiresAt } = this.value;
    let delay = Math.max(50, expiresAt - serverNow);
    if (round.status === 'proposed') delay = Math.min(5000, Math.max(50, round.expiresAt - serverNow));
    else if (round.status === 'scheduled') delay = Math.max(25, Math.min(5000, (round.startAt ?? serverNow) - serverNow + 25));
    const generation = this.generation;
    this.timer = setTimeout(() => { void this.snapshot().catch(() => { if (generation === this.generation) this.disconnected(); }); }, delay);
  }
  private disconnected() {
    this.needsResync = true;
    if (this.value) { this.value = { ...this.value, connection: 'reconnecting' }; this.emit(); }
    void this.pause(false).catch(() => {});
  }
  private connect() {
    if (!this.value || this.channel || !this.listeners.size) return;
    const id = this.value.sessionId, generation = this.generation, channelEpoch = ++this.channelEpoch;
    const current = () => generation === this.generation && channelEpoch === this.channelEpoch && this.value?.sessionId === id;
    const refresh = () => {
      if (!current() || this.paused) return;
      if (this.refreshing) { this.dirty = true; return; }
      void this.snapshot().catch(() => { if (current()) this.disconnected(); });
    };
    this.channel = this.database().channel(`shared-event:${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_sessions', filter: `id=eq.${id}` }, refresh)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'event_sessions' }, payload => {
        if (current() && payload.old.id === id) { this.generation++; this.stop(); this.value = null; this.emit(); }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_session_members', filter: `session_id=eq.${id}` }, refresh)
      .on('system', { event: '*' }, payload => {
        if (payload.status === 'ok' && payload.extension === 'postgres_changes') refresh();
      })
      .subscribe(status => {
        if (!current()) return;
        if (status === 'SUBSCRIBED') {
          if (!this.panelPaused && this.foreground()) { this.paused = false; refresh(); }
        }
        else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) this.disconnected();
      });
    const hide = () => { if (document.visibilityState === 'hidden') void this.pause(false).catch(() => {}); else resume(); };
    const resume = () => { if (!this.panelPaused && this.foreground()) void this.resume().catch(() => { if (current()) this.disconnected(); }); };
    const offline = () => this.disconnected();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', resume); window.addEventListener('offline', offline);
      document.addEventListener('visibilitychange', hide);
      this.cleanupEvents = () => { window.removeEventListener('online', resume); window.removeEventListener('offline', offline); document.removeEventListener('visibilitychange', hide); };
    }
    this.schedule();
  }
  private stop() {
    this.channelEpoch++;
    const channel = this.channel; this.channel = null;
    if (channel) void this.db?.removeChannel(channel);
    if (this.timer) clearTimeout(this.timer); this.timer = null;
    this.cleanupEvents?.(); this.cleanupEvents = null; this.refreshing = null; this.dirty = false;
  }
}
export const sharedEventsClient = new SharedEventsClient();
