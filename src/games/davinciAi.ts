import type { GameAction, PlayerId } from '../core/types';

type Tile = { color: 'black' | 'white'; value: number | 'joker' | null; revealed: boolean };

// shortcut: joker placements are weighted uniformly; this models legal racks, not an opponent's personal habits.
export function davinciGuessProbabilities(hand: Tile[], tiles: Tile[], log: any[], player: PlayerId): Map<string, number> {
  const failures = new Map<number, Set<unknown>>();
  for (const event of log) {
    if (event.type === 'draw' && event.actor !== player && Number.isInteger(event.insertedIndex)) {
      // A hidden joker can be repositioned after the draw, so old indices are no longer reliable.
      failures.clear();
    }
    if (event.type === 'wrong-guess' && event.actor === player) {
      const values = failures.get(event.targetIndex) ?? new Set();
      values.add(event.guess); failures.set(event.targetIndex, values);
    }
  }
  const jokerPositions = (color: Tile['color']) => {
    const revealed = tiles.findIndex(t => t.color === color && t.value === 'joker');
    if (revealed >= 0) return [revealed];
    if (hand.some(t => t.color === color && t.value === 'joker')) return [-1];
    return [-1, ...tiles.flatMap((t, i) => !t.revealed && t.color === color && !failures.get(i)?.has('joker') ? [i] : [])];
  };
  const weights = new Map<string, number>(); let total = 0;
  for (const black of jokerPositions('black')) for (const white of jokerPositions('white')) {
    const options = tiles.map((tile, index) => {
      if (index === black || index === white) return [-1];
      if (tile.value === 'joker') return [];
      return Array.from({ length: 12 }, (_, value) => value).filter(value =>
        (!tile.revealed || tile.value === value) && !hand.some(t => t.color === tile.color && t.value === value) &&
        !failures.get(index)?.has(value)).map(value => value * 2 + (tile.color === 'white' ? 1 : 0));
    });
    const forward = Array.from({ length: tiles.length + 1 }, () => Array(25).fill(0) as number[]);
    const backward = Array.from({ length: tiles.length + 1 }, () => Array(25).fill(0) as number[]);
    forward[0][0] = 1; backward[tiles.length].fill(1);
    for (let i = 0; i < tiles.length; i++) for (let last = 0; last < 25; last++) for (const rank of options[i]) {
      if (rank === -1) forward[i + 1][last] += forward[i][last];
      else if (rank + 1 > last) forward[i + 1][rank + 1] += forward[i][last];
    }
    for (let i = tiles.length - 1; i >= 0; i--) for (let last = 0; last < 25; last++) for (const rank of options[i]) {
      if (rank === -1) backward[i][last] += backward[i + 1][last];
      else if (rank + 1 > last) backward[i][last] += backward[i + 1][rank + 1];
    }
    total += backward[0][0];
    for (let i = 0; i < tiles.length; i++) for (const rank of options[i]) {
      let weight = 0;
      for (let last = 0; last < 25; last++) if (rank === -1 || rank + 1 > last) weight += forward[i][last] * backward[i + 1][rank === -1 ? last : rank + 1];
      const key = `${i}:${rank === -1 ? 'joker' : Math.floor(rank / 2)}`;
      weights.set(key, (weights.get(key) ?? 0) + weight);
    }
  }
  if (total) for (const [key, value] of weights) weights.set(key, value / total);
  return weights;
}

export function chooseDavinciGuess(view: any, player: PlayerId, guesses: GameAction[], random: () => number): GameAction {
  const weights = davinciGuessProbabilities(view.hand, view.board.opponentTiles, view.board.actionLog, player);
  const probability = (a: GameAction) => weights.get(`${a.payload!.index}:${a.payload!.value}`) ?? 0;
  const best = Math.max(...guesses.map(probability));
  if (view.actions.some((option: any) => option.action.type === 'stop') && best < .6 && view.opponentCount > 1) return { type: 'stop' };
  const choices = guesses.filter(a => probability(a) === best);
  return choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
}
