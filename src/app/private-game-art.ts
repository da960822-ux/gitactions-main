/** Personal image URLs are supplied by the private host at runtime, never by room state. */
export type JokerPortraits = Partial<Record<'black' | 'white', string>>;

declare global {
  interface Window {
    __DOS_PRIVATE_GAME_ART__?: { davinciJokers?: JokerPortraits; splendorNobles?: Record<string, string> };
  }
}

export function getPrivateJokerPortraits(): JokerPortraits {
  return typeof window === 'undefined' ? {} : window.__DOS_PRIVATE_GAME_ART__?.davinciJokers ?? {};
}

export function getPrivateNoblePortrait(id: unknown): string | undefined {
  return typeof window === 'undefined' ? undefined : window.__DOS_PRIVATE_GAME_ART__?.splendorNobles?.[String(id)];
}
