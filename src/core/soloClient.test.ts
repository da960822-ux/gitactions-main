import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiTurnDelay, chooseSimpleAiAction } from '../games/simpleAi';

const database = vi.hoisted(() => ({
  auth: { getSession: vi.fn(), signInAnonymously: vi.fn() },
  rpc: vi.fn(), channel: vi.fn(), removeChannel: vi.fn(),
  functions: { invoke: vi.fn() },
}));
vi.mock('./supabase', () => ({ onlineDb: database }));

let solo: (typeof import('./client'))['soloClient'];
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers();
  vi.spyOn(crypto, 'getRandomValues').mockImplementation((array: any) => { array[0] = 17; return array; });
  const module = await import('./client');
  expect(module.isOnlineConfigured).toBe(true);
  solo = module.soloClient;
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });

async function pendingOpponent() {
  const roomId = await solo.createRoom('검수 플레이어', 'ko');
  await solo.selectGame('minhwatu');
  const off = solo.subscribeRoom(roomId, () => {});
  await solo.sendAction(solo.getSnapshot().view.actions[0].action);
  expect(solo.getSnapshot().view.turn).toBe('p2');
  expect(vi.getTimerCount()).toBe(1);
  return off;
}

describe('solo client with an online database configured', () => {
  it('stays entirely local, creates an immediately playable game and protects the computer seat', async () => {
    await pendingOpponent();
    const snapshot = solo.getSnapshot();
    expect(snapshot).toMatchObject({ mode: 'solo', playerId: 'p1', connection: 'local', pendingGame: null, gameId: 'minhwatu' });
    expect(snapshot.roomId).toMatch(/^solo-/);
    expect(snapshot.players[1].nickname).toBe('컴퓨터');
    expect(() => solo.localSeat('p2')).toThrow('solo_seat_fixed');
    await expect(solo.joinRoom(snapshot.roomId!, '다른 플레이어', 'es')).rejects.toThrow('solo_session_only');
    await vi.advanceTimersByTimeAsync(aiTurnDelay('minhwatu'));
    await solo.closeRoom();
    for (const call of [database.auth.getSession, database.auth.signInAnonymously, database.rpc, database.channel, database.removeChannel, database.functions.invoke]) expect(call).not.toHaveBeenCalled();
  });

  it('takes one computer action after the delay and cancels work when the last subscriber leaves', async () => {
    const off = await pendingOpponent(), before = solo.getSnapshot().version;
    expect(aiTurnDelay('minhwatu')).toBeGreaterThan(700);
    await vi.advanceTimersByTimeAsync(700);
    expect(solo.getSnapshot().version).toBe(before);
    await vi.advanceTimersByTimeAsync(aiTurnDelay('minhwatu') - 701);
    expect(solo.getSnapshot().version).toBe(before);
    await vi.advanceTimersByTimeAsync(1);
    expect(solo.getSnapshot().version).toBe(before + 1);
    off();
    expect(vi.getTimerCount()).toBe(0);
    const paused = solo.getSnapshot().version;
    await vi.advanceTimersByTimeAsync(10000);
    expect(solo.getSnapshot().version).toBe(paused);
  });

  it('uses only one timer across multiple subscribers and resumes after re-subscribing', async () => {
    const first = await pendingOpponent(), roomId = solo.getSnapshot().roomId!;
    const second = solo.subscribeRoom(roomId, () => {});
    expect(vi.getTimerCount()).toBe(1);
    first(); expect(vi.getTimerCount()).toBe(1);
    second(); expect(vi.getTimerCount()).toBe(0);
    const version = solo.getSnapshot().version;
    const resumed = solo.subscribeRoom(roomId, () => {});
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(aiTurnDelay('minhwatu'));
    expect(solo.getSnapshot().version).toBe(version + 1);
    resumed();
  });

  it('cancels the previous game action on game switch, rematch and close', async () => {
    const off = await pendingOpponent();
    await solo.selectGame('jaipur');
    expect(vi.getTimerCount()).toBe(0);
    const switched = structuredClone(solo.getSnapshot());
    await vi.advanceTimersByTimeAsync(1000);
    expect(solo.getSnapshot()).toEqual(switched);
    await solo.selectGame('minhwatu');
    await solo.sendAction(solo.getSnapshot().view.actions[0].action);
    expect(vi.getTimerCount()).toBe(1);
    await solo.selectGame('minhwatu');
    expect(vi.getTimerCount()).toBe(0);
    expect(solo.getSnapshot().view.hand).toHaveLength(10);
    await solo.sendAction(solo.getSnapshot().view.actions[0].action);
    expect(vi.getTimerCount()).toBe(1);
    await solo.closeRoom();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(solo.getSnapshot()).toMatchObject({ roomId: null, view: null, gameId: null });
    off();
  });

  it('gives Marble dice and movement presentation time before the next computer action', async () => {
    const roomId = await solo.createRoom('검수 플레이어', 'ko');
    await solo.selectGame('marble');
    const off = solo.subscribeRoom(roomId, () => {});
    for (let step = 0; step < 12 && solo.getSnapshot().view.turn === 'p1'; step++) {
      const action = chooseSimpleAiAction('marble', solo.getSnapshot().view, 'p1', () => .3);
      expect(action).toBeTruthy();
      await solo.sendAction(action!);
    }
    expect(solo.getSnapshot().view.turn).toBe('p2');
    expect(aiTurnDelay('marble')).toBeGreaterThan(700);
    const version = solo.getSnapshot().version;
    await vi.advanceTimersByTimeAsync(700);
    expect(solo.getSnapshot().version).toBe(version);
    await vi.advanceTimersByTimeAsync(aiTurnDelay('marble') - 700);
    expect(solo.getSnapshot().version).toBe(version + 1);
    off();
  });

  it('rejects excluded games without replacing the current match', async () => {
    await solo.createRoom('검수 플레이어', 'ko');
    await solo.selectGame('jaipur');
    const before = structuredClone(solo.getSnapshot());
    for (const game of ['catchmind', 'rhythm'] as const) await expect(solo.selectGame(game)).rejects.toThrow('solo_game_unavailable');
    expect(solo.getSnapshot()).toEqual(before);
  });
});
