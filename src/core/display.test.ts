import { describe, expect, it } from 'vitest';
import { canEnterPlayRoute, canPlayGameOnDisplay, canViewRoomOnDisplay } from './display';

describe('display policy', () => {
  it('lets mobile visitors reach the lobby and room invite before the game is known', () => {
    expect(canEnterPlayRoute(false, '/play')).toBe(true);
    expect(canEnterPlayRoute(false, '/room/abc123')).toBe(true);
    expect(canEnterPlayRoute(false, '/feedback')).toBe(false);
    expect(canEnterPlayRoute(false, '/room/abc123/settings')).toBe(false);
  });

  it('allows only Jaipur on mobile while retaining desktop access to every game', () => {
    expect(canPlayGameOnDisplay(false, 'jaipur')).toBe(true);
    expect(canPlayGameOnDisplay(false, 'splendor')).toBe(false);
    expect(canPlayGameOnDisplay(false, null)).toBe(false);
    expect(canPlayGameOnDisplay(true, 'splendor')).toBe(true);
  });

  it('allows mobile room voting before a game starts but blocks an active desktop game', () => {
    expect(canViewRoomOnDisplay(false, null)).toBe(true);
    expect(canViewRoomOnDisplay(false, 'jaipur')).toBe(true);
    expect(canViewRoomOnDisplay(false, 'splendor')).toBe(false);
    expect(canViewRoomOnDisplay(true, 'splendor')).toBe(true);
  });
});
