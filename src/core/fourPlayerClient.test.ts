import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FourPlayerClient, fourEngines } from './fourPlayerClient';
import { seededRandom } from './types';
import { aiTurnDelay } from '../games/simpleAi';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(crypto, 'getRandomValues').mockImplementation((array: any) => { array[0] = 17; return array; });
  vi.spyOn(Math, 'random').mockImplementation(seededRandom(17));
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });

async function pendingComputer() {
  const client = new FourPlayerClient();
  const roomId = await client.createRoom('검수 플레이어', 'ko');
  const off = client.subscribeRoom(roomId, () => {});
  await client.selectGame('splendor');
  await client.sendAction(client.getSnapshot().view!.actions[0].action);
  expect(client.getSnapshot().view!.turn).toBe('p2');
  expect(vi.getTimerCount()).toBe(1);
  return { client, roomId, off };
}

describe('four-player solo integration', () => {
  it('schedules the actual first computer seat for a Minhwatu deal', async () => {
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array: any) => { array[0] = 0xc0000000; return array; });
    const client = new FourPlayerClient(), roomId = await client.createRoom('검수 플레이어', 'ko');
    const off = client.subscribeRoom(roomId, () => {});
    await client.selectGame('minhwatu');
    expect(client.getSnapshot().view?.turn).toBe('p4');
    expect(vi.getTimerCount()).toBe(1);
    const version = client.getSnapshot().version;
    await vi.advanceTimersByTimeAsync(aiTurnDelay('minhwatu'));
    expect(client.getSnapshot().version).toBe(version + 1);
    expect(client.getSnapshot().error).toBeNull();
    off();
  });
  for (const game of ['davinci', 'splendor', 'minhwatu', 'marble'] as const) it(`${game}: rotates through human and all computer seats to a legal final result`, async () => {
    const client = new FourPlayerClient(), engine = fourEngines[game]!;
    const roomId = await client.createRoom('검수 플레이어', 'ko');
    const off = client.subscribeRoom(roomId, () => {});
    await client.selectGame(game);
    for (let step = 0; step < 1600 && !client.getSnapshot().view?.result; step++) {
      const before = client.getSnapshot(), view = before.view!;
      expect(before.error).toBeNull();
      if (view.actions.length) {
        const action = engine.chooseAiAction(view, 'p1');
        expect(action).toBeTruthy();
        await client.sendAction(action!);
      } else {
        expect(vi.getTimerCount(), `${game} stopped at ${view.turn}/${view.phase}`).toBe(1);
        await vi.advanceTimersByTimeAsync(aiTurnDelay(game));
      }
      expect(client.getSnapshot().version).toBeGreaterThan(before.version);
    }
    expect(client.getSnapshot().error).toBeNull();
    expect(client.getSnapshot().view?.result).toBeTruthy();
    expect(vi.getTimerCount()).toBe(0);
    off();
  }, 30000);

  it('delays each computer action, pauses on last unsubscribe, and resumes with one timer', async () => {
    const { client, roomId, off } = await pendingComputer();
    const second = client.subscribeRoom(roomId, () => {}), version = client.getSnapshot().version;
    expect(vi.getTimerCount()).toBe(1);
    off(); expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(aiTurnDelay('splendor') - 1);
    expect(client.getSnapshot().version).toBe(version);
    second(); expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(client.getSnapshot().version).toBe(version);
    const resumed = client.subscribeRoom(roomId, () => {});
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(aiTurnDelay('splendor'));
    expect(client.getSnapshot().version).toBe(version + 1);
    expect(client.getSnapshot().view?.turn).toBe('p3');
    resumed(); expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels stale actions on switching, replaying, and closing', async () => {
    const { client, off } = await pendingComputer();
    await client.selectGame('minhwatu');
    expect(vi.getTimerCount()).toBe(0);
    const switched = structuredClone(client.getSnapshot());
    await vi.advanceTimersByTimeAsync(1000);
    expect(client.getSnapshot()).toEqual(switched);
    await client.sendAction(client.getSnapshot().view!.actions[0].action);
    expect(vi.getTimerCount()).toBe(1);
    await client.selectGame('minhwatu');
    expect(vi.getTimerCount()).toBe(0);
    expect(client.getSnapshot().view?.hand).toHaveLength(5);
    await client.sendAction(client.getSnapshot().view!.actions[0].action);
    expect(vi.getTimerCount()).toBe(1);
    client.closeRoom();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(client.getSnapshot()).toMatchObject({ roomId: null, view: null, gameId: null });
    off();
  });

  for (const game of ['minhwatu', 'marble'] as const) it(`${game}: waits for capture or dice motion instead of acting again at 700ms`, async () => {
    const client = new FourPlayerClient(), engine = fourEngines[game]!;
    const roomId = await client.createRoom('검수 플레이어', 'ko');
    const off = client.subscribeRoom(roomId, () => {});
    await client.selectGame(game);
    for (let step = 0; step < 12 && client.getSnapshot().view!.turn === 'p1'; step++) {
      const action = engine.chooseAiAction(client.getSnapshot().view!, 'p1', () => .3);
      expect(action).toBeTruthy();
      await client.sendAction(action!);
    }
    expect(client.getSnapshot().view!.turn).not.toBe('p1');
    expect(aiTurnDelay(game)).toBeGreaterThan(700);
    expect(vi.getTimerCount()).toBe(1);
    const version = client.getSnapshot().version;
    await vi.advanceTimersByTimeAsync(700);
    expect(client.getSnapshot().version).toBe(version);
    await vi.advanceTimersByTimeAsync(aiTurnDelay(game) - 700);
    expect(client.getSnapshot().version).toBe(version + 1);
    off();
  });

  it('rejects excluded games and unknown room subscriptions without altering the match', async () => {
    const { client, off } = await pendingComputer();
    const before = structuredClone(client.getSnapshot()), wrong = vi.fn();
    const unsubscribe = client.subscribeRoom('other-room', wrong);
    expect(wrong).not.toHaveBeenCalled();
    for (const game of ['jaipur', 'catchmind', 'rhythm', 'domino'] as const) await expect(client.selectGame(game)).rejects.toThrow('solo_game_unavailable');
    expect(client.getSnapshot()).toEqual(before);
    expect(vi.getTimerCount()).toBe(1);
    unsubscribe(); off();
  });
});
