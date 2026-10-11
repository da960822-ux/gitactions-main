export const reactionEmoji = {
  heart: '❤️',
  laugh: '😂',
  applause: '👏',
  wow: '😮',
  sad: '😢',
} as const;

export type ReactionId = keyof typeof reactionEmoji;

export function isReactionId(value: unknown): value is ReactionId {
  return typeof value === 'string' && Object.hasOwn(reactionEmoji, value);
}

export function reactionForText(value: string): ReactionId | null {
  const entry = Object.entries(reactionEmoji).find(([, emoji]) => emoji === value);
  return entry ? entry[0] as ReactionId : null;
}
