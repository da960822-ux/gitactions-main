import type { AudioCue } from './audio';

/** Public counters only: identical audio for every possible hidden card identity. */
export function splendorOpponentCues(before: any, after: any, viewer: string): AudioCue[] {
  if (!before || !after || after.result) return [];
  const bonusesBefore = before.board?.ownedBonuses ?? {}, bonusesAfter = after.board?.ownedBonuses ?? {};
  const otherSeats = Object.keys(bonusesAfter).filter(seat => seat !== viewer);
  const bought = otherSeats.some(seat => Object.keys(bonusesAfter[seat] ?? {}).some(gem => Number(bonusesAfter[seat][gem] ?? 0) > Number(bonusesBefore[seat]?.[gem] ?? 0)));
  const reserved = after.board?.reservedCounts
    ? Object.keys(after.board.reservedCounts).some(seat => seat !== viewer && Number(after.board.reservedCounts[seat]) > Number(before.board?.reservedCounts?.[seat] ?? 0))
    : Number(after.board?.reservedOpponentCount ?? 0) > Number(before.board?.reservedOpponentCount ?? 0);
  if (bought) return ['buy'];
  if (reserved) return ['place'];
  if (before.turn === viewer) return [];
  const bankBefore = before.board?.bank ?? {}, bankAfter = after.board?.bank ?? {};
  const gained = Object.keys(bankAfter).some(gem => Number(bankAfter[gem]) < Number(bankBefore[gem]));
  const returned = Object.keys(bankAfter).some(gem => Number(bankAfter[gem]) > Number(bankBefore[gem]));
  return [...(gained ? ['select' as const] : []), ...(returned ? ['return-tokens' as const] : [])];
}

/** A legal take can return precisely the same gems: public net deltas then contain no flight. */
export function splendorZeroNetReturnCue(action: import('../core/types').GameAction): AudioCue | null {
  const payload = action.payload ?? {}, returned = payload.returnTokens;
  if (!returned || typeof returned !== 'object' || Array.isArray(returned)) return null;
  const gains: Record<string, number> = {};
  if (action.type === 'take' && Array.isArray(payload.gems)) {
    for (const gem of payload.gems) if (typeof gem === 'string') gains[gem] = (gains[gem] ?? 0) + 1;
  } else if (action.type === 'takeTwo' && typeof payload.gem === 'string') gains[payload.gem] = 2;
  else return null;
  const returns = returned as Record<string, unknown>;
  return Object.keys(gains).length > 0 && Object.keys({ ...gains, ...returns }).every(gem => (gains[gem] ?? 0) === (returns[gem] ?? 0)) ? 'return-tokens' : null;
}
