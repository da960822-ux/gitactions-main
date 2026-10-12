import approvedArt from '../../public/images/personalization/manifest.json';

/** Approved generated portraits are local assets; host overrides never enter room state. */
export type JokerPortraits = Partial<Record<'black' | 'white', string>>;

declare global {
  interface Window {
    __DOS_PRIVATE_GAME_ART__?: { davinciJokers?: JokerPortraits; splendorNobles?: Record<string, string> };
  }
}

export function getJokerPortraits(): JokerPortraits {
  return { ...approvedArt.davinciJokers, ...(typeof window === 'undefined' ? {} : window.__DOS_PRIVATE_GAME_ART__?.davinciJokers) };
}

export function getPrivateNoblePortrait(id: unknown): string | undefined {
  return typeof window === 'undefined' ? undefined : window.__DOS_PRIVATE_GAME_ART__?.splendorNobles?.[String(id)];
}
