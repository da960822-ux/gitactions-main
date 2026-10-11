import { describe, expect, it } from 'vitest';
import { appendSplendorFlights, splendorMotionAllowed, splendorReserveGoldFlight } from './SplendorMotion';

describe('confirmed Splendor motion guard', () => {
  it('requires a new confirmed version on the active visible view', () => {
    expect(splendorMotionAllowed(12, 12, 11, false, false)).toBe(true);
    expect(splendorMotionAllowed(undefined, 12, 11, false, false)).toBe(false);
    expect(splendorMotionAllowed(11, 12, 10, false, false)).toBe(false);
    expect(splendorMotionAllowed(12, 12, 12, false, false)).toBe(false);
    expect(splendorMotionAllowed(11, 11, 12, false, false)).toBe(false);
    expect(splendorMotionAllowed(12, 12, 11, true, false)).toBe(false);
    expect(splendorMotionAllowed(12, 12, 11, false, true)).toBe(false);
  });
  it('keeps a purchased card in flight when the next legal noble choice arrives', () => {
    const card = { id: 'purchase-v12:card', kind: 'card' };
    const noble = { id: 'noble-v13:noble', kind: 'noble' };
    const current = [card];
    expect(appendSplendorFlights(current, [noble])).toEqual([card, noble]);
    expect(current).toEqual([card]);
    expect(appendSplendorFlights([card, noble], [noble])).toEqual([card, noble]);
  });
  it('shows the reserved gold even when it is returned immediately or alongside older gold', () => {
    expect(splendorReserveGoldFlight({ reserveGoldCount: 1, incomingCounts: { gold: 0 } })).toBe(1);
    expect(splendorReserveGoldFlight({ reserveGoldCount: 1, incomingCounts: { gold: 0, white: 1 } })).toBe(1);
    // A positive net gain is already owned by the incoming-token layer.
    expect(splendorReserveGoldFlight({ reserveGoldCount: 1, incomingCounts: { gold: 1 } })).toBe(0);
    expect(splendorReserveGoldFlight({ incomingCounts: { gold: 0 } })).toBe(0);
    expect(splendorReserveGoldFlight({ reserveGoldCount: -1 })).toBe(0);
    expect(splendorReserveGoldFlight({ reserveGoldCount: 0.5 })).toBe(0);
  });
});
