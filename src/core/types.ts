export type Language = 'ko' | 'es';
export type PlayerId = 'p1' | 'p2';
export type GameId = 'davinci' | 'catchmind' | 'domino' | 'jaipur' | 'splendor' | 'minhwatu' | 'marble' | 'rhythm';
export interface GameAction { type: string; payload?: Record<string, unknown> }
export interface GameResult { winner: PlayerId | 'draw'; reason: string; scores?: Record<PlayerId, number> }
export interface GameEngine<S = any> {
  id: GameId;
  createInitialState(seed: number): S;
  validateAction(state: S, player: PlayerId, action: GameAction): string | null;
  applyAction(state: S, player: PlayerId, action: GameAction): S;
  getPlayerView(state: S, player: PlayerId): any;
  getResult(state: S): GameResult | null;
}
export interface GameDescription { id: GameId; title: Record<Language, string>; subtitle: Record<Language, string>; rules: Record<Language, string[]>; icon: string; color: string; duration: string; }
export const otherPlayer = (p: PlayerId): PlayerId => p === 'p1' ? 'p2' : 'p1';
export function seededRandom(seed: number) { let n = seed >>> 0; return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function shuffle<T>(items: T[], random: () => number): T[] { const out = [...items]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }
