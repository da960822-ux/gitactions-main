type RecordValue = Record<string, any>;
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function orderDominoChain(history: RecordValue[], targetEnds: RecordValue | null) {
  if (!history.length) return [];
  if (history.slice(1).every(tile => tile.side === 'left' || tile.side === 'right')) {
    return history.slice(1).reduce<RecordValue[]>((chain, tile) => tile.side === 'left' ? [tile, ...chain] : [...chain, tile], [history[0]]);
  }
  let candidates = [{ tiles: [history[0]], left: number(history[0].a), right: number(history[0].b) }];
  for (const tile of history.slice(1)) {
    const next = new Map<string, typeof candidates[number]>();
    for (const candidate of candidates) {
      if (number(tile.b) === candidate.left) {
        const ordered = { tiles: [tile, ...candidate.tiles], left: number(tile.a), right: candidate.right };
        next.set(`${ordered.left}:${ordered.right}`, ordered);
      }
      if (number(tile.a) === candidate.right) {
        const ordered = { tiles: [...candidate.tiles, tile], left: candidate.left, right: number(tile.b) };
        next.set(`${ordered.left}:${ordered.right}`, ordered);
      }
    }
    if (!next.size) return history;
    candidates = [...next.values()];
  }
  const match = candidates.find(candidate => candidate.left === number(targetEnds?.left) && candidate.right === number(targetEnds?.right));
  return (match ?? candidates[0]).tiles;
}

