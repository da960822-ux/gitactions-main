import type { GameAction, GameEngine, PlayerId } from './types';
import { isReactionId, reactionEmoji, reactionForText } from './reactions';
export class ActionError extends Error { constructor(public code: string) { super(code); } }
export function executeAction(engine: GameEngine, state: any, player: PlayerId, action: GameAction) {
  if (!action || typeof action.type !== 'string' || action.type.length > 64 || JSON.stringify(action).length > 24000) throw new ActionError('invalid_action');
  if (engine.getResult(state)) throw new ActionError('game_finished');
  const error = engine.validateAction(state, player, action);
  if (error) throw new ActionError(error);
  const next = engine.applyAction(structuredClone(state), player, action);
  return {state:next, views:{p1:engine.getPlayerView(next,'p1'),p2:engine.getPlayerView(next,'p2')}};
}
export const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const TRANSLATION_BUDGET = 400_000;
export function textLength(text: string) { return Array.from(text).length; }
export function validChat(text: unknown): text is string { return typeof text === 'string' && text.trim().length > 0 && textLength(text) <= 500; }

export function chatMessageForGame(gameId: string | null, value: unknown) {
  if (!validChat(value)) throw new ActionError('chat_max_500');
  const text = value.trim();
  const reaction = reactionForText(text);
  if (reaction) return { text: reactionEmoji[reaction], status: 'original' as const };
  if (gameId !== 'catchmind') throw new ActionError('chat_not_allowed');
  return { text, status: 'pending' as const };
}

export function reactionMessageForId(value: unknown) {
  if (!isReactionId(value)) throw new ActionError('invalid_reaction');
  return { text: reactionEmoji[value], status: 'original' as const };
}
