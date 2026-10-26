export type ClassicOlympics = { tile: number; multiplier: number; host: string } | null;

export function classicOlympicsMultiplier(hostings: number) {
  return Math.min(5, Math.max(0, Math.floor(hostings)) + 2);
}

export function classicOlympicToll(olympics: ClassicOlympics | undefined, tile: number, toll: number) {
  return olympics?.tile === tile ? toll * olympics.multiplier : toll;
}
