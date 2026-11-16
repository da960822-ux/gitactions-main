import type { GameAction } from '../core/types';
export type MarbleCardOutcome = 'information' | 'pending-choice' | 'pending-payment' | 'paid' | 'applied' | 'no-effect';
export interface MarbleCardCauseState { phase: string; pendingCardDrawSequence?: number; resolvingCardDrawSequence?: number }
const pendingPhases = ['event-decision', 'train-decision', 'rent-decision', 'debt'];
export function beginCardResolution(before: MarbleCardCauseState, next: MarbleCardCauseState, action: GameAction) {
  const resolvesChoice = ['choose-event-city', 'choose-train', 'skip-train', 'pay-rent', 'use-rent-pass'].includes(action.type);
  const resolvesDebt = before.phase === 'debt' && ['borrow', 'sell-property', 'declare-bankruptcy'].includes(action.type);
  if (before.pendingCardDrawSequence !== undefined && (resolvesChoice || resolvesDebt)) next.resolvingCardDrawSequence = before.pendingCardDrawSequence;
}
export function finishCardResolution(state: MarbleCardCauseState) {
  if (pendingPhases.includes(state.phase) && state.resolvingCardDrawSequence !== undefined) state.pendingCardDrawSequence = state.resolvingCardDrawSequence;
  if (!pendingPhases.includes(state.phase)) delete state.pendingCardDrawSequence;
  delete state.resolvingCardDrawSequence;
}
export function cardEventCause(state: MarbleCardCauseState, sequence: number, type: string, moneyDelta?: Record<string, unknown>) {
  if (state.resolvingCardDrawSequence === undefined) return {};
  const cardPhase = sequence === state.resolvingCardDrawSequence ? 'draw' as const : 'resolution' as const;
  const cardOutcome: MarbleCardOutcome = cardPhase === 'draw' ? 'information' : type === 'crisis' ? 'pending-payment' : moneyDelta && Object.values(moneyDelta).some(value => typeof value === 'number' && value !== 0) ? 'paid' : type === 'monopoly-warning' ? 'information' : 'applied';
  return { cardDrawSequence: state.resolvingCardDrawSequence, cardPhase, cardOutcome };
}
