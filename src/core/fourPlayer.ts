import type { GameAction, GameId, Language } from './types';

export const fourSeats = ['p1', 'p2', 'p3', 'p4'] as const;
export type FourSeat = typeof fourSeats[number];
export type FourTeam = 'A' | 'B';
export const fourTeam = (seat: FourSeat): FourTeam => seat === 'p1' || seat === 'p3' ? 'A' : 'B';
export const nextFourSeat = (seat: FourSeat): FourSeat => fourSeats[(fourSeats.indexOf(seat) + 1) % 4];
export type Localized = Record<Language, string>;
export const localized = (ko: string, es: string): Localized => ({ ko, es });
export interface FourCard { id: string; title: Localized; detail?: Localized; image?: string; color?: string; hidden?: boolean }
export interface FourPanel { id: string; title: Localized; cards: FourCard[] }
export interface FourResult { winner: FourTeam | 'draw'; scores: Record<FourTeam, number>; reason: Localized }
export interface FourView {
  game: GameId; turn: FourSeat; phase: string;
  players: { id: FourSeat; score: number; count: number; eliminated?: boolean; detail?: Localized; tokens?: Record<string, number>; bonuses?: Record<string, number> }[];
  hand: FourCard[]; panels: FourPanel[];
  actions: { label: Localized; action: GameAction }[];
  result: FourResult | null;
  note?: Localized;
}
export interface FourEngine {
  id: GameId;
  createInitialState(seed: number): any;
  validateAction(state: any, player: FourSeat, action: GameAction): string | null;
  applyAction(state: any, player: FourSeat, action: GameAction): any;
  getPlayerView(state: any, player: FourSeat): FourView;
  chooseAiAction(view: FourView, player: FourSeat, random?: () => number, reserveOverride?: number): GameAction | null;
}
